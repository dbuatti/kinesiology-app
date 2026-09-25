import { BrandMark } from "@/components/layout/BrandMark";
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { showError, showSuccess } from '@/utils/toast';
import { Loader2, Mail, Lock, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Login = () => {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  if (session) return <Navigate to="/" replace />;

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error: any) {
      showError(error.message || "An error occurred during Google sign in");
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        showSuccess("Check your email for the confirmation link!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        showSuccess("Welcome back!");
      }
    } catch (error: any) {
      showError(error.message || "An error occurred during authentication");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(165,180,252,0.1),transparent_50%)]" />
      <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,rgba(212,106,155,0.05),transparent_50%)]" />
      
      <div className="w-full max-w-md relative z-10 space-y-8">
        <div className="flex flex-col items-center text-center">
          <BrandMark className="h-12 w-12 shadow-lg shadow-primary/20 rounded-[14px]" />
          <h1 className="mt-5 font-serif text-[34px] font-medium leading-none tracking-[-0.025em] text-foreground">Resonance</h1>
          <p className="mt-2 text-[13px] text-muted-foreground">Practitioner portal</p>
        </div>

        <Card className="rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
          <CardHeader className="space-y-2 text-center pb-8 pt-10">
            <CardTitle className="text-xl font-semibold tracking-tight">Welcome back</CardTitle>
            <CardDescription className="text-muted-foreground font-medium">
              {isSignUp ? "Create your practitioner account" : "Sign in to manage your clinical practice"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-10">
            <Button 
              variant="outline" 
              className="w-full h-11 border-border hover:bg-muted flex items-center justify-center gap-3 rounded-xl font-medium text-sm transition-all"
              onClick={handleGoogleLogin}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-[10px] font-semibold uppercase tracking-wider">
                <span className="bg-background px-4 text-muted-foreground">Or use email</span>
              </div>
            </div>

            <form onSubmit={handleAuth} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-semibold uppercase tracking-wider ml-1 text-muted-foreground">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={16} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-11 h-11 rounded-xl border-border bg-background"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[10px] font-semibold uppercase tracking-wider ml-1 text-muted-foreground">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={16} />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-11 h-11 rounded-xl border-border bg-background"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 h-11 rounded-xl font-medium text-sm shadow-sm" 
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {isSignUp ? "Create Account" : "Sign In"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pb-10 pt-4">
            <Button
              type="button"
              variant="ghost"
              className="text-primary font-bold hover:bg-secondary/50 rounded-xl"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
            </Button>
          </CardFooter>
        </Card>

        <div className="flex flex-col items-center gap-4 opacity-40">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-primary">
            <ShieldCheck size={14} /> Secure Clinical Infrastructure
          </div>
          <div className="text-[10px] font-medium tracking-wider text-muted-foreground/60">v1.0.0</div>
        </div>
      </div>
    </div>
  );
};

export default Login;