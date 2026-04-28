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
  ShieldAlert,
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
  Mic,
  ExternalLink,
  GraduationCap,
  Fingerprint,
  LayoutGrid,
  MessageSquare,
  Brain,
  Sun,
  Trophy,
  Layers
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
  TooltipProvider,
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
  
  // New Consolidated Pillar Logic
  const isClinicalPath = (path: string) => path === "/" || path.startsWith("/appointments") || path.startsWith("/clients") || path === "/availability" || path === "/oversight";
  const isLabPath = (path: string) => path.startsWith("/sandbox") || path.startsWith("/resources/worksheets") || path.startsWith("/practice/journal") || path === "/morning-program" || path === "/practice/self";
  const isLibraryPath = (path: string) => path.startsWith("/resources") && !path.includes("worksheets") || path === "/peace-framework" || path === "/practice/procedures" || path === "/practice/quiz";
  const isGrowthPath = (path: string) => path.startsWith("/business");

  const [clinicalOpen, setClinicalOpen] = useState(true);
  const [labOpen, setLabOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [growthOpen, setGrowthOpen] = useState(false);

  const activeSession = useActiveSession();
  const { practiceHealth } = usePracticeStats();
  const { recentClients } = useRecentClients();
  
  useEffect(() => {
    const path = location.pathname;
    if (isClinicalPath(path)) setClinicalOpen(true);
    if (isLabPath(path)) setLabOpen(true);
    if (isLibraryPath(path)) setLibraryOpen(true);
    if (isGrowthPath(path)) setGrowthOpen(true);
  }, [location.pathname]);

  const clinicalItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/", shortcut: "⌘D" },
    { label: "Schedule", icon: Calendar, path: "/appointments", shortcut: "⌘2" },
    { label: "Clients", icon: Users, path: "/clients", shortcut: "⌘1" },
    { label: "Availability", icon: CalendarDays, path: "/availability" },
    { label: "Oversight", icon: TrendingUp, path: "/oversight", shortcut: "⌘O" },
  ];

  const labItems = [
    { label: "Morning Program", icon: Sun, path: "/morning-program" },
    { label: "Journal", icon: MessageSquare, path: "/practice/journal", shortcut: "⌘R" },
    { label: "Identity Map", icon: Compass, path: "/sandbox", shortcut: "⌘S" },
    { label: "Worksheets", icon: FileText, path: "/resources/worksheets" },
    { label: "Self Practice", icon: Heart, path: "/practice/self" },
  ];

  const libraryItems = [
    { label: "Clinical Bible", icon: BookOpen, path: "/resources" },
    { label: "PEACE Framework", icon: ShieldCheck, path: "/peace-framework" },
    { label: "Mastery Tracker", icon: Trophy, path: "/practice/procedures", shortcut: "⌘P" },
    { label: "Knowledge Quiz", icon: GraduationCap, path: "/practice/quiz", shortcut: "⌘K" },
    { label: "Quick Calibrate", icon: Zap, path: "/practice/calibrate", shortcut: "⌘Q" },
  ];

  const growthItems = [
    { label: "Business Hub", icon: Briefcase, path: "/business" },
    { label: "Marketing Engine", icon: Mic, path: "/business/marketing-engine" },
  ];

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
        ? "bg-primary/5 text-primary"
        : "text-muted-foreground hover:text-primary hover:bg-secondary/50"
    );

    const content = (
      <>
        <div className="flex items-center gap-3">
          <item.icon size={16} className={cn("transition-all duration-300", isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
          <span className={cn("font-bold text-[10px] uppercase tracking-widest", isActive ? "text-primary" : "")}>{item.label}</span>
        </div>
        {item.shortcut && (
          <kbd className={cn(
            "hidden xl:inline-flex h-4 select-none items-center gap-1 rounded border px-1 font-mono text-[8px] font-black opacity-0 group-hover:opacity-100 transition-all duration-300",
            isActive ? "border-primary/20 bg-primary/5 text-primary" : "border-border bg-muted text-muted-foreground"
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
        </TooltipContent>
      </Tooltip>
    );
  };

  const NavGroup = ({ title, icon: Icon, isOpen, onToggle, items }: any) => (
    <div className="space-y-0.5">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-secondary/30 transition-all group"
      >
        <div className="flex items-center gap-3">
          <Icon size={16} className="text-muted-foreground group-hover:text-primary" />
          <span className={cn("text-[9px] font-black uppercase tracking-[0.2em]", isOpen ? "text-primary" : "")}>{title}</span>
        </div>
        {isOpen ? <ChevronUp size={12} className="opacity-50" /> : <ChevronDown size={12} className="opacity-50" />}
      </button>
      {isOpen && (
        <div className="space-y-0.5 pl-1 animate-in fade-in slide-in-from-top-1 duration-300">
          {items.map((item: any) => (
            <NavItem key={item.path} item={item} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="hidden lg:flex w-64 bg-white dark:bg-slate-950 text-foreground min-h-screen p-4 flex-col gap-6 sticky top-0 h-screen overflow-y-auto border-r border-secondary/30 shadow-sm z-[60]">
      <div className="flex items-center justify-between px-2 py-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center font-black text-lg text-white shadow-lg shadow-primary/10 transition-transform hover:scale-105">✦</div>
          <div>
            <h1 className="text-base font-serif font-bold tracking-tight leading-none">Resonance</h1>
            <p className="text-[7px] text-muted-foreground uppercase font-black tracking-[0.2em] mt-1">Clinical CRM</p>
          </div>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              onClick={onHide}
              className="text-muted-foreground hover:text-primary hover:bg-secondary rounded-xl h-8 w-8 flex items-center justify-center transition-colors"
            >
              <PanelLeftClose size={16} />
            </button>
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

      <div className="px-1">
        <Button 
          onClick={() => setAppDialogOpen(true)}
          className="w-full justify-center bg-accent hover:bg-accent/90 text-white rounded-xl h-11 font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-accent/10 group"
        >
          <PlusCircle size={16} className="mr-2 group-hover:rotate-90 transition-transform duration-500" /> 
          Book Session
        </Button>
      </div>
      
      <div className="space-y-4 flex-1">
        <NavGroup title="Clinical" icon={LayoutDashboard} isOpen={clinicalOpen} onToggle={() => setClinicalOpen(!clinicalOpen)} items={clinicalItems} />
        <NavGroup title="Practice Lab" icon={Zap} isOpen={labOpen} onToggle={() => setLabOpen(!labOpen)} items={labItems} />
        <NavGroup title="Library" icon={BookOpen} isOpen={libraryOpen} onToggle={() => setLibraryOpen(!libraryOpen)} items={libraryItems} />
        <NavGroup title="Growth" icon={Briefcase} isOpen={growthOpen} onToggle={() => setGrowthOpen(!growthOpen)} items={growthItems} />

        {activeSession && (
          <div className="px-1 pt-2">
            <Link 
              to={`/appointments/${activeSession.id}`}
              className="flex items-center gap-3 px-4 py-3 bg-primary rounded-2xl text-white shadow-lg shadow-primary/10 hover:bg-primary/90 transition-all duration-500 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/5 animate-pulse" />
              <div className="relative z-10 flex items-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                    <Zap size={16} className="fill-white" />
                  </div>
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-white rounded-full animate-ping" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[8px] font-black uppercase tracking-0.2em opacity-80 truncate">{activeSession.clientName}</span>
                  <span className="text-[10px] font-black">{activeSession.stage}</span>
                </div>
              </div>
              <ArrowRight size={14} className="ml-auto group-hover:translate-x-1 transition-transform shrink-0" />
            </Link>
          </div>
        )}

        <div className="px-4 py-3 bg-secondary/30 rounded-2xl border border-secondary/30 mx-1 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
              <ShieldCheck size={10} className="text-emerald-500" /> Health
            </p>
            <span className="text-[9px] font-black text-emerald-500">{practiceHealth}%</span>
          </div>
          <Progress value={practiceHealth} className="h-1 bg-white/50 [&>div]:bg-emerald-500" />
        </div>

        {recentClients.length > 0 && (
          <div className="px-1 space-y-1">
            <div className="px-3">
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2">
                <Clock size={10} /> Recent
              </p>
            </div>
            <div className="flex flex-col gap-0.5">
              {recentClients.map(client => (
                <Link 
                  key={client.id} 
                  to={`/clients/${client.id}`}
                  className="flex items-center gap-3 text-xs text-muted-foreground hover:text-primary transition-all duration-300 py-1.5 px-3 rounded-xl hover:bg-secondary/50 truncate group"
                >
                  <div className="w-6 h-6 rounded-lg bg-secondary/50 border border-border flex items-center justify-center text-[8px] font-black group-hover:border-primary/40 transition-all">
                    {client.name.charAt(0)}
                  </div>
                  <span className="truncate font-bold text-[10px]">{client.name}</span>
                </Link>
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
                  "flex items-center justify-center h-9 w-9 rounded-xl transition-all duration-300 group",
                  isPrivate ? "bg-rose-50 text-white shadow-lg shadow-rose-500/10" : "text-muted-foreground hover:text-primary hover:bg-secondary"
                )}
              >
                {isPrivate ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="rounded-xl font-bold text-xs">
              <p>{isPrivate ? "Disable Privacy Mode" : "Enable Privacy Mode"}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={() => setHelpOpen(true)}
                className="flex items-center justify-center h-9 w-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-secondary transition-all duration-300 group"
              >
                <HelpCircle size={18} className="group-hover:text-amber-400 transition-colors" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="rounded-xl font-bold text-xs">
              <p>Help & Shortcuts</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div 
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-secondary transition-all duration-300 cursor-pointer group"
        >
          <LogOut size={16} className="group-hover:text-rose-500 transition-colors" />
          <span className="font-bold text-[9px] uppercase tracking-widest">Sign Out</span>
        </div>
      </div>

      <HelpModal open={helpOpen} onOpenChange={setHelpOpen} />
      
      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-[2rem] p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-black tracking-tight">Add New Client</DialogTitle>
          </DialogHeader>
          <ClientForm onSuccess={() => { setClientDialogOpen(false); }} />
        </DialogContent>
      </Dialog>

      <Dialog open={appDialogOpen} onOpenChange={setAppDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2rem] p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-black tracking-tight">Schedule New Session</DialogTitle>
          </DialogHeader>
          <AppointmentForm onSuccess={() => { setAppDialogOpen(false); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sidebar;