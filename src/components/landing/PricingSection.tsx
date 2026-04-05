import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const plans = [
  {
    name: 'Lite',
    price: '$59.900',
    tagline: 'Para empezar tu rutina.',
    featured: false,
    benefits: [
      'Acceso a centros deportivos básicos',
      '15 ingresos mensuales',
      '1 ingreso diario',
    ],
  },
  {
    name: 'Mid',
    price: '$89.900',
    tagline: 'Variedad total para tu semana.',
    featured: false,
    benefits: [
      'Todo lo del Plan Lite +',
      'Acceso a centros deportivos premium',
      '20 ingresos mensuales',
    ],
  },
  {
    name: 'Plus',
    price: '$110.000',
    tagline: 'Variedad premium.',
    featured: true,
    benefits: [
      'Todo lo del Plan Mid +',
      'Acceso a centros deportivos exclusivos',
      '20 ingresos mensuales',
      'Acceso prioritario',
    ],
  },
  {
    name: 'Unlimited',
    price: '$159.900',
    tagline: 'Entrena como un atleta.',
    featured: false,
    benefits: [
      'Todo lo del Plan Plus +',
      'Acceso ilimitado a toda la red',
      '25 ingresos mensuales',
      'Clases exclusivas',
    ],
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-24 md:py-32 bg-secondary/30 relative">
      <div className="container px-4">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-3 text-foreground">
          Planes <span className="text-gradient">Flexibles</span>
        </h2>
        <p className="text-muted-foreground text-center mb-14 max-w-lg mx-auto text-base">
          Elige el plan que se adapte a tu ritmo. Sin contratos, sin sorpresas.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-3xl p-10 flex flex-col transition-all duration-300 ${plan.featured
                  ? 'glass-card border-2 border-primary shadow-elevated md:scale-[1.05] z-10'
                  : 'glassmorphism border border-border/50 shadow-md hover:border-primary/50'
                }`}
            >
              {plan.featured && (
                <Badge className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-6 py-1.5 text-sm font-bold shadow-lg shadow-primary/30 uppercase tracking-wider rounded-full">
                  🔥 Más Popular
                </Badge>
              )}

              <h3 className="text-3xl font-bold text-foreground mb-2">Plan {plan.name}</h3>
              <p className="text-muted-foreground text-sm mb-8">{plan.tagline}</p>

              <div className="mb-6">
                <span className="text-4xl font-black text-foreground">{plan.price}</span>
                <span className="text-muted-foreground text-sm"> / mes</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.benefits.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <Link to={`/register?plan=${plan.name.toLowerCase()}`} className="mt-auto">
                <Button
                  className={`w-full text-lg py-6 rounded-2xl transition-all ${plan.featured
                      ? 'bg-primary hover:bg-primary/90 shadow-elevated hover:shadow-primary/50 text-white'
                      : 'bg-white/5 hover:bg-white/10 text-foreground border-white/10'
                    }`}
                  variant={plan.featured ? 'default' : 'outline'}
                >
                  Elegir {plan.name}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-muted-foreground text-xs mt-8">
          Puedes cancelar o cambiar tu plan en cualquier momento desde tu perfil.
        </p>
      </div>
    </section>
  );
};

export default PricingSection;
