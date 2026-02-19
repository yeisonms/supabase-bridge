import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, MapPin, Users, Loader2, CheckCircle, XCircle,
  Dumbbell, Mail, Phone, Lock, ArrowUpCircle, Ticket,
  ChevronDown, Globe, Copy, Clock, Camera,
} from 'lucide-react';
import PhotoGallery from '@/components/gym/PhotoGallery';
import FavoriteButton from '@/components/FavoriteButton';
import ReviewSection from '@/components/gym/ReviewSection';
import type { Partner } from '@/types/database';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/* ─── Accordion helper ─── */
const InfoAccordion = ({ title, subtitle, children, defaultOpen = false }: {
  title: string; subtitle?: string; children: React.ReactNode; defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b last:border-b-0">
      <button
        className="w-full flex items-center justify-between py-4 text-left"
        onClick={() => setOpen(!open)}
      >
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {subtitle && !open && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <ChevronDown className={cn('h-5 w-5 text-primary transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
};

/* ─── Main Component ─── */
const GymDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [todayCount, setTodayCount] = useState(0);
  const [checkingIn, setCheckingIn] = useState(false);

  // Fetch user subscription + avatar
  const { data: userSub } = useQuery({
    queryKey: ['user-sub-gym', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('current_plan_id, subscription_status, avatar_url')
        .eq('id', user!.id)
        .single();
      return data;
    },
  });

  const { data: userPlan } = useQuery({
    queryKey: ['user-plan-gym', userSub?.current_plan_id],
    enabled: !!userSub?.current_plan_id,
    queryFn: async () => {
      const { data } = await supabase
        .from('plans')
        .select('access_level, name')
        .eq('id', userSub!.current_plan_id)
        .single();
      return data;
    },
  });

  const isActive = userSub?.subscription_status === 'active';
  const userAccessLevel = isActive ? (userPlan?.access_level ?? 0) : 0;
  const hasAvatar = !!(userSub?.avatar_url && userSub.avatar_url.trim() !== '');

  // Fetch required plan name for this gym
  const { data: requiredPlan } = useQuery({
    queryKey: ['required-plan', partner?.min_plan_level],
    enabled: partner?.min_plan_level != null,
    queryFn: async () => {
      const { data } = await supabase
        .from('plans')
        .select('name, price')
        .eq('access_level', partner!.min_plan_level!)
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  // Checkin status query (invalidatable from Reservations page)
  const { data: checkinStatus } = useQuery({
    queryKey: ['checkin-status', id, user?.id],
    enabled: !!id && !!user?.id,
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const [{ data: existing }, { data: dailyCheckins }] = await Promise.all([
        supabase
          .from('checkins')
          .select('id')
          .eq('partner_id', id!)
          .eq('user_id', user!.id)
          .eq('checkin_date', today)
          .in('status', ['reserved', 'confirmed']),
        supabase
          .from('checkins')
          .select('id')
          .eq('user_id', user!.id)
          .eq('checkin_date', today)
          .in('status', ['reserved', 'confirmed']),
      ]);
      return {
        checkedIn: (existing?.length || 0) > 0,
        dailyPassUsed: (dailyCheckins?.length || 0) > 0 && (existing?.length || 0) === 0,
      };
    },
  });

  const checkedIn = checkinStatus?.checkedIn ?? false;
  const dailyPassUsed = checkinStatus?.dailyPassUsed ?? false;

  useEffect(() => {
    if (!id) return;
    const today = new Date().toISOString().split('T')[0];
    const load = async () => {
      const [{ data: p }, { count }] = await Promise.all([
        supabase.from('partners').select('*').eq('id', id).single(),
        supabase
          .from('checkins')
          .select('*', { count: 'exact', head: true })
          .eq('partner_id', id)
          .eq('checkin_date', today),
      ]);
      setPartner(p as Partner);
      setTodayCount(count || 0);
      setLoading(false);
    };
    load();
  }, [id, user]);

  const photos = partner?.photos?.length ? partner.photos : partner?.image_url ? [partner.image_url] : [];
  const hasPhotos = photos.length > 0;

  const isFull = partner?.daily_capacity_limit
    ? todayCount >= partner.daily_capacity_limit
    : false;

  const minPlanLevel = partner?.min_plan_level ?? 1;
  const canAccess = isActive && userAccessLevel >= minPlanLevel;
  const needsUpgrade = isActive && userAccessLevel < minPlanLevel;

  const handleReserve = async () => {
    if (!user || !id) return;
    if (!isActive) { toast.error('Necesitas un plan activo para entrenar'); navigate('/plans'); return; }
    if (needsUpgrade) { toast.info('Necesitas un plan superior para este gimnasio'); navigate('/plans'); return; }

    setCheckingIn(true);
    try {
      const { data, error } = await supabase.rpc('reserve_spot', { p_partner_id: id });
      if (error) {
        if (error.code === '23505') {
          toast.error('Solo se permite una reserva por día.');
        } else {
          toast.error(error.message || 'No se pudo reservar. Intenta nuevamente.');
        }
        queryClient.invalidateQueries({ queryKey: ['checkin-status'] });
      } else {
        const result = data as any;
        if (result?.success === false) {
          toast.error(result?.message || 'No se pudo reservar.');
        } else {
          setTodayCount((c) => c + 1);
          toast.success(result?.message || '¡Reserva exitosa!');
          queryClient.invalidateQueries({ queryKey: ['checkin-status'] });
          queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
        }
      }
    } catch {
      toast.error('Error inesperado al reservar.');
    }
    setCheckingIn(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="px-4 pt-12 text-center">
        <p className="text-lg font-semibold">Gimnasio no encontrado</p>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">Volver</Button>
      </div>
    );
  }

  /* ─── Plan Card (shown inside photo grid) ─── */
  const planCardContent = (
    <div className="h-full bg-primary text-primary-foreground rounded-xl p-5 flex flex-col justify-between">
      <div>
        <p className="text-xs font-medium opacity-80 uppercase tracking-wide">A partir del plan</p>
        <p className="text-2xl font-black mt-1">{requiredPlan?.name || `Nivel ${minPlanLevel}`}</p>
        {requiredPlan?.price != null && (
          <p className="text-sm mt-2 opacity-90">
            Disfruta de esta y de más opciones por tan solo
            <br />
            <span className="font-bold text-lg">${requiredPlan.price} / mes</span>
          </p>
        )}
      </div>
      <Button
        variant="secondary"
        size="sm"
        className="mt-4 rounded-full font-semibold w-fit"
        onClick={() => {
          if (!isActive) navigate('/plans');
          else if (needsUpgrade) navigate('/plans');
          else toast.success('¡Ya tienes acceso!');
        }}
      >
        {canAccess ? '✅ Tienes acceso' : needsUpgrade ? 'Mejorar Plan' : 'Comprueba si tienes acceso'}
      </Button>
    </div>
  );

  /* ─── Checkin button ─── */
  const renderCheckinButton = () => {
    if (checkedIn) {
      return (
        <div className="space-y-3">
          <Button disabled className="w-full rounded-full py-6 bg-emerald-600/90 text-primary-foreground" size="lg">
            <CheckCircle className="h-5 w-5 mr-2" /> Reservado ✅
          </Button>
          <Button variant="outline" size="lg" className="w-full rounded-full py-6" onClick={() => navigate('/app/pass')}>
            <Ticket className="h-5 w-5 mr-2" /> Ver Mi Pase (QR)
          </Button>
        </div>
      );
    }
    if (!isActive) {
      return (
        <Button variant="secondary" size="lg" className="w-full rounded-full py-6" onClick={() => { toast.error('Necesitas un plan activo'); navigate('/plans'); }}>
          <Lock className="h-5 w-5 mr-2" /> Adquirir Plan
        </Button>
      );
    }
    if (needsUpgrade) {
      return (
        <Button variant="secondary" size="lg" className="w-full rounded-full py-6" onClick={() => navigate('/plans')}>
          <ArrowUpCircle className="h-5 w-5 mr-2" /> Mejorar Plan
        </Button>
      );
    }
    if (dailyPassUsed) {
      return (
        <div className="space-y-3">
          <Button disabled variant="secondary" className="w-full rounded-full py-6" size="lg">
            <XCircle className="h-5 w-5 mr-2" /> Pase Diario Utilizado
          </Button>
          <div className="rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 p-3">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              Ya tienes una reserva activa o has utilizado tu pase diario hoy. Vuelve mañana para seguir entrenando. 💪
            </p>
          </div>
        </div>
      );
    }
    if (isFull) {
      return (
        <Button disabled variant="secondary" className="w-full rounded-full py-6" size="lg">
          <XCircle className="h-5 w-5 mr-2" /> Cupo agotado
        </Button>
      );
    }
    if (!hasAvatar) {
      return (
        <div className="space-y-2">
          <Button disabled variant="secondary" size="lg" className="w-full rounded-full py-6 opacity-60">
            <Camera className="h-5 w-5 mr-2" /> Falta Foto de Perfil
          </Button>
          <p className="text-sm text-destructive text-center">
            Debes subir una foto de perfil para poder reservar.{' '}
            <Link to="/app/profile" className="underline font-semibold text-primary">
              Subir foto ahora
            </Link>
          </p>
        </div>
      );
    }
    return (
      <Button variant="hero" size="lg" className="w-full rounded-full py-6" onClick={handleReserve} disabled={checkingIn}>
        {checkingIn ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
        Reservar Cupo
      </Button>
    );
  };

  const copyAddress = () => {
    if (partner.address) {
      navigator.clipboard.writeText(partner.address);
      toast.success('Dirección copiada');
    }
  };

  return (
    <div className="pb-24 max-w-5xl mx-auto">
      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-3">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-foreground text-background rounded-full text-sm font-medium hover:opacity-90 transition-opacity mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black text-foreground">{partner.name}</h1>
          <FavoriteButton partnerId={partner.id} size={24} className="ml-2" />
        </div>

        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {((partner as any).categories?.length ? (partner as any).categories : partner.category ? [partner.category] : []).map((cat: string) => (
            <span key={cat} className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
              {cat}
            </span>
          ))}
          {needsUpgrade && <Badge variant="secondary" className="text-xs">Plan Superior</Badge>}
          {!isActive && (
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <Lock className="h-3 w-3" /> Sin Plan
            </Badge>
          )}
        </div>
      </div>

      {/* ── Photo Grid ── */}
      <div className="px-4">
        {hasPhotos ? (
          <PhotoGallery photos={photos} name={partner.name} planCard={planCardContent} />
        ) : (
          <div className="w-full h-64 bg-secondary rounded-xl flex items-center justify-center">
            <Dumbbell className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}

        {/* Mobile plan card */}
        <div className="md:hidden mt-3">{planCardContent}</div>
      </div>

      {/* ── Content: Two columns ── */}
      <div className="px-4 mt-6 grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-8">
        {/* Left column */}
        <div>
          {/* About */}
          <InfoAccordion
            title={`Acerca de ${partner.name}`}
            subtitle={partner.description ? partner.description.substring(0, 80) + '...' : 'Información del centro'}
            defaultOpen
          >
            <p className="text-sm text-foreground/80 leading-relaxed">
              {partner.description || 'Sin descripción disponible.'}
            </p>
          </InfoAccordion>

          {/* Capacity */}
          <InfoAccordion
            title="Capacidad"
            subtitle={`Hoy: ${todayCount}${partner.daily_capacity_limit ? ` / ${partner.daily_capacity_limit}` : ''}`}
          >
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Hoy: {todayCount}
                {partner.daily_capacity_limit ? ` / ${partner.daily_capacity_limit}` : ''}
              </span>
              {isFull && (
                <span className="ml-auto text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                  Agotado
                </span>
              )}
            </div>
          </InfoAccordion>

          {/* Horario */}
          {(partner as any).opening_hours && (
            <InfoAccordion
              title="Horario"
              subtitle={(partner as any).opening_hours}
            >
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground/80">{(partner as any).opening_hours}</span>
              </div>
            </InfoAccordion>
          )}

          {/* Checkin button */}
          <div className="mt-6">
            {renderCheckinButton()}
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
              Recuerda: RedFit no se hace responsable por lesiones ocurridas durante la práctica. Al reservar, aceptas seguir las normas de seguridad de <span className="font-semibold text-foreground">{partner.name}</span>.{' '}
              <Link to="/legal" target="_blank" className="text-primary hover:underline">Ver términos</Link>
            </p>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Activities / Categories */}
          {((partner as any).categories?.length || partner.category) && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Actividades</h3>
              <div className="flex flex-wrap gap-2">
                {((partner as any).categories?.length ? (partner as any).categories : [partner.category]).map((cat: string) => (
                  <span key={cat} className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary bg-primary/5 font-medium">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Contact info */}
          {((partner as any).email || (partner as any).phone) && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Información de contacto</h3>
              <div className="space-y-2">
                {(partner as any).email && (
                  <a href={`mailto:${(partner as any).email}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <Globe className="h-4 w-4" />
                    {(partner as any).email}
                  </a>
                )}
                {(partner as any).phone && (
                  <a href={`tel:${(partner as any).phone}`} className="flex items-center gap-2 text-sm text-foreground/80">
                    <Phone className="h-4 w-4" />
                    {(partner as any).phone}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Address / Map link */}
          {partner.address && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Descubre cómo llegar</h3>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-foreground/80">{partner.address}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(partner.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Abrir en Google Maps ↗
                    </a>
                    <button onClick={copyAddress} className="text-muted-foreground hover:text-foreground transition-colors">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="px-4 mt-4">
        <ReviewSection
          partnerId={partner.id}
          partnerRating={(partner as any).rating ?? 0}
          partnerReviewCount={(partner as any).review_count ?? 0}
        />
      </div>
    </div>
  );
};

export default GymDetail;
