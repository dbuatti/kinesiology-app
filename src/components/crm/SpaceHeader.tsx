
import React, { useState } from "react";
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
    if (m === 'clinical') return 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30';
    if (m === 'lab') return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30';
    if (m === 'business') return 'text-blue-600 bg-blue-50 dark:bg-blue-900/30';
    return 'text-amber-600 bg-amber-50 dark:bg-amber-900/30';
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

  const modeAccent = isVoiceMode ? 'text-rose-600 bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800' :
                     mode === 'business' ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
                     mode === 'clinical' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' :
                     mode === 'lab' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' :
                     'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';

  const modeIcon = isVoiceMode ? <Mic size={16} /> :
                   mode === 'business' ? <BarChart3 size={16} /> :
                   mode === 'clinical' ? <Activity size={16} /> :
                   mode === 'lab' ? <Zap size={16} /> :
                   <BookOpen size={16} />;

  const isModeItemActive = (path: string) => 
    location.pathname === path || (path !== "/" && location.pathname.startsWith(path));

  return (
    <header className="w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 h-16 flex items-center justify-between">
      {/* LEFT: LOGO & HUB SWITCHER */}
      <div className="flex items-center gap-4 md:gap-8">
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => { if (isVoiceMode) navigate('/'); }}
            className={cn(
              "w-8 h-8 rounded-lg text-xs font-black transition-all tracking-tight",
              !isVoiceMode
                ? "bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            )}
          >
            K
          </button>
          <button
            onClick={() => { if (!isVoiceMode) navigate('/voice'); }}
            className={cn(
              "w-8 h-8 rounded-lg text-xs font-black transition-all tracking-tight",
              isVoiceMode
                ? "bg-rose-500 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            )}
          >
            V
          </button>
        </div>

        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />

        <HubSwitcher />

        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />
      </div>

      {/* CENTER: CONTEXTUAL NAV */}
      <nav className="hidden xl:flex items-center gap-1 bg-slate-100/50 dark:bg-slate-900/50 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md">
        {isVoiceMode ? (
          VOICE_NAV_ITEMS.filter(item => item.label !== "Dashboard").map((item) => {
            const isActive = isModeItemActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-500",
                  isActive
                    ? "bg-rose-500 text-white shadow-md scale-[1.02]"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50"
                )}
              >
                <item.icon size={14} className={cn("transition-colors duration-500", isActive && "text-white")} />
                <span className="text-[10px] font-black uppercase tracking-[0.15em]">{item.label}</span>
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
                "flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-500",
                isActive
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md scale-[1.02]"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50"
              )}
            >
              <item.icon size={14} className={cn("transition-colors duration-500", isActive && "text-slate-700 dark:text-slate-300")} />
              <span className="text-[10px] font-black uppercase tracking-[0.15em]">{item.label}</span>
            </Link>
          );
        })}
        {modeNavItems.length > 0 && (
          <>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
            <div className="flex items-center">
              <button
                onClick={() => navigate(
                  isVoiceMode ? '/voice' :
                  mode === 'business' ? '/business/dashboard' : '/'
                )}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-500",
                  modeNavItems.some(item => isModeItemActive(item.path))
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md scale-[1.02]"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50"
                )}
              >
                {modeIcon}
                <span className="text-[10px] font-black uppercase tracking-[0.15em]">{modeLabel}</span>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={cn(
                    "p-1.5 rounded-xl transition-colors",
                    modeNavItems.some(item => isModeItemActive(item.path))
                      ? "text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      : "text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  )}>
                    <ChevronDown size={12} className="opacity-50" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 rounded-2xl p-2 shadow-3xl border-none bg-white dark:bg-slate-900">
                  {modeNavItems.map((item) => {
                    const active = isModeItemActive(item.path);
                    const accent = isVoiceMode ? 'text-rose-600' : mode === 'business' ? 'text-blue-600' : mode === 'clinical' ? 'text-indigo-600' : mode === 'lab' ? 'text-emerald-600' : 'text-amber-600';
                    return (
                      <DropdownMenuItem key={item.path} asChild className="rounded-xl p-0">
                        <Link
                          to={item.path}
                          className={cn(
                            "flex items-center gap-3 rounded-xl py-2.5 px-4 cursor-pointer",
                            active ? `${accent} bg-slate-100 dark:bg-slate-800 font-black` : "text-slate-600 dark:text-slate-400 font-bold hover:text-slate-900 dark:hover:text-white"
                          )}
                        >
                          <item.icon size={16} className={active ? accent : "opacity-50"} />
                          <span className="text-xs uppercase tracking-widest">{item.label}</span>
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
      <div className="flex items-center gap-2 md:gap-4">
        <div className="block w-auto lg:w-48">
          <SearchBar />
        </div>

        <div className="flex items-center gap-1">
          {mode === 'clinical' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20">
                  <Plus size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-3xl border-none bg-white dark:bg-slate-900">
                <DropdownMenuItem onClick={() => setClientDialogOpen(true)} className="rounded-xl py-2.5 px-4 cursor-pointer gap-3">
                  <UserPlus size={16} className="text-indigo-600" />
                  <span className="font-bold text-xs uppercase tracking-widest">New Client</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAppDialogOpen(true)} className="rounded-xl py-2.5 px-4 cursor-pointer gap-3">
                  <CalendarPlus size={16} className="text-indigo-600" />
                  <span className="font-bold text-xs uppercase tracking-widest">Book Session</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white">
                <Settings size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2 shadow-3xl border-none bg-white dark:bg-slate-900">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 mb-2">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Active Workspace</p>
                <div className={cn("flex items-center gap-3 p-2 rounded-xl", getModeColor(mode))}>
                  {getModeIcon(mode)}
                  <span className="font-black text-[10px] uppercase tracking-widest">{mode}</span>
                </div>
              </div>

              <DropdownMenuItem onClick={togglePrivacy} className="rounded-xl py-2.5 px-4 cursor-pointer gap-3">
                {isPrivate ? <EyeOff size={16} className="text-rose-500" /> : <Eye size={16} />}
                <span className="font-bold text-xs uppercase tracking-widest">{isPrivate ? "Disable Privacy" : "Enable Privacy"}</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => setHelpOpen(true)} className="rounded-xl py-2.5 px-4 cursor-pointer gap-3">
                <HelpCircle size={16} />
                <span className="font-bold text-xs uppercase tracking-widest">Help & Shortcuts</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-2" />
              
              <DropdownMenuItem asChild className="rounded-xl py-2.5 px-4 cursor-pointer gap-3">
                <Link to="/settings">
                  <Settings size={16} />
                  <span className="font-bold text-xs uppercase tracking-widest">System Settings</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleSignOut} className="rounded-xl py-2.5 px-4 cursor-pointer gap-3 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20">
                <LogOut size={16} />
                <span className="font-bold text-xs uppercase tracking-widest">Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden w-9 h-9 rounded-xl"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </div>

      {/* MOBILE MENU OVERLAY */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-[90] bg-white dark:bg-slate-950 md:hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-6 space-y-8">
            {isVoiceMode ? (
              <div className="space-y-4">
                <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest px-2">Voice Studio</p>
                <div className="grid grid-cols-1 gap-2">
                  {VOICE_NAV_ITEMS.filter(item => item.label !== "Dashboard").map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-2xl border transition-all",
                          isActive
                            ? "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 shadow-sm"
                            : "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800"
                        )}
                      >
                        <item.icon size={18} className={isActive ? "text-rose-500" : "text-slate-400"} />
                        <span className={cn("font-bold text-sm uppercase tracking-widest", isActive ? "text-rose-600" : "text-slate-600 dark:text-slate-400")}>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : (<>
            <div className="space-y-4">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-2">Navigation</p>
              <div className="grid grid-cols-1 gap-2">
                {FIXED_NAV_ITEMS.map((item) => {
                  const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl border transition-all",
                        isActive
                          ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm"
                          : "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800"
                      )}
                    >
                      <item.icon size={18} className={isActive ? "text-slate-700 dark:text-slate-300" : "text-slate-400"} />
                      <span className={cn("font-bold text-sm uppercase tracking-widest", isActive ? "text-slate-700 dark:text-slate-300" : "text-slate-600 dark:text-slate-400")}>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl border", modeAccent)}>
                {modeIcon}
                <span className="font-black text-xs uppercase tracking-widest">{modeLabel}</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {modeNavItems.map((item) => {
                  const active = isModeItemActive(item.path);
                  const accent = isVoiceMode ? 'text-rose-600' : mode === 'business' ? 'text-blue-600' : mode === 'clinical' ? 'text-indigo-600' : mode === 'lab' ? 'text-emerald-600' : 'text-amber-600';
                  const activeBg = isVoiceMode ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800' : mode === 'clinical' ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' : mode === 'lab' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl border transition-all",
                        active ? `${activeBg} shadow-sm` : "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800"
                      )}
                    >
                      <item.icon size={18} className={active ? accent : "text-slate-400"} />
                      <span className={cn("font-bold text-sm uppercase tracking-widest", active ? accent : "text-slate-600 dark:text-slate-400")}>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-2">Switch Workspace</p>
              <div className="grid grid-cols-4 gap-2">
                {(['clinical', 'lab', 'library', 'business'] as AppMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setMobileMenuOpen(false); }}
                    className={cn(
                      "flex flex-col items-center justify-center py-4 rounded-2xl border transition-all",
                      mode === m && m === 'clinical' ? "bg-white dark:bg-slate-800 border-indigo-500 shadow-lg text-indigo-600" :
                      mode === m && m === 'lab' ? "bg-white dark:bg-slate-800 border-emerald-500 shadow-lg text-emerald-600" :
                      mode === m && m === 'library' ? "bg-white dark:bg-slate-800 border-amber-500 shadow-lg text-amber-600" :
                      mode === m && m === 'business' ? "bg-white dark:bg-slate-800 border-blue-500 shadow-lg text-blue-600" :
                      "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400"
                    )}
                  >
                    {getModeIcon(m)}
                    <span className="text-[8px] font-black uppercase tracking-widest mt-2">{m}</span>
                  </button>
                ))}
              </div>
            </div>
          </>)}
          </div>
        </div>
      )}

      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-serif font-bold tracking-tight">Add New Client</DialogTitle>
          </DialogHeader>
          <ClientForm onSuccess={handleClientSuccess} />
        </DialogContent>
      </Dialog>

      <Dialog open={appDialogOpen} onOpenChange={(open) => { setAppDialogOpen(open); if (!open) setPrefilledClientId(undefined); }}>
        <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-serif font-bold tracking-tight">Schedule New Session</DialogTitle>
          </DialogHeader>
          <AppointmentForm initialClientId={prefilledClientId} onSuccess={() => { setAppDialogOpen(false); setPrefilledClientId(undefined); }} />
        </DialogContent>
      </Dialog>

      <HelpModal open={helpOpen} onOpenChange={setHelpOpen} />
    </header>
  );
};

export default SpaceHeader;