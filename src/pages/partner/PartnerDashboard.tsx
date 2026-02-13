import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Loader2, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const PartnerDashboard = () => {
  const { user } = useAuth();
  const [partner, setPartner] = useState<any>(null);
  const [todayCount, setTodayCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data: p } = await supabase
        .from('partners')
        .select('*')
        .eq('admin_user_id', user.id)
        .single();

      if (p) {
        setPartner(p);
        const { count } = await supabase
          .from('checkins')
          .select('*', { count: 'exact', head: true })
          .eq('partner_id', p.id)
          .eq('checkin_date', new Date().toISOString().split('T')[0]);
        setTodayCount(count || 0);
      }
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
        <p className="font-semibold">No tienes un gimnasio asignado</p>
        <p className="text-sm text-muted-foreground mt-1">Contacta al administrador de RedFit.</p>
      </div>
    );
  }

  const capacityPercent = partner.daily_capacity_limit
    ? Math.min((todayCount / partner.daily_capacity_limit) * 100, 100)
    : 0;

  return (
    <div className="px-4 pt-8 max-w-lg mx-auto">
      {partner.is_active === false && (
        <div className="flex items-center gap-3 bg-yellow-500/15 border border-yellow-500/30 text-yellow-700 dark:text-yellow-400 rounded-xl px-4 py-3 mb-6">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">Tu cuenta está en revisión. Tu gimnasio no será visible para los usuarios hasta que sea aprobado.</p>
        </div>
      )}
      <h1 className="text-2xl font-black mb-1">{partner.name}</h1>
      <p className="text-muted-foreground text-sm mb-8">Panel de control</p>

      {/* Visit counter */}
      <div className="bg-card rounded-2xl p-6 shadow-card border mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="font-bold">Visitas Hoy</h2>
        </div>
        <div className="text-4xl font-black mb-2">
          {todayCount}
          <span className="text-lg text-muted-foreground font-normal">
            {partner.daily_capacity_limit ? ` / ${partner.daily_capacity_limit}` : ''}
          </span>
        </div>
        {partner.daily_capacity_limit && (
          <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-hero-gradient rounded-full transition-all duration-500"
              style={{ width: `${capacityPercent}%` }}
            />
          </div>
        )}
      </div>

      <Link to="/partner/scanner">
        <Button variant="hero" size="lg" className="w-full rounded-full py-6 text-lg">
          Escanear Pase
        </Button>
      </Link>
    </div>
  );
};

export default PartnerDashboard;
