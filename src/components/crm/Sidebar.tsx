import { Link, useLocation } from "react-router-dom";
import { Users, Calendar, LayoutDashboard, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const Sidebar = () => {
  const location = useLocation();
  
  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/" },
    { label: "Clients", icon: Users, path: "/clients" },
    { label: "Appointments", icon: Calendar, path: "/appointments" },
  ];

  return (
    <div className="hidden lg:flex w-64 bg-slate-950 text-white min-h-screen p-6 flex-col gap-8 sticky top-0 h-screen overflow-y-auto">
      <div className="flex items-center gap-3 px-2">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/20">A</div>
        <div>
            <h1 className="text-lg font-bold tracking-tight">Antigravity</h1>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Kinesiology CRM</p>
        </div>
      </div>
      
      <nav className="flex flex-col gap-1.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" 
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              )}
            >
              <item.icon size={20} className={cn("transition-transform group-hover:scale-110", isActive ? "text-white" : "text-slate-500")} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="mt-auto pt-6 border-t border-slate-900">
         <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-all cursor-pointer group">
            <Settings size={20} className="group-hover:rotate-45 transition-transform" />
            <span className="font-medium">Settings</span>
         </div>
      </div>
    </div>
  );
};

export default Sidebar;