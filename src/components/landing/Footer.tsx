import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="border-t border-white/5 py-12 bg-background relative z-10">
    <div className="container px-4 flex flex-col md:flex-row items-center justify-between gap-6">
      <p className="text-sm text-muted-foreground font-medium">
        © {new Date().getFullYear()} <span className="font-bold text-foreground">RedFit</span>. Todos los derechos reservados.
      </p>
      <div className="flex gap-8 text-sm font-semibold text-muted-foreground">
        <Link to="/partner-info" className="hover:text-primary transition-colors">Sé un Aliado</Link>
        <Link to="/login" className="hover:text-primary transition-colors">Iniciar Sesión</Link>
      </div>
    </div>
  </footer>
);

export default Footer;
