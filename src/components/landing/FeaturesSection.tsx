import { ClipboardList, MapPin, QrCode } from 'lucide-react';

const steps = [
  {
    icon: ClipboardList,
    title: 'Elige tu Plan',
    desc: 'Selecciona el plan que se adapte a tu estilo de vida y presupuesto.',
  },
  {
    icon: MapPin,
    title: 'Encuentra un Gym',
    desc: 'Descubre gimnasios y centros deportivos cerca de ti en tiempo real.',
  },
  {
    icon: QrCode,
    title: 'Escanea y Entra',
    desc: 'Muestra tu pase QR en la recepción y comienza a entrenar.',
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 md:py-28 bg-secondary">
      <div className="container px-4">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-4">
          Así de <span className="text-gradient">fácil</span> es
        </h2>
        <p className="text-muted-foreground text-center mb-16 max-w-md mx-auto">
          En 3 simples pasos, tendrás acceso a la red de gimnasios más grande.
        </p>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="bg-card rounded-2xl p-8 text-center shadow-card animate-fade-in"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <step.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
