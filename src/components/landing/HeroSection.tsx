import { Link } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import heroImg from "@/assets/fondo.png";
import img1 from "@/assets/hero-gym.jpg";
import img2 from "@/assets/partner-yoga.jpg";
import img3 from "@/assets/partner-weights.jpg";
import img4 from "@/assets/partner-martial.jpg";
import img5 from "@/assets/partner-dance.jpg";

const carouselImages = [img1, img2, img3, img4, img5];
const carouselAlts = [
  "Centro de entrenamiento fitness",
  "Estudio de yoga y bienestar",
  "Centro de pesas y fuerza",
  "Centro de artes marciales",
  "Estudio de danza y movimiento",
];

const HeroSection = () => {
  const isMobile = useIsMobile();
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % carouselImages.length);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const id = setInterval(next, 3500);
    return () => clearInterval(id);
  }, [isMobile, next]);

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Desktop: static collage */}
      {!isMobile && (
        <img
          src={heroImg}
          alt="Collage de centros de bienestar y deporte"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
      )}

      {/* Mobile: crossfade carousel */}
      {isMobile &&
        carouselImages.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={carouselAlts[i]}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
            style={{ opacity: i === current ? 1 : 0 }}
            loading={i === 0 ? "eager" : "lazy"}
          />
        ))}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-hero-overlay" />

      <div className="relative z-10 container text-center px-4 py-24 flex flex-col items-center justify-center min-h-[90vh]">
        <h1 className="text-5xl sm:text-6xl md:text-8xl font-black leading-tight text-white mb-6 drop-shadow-2xl animate-fade-in">
          Una suscripción.
          <br />
          <span className="text-gradient">Cientos de centros.</span>
        </h1>
        <p
          className="text-lg sm:text-2xl text-white/90 max-w-2xl mx-auto mb-12 drop-shadow-md animate-fade-in font-medium"
          style={{ animationDelay: "0.15s" }}
        >
          Entrena donde quieras, cuando quieras. Sin ataduras, sin límites.
        </p>
        <div
          className="flex flex-col sm:flex-row gap-6 justify-center animate-slide-up w-full max-w-md sm:max-w-none mx-auto"
          style={{ animationDelay: "0.3s" }}
        >
          <Link to="/register" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto px-12 py-7 text-xl font-bold rounded-full shadow-elevated hover:shadow-primary/60 hover:scale-105 transition-all bg-primary hover:bg-primary/90 text-white border-0">
              Comenzar Ahora
            </Button>
          </Link>
          <Button
            size="lg"
            className="w-full sm:w-auto px-12 py-7 text-xl font-bold rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition-all hover:scale-105"
            onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
          >
            Cómo Funciona
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
