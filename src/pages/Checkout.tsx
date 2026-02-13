import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, CreditCard, Lock, ArrowLeft, Check } from 'lucide-react';
import { toast } from 'sonner';
import LandingNavbar from '@/components/landing/LandingNavbar';
import type { Plan } from '@/types/database';

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('planId');
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
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

  const formatCardNumber = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 4);
    if (digits.length > 2) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(price);

  const isFormValid = cardNumber.replace(/\s/g, '').length === 16 && cardName.length > 2 && expiry.length === 5 && cvv.length >= 3;

  const handlePay = async () => {
    if (!user || !plan) return;
    setProcessing(true);

    // Simulate 2-second payment processing
    await new Promise((r) => setTimeout(r, 2000));

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 30);

    // Update profile with subscription info
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        current_plan_id: plan.id,
        subscription_status: 'active',
        plan_start_date: now.toISOString(),
        plan_end_date: endDate.toISOString(),
      })
      .eq('id', user.id);

    if (profileError) {
      toast.error('Error al activar tu plan: ' + profileError.message);
      setProcessing(false);
      return;
    }

    // Record payment
    const { error: paymentError } = await supabase.from('payments').insert({
      user_id: user.id,
      plan_id: plan.id,
      amount: plan.price,
      status: 'completed',
    });

    if (paymentError) {
      console.warn('Payment record failed:', paymentError.message);
    }

    setProcessing(false);
    navigate('/app/welcome');
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
                  <CardTitle className="text-lg">Resumen</CardTitle>
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

              {/* Payment Form */}
              <Card className="md:col-span-3">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5" /> Datos de pago
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="cardName">Nombre en la tarjeta</Label>
                    <Input
                      id="cardName"
                      placeholder="Juan Pérez"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      disabled={processing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Número de tarjeta</Label>
                    <Input
                      id="cardNumber"
                      placeholder="4242 4242 4242 4242"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      disabled={processing}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Vencimiento</Label>
                      <Input
                        id="expiry"
                        placeholder="MM/AA"
                        value={expiry}
                        onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                        disabled={processing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        placeholder="123"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        disabled={processing}
                        type="password"
                      />
                    </div>
                  </div>

                  <Button
                    className="w-full text-base font-bold"
                    size="lg"
                    onClick={handlePay}
                    disabled={!isFormValid || processing}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Procesando pago…
                      </>
                    ) : (
                      <>Pagar {formatPrice(plan.price)}</>
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                    <Lock className="h-3 w-3" /> Pago simulado · Tus datos no se almacenan
                  </p>
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
