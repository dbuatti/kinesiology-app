import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/**
 * Two kinds of account share one Supabase Auth pool:
 *   - the practitioner (this CRM's owner), and
 *   - clients signing into the portal with an email OTP link.
 *
 * A client's session is a perfectly valid `authenticated` user, so `session`
 * alone must NEVER be treated as "this is the practitioner" — that is exactly
 * how a client ended up looking at the admin dashboard. `isPractitioner` is
 * resolved from the database (`public.is_practitioner()`, which reads the
 * practice_practitioners table) and is what every CRM route gates on.
 *
 * `isPractitioner === undefined` means "still resolving" — render a loader,
 * never the app.
 */
interface AuthState {
  session: Session | null | undefined;
  isPractitioner: boolean | undefined;
}

const AuthContext = createContext<AuthState>({ session: undefined, isPractitioner: undefined });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [isPractitioner, setIsPractitioner] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    }).catch(() => {
      setSession(null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setIsPractitioner(undefined);
      return;
    }
    let cancelled = false;
    // Resolve on every session change (including refreshes) so a revoked or
    // re-pointed account never keeps admin access from a stale render.
    setIsPractitioner(undefined);
    (async () => {
      try {
        const { data, error } = await supabase.rpc('is_practitioner');
        if (cancelled) return;
        setIsPractitioner(!error && data === true);
      } catch {
        if (!cancelled) setIsPractitioner(false);
      }
    })();
    return () => { cancelled = true; };
  }, [session]);

  return (
    <AuthContext.Provider value={{ session, isPractitioner }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
