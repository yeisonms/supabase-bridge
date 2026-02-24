import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPartner = searchParams.get('role') === 'partner';
  const { user, profile, loading: authLoading } = useAuth();
  const roleUpdated = useRef(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    if (!authLoading && user && profile && !roleUpdated.current) {
      if (isPartner && profile.role !== 'partner_admin') {
        roleUpdated.current = true;
        navigate('/partner/register', { replace: true });
        return;
      }
      if (profile.role === 'super_admin') {
        navigate('/admin', { replace: true });
      } else if (profile.role === 'partner_admin') {
        navigate('/partner', { replace: true });
      } else {
        navigate('/app', { replace: true });
      }
    }
  }, [user, profile, authLoading, navigate, isPartner]);

  const handlePhoneChange = (val: string) => {
    setPhone(val.replace(/\D/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !email.trim() || !password.trim()) {
      toast.error('Todos los campos son obligatorios');
      return;
    }
    if (phone.length < 7) {
      toast.error('El teléfono debe tener al menos 7 dígitos');
      return;
    }
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone: phone.trim(),
          },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.user) {
        // Upsert profile with names + terms timestamp (upsert handles race condition with DB trigger)
        await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            terms_accepted_at: new Date().toISOString(),
          } as any, { onConflict: 'id' });

        toast.success('¡Cuenta creada con éxito!');
      }
    } catch {
      toast.error('Error inesperado al registrarse');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-secondary">
      <Link to="/" className="text-3xl font-black mb-8">
        <span className="text-gradient">Red</span>Fit
      </Link>
      <div className="w-full max-w-md bg-card rounded-2xl shadow-card p-6">
        <h1 className="text-2xl font-bold text-center mb-6">
          {isPartner ? 'Registrar mi Centro' : 'Crear Cuenta'}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">Nombre *</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Juan"
                required
                maxLength={50}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Apellidos *</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Pérez"
                required
                maxLength={80}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Teléfono *</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="3001234567"
              required
              maxLength={15}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Correo electrónico *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              required
              maxLength={255}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña *</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
            />
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="terms"
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(checked === true)}
              className="mt-0.5"
            />
            <Label htmlFor="terms" className="text-sm text-muted-foreground font-normal leading-snug cursor-pointer">
              Acepto los{' '}
              <a href="/legal" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">
                Términos de Servicio
              </a>{' '}
              y la{' '}
              <a href="/legal?tab=privacy" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">
                Política de Privacidad
              </a>
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={submitting || !termsAccepted}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Registrarse
          </Button>
        </form>
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="text-primary font-semibold hover:underline">
          Inicia Sesión
        </Link>
      </p>
    </div>
  );
};

export default Register;
