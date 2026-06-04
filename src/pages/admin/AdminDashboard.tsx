import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, Users, MapPin, Building2, TrendingUp, TrendingDown, Wallet, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type KPIs = {
  monthlyRevenue: number;
  operationalCosts: number;
  netProfit: number;
  totalUsers: number;
  todayCheckins: number;
  newPartnersWeek: number;
};

// Helper para meses en español
const getSpanishMonth = (dateString: string) => {
  const [year, month] = dateString.split('-');
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${months[parseInt(month) - 1]} ${year}`;
};

const AdminDashboard = () => {
  const [kpis, setKpis] = useState<KPIs>({ monthlyRevenue: 0, operationalCosts: 0, netProfit: 0, totalUsers: 0, todayCheckins: 0, newPartnersWeek: 0 });
  const [chartData, setChartData] = useState<{ date: string; checkins: number }[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));

  // Generar últimos 12 meses para el selector
  const monthOptions = Array.from({ length: 12 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return format(d, 'yyyy-MM');
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const now = new Date();
      const today = format(now, 'yyyy-MM-dd');
      const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
      const thirtyDaysAgo = format(new Date(now.getTime() - 30 * 86400000), 'yyyy-MM-dd');
      
      // Fechas para el mes seleccionado
      const [yearStr, monthStr] = selectedMonth.split('-');
      const monthStart = `${yearStr}-${monthStr}-01`;
      // Último día del mes
      const lastDay = new Date(parseInt(yearStr), parseInt(monthStr), 0).getDate();
      const monthEnd = `${yearStr}-${monthStr}-${String(lastDay).padStart(2, '0')}T23:59:59.999Z`;

      const [paymentsRes, transactionsRes, userCountRes, todayCheckinsRes, newPartnersRes, chartRes, monthCheckinsRes, partnersRes] = await Promise.all([
        supabase.from('payments').select('amount, created_at').eq('status', 'APPROVED').gte('created_at', monthStart).lte('created_at', monthEnd),
        supabase.from('transactions').select('amount, transaction_type').gte('transaction_date', monthStart).lte('transaction_date', monthEnd),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'user'),
        supabase.from('checkins').select('id', { count: 'exact', head: true }).eq('checkin_date', today).eq('status', 'confirmed'),
        supabase.from('partners').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
        supabase.from('checkins').select('checkin_date').eq('status', 'confirmed').gte('checkin_date', thirtyDaysAgo),
        supabase.from('checkins').select('partner_id').eq('status', 'confirmed').gte('checkin_date', monthStart).lte('checkin_date', monthEnd.split('T')[0]),
        supabase.from('partners').select('id, rate_per_visit'),
      ]);

      console.log('--- DEBUG FINANZAS ---');
      console.log('Mes seleccionado:', selectedMonth);
      console.log('Rango:', monthStart, 'hasta', monthEnd);
      console.log('Pagos Wompi Data:', paymentsRes.data);
      console.log('Pagos Wompi Error:', paymentsRes.error);
      console.log('Transacciones Data:', transactionsRes.data);
      console.log('Transacciones Error:', transactionsRes.error);
      console.log('----------------------');

      // Ingresos Brutos: Pagos Wompi + Ingresos Manuales (Mes Seleccionado)
      let revenue = 0;
      if (paymentsRes.data) {
        revenue += paymentsRes.data.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      }
      if (transactionsRes.data) {
        revenue += transactionsRes.data
          .filter(t => t.transaction_type === 'ingreso')
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      }

      // Costos Operativos: Deuda a Partners + Egresos Manuales (Mes Seleccionado)
      let operationalCosts = 0;
      // 1. Deuda a Partners
      if (monthCheckinsRes.data && partnersRes.data) {
        const rateMap: Record<string, number> = {};
        partnersRes.data.forEach((p: any) => { rateMap[p.id] = p.rate_per_visit ?? 0; });
        monthCheckinsRes.data.forEach((c: any) => {
          operationalCosts += rateMap[c.partner_id] || 0;
        });
      }
      // 2. Egresos Manuales
      if (transactionsRes.data) {
        operationalCosts += transactionsRes.data
          .filter(t => t.transaction_type === 'egreso')
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      }

      const netProfit = revenue - operationalCosts;

      setKpis({
        monthlyRevenue: revenue,
        operationalCosts,
        netProfit,
        totalUsers: userCountRes.count ?? 0,
        todayCheckins: todayCheckinsRes.count ?? 0,
        newPartnersWeek: newPartnersRes.count ?? 0,
      });

      // Build chart data grouped by day (last 30 days, fill empty with 0)
      const grouped: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const d = format(new Date(now.getTime() - i * 86400000), 'yyyy-MM-dd');
        grouped[d] = 0;
      }
      chartRes.data?.forEach((c) => {
        const d = c.checkin_date;
        if (d && grouped[d] !== undefined) grouped[d]++;
      });
      setChartData(Object.entries(grouped).map(([date, checkins]) => ({ date: date.slice(5), checkins })));

      setLoading(false);
    };
    fetchData();
  }, [selectedMonth]);

  const formatCOP = (value: number) =>
    `$${value.toLocaleString('es-CO')} COP`;

  const financialCards = [
    { label: 'Ingresos Brutos', value: formatCOP(kpis.monthlyRevenue), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'Costos Operativos', value: formatCOP(kpis.operationalCosts), icon: Wallet, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
    { label: 'Ganancia Neta (Profit)', value: formatCOP(kpis.netProfit), icon: kpis.netProfit >= 0 ? TrendingUp : TrendingDown, color: kpis.netProfit >= 0 ? 'text-emerald-600' : 'text-destructive', bg: kpis.netProfit >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-red-50 dark:bg-red-950/30' },
  ];

  const cards = [
    { label: 'Usuarios Registrados', value: kpis.totalUsers.toLocaleString(), icon: Users, color: 'text-blue-600' },
    { label: 'Check-ins Hoy', value: kpis.todayCheckins.toLocaleString(), icon: MapPin, color: 'text-primary' },
    { label: 'Partners Nuevos (7d)', value: kpis.newPartnersWeek.toLocaleString(), icon: Building2, color: 'text-amber-600' },
  ];

  if (loading && Object.keys(chartData).length === 0) {
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[160px] font-medium">
              <SelectValue placeholder="Seleccionar Mes" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((month) => (
                <SelectItem key={month} value={month}>
                  {getSpanishMonth(month)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Financial overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {financialCards.map((c) => (
          <Card key={c.label} className={`${c.bg} border-none`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">{c.label}</p>
                  <p className={`text-3xl font-black mt-2 ${c.color}`}>{c.value}</p>
                </div>
                <c.icon className={`h-10 w-10 ${c.color} opacity-60`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Operational KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" allowDecimals={false} />
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
