import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Loader2, AlertTriangle, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const RATE_PER_VISIT = 5000; // Tarifa por visita en COP (ajustar según acuerdo)

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
  const [todayCount, setTodayCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<{ day: string; visitas: number }[]>([]);
  const [monthTotal, setMonthTotal] = useState(0);
  const [todayCheckins, setTodayCheckins] = useState<(CheckinRow & { profile?: ProfileInfo })[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data: p } = await supabase
        .from('partners')
        .select('*')
        .eq('admin_user_id', user.id)
        .single();

      if (!p) {
        setLoading(false);
        return;
      }

      setPartner(p);

      const today = new Date().toISOString().split('T')[0];
      const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');

      // Parallel queries
      const [countRes, monthRes, todayRes] = await Promise.all([
        supabase
          .from('checkins')
          .select('*', { count: 'exact', head: true })
          .eq('partner_id', p.id)
          .eq('checkin_date', today),
        supabase
          .from('checkins')
          .select('checkin_date')
          .eq('partner_id', p.id)
          .gte('checkin_date', monthStart)
          .lte('checkin_date', monthEnd)
          .in('status', ['confirmed', 'reserved']),
        supabase
          .from('checkins')
          .select('id, user_id, checkin_date, created_at, status')
          .eq('partner_id', p.id)
          .eq('checkin_date', today)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      setTodayCount(countRes.count || 0);

      // Build monthly chart data
      const days = eachDayOfInterval({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) });
      const countsMap: Record<string, number> = {};
      (monthRes.data || []).forEach((row: any) => {
        countsMap[row.checkin_date] = (countsMap[row.checkin_date] || 0) + 1;
      });
      const chartData = days.map((d) => {
        const key = format(d, 'yyyy-MM-dd');
        return { day: format(d, 'd', { locale: es }), visitas: countsMap[key] || 0 };
      });
      setMonthlyData(chartData);
      setMonthTotal((monthRes.data || []).length);

      // Load profiles for today's checkins
      const checkins = (todayRes.data || []) as CheckinRow[];
      if (checkins.length > 0) {
        const userIds = [...new Set(checkins.map((c) => c.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', userIds);

        const profileMap: Record<string, ProfileInfo> = {};
        (profiles || []).forEach((pr: any) => {
          profileMap[pr.id] = { first_name: pr.first_name, last_name: pr.last_name };
        });

        setTodayCheckins(checkins.map((c) => ({ ...c, profile: profileMap[c.user_id] })));
      } else {
        setTodayCheckins([]);
      }

      setLoading(false);
    };
    load();
  }, [user]);

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
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="font-semibold">No tienes un gimnasio asignado</p>
        <p className="text-sm text-muted-foreground mt-1">Contacta al administrador de RedFit.</p>
      </div>
    );
  }

  const capacityPercent = partner.daily_capacity_limit
    ? Math.min((todayCount / partner.daily_capacity_limit) * 100, 100)
    : 0;

  const estimatedRevenue = monthTotal * RATE_PER_VISIT;

  return (
    <div className="px-4 pt-8 pb-12 max-w-2xl mx-auto">
      {partner.is_active === false && (
        <div className="flex items-center gap-3 bg-yellow-500/15 border border-yellow-500/30 text-yellow-700 dark:text-yellow-400 rounded-xl px-4 py-3 mb-6">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">Tu cuenta está en revisión. Tu gimnasio no será visible para los usuarios hasta que sea aprobado.</p>
        </div>
      )}
      <h1 className="text-2xl font-black mb-1">{partner.name}</h1>
      <p className="text-muted-foreground text-sm mb-8">Panel de control</p>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Visit counter */}
        <div className="bg-card rounded-2xl p-5 shadow-card border">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-primary" />
            <h2 className="font-bold text-sm">Visitas Hoy</h2>
          </div>
          <div className="text-3xl font-black">
            {todayCount}
            <span className="text-sm text-muted-foreground font-normal">
              {partner.daily_capacity_limit ? ` / ${partner.daily_capacity_limit}` : ''}
            </span>
          </div>
          {partner.daily_capacity_limit && (
            <div className="w-full bg-secondary rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="h-full bg-hero-gradient rounded-full transition-all duration-500"
                style={{ width: `${capacityPercent}%` }}
              />
            </div>
          )}
        </div>

        {/* Estimated revenue */}
        <div className="bg-card rounded-2xl p-5 shadow-card border">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="h-4 w-4 text-primary" />
            <h2 className="font-bold text-sm">Ingresos Estimados</h2>
          </div>
          <div className="text-3xl font-black">
            {estimatedRevenue.toLocaleString('es-CO')}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {monthTotal} visitas × ${RATE_PER_VISIT.toLocaleString('es-CO')}
          </p>
        </div>
      </div>

      {/* Monthly chart */}
      <div className="bg-card rounded-2xl p-5 shadow-card border mb-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2 className="font-bold text-sm">Visitas de este mes</h2>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.75rem',
                  fontSize: 12,
                }}
                labelFormatter={(label) => `Día ${label}`}
              />
              <Bar dataKey="visitas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

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
                  const name = c.profile
                    ? `${c.profile.first_name || ''} ${c.profile.last_name || ''}`.trim() || 'Sin nombre'
                    : 'Usuario';
                  const time = c.created_at ? format(parseISO(c.created_at), 'HH:mm', { locale: es }) : '--:--';
                  const statusLabel = c.status === 'confirmed' ? 'Confirmado' : c.status === 'reserved' ? 'Reservado' : c.status;
                  const statusColor = c.status === 'confirmed' ? 'text-emerald-600' : 'text-primary';
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
