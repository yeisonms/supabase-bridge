import { MapPin, QrCode, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const steps = [
  {
    icon: MapPin,
    title: '1. Encuentra tu lugar',
    desc: 'Usa nuestra app para descubrir centros de bienestar y deporte cerca de ti: gimnasios, dojos, estudios de yoga, academias de baile y más. Todo en un solo mapa.',
  },
  {
    icon: QrCode,
    title: '2. Escanea y entra',
    desc: 'Sin trámites ni llamadas. Al llegar, simplemente escanea el código QR en la recepción con tu celular y ¡listo!',
  },
  {
    icon: Zap,
    title: '3. Entrena y repite',
    desc: 'Disfruta tu clase. Mañana puedes probar algo totalmente diferente. Tu saldo se adapta a tu ritmo de vida.',
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 md:py-32 bg-background relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="container px-4">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-3 text-foreground">
          Una sola membresía. <span className="text-gradient">Infinitas posibilidades.</span>
        </h2>
        <p className="text-muted-foreground text-center mb-16 max-w-lg mx-auto text-base">
          Olvídate de las matrículas y contratos fijos.
        </p>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto relative z-10">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="glass-card p-10 rounded-2xl text-center animate-fade-in hover:-translate-y-2 transition-transform duration-300"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-8 shadow-inner border border-primary/20">
                <step.icon className="h-10 w-10 text-primary drop-shadow-md" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-foreground">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-16 relative z-10">
          <Link to="/register">
            <Button size="lg" className="text-base px-8">
              Ver planes disponibles
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
