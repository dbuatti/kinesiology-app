import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '@/components/crm/Sidebar';
import BackToTop from '@/components/shared/BackToTop';
import FooterLinks from '@/components/crm/FooterLinks';
import TopBar from '@/components/layout/TopBar';
import { useAppMode } from '@/components/ModeProvider';
import { useIpadMode } from '@/hooks/use-ipad-mode';
import { showSuccess } from '@/utils/toast';
import { Tablet } from 'lucide-react';

// Route → [page title, breadcrumb section, section link]
const ROUTES: Record<string, [string, string, string]> = {
  "": ["Home", "Clinical", "/"],
  assistant: ["Assistant", "Clinical", "/"],
  timetable: ["Timetable", "Clinical", "/"],
  calendar: ["Calendar", "Clinical", "/"],
  clients: ["Clients", "Clinical", "/"],
  sessions: ["Sessions", "Clinical", "/"],
  appointments: ["Session", "Sessions", "/sessions"],
  availability: ["Availability", "Clinical", "/"],
  "morning-program": ["Morning Program", "Practitioner Growth", "/"],
  journal: ["Journal", "Practitioner Growth", "/"],
  practice: ["Practice Hub", "Practitioner Growth", "/"],
  identity: ["Identity Work", "Practitioner Growth", "/"],
  worksheets: ["Worksheets", "Reference", "/library"],
  library: ["Library", "Reference", "/library"],
  resources: ["Resources", "Reference", "/library"],
  "peace-framework": ["PEACE Framework", "Reference", "/library"],
  voice: ["Voice Studio", "Voice", "/voice"],
  business: ["Business Hub", "Business", "/business"],
  settings: ["Settings", "System", "/settings"],
};

const MainLayout = () => {
  const { mode, setMode } = useAppMode();
  const [scrolled, setScrolled] = useState(false);
  const { enabled: ipadMode, toggle: toggleIpadMode } = useIpadMode();
  const location = useLocation();
  const navigate = useNavigate();

  const segments = location.pathname.split("/").filter(Boolean);
  const routeSegment = segments[0] ?? "";
  const fallbackTitle = routeSegment.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()) || "Home";
  let [currentTitle, section, sectionTo] = ROUTES[routeSegment] ?? [fallbackTitle, "", "/"];
  // Deeper pages read as children of their hub: Clients › Client, Voice › Students
  if (routeSegment === "clients" && segments[1]) [currentTitle, section, sectionTo] = ["Client", "Clients", "/clients"];
  if (routeSegment === "voice" && segments[1] === "clients") [currentTitle, section, sectionTo] = [segments[2] === "new" ? "New student" : "Students", "Voice Studio", "/voice"];
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
          className="fixed bottom-5 left-5 z-40 flex h-10 items-center gap-2 rounded-full border border-border bg-card/90 pl-3 pr-4 text-[13px] font-medium text-foreground shadow-lg backdrop-blur-xl hover:bg-card print:hidden"
        >
          <Tablet size={15} className="text-chart-emerald" />
          Exit iPad mode
        </button>
      )}

      {/* Main column */}
      <div className="relative isolate flex h-full min-w-0 flex-1 flex-col">
        {/* Workspace aura — a soft light at the top of the canvas, tinted by
            workspace (Clinical indigo · Voice rose · Business emerald). It
            crossfades when you switch workspace, so each one has its own
            atmosphere without any extra chrome. */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[460px] overflow-hidden print:hidden">
          {([
            ["clinical", "hsl(236 80% 62% / 0.11)", "hsl(266 70% 60% / 0.07)"],
            ["voice", "hsl(346 80% 58% / 0.10)", "hsl(20 90% 60% / 0.06)"],
            ["business", "hsl(160 60% 42% / 0.10)", "hsl(190 70% 45% / 0.06)"],
          ] as const).map(([m, a, b]) => (
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
          className="relative flex flex-1 flex-col overflow-auto overscroll-contain"
        >
          <div key={location.pathname + location.search} className="page-enter flex-1">
            <Outlet />
          </div>
          {!shouldHideHeader && !isWorkingToolPage && <FooterLinks />}
        </main>
      </div>

      <BackToTop />
    </div>
  );
};

function fallbackTitleFor(seg: string) {
  return seg.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

export default MainLayout;
