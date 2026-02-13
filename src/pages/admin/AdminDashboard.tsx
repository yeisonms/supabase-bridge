import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, Users, MapPin, Building2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type KPIs = {
  monthlyRevenue: number;
  activeUsers: number;
  todayCheckins: number;
  newPartnersWeek: number;
};

const AdminDashboard = () => {
  const [kpis, setKpis] = useState<KPIs>({ monthlyRevenue: 0, activeUsers: 0, todayCheckins: 0, newPartnersWeek: 0 });
  const [chartData, setChartData] = useState<{ date: string; checkins: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();

      const [subsRes, profilesRes, todayCheckinsRes, newPartnersRes, chartRes] = await Promise.all([
        supabase.from('subscriptions').select('plan_id').eq('status', 'active'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('checkins').select('id', { count: 'exact', head: true }).gte('checkin_date', today),
        supabase.from('partners').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
        supabase.from('checkins').select('checkin_date').gte('checkin_date', thirtyDaysAgo),
      ]);

      // Calculate revenue from active subs (simplified: count * avg price)
      let revenue = 0;
      if (subsRes.data) {
        const planPrices: Record<number, number> = { 1: 59900, 2: 89900, 3: 129900 };
        revenue = subsRes.data.reduce((sum, s) => sum + (planPrices[s.plan_id] || 0), 0);
      }

      setKpis({
        monthlyRevenue: revenue,
        activeUsers: profilesRes.count ?? 0,
        todayCheckins: todayCheckinsRes.count ?? 0,
        newPartnersWeek: newPartnersRes.count ?? 0,
      });

      // Build chart data grouped by day
      const grouped: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000).toISOString().split('T')[0];
        grouped[d] = 0;
      }
      chartRes.data?.forEach((c) => {
        const d = c.checkin_date?.split('T')[0] ?? c.checkin_date;
        if (grouped[d] !== undefined) grouped[d]++;
      });
      setChartData(Object.entries(grouped).map(([date, checkins]) => ({ date: date.slice(5), checkins })));

      setLoading(false);
    };
    fetchData();
  }, []);

  const cards = [
    { label: 'Ingresos Mensuales', value: `$${(kpis.monthlyRevenue / 1000).toFixed(0)}K`, icon: DollarSign, color: 'text-emerald-600' },
    { label: 'Usuarios Registrados', value: kpis.activeUsers.toLocaleString(), icon: Users, color: 'text-blue-600' },
    { label: 'Check-ins Hoy', value: kpis.todayCheckins.toLocaleString(), icon: MapPin, color: 'text-primary' },
    { label: 'Partners Nuevos (7d)', value: kpis.newPartnersWeek.toLocaleString(), icon: Building2, color: 'text-amber-600' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="p-6"><div className="h-16 bg-muted animate-pulse rounded" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{c.label}</p>
                  <p className="text-2xl font-bold mt-1">{c.value}</p>
                </div>
                <c.icon className={`h-8 w-8 ${c.color} opacity-80`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Check-ins — Últimos 30 días</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <Tooltip />
                <Line type="monotone" dataKey="checkins" stroke="hsl(0, 82%, 52%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
