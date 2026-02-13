import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { Partner } from '@/types/database';

const AdminPartners = () => {
  const [partners, setPartners] = useState<(Partner & { checkin_count: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Partner | null>(null);

  const fetchPartners = async () => {
    const { data } = await supabase.from('partners').select('*');
    if (!data) { setLoading(false); return; }

    // Get checkin counts per partner
    const { data: checkins } = await supabase.from('checkins').select('partner_id');
    const counts: Record<string, number> = {};
    checkins?.forEach((c) => { counts[c.partner_id] = (counts[c.partner_id] || 0) + 1; });

    setPartners(data.map((p) => ({ ...p, checkin_count: counts[p.id] || 0 })));
    setLoading(false);
  };

  useEffect(() => { fetchPartners(); }, []);

  const toggleActive = async (partner: Partner) => {
    const { error } = await supabase.from('partners').update({ is_active: !partner.is_active }).eq('id', partner.id);
    if (error) { toast.error('Error al actualizar'); return; }
    toast.success(partner.is_active ? 'Partner desactivado' : 'Partner activado');
    fetchPartners();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gestión de Partners</h2>
        <Badge variant="secondary">{partners.length} total</Badge>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead className="text-center">Visitas</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
            ) : partners.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No hay partners registrados</TableCell></TableRow>
            ) : (
              partners.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.category ?? '—'}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{p.address ?? '—'}</TableCell>
                  <TableCell className="text-center">{p.checkin_count}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={p.is_active ? 'default' : 'destructive'} className="text-xs">
                      {p.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => setSelected(p)}>Detalles</Button>
                    <Button size="sm" variant={p.is_active ? 'destructive' : 'default'} onClick={() => toggleActive(p)}>
                      {p.is_active ? 'Desactivar' : 'Activar'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Categoría:</span> {selected?.category ?? '—'}</p>
            <p><span className="font-medium">Dirección:</span> {selected?.address ?? '—'}</p>
            <p><span className="font-medium">Descripción:</span> {selected?.description ?? '—'}</p>
            <p><span className="font-medium">Capacidad diaria:</span> {selected?.daily_capacity_limit ?? 'Sin límite'}</p>
            <p><span className="font-medium">Plan mínimo:</span> Nivel {selected?.min_plan_level ?? 1}</p>
            <p><span className="font-medium">Registrado:</span> {selected?.created_at ? new Date(selected.created_at).toLocaleDateString() : '—'}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPartners;
