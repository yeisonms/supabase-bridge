import { Outlet, Navigate, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, Landmark, ScanLine } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import logo from '@/assets/logo.png';

const PartnerLayout = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container flex items-center justify-between h-14 px-4">
          <Link to="/partner" className="flex items-center gap-2">
            <img src={logo} alt="Logo RedFit" className="h-8 w-auto object-contain" />
            <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Partner</span>
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
