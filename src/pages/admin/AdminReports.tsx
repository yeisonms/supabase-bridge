import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  DollarSign, Users, CheckCircle, Building2, TrendingUp, Trophy, AlertTriangle, Loader2,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

const PIE_COLORS = ['hsl(0,82%,52%)', 'hsl(15,90%,55%)', 'hsl(30,85%,50%)', 'hsl(45,80%,50%)'];

type PlanDistItem = { name: string; value: number };
type DayUsage = { day: string; visitas: number };
type TopGym = { name: string; address: string | null; visits: number };
type ChurnUser = { name: string; email: string; status: string };

const AdminReports = () => {
  const [loading, setLoading] = useState(true);
  const [mrr, setMrr] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [monthVisits, setMonthVisits] = useState(0);
  const [activePartners, setActivePartners] = useState(0);
  const [last7Days, setLast7Days] = useState<DayUsage[]>([]);
  const [planDist, setPlanDist] = useState<PlanDistItem[]>([]);
  const [topGyms, setTopGyms] = useState<TopGym[]>([]);
  const [churnUsers, setChurnUsers] = useState<ChurnUser[]>([]);

  useEffect(() => {
    const load = async () => {
      const now = new Date();
      const monthStart = format(now, 'yyyy-MM-01');
      const monthEnd = format(now, 'yyyy-MM-dd');

      // Parallel fetches
      const [
        profilesRes,
        plansRes,
        partnersRes,
        monthCheckinsRes,
        last7Res,
      ] = await Promise.all([
        supabase.from('profiles').select('id, first_name, last_name, subscription_status, current_plan_id'),
        supabase.from('plans').select('id, name, price'),
        supabase.from('partners').select('id, name, address, is_active'),
        supabase.from('checkins').select('id, partner_id, checkin_date').eq('status', 'confirmed').gte('checkin_date', monthStart).lte('checkin_date', monthEnd),
        supabase.from('checkins').select('id, checkin_date').eq('status', 'confirmed').gte('checkin_date', format(subDays(now, 6), 'yyyy-MM-dd')).lte('checkin_date', monthEnd),
      ]);

      const profiles = profilesRes.data || [];
      const plans = plansRes.data || [];
      const partners = partnersRes.data || [];
      const monthCheckins = monthCheckinsRes.data || [];
      const last7Checkins = last7Res.data || [];

      const planMap: Record<number, { name: string; price: number }> = {};
      plans.forEach((p: any) => { planMap[p.id] = { name: p.name, price: p.price }; });

      // KPI: Active users & MRR
      const active = profiles.filter((p: any) => p.subscription_status === 'active');
      setActiveUsers(active.length);
      let totalMrr = 0;
      active.forEach((p: any) => {
        if (p.current_plan_id && planMap[p.current_plan_id]) {
          totalMrr += planMap[p.current_plan_id].price;
        }
      });
      setMrr(totalMrr);

      // KPI: Month visits (confirmed)
      setMonthVisits(monthCheckins.length);

      // KPI: Active partners
      setActivePartners(partners.filter((p: any) => p.is_active).length);

      // Chart: Last 7 days
      const dayMap: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        dayMap[format(subDays(now, i), 'yyyy-MM-dd')] = 0;
      }
      last7Checkins.forEach((c: any) => {
        if (dayMap[c.checkin_date] !== undefined) dayMap[c.checkin_date]++;
      });
      setLast7Days(Object.entries(dayMap).map(([date, count]) => ({
        day: format(new Date(date + 'T12:00:00'), 'EEE d', { locale: es }),
        visitas: count,
      })));

      // Pie: Plan distribution
      const distMap: Record<string, number> = {};
      active.forEach((p: any) => {
        const planName = p.current_plan_id && planMap[p.current_plan_id] ? planMap[p.current_plan_id].name : 'Sin Plan';
        distMap[planName] = (distMap[planName] || 0) + 1;
      });
      setPlanDist(Object.entries(distMap).map(([name, value]) => ({ name, value })));

      // Top 5 gyms
      const gymVisits: Record<string, number> = {};
      monthCheckins.forEach((c: any) => {
        gymVisits[c.partner_id] = (gymVisits[c.partner_id] || 0) + 1;
      });
      const partnerMap: Record<string, { name: string; address: string | null }> = {};
      partners.forEach((p: any) => { partnerMap[p.id] = { name: p.name, address: p.address }; });
      const sorted = Object.entries(gymVisits)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([id, visits]) => ({
          name: partnerMap[id]?.name || 'Desconocido',
          address: partnerMap[id]?.address || null,
          visits,
        }));
      setTopGyms(sorted);

      // Churn users — need email from auth, but we only have profiles. We'll fetch from auth admin if available,
      // otherwise show name + status. For email we query supabase auth — not possible from client.
      // We'll show name + subscription_status.
      const inactive = profiles
        .filter((p: any) => !p.subscription_status || p.subscription_status === 'inactive' || p.subscription_status === 'past_due')
        .slice(0, 10);
      setChurnUsers(inactive.map((p: any) => ({
        name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Sin Nombre',
        email: p.id.substring(0, 8) + '…', // placeholder — no email in profiles
        status: p.subscription_status || 'sin plan',
      })));

      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Reportes Globales</h2>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={DollarSign} label="MRR" value={`$${mrr.toLocaleString('es-CO')}`} sub="Ingresos recurrentes" color="text-emerald-600" />
        <KpiCard icon={Users} label="Usuarios Activos" value={String(activeUsers)} sub="Suscripción activa" color="text-primary" />
        <KpiCard icon={CheckCircle} label="Visitas (mes)" value={String(monthVisits)} sub="Solo confirmadas" color="text-blue-600" />
        <KpiCard icon={Building2} label="Partners Activos" value={String(activePartners)} sub="Gimnasios aprobados" color="text-amber-600" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Bar chart */}
        <div className="bg-card rounded-xl border p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-sm">Uso de la Red (Últimos 7 días)</h3>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem', fontSize: 12 }} />
                <Bar dataKey="visitas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie chart */}
        <div className="bg-card rounded-xl border p-5">
          <h3 className="font-bold text-sm mb-4">Distribución de Planes</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={planDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {planDist.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top gyms */}
        <div className="bg-card rounded-xl border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-4 w-4 text-amber-500" />
            <h3 className="font-bold text-sm">Top 5 Gimnasios (Este mes)</h3>
          </div>
          {topGyms.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Sin datos este mes.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">#</th>
                  <th className="pb-2 font-medium">Gimnasio</th>
                  <th className="pb-2 font-medium text-right">Visitas</th>
                </tr>
              </thead>
              <tbody>
                {topGyms.map((g, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2.5 font-bold text-muted-foreground">{i + 1}</td>
                    <td className="py-2.5">
                      <div className="font-medium">{g.name}</div>
                      {g.address && <div className="text-xs text-muted-foreground">{g.address}</div>}
                    </td>
                    <td className="py-2.5 text-right font-bold">{g.visits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Churn users */}
        <div className="bg-card rounded-xl border p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h3 className="font-bold text-sm">Usuarios Inactivos / Churn</h3>
          </div>
          {churnUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No hay usuarios inactivos.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Nombre</th>
                  <th className="pb-2 font-medium text-right">Estado</th>
                </tr>
              </thead>
              <tbody>
                {churnUsers.map((u, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2.5 font-medium">{u.name}</td>
                    <td className="py-2.5 text-right">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        u.status === 'past_due'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {u.status === 'past_due' ? 'Vencido' : u.status === 'inactive' ? 'Inactivo' : 'Sin Plan'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

/* Small KPI card component */
const KpiCard = ({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub: string; color: string }) => (
  <div className="bg-card rounded-xl border p-5">
    <div className="flex items-center gap-2 mb-2">
      <Icon className={`h-4 w-4 ${color}`} />
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
    </div>
    <div className="text-2xl font-black">{value}</div>
    <p className="text-xs text-muted-foreground mt-1">{sub}</p>
  </div>
);

export default AdminReports;
