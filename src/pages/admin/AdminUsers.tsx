import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type UserRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  created_at: string;
  plan_name: string | null;
  sub_status: string | null;
  last_checkin: string | null;
};

const AdminUsers = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name, role, created_at, current_plan_id, subscription_status');
      if (!profiles) { setLoading(false); return; }

      const { data: plans } = await supabase.from('plans').select('id, name');
      const { data: checkins } = await supabase.from('checkins').select('user_id, checkin_date').order('checkin_date', { ascending: false });

      const planMap: Record<number, string> = {};
      plans?.forEach((p) => { planMap[p.id] = p.name; });

      const lastCheckinMap: Record<string, string> = {};
      checkins?.forEach((c) => { if (!lastCheckinMap[c.user_id]) lastCheckinMap[c.user_id] = c.checkin_date; });

      setUsers(
        profiles.map((p: any) => ({
          id: p.id,
          first_name: p.first_name,
          last_name: p.last_name,
          role: p.role,
          created_at: p.created_at,
          plan_name: p.current_plan_id ? (planMap[p.current_plan_id] || '—') : 'Sin plan',
          sub_status: p.subscription_status ?? null,
          last_checkin: lastCheckinMap[p.id] ?? null,
        }))
      );
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const paymentStatus = (status: string | null) => {
    if (!status) return { label: 'Sin plan', variant: 'secondary' as const };
    if (status === 'active') return { label: 'Al día', variant: 'default' as const };
    return { label: 'Moroso', variant: 'destructive' as const };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
        <Badge variant="secondary">{users.length} total</Badge>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead className="text-center">Estado Pago</TableHead>
              <TableHead>Último Check-in</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
            ) : users.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No hay usuarios</TableCell></TableRow>
            ) : (
              users.map((u) => {
                const ps = paymentStatus(u.sub_status);
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      {u.first_name || u.last_name ? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() : 'Sin nombre'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{u.role ?? 'user'}</Badge>
                    </TableCell>
                    <TableCell>{u.plan_name}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={ps.variant} className="text-xs">{ps.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {u.last_checkin ? new Date(u.last_checkin).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="destructive" onClick={() => toast.info('Funcionalidad pendiente de implementar')}>
                        Bloquear
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminUsers;
