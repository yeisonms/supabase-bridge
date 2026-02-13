import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Building2, MapPin, ImagePlus, X } from 'lucide-react';

const CATEGORIES = ['Gym', 'Crossfit', 'Yoga', 'Pilates', 'Boxing', 'MMA', 'Funcional', 'Otro'];

const PartnerRegister = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const [gymName, setGymName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_PHOTOS = 5;

  const handleAddPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const allowed = files
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, MAX_PHOTOS - photos.length);

    if (allowed.length === 0) return;

    setPhotos((prev) => [...prev, ...allowed]);
    allowed.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreviews((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (partnerId: string): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of photos) {
      const ext = file.name.split('.').pop();
      const path = `${partnerId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('gym-photos').upload(path, file, { upsert: false });
      if (!error) {
        const { data: urlData } = supabase.storage.from('gym-photos').getPublicUrl(path);
        urls.push(urlData.publicUrl);
      }
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({ title: 'Error', description: 'Debes iniciar sesión primero.', variant: 'destructive' });
      navigate('/register?role=partner');
      return;
    }

    if (!gymName.trim() || !address.trim() || !category || !lat || !lng || !email.trim() || !phone.trim()) {
      toast({ title: 'Campos requeridos', description: 'Completa todos los campos obligatorios.', variant: 'destructive' });
      return;
    }

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    const parsedPrice = parseFloat(price) || 0;

    if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      toast({ title: 'Latitud inválida', description: 'Debe ser un número entre -90 y 90.', variant: 'destructive' });
      return;
    }
    if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
      toast({ title: 'Longitud inválida', description: 'Debe ser un número entre -180 y 180.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);

    const { data: rpcResult, error } = await supabase.rpc('register_new_partner', {
      gym_name: gymName.trim(),
      gym_address: address.trim(),
      gym_category: category,
      gym_lat: parsedLat,
      gym_long: parsedLng,
      gym_price: parsedPrice,
    });

    setSubmitting(false);

    if (error) {
      console.error('[PartnerRegister] RPC error:', error.message);
      toast({
        title: 'Error al registrar',
        description: 'No se pudo registrar el gimnasio. Intenta de nuevo.',
        variant: 'destructive',
      });
      return;
    }

    const newPartnerId = rpcResult?.partner_id;
    toast({ title: 'Solicitud enviada con éxito', description: 'Un administrador revisará tu perfil en breve.' });

    // Upload photos in background — best effort
    if (newPartnerId && (photos.length > 0 || description.trim() || email.trim() || phone.trim())) {
      try {
        const urls = await uploadPhotos(newPartnerId);
        const updateData: Record<string, unknown> = {};
        if (urls.length > 0) updateData.photos = urls;
        if (description.trim()) updateData.description = description.trim();
        if (email.trim()) updateData.email = email.trim();
        if (phone.trim()) updateData.phone = phone.trim();
        if (Object.keys(updateData).length > 0) {
          await supabase.from('partners').update(updateData).eq('id', newPartnerId);
        }
      } catch (uploadErr) {
        console.warn('[PartnerRegister] Photo upload failed:', uploadErr);
      }
    }

    // Force reload to refresh profile role from server
    setTimeout(() => {
      navigate('/partner', { replace: true });
      window.location.reload();
    }, 500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <p className="text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-secondary gap-4">
        <p className="text-lg font-medium">Debes crear una cuenta primero</p>
        <Link to="/register?role=partner">
          <Button>Crear Cuenta</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-secondary">
      <Link to="/" className="text-3xl font-black mb-6">
        <span className="text-gradient">Red</span>Fit
      </Link>

      <div className="w-full max-w-md bg-card rounded-2xl shadow-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Registrar mi Gimnasio</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gymName">Nombre del Gimnasio *</Label>
            <Input
              id="gymName"
              value={gymName}
              onChange={(e) => setGymName(e.target.value)}
              placeholder="Ej: PowerFit Centro"
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contacto@tugimnasio.com"
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Número de Teléfono *</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ej: +52 55 1234 5678"
              maxLength={20}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección *</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ej: Av. Reforma 123, CDMX"
              maxLength={200}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción del Centro Deportivo</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe las actividades, servicios y lo que hace especial a tu gimnasio..."
              maxLength={500}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoría *</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger id="category">
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Precio Mensual Aproximado (MXN)</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Ej: 500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <Label>Ubicación *</Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="lat" className="text-xs text-muted-foreground">Latitud</Label>
                <Input
                  id="lat"
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="19.4326"
                  required
                />
              </div>
              <div>
                <Label htmlFor="lng" className="text-xs text-muted-foreground">Longitud</Label>
                <Input
                  id="lng"
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="-99.1332"
                  required
                />
              </div>
            </div>
          </div>

          {/* Fotos del gimnasio */}
          <div className="space-y-2">
            <Label>Fotos del Gimnasio (máx. {MAX_PHOTOS})</Label>
            <div className="flex flex-wrap gap-3">
              {photoPreviews.map((src, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                  <img src={src} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-[10px]">Añadir</span>
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleAddPhotos}
            />
          </div>

          <Button
            type="submit"
            className="w-full mt-2"
            disabled={submitting}
          >
            {submitting ? 'Registrando…' : 'Registrar Gimnasio'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default PartnerRegister;
