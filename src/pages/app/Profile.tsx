import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, UserCircle, CreditCard, Phone, Mail, User as UserIcon } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

const Profile = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['user-subscription', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, plans(*)')
        .eq('user_id', user!.id)
        .eq('status', 'active')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const phone = user?.user_metadata?.phone || null;

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <div className="px-4 pt-12 pb-4 space-y-6">
      <h1 className="text-2xl font-black">Perfil</h1>

      {/* Datos personales */}
      <div className="bg-card rounded-2xl p-6 shadow-card border">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <UserCircle className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="font-bold text-lg">
              {profile?.first_name || ''} {profile?.last_name || ''}
            </p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3 text-muted-foreground">
            <UserIcon className="h-4 w-4 shrink-0" />
            <span>
              {profile?.first_name || '—'} {profile?.last_name || ''}
            </span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <Mail className="h-4 w-4 shrink-0" />
            <span>{user?.email || '—'}</span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <Phone className="h-4 w-4 shrink-0" />
            <span>{phone || 'No registrado'}</span>
          </div>
        </div>
      </div>

      {/* Suscripción */}
      <div className="bg-card rounded-2xl p-6 shadow-card border">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-5 w-5 text-primary" />
          <h2 className="font-bold text-lg">Mi Plan</h2>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-36" />
          </div>
        ) : subscription ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-foreground">
                {(subscription as any).plans?.name || 'Plan'}
              </span>
              <Badge className="bg-green-500/15 text-green-600 border-green-500/30 hover:bg-green-500/20">
                Activo
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Válido hasta:{' '}
              <span className="font-medium text-foreground">
                {new Date(subscription.current_period_end).toLocaleDateString('es-CO', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </p>
          </div>
        ) : (
          <div className="text-center py-4 space-y-4">
            <p className="text-muted-foreground">No tienes una suscripción activa.</p>
            <Link to="/plans">
              <Button className="w-full" size="lg">
                Ver Planes
              </Button>
            </Link>
          </div>
        )}
      </div>

      <Button
        variant="outline"
        className="w-full justify-start gap-3 text-destructive hover:text-destructive"
        onClick={handleSignOut}
      >
        <LogOut className="h-4 w-4" />
        Cerrar Sesión
      </Button>
    </div>
  );
};

export default Profile;
