import { useState, useEffect } from 'react';
import { BREADCRUMBS, ZONES, ZONE_ORDER, zoneForPath } from "@/lib/zones";
import { takeStartRedirect } from "@/lib/start-page";
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '@/components/crm/Sidebar';
import BackToTop from '@/components/shared/BackToTop';
import FooterLinks from '@/components/crm/FooterLinks';
import TopBar from '@/components/layout/TopBar';
import MobileTabBar from '@/components/layout/MobileTabBar';
import { useAppMode } from '@/components/ModeProvider';
import { useIpadMode } from '@/hooks/use-ipad-mode';
import { cn } from '@/lib/utils';
import { showSuccess } from '@/utils/toast';
import { Tablet } from 'lucide-react';

const MainLayout = () => {
  const { mode, setMode } = useAppMode();
  const [scrolled, setScrolled] = useState(false);
  const { enabled: ipadMode, toggle: toggleIpadMode } = useIpadMode();
  const location = useLocation();
  const navigate = useNavigate();

  const segments = location.pathname.split("/").filter(Boolean);
  const routeSegment = segments[0] ?? "";
  const fallbackTitle = routeSegment.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()) || "Home";
  let [currentTitle, section, sectionTo] = BREADCRUMBS[routeSegment] ?? [fallbackTitle, "", "/"];
  // Deeper pages read as children of their hub: People › Client, Lessons › Students
  if (routeSegment === "clients" && segments[1]) [currentTitle, section, sectionTo] = ["Client", "People", "/clients"];
  if (routeSegment === "voice" && segments[1] === "clients") [currentTitle, section, sectionTo] = [segments[2] === "new" ? "New student" : "Students", "People", "/clients"];
  if (routeSegment === "settings" && segments[1]) [currentTitle, section, sectionTo] = [fallbackTitleFor(segments[1]), "Settings", "/settings"];

  // Per-route browser tab title, so tabs, history and bookmarks are distinguishable.
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

  // "Open the app on" (Settings): applied once per browser session, on first load at "/".
  useEffect(() => {
    const to = takeStartRedirect(location.pathname);
    if (to) navigate(to, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the zone in step with the page (rules in src/lib/zones.ts). Shared
  // pages (Calendar, People, Assistant, Settings…) return null and keep
  // whichever zone you were already in, so the sidebar never flips mid-task.
  useEffect(() => {
    const zone = zoneForPath(location.pathname);
    if (zone && zone !== mode) setMode(zone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Session-page keyboard shortcuts (macOS & Windows)
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
  // The link footer doesn't belong under a working tool page — the panes
  // above size to the viewport, so a footer below them reads as broken sizing.
  const showTabBar = !shouldHideSidebar && !isInSession;
  const isWorkingToolPage = location.pathname.startsWith('/assistant') || /^\/clients\/[^/]+\/hub/.test(location.pathname);

  return (
    <div className="relative flex h-[100dvh] overflow-hidden bg-background">
      {/* Sidebar — rendered in every non-hidden mode so its drawer is
          available; iPad Mode sets drawerOnly so just the drawer exists and
          the full width is handed back to content. */}
      {!shouldHideSidebar && <Sidebar drawerOnly={ipadMode} mobileOpen={mobileNavOpen} onMobileOpenChange={setMobileNavOpen} />}

      {/* iPad Mode exit */}
      {ipadMode && !shouldHideHeader && (
        <button
          onClick={() => {
            toggleIpadMode();
            showSuccess("iPad Mode off — sidebar restored");
          }}
          title="Exit iPad Mode — restore the full sidebar"
          className="fixed bottom-20 left-5 z-40 flex h-10 lg:bottom-5 items-center gap-2 rounded-full border border-border bg-card/90 pl-3 pr-4 text-[13px] font-medium text-foreground shadow-lg backdrop-blur-xl hover:bg-card print:hidden"
        >
          <Tablet size={15} className="text-chart-emerald" />
          Exit iPad mode
        </button>
      )}

      {/* Main column */}
      <div className="relative isolate flex h-full min-w-0 flex-1 flex-col">
        {/* Workspace aura — a soft light at the top of the canvas, tinted by
            zone (Practice indigo · Business emerald · Growth amber). It
            crossfades when you switch workspace, so each one has its own
            atmosphere without any extra chrome. */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[460px] overflow-hidden print:hidden">
          {ZONE_ORDER.map((m) => [m, ...ZONES[m].aura] as const).map(([m, a, b]) => (
            <div
              key={m}
              className="absolute inset-0 transition-opacity duration-1000 ease-out-expo"
              style={{
                opacity: mode === m ? 1 : 0,
                background: `radial-gradient(60% 90% at 12% -10%, ${a}, transparent 70%), radial-gradient(50% 80% at 88% -20%, ${b}, transparent 70%)`,
              }}
            />
          ))}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />
        </div>

        {!shouldHideHeader && (
          <TopBar
            title={currentTitle}
            section={section}
            sectionTo={sectionTo}
            menuDesktop={ipadMode}
            mobileOnly={isInSession}
            showUpNext={!isInSession}
            onMenu={() => setMobileNavOpen(true)}
            scrolled={scrolled}
          />
        )}

        <main
          id="main-scroll-container"
          onScroll={(e) => {
            const next = (e.currentTarget as HTMLElement).scrollTop > 4;
            if (next !== scrolled) setScrolled(next);
          }}
          className={cn(
            "relative flex flex-1 flex-col overflow-auto overscroll-contain",
            showTabBar && "pb-[calc(3.5rem+env(safe-area-inset-bottom))] lg:pb-0"
          )}
        >
          <div key={location.pathname + location.search} className="page-enter flex-1">
            <Outlet />
          </div>
          {!shouldHideHeader && !isWorkingToolPage && <FooterLinks />}
        </main>
      </div>

      {showTabBar && <MobileTabBar onMore={() => setMobileNavOpen(true)} />}
      <BackToTop />
    </div>
  );
};

function fallbackTitleFor(seg: string) {
  return seg.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

export default MainLayout;
