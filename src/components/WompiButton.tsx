import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WompiButtonProps {
  amountInCents: number;
  reference: string;
  label?: string;
}

export const WompiButton = ({ amountInCents, reference, label }: WompiButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const publicKey = import.meta.env.VITE_WOMPI_PUBLIC_KEY;
      const currency = 'COP';

      if (!publicKey) {
        console.error('Falta VITE_WOMPI_PUBLIC_KEY en las variables de entorno');
        toast.error('Error de configuración de pagos.');
        setIsLoading(false);
        return;
      }

      // 1. Obtener firma del backend
      const res = await fetch('/api/wompi-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, amountInCents, currency }),
      });

      const data = await res.json();

      if (!data.signature) throw new Error('Error de firma');

      // 2. Construir la URL de Checkout de Wompi
      const wompiUrl = new URL('https://checkout.wompi.co/p/');
      wompiUrl.searchParams.append('public-key', publicKey);
      wompiUrl.searchParams.append('currency', currency);
      wompiUrl.searchParams.append('amount-in-cents', amountInCents.toString());
      wompiUrl.searchParams.append('reference', reference);
      wompiUrl.searchParams.append('signature:integrity', data.signature);
      wompiUrl.searchParams.append('redirect-url', window.location.origin + '/app/welcome');

      // 3. Redirigir al usuario a Wompi
      window.location.href = wompiUrl.toString();

    } catch (error) {
      console.error('Error procesando pago:', error);
      toast.error('No se pudo iniciar el pago. Intenta de nuevo.');
      setIsLoading(false);
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
          Preparando pago seguro…
        </>
      ) : (
        <>
          <ExternalLink className="h-5 w-5 mr-2" />
          {label ?? 'Ir a Pagar de Forma Segura'}
        </>
      )}
    </Button>
  );
};
