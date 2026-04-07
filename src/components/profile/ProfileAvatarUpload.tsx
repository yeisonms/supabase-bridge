import { useState, useRef, useEffect } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProfileAvatarUploadProps {
  userId: string;
  avatarUrl: string | null;
  firstName: string | null;
  lastName: string | null;
  onAvatarUpdated: (newUrl: string) => void;
}

const MAX_SIZE = 2 * 1024 * 1024; // 2MB

const ProfileAvatarUpload = ({
  userId,
  avatarUrl,
  firstName,
  lastName,
  onAvatarUpdated,
}: ProfileAvatarUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (avatarUrl !== undefined) {
      setPreviewUrl(avatarUrl);
    }
  }, [avatarUrl]);

  const initials =
    ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase() || '?';

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 512;
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > MAX_DIM) { h = (h * MAX_DIM) / w; w = MAX_DIM; }
        } else {
          if (h > MAX_DIM) { w = (w * MAX_DIM) / h; h = MAX_DIM; }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('Compression failed'))),
          'image/jpeg',
          0.8
        );
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const deletePreviousAvatar = async () => {
    try {
      const { data } = await supabase.storage.from('avatars').list(userId);
      if (data && data.length > 0) {
        const paths = data.map((f) => `${userId}/${f.name}`);
        await supabase.storage.from('avatars').remove(paths);
      }
    } catch {
      // non-critical
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Solo se permiten imágenes', variant: 'destructive' });
      return;
    }

    if (file.size > MAX_SIZE * 2) {
      toast({ title: 'La imagen es demasiado grande (máx 4MB)', variant: 'destructive' });
      return;
    }

    setUploading(true);

    try {
      // Compress
      const compressed = await compressImage(file);

      if (compressed.size > MAX_SIZE) {
        toast({ title: 'La imagen supera los 2MB incluso comprimida', variant: 'destructive' });
        setUploading(false);
        return;
      }

      // Delete previous
      await deletePreviousAvatar();

      // Upload
      const filePath = `${userId}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, compressed, { contentType: 'image/jpeg', upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      // Update profile
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)
        .select('avatar_url')
        .single();

      if (updateError) throw updateError;
      if (!updateData) throw new Error('Error de base de datos: no se guardó la foto (Revisa Políticas RLS en la tabla perfiles).');

      setPreviewUrl(publicUrl);
      onAvatarUpdated(publicUrl);
      toast({ title: '¡Foto actualizada!' });
    } catch (err: any) {
      toast({ title: 'Error al subir la foto', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <Avatar className="h-28 w-28 border-4 border-primary/20 shadow-lg">
          <AvatarImage src={previewUrl || undefined} alt="Foto de perfil" />
          <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>

        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="absolute bottom-0 right-0 h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      <p className="text-xs text-muted-foreground text-center max-w-[250px]">
        Sube una foto clara de tu rostro. Será usada para validar tu entrada en los gimnasios.
      </p>
    </div>
  );
};

export default ProfileAvatarUpload;
