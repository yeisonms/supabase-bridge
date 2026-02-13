import { Check, Smartphone, Globe, QrCode, Dumbbell, MessageCircle, ShieldCheck, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import LandingNavbar from '@/components/landing/LandingNavbar';
import Footer from '@/components/landing/Footer';
import appMockup from '@/assets/app-mockup.png';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Plan } from '@/types/database';

const guarantees = [
  { icon: ShieldCheck, text: 'Sin cláusulas de permanencia' },
  { icon: Smartphone, text: 'Cancelación online en un clic' },
  { icon: MessageCircle, text: 'Soporte por WhatsApp 24/7' },
];

const faqs = [
  {
    q: '¿Cómo funciona el cobro?',
    a: 'Tu plan se cobra automáticamente cada mes a la tarjeta registrada. No hay cobros ocultos ni cuotas adicionales. Puedes ver tu próxima fecha de cobro desde tu perfil.',
  },
  {
    q: '¿Puedo ir a diferentes gimnasios el mismo día?',
    a: 'Puedes registrar un check-in por día en cualquier centro de nuestra red. Al día siguiente, eres libre de elegir otro lugar completamente distinto.',
  },
  {
    q: '¿Qué pasa si viajo a otra ciudad?',
    a: 'RedFit funciona en toda nuestra red de aliados. Si viajamos a una ciudad donde tenemos cobertura, podrás seguir entrenando con tu mismo plan sin costo extra.',
  },
];

const Plans = () => {
  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('price', { ascending: true });
      if (error) throw error;
      return data as Plan[];
    },
  });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(price);

  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />

      {/* Hero */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-24 text-center px-4">
        <h1 className="text-4xl md:text-5xl font-black text-foreground max-w-3xl mx-auto leading-tight">
          Un plan para cada meta.{' '}
          <span className="text-gradient">Sin matrículas ni contratos.</span>
        </h1>
        <p className="text-muted-foreground mt-4 text-lg max-w-xl mx-auto">
          Cambia, pausa o cancela cuando quieras. Tú tienes el control.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
            {plans?.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-8 flex flex-col transition-shadow ${
                  plan.is_featured
                    ? 'border-2 border-primary shadow-lg scale-[1.03] bg-card'
                    : 'border border-border shadow-sm bg-card'
                }`}
              >
                {plan.is_featured && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 text-xs font-bold">
                    🔥 Más Popular
                  </Badge>
                )}
                <h3 className="text-2xl font-bold text-foreground mb-1">Plan {plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-5">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-black text-foreground">{formatPrice(plan.price)}</span>
                  <span className="text-muted-foreground text-sm"> / mes</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features?.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to={`/checkout?planId=${plan.id}`}>
                  <Button className="w-full text-base" variant={plan.is_featured ? 'default' : 'outline'} size="lg">
                    Elegir {plan.name}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
        <p className="text-center text-muted-foreground text-xs mt-8">
          Puedes cancelar o cambiar tu plan en cualquier momento desde tu perfil.
        </p>
      </section>

      {/* App Showcase — Bienestar 360° */}
      <section className="py-20 md:py-28 bg-muted/40 px-4">
        <div className="container max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4">
              Tu bienestar, <span className="text-gradient">simplificado</span> en una App.
            </h2>
            <p className="text-muted-foreground mb-8">
              Gestiona todo desde tu celular. No solo es fitness; es yoga, es baile, es combate.
            </p>
            <ul className="space-y-5">
              {[
                { icon: QrCode, label: 'Check-in QR', desc: 'Entra sin carnets plásticos.' },
                { icon: Dumbbell, label: 'Clases', desc: 'Reserva en estudios de Yoga o Academias de Baile.' },
                { icon: Globe, label: 'Libertad', desc: 'Entrena cerca de casa o del trabajo.' },
              ].map((item) => (
                <li key={item.label} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{item.label}</p>
                    <p className="text-muted-foreground text-sm">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-center">
            <img
              src={appMockup}
              alt="RedFit App mostrando categorías de actividades"
              className="w-64 md:w-80 rounded-3xl shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Guarantees */}
      <section className="py-12 border-y bg-background px-4">
        <div className="container max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
          {guarantees.map((g) => (
            <div key={g.text} className="flex items-center gap-3">
              <g.icon className="h-5 w-5 text-primary shrink-0" />
              <span className="text-sm font-medium text-foreground">{g.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="container max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-black text-center mb-10 text-foreground">
            Preguntas Frecuentes
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left font-semibold">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 bg-primary px-4">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-black text-primary-foreground mb-4">
            ¿Listo para empezar?
          </h2>
          <Link to="/register">
            <Button size="lg" variant="secondary" className="text-base font-bold px-8">
              Crear cuenta gratis
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Plans;
