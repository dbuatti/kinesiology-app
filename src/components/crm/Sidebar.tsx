import { Link, useLocation, useNavigate } from "react-router-dom";
import { Users, Calendar, LayoutDashboard, Settings, Target, Keyboard, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import SearchBar from "./SearchBar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess } from "@/utils/toast";
import { useEffect } from "react";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/", shortcut: "⌘D" },
    { label: "Clients", icon: Users, path: "/clients", shortcut: "⌘1" },
    { label: "Appointments", icon: Calendar, path: "/appointments", shortcut: "⌘2" },
    { label: "Procedures", icon: Target, path: "/procedures", shortcut: "⌘P" },
  ];

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
      
      <div className="mt-auto pt-6 border-t border-slate-900 space-y-3">
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-all cursor-pointer group">
          <Settings size={20} className="group-hover:rotate-45 transition-transform" />
          <span className="font-medium">Settings</span>
        </div>

        <div 
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-900 transition-all cursor-pointer group"
        >
          <LogOut size={20} />
          <span className="font-medium">Sign Out</span>
        </div>
        
        <div className="px-4 py-3 bg-slate-900 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Keyboard size={14} className="text-slate-500" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Shortcuts</p>
          </div>
          <div className="space-y-1 text-xs text-slate-500">
            <div className="flex justify-between">
              <span>Search</span>
              <kbd className="font-mono">⌘K</kbd>
            </div>
            <div className="flex justify-between">
              <span>New Client</span>
              <kbd className="font-mono">⌘N</kbd>
            </div>
            <div className="flex justify-between">
              <span>Book Session</span>
              <kbd className="font-mono">⌘B</kbd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;