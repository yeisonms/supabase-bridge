import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, MapPin, Users, Loader2, Clock, Mail, Phone,
  Dumbbell, Calendar, ImageIcon, ShieldCheck, ShieldX, DollarSign, Save,
} from 'lucide-react';

const AdminGymDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkinCount, setCheckinCount] = useState(0);
  const [ratePerVisit, setRatePerVisit] = useState<string>('');
  const [savingRate, setSavingRate] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const [{ data: p }, { count }] = await Promise.all([
        supabase.from('partners').select('*').eq('id', id).single(),
        supabase
          .from('checkins')
          .select('*', { count: 'exact', head: true })
          .eq('partner_id', id),
      ]);
      setPartner(p);
      setCheckinCount(count || 0);
      setRatePerVisit(p?.rate_per_visit != null ? String(p.rate_per_visit) : '');
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="text-center py-20">
        <p className="font-semibold">Centro aliado no encontrado</p>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">Volver</Button>
      </div>
    );
  }

  const photos: string[] = partner.photos?.length ? partner.photos : partner.image_url ? [partner.image_url] : [];
  const categories: string[] = partner.categories?.length ? partner.categories : partner.category ? [partner.category] : [];
  const coverPhoto = photos[0];

  const handleSaveRate = async () => {
    setSavingRate(true);
    const value = ratePerVisit === '' ? null : Number(ratePerVisit);
    const { error } = await supabase
      .from('partners')
      .update({ rate_per_visit: value } as any)
      .eq('id', id);
    setSavingRate(false);
    if (error) {
      toast({ title: 'Error', description: 'No se pudo guardar la tarifa.', variant: 'destructive' });
    } else {
      toast({ title: 'Tarifa actualizada' });
    }
  };

  // Extract coordinates
  const loc = partner.location;
  let lat: number | null = null;
  let lng: number | null = null;
  if (loc && typeof loc === 'object' && loc.coordinates) {
    lng = loc.coordinates[0];
    lat = loc.coordinates[1];
  }

  const mapUrl = lat && lng
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=600x300&scale=2&markers=color:red%7C${lat},${lng}&key=${(window as any).__GOOGLE_MAPS_KEY || ''}`
    : null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate('/admin/partners')} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" /> Volver a Partners
      </Button>

      {/* ── Banner / Cover ── */}
      <div className="relative rounded-2xl overflow-hidden bg-secondary">
        {coverPhoto ? (
          <img src={coverPhoto} alt={partner.name} className="w-full h-56 md:h-72 object-cover" />
        ) : (
          <div className="w-full h-56 md:h-72 flex items-center justify-center">
            <Dumbbell className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}
        {/* Overlay info */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-6">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white drop-shadow">{partner.name}</h1>
              {partner.address && (
                <p className="text-sm text-white/80 mt-1 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {partner.address}
                </p>
              )}
            </div>
            <Badge variant={partner.is_active ? 'default' : 'destructive'} className="text-sm shrink-0">
              {partner.is_active ? (
                <><ShieldCheck className="h-3.5 w-3.5 mr-1" /> Activo</>
              ) : (
                <><ShieldX className="h-3.5 w-3.5 mr-1" /> Inactivo</>
              )}
            </Badge>
          </div>
        </div>
      </div>

      {/* ── Categories ── */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Badge key={cat} variant="secondary" className="text-xs">{cat}</Badge>
          ))}
        </div>
      )}

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Description & Operational */}
        <div className="space-y-6">
          {/* Description */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Descripción</h3>
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {partner.description || 'Sin descripción disponible.'}
              </p>
            </CardContent>
          </Card>

          {/* Operational info */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Información Operativa</h3>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Aforo Máximo:</span>
                  <span className="font-medium">{partner.daily_capacity_limit ?? 'Sin límite'}</span>
                </div>

                <div className="flex items-center gap-3">
                  <Dumbbell className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Plan Mínimo:</span>
                  <span className="font-medium">Nivel {partner.min_plan_level ?? 1}</span>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Total Check-ins:</span>
                  <span className="font-medium">{checkinCount}</span>
                </div>

                {partner.opening_hours && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Horarios:</span>
                    <span className="font-medium">{partner.opening_hours}</span>
                  </div>
                )}

                <Separator />

                {partner.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm">{partner.email}</span>
                  </div>
                )}

                {partner.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm">{partner.phone}</span>
                  </div>
                )}

                <Separator />

                <p className="text-xs text-muted-foreground">
                  Registrado el {new Date(partner.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Rate per visit – admin only */}
          <Card className="border-primary/30">
            <CardContent className="pt-6 space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <DollarSign className="h-4 w-4" /> Tarifa por Visita Acordada
              </h3>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">COP</span>
                  <Input
                    type="number"
                    min={0}
                    value={ratePerVisit}
                    onChange={(e) => setRatePerVisit(e.target.value)}
                    placeholder="Ej: 8000"
                    className="pl-12"
                  />
                </div>
                <Button size="sm" onClick={handleSaveRate} disabled={savingRate} className="gap-1.5">
                  {savingRate ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Guardar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Monto que se paga al centro aliado por cada visita validada. Solo visible para administradores.</p>
            </CardContent>
          </Card>
        </div>

        {/* Right: Gallery & Map */}
        <div className="space-y-6">
          {/* Photo gallery */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Galería</h3>
                <span className="text-xs text-muted-foreground">{photos.length} foto(s)</span>
              </div>

              {photos.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <ImageIcon className="h-10 w-10 mb-2" />
                  <p className="text-sm">Sin fotos subidas</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {photos.map((url, i) => (
                    <div key={i} className="rounded-xl overflow-hidden aspect-square bg-muted">
                      <img
                        src={url}
                        alt={`Foto ${i + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Map */}
          {partner.address && (
            <Card>
              <CardContent className="pt-6 space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Ubicación</h3>
                {lat && lng ? (
                  <div className="rounded-xl overflow-hidden border">
                    <iframe
                      title="Ubicación del centro aliado"
                      width="100%"
                      height="250"
                      style={{ border: 0 }}
                      loading="lazy"
                      src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg&q=${lat},${lng}&zoom=15`}
                    />
                  </div>
                ) : (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(partner.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Ver en Google Maps ↗
                  </a>
                )}
                <p className="text-sm text-foreground/80 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  {partner.address}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminGymDetail;
