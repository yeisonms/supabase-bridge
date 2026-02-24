import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, AlertTriangle, Landmark } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const formatCOP = (v: number) => `$${v.toLocaleString('es-CO')}`;

const PartnerFinances = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState<any>(null);
  const [monthlyGroups, setMonthlyGroups] = useState<
    { key: string; label: string; visits: number; rate: number; total: number; isCurrent: boolean }[]
  >([]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data: p } = await supabase
        .from('partners')
        .select('*')
        .eq('admin_user_id', user.id)
        .single();

      if (!p) { setLoading(false); return; }
      setPartner(p);

      const { data: checkins } = await supabase
        .from('checkins')
        .select('checkin_date')
        .eq('partner_id', p.id)
        .eq('status', 'confirmed')
        .order('checkin_date', { ascending: false });

      const rate = p.rate_per_visit ?? 0;
      const now = new Date();
      const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const grouped: Record<string, number> = {};
      (checkins || []).forEach((c: any) => {
        const d = parseISO(c.checkin_date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        grouped[key] = (grouped[key] || 0) + 1;
      });

      const sorted = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
      setMonthlyGroups(
        sorted.map((key) => {
          const [y, m] = key.split('-');
          const date = new Date(Number(y), Number(m) - 1, 1);
          return {
            key,
            label: format(date, 'MMMM yyyy', { locale: es }).replace(/^\w/, (c) => c.toUpperCase()),
            visits: grouped[key],
            rate,
            total: grouped[key] * rate,
            isCurrent: key === currentKey,
          };
        })
      );
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
        <p className="font-semibold">No tienes un centro aliado asignado</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-8 pb-12 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <Landmark className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-black">Historial Contable</h1>
      </div>
      <p className="text-muted-foreground text-sm mb-8">Resumen de ganancias mensuales por visitas confirmadas.</p>

      <div className="bg-card rounded-2xl shadow-card border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mes</TableHead>
              <TableHead className="text-center">Visitas Válidas</TableHead>
              <TableHead className="text-right">Tarifa Aplicada</TableHead>
              <TableHead className="text-right">Total a Liquidar</TableHead>
              <TableHead className="text-center">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {monthlyGroups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  Aún no hay historial de meses anteriores.
                </TableCell>
              </TableRow>
            ) : (
              monthlyGroups.map((g) => (
                <TableRow key={g.key}>
                  <TableCell className="font-medium">{g.label}</TableCell>
                  <TableCell className="text-center">{g.visits}</TableCell>
                  <TableCell className="text-right">{formatCOP(g.rate)} COP</TableCell>
                  <TableCell className="text-right font-semibold">{formatCOP(g.total)} COP</TableCell>
                  <TableCell className="text-center">
                    {g.isCurrent ? (
                      <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 hover:bg-amber-500/20">En curso</Badge>
                    ) : (
                      <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20">Liquidado</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PartnerFinances;
