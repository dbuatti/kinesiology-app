import type { FC, ReactNode } from 'react';
import { Settings, HelpCircle, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppMode } from '@/components/ModeProvider';
import { useAuth } from '@/components/AuthProvider';
import { useNavigate } from 'react-router-dom';

interface AppLayoutProps {
  children: ReactNode;
  variant?: 'default' | 'workspace';
}

export const AppLayout: FC<AppLayoutProps> = ({ children, variant = 'default' }) => {
  const { session } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    // Sign out handled by AuthProvider
  };

  return (
    <div className="min-h-screen bg-background">
      {variant === 'workspace' ? (
        <main className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      ) : (
        <>
          <header className="border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-20">
            <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary-strong">
                    <Settings size={20} />
                  </div>
                  <div className="min-w-0">
                    <h1 className="font-serif text-lg font-semibold leading-tight tracking-tight text-foreground">Resonance</h1>
                    <p className="text-xs text-muted-foreground">Kinesiology Practice Suite</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {session?.user?.email && (
                    <button
                      onClick={() => navigate('/settings')}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground transition-colors"
                      aria-label="Account settings"
                    >
                      <User size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </header>
          <main className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </>
      )}
    </div>
  );
};