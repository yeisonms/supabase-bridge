import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: { role: string; first_name: string | null; last_name: string | null } | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null, session: null, profile: null, loading: true, signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthContextType['profile']>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, first_name, last_name')
        .eq('id', userId)
        .maybeSingle();
      if (error) {
        console.error('[Auth] fetchProfile error:', error.message, error.code);
        return { role: 'user', first_name: null, last_name: null };
      }
      console.log('[Auth] fetchProfile data:', data);
      return data ?? { role: 'user', first_name: null, last_name: null };
    } catch (e) {
      console.error('[Auth] fetchProfile exception:', e);
      return { role: 'user', first_name: null, last_name: null };
    }
  };

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log('[Auth] onAuthStateChange:', _event, !!session);
        if (!mounted) return;

        if (_event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          window.location.href = '/login';
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Defer async work to avoid deadlock in onAuthStateChange
          setTimeout(async () => {
            const prof = await fetchProfile(session.user.id);
            console.log('[Auth] profile fetched:', prof);
            if (mounted) {
              setProfile(prof);
              setLoading(false);
            }
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('[Auth] getSession:', !!session);
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const prof = await fetchProfile(session.user.id);
        console.log('[Auth] initial profile:', prof);
        if (mounted) setProfile(prof);
      }
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('[Auth] error during signOut:', error);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
