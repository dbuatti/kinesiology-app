"use client";

import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
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
  Clock,
  UserPlus,
  CalendarPlus,
  Zap,
  HelpCircle,
  FileText,
  Briefcase,
  CalendarDays,
  Mic,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  Eye,
  EyeOff,
  MessageSquare,
  Sun,
  Compass,
  LayoutGrid,
  Fingerprint
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess } from "@/utils/toast";
import { useRecentClients } from "@/hooks/use-recent-clients";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ClientForm from "./ClientForm";
import AppointmentForm from "./AppointmentForm";
import HelpModal from "./HelpModal";
import { ModeToggle } from "./ModeToggle";
import { ScrollArea } from "@/components/ui/scroll-area";

const MobileNav = () => {
  const [open, setOpen] = useState(false);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [appDialogOpen, setAppDialogOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  
  const [opsOpen, setOpsOpen] = useState(true);
  const [labOpen, setLabOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [businessOpen, setBusinessOpen] = useState(false);
  const [sandboxOpen, setSandboxOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { recentClients } = useRecentClients();
  const { isPrivate, togglePrivacy } = usePrivacyMode();

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

  const NavItem = ({ item, onClick }: { item: any, onClick: () => void }) => {
    const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
    return (
      <Link
        to={item.path}
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all",
          isActive 
            ? "bg-indigo-600 text-white shadow-lg" 
            : "text-slate-400 hover:text-white hover:bg-slate-800"
        )}
      >
        <item.icon size={18} />
        <span className="font-bold text-sm">{item.label}</span>
      </Link>
    );
  };

  const NavGroup = ({ title, icon: Icon, isOpen, onToggle, items }: any) => (
    <div className="space-y-1">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-4 py-2 rounded-xl text-slate-500 hover:text-white transition-all"
      >
        <div className="flex items-center gap-3">
          <Icon size={16} />
          <span className="text-[9px] font-black uppercase tracking-[0.2em]">{title}</span>
        </div>
        {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {isOpen && (
        <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-300">
          {items.map((item: any) => (
            <NavItem key={item.path} item={item} onClick={() => setOpen(false)} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="lg:hidden flex items-center justify-between p-3 bg-white dark:bg-slate-900 border-b dark:border-slate-800 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">A</div>
          <span className="font-black text-slate-900 dark:text-white tracking-tight text-sm">Antigravity</span>
        </div>
        
        <div className="flex items-center gap-1">
          <ModeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9">
                <Menu size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] max-sm bg-slate-950 text-white border-none p-0 flex flex-col">
              <SheetHeader className="p-5 border-b border-slate-900 text-left">
                <SheetTitle className="text-white flex items-center gap-3">
                  <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-lg">A</div>
                  <div>
                    <p className="font-black text-base leading-none">Antigravity</p>
                    <p className="text-[7px] font-black uppercase tracking-0.3em text-slate-500 mt-1">Clinical CRM</p>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                  <div className="space-y-2">
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] px-2">Quick Actions</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        onClick={() => { setClientDialogOpen(true); setOpen(false); }}
                        variant="outline"
                        className="flex-col h-16 bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl gap-1"
                      >
                        <UserPlus size={16} className="text-indigo-400" />
                        <span className="text-[9px] font-black uppercase">New Client</span>
                      </Button>
                      <Button 
                        onClick={() => { setAppDialogOpen(true); setOpen(false); }}
                        className="flex-col h-16 bg-rose-600 hover:bg-rose-700 text-white rounded-xl gap-1 border-none"
                      >
                        <CalendarPlus size={16} />
                        <span className="text-[9px] font-black uppercase">Book Session</span>
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <NavGroup 
                      title="Operations" 
                      icon={LayoutDashboard} 
                      isOpen={opsOpen} 
                      onToggle={() => setOpsOpen(!opsOpen)} 
                      items={[
                        { label: "Dashboard", icon: LayoutDashboard, path: "/" },
                        { label: "Appointments", icon: Calendar, path: "/appointments" },
                        { label: "Clients", icon: Users, path: "/clients" },
                        { label: "Availability", icon: CalendarDays, path: "/availability" },
                      ]} 
                    />

                    <NavGroup 
                      title="Clinical Lab" 
                      icon={Zap} 
                      isOpen={labOpen} 
                      onToggle={() => setLabOpen(!labOpen)} 
                      items={[
                        { label: "Quick Calibrate", icon: Zap, path: "/practice/calibrate" },
                        { label: "Protocols", icon: Target, path: "/practice/procedures" },
                        { label: "Journal", icon: MessageSquare, path: "/practice/journal" },
                        { label: "Oversight", icon: TrendingUp, path: "/oversight" },
                      ]} 
                    />

                    <NavGroup 
                      title="Library" 
                      icon={BookOpen} 
                      isOpen={libraryOpen} 
                      onToggle={() => setLibraryOpen(!libraryOpen)} 
                      items={[
                        { label: "Morning Program", icon: Sun, path: "/morning-program" },
                        { label: "PEACE Framework", icon: ShieldCheck, path: "/peace-framework" },
                        { label: "Knowledge Base", icon: BookOpen, path: "/resources" },
                        { label: "Worksheets", icon: FileText, path: "/resources/worksheets" },
                        { label: "Self Practice", icon: Heart, path: "/practice/self" },
                      ]} 
                    />

                    <NavGroup 
                      title="Business" 
                      icon={Briefcase} 
                      isOpen={businessOpen} 
                      onToggle={() => setBusinessOpen(!businessOpen)} 
                      items={[
                        { label: "Business Hub", icon: Briefcase, path: "/business" },
                        { label: "Marketing Engine", icon: Mic, path: "/business/marketing-engine" },
                      ]} 
                    />

                    <NavGroup 
                      title="Sandbox" 
                      icon={Compass} 
                      isOpen={sandboxOpen} 
                      onToggle={() => setSandboxOpen(!sandboxOpen)} 
                      items={[
                        { label: "Sandbox Hub", icon: LayoutGrid, path: "/sandbox" },
                        { label: "Identity Shifting", icon: Fingerprint, path: "/sandbox/identity-shifting" },
                        { label: "Identity Alignment", icon: Target, path: "/sandbox/identity-alignment" },
                        { label: "Limiting Beliefs", icon: ShieldAlert, path: "/sandbox/limiting-beliefs" },
                      ]} 
                    />
                  </div>

                  {recentClients.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] px-2 flex items-center gap-2">
                        <Clock size={10} /> Recent Clients
                      </p>
                      <div className="space-y-0.5">
                        {recentClients.map(client => (
                          <Link 
                            key={client.id} 
                            to={`/clients/${client.id}`}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 text-sm text-slate-400 hover:text-white transition-all py-2 px-4 rounded-xl hover:bg-slate-900 group"
                          >
                            <div className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-[9px] font-black group-hover:border-indigo-500/40 transition-all">
                              {client.name.charAt(0)}
                            </div>
                            <span className="font-bold text-xs">{client.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-slate-900 bg-slate-950 space-y-1">
                <button 
                  onClick={() => { togglePrivacy(); setOpen(false); }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 transition-all rounded-xl w-full",
                    isPrivate ? "text-rose-400 bg-rose-500/10" : "text-slate-400 hover:text-white hover:bg-slate-900"
                  )}
                >
                  {isPrivate ? <EyeOff size={18} /> : <Eye size={18} />}
                  <span className="font-bold text-xs">{isPrivate ? "Disable Privacy Mode" : "Enable Privacy Mode"}</span>
                </button>
                <button 
                  onClick={() => { setHelpOpen(true); setOpen(false); }}
                  className="flex items-center gap-3 px-4 py-2.5 text-slate-400 hover:text-white hover:bg-slate-900 transition-all rounded-xl w-full"
                >
                  <HelpCircle size={18} />
                  <span className="font-bold text-xs">Help & Shortcuts</span>
                </button>
                <Link 
                  to="/settings"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-slate-400 hover:text-white hover:bg-slate-900 transition-all rounded-xl"
                >
                  <Settings size={18} />
                  <span className="font-bold text-xs">Settings</span>
                </Link>
                <button 
                  onClick={handleSignOut}
                  className="flex items-center gap-3 px-4 py-2.5 text-rose-400 hover:bg-rose-50/10 transition-all rounded-xl w-full"
                >
                  <LogOut size={18} />
                  <span className="font-bold text-xs">Sign Out</span>
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[550px] rounded-2xl p-0 overflow-hidden">
          <div className="p-6 max-h-[90vh] overflow-y-auto">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl font-black">Add New Client</DialogTitle>
            </DialogHeader>
            <ClientForm onSuccess={() => setClientDialogOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={appDialogOpen} onOpenChange={setAppDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[500px] rounded-2xl p-0 overflow-hidden">
          <div className="p-6 max-h-[90vh] overflow-y-auto">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl font-black">Schedule New Session</DialogTitle>
            </DialogHeader>
            <AppointmentForm onSuccess={() => setAppDialogOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>

      <HelpModal open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  );
};

export default MobileNav;