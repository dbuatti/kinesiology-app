import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, LayoutDashboard, Users, Calendar, Settings, Target, LogOut, BookOpen, Heart, TrendingUp, Compass } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess } from "@/utils/toast";

const MobileNav = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/" },
    { label: "Clients", icon: Users, path: "/clients" },
    { label: "Appointments", icon: Calendar, path: "/appointments" },
    { label: "Self Practice", icon: Heart, path: "/self-practice" },
    { label: "Procedures", icon: Target, path: "/procedures" },
    { label: "Resources", icon: BookOpen, path: "/resources" },
  ];

  const secondaryItems = [
    { label: "North Star", icon: Compass, path: "/north-star" },
    { label: "Clinical Oversight", icon: TrendingUp, path: "/oversight" },
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

  return (
    <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">A</div>
        <span className="font-bold text-slate-900">Antigravity</span>
      </div>
      
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <Menu size={22} />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 bg-slate-900 text-white border-none p-0">
          <SheetHeader className="p-6 border-b border-slate-800 text-left">
            <SheetTitle className="text-white flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold">A</div>
              Antigravity CRM
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 p-4">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all",
                    isActive 
                      ? "bg-indigo-600 text-white" 
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  )}
                >
                  <item.icon size={18} />
                  <span className="font-bold text-xs uppercase tracking-wider">{item.label}</span>
                </Link>
              );
            })}
            
            <div className="mt-4 pt-4 border-t border-slate-800 space-y-1">
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-wider px-4 mb-2">More</p>
              {secondaryItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all",
                      isActive 
                        ? "bg-slate-800 text-white" 
                        : "text-slate-500 hover:text-white hover:bg-slate-800"
                    )}
                  >
                    <item.icon size={16} />
                    <span className="font-bold text-xs uppercase tracking-wider">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-800 space-y-1">
              <Link 
                to="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-all rounded-xl"
              >
                <Settings size={18} />
                <span className="font-bold text-xs uppercase tracking-wider">Settings</span>
              </Link>
              <div 
                onClick={handleSignOut}
                className="flex items-center gap-3 px-4 py-2.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all rounded-xl cursor-pointer"
              >
                <LogOut size={18} />
                <span className="font-bold text-xs uppercase tracking-wider">Sign Out</span>
              </div>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MobileNav;