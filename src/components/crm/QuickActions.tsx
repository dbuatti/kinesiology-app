
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, UserPlus, Calendar, CalendarPlus, Target, Upload, HelpCircle, Zap, StickyNote } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ClientForm from "./ClientForm";
import AppointmentForm from "./AppointmentForm";
import { useNavigate } from "react-router-dom";
import HelpModal from "./HelpModal";
import { cn } from "@/lib/utils";

const QuickActions = () => {
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [prefilledClientId, setPrefilledClientId] = useState<string | undefined>();
  const [helpOpen, setHelpOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleClientSuccess = (newClientId?: string) => {
    setClientDialogOpen(false);
    if (newClientId) {
      setPrefilledClientId(newClientId);
      setAppointmentDialogOpen(true);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-50 print:hidden flex items-center gap-3 md:gap-5">
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 md:gap-4 group cursor-pointer">
                  <span className={cn(
                    "hidden md:inline-block bg-slate-900 text-white px-4 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] shadow-3xl transition-all duration-700",
                    isOpen ? "opacity-0 translate-x-6" : "opacity-100 translate-x-0"
                  )}>
                    Quick Actions
                  </span>
                  <Button
                    size="lg"
                    className={cn(
                      "h-12 w-12 md:h-16 md:w-16 rounded-2xl md:rounded-[2rem] shadow-3xl bg-indigo-600 hover:bg-indigo-700 transition-all duration-700",
                      isOpen ? "rotate-45 scale-110" : "hover:scale-110 hover:rotate-90"
                    )}
                  >
                    <Plus size={24} className="md:w-8 md:h-8" strokeWidth={3} />
                  </Button>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 md:w-80 p-3 md:p-4 rounded-[2rem] shadow-3xl border-none mb-4 md:mb-8 animate-in slide-in-from-bottom-4 duration-500 bg-white dark:bg-slate-900">
                <div className="px-3 py-1.5 md:py-2 mb-2 md:mb-4">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Clinical Command</p>
                </div>
                
                <DropdownMenuItem 
                  onClick={() => { navigate("/practice/calibrate"); setIsOpen(false); }} 
                  className="rounded-2xl py-4 px-5 md:py-5 md:px-6 cursor-pointer group transition-all hover:bg-amber-50"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-amber-50 flex items-center justify-center mr-4 md:mr-5 group-hover:bg-amber-100 transition-colors shadow-inner">
                    <Zap size={20} className="text-amber-600 md:w-6 md:h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-black text-sm md:text-base block text-slate-900 truncate">Quick Calibrate</span>
                    <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate block">Instant Pathway Logic</span>
                  </div>
                  <kbd className="hidden md:inline-flex ml-auto pointer-events-none h-5 select-none items-center gap-1 rounded border bg-slate-100 px-1.5 font-mono text-[10px] font-black text-slate-600">
                    ⌘Q
                  </kbd>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-2 md:my-3 bg-slate-100" />

                <DropdownMenuItem 
                  onClick={() => { setClientDialogOpen(true); setIsOpen(false); }} 
                  className="rounded-2xl py-4 px-5 md:py-5 md:px-6 cursor-pointer group transition-all hover:bg-indigo-50"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-indigo-50 flex items-center justify-center mr-4 md:mr-5 group-hover:bg-indigo-100 transition-colors shadow-inner">
                    <UserPlus size={20} className="text-indigo-600 md:w-6 md:h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-black text-sm md:text-base block text-slate-900 truncate">New Client</span>
                    <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate block">Add to database</span>
                  </div>
                  <kbd className="hidden md:inline-flex ml-auto pointer-events-none h-5 select-none items-center gap-1 rounded border bg-slate-100 px-1.5 font-mono text-[10px] font-black text-slate-600">
                    ⌘N
                  </kbd>
                </DropdownMenuItem>

                <DropdownMenuItem 
                  onClick={() => { setAppointmentDialogOpen(true); setIsOpen(false); }} 
                  className="rounded-2xl py-4 px-5 md:py-5 md:px-6 cursor-pointer group transition-all hover:bg-rose-50"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-rose-50 flex items-center justify-center mr-4 md:mr-5 group-hover:bg-rose-100 transition-colors shadow-inner">
                    <CalendarPlus size={20} className="text-rose-600 md:w-6 md:h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-black text-sm md:text-base block text-slate-900 truncate">Book Session</span>
                    <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate block">Schedule appointment</span>
                  </div>
                  <kbd className="hidden md:inline-flex ml-auto pointer-events-none h-5 select-none items-center gap-1 rounded border bg-slate-100 px-1.5 font-mono text-[10px] font-black text-slate-600">
                    ⌘B
                  </kbd>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-2 md:my-3 bg-slate-100" />

                <DropdownMenuItem 
                  onClick={() => { navigate("/practice/procedures"); setIsOpen(false); }} 
                  className="rounded-2xl py-4 px-5 md:py-5 md:px-6 cursor-pointer group transition-all hover:bg-emerald-50"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-emerald-50 flex items-center justify-center mr-4 md:mr-5 group-hover:bg-emerald-100 transition-colors shadow-inner">
                    <Target size={20} className="text-emerald-600 md:w-6 md:h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-black text-sm md:text-base block text-slate-900 truncate">Procedures</span>
                    <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate block">Track progress</span>
                  </div>
                  <kbd className="hidden md:inline-flex ml-auto pointer-events-none h-5 select-none items-center gap-1 rounded border bg-slate-100 px-1.5 font-mono text-[10px] font-black text-slate-600">
                    ⌘P
                  </kbd>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-2 md:my-3 bg-slate-100" />

                <DropdownMenuItem 
                  onClick={() => { setHelpOpen(true); setIsOpen(false); }} 
                  className="rounded-2xl py-4 px-5 md:py-5 md:px-6 cursor-pointer group transition-all hover:bg-slate-50"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-50 flex items-center justify-center mr-4 md:mr-5 group-hover:bg-slate-100 transition-colors shadow-inner">
                    <HelpCircle size={20} className="text-slate-400 md:w-6 md:h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-black text-sm md:text-base block text-slate-900 truncate">Help & Shortcuts</span>
                    <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate block">View all commands</span>
                  </div>
                  <kbd className="hidden md:inline-flex ml-auto pointer-events-none h-5 select-none items-center gap-1 rounded border bg-slate-100 px-1.5 font-mono text-[10px] font-black text-slate-600">
                    ⌘/
                  </kbd>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipTrigger>
          <TooltipContent side="left" className="rounded-xl font-bold text-xs p-3 shadow-2xl border-none bg-slate-900 text-white">
            <p>Quick Actions Menu</p>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Click to open</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[550px] max-h-[90vh] overflow-y-auto rounded-[3rem] p-0 border-none shadow-3xl">
          <div className="p-10">
            <DialogHeader className="mb-8">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl">
                  <UserPlus size={28} />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-serif font-bold tracking-tight">Add New Client</DialogTitle>
                  <DialogDescription className="text-base font-medium">Create a new client profile in your clinical database.</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <ClientForm onSuccess={handleClientSuccess} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={appointmentDialogOpen} onOpenChange={(open) => { setAppointmentDialogOpen(open); if (!open) setPrefilledClientId(undefined); }}>
        <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto rounded-[3rem] p-0 border-none shadow-3xl">
          <div className="p-10">
            <DialogHeader className="mb-8">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-14 h-14 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-xl">
                  <CalendarPlus size={28} />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-serif font-bold tracking-tight">Schedule Session</DialogTitle>
                  <DialogDescription className="text-base font-medium">Select a client and set the appointment details.</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <AppointmentForm
              initialClientId={prefilledClientId}
              onSuccess={() => {
                setAppointmentDialogOpen(false);
                setPrefilledClientId(undefined);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      <HelpModal open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  );
};

export default QuickActions;