import { MapPin, QrCode, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const steps = [
  {
    icon: MapPin,
    title: '1. Encuentra tu lugar',
    desc: 'Usa nuestra app para descubrir gimnasios, dojos de karate, escuelas de baile o estudios de yoga cerca de ti. Todo en un solo mapa.',
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
    <section id="features" className="py-20 md:py-28 bg-[#F8F9FA]">
      <div className="container px-4">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-3 text-foreground">
          Una sola membresía. <span className="text-gradient">Infinitas posibilidades.</span>
        </h2>
        <p className="text-muted-foreground text-center mb-16 max-w-lg mx-auto text-base">
          Olvídate de las matrículas y contratos fijos.
        </p>
        <div className="grid md:grid-cols-3 gap-10 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="text-center animate-fade-in"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <step.icon className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">{step.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-14">
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
