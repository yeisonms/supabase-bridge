import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import heroImg from '@/assets/hero-gym.jpg';

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <img
        src={heroImg}
        alt="Personas entrenando en un gimnasio moderno"
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-hero-overlay" />

      <div className="relative z-10 container text-center px-4 py-20">
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black leading-tight text-primary-foreground mb-6 animate-fade-in">
          Una suscripción.
          <br />
          <span className="text-gradient">Cientos de gimnasios.</span>
        </h1>
        <p className="text-lg sm:text-xl text-primary-foreground/80 max-w-xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: '0.15s' }}>
          Entrena donde quieras, cuando quieras. Sin ataduras, sin límites.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <Link to="/register">
            <Button variant="hero" size="lg" className="w-full sm:w-auto px-10 py-6 text-lg rounded-full">
              Comenzar Ahora
            </Button>
          </Link>
          <Button
            variant="hero-outline"
            size="lg"
            className="w-full sm:w-auto px-10 py-6 text-lg rounded-full"
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Cómo Funciona
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
