import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PartyPopper, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Welcome = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/app');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md mx-auto space-y-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <PartyPopper className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-foreground">
          ¡Bienvenido al Club! 🎉
        </h1>
        <p className="text-muted-foreground text-lg">
          Tu plan está activo. Explora nuestra red de centros y comienza a entrenar hoy mismo.
        </p>
        <Button size="lg" className="text-base font-bold" onClick={() => navigate('/app')}>
          Ir a mi Dashboard <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
        <p className="text-xs text-muted-foreground">
          Redirigiendo en {countdown}s…
        </p>
      </div>
    </div>
  );
};

export default Welcome;
