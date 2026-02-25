import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import logo from '@/assets/logo.png';

const Login = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && profile) {
      if (profile.role === 'super_admin') {
        navigate('/admin', { replace: true });
      } else if (profile.role === 'partner_admin') {
        navigate('/partner', { replace: true });
      } else {
        navigate('/app', { replace: true });
      }
    }
  }, [user, profile, loading, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

      <Link to="/" className="mb-8 flex items-center justify-center relative z-10 transition-transform hover:scale-105">
        <img src={logo} alt="Logo RedFit" className="h-12 md:h-14 w-auto object-contain drop-shadow-md" />
      </Link>
      <div className="w-full max-w-md glass-card rounded-3xl p-8 relative z-10">
        <h1 className="text-3xl font-black text-center mb-8 text-foreground">Iniciar Sesión</h1>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(0 82% 52%)',
                  brandAccent: 'hsl(0 82% 45%)',
                  inputText: 'hsl(0 0% 98%)',
                  inputBackground: 'transparent',
                  inputBorder: 'hsl(0 0% 20%)',
                },
                borderWidths: { buttonBorderWidth: '0px', inputBorderWidth: '1px' },
                radii: { borderRadiusButton: '1rem', inputBorderRadius: '0.75rem' },
              },
            },
            className: {
              button: 'shadow-md transition-all hover:scale-[1.02] hover:shadow-primary/30',
              input: 'transition-all focus:border-primary',
            }
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
