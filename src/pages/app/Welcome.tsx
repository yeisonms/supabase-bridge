import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PartyPopper, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const Welcome = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(5);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  // Detect if user is coming back from Wompi redirect
  const fromWompi = searchParams.has('id') || searchParams.has('env');

  useEffect(() => {
    if (!fromWompi) {
      // Normal welcome flow: just countdown
      startCountdown();
      return;
    }

    // Coming from Wompi: verify payment by refetching profile
    const verifyPayment = async () => {
      setVerifying(true);

      // Poll for up to 10s waiting for webhook to update the profile
      let attempts = 0;
      const maxAttempts = 10;

      const poll = async () => {
        attempts++;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setVerifying(false);
          startCountdown();
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_status')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.subscription_status === 'active') {
          setVerifying(false);
          setVerified(true);
          startCountdown();
        } else if (attempts < maxAttempts) {
          setTimeout(poll, 1000);
        } else {
          // Timeout: proceed anyway, webhook may still be processing
          setVerifying(false);
          setVerified(true);
          startCountdown();
        }
      };

      poll();
    };

    verifyPayment();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCountdown = () => {
    let count = 5;
    setCountdown(count);
    const timer = setInterval(() => {
      count--;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(timer);
        navigate('/app');
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md mx-auto space-y-6">
        {verifying ? (
          <>
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-foreground">
              Verificando tu pago con el banco...
            </h1>
            <p className="text-muted-foreground">
              Espera un momento mientras confirmamos tu transacción.
            </p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              {verified ? (
                <CheckCircle className="h-10 w-10 text-primary" />
              ) : (
                <PartyPopper className="h-10 w-10 text-primary" />
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-foreground">
              ¡Bienvenido al Club! 🎉
            </h1>
            <p className="text-muted-foreground text-lg">
              {verified
                ? '¡Pago confirmado! Tu plan está activo. Empieza a entrenar hoy mismo.'
                : 'Tu plan está activo. Explora nuestra red de centros y comienza a entrenar hoy mismo.'}
            </p>
            <Button size="lg" className="text-base font-bold" onClick={() => navigate('/app')}>
              Ir a mi Dashboard <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <p className="text-xs text-muted-foreground">
              Redirigiendo en {countdown}s…
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Welcome;
