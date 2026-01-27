import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, LayoutDashboard, Users, Calendar, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";

const MobileNav = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/" },
    { label: "Clients", icon: Users, path: "/clients" },
    { label: "Appointments", icon: Calendar, path: "/appointments" },
  ];

  return (
    <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">A</div>
        <span className="font-bold text-slate-900">Antigravity</span>
      </div>
      
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu size={24} />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 bg-slate-900 text-white border-none p-0">
          <SheetHeader className="p-6 border-b border-slate-800 text-left">
            <SheetTitle className="text-white flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold">A</div>
                Antigravity CRM
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-2 p-4 mt-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                  location.pathname === item.path 
                    ? "bg-indigo-600 text-white" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                )}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
            <div className="mt-8 pt-6 border-t border-slate-800">
               <div className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white transition-all cursor-pointer">
                  <Settings size={20} />
                  <span className="font-medium">Settings</span>
               </div>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MobileNav;