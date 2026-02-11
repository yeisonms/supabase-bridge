import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && profile) {
      if (profile.role === 'partner_admin') {
        navigate('/partner', { replace: true });
      } else {
        navigate('/app', { replace: true });
      }
    }
  }, [user, profile, loading, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-secondary">
      <Link to="/" className="text-3xl font-black mb-8">
        <span className="text-gradient">Red</span>Fit
      </Link>
      <div className="w-full max-w-sm bg-card rounded-2xl shadow-card p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Iniciar Sesión</h1>
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
          view="sign_in"
          showLinks={true}
          providers={[]}
          redirectTo={window.location.origin}
          localization={{
            variables: {
              sign_in: {
                email_label: 'Correo electrónico',
                password_label: 'Contraseña',
                button_label: 'Iniciar Sesión',
                link_text: '¿Ya tienes cuenta? Inicia sesión',
              },
              sign_up: {
                email_label: 'Correo electrónico',
                password_label: 'Contraseña',
                button_label: 'Registrarse',
                link_text: '¿No tienes cuenta? Regístrate',
              },
            },
          }}
        />
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        ¿No tienes cuenta?{' '}
        <Link to="/register" className="text-primary font-semibold hover:underline">
          Regístrate
        </Link>
      </p>
    </div>
  );
};

export default Login;
