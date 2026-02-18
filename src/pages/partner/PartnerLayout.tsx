import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, Landmark, ScanLine } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const PartnerLayout = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (profile?.role !== 'partner_admin') return <Navigate to="/app" replace />;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container flex items-center justify-between h-14 px-4">
          <Link to="/partner" className="text-lg font-black">
            <span className="text-gradient">Red</span>Fit <span className="text-sm font-normal text-muted-foreground">Partner</span>
          </Link>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/partner/finances">
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <Landmark className="h-4 w-4" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>Mis Ganancias</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/partner/scanner">
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <ScanLine className="h-4 w-4" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>Escanear QR</TooltipContent>
            </Tooltip>
            <Link to="/partner/settings">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Ajustes</span>
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-muted-foreground">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
};

export default PartnerLayout;
