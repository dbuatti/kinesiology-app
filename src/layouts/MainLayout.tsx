
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import SpaceHeader from '@/components/crm/SpaceHeader';
import QuickActions from '@/components/crm/QuickActions';
import BackToTop from '@/components/shared/BackToTop';
import UpcomingMarquee from '@/components/crm/UpcomingMarquee';
import SessionTimer from '@/components/crm/SessionTimer';
import { useAppMode } from '@/components/ModeProvider';
import { useActiveSession } from '@/hooks/useActiveSession';
import { cn } from '@/lib/utils';
import { showSuccess } from '@/utils/toast';

const MainLayout = () => {
  const { mode } = useAppMode();
  const activeSession = useActiveSession();
  const location = useLocation();
  const navigate = useNavigate();

  const [isFullScreen, setIsFullScreen] = useState(() => {
    return localStorage.getItem('antigravity_fullscreen') === 'true';
  });

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(localStorage.getItem('antigravity_fullscreen') === 'true');
    };

    window.addEventListener('antigravity_fullscreen_change', handleFullScreenChange);
    return () => {
      window.removeEventListener('antigravity_fullscreen_change', handleFullScreenChange);
    };
  }, []);

  // Global Keyboard Shortcuts (macOS & Windows Robust)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInSessionPage = location.pathname.startsWith('/appointments/');
      if (!isInSessionPage) return;

      // Alt/Option + F: Toggle Full Screen
      if (e.altKey && e.code === 'KeyF') {
        e.preventDefault();
        const nextState = !isFullScreen;
        localStorage.setItem('antigravity_fullscreen', String(nextState));
        window.dispatchEvent(new Event('antigravity_fullscreen_change'));
        showSuccess(nextState ? "Full Screen Enabled" : "Full Screen Disabled");
      }

      // Alt/Option + D: Toggle Document View
      if (e.altKey && e.code === 'KeyD') {
        e.preventDefault();
        const isDocViewActive = location.search.includes('view=document');
        if (isDocViewActive) {
          navigate(location.pathname);
        } else {
          navigate(`${location.pathname}?view=document`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [location.pathname, location.search, isFullScreen, navigate]);

  const isInSession = location.pathname.startsWith('/appointments/');
  const shouldHideHeader = isFullScreen && isInSession;

  return (
    <div className={cn(
      "flex flex-col h-screen transition-all duration-1000 relative overflow-hidden",
      mode === 'clinical' ? "bg-white dark:bg-slate-950" :
      mode === 'lab' ? "bg-slate-50/50 dark:bg-slate-950" :
      "bg-slate-50/50 dark:bg-slate-950"
    )}>
      {/* SOPHISTICATED BACKGROUND ORBS */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={cn(
          "absolute top-[-10%] left-[-10%] w-[60%] h-[60%] blur-[160px] rounded-full transition-all duration-1000 opacity-20 dark:opacity-10",
          mode === 'clinical' ? "bg-indigo-300" : mode === 'lab' ? "bg-emerald-300" : "bg-amber-300"
        )} />
        <div className={cn(
          "absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] blur-[140px] rounded-full transition-all duration-1000 opacity-20 dark:opacity-10 delay-500",
          mode === 'clinical' ? "bg-blue-200" : mode === 'lab' ? "bg-teal-200" : "bg-orange-200"
        )} />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-200/10 blur-[120px] rounded-full animate-pulse-soft" />
      </div>

      <div className="relative z-10 flex flex-col h-screen overflow-hidden">
        {/* UNIFIED STICKY HEADER STACK */}
        <div className="shrink-0 w-full shadow-sm z-[100] pt-[env(safe-area-inset-top,0px)] bg-white dark:bg-slate-950">
          {!shouldHideHeader && <UpcomingMarquee />}
          {activeSession && (
            <SessionTimer 
              sessionId={activeSession.id}
              appointmentDate={activeSession.date}
              status={activeSession.status}
              clientName={activeSession.clientName}
            />
          )}
          {!shouldHideHeader && <SpaceHeader />}
        </div>
        
        <div className="flex flex-col flex-1 overflow-hidden">
          <main id="main-scroll-container" className="flex-1 flex flex-col overflow-auto relative">
            <div className="flex-1 p-0">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      {!shouldHideHeader && <QuickActions />}
      <BackToTop />
    </div>
  );
};

export default MainLayout;