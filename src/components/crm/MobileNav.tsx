import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Menu, 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Settings, 
  Target, 
  LogOut, 
  BookOpen, 
  Heart,
  TrendingUp,
  Compass,
  Clock,
  UserPlus,
  CalendarPlus,
  Zap,
  HelpCircle
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess } from "@/utils/toast";
import { useRecentClients } from "@/hooks/use-recent-clients";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ClientForm from "./ClientForm";
import AppointmentForm from "./AppointmentForm";
import HelpModal from "./HelpModal";

const MobileNav = () => {
  const [open, setOpen] = useState(false);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [appDialogOpen, setAppDialogOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { recentClients } = useRecentClients();

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/" },
    { label: "Clients", icon: Users, path: "/clients" },
    { label: "Appointments", icon: Calendar, path: "/appointments" },
    { label: "Oversight", icon: TrendingUp, path: "/oversight" },
    { label: "Quick Calibrate", icon: Zap, path: "/quick-calibrate" },
    { label: "Self Practice", icon: Heart, path: "/self-practice" },
    { label: "Procedures", icon: Target, path: "/procedures" },
    { label: "North Star", icon: Compass, path: "/north-star" },
    { label: "Resources", icon: BookOpen, path: "/resources" },
  ];

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      showSuccess("Signed out successfully");
      navigate('/login');
      setOpen(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <>
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">A</div>
          <span className="font-bold text-slate-900">Antigravity</span>
        </div>
        
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-xl">
              <Menu size={24} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 bg-slate-900 text-white border-none p-0">
            <SheetHeader className="p-6 border-b border-slate-800 text-left">
              <SheetTitle className="text-white flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold">A</div>
                Antigravity CRM
              </SheetTitle>
            </SheetHeader>

            {/* Quick Actions */}
            <div className="p-4 space-y-2 border-b border-slate-800">
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] px-2 mb-2">Quick Actions</p>
              <Button 
                onClick={() => { setClientDialogOpen(true); setOpen(false); }}
                variant="outline"
                className="w-full justify-start bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl h-11 font-bold text-xs"
              >
                <UserPlus size={18} className="mr-3" /> Add New Client
              </Button>
              <Button 
                onClick={() => { setAppDialogOpen(true); setOpen(false); }}
                className="w-full justify-start bg-rose-600 hover:bg-rose-700 rounded-xl h-11 font-bold text-xs"
              >
                <CalendarPlus size={18} className="mr-3" /> Book Session
              </Button>
            </div>

            {/* Main Navigation */}
            <nav className="flex flex-col gap-2 p-4">
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] px-2 mb-2">Navigation</p>
              {navItems.map((item) => {
                const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                      isActive 
                        ? "bg-indigo-600 text-white" 
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    )}
                  >
                    <item.icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Recent Clients */}
            {recentClients.length > 0 && (
              <>
                <Separator className="bg-slate-800" />
                <div className="p-4 space-y-2">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] px-2 mb-2 flex items-center gap-2">
                    <Clock size={12} /> Recent Clients
                  </p>
                  {recentClients.map(client => (
                    <Link 
                      key={client.id} 
                      to={`/clients/${client.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 text-sm text-slate-400 hover:text-white transition-all py-2.5 px-4 rounded-xl hover:bg-slate-800 group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-black group-hover:border-indigo-500/40 transition-all">
                        {client.name.charAt(0)}
                      </div>
                      <span className="font-bold text-xs">{client.name}</span>
                    </Link>
                  ))}
                </div>
              </>
            )}

            {/* Footer */}
            <div className="mt-auto p-4 border-t border-slate-800 space-y-2">
              <button 
                onClick={() => { setHelpOpen(true); setOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 transition-all rounded-xl w-full"
              >
                <HelpCircle size={20} />
                <span className="font-medium">Help & Shortcuts</span>
              </button>
              <Link 
                to="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 transition-all rounded-xl"
              >
                <Settings size={20} />
                <span className="font-medium">Settings</span>
              </Link>
              <div 
                onClick={handleSignOut}
                className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all rounded-xl cursor-pointer"
              >
                <LogOut size={20} />
                <span className="font-medium">Sign Out</span>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Add New Client</DialogTitle>
          </DialogHeader>
          <ClientForm onSuccess={() => setClientDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={appDialogOpen} onOpenChange={setAppDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Schedule New Session</DialogTitle>
          </DialogHeader>
          <AppointmentForm onSuccess={() => setAppDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <HelpModal open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  );
};

export default MobileNav;