import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { Home, Compass, Heart, Ticket, UserCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { to: '/app', icon: Home, label: 'Inicio', end: true },
  { to: '/app/explore', icon: Compass, label: 'Explorar' },
  { to: '/app/favorites', icon: Heart, label: 'Favoritos' },
  { to: '/app/pass', icon: Ticket, label: 'Mi Pase' },
  { to: '/app/profile', icon: UserCircle, label: 'Perfil' },
];

const AppLayout = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (profile?.role === 'super_admin') return <Navigate to="/admin" replace />;
  if (profile?.role === 'partner_admin') return <Navigate to="/partner" replace />;

  return (
    <div className="min-h-screen pb-20 bg-background">
      <Outlet />
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t safe-bottom">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 text-xs font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;
