import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Users, Loader2, CheckCircle, XCircle, ChevronLeft, ChevronRight, Dumbbell, Mail, Phone, Lock, ArrowUpCircle, Ticket } from 'lucide-react';
import type { Partner } from '@/types/database';
import { toast } from 'sonner';

const GymDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [todayCount, setTodayCount] = useState(0);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState(0);

  // Fetch user subscription
  const { data: userSub } = useQuery({
    queryKey: ['user-sub-gym', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('current_plan_id, subscription_status')
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
        .select('access_level')
        .eq('id', userSub!.current_plan_id)
        .single();
      return data;
    },
  });

  const isActive = userSub?.subscription_status === 'active';
  const userAccessLevel = isActive ? (userPlan?.access_level ?? 0) : 0;

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const [{ data: p }, { count }, { data: existing }] = await Promise.all([
        supabase.from('partners').select('*').eq('id', id).single(),
        supabase
          .from('checkins')
          .select('*', { count: 'exact', head: true })
          .eq('partner_id', id)
          .eq('checkin_date', new Date().toISOString().split('T')[0]),
        supabase
          .from('checkins')
          .select('id')
          .eq('partner_id', id)
          .eq('user_id', user?.id || '')
          .eq('checkin_date', new Date().toISOString().split('T')[0]),
      ]);
      setPartner(p as Partner);
      setTodayCount(count || 0);
      setCheckedIn((existing?.length || 0) > 0);
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

    if (!isActive) {
      toast.error('Necesitas un plan activo para entrenar');
      navigate('/plans');
      return;
    }

    if (needsUpgrade) {
      toast.info('Necesitas un plan superior para este gimnasio');
      navigate('/plans');
      return;
    }

    setCheckingIn(true);
    const { data, error } = await supabase.rpc('reserve_spot', {
      p_partner_id: id,
    });

    if (error) {
      toast.error(error.message || 'No se pudo reservar. Intenta nuevamente.');
    } else {
      const result = data as any;
      if (result?.success === false) {
        toast.error(result?.message || 'No se pudo reservar.');
      } else {
        setCheckedIn(true);
        setTodayCount((c) => c + 1);
        toast.success(result?.message || '¡Reserva exitosa!');
      }
    }
    setCheckingIn(false);
  };

  const nextPhoto = () => setCurrentPhoto((c) => (c + 1) % photos.length);
  const prevPhoto = () => setCurrentPhoto((c) => (c - 1 + photos.length) % photos.length);

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
        <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">
          Volver
        </Button>
      </div>
    );
  }

  const renderCheckinButton = () => {
    if (checkedIn) {
      return (
        <div className="space-y-3">
          <Button disabled className="w-full rounded-full py-6 bg-emerald-600/90 text-primary-foreground" size="lg">
            <CheckCircle className="h-5 w-5 mr-2" />
            Reservado ✅
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full rounded-full py-6"
            onClick={() => navigate('/app/pass')}
          >
            <Ticket className="h-5 w-5 mr-2" />
            Ver Mi Pase (QR)
          </Button>
        </div>
      );
    }

    if (!isActive) {
      return (
        <Button
          variant="secondary"
          size="lg"
          className="w-full rounded-full py-6"
          onClick={() => {
            toast.error('Necesitas un plan activo para entrenar');
            navigate('/plans');
          }}
        >
          <Lock className="h-5 w-5 mr-2" />
          Adquirir Plan
        </Button>
      );
    }

    if (needsUpgrade) {
      return (
        <Button
          variant="secondary"
          size="lg"
          className="w-full rounded-full py-6"
          onClick={() => navigate('/plans')}
        >
          <ArrowUpCircle className="h-5 w-5 mr-2" />
          Mejorar Plan
        </Button>
      );
    }

    if (isFull) {
      return (
        <Button disabled variant="secondary" className="w-full rounded-full py-6" size="lg">
          <XCircle className="h-5 w-5 mr-2" />
          Cupo agotado
        </Button>
      );
    }

    return (
      <Button
        variant="hero"
        size="lg"
        className="w-full rounded-full py-6"
        onClick={handleReserve}
        disabled={checkingIn}
      >
        {checkingIn ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
        Reservar Cupo
      </Button>
    );
  };

  return (
    <div className="pb-24">
      {/* Photo gallery */}
      <div className="relative h-64 sm:h-72">
        {hasPhotos ? (
          <>
            <img
              src={photos[currentPhoto]}
              alt={`${partner.name} - Foto ${currentPhoto + 1}`}
              className="w-full h-full object-cover transition-opacity duration-300"
            />
            {photos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-card/70 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-card/90 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-card/70 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-card/90 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {photos.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPhoto(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === currentPhoto ? 'bg-white scale-110' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-secondary flex items-center justify-center">
            <Dumbbell className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 bg-card/80 backdrop-blur rounded-full flex items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>

      <div className="px-4 -mt-6 relative z-10">
        <div className="bg-card rounded-2xl p-6 shadow-card border">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black">{partner.name}</h1>
              {partner.category && (
                <span className="inline-block mt-1 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                  {partner.category}
                </span>
              )}
            </div>
            {needsUpgrade && (
              <Badge variant="secondary" className="text-xs shrink-0">
                Plan Superior
              </Badge>
            )}
            {!isActive && (
              <Badge variant="outline" className="text-xs shrink-0 flex items-center gap-1">
                <Lock className="h-3 w-3" /> Sin Plan
              </Badge>
            )}
          </div>

          {partner.address && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-3">
              <MapPin className="h-4 w-4 shrink-0" />
              {partner.address}
            </p>
          )}

          {/* Description */}
          {partner.description && (
            <div className="mt-4 p-3 bg-secondary/50 rounded-xl">
              <p className="text-sm text-foreground/80 leading-relaxed">
                {partner.description}
              </p>
            </div>
          )}

          {/* Contact info */}
          {((partner as any).email || (partner as any).phone) && (
            <div className="mt-4 space-y-2">
              {(partner as any).email && (
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  {(partner as any).email}
                </p>
              )}
              {(partner as any).phone && (
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  {(partner as any).phone}
                </p>
              )}
            </div>
          )}

          {/* Photo thumbnails */}
          {photos.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
              {photos.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPhoto(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${i === currentPhoto ? 'border-primary ring-1 ring-primary/30' : 'border-transparent opacity-70 hover:opacity-100'}`}
                >
                  <img src={src} alt={`Miniatura ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Capacity */}
          <div className="flex items-center gap-2 mt-5 text-sm">
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

          {/* Check-in button */}
          <div className="mt-6">
            {renderCheckinButton()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GymDetail;
