import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, CreditCard, Phone, Mail, User as UserIcon } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import ProfileAvatarUpload from '@/components/profile/ProfileAvatarUpload';
const Profile = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Read subscription from profiles table (where checkout writes)
  const { data: profileSub, isLoading } = useQuery({
    queryKey: ['profile-subscription', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('current_plan_id, subscription_status, plan_start_date, plan_end_date, avatar_url')
        .eq('id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: plan } = useQuery({
    queryKey: ['plan-detail', profileSub?.current_plan_id],
    enabled: !!profileSub?.current_plan_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('id', profileSub!.current_plan_id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const isActive = profileSub?.subscription_status === 'active';
  const isExpired = profileSub?.plan_end_date ? new Date(profileSub.plan_end_date).getTime() < Date.now() : false;
  const phone = user?.user_metadata?.phone || null;

  // Fallback chain: profiles table → user_metadata → email prefix
  const displayFirstName =
    profile?.first_name ||
    user?.user_metadata?.first_name ||
    user?.user_metadata?.full_name?.split(' ')[0] ||
    '';
  const displayLastName =
    profile?.last_name ||
    user?.user_metadata?.last_name ||
    user?.user_metadata?.full_name?.split(' ').slice(1).join(' ') ||
    '';
  const displayName = `${displayFirstName} ${displayLastName}`.trim() || user?.email?.split('@')[0] || 'Usuario';

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <div className="px-4 pt-12 pb-4 space-y-6">
      <h1 className="text-2xl font-black">Perfil</h1>

      {/* Datos personales */}
      <div className="bg-card rounded-2xl p-6 shadow-card border">
        <div className="flex flex-col items-center gap-4 mb-5">
          <ProfileAvatarUpload
            userId={user?.id || ''}
            avatarUrl={profileSub?.avatar_url || null}
            firstName={profile?.first_name || null}
            lastName={profile?.last_name || null}
            onAvatarUpdated={() => {
              queryClient.invalidateQueries({ queryKey: ['profile-subscription', user?.id] });
            }}
          />
          <div className="text-center">
            <p className="font-bold text-lg">
              {displayName}
            </p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3 text-muted-foreground">
            <UserIcon className="h-4 w-4 shrink-0" />
            <span>{displayName}</span>
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
        ) : isActive && plan ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-foreground">
                {plan.name}
              </span>
              {isExpired ? (
                <Badge className="bg-red-500 text-white border-red-600 hover:bg-red-600">
                  Expirado
                </Badge>
              ) : (
                <Badge className="bg-green-500/15 text-green-600 border-green-500/30 hover:bg-green-500/20">
                  Activo
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Válido hasta:{' '}
              <span className="font-medium text-foreground">
                {new Date(profileSub.plan_end_date).toLocaleDateString('es-CO', {
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
