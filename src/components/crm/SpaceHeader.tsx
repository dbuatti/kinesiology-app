
import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Activity, 
  Zap, 
  BookOpen, 
  Settings, 
  LogOut, 
  Eye, 
  EyeOff,
  HelpCircle,
  ChevronDown,
  Menu,
  X,
  Mic,
  LayoutDashboard,
  CalendarDays,
  BarChart3,
  Timer,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppMode, AppMode } from "@/components/ModeProvider";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { CLINICAL_NAV_ITEMS, LAB_NAV_ITEMS, LIBRARY_NAV_ITEMS, VOICE_NAV_ITEMS, BUSINESS_NAV_ITEMS } from "@/config/navigation";
import { prefetchRoute } from "@/utils/route-prefetch";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess } from "@/utils/toast";
import SearchBar from "./SearchBar";
import HelpModal from "./HelpModal";
import { useActiveSession } from "@/hooks/useActiveSession";
import { format, differenceInSeconds } from "date-fns";

const WORKSPACES: { id: AppMode | 'voice'; label: string; path: string }[] = [
  { id: 'clinical', label: 'Clinical', path: '/' },
  { id: 'lab', label: 'Practice Lab', path: '/' },
  { id: 'library', label: 'Knowledge', path: '/' },
  { id: 'business', label: 'Business', path: '/business/dashboard' },
  { id: 'voice', label: 'Voice Studio', path: '/voice' },
];

const FIXED_NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Calendar", icon: CalendarDays, path: "/calendar" },
];

const SpaceHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, setMode } = useAppMode();
  const { isPrivate, togglePrivacy } = usePrivacyMode();
  const [helpOpen, setHelpOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeSession = useActiveSession();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const sessionTimer = useMemo(() => {
    if (!activeSession) return null;
    const elapsed = differenceInSeconds(currentTime, activeSession.date);
    const total = 60 * 60;
    const remaining = Math.max(0, total - elapsed);
    const overtime = Math.max(0, elapsed - total);
    const mins = Math.floor(overtime > 0 ? overtime : remaining) / 60;
    const secs = (overtime > 0 ? overtime : remaining) % 60;
    const progress = Math.min(100, (elapsed / total) * 100);
    return {
      display: overtime > 0 ? `+${Math.floor(mins)}m ${secs.toString().padStart(2, '0')}s` : `${Math.floor(mins)}m ${secs.toString().padStart(2, '0')}s`,
      clientName: activeSession.clientName,
      stage: activeSession.stage,
      progress,
      isOvertime: overtime > 0,
      isFinished: activeSession.status === 'Completed',
    };
  }, [activeSession, currentTime]);

  // Close mobile menu whenever the route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Always default to clinical on session pages
  useEffect(() => {
    if (location.pathname.startsWith('/appointments/') && mode !== 'clinical') {
      setMode('clinical');
    }
  }, [location.pathname]);

  const isVoiceMode = location.pathname.startsWith('/voice');

  const allNavItems = isVoiceMode ? VOICE_NAV_ITEMS :
                       mode === 'business' ? BUSINESS_NAV_ITEMS :
                       mode === 'clinical' ? CLINICAL_NAV_ITEMS : 
                       mode === 'lab' ? LAB_NAV_ITEMS :
                       LIBRARY_NAV_ITEMS;

  const modeNavItems = allNavItems.filter(
    item => !FIXED_NAV_ITEMS.some(fixed => fixed.label === item.label)
  );

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    showSuccess("Signed out successfully");
    navigate('/login');
  };

  const getModeColor = (m: AppMode) => {
    if (m === 'clinical') return 'text-chart-primary bg-muted';
    if (m === 'lab') return 'text-chart-emerald bg-muted';
    if (m === 'business') return 'text-chart-primary bg-muted';
    return 'text-muted-foreground bg-muted';
  };

  const getModeIcon = (m: AppMode) => {
    if (m === 'clinical') return <Activity size={16} />;
    if (m === 'lab') return <Zap size={16} />;
    if (m === 'business') return <BarChart3 size={16} />;
    return <BookOpen size={16} />;
  };

  const modeLabel = isVoiceMode ? 'Voice Studio' :
                    mode === 'business' ? 'Business Hub' :
                    mode === 'clinical' ? 'Clinical Hub' :
                    mode === 'lab' ? 'Practice Lab' : 'Knowledge Hub';

  const modeAccent = isVoiceMode ? 'text-chart-destructive bg-muted border-border' :
                     mode === 'business' ? 'text-chart-primary bg-muted border-border' :
                     mode === 'clinical' ? 'text-chart-primary bg-muted border-border' :
                     mode === 'lab' ? 'text-chart-emerald bg-muted border-border' :
                     'text-muted-foreground bg-muted border-border';

  const modeIcon = isVoiceMode ? <Mic size={16} /> :
                   mode === 'business' ? <BarChart3 size={16} /> :
                   mode === 'clinical' ? <Activity size={16} /> :
                   mode === 'lab' ? <Zap size={16} /> :
                   <BookOpen size={16} />;

  const isModeItemActive = (path: string) => 
    location.pathname === path || (path !== "/" && location.pathname.startsWith(path));

  return (
    <header className="relative w-full bg-card/80 backdrop-blur-xl border-b border-border px-3 md:px-6 h-12 flex items-center justify-between">
      {/* LEFT: LOGO */}
      <div className="flex items-center gap-3 md:gap-5">
        <button
          onClick={() => { isVoiceMode ? navigate('/') : navigate('/voice'); }}
          className="relative flex items-center p-px bg-muted rounded-full border border-border hover:shadow-sm transition-shadow"
        >
          <span className={cn(
            "absolute top-px h-[22px] w-[24px] rounded-full shadow-sm transition-transform duration-300 ease-out",
            isVoiceMode ? "translate-x-[24px] bg-chart-destructive" : "translate-x-0 bg-card"
          )} />
          <span className="relative z-10 w-6 h-6 rounded-full text-[10px] font-bold transition-colors duration-300 flex items-center justify-center">
            K
          </span>
          <span className="relative z-10 w-6 h-6 rounded-full text-[10px] font-bold transition-colors duration-300 flex items-center justify-center">
            V
          </span>
        </button>
      </div>

      {/* CENTER: FLAT NAV */}
      <nav className="hidden lg:flex items-center gap-0.5 bg-muted/50 p-0.5 rounded-lg border border-border/50 backdrop-blur-md absolute left-1/2 -translate-x-1/2">
        {isVoiceMode ? (
          <>
            <Link to="/voice" className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-chart-destructive text-[10px] font-semibold uppercase tracking-[0.15em] hover:bg-chart-destructive/10 transition-colors no-underline">
              Voice
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 -ml-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronDown size={10} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 rounded-xl p-1.5 border-none bg-card shadow-xl">
                {WORKSPACES.map((w) => (
                  <DropdownMenuItem key={w.id} onClick={() => { if (w.id !== 'voice') setMode(w.id as AppMode); navigate(w.path); }}>
                    <div className={cn("flex items-center gap-2.5 px-2 py-1.5 rounded-lg w-full", mode === w.id && "bg-muted")}>
                      <span className={cn("text-[10px] font-semibold uppercase tracking-[0.15em]", mode === w.id ? "text-foreground" : "text-muted-foreground")}>{w.label}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {VOICE_NAV_ITEMS.filter(i => i.label !== "Dashboard").map((item) => {
              const isActive = isModeItemActive(item.path);
              return (
                <Link key={item.path} to={item.path} onMouseEnter={() => prefetchRoute(item.path)} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300", isActive ? "bg-chart-destructive text-white shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                  <item.icon size={12} className={cn(isActive && "text-white")} />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.15em]">{item.label}</span>
                </Link>
              );
            })}
          </>
        ) : (
          <>
            <Link to={mode === 'business' ? '/business/dashboard' : '/'} className="flex items-center px-3 py-1.5 rounded-lg text-foreground text-[10px] font-semibold uppercase tracking-[0.15em] hover:bg-muted transition-colors no-underline">
              {modeLabel}
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 -ml-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronDown size={10} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 rounded-xl p-1.5 border-none bg-card shadow-xl">
                {WORKSPACES.map((w) => (
                  <DropdownMenuItem key={w.id} onClick={() => { if (w.id !== 'voice') setMode(w.id as AppMode); navigate(w.path); }}>
                    <div className={cn("flex items-center gap-2.5 px-2 py-1.5 rounded-lg w-full", mode === w.id && "bg-muted")}>
                      <span className={cn("text-[10px] font-semibold uppercase tracking-[0.15em]", mode === w.id ? "text-foreground" : "text-muted-foreground")}>{w.label}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {allNavItems.filter(i => i.label !== "Dashboard").map((item) => {
              const isActive = isModeItemActive(item.path);
              return (
                <Link key={item.path} to={item.path} onMouseEnter={() => prefetchRoute(item.path)} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300", isActive ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                  <item.icon size={12} className={cn(isActive && "text-foreground")} />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.15em]">{item.label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* RIGHT: ACTIONS & PROFILE */}
      <div className="flex items-center gap-1 md:gap-2 justify-self-end">
        {sessionTimer && (
          <Link
            to={`/appointments/${activeSession!.id}`}
            className={cn(
              "hidden sm:flex items-center gap-2 px-2 rounded-lg h-8 no-underline",
              sessionTimer.isOvertime ? "bg-chart-destructive/10 text-chart-destructive" : "bg-chart-emerald/10 text-chart-emerald"
            )}
          >
            <Timer size={12} />
            <span className="text-[10px] font-semibold tabular-nums font-mono">{sessionTimer.display}</span>
            <span className="w-px h-3 bg-current opacity-20" />
            <span className="text-[10px] font-medium truncate max-w-[120px]">{sessionTimer.clientName}</span>
            <span className="text-[8px] font-semibold uppercase tracking-wider bg-white/10 px-1 py-0.5 rounded">{sessionTimer.stage}</span>
          </Link>
        )}
        <SearchBar compact />

        <div className="flex items-center gap-0.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Settings menu" className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground">
                <Settings size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-xl p-2 shadow-sm border-none bg-card">
              <div className="px-4 py-3 border-b border-border mb-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Active Workspace</p>
                <div className={cn("flex items-center gap-3 p-2 rounded-xl", getModeColor(mode))}>
                  {getModeIcon(mode)}
                  <span className="font-semibold text-[10px] uppercase tracking-wider">{mode}</span>
                </div>
              </div>

              <DropdownMenuItem onClick={togglePrivacy} className="rounded-xl py-2.5 px-4 cursor-pointer gap-3">
                {isPrivate ? <EyeOff size={16} className="text-chart-destructive" /> : <Eye size={16} />}
                <span className="font-medium text-xs uppercase tracking-wider">{isPrivate ? "Disable Privacy" : "Enable Privacy"}</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => setHelpOpen(true)} className="rounded-xl py-2.5 px-4 cursor-pointer gap-3">
                <HelpCircle size={16} />
                <span className="font-medium text-xs uppercase tracking-wider">Help & Shortcuts</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-muted my-2" />
              
              <DropdownMenuItem asChild className="rounded-xl py-2.5 px-4 cursor-pointer gap-3">
                <Link to="/settings">
                  <Settings size={16} />
                  <span className="font-medium text-xs uppercase tracking-wider">System Settings</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleSignOut} className="rounded-xl py-2.5 px-4 cursor-pointer gap-3 text-chart-destructive hover:bg-muted">
                <LogOut size={16} />
                <span className="font-medium text-xs uppercase tracking-wider">Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            className="md:hidden w-8 h-8 rounded-lg"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </div>

      {/* MOBILE MENU OVERLAY */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-12 z-[90] bg-card md:hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-6 space-y-8">
            {isVoiceMode ? (
              <div className="space-y-4">
                <p className="text-[10px] font-semibold text-chart-destructive uppercase tracking-wider px-2">Voice Studio</p>
                <div className="grid grid-cols-1 gap-2">
                  {VOICE_NAV_ITEMS.filter(item => item.label !== "Dashboard").map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-xl border transition-all",
                          isActive
                            ? "bg-muted border-border shadow-sm"
                            : "bg-muted border-border"
                        )}
                      >
                        <item.icon size={18} className={isActive ? "text-chart-destructive" : "text-muted-foreground"} />
                        <span className={cn("font-medium text-sm uppercase tracking-wider", isActive ? "text-chart-destructive" : "text-muted-foreground")}>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : (<>
            <div className="space-y-4">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2">Navigation</p>
              <div className="grid grid-cols-1 gap-2">
                {FIXED_NAV_ITEMS.map((item) => {
                  const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl border transition-all",
                        isActive
                          ? "bg-muted border-border shadow-sm"
                          : "bg-muted border-border"
                      )}
                    >
                      <item.icon size={18} className={isActive ? "text-foreground" : "text-muted-foreground"} />
                      <span className={cn("font-medium text-sm uppercase tracking-wider", isActive ? "text-foreground" : "text-muted-foreground")}>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl border", modeAccent)}>
                {modeIcon}
                <span className="font-semibold text-xs uppercase tracking-wider">{modeLabel}</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {modeNavItems.map((item) => {
                  const active = isModeItemActive(item.path);
                  const accent = isVoiceMode ? 'text-chart-destructive' : mode === 'business' ? 'text-chart-primary' : mode === 'clinical' ? 'text-chart-primary' : mode === 'lab' ? 'text-chart-emerald' : 'text-muted-foreground';
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl border transition-all",
                        active ? "bg-muted shadow-sm" : "bg-muted border-border"
                      )}
                    >
                      <item.icon size={18} className={active ? accent : "text-muted-foreground"} />
                      <span className={cn("font-medium text-sm uppercase tracking-wider", active ? accent : "text-muted-foreground")}>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2">Switch Workspace</p>
              <div className="grid grid-cols-4 gap-2">
                {(['clinical', 'lab', 'library', 'business'] as AppMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setMobileMenuOpen(false); }}
                    className={cn(
                      "flex flex-col items-center justify-center py-4 rounded-xl border transition-all",
                      mode === m && m === 'clinical' ? "bg-card border-chart-primary shadow-sm text-chart-primary" :
                      mode === m && m === 'lab' ? "bg-card border-chart-emerald shadow-sm text-chart-emerald" :
                      mode === m && m === 'library' ? "bg-card border-border shadow-sm text-muted-foreground" :
                      mode === m && m === 'business' ? "bg-card border-chart-primary shadow-sm text-chart-primary" :
                      "bg-muted border-border text-muted-foreground"
                    )}
                  >
                    {getModeIcon(m)}
                    <span className="text-[10px] font-semibold uppercase tracking-wider mt-2">{m}</span>
                  </button>
                ))}
              </div>
            </div>
          </>)}
          </div>
        </div>
      )}

      <HelpModal open={helpOpen} onOpenChange={setHelpOpen} />
      {sessionTimer && !sessionTimer.isFinished && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-muted/30">
          <div className={cn("h-full transition-all duration-500", sessionTimer.isOvertime ? "bg-chart-destructive" : "bg-chart-primary")} style={{ width: `${sessionTimer.progress}%` }} />
        </div>
      )}
    </header>
  );
};

export default SpaceHeader;
