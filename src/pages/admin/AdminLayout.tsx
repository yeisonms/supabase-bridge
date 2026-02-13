import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart3, Users, Building2, CreditCard, TrendingUp, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

const sidebarItems = [
  { to: '/admin', icon: BarChart3, label: 'Dashboard', end: true },
  { to: '/admin/users', icon: Users, label: 'Usuarios' },
  { to: '/admin/partners', icon: Building2, label: 'Partners' },
  { to: '/admin/plans', icon: CreditCard, label: 'Planes' },
  { to: '/admin/reports', icon: TrendingUp, label: 'Reportes' },
];

const AdminLayout = () => {
  const { user, profile, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (profile?.role !== 'super_admin') return <Navigate to="/app" replace />;

  return (
    <div className="min-h-screen flex bg-muted/40">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col bg-card border-r fixed inset-y-0 left-0 z-40">
        <div className="p-5 border-b">
          <h1 className="text-lg font-bold tracking-tight">
            Red<span className="text-primary">Fit</span> Admin
          </h1>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-bold">Red<span className="text-primary">Fit</span> Admin</h1>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        <nav className="flex gap-1 mt-2 overflow-x-auto pb-1">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-accent text-muted-foreground'
                }`
              }
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-60 pt-24 md:pt-0">
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
