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
  Settings,
  ShieldCheck,
  PanelLeftClose,
  Compass,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  Clock,
  Eye,
  EyeOff,
  Lock,
  FileText,
  Briefcase,
  CalendarDays,
  Mic
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
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
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
  const { isPrivate, togglePrivacy } = usePrivacyMode();
  
  const isOpsPath = (path: string) => path === "/" || path.startsWith("/appointments") || path.startsWith("/clients") || path === "/availability";
  const isLabPath = (path: string) => path.startsWith("/practice/calibrate") || path.startsWith("/practice/procedures") || path.startsWith("/oversight");
  const isLibraryPath = (path: string) => path.startsWith("/resources") || path.startsWith("/practice/self") || path.startsWith("/peace-framework");
  const isBusinessPath = (path: string) => path.startsWith("/business");

  const [opsOpen, setOpsOpen] = useState(() => {
    const saved = localStorage.getItem("sidebar_ops_open");
    return saved !== null ? JSON.parse(saved) : isOpsPath(location.pathname);
  });
  const [labOpen, setLabOpen] = useState(() => {
    const saved = localStorage.getItem("sidebar_lab_open");
    return saved !== null ? JSON.parse(saved) : isLabPath(location.pathname);
  });
  const [libraryOpen, setLibraryOpen] = useState(() => {
    const saved = localStorage.getItem("sidebar_library_open");
    return saved !== null ? JSON.parse(saved) : isLibraryPath(location.pathname);
  });
  const [businessOpen, setBusinessOpen] = useState(() => {
    const saved = localStorage.getItem("sidebar_business_open");
    return saved !== null ? JSON.parse(saved) : isBusinessPath(location.pathname);
  });

  useEffect(() => { localStorage.setItem("sidebar_ops_open", JSON.stringify(opsOpen)); }, [opsOpen]);
  useEffect(() => { localStorage.setItem("sidebar_lab_open", JSON.stringify(labOpen)); }, [labOpen]);
  useEffect(() => { localStorage.setItem("sidebar_library_open", JSON.stringify(libraryOpen)); }, [libraryOpen]);
  useEffect(() => { localStorage.setItem("sidebar_business_open", JSON.stringify(businessOpen)); }, [businessOpen]);
  
  const activeSession = useActiveSession();
  const { practiceHealth } = usePracticeStats();
  const { recentClients } = useRecentClients();
  
  useEffect(() => {
    const path = location.pathname;
    if (isOpsPath(path)) setOpsOpen(true);
    if (isLabPath(path)) setLabOpen(true);
    if (isLibraryPath(path)) setLibraryOpen(true);
    if (isBusinessPath(path)) setBusinessOpen(true);
  }, [location.pathname]);

  const opsItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/", shortcut: "⌘D" },
    { label: "Appointments", icon: Calendar, path: "/appointments", shortcut: "⌘2" },
    { label: "Clients", icon: Users, path: "/clients", shortcut: "⌘1" },
    { label: "Availability", icon: CalendarDays, path: "/availability" },
  ];

  const labItems = [
    { label: "Quick Calibrate", icon: Zap, path: "/practice/calibrate", shortcut: "⌘Q" },
    { label: "Procedures", icon: Target, path: "/practice/procedures", shortcut: "⌘P" },
    { label: "Oversight", icon: TrendingUp, path: "/oversight", shortcut: "⌘O" },
  ];

  const libraryItems = [
    { label: "PEACE Framework", icon: ShieldCheck, path: "/peace-framework" },
    { label: "Knowledge Base", icon: BookOpen, path: "/resources" },
    { label: "Worksheets", icon: FileText, path: "/resources/worksheets", shortcut: "⌘N" },
    { label: "Self Practice", icon: Heart, path: "/practice/self", shortcut: "⌘S" },
  ];

  const businessItems = [
    { label: "Business Hub", icon: Briefcase, path: "/business" },
    { label: "Marketing Engine", icon: Mic, path: "/business/marketing-engine" },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'd': e.preventDefault(); navigate('/'); break;
          case '1': e.preventDefault(); navigate('/clients'); break;
          case '2': e.preventDefault(); navigate('/appointments'); break;
          case 'b': e.preventDefault(); setAppDialogOpen(true); break;
          case 'n': e.preventDefault(); navigate('/resources/worksheets'); break;
          case 'o': e.preventDefault(); navigate('/oversight'); break;
          case 's': e.preventDefault(); navigate('/practice/self'); break;
          case 'p': e.preventDefault(); navigate('/practice/procedures'); break;
          case 'q': e.preventDefault(); navigate('/practice/calibrate'); break;
          case 'h': e.preventDefault(); togglePrivacy(); break;
          case '/': e.preventDefault(); setHelpOpen(true); break;
          case '[': e.preventDefault(); onHide?.(); break;
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate, onHide, togglePrivacy]);

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
    const isActive = !item.isExternal && (location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path)));
    
    const className = cn(
      "flex items-center justify-between gap-2 px-3 py-2 rounded-xl transition-all duration-300 group",
      isActive 
        ? "bg-primary text-white shadow-lg shadow-primary/20" 
        : "text-muted-foreground hover:text-primary hover:bg-secondary/50"
    );

    const content = (
      <>
        <div className="flex items-center gap-3">
          <item.icon size={16} className={cn("transition-all duration-300", isActive ? "text-white" : "text-muted-foreground group-hover:text-primary")} />
          <span className="font-bold text-[10px] uppercase tracking-widest">{item.label}</span>
        </div>
        {item.shortcut && (
          <kbd className={cn(
            "hidden xl:inline-flex h-4 select-none items-center gap-1 rounded border px-1 font-mono text-[8px] font-black opacity-0 group-hover:opacity-100 transition-all duration-300",
            isActive ? "border-primary/40 bg-primary/20 text-primary" : "border-border bg-muted text-muted-foreground"
          )}>
            {item.shortcut}
          </kbd>
        )}
      </>
    );

    const linkContent = item.isExternal ? (
      <a href={item.path} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    ) : (
      <Link to={item.path} className={className}>
        {content}
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
          {item.isExternal && <p className="text-[10px] text-slate-400 mt-1">Opens in new tab</p>}
        </TooltipContent>
      </Tooltip>
    );
  };

  const NavGroup = ({ title, icon: Icon, isOpen, onToggle, items }: any) => (
    <div className="space-y-1">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-secondary/30 transition-all group"
      >
        <div className="flex items-center gap-3">
          <Icon size={16} className="text-muted-foreground group-hover:text-primary" />
          <span className="text-[9px] font-black uppercase tracking-[0.3em]">{title}</span>
        </div>
        {isOpen ? <ChevronUp size={12} className="opacity-50" /> : <ChevronDown size={12} className="opacity-50" />}
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
    <div className="hidden lg:flex w-64 bg-white dark:bg-slate-950 text-foreground min-h-screen p-4 flex-col gap-6 sticky top-0 h-screen overflow-y-auto border-r border-secondary/30 shadow-2xl z-[60]">
      <div className="flex items-center justify-between px-2 py-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center font-black text-xl text-white shadow-2xl shadow-primary/20 transition-transform hover:scale-105">✦</div>
          <div>
            <h1 className="text-lg font-serif font-bold tracking-tight leading-none">Resonance</h1>
            <p className="text-[8px] text-muted-foreground uppercase font-black tracking-[0.2em] mt-1">Kinesiology CRM</p>
          </div>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              onClick={onHide}
              className="text-muted-foreground hover:text-primary hover:bg-secondary rounded-xl h-8 w-8 flex items-center justify-center transition-colors"
            >
              <PanelLeftClose size={18} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="rounded-xl font-bold text-xs">
            <p>Hide Sidebar</p>
            <p className="text-[10px] text-slate-400 mt-1">⌘[</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {isPrivate && (
        <div className="px-1 animate-in slide-in-from-top-2 duration-500">
          <div className="flex items-center gap-2 px-3 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400">
            <Lock size={14} className="shrink-0" />
            <span className="text-[9px] font-black uppercase tracking-widest">Privacy Mode Active</span>
          </div>
        </div>
      )}

      <div className="px-1">
        <SearchBar />
      </div>

      <div className="px-1">
        <Button 
          onClick={() => setAppDialogOpen(true)}
          className="w-full justify-center bg-accent hover:bg-accent/90 text-white rounded-2xl h-12 font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-accent/20 group"
        >
          <PlusCircle size={18} className="mr-3 group-hover:rotate-90 transition-transform duration-500" /> 
          Book Session
          <kbd className="ml-auto pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded border border-white/20 bg-white/10 px-1 font-mono text-[8px] font-black text-white">
            ⌘B
          </kbd>
        </Button>
      </div>
      
      <div className="space-y-4 flex-1">
        <NavGroup title="Operations" icon={LayoutDashboard} isOpen={opsOpen} onToggle={() => setOpsOpen(!opsOpen)} items={opsItems} />
        <NavGroup title="Clinical Lab" icon={Zap} isOpen={labOpen} onToggle={() => setLabOpen(!labOpen)} items={labItems} />
        <NavGroup title="Library" icon={BookOpen} isOpen={libraryOpen} onToggle={() => setLibraryOpen(!libraryOpen)} items={libraryItems} />
        <NavGroup title="Business" icon={Briefcase} isOpen={businessOpen} onToggle={() => setBusinessOpen(!businessOpen)} items={businessItems} />

        {activeSession && (
          <div className="px-1 pt-2">
            <Link 
              to={`/appointments/${activeSession.id}`}
              className="flex items-center gap-3 px-4 py-4 bg-primary rounded-2xl text-white shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all duration-500 group relative overflow-hidden"
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

        <div className="px-4 py-4 bg-secondary/30 rounded-2xl border border-secondary/30 mx-1 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
              <ShieldCheck size={12} className="text-emerald-500" /> Health
            </p>
            <span className="text-[10px] font-black text-emerald-500">{practiceHealth}%</span>
          </div>
          <Progress value={practiceHealth} className="h-1.5 bg-white/50 [&>div]:bg-emerald-500" />
        </div>

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
                      className="flex items-center gap-3 text-xs text-muted-foreground hover:text-primary transition-all duration-300 py-2 px-3 rounded-xl hover:bg-secondary/50 truncate group"
                    >
                      <div className="w-7 h-7 rounded-xl bg-secondary/50 border border-border flex items-center justify-center text-[9px] font-black group-hover:border-primary/40 transition-all">
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
      
      <div className="mt-auto pt-4 border-t border-border space-y-1">
        <div className="flex items-center justify-between px-3 mb-2">
          <ModeToggle />
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={togglePrivacy}
                className={cn(
                  "flex items-center justify-center h-10 w-10 rounded-xl transition-all duration-300 group",
                  isPrivate ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "text-muted-foreground hover:text-primary hover:bg-secondary"
                )}
              >
                {isPrivate ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="rounded-xl font-bold text-xs">
              <p>{isPrivate ? "Disable Privacy Mode" : "Enable Privacy Mode"}</p>
              <p className="text-[10px] text-slate-400 mt-1">⌘H</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={() => setHelpOpen(true)}
                className="flex items-center justify-center h-10 w-10 rounded-xl text-muted-foreground hover:text-primary hover:bg-secondary transition-all duration-300 group"
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
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-secondary transition-all duration-300 cursor-pointer group"
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
        <DialogContent className="sm:max-w-[550px] rounded-[3rem] p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-black tracking-tight">Add New Client</DialogTitle>
          </DialogHeader>
          <ClientForm onSuccess={() => { setClientDialogOpen(false); }} />
        </DialogContent>
      </Dialog>

      <Dialog open={appDialogOpen} onOpenChange={setAppDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[3rem] p-8">
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