import LandingNavbar from '@/components/landing/LandingNavbar';
import Footer from '@/components/landing/Footer';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Building2, Users, BarChart3, CheckCircle } from 'lucide-react';

const benefits = [
  { icon: Users, text: 'Recibe nuevos clientes cada día sin costo de adquisición' },
  { icon: BarChart3, text: 'Dashboard en tiempo real con métricas de visitas' },
  { icon: CheckCircle, text: 'Control total de aforo y validación de usuarios' },
];

const PartnerInfo = () => (
  <div className="min-h-screen">
    <LandingNavbar />
    <main className="pt-24 pb-20">
      <section className="container px-4 text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Building2 className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl md:text-5xl font-black mb-4">
          Únete a la red de <span className="text-gradient">gimnasios</span> más grande
        </h1>
        <p className="text-lg text-muted-foreground mb-12">
          Aumenta la visibilidad de tu gimnasio y recibe miembros de RedFit cada día.
        </p>

        <div className="space-y-6 text-left mb-12">
          {benefits.map((b) => (
            <div key={b.text} className="flex items-start gap-4 bg-card rounded-xl p-5 shadow-card">
              <b.icon className="h-6 w-6 text-primary mt-0.5 shrink-0" />
              <p className="font-medium">{b.text}</p>
            </div>
          ))}
        </div>

        <Link to="/register">
          <Button variant="hero" size="lg" className="rounded-full px-10 py-6 text-lg">
            Registrar mi Gimnasio
          </Button>
        </Link>
      </section>
    </main>
    <Footer />
  </div>
);

export default PartnerInfo;
