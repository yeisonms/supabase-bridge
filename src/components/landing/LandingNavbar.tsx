import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

const LandingNavbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="text-2xl font-black tracking-tight">
          <span className="text-gradient">Red</span>Fit
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Cómo Funciona
          </button>
          <Link to="/partner-info" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Soy Partner
          </Link>
          <Link to="/login">
            <Button size="sm">Iniciar Sesión</Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t bg-background px-4 pb-4 animate-fade-in">
          <button onClick={() => { setOpen(false); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }} className="block py-3 text-sm font-medium text-muted-foreground">
            Cómo Funciona
          </button>
          <Link to="/partner-info" onClick={() => setOpen(false)} className="block py-3 text-sm font-medium text-muted-foreground">
            Soy Partner
          </Link>
          <Link to="/login" onClick={() => setOpen(false)}>
            <Button className="w-full mt-2">Iniciar Sesión</Button>
          </Link>
        </div>
      )}
    </nav>
  );
};

export default LandingNavbar;
