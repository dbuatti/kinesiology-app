import { Link, useLocation, useNavigate } from "react-router-dom";
import { Users, Calendar, LayoutDashboard, Settings, Target, Keyboard, LogOut, HelpCircle, Clock, Zap, PlusCircle, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import SearchBar from "./SearchBar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess } from "@/utils/toast";
import { useEffect, useState } from "react";
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
    { label: "Procedures", icon: Target, path: "/procedures", shortcut: "⌘P" },
    { label: "Resources", icon: BookOpen, path: "/resources", shortcut: "⌘R" },
  ];

  useEffect(() => {
    const checkActiveSession = async () => {
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
      }
    };

    checkActiveSession();
    const interval = setInterval(checkActiveSession, 60000);
    return () => clearInterval(interval);
  }, []);

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
    <div className="hidden lg:flex w-64 bg-slate-950 text-white min-h-screen p-6 flex-col gap-8 sticky top-0 h-screen overflow-y-auto">
      <div className="flex items-center gap-3 px-2">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/20">A</div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Antigravity</h1>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Kinesiology CRM</p>
        </div>
      </div>

      <div className="px-2">
        <SearchBar />
      </div>
      
      <div className="space-y-6">
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group",
                  isActive 
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" 
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={20} className={cn("transition-transform group-hover:scale-110", isActive ? "text-white" : "text-slate-500")} />
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.shortcut && (
                  <kbd className={cn(
                    "hidden xl:inline-flex h-5 select-none items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity",
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
              className="flex items-center gap-3 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 hover:bg-rose-500/20 transition-all group"
            >
              <div className="relative">
                <Zap size={18} className="fill-rose-400" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black uppercase tracking-wider">Live Session</span>
                <span className="text-[10px] opacity-70">Resume now</span>
              </div>
            </Link>
          </div>
        )}

        {recentClients.length > 0 && (
          <div className="px-2 space-y-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Clock size={12} /> Recent Clients
            </p>
            <div className="flex flex-col gap-1">
              {recentClients.map(client => (
                <Link 
                  key={client.id} 
                  to={`/clients/${client.id}`}
                  className="text-sm text-slate-400 hover:text-indigo-400 transition-colors py-1 px-2 rounded-lg hover:bg-slate-900 truncate"
                >
                  {client.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-auto pt-6 border-t border-slate-900 space-y-3">
        <button 
          onClick={() => setHelpOpen(true)}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-all w-full text-left group"
        >
          <HelpCircle size={20} className="group-hover:scale-110 transition-transform" />
          <span className="font-medium">Help & Shortcuts</span>
        </button>

        <Link 
          to="/settings"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-all cursor-pointer group"
        >
          <Settings size={20} className="group-hover:rotate-45 transition-transform" />
          <span className="font-medium">Settings</span>
        </Link>

        <div 
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-900 transition-all cursor-pointer group"
        >
          <LogOut size={20} />
          <span className="font-medium">Sign Out</span>
        </div>
      </div>

      <HelpModal open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
};

export default Sidebar;