import { useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPartner = searchParams.get('role') === 'partner';
  const { user, profile, loading } = useAuth();
  const roleUpdated = useRef(false);

  // After signup, if registering as partner, update profile role
  useEffect(() => {
    if (!loading && user && profile && !roleUpdated.current) {
      if (isPartner && profile.role !== 'partner_admin') {
        // Redirect to partner registration form instead of updating role client-side
        roleUpdated.current = true;
        navigate('/partner/register', { replace: true });
        return;
      }
      if (profile.role === 'partner_admin') {
        navigate('/partner', { replace: true });
      } else {
        navigate('/app', { replace: true });
      }
    }
  }, [user, profile, loading, navigate, isPartner]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-secondary">
      <Link to="/" className="text-3xl font-black mb-8">
        <span className="text-gradient">Red</span>Fit
      </Link>
      <div className="w-full max-w-sm bg-card rounded-2xl shadow-card p-6">
        <h1 className="text-2xl font-bold text-center mb-6">
          {isPartner ? 'Registrar mi Gimnasio' : 'Crear Cuenta'}
        </h1>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(0 82% 52%)',
                  brandAccent: 'hsl(0 82% 45%)',
                },
                borderWidths: { buttonBorderWidth: '0px' },
                radii: { borderRadiusButton: '0.75rem', inputBorderRadius: '0.75rem' },
              },
            },
          }}
          view="sign_up"
          showLinks={true}
          providers={[]}
          redirectTo={window.location.origin}
          localization={{
            variables: {
              sign_up: {
                email_label: 'Correo electrónico',
                password_label: 'Contraseña',
                button_label: 'Registrarse',
                link_text: '¿Ya tienes cuenta? Inicia sesión',
              },
              sign_in: {
                email_label: 'Correo electrónico',
                password_label: 'Contraseña',
                button_label: 'Iniciar Sesión',
                link_text: '¿No tienes cuenta? Regístrate',
              },
            },
          }}
        />
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
