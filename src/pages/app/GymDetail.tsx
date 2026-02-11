import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Users, Loader2, CheckCircle, XCircle } from 'lucide-react';
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

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const [{ data: p }, { count }, { data: existing }] = await Promise.all([
        supabase.from('partners').select('id, name, description, address, category, location, image_url, is_active, daily_capacity_limit, min_plan_level, created_at').eq('id', id).single(),
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

  const isFull = partner?.daily_capacity_limit
    ? todayCount >= partner.daily_capacity_limit
    : false;

  const handleCheckin = async () => {
    if (!user || !id) return;
    setCheckingIn(true);
    const { error } = await supabase.from('checkins').insert({
      user_id: user.id,
      partner_id: id,
      checkin_date: new Date().toISOString().split('T')[0],
    });
    if (error) {
      if (error.code === '23505') {
        setCheckedIn(true);
        toast.error('Ya hiciste check-in hoy');
      } else {
        toast.error('No se pudo hacer check-in. Intenta nuevamente.');
      }
    } else {
      setCheckedIn(true);
      setTodayCount((c) => c + 1);
      toast.success('¡Check-in exitoso!');
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
        <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Header image */}
      <div className="relative h-56">
        {partner.image_url ? (
          <img src={partner.image_url} alt={partner.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-secondary" />
        )}
        <div className="absolute inset-0 bg-hero-overlay" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 bg-card/80 backdrop-blur rounded-full flex items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>

      <div className="px-4 -mt-6 relative z-10">
        <div className="bg-card rounded-2xl p-6 shadow-card border">
          <h1 className="text-2xl font-black mb-1">{partner.name}</h1>
          {partner.category && (
            <span className="text-sm text-primary font-medium">{partner.category}</span>
          )}
          {partner.address && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
              <MapPin className="h-4 w-4" />
              {partner.address}
            </p>
          )}
          {partner.description && (
            <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
              {partner.description}
            </p>
          )}

          {/* Capacity */}
          <div className="flex items-center gap-2 mt-6 text-sm">
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
            {checkedIn ? (
              <Button disabled className="w-full rounded-full py-6" size="lg">
                <CheckCircle className="h-5 w-5 mr-2" />
                Ya hiciste check-in hoy
              </Button>
            ) : isFull ? (
              <Button disabled variant="secondary" className="w-full rounded-full py-6" size="lg">
                <XCircle className="h-5 w-5 mr-2" />
                Cupo agotado
              </Button>
            ) : (
              <Button
                variant="hero"
                size="lg"
                className="w-full rounded-full py-6"
                onClick={handleCheckin}
                disabled={checkingIn}
              >
                {checkingIn ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                Hacer Check-in
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GymDetail;
