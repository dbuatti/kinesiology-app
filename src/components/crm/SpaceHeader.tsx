
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
  Sparkles
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
import { CLINICAL_NAV_ITEMS, LAB_NAV_ITEMS, LIBRARY_NAV_ITEMS } from "@/config/navigation";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess } from "@/utils/toast";
import SearchBar from "./SearchBar";
import HubSwitcher from "./HubSwitcher";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ClientForm from "./ClientForm";
import AppointmentForm from "./AppointmentForm";
import HelpModal from "./HelpModal";

const SpaceHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, setMode } = useAppMode();
  const { isPrivate, togglePrivacy } = usePrivacyMode();
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [appDialogOpen, setAppDialogOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = mode === 'clinical' ? CLINICAL_NAV_ITEMS : 
                   mode === 'lab' ? LAB_NAV_ITEMS : 
                   LIBRARY_NAV_ITEMS;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    showSuccess("Signed out successfully");
    navigate('/login');
  };

  const getModeColor = (m: AppMode) => {
    if (m === 'clinical') return 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30';
    if (m === 'lab') return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30';
    return 'text-amber-600 bg-amber-50 dark:bg-amber-900/30';
  };

  const getModeIcon = (m: AppMode) => {
    if (m === 'clinical') return <Activity size={16} />;
    if (m === 'lab') return <Zap size={16} />;
    return <BookOpen size={16} />;
  };

  return (
    <header className="w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 h-16 flex items-center justify-between">
      {/* LEFT: LOGO & HUB SWITCHER */}
      <div className="flex items-center gap-4 md:gap-8">
        <Link to="/?view=hub" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-slate-900 font-black text-sm transition-all group-hover:scale-110 group-hover:rotate-3 shadow-lg">
            A
          </div>
        </Link>

        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />

        <HubSwitcher />
      </div>

      {/* CENTER: CONTEXTUAL NAV */}
      <nav className="hidden xl:flex items-center gap-1 bg-slate-100/50 dark:bg-slate-900/50 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
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
              <item.icon size={14} className={cn("transition-colors duration-500", isActive && (mode === 'clinical' ? 'text-indigo-600' : mode === 'lab' ? 'text-emerald-600' : 'text-amber-600'))} />
              <span className="text-[10px] font-black uppercase tracking-[0.15em]">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* RIGHT: ACTIONS & PROFILE */}
      <div className="flex items-center gap-2 md:gap-4">
        <div className="hidden lg:block w-48">
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
            <div className="space-y-4">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-2">Navigation</p>
              <div className="grid grid-cols-1 gap-2">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
                  const modeAccent = mode === 'clinical' ? 'text-indigo-600' : mode === 'lab' ? 'text-emerald-600' : 'text-amber-600';
                  const modeActiveBg = mode === 'clinical' ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' : mode === 'lab' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl border transition-all",
                        isActive
                          ? `${modeActiveBg} shadow-sm`
                          : "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800"
                      )}
                    >
                      <item.icon size={18} className={isActive ? modeAccent : "text-slate-400"} />
                      <span className={cn("font-bold text-sm uppercase tracking-widest", isActive ? modeAccent : "text-slate-600 dark:text-slate-400")}>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-2">Switch Workspace</p>
              <div className="grid grid-cols-3 gap-2">
                {(['clinical', 'lab', 'library'] as AppMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setMobileMenuOpen(false); }}
                    className={cn(
                      "flex flex-col items-center justify-center py-4 rounded-2xl border transition-all",
                      mode === m && m === 'clinical' ? "bg-white dark:bg-slate-800 border-indigo-500 shadow-lg text-indigo-600" :
                      mode === m && m === 'lab' ? "bg-white dark:bg-slate-800 border-emerald-500 shadow-lg text-emerald-600" :
                      mode === m && m === 'library' ? "bg-white dark:bg-slate-800 border-amber-500 shadow-lg text-amber-600" :
                      "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400"
                    )}
                  >
                    {getModeIcon(m)}
                    <span className="text-[8px] font-black uppercase tracking-widest mt-2">{m}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-serif font-bold tracking-tight">Add New Client</DialogTitle>
          </DialogHeader>
          <ClientForm onSuccess={() => setClientDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={appDialogOpen} onOpenChange={setAppDialogOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-serif font-bold tracking-tight">Schedule New Session</DialogTitle>
          </DialogHeader>
          <AppointmentForm onSuccess={() => setAppDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <HelpModal open={helpOpen} onOpenChange={setHelpOpen} />
    </header>
  );
};

export default SpaceHeader;