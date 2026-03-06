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
  Compass,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Workflow
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
  onHide?: () => void;
}

const Sidebar = ({ onHide }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [appDialogOpen, setAppDialogOpen] = useState(false);
  const [practiceOpen, setPracticeOpen] = useState(true);
  const [resourcesOpen, setResourcesOpen] = useState(true);
  
  const activeSession = useActiveSession();
  const { practiceHealth } = usePracticeStats();
  const { recentClients } = useRecentClients();
  
  const coreNavItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/", shortcut: "⌘D" },
    { label: "Clients", icon: Users, path: "/clients", shortcut: "⌘1" },
    { label: "Appointments", icon: Calendar, path: "/appointments", shortcut: "⌘2" },
    { label: "Oversight", icon: TrendingUp, path: "/oversight", shortcut: "⌘O" },
  ];

  const practiceNavItems = [
    { label: "Quick Calibrate", icon: Zap, path: "/quick-calibrate", shortcut: "⌘Q" },
    { label: "Self Practice", icon: Heart, path: "/self-practice", shortcut: "⌘S" },
    { label: "Procedures", icon: Target, path: "/procedures", shortcut: "⌘P" },
  ];

  const resourceNavItems = [
    { label: "North Star", icon: Compass, path: "/north-star", shortcut: "⌘N" },
    { label: "Resources", icon: BookOpen, path: "/resources", shortcut: "⌘R" },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'd': e.preventDefault(); navigate('/'); break;
          case '1': e.preventDefault(); navigate('/clients'); break;
          case '2': e.preventDefault(); navigate('/appointments'); break;
          case 'n': e.preventDefault(); navigate('/north-star'); break;
          case 'o': e.preventDefault(); navigate('/oversight'); break;
          case 's': e.preventDefault(); navigate('/self-practice'); break;
          case 'p': e.preventDefault(); navigate('/procedures'); break;
          case 'r': e.preventDefault(); navigate('/resources'); break;
          case 'q': e.preventDefault(); navigate('/quick-calibrate'); break;
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

  const NavItem = ({ item, tooltip = true }: { item: any, tooltip?: boolean }) => {
    const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
    
    const linkContent = (
      <Link
        to={item.path}
        className={cn(
          "flex items-center justify-between gap-2 px-3 py-2 rounded-xl transition-all duration-300 group",
          isActive 
            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
            : "text-slate-400 hover:text-white hover:bg-slate-900"
        )}
      >
        <div className="flex items-center gap-2.5">
          <item.icon size={16} className={cn("transition-all duration-300", isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300")} />
          <span className="font-bold text-[10px] uppercase tracking-widest">{item.label}</span>
        </div>
        {item.shortcut && (
          <kbd className={cn(
            "hidden xl:inline-flex h-4 select-none items-center gap-1 rounded border px-1 font-mono text-[8px] font-black opacity-0 group-hover:opacity-100 transition-all duration-300",
            isActive ? "border-indigo-400 bg-indigo-700 text-indigo-100" : "border-slate-800 bg-slate-900 text-slate-600"
          )}>
            {item.shortcut}
          </kbd>
        )}
      </Link>
    );

    if (!tooltip) return linkContent;

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {linkContent}
        </TooltipTrigger>
        <TooltipContent side="right" className="rounded-xl font-bold text-xs">
          <p>{item.label}</p>
          {item.shortcut && <p className="text-[10px] text-slate-400 mt-1">{item.shortcut}</p>}
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <div className="hidden lg:flex w-64 bg-slate-950 text-white min-h-screen p-4 flex-col gap-6 sticky top-0 h-screen overflow-y-auto border-r border-slate-900 shadow-2xl">
      <div className="flex items-center justify-between px-2 py-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-xl shadow-2xl shadow-indigo-500/40 transition-transform hover:scale-105">A</div>
          <div>
            <h1 className="text-lg font-black tracking-tight">Antigravity</h1>
            <p className="text-[8px] text-slate-500 uppercase font-black tracking-[0.2em]">Kinesiology CRM</p>
          </div>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onHide}
              className="text-slate-600 hover:text-white hover:bg-slate-900 rounded-lg h-8 w-8"
            >
              <PanelLeftClose size={18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="rounded-xl font-bold text-xs">
            <p>Hide Sidebar</p>
            <p className="text-[10px] text-slate-400 mt-1">⌘[</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="px-1">
        <SearchBar />
      </div>

      {/* Quick Actions */}
      <div className="px-1 space-y-1.5">
        <Button 
          onClick={() => setClientDialogOpen(true)}
          variant="outline"
          className="w-full justify-start bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl h-9 font-bold text-[10px] uppercase tracking-wider"
        >
          <UserPlus size={16} className="mr-2.5" /> New Client
        </Button>
        <Button 
          onClick={() => setAppDialogOpen(true)}
          className="w-full justify-start bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-9 font-bold text-[10px] uppercase tracking-wider shadow-lg shadow-rose-600/20"
        >
          <CalendarPlus size={16} className="mr-2.5" /> Book Session
        </Button>
      </div>
      
      <div className="space-y-5 flex-1">
        {/* Core Navigation */}
        <nav className="space-y-0.5">
          <div className="px-2 mb-2">
            <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em]">Core</p>
          </div>
          {coreNavItems.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}
        </nav>

        {/* Practice Section */}
        <div className="space-y-0.5">
          <button
            onClick={() => setPracticeOpen(!practiceOpen)}
            className="flex items-center justify-between w-full px-3 py-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-900 transition-all group"
          >
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-slate-600 group-hover:text-slate-400" />
              <span className="text-[8px] font-black uppercase tracking-[0.3em]">Practice</span>
            </div>
            {practiceOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          
          {practiceOpen && (
            <div className="space-y-0.5 pl-1 animate-in fade-in slide-in-from-top-1 duration-300">
              {practiceNavItems.map((item) => (
                <NavItem key={item.path} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Resources Section */}
        <div className="space-y-0.5">
          <button
            onClick={() => setResourcesOpen(!resourcesOpen)}
            className="flex items-center justify-between w-full px-3 py-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-900 transition-all group"
          >
            <div className="flex items-center gap-2">
              <BookOpen size={14} className="text-slate-600 group-hover:text-slate-400" />
              <span className="text-[8px] font-black uppercase tracking-[0.3em]">Resources</span>
            </div>
            {resourcesOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          
          {resourcesOpen && (
            <div className="space-y-0.5 pl-1 animate-in fade-in slide-in-from-top-1 duration-300">
              {resourceNavItems.map((item) => (
                <NavItem key={item.path} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Active Session Indicator */}
        {activeSession && (
          <div className="px-1">
            <Link 
              to={`/appointments/${activeSession.id}`}
              className="flex items-center gap-3 px-4 py-3 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all duration-500 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 animate-pulse" />
              <div className="relative z-10 flex items-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Zap size={16} className="fill-white" />
                  </div>
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-white rounded-full animate-ping" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-80 truncate">{activeSession.clientName}</span>
                  <span className="text-[10px] font-black">{activeSession.stage}</span>
                </div>
              </div>
              <ArrowRight size={14} className="ml-auto group-hover:translate-x-1 transition-transform shrink-0" />
            </Link>
          </div>
        )}

        {/* Practice Health */}
        <div className="px-3 py-3 bg-slate-900/50 rounded-2xl border border-slate-800/50 mx-1 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1.5">
              <ShieldCheck size={10} className="text-emerald-500" /> Health
            </p>
            <span className="text-[9px] font-black text-emerald-500">{practiceHealth}%</span>
          </div>
          <Progress value={practiceHealth} className="h-1 bg-slate-800 [&>div]:bg-emerald-500" />
        </div>

        {/* Recent Clients */}
        {recentClients.length > 0 && (
          <div className="px-1 space-y-2">
            <div className="px-2">
              <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] flex items-center gap-1.5">
                <Clock size={10} /> Recent
              </p>
            </div>
            <div className="flex flex-col gap-0.5">
              {recentClients.map(client => (
                <Tooltip key={client.id}>
                  <TooltipTrigger asChild>
                    <Link 
                      to={`/clients/${client.id}`}
                      className="flex items-center gap-2.5 text-xs text-slate-500 hover:text-indigo-400 transition-all duration-300 py-2 px-3 rounded-lg hover:bg-slate-900 truncate group"
                    >
                      <div className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-[8px] font-black group-hover:border-indigo-500/40 transition-all">
                        {client.name.charAt(0)}
                      </div>
                      <span className="truncate font-bold text-[11px]">{client.name}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="rounded-xl font-bold text-xs">
                    <p>View {client.name}'s profile</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Footer Actions */}
      <div className="mt-auto pt-4 border-t border-slate-900 space-y-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              onClick={() => setHelpOpen(true)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-900 transition-all duration-300 w-full text-left group"
            >
              <HelpCircle size={16} className="group-hover:text-amber-400 transition-colors" />
              <span className="font-bold text-[10px] uppercase tracking-widest">Help</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="rounded-xl font-bold text-xs">
            <p>Keyboard shortcuts & tips</p>
            <p className="text-[10px] text-slate-400 mt-1">⌘/</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Link 
              to="/settings"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-900 transition-all duration-300 group"
            >
              <Settings size={16} className="group-hover:text-indigo-400 transition-colors" />
              <span className="font-bold text-[10px] uppercase tracking-widest">Settings</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="rounded-xl font-bold text-xs">
            <p>Account & preferences</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              onClick={handleSignOut}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-all duration-300 cursor-pointer group"
            >
              <LogOut size={16} className="group-hover:text-rose-400 transition-colors" />
              <span className="font-bold text-[10px] uppercase tracking-widest">Sign Out</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="rounded-xl font-bold text-xs">
            <p>Sign out of your account</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <HelpModal open={helpOpen} onOpenChange={setHelpOpen} />
      
      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-black tracking-tight">Add New Client</DialogTitle>
          </DialogHeader>
          <ClientForm onSuccess={() => { setClientDialogOpen(false); }} />
        </DialogContent>
      </Dialog>

      <Dialog open={appDialogOpen} onOpenChange={setAppDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-black tracking-tight">Schedule New Session</DialogTitle>
          </DialogHeader>
          <AppointmentForm onSuccess={() => { setAppDialogOpen(false); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sidebar;