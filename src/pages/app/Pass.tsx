import QRCode from 'react-qr-code';
import { useAuth } from '@/contexts/AuthContext';

const Pass = () => {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const qrData = JSON.stringify({ id: user?.id, type: "access_pass" });

  return (
    <div className="px-4 pt-12 pb-4 flex flex-col items-center">
      <h1 className="text-2xl font-black mb-2">Mi Pase</h1>
      <p className="text-muted-foreground text-sm mb-8 text-center">
        Muestra este código QR en la recepción del gimnasio
      </p>

      <div className="bg-card rounded-3xl shadow-elevated p-8 border w-full max-w-xs">
        <div className="bg-background rounded-2xl p-4 flex items-center justify-center">
          <QRCode
            value={qrData}
            size={200}
            bgColor="hsl(0 0% 100%)"
            fgColor="hsl(0 0% 8%)"
          />
        </div>
        <div className="text-center mt-6">
          <p className="text-xs text-muted-foreground">Válido para</p>
          <p className="font-bold text-lg">{today}</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-6 text-center max-w-xs">
        Este código se renueva cada día. El staff del gimnasio lo escaneará para validar tu acceso.
      </p>
    </div>
  );
};

export default Pass;
