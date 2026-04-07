import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { useAuth } from '@/contexts/AuthContext';
import { Progress } from '@/components/ui/progress';

const QR_REFRESH_SECONDS = 30;

const Pass = () => {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  const [qrData, setQrData] = useState('');
  const [elapsed, setElapsed] = useState(0);

  // Generate QR data with timestamp
  useEffect(() => {
    const generate = () => {
      setQrData(JSON.stringify({ id: user?.id, timestamp: Date.now() }));
      setElapsed(0);
    };

    generate();
    const interval = setInterval(generate, QR_REFRESH_SECONDS * 1000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Progress bar tick every second
  useEffect(() => {
    const tick = setInterval(() => {
      setElapsed((prev) => Math.min(prev + 1, QR_REFRESH_SECONDS));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const progressValue = (elapsed / QR_REFRESH_SECONDS) * 100;

  return (
    <div className="px-4 pt-12 pb-4 flex flex-col items-center">
      <h1 className="text-2xl font-black mb-2">Mi Pase</h1>
      <p className="text-muted-foreground text-sm mb-8 text-center">
        Muestra este código QR en la recepción del centro aliado
      </p>

      <div className="bg-card rounded-3xl shadow-elevated p-8 border w-full max-w-xs relative">
        {/* Animated pulse ring */}
        <div className="absolute -inset-1 rounded-3xl border-2 border-primary/40 animate-pulse pointer-events-none" />

        <div className="bg-white rounded-2xl p-6 flex flex-col items-center justify-center border-4 border-white">
          <div className="bg-white p-2">
            <QRCode
              value={qrData || '{}'}
              size={220}
              bgColor="#FFFFFF"
              fgColor="#000000"
              level="H"
            />
          </div>
        </div>

        {/* Refresh progress bar */}
        <div className="mt-4">
          <Progress value={progressValue} className="h-1.5" />
          <p className="text-[10px] text-muted-foreground text-center mt-1">
            Se renueva en {QR_REFRESH_SECONDS - elapsed}s
          </p>
        </div>

        <div className="text-center mt-4">
          <p className="text-xs text-muted-foreground">Válido para</p>
          <p className="font-bold text-lg">{today}</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-6 text-center max-w-xs">
        Este código se renueva automáticamente. El staff del centro aliado lo escaneará para validar tu acceso.
      </p>
    </div>
  );
};

export default Pass;
