import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

const PartnerLayout = () => {
  const { user, profile, loading } = useAuth();

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
        </div>
      </header>
      <Outlet />
    </div>
  );
};

export default PartnerLayout;
