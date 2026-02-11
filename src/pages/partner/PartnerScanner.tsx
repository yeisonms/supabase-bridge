import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const PartnerScanner = () => {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const validate = async () => {
    setProcessing(true);
    setResult(null);
    try {
      // Parse QR data
      let parsed: { user_id: string; date: string };
      try {
        parsed = JSON.parse(input);
      } catch {
        setResult({ success: false, message: 'Código QR inválido' });
        setProcessing(false);
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      if (parsed.date !== today) {
        setResult({ success: false, message: 'Este pase no es válido para hoy' });
        setProcessing(false);
        return;
      }

      // Get partner
      const { data: partner } = await supabase
        .from('partners')
        .select('id, daily_capacity_limit')
        .eq('admin_user_id', user?.id || '')
        .single();

      if (!partner) {
        setResult({ success: false, message: 'No tienes un gimnasio asignado' });
        setProcessing(false);
        return;
      }

      // Check if already checked in
      const { data: existing } = await supabase
        .from('checkins')
        .select('id')
        .eq('partner_id', partner.id)
        .eq('user_id', parsed.user_id)
        .eq('checkin_date', today);

      if (existing && existing.length > 0) {
        setResult({ success: false, message: 'Este usuario ya hizo check-in hoy' });
        setProcessing(false);
        return;
      }

      // Check capacity
      const { count } = await supabase
        .from('checkins')
        .select('*', { count: 'exact', head: true })
        .eq('partner_id', partner.id)
        .eq('checkin_date', today);

      if (partner.daily_capacity_limit && (count || 0) >= partner.daily_capacity_limit) {
        setResult({ success: false, message: 'Capacidad diaria agotada' });
        setProcessing(false);
        return;
      }

      // Register check-in
      const { error } = await supabase.from('checkins').insert({
        user_id: parsed.user_id,
        partner_id: partner.id,
        checkin_date: today,
      });

      if (error) {
        setResult({ success: false, message: 'Error al registrar: ' + error.message });
      } else {
        setResult({ success: true, message: '¡Check-in registrado exitosamente!' });
        toast.success('Check-in registrado');
      }
    } catch {
      setResult({ success: false, message: 'Error inesperado' });
    }
    setProcessing(false);
    setInput('');
  };

  return (
    <div className="px-4 pt-8 max-w-lg mx-auto">
      <Link to="/partner" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-6 hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Volver al Dashboard
      </Link>

      <h1 className="text-2xl font-black mb-2">Escanear Pase</h1>
      <p className="text-muted-foreground text-sm mb-8">
        Escanea o pega el contenido del código QR del usuario.
      </p>

      <div className="space-y-4">
        <Input
          placeholder='Pega el contenido del QR aquí...'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="rounded-xl h-12"
        />
        <Button
          onClick={validate}
          disabled={!input.trim() || processing}
          className="w-full rounded-full py-6"
          size="lg"
        >
          {processing ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
          Validar
        </Button>
      </div>

      {result && (
        <div
          className={`mt-6 rounded-2xl p-6 flex items-center gap-4 ${
            result.success ? 'bg-green-50 text-green-800' : 'bg-destructive/10 text-destructive'
          }`}
        >
          {result.success ? (
            <CheckCircle className="h-8 w-8 shrink-0" />
          ) : (
            <XCircle className="h-8 w-8 shrink-0" />
          )}
          <p className="font-semibold">{result.message}</p>
        </div>
      )}
    </div>
  );
};

export default PartnerScanner;
