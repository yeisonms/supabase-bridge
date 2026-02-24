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
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative z-10 container text-center px-4 py-20">
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black leading-tight text-primary-foreground mb-6 animate-fade-in">
          Una suscripción.
          <br />
          <span className="text-gradient">Cientos de centros.</span>
        </h1>
        <p
          className="text-lg sm:text-xl text-primary-foreground/80 max-w-xl mx-auto mb-10 animate-fade-in"
          style={{ animationDelay: "0.15s" }}
        >
          Entrena donde quieras, cuando quieras. Sin ataduras, sin límites.
        </p>
        <div
          className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up"
          style={{ animationDelay: "0.3s" }}
        >
          <Link to="/register">
            <Button variant="hero" size="lg" className="w-full sm:w-auto px-10 py-6 text-lg rounded-full">
              Comenzar Ahora
            </Button>
          </Link>
          <Button
            variant="hero-outline"
            size="lg"
            className="w-full sm:w-auto px-10 py-6 text-lg rounded-full"
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
