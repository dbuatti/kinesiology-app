import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Users, 
  Calendar, 
  LayoutDashboard, 
  Settings, 
  Target, 
  Keyboard, 
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
    <div className="hidden lg:flex w-64 bg-slate-950 text-white min-h-screen p-6 flex-col gap-8 sticky top-0 h-screen overflow-y-auto border-r border-slate-900">
      <div className="flex items-center gap-3 px-2">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-500/20">A</div>
        <div>
          <h1 className="text-lg font-black tracking-tight">Antigravity</h1>
          <p className="text-[9px] text-slate-500 uppercase font-black tracking-[0.2em]">Kinesiology CRM</p>
        </div>
      </div>

      <div className="px-2">
        <SearchBar />
      </div>
      
      <div className="space-y-8">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group",
                  isActive 
                    ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20" 
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} className={cn("transition-transform duration-300 group-hover:scale-110", isActive ? "text-white" : "text-slate-500")} />
                  <span className="font-bold text-sm">{item.label}</span>
                </div>
                {item.shortcut && (
                  <kbd className={cn(
                    "hidden xl:inline-flex h-5 select-none items-center gap-1 rounded border px-1.5 font-mono text-[9px] font-black opacity-0 group-hover:opacity-100 transition-opacity duration-300",
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
              className="flex items-center gap-3 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 hover:bg-rose-500/20 transition-all duration-300 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-rose-500/5 animate-pulse" />
              <div className="relative z-10 flex items-center gap-3">
                <div className="relative">
                  <Zap size={18} className="fill-rose-400" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest">Live Session</span>
                  <span className="text-[10px] font-bold opacity-70">Resume now</span>
                </div>
              </div>
            </Link>
          </div>
        )}

        {recentClients.length > 0 && (
          <div className="px-2 space-y-4">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 px-2">
              <Clock size={12} /> Recent Clients
            </p>
            <div className="flex flex-col gap-1">
              {recentClients.map(client => (
                <Link 
                  key={client.id} 
                  to={`/clients/${client.id}`}
                  className="flex items-center gap-3 text-sm text-slate-400 hover:text-indigo-400 transition-all duration-300 py-2 px-3 rounded-xl hover:bg-slate-900 truncate group"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] font-black group-hover:border-indigo-500/50 transition-colors">
                    {client.name.charAt(0)}
                  </div>
                  <span className="truncate font-medium">{client.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-auto pt-6 border-t border-slate-900 space-y-2">
        <button 
          onClick={() => setHelpOpen(true)}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-all duration-300 w-full text-left group"
        >
          <HelpCircle size={18} className="group-hover:scale-110 transition-transform duration-300" />
          <span className="font-bold text-sm">Help & Shortcuts</span>
        </button>

        <Link 
          to="/settings"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-all duration-300 cursor-pointer group"
        >
          <Settings size={18} className="group-hover:scale-110 transition-transform duration-300" />
          <span className="font-bold text-sm">Settings</span>
        </Link>

        <div 
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-900 transition-all duration-300 cursor-pointer group"
        >
          <LogOut size={18} className="group-hover:scale-110 transition-transform duration-300" />
          <span className="font-bold text-sm">Sign Out</span>
        </div>
      </div>

      <HelpModal open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
};

export default Sidebar;