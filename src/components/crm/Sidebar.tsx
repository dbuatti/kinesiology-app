"use client";

import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Users, 
  Calendar, 
  LayoutDashboard, 
  Target, 
  LogOut, 
  HelpCircle, 
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
  Workflow,
  Database,
  Bug,
  Sparkles,
  PlusCircle,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import SearchBar from "./SearchBar";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess } from "@/utils/toast";
import { useState, useEffect, useMemo } from "react";
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
import { ModeToggle } from "./ModeToggle";

interface SidebarProps {
  onHide?: () => void;
}

const Sidebar = ({ onHide }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [appDialogOpen, setAppDialogOpen] = useState(false);
  
  // Derive initial open states from current path to prevent flashing/collapsing on load
  const [opsOpen, setOpsOpen] = useState(() => 
    location.pathname === "/" || 
    location.pathname.startsWith("/appointments") || 
    location.pathname.startsWith("/clients")
  );
  const [labOpen, setLabOpen] = useState(() => 
    location.pathname.startsWith("/practice/calibrate") || 
    location.pathname.startsWith("/practice/procedures") || 
    location.pathname.startsWith("/oversight")
  );
  const [libraryOpen, setLibraryOpen] = useState(() => 
    location.pathname.startsWith("/resources") || 
    location.pathname.startsWith("/practice/self")
  );
  
  const activeSession = useActiveSession();
  const { practiceHealth } = usePracticeStats();
  const { recentClients } = useRecentClients();
  
  // Automatically expand the correct section when the path changes
  useEffect(() => {
    const path = location.pathname;
    if (path === "/" || path.startsWith("/appointments") || path.startsWith("/clients")) {
      setOpsOpen(true);
    }
    if (path.startsWith("/practice/calibrate") || path.startsWith("/practice/procedures") || path.startsWith("/oversight")) {
      setLabOpen(true);
    }
    if (path.startsWith("/resources") || path.startsWith("/practice/self")) {
      setLibraryOpen(true);
    }
  }, [location.pathname]);

  const opsItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/", shortcut: "⌘D" },
    { label: "Appointments", icon: Calendar, path: "/appointments", shortcut: "⌘2" },
    { label: "Clients", icon: Users, path: "/clients", shortcut: "⌘1" },
  ];

  const labItems = [
    { label: "Quick Calibrate", icon: Zap, path: "/practice/calibrate", shortcut: "⌘Q" },
    { label: "Procedures", icon: Target, path: "/practice/procedures", shortcut: "⌘P" },
    { label: "Oversight", icon: TrendingUp, path: "/oversight", shortcut: "⌘O" },
  ];

  const libraryItems = [
    { label: "Knowledge Base", icon: BookOpen, path: "/resources", shortcut: "⌘R" },
    { label: "Worksheets", icon: Compass, path: "/resources/worksheets/north-star", shortcut: "⌘N" },
    { label: "Self Practice", icon: Heart, path: "/practice/self", shortcut: "⌘S" },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'd': e.preventDefault(); navigate('/'); break;
          case '1': e.preventDefault(); navigate('/clients'); break;
          case '2': e.preventDefault(); navigate('/appointments'); break;
          case 'b': e.preventDefault(); setAppDialogOpen(true); break;
          case 'n': e.preventDefault(); navigate('/resources/worksheets/north-star'); break;
          case 'o': e.preventDefault(); navigate('/oversight'); break;
          case 's': e.preventDefault(); navigate('/practice/self'); break;
          case 'p': e.preventDefault(); navigate('/practice/procedures'); break;
          case 'r': e.preventDefault(); navigate('/resources'); break;
          case 'q': e.preventDefault(); navigate('/practice/calibrate'); break;
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
            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
        )}
      >
        <div className="flex items-center gap-3">
          <item.icon size={16} className={cn("transition-all duration-300", isActive ? "text-white" : "text-muted-foreground group-hover:text-indigo-50")} />
          <span className="font-bold text-[10px] uppercase tracking-widest">{item.label}</span>
        </div>
        {item.shortcut && (
          <kbd className={cn(
            "hidden xl:inline-flex h-4 select-none items-center gap-1 rounded border px-1 font-mono text-[8px] font-black opacity-0 group-hover:opacity-100 transition-all duration-300",
            isActive ? "border-indigo-400 bg-indigo-700 text-indigo-100" : "border-border bg-muted text-muted-foreground"
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

  const NavGroup = ({ title, icon: Icon, isOpen, onToggle, items }: any) => (
    <div className="space-y-1">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all group"
      >
        <div className="flex items-center gap-3">
          <Icon size={16} className="text-muted-foreground group-hover:text-indigo-500" />
          <span className="text-[9px] font-black uppercase tracking-[0.3em]">{title}</span>
        </div>
        {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {isOpen && (
        <div className="space-y-1 pl-1 animate-in fade-in slide-in-from-top-1 duration-300">
          {items.map((item: any) => (
            <NavItem key={item.path} item={item} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="hidden lg:flex w-64 bg-card dark:bg-slate-950 text-foreground min-h-screen p-4 flex-col gap-6 sticky top-0 h-screen overflow-y-auto border-r border-border shadow-2xl">
      <div className="flex items-center justify-between px-2 py-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-2xl shadow-indigo-500/40 transition-transform hover:scale-105">A</div>
          <div>
            <h1 className="text-lg font-black tracking-tight">Antigravity</h1>
            <p className="text-[8px] text-muted-foreground uppercase font-black tracking-[0.2em]">Kinesiology CRM</p>
          </div>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onHide}
              className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg h-8 w-8"
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

      {/* Primary CTA: Book Session */}
      <div className="px-1">
        <Button 
          onClick={() => setAppDialogOpen(true)}
          className="w-full justify-center bg-rose-600 hover:bg-rose-700 text-white rounded-2xl h-12 font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-rose-600/20 group"
        >
          <PlusCircle size={18} className="mr-3 group-hover:rotate-90 transition-transform duration-500" /> 
          Book Session
          <kbd className="ml-auto pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded border border-rose-400 bg-rose-700 px-1 font-mono text-[8px] font-black text-rose-100">
            ⌘B
          </kbd>
        </Button>
      </div>
      
      <div className="space-y-4 flex-1">
        <NavGroup title="Operations" icon={LayoutDashboard} isOpen={opsOpen} onToggle={() => setOpsOpen(!opsOpen)} items={opsItems} />
        <NavGroup title="Clinical Lab" icon={Zap} isOpen={labOpen} onToggle={() => setLabOpen(!labOpen)} items={labItems} />
        <NavGroup title="Library" icon={BookOpen} isOpen={libraryOpen} onToggle={() => setLibraryOpen(!libraryOpen)} items={libraryItems} />

        {/* Active Session Indicator */}
        {activeSession && (
          <div className="px-1 pt-2">
            <Link 
              to={`/appointments/${activeSession.id}`}
              className="flex items-center gap-3 px-4 py-4 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all duration-500 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 animate-pulse" />
              <div className="relative z-10 flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                    <Zap size={18} className="fill-white" />
                  </div>
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-white rounded-full animate-ping" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] font-black uppercase tracking-0.2em opacity-80 truncate">{activeSession.clientName}</span>
                  <span className="text-[11px] font-black">{activeSession.stage}</span>
                </div>
              </div>
              <ArrowRight size={16} className="ml-auto group-hover:translate-x-1 transition-transform shrink-0" />
            </Link>
          </div>
        )}

        {/* Practice Health */}
        <div className="px-4 py-4 bg-muted/30 rounded-2xl border border-border mx-1 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
              <ShieldCheck size={12} className="text-emerald-500" /> Health
            </p>
            <span className="text-[10px] font-black text-emerald-500">{practiceHealth}%</span>
          </div>
          <Progress value={practiceHealth} className="h-1.5 bg-muted [&>div]:bg-emerald-500" />
        </div>

        {/* Recent Clients */}
        {recentClients.length > 0 && (
          <div className="px-1 space-y-2">
            <div className="px-3">
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2">
                <Clock size={12} /> Recent
              </p>
            </div>
            <div className="flex flex-col gap-1">
              {recentClients.map(client => (
                <Tooltip key={client.id}>
                  <TooltipTrigger asChild>
                    <Link 
                      to={`/clients/${client.id}`}
                      className="flex items-center gap-3 text-xs text-muted-foreground hover:text-indigo-500 transition-all duration-300 py-2 px-3 rounded-xl hover:bg-accent/50 truncate group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-muted border border-border flex items-center justify-center text-[9px] font-black group-hover:border-indigo-500/40 transition-all">
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
      <div className="mt-auto pt-4 border-t border-border space-y-1">
        <div className="flex items-center justify-between px-3 mb-2">
          <ModeToggle />
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={() => setHelpOpen(true)}
                className="flex items-center justify-center h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-300 group"
              >
                <HelpCircle size={20} className="group-hover:text-amber-400 transition-colors" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="rounded-xl font-bold text-xs">
              <p>Help & Shortcuts</p>
              <p className="text-[10px] text-slate-400 mt-1">⌘/</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              onClick={handleSignOut}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-accent transition-all duration-300 cursor-pointer group"
            >
              <LogOut size={18} className="group-hover:text-rose-500 transition-colors" />
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
        <DialogContent className="sm:max-w-[550px] rounded-[2rem] p-8">
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