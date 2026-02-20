import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, CreditCard, Lock, ArrowLeft, Check, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import LandingNavbar from '@/components/landing/LandingNavbar';
import { openWompiCheckout } from '@/hooks/use-wompi';
import type { Plan } from '@/types/database';



const Checkout = () => {
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('planId');
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [processing, setProcessing] = useState(false);

  const { data: plan, isLoading } = useQuery({
    queryKey: ['plan', planId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('id', Number(planId))
        .single();
      if (error) throw error;
      return data as Plan;
    },
    enabled: !!planId,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error('Inicia sesión para continuar');
      navigate('/login');
    }
  }, [authLoading, user, navigate]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(price);

  const handlePay = async () => {
    if (!user || !plan) return;

    setProcessing(true);

    const reference = `${user.id}_${Date.now()}`;
    const amountInCents = Math.round(plan.price * 100);

    try {
      await openWompiCheckout({
        currency: 'COP',
        amountInCents,
        reference,
        redirectUrl: `${window.location.origin}/app/welcome`,
        onSuccess: () => {
          toast.success('¡Pago en proceso de confirmación! Tu plan estará activo en breve.');
          navigate('/app/welcome');
        },
        onDeclined: () => {
          toast.error('El pago fue rechazado. Por favor intenta con otra tarjeta.');
        },
      });
    } catch (err) {
      console.error('Wompi error:', err);
      toast.error('No se pudo abrir la pasarela de pago. Intenta de nuevo.');
    } finally {
      setProcessing(false);
    }
  };

  if (!planId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No se seleccionó ningún plan.</p>
          <Link to="/plans"><Button>Ver planes</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />
      <div className="pt-28 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/plans" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" /> Volver a planes
          </Link>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : plan ? (
            <div className="grid md:grid-cols-5 gap-8">
              {/* Order Summary */}
              <Card className="md:col-span-2 h-fit">
                <CardHeader>
                  <CardTitle className="text-lg">Resumen del pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-bold text-xl text-foreground">Plan {plan.name}</p>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  <ul className="space-y-2">
                    {plan.features?.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total mensual</span>
                    <span className="text-2xl font-black text-foreground">{formatPrice(plan.price)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Se renueva automáticamente cada 30 días. Cancela cuando quieras.</p>
                </CardContent>
              </Card>

              {/* Wompi Payment Panel */}
              <Card className="md:col-span-3">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5" /> Pago seguro con Wompi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Trust badges */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: ShieldCheck, label: 'Pago 100% seguro', sub: 'Cifrado SSL/TLS' },
                      { icon: Lock, label: 'Datos protegidos', sub: 'PCI DSS Nivel 1' },
                    ].map((badge) => (
                      <div key={badge.label} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                        <badge.icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-foreground">{badge.label}</p>
                          <p className="text-xs text-muted-foreground">{badge.sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Accepted payment methods */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Métodos de pago aceptados</p>
                    <div className="flex flex-wrap gap-2">
                      {['Visa', 'Mastercard', 'PSE', 'Nequi', 'Daviplata'].map((method) => (
                        <span
                          key={method}
                          className="px-3 py-1 rounded-full border border-border text-xs font-medium text-muted-foreground bg-background"
                        >
                          {method}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Al hacer clic en el botón, se abrirá el portal seguro de Wompi para completar tu pago de{' '}
                      <span className="font-bold text-foreground">{formatPrice(plan.price)}</span>.
                    </p>

                    <Button
                      className="w-full text-base font-bold"
                      size="lg"
                      onClick={handlePay}
                      disabled={processing}
                    >
                      {processing ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Generando pago seguro…
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-5 w-5 mr-2" />
                          Suscribirse Ahora · {formatPrice(plan.price)}
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Lock className="h-3 w-3" /> Serás redirigido al portal seguro de Wompi
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <p className="text-center text-muted-foreground">Plan no encontrado.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;
