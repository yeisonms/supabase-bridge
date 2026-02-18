import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, Trash2, Save, ImagePlus, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import LocationPicker from '@/components/LocationPicker';
import MultiCategorySelect from '@/components/MultiCategorySelect';

type PartnerData = {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
  phone: string | null;
  email: string | null;
  opening_hours: string | null;
  photos: string[] | null;
  location: any;
};

const PartnerSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [partner, setPartner] = useState<PartnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState<string | null>(null);

  // Form fields
  const [description, setDescription] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [lat, setLat] = useState(4.5709);
  const [lng, setLng] = useState(-74.2973);
  const [maxCapacity, setMaxCapacity] = useState<number>(20);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('partners')
        .select('id, name, address, description, phone, email, opening_hours, photos, location, daily_capacity_limit, categories, category')
        .eq('admin_user_id', user.id)
        .single();

      if (error || !data) {
        console.error('[PartnerSettings] load error:', error);
        setLoading(false);
        return;
      }
      setPartner(data as PartnerData);
      setDescription(data.description || '');
      setOpeningHours((data as any).opening_hours || '');
      setPhone((data as any).phone || '');
      setEmail((data as any).email || '');
      setMaxCapacity((data as any).daily_capacity_limit || 20);
      // Load categories: prefer categories array, fallback to single category
      const cats = (data as any).categories;
      if (Array.isArray(cats) && cats.length > 0) {
        setCategories(cats);
      } else if ((data as any).category) {
        setCategories([(data as any).category]);
      }
      // Extract coordinates from PostGIS point
      const loc = (data as any).location;
      if (loc && typeof loc === 'object' && loc.coordinates) {
        setLng(loc.coordinates[0]);
        setLat(loc.coordinates[1]);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const handleSaveInfo = async () => {
    if (!partner) return;
    setSaving(true);
    const capacityValue = Math.max(1, Math.round(maxCapacity));
    const locationPoint = `SRID=4326;POINT(${lng} ${lat})`;
    const { error } = await supabase
      .from('partners')
      .update({ description, opening_hours: openingHours, phone, email, location: locationPoint, daily_capacity_limit: capacityValue, categories, category: categories[0] || null } as any)
      .eq('id', partner.id);

    setSaving(false);
    if (error) {
      toast({ title: 'Error', description: 'No se pudo guardar los cambios.', variant: 'destructive' });
    } else {
      toast({ title: 'Guardado', description: 'Información actualizada correctamente.' });
    }
  };

  const handleUploadPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!partner || !e.target.files?.length) return;
    setUploading(true);

    const files = Array.from(e.target.files);
    const newUrls: string[] = [];

    for (const file of files) {
      const ext = file.name.split('.').pop();
      const filePath = `${partner.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('gym-photos')
        .upload(filePath, file, { upsert: false });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from('gym-photos')
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        newUrls.push(urlData.publicUrl);
      }
    }

    if (newUrls.length > 0) {
      const currentPhotos = partner.photos || [];
      const updatedPhotos = [...currentPhotos, ...newUrls];

      const { error } = await supabase
        .from('partners')
        .update({ photos: updatedPhotos })
        .eq('id', partner.id);

      if (!error) {
        setPartner({ ...partner, photos: updatedPhotos });
        toast({ title: 'Galería actualizada', description: `${newUrls.length} foto(s) subida(s).` });
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeletePhoto = async (photoUrl: string) => {
    if (!partner) return;
    setDeletingPhoto(photoUrl);

    // Extract path from URL
    const bucketBase = '/storage/v1/object/public/gym-photos/';
    const idx = photoUrl.indexOf(bucketBase);
    if (idx !== -1) {
      const filePath = decodeURIComponent(photoUrl.substring(idx + bucketBase.length));
      await supabase.storage.from('gym-photos').remove([filePath]);
    }

    const updatedPhotos = (partner.photos || []).filter((p) => p !== photoUrl);
    const { error } = await supabase
      .from('partners')
      .update({ photos: updatedPhotos })
      .eq('id', partner.id);

    if (!error) {
      setPartner({ ...partner, photos: updatedPhotos });
      toast({ title: 'Foto eliminada' });
    } else {
      toast({ title: 'Error', description: 'No se pudo eliminar la foto.', variant: 'destructive' });
    }
    setDeletingPhoto(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="px-4 pt-12 text-center">
        <p className="font-semibold">No tienes un gimnasio asignado.</p>
      </div>
    );
  }

  const photos = partner.photos || [];

  return (
    <div className="px-4 pt-6 pb-12 max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link to="/partner" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Volver al panel
        </Link>
        <h1 className="text-2xl font-black">{partner.name}</h1>
        <p className="text-muted-foreground text-sm">{partner.address || 'Sin dirección'}</p>
      </div>

      {/* Photo Gallery Management */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Galería de Fotos</h2>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Subir Fotos
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUploadPhotos}
          />
        </div>

        {photos.length === 0 ? (
          <div
            className="border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center py-16 text-muted-foreground cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="h-10 w-10 mb-3" />
            <p className="text-sm font-medium">No hay fotos aún</p>
            <p className="text-xs">Haz clic para subir imágenes</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map((url) => (
              <div key={url} className="relative group rounded-xl overflow-hidden aspect-square bg-muted">
                <img
                  src={url}
                  alt="Foto del gimnasio"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <Button
                    variant="destructive"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-9 w-9 rounded-full"
                    onClick={() => handleDeletePhoto(url)}
                    disabled={deletingPhoto === url}
                  >
                    {deletingPhoto === url ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}

            {/* Add more photos card */}
            <div
              className="rounded-xl border-2 border-dashed border-border aspect-square flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="h-6 w-6 mb-1" />
              <p className="text-xs">Agregar</p>
            </div>
          </div>
        )}
      </section>

      {/* Business Info */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold">Información del Negocio</h2>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Descripción</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe tu gimnasio, servicios, ambiente..."
              rows={4}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Horarios</label>
            <Input
              value={openingHours}
              onChange={(e) => setOpeningHours(e.target.value)}
              placeholder="Ej: Lun-Vie 5am-10pm, Sáb 7am-2pm"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Teléfono</label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ej: +57 300 123 4567"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Email de contacto</label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contacto@migym.com"
              type="email"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Categorías</label>
            <MultiCategorySelect value={categories} onChange={setCategories} />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Aforo Máximo por Día</label>
            <Input
              type="number"
              min={1}
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(Number(e.target.value))}
              placeholder="Ej: 30"
            />
            <p className="text-xs text-muted-foreground mt-1">Número máximo de personas que pueden reservar por día.</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Ubicación en el Mapa</label>
            <LocationPicker
              lat={lat}
              lng={lng}
              onChange={(newLat, newLng) => {
                setLat(newLat);
                setLng(newLng);
              }}
            />
          </div>
        </div>

        <Button
          variant="hero"
          className="w-full rounded-full gap-2"
          onClick={handleSaveInfo}
          disabled={saving}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar Cambios
        </Button>
      </section>
    </div>
  );
};

export default PartnerSettings;
