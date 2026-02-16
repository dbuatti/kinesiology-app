import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Users, 
  Calendar, 
  LayoutDashboard, 
  Settings, 
  Target, 
  LogOut, 
  HelpCircle, 
  Clock, 
  Zap, 
  BookOpen, 
  Heart, 
  TrendingUp,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import SearchBar from "./SearchBar";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess } from "@/utils/toast";
import { useEffect, useState, useCallback } from "react";
import HelpModal from "./HelpModal";
import { useRecentClients } from "@/hooks/use-recent-clients";
import { isToday, differenceInMinutes } from "date-fns";

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
  const [activeSession, setActiveSession] = useState<{ id: string, stage: string } | null>(null);
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
      .select('id, date, status')
      .order('date', { ascending: false })
      .limit(10);

    if (data) {
      const active = data.find(app => {
        const appDate = new Date(app.date);
        const diff = differenceInMinutes(new Date(), appDate);
        return isToday(appDate) && 
               diff >= 0 && 
               diff < 90 && 
               app.status !== 'Completed' && 
               app.status !== 'Cancelled' &&
               app.status !== 'No Show' &&
               app.status !== 'AP';
      });

      if (active) {
        const elapsedMinutes = differenceInMinutes(new Date(), new Date(active.date));
        let currentStageName = SESSION_STAGES[0].name;
        let cumulative = 0;
        for (const stage of SESSION_STAGES) {
          cumulative += stage.duration;
          if (elapsedMinutes < cumulative) {
            currentStageName = stage.name;
            break;
          }
        }
        setActiveSession({ id: active.id, stage: currentStageName });
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
    <div className="hidden lg:flex w-72 bg-slate-900 text-white min-h-screen p-8 flex-col gap-10 sticky top-0 h-screen overflow-y-auto border-r border-slate-800 shadow-2xl">
      <div className="flex items-center gap-4 px-2">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-2xl shadow-2xl shadow-indigo-500/20 transition-transform hover:scale-105">A</div>
        <div>
          <h1 className="text-xl font-black tracking-tight">Antigravity</h1>
          <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em]">Kinesiology CRM</p>
        </div>
      </div>

      <div className="px-2">
        <SearchBar />
      </div>
      
      <div className="space-y-10 flex-1">
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center justify-between gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group",
                  isActive 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} className={cn("transition-all duration-300", isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300")} />
                  <span className="font-bold text-xs uppercase tracking-widest">{item.label}</span>
                </div>
                {item.shortcut && (
                  <kbd className={cn(
                    "hidden xl:inline-flex h-5 select-none items-center gap-1 rounded border px-1.5 font-mono text-[9px] font-black opacity-0 group-hover:opacity-100 transition-all duration-300",
                    isActive ? "border-indigo-400 bg-indigo-700 text-indigo-100" : "border-slate-700 bg-slate-800 text-slate-500"
                  )}>
                    {item.shortcut}
                  </kbd>
                )}
              </Link>
            );
          })}
        </nav>

        {activeSession && (
          <div className="px-2">
            <Link 
              to={`/appointments/${activeSession.id}`}
              className="flex items-center gap-4 px-5 py-4 bg-rose-600 rounded-3xl text-white shadow-xl shadow-rose-600/20 hover:bg-rose-700 transition-all duration-300 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/5 animate-pulse" />
              <div className="relative z-10 flex items-center gap-4">
                <div className="relative">
                  <Zap size={20} className="fill-white" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full animate-ping" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80">Live Session</span>
                  <span className="text-xs font-bold">{activeSession.stage}</span>
                </div>
              </div>
              <ArrowRight size={16} className="ml-auto group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}

        {recentClients.length > 0 && (
          <div className="px-2 space-y-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 px-2">
              <Clock size={12} /> Recent Clients
            </p>
            <div className="flex flex-col gap-1">
              {recentClients.map(client => (
                <Link 
                  key={client.id} 
                  to={`/clients/${client.id}`}
                  className="flex items-center gap-3 text-sm text-slate-400 hover:text-indigo-400 transition-all duration-300 py-2 px-4 rounded-xl hover:bg-slate-800/50 truncate group"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-[9px] font-black group-hover:border-indigo-500/30 transition-all">
                    {client.name.charAt(0)}
                  </div>
                  <span className="truncate font-bold text-xs">{client.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-auto pt-8 border-t border-slate-800 space-y-1">
        <button 
          onClick={() => setHelpOpen(true)}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-300 w-full text-left group"
        >
          <HelpCircle size={18} className="text-slate-500 group-hover:text-slate-300" />
          <span className="font-bold text-xs uppercase tracking-widest">Help</span>
        </button>

        <Link 
          to="/settings"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-300 group"
        >
          <Settings size={18} className="text-slate-500 group-hover:text-slate-300" />
          <span className="font-bold text-xs uppercase tracking-widest">Settings</span>
        </Link>

        <div 
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800/50 transition-all duration-300 cursor-pointer group"
        >
          <LogOut size={18} className="text-slate-500 group-hover:text-rose-400" />
          <span className="font-bold text-xs uppercase tracking-widest">Sign Out</span>
        </div>
      </div>

      <HelpModal open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
};

export default Sidebar;