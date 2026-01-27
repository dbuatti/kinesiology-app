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
    <div className="w-64 bg-slate-900 text-white min-h-screen p-6 flex flex-col gap-8">
      <div className="flex items-center gap-3 px-2">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold">A</div>
        <h1 className="text-xl font-bold tracking-tight">Antigravity</h1>
      </div>
      
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md transition-all",
              location.pathname === item.path 
                ? "bg-indigo-600 text-white" 
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
      
      <div className="mt-auto pt-6 border-t border-slate-800">
         <div className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white transition-all cursor-pointer">
            <Settings size={20} />
            <span className="font-medium">Settings</span>
         </div>
      </div>
    </div>
  );
};

export default Sidebar;