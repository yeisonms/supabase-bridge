import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, CheckCircle, XCircle, Loader2, Camera, Keyboard, Home, AlertTriangle, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Scanner } from '@yudiel/react-qr-scanner';

const QR_MAX_AGE_MS = 60000; // 1 minute

type ScanResult = {
  success: boolean;
  message: string;
  userName?: string;
  userPhoto?: string | null;
  expired?: boolean;
} | null;

const PartnerScanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'camera' | 'manual'>('camera');
  const [input, setInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ScanResult>(null);
  const [scannerKey, setScannerKey] = useState(0);

  const processQR = useCallback(async (raw: string) => {
    if (processing) return;
    setProcessing(true);
    setResult(null);

    try {
      let parsed: { id?: string; timestamp?: number };
      try {
        parsed = JSON.parse(raw);
      } catch {
        setResult({ success: false, message: 'Código QR inválido. No es un JSON válido.' });
        setProcessing(false);
        return;
      }

      if (!parsed.id || typeof parsed.id !== 'string') {
        setResult({ success: false, message: 'Código QR inválido. Falta el ID del usuario.' });
        setProcessing(false);
        return;
      }

      // Validation 1: Timestamp expiration
      if (!parsed.timestamp || typeof parsed.timestamp !== 'number') {
        setResult({ success: false, message: 'QR Caducado. Pida al usuario regenerarlo.', expired: true });
        setProcessing(false);
        return;
      }

      if (Date.now() - parsed.timestamp > QR_MAX_AGE_MS) {
        setResult({ success: false, message: 'QR Caducado. Pida al usuario regenerarlo.', expired: true });
        setProcessing(false);
        return;
      }

      // Get partner id
      const { data: partner } = await supabase
        .from('partners')
        .select('id')
        .eq('admin_user_id', user?.id || '')
        .single();

      if (!partner) {
        setResult({ success: false, message: 'No tienes un gimnasio asignado.' });
        setProcessing(false);
        return;
      }

      // Validation 2: Call validate_entry_qr RPC
      const { data, error } = await supabase.rpc('validate_entry_qr', {
        p_user_id: parsed.id,
        p_partner_id: partner.id,
      });

      if (error) {
        setResult({ success: false, message: error.message || 'Error al validar la entrada.' });
      } else {
        const res = data as any;
        if (res?.success) {
          setResult({
            success: true,
            message: res.message || '¡ACCESO PERMITIDO!',
            userName: res.user_name,
            userPhoto: res.user_photo ?? null,
          });
          toast.success('Entrada validada');
        } else {
          setResult({ success: false, message: res?.message || 'No se pudo validar la entrada.' });
        }
      }
    } catch {
      setResult({ success: false, message: 'Error inesperado al procesar el código.' });
    }
    setProcessing(false);
  }, [processing, user?.id]);

  const handleReset = () => {
    setResult(null);
    setInput('');
    setScannerKey((k) => k + 1);
  };

  // Full-screen result overlay
  if (result) {
    const isExpired = result.expired;
    const hasPhoto = !!result.userPhoto;

    return (
      <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center px-6 ${
        result.success
          ? 'bg-emerald-600'
          : isExpired
            ? 'bg-amber-600'
            : 'bg-destructive'
      }`}>
        <button
          onClick={() => navigate('/partner')}
          className="absolute top-6 left-6 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          aria-label="Volver al dashboard"
        >
          <ArrowLeft className="h-6 w-6 text-white" />
        </button>

        <div className="text-center text-white">
          {result.success ? (
            <>
              {/* User photo */}
              <Avatar className="h-28 w-28 mx-auto mb-4 border-4 border-white/50 shadow-lg">
                {hasPhoto ? (
                  <AvatarImage src={result.userPhoto!} alt={result.userName || 'Usuario'} />
                ) : null}
                <AvatarFallback className="bg-white/20 text-white text-3xl">
                  <User className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>

              {/* No-photo warning */}
              {!hasPhoto && (
                <div className="bg-amber-500/30 border border-amber-300/50 rounded-xl px-4 py-2 mb-4 inline-flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-200 shrink-0" />
                  <span className="text-sm text-amber-100">Solicitar Documento de Identidad (Sin Foto)</span>
                </div>
              )}

              <CheckCircle className="h-16 w-16 mx-auto mb-3" />
              <h1 className="text-3xl font-black mb-1">ACCESO PERMITIDO</h1>
              {result.userName && (
                <p className="text-2xl font-semibold mb-2">{result.userName}</p>
              )}
              <p className="text-sm opacity-80 mb-6 max-w-xs mx-auto">
                Verifique que la foto coincida con la persona.
              </p>
            </>
          ) : (
            <>
              {isExpired ? (
                <AlertTriangle className="h-24 w-24 mx-auto mb-6" />
              ) : (
                <XCircle className="h-24 w-24 mx-auto mb-6" />
              )}
              <h1 className="text-3xl font-black mb-3">
                {isExpired ? 'QR CADUCADO' : 'ACCESO DENEGADO'}
              </h1>
              <p className="text-lg opacity-90 mb-8 max-w-sm mx-auto">{result.message}</p>
              {!isExpired && (
                <p className="text-sm opacity-75 mb-8 max-w-xs mx-auto">
                  Pídele al usuario que reserve su cupo desde la app antes de ingresar.
                </p>
              )}
            </>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleReset}
              variant="outline"
              size="lg"
              className="rounded-full px-8 py-6 text-lg bg-white/20 border-white/40 text-white hover:bg-white/30 hover:text-white"
            >
              Escanear otro
            </Button>
            <Button
              onClick={() => navigate('/partner')}
              size="lg"
              className="rounded-full px-8 py-6 text-lg bg-white hover:bg-white/90 text-emerald-600 hover:text-emerald-600 font-semibold"
            >
              <Home className="h-5 w-5 mr-2" /> Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-8 max-w-lg mx-auto">
      <Link to="/partner" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-6 hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Volver al Dashboard
      </Link>

      <h1 className="text-2xl font-black mb-2">Escanear Pase</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Escanea el código QR del usuario para validar su entrada.
      </p>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={mode === 'camera' ? 'default' : 'outline'}
          size="sm"
          className="rounded-full flex-1"
          onClick={() => setMode('camera')}
        >
          <Camera className="h-4 w-4 mr-2" /> Cámara
        </Button>
        <Button
          variant={mode === 'manual' ? 'default' : 'outline'}
          size="sm"
          className="rounded-full flex-1"
          onClick={() => setMode('manual')}
        >
          <Keyboard className="h-4 w-4 mr-2" /> Manual
        </Button>
      </div>

      {mode === 'camera' ? (
        <div className="rounded-2xl overflow-hidden border bg-black">
          <Scanner
            key={scannerKey}
            onScan={(results) => {
              if (results && results.length > 0 && !processing) {
                processQR(results[0].rawValue);
              }
            }}
            formats={['qr_code']}
            components={{ finder: true }}
            styles={{
              container: { borderRadius: '1rem' },
              video: { borderRadius: '1rem' },
            }}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <Input
            placeholder='Pega el contenido del QR aquí...'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="rounded-xl h-12"
          />
          <Button
            onClick={() => processQR(input)}
            disabled={!input.trim() || processing}
            className="w-full rounded-full py-6"
            size="lg"
          >
            {processing ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
            Validar
          </Button>
        </div>
      )}

      {processing && mode === 'camera' && (
        <div className="flex items-center justify-center gap-2 mt-6 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Validando entrada...</span>
        </div>
      )}
    </div>
  );
};

export default PartnerScanner;
