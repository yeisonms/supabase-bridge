import LandingNavbar from '@/components/landing/LandingNavbar';
import Footer from '@/components/landing/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import {
  Dumbbell, Heart, Swords, Music, Waves, Zap,
  DollarSign, CalendarCheck, Megaphone,
  UserPlus, Users, QrCode, Banknote,
  ArrowRight,
} from 'lucide-react';

import yogaImg from '@/assets/partner-yoga.jpg';
import danceImg from '@/assets/partner-dance.jpg';
import martialImg from '@/assets/partner-martial.jpg';
import weightsImg from '@/assets/partner-weights.jpg';

/* ── Data ── */

const disciplines = [
  { icon: Dumbbell, title: 'Gimnasio & Fitness', desc: 'Pesas y Cardio' },
  { icon: Heart, title: 'Mente y Cuerpo', desc: 'Yoga, Pilates y Barre' },
  { icon: Swords, title: 'Artes Marciales', desc: 'Karate, Boxeo, Muay Thai, Jiu-Jitsu' },
  { icon: Music, title: 'Danza', desc: 'Salsa, Bachata, Urbano, Ballet' },
  { icon: Waves, title: 'Deportes', desc: 'Natación, Tenis, Pádel' },
  { icon: Zap, title: 'Funcional', desc: 'Crossfit, HIIT, Bootcamps' },
];

const benefits = [
  { icon: DollarSign, title: 'Sin Costos Fijos', desc: 'Registro gratuito. Solo ganamos si tú ganas.' },
  { icon: CalendarCheck, title: 'Ocupa tus Vacíos', desc: 'Llena las clases de la mañana o los horarios valle con nuevos usuarios.' },
  { icon: Megaphone, title: 'Marketing Gratuito', desc: 'Te damos visibilidad ante miles de empleados y usuarios corporativos.' },
];

const steps = [
  { icon: UserPlus, title: 'Regístrate', desc: 'Crea tu perfil en minutos.' },
  { icon: Users, title: 'Recibe', desc: 'Los usuarios reservan o llegan a tu puerta.' },
  { icon: QrCode, title: 'Valida', desc: 'Escanea su código QR con nuestra App de Partners.' },
  { icon: Banknote, title: 'Cobra', desc: 'Recibe tus pagos puntualmente cada mes.' },
];

const heroImages = [
  { src: yogaImg, alt: 'Persona haciendo yoga' },
  { src: danceImg, alt: 'Persona bailando' },
  { src: martialImg, alt: 'Artes marciales' },
  { src: weightsImg, alt: 'Levantando pesas' },
];

/* ── Page ── */

const PartnerInfo = () => (
  <div className="min-h-screen bg-background">
    <LandingNavbar />

    {/* ── Hero ── */}
    <section className="pt-28 pb-20 md:pt-36 md:pb-28">
      <div className="container px-4 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Copy */}
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6">
              Haz crecer tu negocio con{' '}
              <span className="text-gradient">RedFit</span>.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-lg mx-auto md:mx-0">
              Conectamos a miles de usuarios con tu pasión. Ya sea un Dojo, un
              Estudio de Yoga, una Academia de Baile o un Centro de Fitness.
            </p>
            <Link to="/partner/register">
              <Button variant="hero" size="lg" className="rounded-full px-10 py-6 text-lg">
                Registrar mi Centro <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Image grid */}
          <div className="grid grid-cols-2 gap-3">
            {heroImages.map((img) => (
              <div key={img.alt} className="aspect-[3/4] rounded-2xl overflow-hidden shadow-card">
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* ── Disciplines ── */}
    <section className="py-20 bg-secondary/50">
      <div className="container px-4 max-w-5xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-black mb-4">
          Tu disciplina tiene lugar aquí
        </h2>
        <p className="text-muted-foreground mb-12 max-w-xl mx-auto">
          Aceptamos todo tipo de centro deportivo y de bienestar.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {disciplines.map((d) => (
            <Card key={d.title} className="border-0 shadow-card hover:shadow-elevated transition-shadow">
              <CardContent className="flex flex-col items-center text-center p-6 gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <d.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg">{d.title}</h3>
                <p className="text-sm text-muted-foreground">{d.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>

    {/* ── Benefits ── */}
    <section className="py-20">
      <div className="container px-4 max-w-5xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-black mb-4">
          ¿Por qué unirte a <span className="text-gradient">RedFit</span>?
        </h2>
        <p className="text-muted-foreground mb-12 max-w-xl mx-auto">
          Todo lo que necesitas para llenar tu centro, sin riesgo.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {benefits.map((b) => (
            <Card key={b.title} className="border-0 shadow-card">
              <CardContent className="p-8 flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <b.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-bold text-xl">{b.title}</h3>
                <p className="text-muted-foreground">{b.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>

    {/* ── How it works ── */}
    <section className="py-20 bg-secondary/50">
      <div className="container px-4 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-black mb-12">Cómo funciona</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
          {steps.map((s, i) => (
            <div key={s.title} className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-black">
                  {i + 1}
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-lg bg-card shadow-card flex items-center justify-center">
                  <s.icon className="h-4 w-4 text-primary" />
                </div>
              </div>
              <h3 className="font-bold text-lg">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── CTA Final ── */}
    <section className="bg-hero-gradient py-20">
      <div className="container px-4 text-center max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-black text-primary-foreground mb-4">
          ¿Listo para aumentar tus ingresos?
        </h2>
        <p className="text-primary-foreground/80 mb-8 text-lg">
          Únete a la red de centros deportivos de más rápido crecimiento.
        </p>
        <Link to="/partner/register">
          <Button
            size="lg"
            className="rounded-full px-10 py-6 text-lg bg-white text-primary hover:bg-white/90 font-bold"
          >
            Únete a la red RedFit
          </Button>
        </Link>
      </div>
    </section>

    <Footer />
  </div>
);

export default PartnerInfo;
