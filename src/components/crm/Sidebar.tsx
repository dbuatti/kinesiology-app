"use client";

import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Users, 
  Calendar, 
  LayoutDashboard, 
  Target, 
  LogOut, 
  HelpCircle, 
  Clock, 
  Zap, 
  BookOpen, 
  Heart, 
  TrendingUp,
  ArrowRight,
  CalendarPlus,
  Settings,
  ShieldCheck,
  PanelLeftClose,
  Compass
} from "lucide-react";
import { cn } from "@/lib/utils";
import SearchBar from "./SearchBar";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess } from "@/utils/toast";
import { useState, useEffect } from "react";
import HelpModal from "./HelpModal";
import { useRecentClients } from "@/hooks/use-recent-clients";
import { useActiveSession } from "@/hooks/useActiveSession";
import { usePracticeStats } from "@/hooks/usePracticeStats";
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
import { Badge } from "@/components/ui/badge";

interface SidebarProps {
  onHide?: () => void;
}

const Sidebar = ({ onHide }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [appDialogOpen, setAppDialogOpen] = useState(false);
  
  const activeSession = useActiveSession();
  const { practiceHealth } = usePracticeStats();
  const { recentClients } = useRecentClients();
  
  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/", shortcut: "⌘D" },
    { label: "Clients", icon: Users, path: "/clients", shortcut: "⌘1" },
    { label: "Appointments", icon: Calendar, path: "/appointments", shortcut: "⌘2" },
    { label: "Self Practice", icon: Heart, path: "/self-practice", shortcut: "⌘S" },
    { label: "Procedures", icon: Target, path: "/procedures", shortcut: "⌘P" },
    { label: "Resources", icon: BookOpen, path: "/resources", shortcut: "⌘R" },
  ];

  const secondaryItems = [
    { label: "North Star", icon: Compass, path: "/north-star" },
    { label: "Clinical Oversight", icon: TrendingUp, path: "/oversight" },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'd': e.preventDefault(); navigate('/'); break;
          case '1': e.preventDefault(); navigate('/clients'); break;
          case '2': e.preventDefault(); navigate('/appointments'); break;
          case 's': e.preventDefault(); navigate('/self-practice'); break;
          case 'p': e.preventDefault(); navigate('/procedures'); break;
          case 'r': e.preventDefault(); navigate('/resources'); break;
          case '/': e.preventDefault(); setHelpOpen(true); break;
          case '[': e.preventDefault(); onHide?.(); break;
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate, onHide]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      showSuccess("Signed out successfully");
      navigate('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="hidden lg:flex w-72 bg-slate-950 text-white min-h-screen p-6 flex-col gap-6 sticky top-0 h-screen overflow-y-auto border-r border-slate-900 shadow-2xl">
      <div className="flex items-center justify-between px-2 py-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-indigo-500/40">A</div>
          <div>
            <h1 className="text-lg font-black tracking-tight">Antigravity</h1>
            <p className="text-[8px] text-slate-500 uppercase font-black tracking-[0.2em]">Kinesiology CRM</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onHide}
          className="h-8 w-8 text-slate-600 hover:text-white hover:bg-slate-900 rounded-lg"
        >
          <PanelLeftClose size={18} />
        </Button>
      </div>

      <div className="px-2">
        <SearchBar />
      </div>
      
      <div className="space-y-6 flex-1">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group",
                  isActive 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} className={cn("transition-colors", isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300")} />
                  <span className="font-bold text-xs uppercase tracking-wider">{item.label}</span>
                </div>
                {item.shortcut && (
                  <kbd className={cn(
                    "hidden xl:inline-flex h-5 select-none items-center gap-1 rounded border px-1.5 font-mono text-[9px] font-black opacity-0 group-hover:opacity-100 transition-opacity",
                    isActive ? "border-indigo-400 bg-indigo-700 text-indigo-100" : "border-slate-800 bg-slate-900 text-slate-600"
                  )}>
                    {item.shortcut}
                  </kbd>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-2 space-y-1">
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] px-2 mb-2">More</p>
          {secondaryItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group",
                  isActive 
                    ? "bg-slate-900 text-white" 
                    : "text-slate-500 hover:text-white hover:bg-slate-900"
                )}
              >
                <item.icon size={16} className="transition-colors" />
                <span className="font-bold text-xs uppercase tracking-wider">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="px-2">
          <Button 
            onClick={() => setAppDialogOpen(true)}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-11 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-600/20"
          >
            <CalendarPlus size={16} className="mr-2" />
            Book Session
          </Button>
        </div>

        {activeSession && (
          <div className="px-2">
            <Link 
              to={`/appointments/${activeSession.id}`}
              className="flex items-center gap-3 px-4 py-3 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-all group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 animate-pulse" />
              <div className="relative z-10 flex items-center gap-3 flex-1 min-w-0">
                <div className="relative">
                  <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
                    <Zap size={18} className="fill-white" />
                  </div>
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full animate-ping" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[8px] font-black uppercase tracking-wider opacity-80 truncate">{activeSession.clientName}</span>
                  <span className="text-xs font-black truncate">{activeSession.stage}</span>
                </div>
              </div>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform shrink-0" />
            </Link>
          </div>
        )}

        <div className="px-4 py-4 bg-slate-900/50 rounded-xl border border-slate-800/50 mx-2 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck size={11} className="text-emerald-500" /> Practice Health
            </p>
            <span className="text-xs font-black text-emerald-500">{practiceHealth}%</span>
          </div>
          <Progress value={practiceHealth} className="h-1.5 bg-slate-800 [&>div]:bg-emerald-500" />
          <p className="text-[8px] text-slate-500 font-medium leading-tight">
            Clients at functional BOLT baseline (25s+)
          </p>
        </div>

        {recentClients.length > 0 && (
          <div className="px-2 space-y-3">
            <div className="flex items-center justify-between px-2">
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-2">
                <Clock size={11} /> Recent
              </p>
              <Badge variant="outline" className="border-slate-800 text-slate-500 h-5 px-2 text-[8px] font-black">
                {recentClients.length}
              </Badge>
            </div>
            <div className="flex flex-col gap-1">
              {recentClients.slice(0, 4).map(client => (
                <Link 
                  key={client.id} 
                  to={`/clients/${client.id}`}
                  className="flex items-center gap-3 text-sm text-slate-500 hover:text-indigo-400 transition-all py-2 px-3 rounded-lg hover:bg-slate-900 truncate group"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-[9px] font-black group-hover:border-indigo-500/40 transition-all">
                    {client.name.charAt(0)}
                  </div>
                  <span className="truncate font-bold text-xs">{client.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-auto pt-4 border-t border-slate-900 space-y-1">
        <button 
          onClick={() => setHelpOpen(true)}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-500 hover:text-white hover:bg-slate-900 transition-all w-full text-left group"
        >
          <HelpCircle size={16} className="group-hover:text-amber-400 transition-colors" />
          <span className="font-bold text-xs uppercase tracking-wider">Help</span>
        </button>

        <Link 
          to="/settings"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-500 hover:text-white hover:bg-slate-900 transition-all group"
        >
          <Settings size={16} className="group-hover:text-indigo-400 transition-colors" />
          <span className="font-bold text-xs uppercase tracking-wider">Settings</span>
        </Link>

        <div 
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-all cursor-pointer group"
        >
          <LogOut size={16} className="group-hover:text-rose-400 transition-colors" />
          <span className="font-bold text-xs uppercase tracking-wider">Sign Out</span>
        </div>
      </div>

      <HelpModal open={helpOpen} onOpenChange={setHelpOpen} />
      
      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-[2.5rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Add New Client</DialogTitle>
          </DialogHeader>
          <ClientForm onSuccess={() => { setClientDialogOpen(false); }} />
        </DialogContent>
      </Dialog>

      <Dialog open={appDialogOpen} onOpenChange={setAppDialogOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-[2.5rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Schedule New Session</DialogTitle>
          </DialogHeader>
          <AppointmentForm onSuccess={() => { setAppDialogOpen(false); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sidebar;