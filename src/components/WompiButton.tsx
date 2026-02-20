import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WompiButtonProps {
  amountInCents: number;
  reference: string;
  label?: string;
  onSuccess?: () => void;
  onDeclined?: () => void;
}

export const WompiButton = ({
  amountInCents,
  reference,
  label,
  onSuccess,
  onDeclined,
}: WompiButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    setIsLoading(true);

    try {
      // 1. Obtener la Firma de Integridad (Backend)
      const res = await fetch('/api/wompi-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, amountInCents, currency: 'COP' }),
      });

      const data = await res.json();

      if (!data.signature) {
        throw new Error('No se pudo generar la firma de seguridad');
      }

      // 2. Inyectar Wompi SOLO cuando hacemos clic
      // Si ya existe el script cargado, lo eliminamos para evitar duplicados
      const existing = document.querySelector('script[src="https://checkout.wompi.co/widget.js"]');
      if (existing) {
        existing.remove();
        // Limpiar referencia global para que el nuevo script registre limpio
        delete (window as any).WidgetCheckout;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.wompi.co/widget.js';

      script.onload = () => {
        setIsLoading(false);

        // LLAVE QUEMADA DIRECTAMENTE AQUÍ
        const checkout = new (window as any).WidgetCheckout({
          currency: 'COP',
          amountInCents: amountInCents,
          reference: reference,
          publicKey: 'pub_test_Xd3ANi4mJvi1nS6W1VO0SLulFQbMysX2',
          signature: { integrity: data.signature },
        });

        checkout.open(function (result: { transaction: { status: string } }) {
          const status = result?.transaction?.status;
          if (status === 'APPROVED') {
            toast.success('¡Pago en proceso de confirmación! Tu plan estará activo en breve.');
            onSuccess?.();
          } else {
            toast.error('El pago no pudo ser procesado. Intenta de nuevo.');
            onDeclined?.();
          }
        });
      };

      script.onerror = () => {
        setIsLoading(false);
        toast.error('No se pudo cargar la pasarela de pagos.');
      };

      document.body.appendChild(script);
    } catch (error) {
      console.error('[WompiButton] Error:', error);
      setIsLoading(false);
      toast.error('Error al iniciar el pago. Intenta de nuevo.');
    }
  };

  return (
    <Button
      className="w-full text-base font-bold"
      size="lg"
      onClick={handlePayment}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Conectando con el banco…
        </>
      ) : (
        <>
          <CreditCard className="h-5 w-5 mr-2" />
          {label ?? 'Suscribirse Ahora'}
        </>
      )}
    </Button>
  );
};
