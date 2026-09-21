
import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '@/components/crm/Sidebar';
import QuickActions from '@/components/crm/QuickActions';
import BackToTop from '@/components/shared/BackToTop';
import UpcomingMarquee from '@/components/crm/UpcomingMarquee';
import FooterLinks from '@/components/crm/FooterLinks';
import { useAppMode } from '@/components/ModeProvider';
import { useIpadMode } from '@/hooks/use-ipad-mode';
import { cn } from '@/lib/utils';
import { showSuccess } from '@/utils/toast';
import { Tablet, Menu } from 'lucide-react';

const MainLayout = () => {
  const { mode, setMode } = useAppMode();
  const { enabled: ipadMode, toggle: toggleIpadMode } = useIpadMode();
  const location = useLocation();
  const navigate = useNavigate();

  const ROUTE_TITLES: Record<string, string> = {
    "": "Home",
    assistant: "Assistant",
    timetable: "Timetable",
    calendar: "Calendar",
    clients: "Clients",
    sessions: "Sessions",
    appointments: "Session",
    business: "Business",
    journal: "Journal",
    practice: "Practice Hub",
    worksheets: "Worksheets",
    library: "Library",
    identity: "Identity Work",
    "morning-program": "Morning Program",
    voice: "Voice Studio",
    settings: "Settings",
  };
  const routeSegment = location.pathname.split("/").filter(Boolean)[0] ?? "";
  const currentTitle = ROUTE_TITLES[routeSegment] ?? (routeSegment.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()) || "Home");

  // Per-route browser tab title, so tabs, history and bookmarks are
  // distinguishable (they all read the same generic title otherwise).
  useEffect(() => {
    document.title = currentTitle ? `${currentTitle} · Resonance` : "Resonance Kinesiology";
  }, [currentTitle]);

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [isFullScreen, setIsFullScreen] = useState(() => {
    return localStorage.getItem('rk_fullscreen') === 'true';
  });

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(localStorage.getItem('rk_fullscreen') === 'true');
    };

    window.addEventListener('rk_fullscreen_change', handleFullScreenChange);
    return () => {
      window.removeEventListener('rk_fullscreen_change', handleFullScreenChange);
    };
  }, []);

  // Auto-set mode based on current page context. /assistant and /clients are
  // deliberately excluded — they're genuinely dual-purpose (used from both
  // Clinical and Business contexts), so forcing a mode switch just by
  // visiting them would flip the whole sidebar out from under the
  // practitioner mid-task. Whichever mode they were already in carries
  // through unchanged; only the unambiguous route prefixes below switch it.
  useEffect(() => {
    if (location.pathname.startsWith('/voice')) {
      setMode('voice');
    } else if (location.pathname.startsWith('/business')) {
      setMode('business');
    } else if (location.pathname.startsWith('/assistant') || location.pathname.startsWith('/clients')) {
      // no-op — stays in whichever mode was already active
    } else {
      setMode('clinical');
    }
  }, [location.pathname]);

  // Global Keyboard Shortcuts (macOS & Windows Robust)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInSessionPage = location.pathname.startsWith('/appointments/');
      if (!isInSessionPage) return;

      // Alt/Option + F: Toggle Full Screen
      if (e.altKey && e.code === 'KeyF') {
        e.preventDefault();
        const nextState = !isFullScreen;
        localStorage.setItem('rk_fullscreen', String(nextState));
        window.dispatchEvent(new Event('rk_fullscreen_change'));
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
  const isDocView = location.search.includes('view=document');
  const shouldHideHeader = (isFullScreen && isInSession) || isDocView;
  const shouldHideSidebar = shouldHideHeader || isDocView;
  // The site-wide marketing footer (Navigate/Study/Practice/Resources links)
  // doesn't belong under a working tool page — it was the actual cause of a
  // "chat window sizing is weird" report: the panes above sized correctly to
  // fill the viewport, but the page still scrolled well past them to reveal
  // this footer, which read as broken sizing rather than expected page content.
  const isWorkingToolPage = location.pathname.startsWith('/assistant') || /^\/clients\/[^/]+\/hub/.test(location.pathname);

  // iPad Mode: non-session, non-practice routes funnel to the Clinical Hub so
  // the practitioner can just work with clients, free of the sidebar.
  const shouldRedirectToHub =
    ipadMode &&
    !location.pathname.startsWith('/practice/') &&
    !location.pathname.startsWith('/appointments/');

  useEffect(() => {
    if (shouldRedirectToHub) {
      navigate('/practice/clinical-hub', { replace: true });
    }
  }, [shouldRedirectToHub, navigate]);

  return (
    <div className="flex h-screen transition-all duration-1000 relative overflow-hidden bg-background">
      {/* BACKGROUND ORBS */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={cn(
          "absolute top-[-10%] left-[-10%] w-[60%] h-[60%] blur-[160px] rounded-full transition-all duration-1000 opacity-15 dark:opacity-10",
          mode === 'clinical' ? "bg-primary/15" : mode === 'business' ? "bg-chart-emerald/15" : "bg-chart-destructive/15"
        )} />
        <div className={cn(
          "absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] blur-[140px] rounded-full transition-all duration-1000 opacity-15 dark:opacity-10 delay-500",
          mode === 'clinical' ? "bg-chart-primary/15" : mode === 'business' ? "bg-chart-emerald/15" : "bg-amber-500/15"
        )} />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-chart-primary/5 blur-[120px] rounded-full animate-pulse-soft" />
      </div>

      <div className="relative z-10 flex h-full w-full">
        {/* Sidebar */}
        {!shouldHideSidebar && !ipadMode && <Sidebar mobileOpen={mobileNavOpen} onMobileOpenChange={setMobileNavOpen} />}

        {/* iPad Mode Exit Button */}
        {ipadMode && !shouldHideHeader && (
          <button
            onClick={() => {
              toggleIpadMode();
              showSuccess("iPad Mode Disabled — sidebar restored");
            }}
            title="Exit iPad Mode — restore the full sidebar"
            className="fixed bottom-6 left-6 z-40 flex items-center gap-2 px-4 h-12 rounded-2xl bg-primary text-primary-foreground shadow-xl hover:bg-primary/90 transition-colors"
          >
            <Tablet size={18} />
            <span className="text-[10px] font-bold uppercase tracking-wider">iPad</span>
          </button>
        )}

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 min-w-0 h-full">
          {/* Mobile nav header — a real hamburger entry point (in the
              content column's own vertical stack, above everything else)
              rather than a floating FAB with no visible affordance. */}
          {!shouldHideSidebar && !ipadMode && (
            <header className="lg:hidden shrink-0 flex items-center gap-3 h-14 px-4 border-b border-border bg-card/95 backdrop-blur-sm">
              <button
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open navigation menu"
                className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted text-foreground transition-colors -ml-1.5"
              >
                <Menu size={20} />
              </button>
              <span className="text-sm font-bold text-foreground truncate">{currentTitle}</span>
            </header>
          )}
          {!shouldHideHeader && !isInSession && <UpcomingMarquee />}

          {/* Content */}
          <div className="flex flex-col flex-1 overflow-hidden">
            <main id="main-scroll-container" className="flex-1 flex flex-col overflow-auto relative">
              <div key={location.pathname + location.search} className="flex-1 p-0 animate-in fade-in duration-500">
                <Outlet />
              </div>
              {!shouldHideHeader && !isWorkingToolPage && <FooterLinks />}
            </main>
          </div>
        </div>
      </div>

      {!shouldHideHeader && <QuickActions />}
      <BackToTop />
    </div>
  );
};

export default MainLayout;
