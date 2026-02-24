import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Compass, Ticket } from 'lucide-react';

const AppHome = () => {
  const { profile } = useAuth();
  const name = profile?.first_name || 'Atleta';

  return (
    <div className="px-4 pt-12 pb-4">
      <h1 className="text-2xl font-black mb-1">Hola, {name} 👋</h1>
      <p className="text-muted-foreground mb-8">¿Listo para entrenar hoy?</p>

      <div className="grid gap-4">
        <Link to="/app/explore" className="block">
          <div className="bg-hero-gradient rounded-2xl p-6 text-primary-foreground">
            <Compass className="h-8 w-8 mb-3 opacity-90" />
            <h2 className="text-xl font-bold mb-1">Explorar Centros</h2>
            <p className="text-sm opacity-80">Encuentra centros aliados cerca de ti</p>
          </div>
        </Link>
        <Link to="/app/pass" className="block">
          <div className="bg-card rounded-2xl p-6 shadow-card border">
            <Ticket className="h-8 w-8 mb-3 text-primary" />
            <h2 className="text-xl font-bold mb-1">Mi Pase</h2>
            <p className="text-sm text-muted-foreground">Muestra tu código QR para entrar</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default AppHome;
