import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Loader2, AlertTriangle, DollarSign, Clock, CheckCircle, CalendarClock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';



type CheckinRow = {
  id: string;
  user_id: string;
  checkin_date: string;
  created_at: string;
  status: string;
};

type ProfileInfo = {
  first_name: string | null;
  last_name: string | null;
};

const PartnerDashboard = () => {
  const { user } = useAuth();
  const [partner, setPartner] = useState<any>(null);
  const [todayConfirmed, setTodayConfirmed] = useState(0);
  const [todayReserved, setTodayReserved] = useState(0);
  const [todayTotal, setTodayTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [monthConfirmedTotal, setMonthConfirmedTotal] = useState(0);
  const [todayCheckins, setTodayCheckins] = useState<(CheckinRow & { profile?: ProfileInfo })[]>([]);

  const loadDashboardData = useCallback(async (partnerId: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');

    const [todayAllRes, monthConfirmedRes, todayListRes] = await Promise.all([
      supabase
        .from('checkins')
        .select('status')
        .eq('partner_id', partnerId)
        .eq('checkin_date', today)
        .in('status', ['confirmed', 'reserved']),
      supabase
        .from('checkins')
        .select('checkin_date')
        .eq('partner_id', partnerId)
        .gte('checkin_date', monthStart)
        .lte('checkin_date', monthEnd)
        .eq('status', 'confirmed'),
      supabase
        .from('checkins')
        .select('id, user_id, checkin_date, created_at, status')
        .eq('partner_id', partnerId)
        .eq('checkin_date', today)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    if (todayAllRes.error) {
      console.error('[Dashboard] Error fetching todayAllRes:', todayAllRes.error);
    }
    if (monthConfirmedRes.error) {
      console.error('[Dashboard] Error fetching monthConfirmedRes:', monthConfirmedRes.error);
    }
    if (todayListRes.error) {
      console.error('[Dashboard] Error fetching todayListRes:', todayListRes.error);
    }

    const todayRows = todayAllRes.data || [];
    const confirmed = todayRows.filter((r: any) => r.status === 'confirmed').length;
    const reserved = todayRows.filter((r: any) => r.status === 'reserved').length;
    setTodayConfirmed(confirmed);
    setTodayReserved(reserved);
    setTodayTotal(confirmed + reserved);

    const confirmedRows = monthConfirmedRes.data || [];
    setMonthConfirmedTotal(confirmedRows.length);

    // Profiles for today's checkins
    const checkins = (todayListRes.data || []) as CheckinRow[];
    if (checkins.length > 0) {
      const userIds = [...new Set(checkins.map((c) => c.user_id))];
      const { data: profiles, error: rpcError } = await supabase
        .rpc('get_checkin_profiles', { p_user_ids: userIds });

      if (rpcError) {
        console.error('[Dashboard] Error calling get_checkin_profiles RPC:', rpcError);
      }

      const profileMap: Record<string, ProfileInfo> = {};
      (profiles || []).forEach((pr: any) => {
        profileMap[pr.id] = { first_name: pr.first_name, last_name: pr.last_name };
      });
      setTodayCheckins(checkins.map((c) => ({ ...c, profile: profileMap[c.user_id] })));
    } else {
      setTodayCheckins([]);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data: p, error: partnerErr } = await supabase
        .from('partners')
        .select('*')
        .eq('admin_user_id', user.id)
        .single();

      if (partnerErr) {
        console.error('[Dashboard] Error fetching partner:', partnerErr);
      }

      if (!p) { setLoading(false); return; }
      setPartner(p);

      await loadDashboardData(p.id);
      setLoading(false);
    };
    load();
  }, [user, loadDashboardData]);

  useEffect(() => {
    if (!partner?.id) return;

    console.log('[Dashboard] Subscribing to realtime checkins for partner:', partner.id);
    const channel = supabase
      .channel(`partner-dashboard-checkins-${partner.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'checkins',
          filter: `partner_id=eq.${partner.id}`,
        },
        (payload) => {
          console.log('[Dashboard] Realtime checkin update received, reloading...', payload);
          loadDashboardData(partner.id);
        }
      )
      .subscribe((status) => {
        console.log(`[Dashboard] Realtime subscription status for partner ${partner.id}:`, status);
      });

    return () => {
      console.log('[Dashboard] Unsubscribing from realtime checkins for partner:', partner.id);
      supabase.removeChannel(channel);
    };
  }, [partner?.id, loadDashboardData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="px-4 pt-12 text-center flex flex-col items-center justify-center">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="font-semibold text-lg mb-2">Aún no has registrado tu centro aliado</p>
        <p className="text-sm text-muted-foreground mb-6">Para empezar a usar el panel, debes registrar la información de tu centro.</p>
        <Link to="/partner/register">
          <Button size="lg" className="rounded-full">Registrar mi Centro</Button>
        </Link>
      </div>
    );
  }

  const capacityPercent = partner.daily_capacity_limit
    ? Math.min((todayTotal / partner.daily_capacity_limit) * 100, 100)
    : 0;

  const ratePerVisit = partner.rate_per_visit ?? 0;
  const estimatedRevenue = monthConfirmedTotal * ratePerVisit;

  const formatCOP = (v: number) => `$${v.toLocaleString('es-CO')}`;
  return (
    <div className="px-4 pt-8 pb-12 max-w-2xl mx-auto">
      {partner.is_active === false && (
        <div className="flex items-center gap-3 bg-yellow-500/15 border border-yellow-500/30 text-yellow-700 dark:text-yellow-400 rounded-xl px-4 py-3 mb-6">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">Tu cuenta está en revisión. Tu centro no será visible para los usuarios hasta que sea aprobado.</p>
        </div>
      )}
      <h1 className="text-2xl font-black mb-1">{partner.name}</h1>
      <p className="text-muted-foreground text-sm mb-8">Panel de control</p>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Tarjeta A: Aforo Actual */}
        <div className="bg-card rounded-2xl p-5 shadow-card border col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-primary" />
            <h2 className="font-bold text-sm">Aforo Actual</h2>
          </div>
          <div className="text-3xl font-black">
            {todayTotal}
            <span className="text-sm text-muted-foreground font-normal">
              {partner.daily_capacity_limit ? ` / ${partner.daily_capacity_limit}` : ''}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Reservados + Confirmados</p>
          {partner.daily_capacity_limit && (
            <div className="w-full bg-secondary rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="h-full bg-hero-gradient rounded-full transition-all duration-500"
                style={{ width: `${capacityPercent}%` }}
              />
            </div>
          )}
        </div>

        {/* Tarjeta B: Check-ins Confirmados */}
        <div className="bg-card rounded-2xl p-5 shadow-card border">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <h2 className="font-bold text-sm">Confirmados</h2>
          </div>
          <div className="text-3xl font-black text-emerald-600">{todayConfirmed}</div>
          <p className="text-xs text-muted-foreground mt-1">Ingresos reales de hoy</p>
        </div>

        {/* Tarjeta C: Reservas Pendientes */}
        <div className="bg-card rounded-2xl p-5 shadow-card border">
          <div className="flex items-center gap-2 mb-3">
            <CalendarClock className="h-4 w-4 text-amber-500" />
            <h2 className="font-bold text-sm">Pendientes</h2>
          </div>
          <div className="text-3xl font-black text-amber-500">{todayReserved}</div>
          <p className="text-xs text-muted-foreground mt-1">Faltan por llegar</p>
        </div>
      </div>

      {/* Quick revenue summary */}
      <Link to="/partner/finances" className="block">
        <div className="bg-card rounded-2xl p-5 shadow-card border mb-6 hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-primary" />
                <h2 className="font-bold text-sm">Ingresos del mes</h2>
              </div>
              <div className="text-2xl font-black">{formatCOP(estimatedRevenue)} COP</div>
              <p className="text-xs text-muted-foreground mt-1">{monthConfirmedTotal} visitas confirmadas</p>
            </div>
            <span className="text-xs text-primary font-medium">Ver historial →</span>
          </div>
        </div>
      </Link>

      {/* Today's checkins table */}
      <div className="bg-card rounded-2xl p-5 shadow-card border mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-primary" />
          <h2 className="font-bold text-sm">Últimos ingresos de hoy</h2>
        </div>
        {todayCheckins.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No hay ingresos registrados hoy.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Usuario</th>
                  <th className="pb-2 font-medium">Hora</th>
                  <th className="pb-2 font-medium text-right">Estado</th>
                </tr>
              </thead>
              <tbody>
                {todayCheckins.map((c) => {
                  const fullName = c.profile
                    ? `${c.profile.first_name || ''} ${c.profile.last_name || ''}`.trim()
                    : '';
                  const name = fullName
                    || `Usuario #${c.user_id.slice(-5).toUpperCase()}`;
                  const time = c.created_at ? format(parseISO(c.created_at), 'HH:mm', { locale: es }) : '--:--';
                  const isConfirmed = c.status === 'confirmed';
                  const statusLabel = isConfirmed ? 'Confirmado' : c.status === 'reserved' ? 'Reservado' : c.status;
                  const statusColor = isConfirmed 
                    ? 'text-emerald-600' 
                    : c.status === 'reserved' 
                      ? 'text-amber-500' 
                      : 'text-red-500';
                  return (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">{name}</td>
                      <td className="py-3 text-muted-foreground">{time}</td>
                      <td className={`py-3 text-right font-medium ${statusColor}`}>{statusLabel}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Link to="/partner/scanner">
        <Button variant="hero" size="lg" className="w-full rounded-full py-6 text-lg">
          Escanear Pase
        </Button>
      </Link>
    </div>
  );
};

export default PartnerDashboard;
