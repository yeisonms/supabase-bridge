import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Eye, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Partner } from '@/types/database';

const AdminPartners = () => {
  const [partners, setPartners] = useState<(Partner & { checkin_count: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
    const newStatus = !partner.is_active;
    const { data: updated, error } = await supabase
      .from('partners')
      .update({ is_active: newStatus })
      .eq('id', partner.id)
      .select()
      .maybeSingle();
    if (error) { toast.error('Error al actualizar: ' + error.message); return; }
    if (!updated) { toast.error('No se pudo actualizar. Verifica permisos.'); return; }
    toast.success(newStatus ? 'Partner activado' : 'Partner desactivado');
    setPartners((prev) => prev.map((p) => p.id === partner.id ? { ...p, is_active: updated.is_active } : p));
  };

  const filteredPartners = partners.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Gestión de Partners</h2>
          <Badge variant="secondary">{partners.length} total</Badge>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nombre o categoría..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
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
            ) : filteredPartners.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No se encontraron partners</TableCell></TableRow>
            ) : (
              filteredPartners.map((p) => (
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
                    <Button size="sm" variant="outline" asChild className="gap-1.5">
                      <Link to={`/admin/gym/${p.id}`}><Eye className="h-3.5 w-3.5" /> Ver</Link>
                    </Button>
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

    </div>
  );
};

export default AdminPartners;
