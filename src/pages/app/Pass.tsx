import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { useAuth } from '@/contexts/AuthContext';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CalendarX, Navigation, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const QR_REFRESH_SECONDS = 30;

const PLAN_LIMITS: Record<number, number> = {
  1: 15,
  2: 20,
  3: 20,
  4: 25,
};

const Pass = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');

  const [qrData, setQrData] = useState('');
  const [elapsed, setElapsed] = useState(0);

  // 1. Fetch user's plan and dates
  const { data: profileSub, isLoading: profileLoading } = useQuery({
    queryKey: ['pass-user-profile', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('current_plan_id, plan_start_date, plan_end_date, subscription_status')
        .eq('id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch today's reservation
  const { data: todayCheckins, isLoading: checkinsLoading } = useQuery({
    queryKey: ['pass-today-reservation', user?.id, today],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checkins')
        .select('*')
        .eq('user_id', user!.id)
        .eq('checkin_date', today)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const reservedCheckin = todayCheckins?.find(c => c.status === 'reserved');
  const confirmedCheckin = todayCheckins?.find(c => c.status === 'confirmed');

  // 3. Count checkins within current billing cycle
  const { data: checkinCount, isLoading: countLoading } = useQuery({
    queryKey: ['pass-checkins-count', user?.id, profileSub?.plan_start_date],
    enabled: !!user?.id && !!profileSub?.plan_start_date && !!profileSub?.plan_end_date,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('checkins')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .in('status', ['confirmed', 'reserved'])
        .gte('checkin_date', profileSub!.plan_start_date)
        .lte('checkin_date', profileSub!.plan_end_date);
      
      if (error) throw error;
      return count || 0;
    },
  });

  // Generate QR data with reservationId
  useEffect(() => {
    const generate = () => {
      if (reservedCheckin) {
        setQrData(JSON.stringify({ 
          id: user?.id, 
          reservationId: reservedCheckin.id,
          timestamp: Date.now() 
        }));
      }
      setElapsed(0);
    };

    generate();
    const interval = setInterval(generate, QR_REFRESH_SECONDS * 1000);
    return () => clearInterval(interval);
  }, [user?.id, reservedCheckin]);

  // Progress bar tick every second
  useEffect(() => {
    const tick = setInterval(() => {
      setElapsed((prev) => Math.min(prev + 1, QR_REFRESH_SECONDS));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const progressValue = (elapsed / QR_REFRESH_SECONDS) * 100;

  const getLimitDisplay = () => {
    if (profileLoading || countLoading) {
      return <Loader2 className="h-4 w-4 animate-spin text-primary mx-auto" />;
    }
    if (profileSub?.subscription_status !== 'active') {
      return <span className="text-red-500 font-bold">Suscripción Inactiva</span>;
    }
    const max = profileSub?.current_plan_id ? (PLAN_LIMITS[profileSub.current_plan_id] || 0) : 0;
    const consumed = checkinCount || 0;
    const available = Math.max(0, max - consumed);
    
    return (
      <div className="flex flex-col items-center">
        <p className="text-sm text-muted-foreground font-medium">Accesos disponibles este mes:</p>
        <div className="flex items-baseline gap-1 mt-1">
          <span className={`text-2xl font-black ${available === 0 ? 'text-red-500' : 'text-primary'}`}>
            {available}
          </span>
          <span className="text-muted-foreground">de {max}</span>
        </div>
        {available === 0 && (
          <p className="text-xs text-red-500 mt-1 font-semibold">Límite alcanzado</p>
        )}
      </div>
    );
  };

  return (
    <div className="px-4 pt-12 pb-4 flex flex-col items-center">
      <h1 className="text-2xl font-black mb-2">Mi Pase</h1>
      
      {confirmedCheckin && !reservedCheckin ? (
        <div className="bg-card rounded-3xl shadow-elevated p-8 border w-full max-w-xs text-center flex flex-col items-center mt-6">
          <div className="h-16 w-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="font-bold text-xl mb-2">¡Pase Utilizado!</h2>
          <p className="text-sm text-muted-foreground">
            Ya visitaste un centro aliado el día de hoy. Vuelve mañana para seguir entrenando.
          </p>
        </div>
      ) : !reservedCheckin ? (
        <div className="bg-card rounded-3xl shadow-elevated p-8 border w-full max-w-xs text-center flex flex-col items-center mt-6">
          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <CalendarX className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="font-bold text-xl mb-2">Sin reserva para hoy</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Por favor, busca un centro aliado y reserva tu cupo para generar tu pase de entrada.
          </p>
          <Button onClick={() => navigate('/app/explore')} className="w-full gap-2 font-bold rounded-xl py-6">
            <Navigation className="h-5 w-5" />
            Buscar Centros Deportivos
          </Button>
        </div>
      ) : (
        <>
          <p className="text-muted-foreground text-sm mb-8 text-center">
            Muestra este código QR en la recepción del centro aliado
          </p>

          <div className="bg-card rounded-3xl shadow-elevated p-8 border w-full max-w-xs relative">
            {/* Animated pulse ring */}
            <div className="absolute -inset-1 rounded-3xl border-2 border-primary/40 animate-pulse pointer-events-none" />

            <div className="bg-white rounded-2xl p-6 flex flex-col items-center justify-center border-4 border-white">
              <div className="bg-white p-2">
                <QRCode
                  value={qrData || '{}'}
                  size={220}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                  level="H"
                />
              </div>
            </div>

            {/* Refresh progress bar */}
            <div className="mt-4">
              <Progress value={progressValue} className="h-1.5" />
              <p className="text-[10px] text-muted-foreground text-center mt-1">
                Se renueva en {QR_REFRESH_SECONDS - elapsed}s
              </p>
            </div>

            <div className="text-center mt-4">
              <p className="text-xs text-muted-foreground">Válido para</p>
              <p className="font-bold text-lg">{today}</p>
            </div>

            {/* Access Quota Counter */}
            <div className="mt-6 pt-5 border-t border-dashed">
              {getLimitDisplay()}
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-6 text-center max-w-xs">
            Este código se renueva automáticamente. El staff del centro aliado lo escaneará para validar tu acceso.
          </p>
        </>
      )}
    </div>
  );
};

export default Pass;
