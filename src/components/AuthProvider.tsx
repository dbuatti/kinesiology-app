import { createContext, useContext, useEffect, useRef, useState } from 'react';
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
  // Supabase emits a fresh Session object on every token refresh (roughly
  // hourly). That is not a new login: remember which user we last resolved so
  // a refresh can re-check access in the background without clearing
  // isPractitioner and swapping the whole app for a full-screen loader.
  const resolvedUserIdRef = useRef<string | null>(null);

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
      resolvedUserIdRef.current = null;
      setIsPractitioner(undefined);
      return;
    }
    const userId = session.user.id;
    let cancelled = false;
    // Still re-check on every session change (including token refreshes) so a
    // revoked account never keeps admin access from a stale render — but only
    // clear the answer when the user actually changes. Keeping it means the
    // route tree stays mounted while the RPC runs.
    if (resolvedUserIdRef.current !== userId) setIsPractitioner(undefined);
    (async () => {
      try {
        const { data, error } = await supabase.rpc('is_practitioner');
        if (cancelled) return;
        // A 4xx from the RPC means the JWT itself is dead (expired access
        // token whose refresh also failed). Recover by signing out so the
        // visitor reaches the login page instead of an eternally-broken
        // portal — a healthy session never errors here (RLS answers false).
        if (error && /jwt|401|400|invalid|expired/i.test(`${error.code || ""} ${error.message}`)) {
          await supabase.auth.signOut();
          if (!cancelled) {
            resolvedUserIdRef.current = null;
            setSession(null);
            setIsPractitioner(undefined);
          }
          return;
        }
        if (cancelled) return;
        resolvedUserIdRef.current = userId;
        setIsPractitioner(!error && data === true);
      } catch {
        if (cancelled) return;
        resolvedUserIdRef.current = userId;
        setIsPractitioner(false);
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
