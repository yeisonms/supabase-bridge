import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="border-t py-10 bg-background">
    <div className="container px-4 flex flex-col md:flex-row items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">
        © {new Date().getFullYear()} <span className="font-bold text-foreground">RedFit</span>. Todos los derechos reservados.
      </p>
      <div className="flex gap-6 text-sm text-muted-foreground">
        <Link to="/partner-info" className="hover:text-foreground transition-colors">Soy Gimnasio</Link>
        <Link to="/login" className="hover:text-foreground transition-colors">Iniciar Sesión</Link>
      </div>
    </div>
  </footer>
);

export default Footer;
