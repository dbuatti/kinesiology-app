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
  TrendingUp 
} from "lucide-react";
import { cn } from "@/lib/utils";
import SearchBar from "./SearchBar";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess } from "@/utils/toast";
import { useEffect, useState, useCallback } from "react";
import HelpModal from "./HelpModal";
import { useRecentClients } from "@/hooks/use-recent-clients";
import { isToday, differenceInMinutes } from "date-fns";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
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
      .eq('status', 'Scheduled')
      .order('date', { ascending: false });

    if (data) {
      const active = data.find(app => {
        const appDate = new Date(app.date);
        const diff = differenceInMinutes(new Date(), appDate);
        return isToday(appDate) && diff >= 0 && diff < 90;
      });
      setActiveSessionId(active?.id || null);
    } else {
      setActiveSessionId(null);
    }
  }, []);

  useEffect(() => {
    checkActiveSession();
    
    const channel = supabase
      .channel('sidebar-sessions')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'appointments' 
      }, () => {
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
          case 'd':
            e.preventDefault();
            navigate('/');
            break;
          case '1':
            e.preventDefault();
            navigate('/clients');
            break;
          case '2':
            e.preventDefault();
            navigate('/appointments');
            break;
          case 'o':
            e.preventDefault();
            navigate('/oversight');
            break;
          case 's':
            e.preventDefault();
            navigate('/self-practice');
            break;
          case 'p':
            e.preventDefault();
            navigate('/procedures');
            break;
          case 'r':
            e.preventDefault();
            navigate('/resources');
            break;
          case '/':
            e.preventDefault();
            setHelpOpen(true);
            break;
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
    <div className="hidden lg:flex w-72 bg-slate-950 text-white min-h-screen p-8 flex-col gap-10 sticky top-0 h-screen overflow-y-auto border-r border-slate-900 shadow-2xl">
      <div className="flex items-center gap-4 px-2">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-2xl shadow-2xl shadow-indigo-500/40 transition-transform hover:scale-110">A</div>
        <div>
          <h1 className="text-xl font-black tracking-tight">Antigravity</h1>
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.3em]">Kinesiology CRM</p>
        </div>
      </div>

      <div className="px-2">
        <SearchBar />
      </div>
      
      <div className="space-y-10 flex-1">
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center justify-between gap-3 px-4 py-3 rounded-2xl transition-all duration-500 group",
                  isActive 
                    ? "bg-indigo-600 text-white shadow-2xl shadow-indigo-600/40" 
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={20} className={cn("transition-all duration-500 group-hover:scale-110", isActive ? "text-white" : "text-slate-500")} />
                  <span className="font-black text-sm uppercase tracking-widest">{item.label}</span>
                </div>
                {item.shortcut && (
                  <kbd className={cn(
                    "hidden xl:inline-flex h-5 select-none items-center gap-1 rounded border px-1.5 font-mono text-[9px] font-black opacity-0 group-hover:opacity-100 transition-all duration-500",
                    isActive ? "border-indigo-400 bg-indigo-700 text-indigo-100" : "border-slate-700 bg-slate-800 text-slate-400"
                  )}>
                    {item.shortcut}
                  </kbd>
                )}
              </Link>
            );
          })}
        </nav>

        {activeSessionId && (
          <div className="px-2">
            <Link 
              to={`/appointments/${activeSessionId}`}
              className="flex items-center gap-4 px-5 py-4 bg-rose-600 rounded-[1.5rem] text-white shadow-2xl shadow-rose-600/40 hover:bg-rose-700 transition-all duration-500 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 animate-pulse" />
              <div className="relative z-10 flex items-center gap-4">
                <div className="relative">
                  <Zap size={24} className="fill-white" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live Session</span>
                  <span className="text-xs font-bold opacity-90">Resume now</span>
                </div>
              </div>
              <ArrowRight size={18} className="ml-auto group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}

        {recentClients.length > 0 && (
          <div className="px-2 space-y-5">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2 px-2">
              <Clock size={14} /> Recent Clients
            </p>
            <div className="flex flex-col gap-2">
              {recentClients.map(client => (
                <Link 
                  key={client.id} 
                  to={`/clients/${client.id}`}
                  className="flex items-center gap-4 text-sm text-slate-400 hover:text-indigo-400 transition-all duration-500 py-2.5 px-4 rounded-2xl hover:bg-slate-900 truncate group"
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] font-black group-hover:border-indigo-500/50 transition-all group-hover:scale-110">
                    {client.name.charAt(0)}
                  </div>
                  <span className="truncate font-bold">{client.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-auto pt-8 border-t border-slate-900 space-y-3">
        <button 
          onClick={() => setHelpOpen(true)}
          className="flex items-center gap-4 px-4 py-3 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-900 transition-all duration-500 w-full text-left group"
        >
          <HelpCircle size={20} className="group-hover:scale-110 transition-transform duration-500" />
          <span className="font-black text-xs uppercase tracking-widest">Help & Shortcuts</span>
        </button>

        <Link 
          to="/settings"
          className="flex items-center gap-4 px-4 py-3 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-900 transition-all duration-500 cursor-pointer group"
        >
          <Settings size={20} className="group-hover:scale-110 transition-transform duration-500" />
          <span className="font-black text-xs uppercase tracking-widest">Settings</span>
        </Link>

        <div 
          onClick={handleSignOut}
          className="flex items-center gap-4 px-4 py-3 rounded-2xl text-slate-400 hover:text-red-400 hover:bg-slate-900 transition-all duration-500 cursor-pointer group"
        >
          <LogOut size={20} className="group-hover:scale-110 transition-transform duration-500" />
          <span className="font-black text-xs uppercase tracking-widest">Sign Out</span>
        </div>
      </div>

      <HelpModal open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
};

import { ArrowRight } from "lucide-react";
export default Sidebar;