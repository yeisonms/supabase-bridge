import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, CheckCircle, XCircle, Loader2, Camera, Keyboard, Home, AlertTriangle, User, ShieldCheck, ShieldX } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Scanner } from '@yudiel/react-qr-scanner';
import { format } from 'date-fns';

const QR_MAX_AGE_MS = 60000; // 1 minute

type VerificationData = {
  checkinId: string;
  userName: string;
  userPhoto: string | null;
  isNewCheckin?: boolean;
  userId?: string;
  partnerId?: string;
};

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
  const [verification, setVerification] = useState<VerificationData | null>(null);
  const [confirming, setConfirming] = useState(false);

  const processQR = useCallback(async (raw: string) => {
    if (processing) return;
    setProcessing(true);
    setResult(null);
    setVerification(null);
    console.log('[Scanner] Raw text:', raw);

    try {
      let parsed: { id?: string; timestamp?: number; reservationId?: string };
      try {
        parsed = JSON.parse(raw);
        console.log('[Scanner] Parsed JSON:', parsed);
      } catch (err) {
        console.error('[Scanner] JSON parse error:', err);
        setResult({ success: false, message: 'Código QR inválido. No es un JSON válido.' });
        setProcessing(false);
        return;
      }

      if (!parsed.id || typeof parsed.id !== 'string') {
        console.error('[Scanner] Missing ID');
        setResult({ success: false, message: 'Código QR inválido. Falta el ID del usuario.' });
        setProcessing(false);
        return;
      }

      if (!parsed.reservationId || typeof parsed.reservationId !== 'string') {
        console.error('[Scanner] Missing reservation ID');
        setResult({ success: false, message: 'QR genérico revocado. El usuario debe tener una reserva activa en este gimnasio para hoy.' });
        setProcessing(false);
        return;
      }

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

      console.log('[Scanner] Fetching partner for admin:', user?.id);
      const { data: partner, error: partnerError } = await supabase
        .from('partners')
        .select('id')
        .eq('admin_user_id', user?.id || '')
        .limit(1)
        .maybeSingle();

      if (partnerError) {
        console.error('[Scanner] Partner query error:', partnerError);
      }

      if (!partner) {
        console.error('[Scanner] No partner found! admin_user_id=', user?.id);
        setResult({ success: false, message: 'No tienes un gimnasio asignado.' });
        setProcessing(false);
        return;
      }

      // 2. Fetch User Profile & Plan Data
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url, current_plan_id, subscription_status, plan_start_date, plan_end_date')
        .eq('id', parsed.id)
        .maybeSingle();

      if (!userProfile) {
        setResult({ success: false, message: 'Usuario no encontrado en el sistema.' });
        setProcessing(false);
        return;
      }

      if (userProfile.subscription_status !== 'active') {
        setResult({ success: false, message: 'El usuario no tiene una suscripción activa.' });
        setProcessing(false);
        return;
      }

      if (!userProfile.plan_end_date || new Date(userProfile.plan_end_date).getTime() < Date.now()) {
        setResult({ success: false, message: 'Acceso Denegado: Suscripción Expirada.' });
        setProcessing(false);
        return;
      }

      // 3. Fetch Plan Limits
      const { data: userPlan } = await supabase
        .from('plans')
        .select('monthly_credits')
        .eq('id', userProfile.current_plan_id)
        .maybeSingle();
      
      const maxVisits = userPlan?.monthly_credits || 0;

      // 4. Check Checkins in current billing cycle for Monthly Limit evaluation
      const { count: consumedCount } = await supabase
        .from('checkins')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', parsed.id)
        .in('status', ['confirmed', 'reserved'])
        .gte('checkin_date', userProfile.plan_start_date || '2000-01-01')
        .lte('checkin_date', userProfile.plan_end_date || '2999-12-31');

      const consumed = consumedCount || 0;

      // 5. Fetch specific reservation attached to this QR
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: existingCheckin } = await supabase
        .from('checkins')
        .select('id, status, partner_id, checkin_date')
        .eq('id', parsed.reservationId)
        .eq('user_id', parsed.id)
        .maybeSingle();

      if (!existingCheckin) {
        setResult({ success: false, message: 'La reserva ligada a este código QR no existe o fue cancelada.' });
        setProcessing(false);
        return;
      }

      if (existingCheckin.checkin_date !== today) {
        setResult({ success: false, message: 'La reserva escaneada no corresponde a la fecha de hoy.' });
        setProcessing(false);
        return;
      }

      // Geo-fencing block
      if (existingCheckin.partner_id !== partner.id) {
        setResult({ success: false, message: 'Acceso Denegado: La reserva pertenece a otro centro de entrenamiento.' });
        setProcessing(false);
        return;
      }

      if (existingCheckin.status === 'confirmed') {
        setResult({ success: false, message: 'El usuario ya registró su entrada hoy con esta reserva. El pase ya fue utilizado.' });
        setProcessing(false);
        return;
      }

      // We no longer strictly block by max limit BEFORE rendering, because we are
      // processing a previously granted 'reserved' status checkin, which ALREADY accounted
      // for the monthly limit when it was created. However, if somehow they have 21/20, we can block.
      if (consumed > maxVisits) {
         setResult({ success: false, message: `Límite mensual sobrepasado (${consumed}/${maxVisits}). Contactar a soporte.` });
         setProcessing(false);
         return;
      }

      // 6. Provide verification object
      setVerification({
        checkinId: existingCheckin.id,
        userName: `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || 'Usuario',
        userPhoto: userProfile.avatar_url || null,
        isNewCheckin: false,
        userId: parsed.id,
        partnerId: partner.id
      });
    } catch (err: any) {
      console.error('[Scanner] Unhandled error:', err);
      toast.error('Ocurrió un error inesperado al procesar el código.');
      setResult({ success: false, message: 'Error inesperado al procesar el código. Revisa la consola.' });
    }
    setProcessing(false);
  }, [processing, user?.id]);

  const handleConfirmAccess = async () => {
    if (!verification?.checkinId || confirming) return;
    setConfirming(true);

    try {
      // Safely Update the explicit existing reservation to 'confirmed'
      const { error: updateErr } = await supabase
        .from('checkins')
        .update({ status: 'confirmed' })
        .eq('id', verification.checkinId);

      const opError = updateErr;

      if (opError) {
        if (opError.code === '23505') {
          toast.error('El usuario ya generó un ingreso en otro panel. Intento duplicado abortado.');
        } else {
          toast.error(opError.message || 'Error al confirmar acceso en la base de datos.');
        }
        setConfirming(false);
        return;
      }

      setVerification(null);
      setResult({
        success: true,
        message: '¡ACCESO PERMITIDO!',
        userName: verification.userName,
        userPhoto: verification.userPhoto,
      });
      toast.success('Entrada guardada y debidamente contabilizada.');
    } catch {
      toast.error('Error inesperado al confirmar acceso.');
    }
    setConfirming(false);
  };

  const handleReject = () => {
    setVerification(null);
    setResult(null);
    setInput('');
    setScannerKey((k) => k + 1);
    toast.info('Acceso rechazado');
  };

  const handleReset = () => {
    setResult(null);
    setVerification(null);
    setInput('');
    setScannerKey((k) => k + 1);
  };

  // Verification modal (step 1: identity check)
  if (verification) {
    const hasPhoto = !!verification.userPhoto;

    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 bg-amber-500">
        <div className="text-center text-white max-w-sm">
          <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-80" />
          <h1 className="text-2xl font-black mb-1">VERIFICACIÓN DE IDENTIDAD</h1>
          <p className="text-sm opacity-80 mb-6">Confirme que la persona coincide con la foto</p>

          <Avatar className="h-36 w-36 mx-auto mb-4 border-4 border-white/60 shadow-2xl">
            {hasPhoto ? (
              <AvatarImage src={verification.userPhoto!} alt={verification.userName} />
            ) : null}
            <AvatarFallback className="bg-white/20 text-white text-4xl">
              <User className="h-16 w-16" />
            </AvatarFallback>
          </Avatar>

          {!hasPhoto && (
            <div className="bg-red-500/30 border border-red-300/50 rounded-xl px-4 py-2 mb-3 inline-flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-200 shrink-0" />
              <span className="text-sm text-red-100 font-medium">Solicitar Documento de Identidad (Sin Foto)</span>
            </div>
          )}

          <p className="text-2xl font-bold mb-2">{verification.userName}</p>
          <p className="text-lg font-medium mb-8 opacity-90">¿La foto coincide con la persona?</p>

          <div className="flex gap-3">
            <Button
              onClick={handleReject}
              size="lg"
              className="flex-1 rounded-full py-6 text-lg bg-red-600 hover:bg-red-700 text-white border-0"
            >
              <ShieldX className="h-5 w-5 mr-2" /> RECHAZAR
            </Button>
            <Button
              onClick={handleConfirmAccess}
              disabled={confirming}
              size="lg"
              className="flex-1 rounded-full py-6 text-lg bg-emerald-600 hover:bg-emerald-700 text-white border-0"
            >
              {confirming ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-5 w-5 mr-2" />
              )}
              PERMITIR
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Final result overlay (success or error)
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
              <Avatar className="h-28 w-28 mx-auto mb-4 border-4 border-white/50 shadow-lg">
                {hasPhoto ? (
                  <AvatarImage src={result.userPhoto!} alt={result.userName || 'Usuario'} />
                ) : null}
                <AvatarFallback className="bg-white/20 text-white text-3xl">
                  <User className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>

              <CheckCircle className="h-16 w-16 mx-auto mb-3" />
              <h1 className="text-3xl font-black mb-1">ACCESO PERMITIDO</h1>
              {result.userName && (
                <p className="text-2xl font-semibold mb-2">{result.userName}</p>
              )}
              <p className="text-sm opacity-80 mb-6">Entrada confirmada por el recepcionista.</p>
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
