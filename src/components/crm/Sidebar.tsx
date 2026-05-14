"use client";

import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LogOut, 
  HelpCircle, 
  Zap, 
  BookOpen, 
  ArrowRight,
  PanelLeftClose,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  Eye,
  EyeOff,
  LayoutDashboard,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import SearchBar from "./SearchBar";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess } from "@/utils/toast";
import { useState } from "react";
import HelpModal from "./HelpModal";
import { useRecentClients } from "@/hooks/use-recent-clients";
import { useActiveSession } from "@/hooks/useActiveSession";
import { usePracticeStats } from "@/hooks/usePracticeStats";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { useAppMode, AppMode } from "@/components/ModeProvider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ClientForm from "./ClientForm";
import AppointmentForm from "./AppointmentForm";
import { Progress } from "@/components/ui/progress";
import { ModeToggle } from "./ModeToggle";
import { CLINICAL_NAV_ITEMS, LAB_NAV_ITEMS, LIBRARY_NAV_ITEMS } from "@/config/navigation";

interface SidebarProps {
  onHide?: () => void;
}

const Sidebar = ({ onHide }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, setMode } = useAppMode();
  const [helpOpen, setHelpOpen] = useState(false);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [appDialogOpen, setAppDialogOpen] = useState(false);
  const { isPrivate, togglePrivacy } = usePrivacyMode();
  
  const [opsOpen, setOpsOpen] = useState(true);

  const activeSession = useActiveSession();
  const { practiceHealth } = usePracticeStats();
  const { recentClients } = useRecentClients();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      showSuccess("Signed out successfully");
      navigate('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const NavItem = ({ item }: { item: any }) => {
    const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
    
    return (
      <Link
        to={item.path}
        className={cn(
          "flex items-center justify-between gap-3 px-3 py-2 rounded-xl transition-all duration-200 group",
          isActive
            ? "bg-slate-900 text-white shadow-sm"
            : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-900"
        )}
      >
        <div className="flex items-center gap-3">
          <item.icon size={14} className={cn("transition-all", isActive ? "text-indigo-400" : "group-hover:text-indigo-600")} />
          <span className="font-bold text-[10px] uppercase tracking-widest">{item.label}</span>
        </div>
      </Link>
    );
  };

  const NavGroup = ({ title, icon: Icon, isOpen, onToggle, items }: any) => (
    <div className="space-y-1">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all group"
      >
        <div className="flex items-center gap-3">
          <Icon size={14} />
          <span className="text-[9px] font-black uppercase tracking-[0.2em]">{title}</span>
        </div>
        {isOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
      </button>
      {isOpen && (
        <div className="space-y-0.5 pl-1 animate-in fade-in slide-in-from-top-1 duration-200">
          {items.map((item: any) => (
            <NavItem key={item.path} item={item} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="hidden lg:flex w-64 bg-white dark:bg-slate-950 text-foreground min-h-screen p-4 flex-col gap-6 sticky top-0 h-screen overflow-y-auto border-r border-slate-200 dark:border-slate-900 z-[60]">
      <div className="flex items-center justify-between px-2 py-2">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-slate-900 rounded flex items-center justify-center font-black text-xs text-white">A</div>
          <div>
            <h1 className="text-xs font-serif font-bold tracking-tight leading-none">Resonance</h1>
            <p className="text-[7px] text-slate-400 uppercase font-black tracking-[0.2em] mt-1">Clinical CRM</p>
          </div>
        </div>
        <button 
          onClick={onHide}
          className="text-slate-400 hover:text-slate-900 dark:hover:text-white rounded h-7 w-7 flex items-center justify-center transition-colors"
        >
          <PanelLeftClose size={14} />
        </button>
      </div>

      <div className="px-1 space-y-4">
        <div className="bg-slate-50 dark:bg-slate-900 p-1 rounded-xl flex gap-1 border border-slate-100 dark:border-slate-800">
          {(['clinical', 'lab', 'library'] as AppMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-1.5 rounded-lg transition-all duration-200",
                mode === m 
                  ? "bg-white dark:bg-slate-800 shadow-sm text-indigo-600" 
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              <span className="text-[7px] font-black uppercase tracking-widest">{m}</span>
            </button>
          ))}
        </div>
        <SearchBar />
      </div>

      <div className="px-1">
        <Button 
          onClick={() => setAppDialogOpen(true)}
          className="w-full justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-9 font-black text-[10px] uppercase tracking-[0.2em] shadow-sm"
        >
          <PlusCircle size={14} className="mr-2" /> 
          Book Session
        </Button>
      </div>
      
      <div className="space-y-4 flex-1">
        {mode === 'clinical' && (
          <NavGroup title="Operations" icon={LayoutDashboard} isOpen={opsOpen} onToggle={() => setOpsOpen(!opsOpen)} items={CLINICAL_NAV_ITEMS} />
        )}
        
        {mode === 'lab' && (
          <NavGroup title="Practice Lab" icon={Zap} isOpen={opsOpen} onToggle={() => setOpsOpen(!opsOpen)} items={LAB_NAV_ITEMS} />
        )}

        {mode === 'library' && (
          <NavGroup title="Library" icon={BookOpen} isOpen={opsOpen} onToggle={() => setOpsOpen(!opsOpen)} items={LIBRARY_NAV_ITEMS} />
        )}

        {activeSession && (
          <div className="px-1 pt-2">
            <Link 
              to={`/appointments/${activeSession.id}`}
              className="flex items-center gap-3 px-3 py-2.5 bg-slate-900 rounded-xl text-white shadow-md hover:bg-slate-800 transition-all group"
            >
              <div className="relative">
                <Zap size={12} className="text-indigo-400 fill-indigo-400" />
                <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[7px] font-black uppercase tracking-widest opacity-60 truncate">{activeSession.clientName}</span>
                <span className="text-[9px] font-bold">{activeSession.stage}</span>
              </div>
              <ArrowRight size={10} className="ml-auto group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}

        <div className="px-3 py-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 mx-1 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Practice Health</p>
            <span className="text-[9px] font-black text-emerald-600">{practiceHealth}%</span>
          </div>
          <Progress value={practiceHealth} className="h-1 bg-slate-200 dark:bg-slate-800 [&>div]:bg-emerald-500" />
        </div>
      </div>
      
      <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-900 space-y-1">
        <div className="flex items-center justify-between px-3 mb-2">
          <ModeToggle />
          <button 
            onClick={togglePrivacy}
            className={cn(
              "flex items-center justify-center h-7 w-7 rounded-lg transition-all",
              isPrivate ? "bg-rose-50 text-rose-600" : "text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            {isPrivate ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <button 
            onClick={() => setHelpOpen(true)}
            className="flex items-center justify-center h-7 w-7 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
          >
            <HelpCircle size={14} />
          </button>
        </div>

        <div 
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all cursor-pointer group"
        >
          <LogOut size={14} />
          <span className="font-bold text-[9px] uppercase tracking-widest">Sign Out</span>
        </div>
      </div>

      <HelpModal open={helpOpen} onOpenChange={setHelpOpen} />
      
      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-[2rem] p-8">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold tracking-tight">Add New Client</DialogTitle>
          </DialogHeader>
          <ClientForm onSuccess={() => { setClientDialogOpen(false); }} />
        </DialogContent>
      </Dialog>

      <Dialog open={appDialogOpen} onOpenChange={setAppDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2rem] p-8">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold tracking-tight">Schedule New Session</DialogTitle>
          </DialogHeader>
          <AppointmentForm onSuccess={() => { setAppDialogOpen(false); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sidebar;