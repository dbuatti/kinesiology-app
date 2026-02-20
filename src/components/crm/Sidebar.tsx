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
  FlaskConical,
  Plus,
  UserPlus,
  CalendarPlus,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import SearchBar from "./SearchBar";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess } from "@/utils/toast";
import { useEffect, useState, useCallback } from "react";
import HelpModal from "./HelpModal";
import { useRecentClients } from "@/hooks/use-recent-clients";
import { isToday, differenceInMinutes } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ClientForm from "./ClientForm";
import AppointmentForm from "./AppointmentForm";
import { AppointmentWithClient } from "@/types/crm";

const SESSION_STAGES = [
  { name: "Goal Setting", duration: 22 },
  { name: "Activation", duration: 23 },
  { name: "Correction", duration: 35 },
  { name: "Challenge", duration: 5 },
  { name: "Home Reinforcement", duration: 5 },
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [appDialogOpen, setAppDialogOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<{ id: string, stage: string, clientName: string } | null>(null);
  const { recentClients } = useRecentClients();
  
  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/", shortcut: "⌘D" },
    { label: "Clients", icon: Users, path: "/clients", shortcut: "⌘1" },
    { label: "Appointments", icon: Calendar, path: "/appointments", shortcut: "⌘2" },
    { label: "Clinical Oversight", icon: TrendingUp, path: "/oversight", shortcut: "⌘O" },
    { label: "Self Practice", icon: Heart, path: "/self-practice", shortcut: "⌘S" },
    { label: "Procedures", icon: Target, path: "/procedures", shortcut: "⌘P" },
    { label: "Resources", icon: BookOpen, path: "/resources", shortcut: "⌘R" },
  ];

  const checkActiveSession = useCallback(async () => {
    const { data } = await supabase
      .from('appointments')
      .select('id, date, status, clients(name)')
      .order('date', { ascending: false })
      .limit(10);

    if (data) {
      const active = (data as unknown as AppointmentWithClient[]).find(app => {
        const diff = differenceInMinutes(new Date(), app.date);
        return isToday(app.date) && 
               diff >= 0 && 
               diff < 90 && 
               app.status !== 'Completed' && 
               app.status !== 'Cancelled' &&
               app.status !== 'No Show' &&
               app.status !== 'AP';
      });

      if (active) {
        const elapsedMinutes = differenceInMinutes(new Date(), active.date);
        let currentStageName = SESSION_STAGES[0].name;
        let cumulative = 0;
        for (const stage of SESSION_STAGES) {
          cumulative += stage.duration;
          if (elapsedMinutes < cumulative) {
            currentStageName = stage.name;
            break;
          }
        }
        setActiveSession({ 
          id: active.id, 
          stage: currentStageName,
          clientName: active.clients.name
        });
      } else {
        setActiveSession(null);
      }
    } else {
      setActiveSession(null);
    }
  }, []);

  useEffect(() => {
    checkActiveSession();
    const channel = supabase
      .channel('sidebar-sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        checkActiveSession();
      })
      .subscribe();
    const interval = setInterval(checkActiveSession, 60000);
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [checkActiveSession]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'd': e.preventDefault(); navigate('/'); break;
          case '1': e.preventDefault(); navigate('/clients'); break;
          case '2': e.preventDefault(); navigate('/appointments'); break;
          case 'o': e.preventDefault(); navigate('/oversight'); break;
          case 's': e.preventDefault(); navigate('/self-practice'); break;
          case 'p': e.preventDefault(); navigate('/procedures'); break;
          case 'r': e.preventDefault(); navigate('/resources'); break;
          case '/': e.preventDefault(); setHelpOpen(true); break;
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

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
    <div className="hidden lg:flex w-72 bg-slate-950 text-white min-h-screen p-6 flex-col gap-8 sticky top-0 h-screen overflow-y-auto border-r border-slate-900 shadow-2xl">
      <div className="flex items-center gap-4 px-2 py-4">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-2xl shadow-2xl shadow-indigo-500/40 transition-transform hover:scale-105">A</div>
        <div>
          <h1 className="text-xl font-black tracking-tight">Antigravity</h1>
          <p className="text-[9px] text-slate-500 uppercase font-black tracking-[0.25em]">Kinesiology CRM</p>
        </div>
      </div>

      <div className="px-2">
        <SearchBar />
      </div>
      
      <div className="space-y-8 flex-1">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center justify-between gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group",
                  isActive 
                    ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20" 
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} className={cn("transition-all duration-300", isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300")} />
                  <span className="font-bold text-[11px] uppercase tracking-widest">{item.label}</span>
                </div>
                {item.shortcut && (
                  <kbd className={cn(
                    "hidden xl:inline-flex h-5 select-none items-center gap-1 rounded border px-1.5 font-mono text-[9px] font-black opacity-0 group-hover:opacity-100 transition-all duration-300",
                    isActive ? "border-indigo-400 bg-indigo-700 text-indigo-100" : "border-slate-800 bg-slate-900 text-slate-600"
                  )}>
                    {item.shortcut}
                  </kbd>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-2 grid grid-cols-1 gap-2">
          <Button 
            onClick={() => setAppDialogOpen(true)}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-2xl h-12 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-600/20"
          >
            <CalendarPlus size={18} className="mr-2" />
            Book Session
          </Button>
          <Button 
            variant="outline"
            onClick={() => setClientDialogOpen(true)}
            className="w-full border-slate-800 bg-slate-900/50 hover:bg-slate-900 text-slate-300 hover:text-white rounded-2xl h-12 font-black text-[10px] uppercase tracking-widest"
          >
            <UserPlus size={18} className="mr-2" />
            New Client
          </Button>
        </div>

        {activeSession && (
          <div className="px-2">
            <Link 
              to={`/appointments/${activeSession.id}`}
              className="flex items-center gap-4 px-5 py-4 bg-indigo-600 rounded-[2rem] text-white shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all duration-500 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 animate-pulse" />
              <div className="relative z-10 flex items-center gap-4">
                <div className="relative">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Zap size={20} className="fill-white" />
                  </div>
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80 truncate">{activeSession.clientName}</span>
                  <span className="text-xs font-black">{activeSession.stage}</span>
                </div>
              </div>
              <ArrowRight size={16} className="ml-auto group-hover:translate-x-1 transition-transform shrink-0" />
            </Link>
          </div>
        )}

        <div className="px-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.25em] flex items-center gap-2">
              <Clock size={12} /> Recent Clients
            </p>
          </div>
          {recentClients.length > 0 ? (
            <div className="flex flex-col gap-1">
              {recentClients.map(client => (
                <Link 
                  key={client.id} 
                  to={`/clients/${client.id}`}
                  className="flex items-center gap-3 text-sm text-slate-500 hover:text-indigo-400 transition-all duration-300 py-2.5 px-4 rounded-xl hover:bg-slate-900 truncate group"
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] font-black group-hover:border-indigo-500/40 transition-all">
                    {client.name.charAt(0)}
                  </div>
                  <span className="truncate font-bold text-xs">{client.name}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-slate-700 italic px-4">No recent clients</p>
          )}
        </div>

        <div className="px-2 pt-4">
          <Link 
            to="/demo-session"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 border border-dashed border-slate-800 text-slate-500 hover:text-amber-400 hover:border-amber-400/50 hover:bg-amber-400/5",
              location.pathname === "/demo-session" && "bg-amber-400/10 text-amber-400 border-amber-400/50"
            )}
          >
            <FlaskConical size={18} />
            <span className="font-bold text-[11px] uppercase tracking-widest">Demo Session</span>
          </Link>
        </div>
      </div>
      
      <div className="mt-auto pt-6 border-t border-slate-900 space-y-1">
        <button 
          onClick={() => setHelpOpen(true)}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-white hover:bg-slate-900 transition-all duration-300 w-full text-left group"
        >
          <HelpCircle size={18} className="group-hover:text-amber-400 transition-colors" />
          <span className="font-bold text-[11px] uppercase tracking-widest">Help Center</span>
        </button>

        <Link 
          to="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-white hover:bg-slate-900 transition-all duration-300 group"
        >
          <Settings size={18} className="group-hover:text-indigo-400 transition-colors" />
          <span className="font-bold text-[11px] uppercase tracking-widest">Settings</span>
        </Link>

        <div 
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-all duration-300 cursor-pointer group"
        >
          <LogOut size={18} className="group-hover:text-rose-400 transition-colors" />
          <span className="font-bold text-[11px] uppercase tracking-widest">Sign Out</span>
        </div>
      </div>

      <HelpModal open={helpOpen} onOpenChange={setHelpOpen} />
      
      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-[3.5rem] p-10">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-3xl font-black tracking-tight">Add New Client</DialogTitle>
          </DialogHeader>
          <ClientForm onSuccess={() => { setClientDialogOpen(false); }} />
        </DialogContent>
      </Dialog>

      <Dialog open={appDialogOpen} onOpenChange={setAppDialogOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-[3.5rem] p-10">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-3xl font-black tracking-tight">Schedule New Session</DialogTitle>
          </DialogHeader>
          <AppointmentForm onSuccess={() => { setAppDialogOpen(false); }} />
        </DialogContent>
      </div>
    </div>
  );
};

export default Sidebar;