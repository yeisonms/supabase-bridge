import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CalendarDays, MapPin, XCircle, Loader2, Ticket, CheckCircle, Ban, Dumbbell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type ReservationRow = {
  id: string;
  checkin_date: string;
  status: string;
  created_at: string;
  partner_id: string;
  partners: { name: string; address: string | null; image_url: string | null } | null;
};

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  reserved: { label: 'Reservado', color: 'bg-amber-500/15 text-amber-600 border-amber-500/30', icon: Ticket },
  confirmed: { label: 'Confirmado', color: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'bg-destructive/15 text-destructive border-destructive/30', icon: Ban },
};

const Reservations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['my-reservations', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checkins')
        .select('id, checkin_date, status, created_at, partner_id, partners:partner_id(name, address, image_url)')
        .eq('user_id', user!.id)
        .order('checkin_date', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ReservationRow[];
    },
  });

  const active = reservations.filter((r) => r.status === 'reserved');
  const history = reservations.filter((r) => r.status === 'confirmed' || r.status === 'cancelled');

  const handleCancel = async (checkinId: string) => {
    setCancellingId(checkinId);
    const { data, error } = await supabase
      .from('checkins')
      .update({ status: 'cancelled' })
      .eq('id', checkinId)
      .eq('user_id', user!.id)
      .select('id');

    if (error) {
      toast.error('No se pudo cancelar la reserva.');
    } else if (!data || data.length === 0) {
      toast.error('No se pudo cancelar la reserva. Permisos insuficientes.');
    } else {
      toast.success('Reserva cancelada exitosamente.');
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['checkin-status'] });
    }
    setCancellingId(null);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const ReservationCard = ({ r, showCancel }: { r: ReservationRow; showCancel?: boolean }) => {
    const cfg = statusConfig[r.status] || statusConfig.reserved;
    const Icon = cfg.icon;
    return (
      <div className="bg-card rounded-2xl border shadow-card p-4 space-y-3">
        <div className="flex items-start gap-3">
          {r.partners?.image_url ? (
            <img src={r.partners.image_url} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center shrink-0">
              <Dumbbell className="h-6 w-6 text-muted-foreground/40" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground truncate">{r.partners?.name || 'Centro Aliado'}</p>
            {r.partners?.address && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3 shrink-0" /> {r.partners.address}
              </p>
            )}
          </div>
          <Badge className={cfg.color} variant="outline">
            <Icon className="h-3 w-3 mr-1" /> {cfg.label}
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          <span className="capitalize">{formatDate(r.checkin_date)}</span>
        </div>

        {showCancel && r.status === 'reserved' && (
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => navigate('/app/pass')}
            >
              <Ticket className="h-4 w-4 mr-1" /> Ver Pase QR
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="flex-1" disabled={cancellingId === r.id}>
                  {cancellingId === r.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
                  Cancelar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Cancelar reserva?</AlertDialogTitle>
                  <AlertDialogDescription>
                    ¿Estás seguro de que deseas cancelar esta reserva en <span className="font-semibold">{r.partners?.name}</span>? Liberarás tu pase diario y el cupo en el centro.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Volver</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleCancel(r.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Sí, cancelar reserva
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-12 pb-4 space-y-6">
      <h1 className="text-2xl font-black">Mis Reservas</h1>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="active" className="flex-1">
            Activas {active.length > 0 && <Badge className="ml-1.5 bg-primary/15 text-primary border-primary/30 text-xs" variant="outline">{active.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4 space-y-3">
          {active.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Ticket className="h-12 w-12 text-muted-foreground/30 mx-auto" />
              <p className="text-muted-foreground">No tienes reservas activas.</p>
              <Button variant="outline" onClick={() => navigate('/app/explore')}>Explorar centros aliados</Button>
            </div>
          ) : (
            active.map((r) => <ReservationCard key={r.id} r={r} showCancel />)
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <CalendarDays className="h-12 w-12 text-muted-foreground/30 mx-auto" />
              <p className="text-muted-foreground">Aún no hay historial de reservas.</p>
            </div>
          ) : (
            history.map((r) => <ReservationCard key={r.id} r={r} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reservations;
