
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Activity, 
  Zap, 
  BookOpen, 
  Plus, 
  Settings, 
  LogOut, 
  Eye, 
  EyeOff,
  HelpCircle,
  ChevronDown,
  UserPlus,
  CalendarPlus,
  Menu,
  X,
  Sparkles,
  Mic,
  LayoutDashboard,
  CalendarDays,
  BarChart3,
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
import { supabase } from "@/integrations/supabase/client";
import { showSuccess } from "@/utils/toast";
import SearchBar from "./SearchBar";
import HubSwitcher from "./HubSwitcher";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ClientForm from "./ClientForm";
import AppointmentForm from "./AppointmentForm";
import HelpModal from "./HelpModal";

const FIXED_NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Calendar", icon: CalendarDays, path: "/calendar" },
];

const SpaceHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, setMode } = useAppMode();
  const { isPrivate, togglePrivacy } = usePrivacyMode();
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [appDialogOpen, setAppDialogOpen] = useState(false);
  const [prefilledClientId, setPrefilledClientId] = useState<string | undefined>();
  const [helpOpen, setHelpOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu whenever the route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleClientSuccess = (newClientId?: string) => {
    setClientDialogOpen(false);
    if (newClientId) {
      setPrefilledClientId(newClientId);
      setAppDialogOpen(true);
    }
  };

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
    <header className="w-full bg-card/80 backdrop-blur-xl border-b border-border px-3 md:px-6 h-12 flex items-center justify-between">
      {/* LEFT: LOGO & HUB SWITCHER */}
      <div className="flex items-center gap-3 md:gap-5">
        <div className="flex items-center gap-1 p-0.5 bg-muted rounded-lg border border-border">
          <button
            onClick={() => { if (isVoiceMode) navigate('/'); }}
            className={cn(
              "w-7 h-7 rounded-md text-[10px] font-semibold transition-all tracking-tight",
              !isVoiceMode
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-muted-foreground"
            )}
          >
            K
          </button>
          <button
            onClick={() => { if (!isVoiceMode) navigate('/voice'); }}
            className={cn(
              "w-7 h-7 rounded-md text-[10px] font-semibold transition-all tracking-tight",
              isVoiceMode
                ? "bg-chart-destructive text-white shadow-sm"
                : "text-muted-foreground hover:text-muted-foreground"
            )}
          >
            V
          </button>
        </div>

        <div className="h-6 w-px bg-border hidden md:block" />

        <HubSwitcher />

        <div className="h-6 w-px bg-border hidden md:block" />
      </div>

      {/* CENTER: CONTEXTUAL NAV */}
      <nav className="hidden xl:flex items-center gap-0.5 bg-muted/50 p-0.5 rounded-lg border border-border/50 backdrop-blur-md">
        {isVoiceMode ? (
          VOICE_NAV_ITEMS.filter(item => item.label !== "Dashboard").map((item) => {
            const isActive = isModeItemActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-500",
                  isActive
                    ? "bg-chart-destructive text-white shadow-md scale-[1.02]"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon size={12} className={cn("transition-colors duration-500", isActive && "text-white")} />
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em]">{item.label}</span>
              </Link>
            );
          })
        ) : (<>
          {FIXED_NAV_ITEMS.map((item) => {
          const isActive = isModeItemActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-500",
                  isActive
                    ? "bg-card text-foreground shadow-sm scale-[1.02]"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon size={12} className={cn("transition-colors duration-500", isActive && "text-foreground")} />
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em]">{item.label}</span>
            </Link>
          );
        })}
        {modeNavItems.length > 0 && (
          <>
            <div className="w-px h-6 bg-border mx-1" />
            <div className="flex items-center">
              <Link
                to={isVoiceMode ? '/voice' : mode === 'business' ? '/business/dashboard' : '/'}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-500 no-underline",
                  modeNavItems.some(item => isModeItemActive(item.path))
                    ? "bg-card text-foreground shadow-sm scale-[1.02]"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {modeIcon}
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em]">{modeLabel}</span>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={cn(
                    "p-1.5 rounded-xl transition-colors",
                    modeNavItems.some(item => isModeItemActive(item.path))
                      ? "text-muted-foreground hover:text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}>
                    <ChevronDown size={12} className="opacity-50" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 rounded-xl p-2 shadow-sm border-none bg-card">
                  {modeNavItems.map((item) => {
                    const active = isModeItemActive(item.path);
                    const accent = isVoiceMode ? 'text-chart-destructive' : mode === 'business' ? 'text-chart-primary' : mode === 'clinical' ? 'text-chart-primary' : mode === 'lab' ? 'text-chart-emerald' : 'text-muted-foreground';
                    return (
                      <DropdownMenuItem key={item.path} asChild className="rounded-xl p-0">
                        <Link
                          to={item.path}
                          className={cn(
                            "flex items-center gap-3 rounded-xl py-2.5 px-4 cursor-pointer",
                            active ? `${accent} bg-muted font-semibold` : "text-muted-foreground font-medium hover:text-foreground"
                          )}
                        >
                          <item.icon size={16} className={active ? accent : "opacity-50"} />
                          <span className="text-xs uppercase tracking-wider">{item.label}</span>
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}
        </>)}
      </nav>

      {/* RIGHT: ACTIONS & PROFILE */}
      <div className="flex items-center gap-1 md:gap-2">
        <SearchBar compact />

        <div className="flex items-center gap-0.5">
          {mode === 'clinical' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" aria-label="Quick add" className="w-8 h-8 rounded-lg bg-primary hover:bg-primary/90 text-white shadow-sm">
                  <Plus size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl p-2 shadow-sm border-none bg-card">
                <DropdownMenuItem onClick={() => setClientDialogOpen(true)} className="rounded-xl py-2.5 px-4 cursor-pointer gap-3">
                  <UserPlus size={16} className="text-chart-primary" />
                  <span className="font-medium text-xs uppercase tracking-wider">New Client</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAppDialogOpen(true)} className="rounded-xl py-2.5 px-4 cursor-pointer gap-3">
                  <CalendarPlus size={16} className="text-chart-primary" />
                  <span className="font-medium text-xs uppercase tracking-wider">Book Session</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

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
        <div className="fixed inset-0 top-16 z-[90] bg-card md:hidden animate-in fade-in slide-in-from-top-4 duration-300">
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

      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-xl p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-serif font-medium tracking-tight">Add New Client</DialogTitle>
          </DialogHeader>
          <ClientForm onSuccess={handleClientSuccess} />
        </DialogContent>
      </Dialog>

      <Dialog open={appDialogOpen} onOpenChange={(open) => { setAppDialogOpen(open); if (!open) setPrefilledClientId(undefined); }}>
        <DialogContent className="sm:max-w-[550px] rounded-xl p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-serif font-medium tracking-tight">Schedule New Session</DialogTitle>
          </DialogHeader>
          <AppointmentForm initialClientId={prefilledClientId} onSuccess={() => { setAppDialogOpen(false); setPrefilledClientId(undefined); }} />
        </DialogContent>
      </Dialog>

      <HelpModal open={helpOpen} onOpenChange={setHelpOpen} />
    </header>
  );
};

export default SpaceHeader;
