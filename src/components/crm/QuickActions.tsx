
import React, { useState, useEffect } from "react";
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

  // Global keyboard shortcuts (advertised in HelpModal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      // Don't hijack typing inside inputs except for safe combos
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      switch (e.key) {
        case "n":
          if (isTyping) return;
          e.preventDefault();
          setClientDialogOpen(true);
          break;
        case "b":
          if (isTyping) return;
          e.preventDefault();
          setAppointmentDialogOpen(true);
          break;
        case "d":
          if (isTyping) return;
          e.preventDefault();
          navigate("/");
          break;
        case "1":
          if (isTyping) return;
          e.preventDefault();
          navigate("/clients");
          break;
        case "2":
          if (isTyping) return;
          e.preventDefault();
          navigate("/schedule");
          break;
        case "p":
          if (isTyping) return;
          e.preventDefault();
          navigate("/practice/procedures");
          break;
        case "q":
          if (isTyping) return;
          e.preventDefault();
          navigate("/practice/calibrate");
          break;
        case "/":
          e.preventDefault();
          setHelpOpen(true);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  return (
    <>
      <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-50 print:hidden flex items-center gap-3 md:gap-5">
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 md:gap-4 group cursor-pointer">
                  <span className={cn(
                    "hidden md:inline-block bg-card border border-border text-foreground px-4 py-2 md:px-6 md:py-3 rounded-xl text-[10px] font-semibold uppercase tracking-[0.3em] shadow-3xl transition-all duration-700",
                    isOpen ? "opacity-0 translate-x-6" : "opacity-100 translate-x-0"
                  )}>
                    Quick Actions
                  </span>
                  <Button
                    size="lg"
                    className={cn(
                      "h-10 w-10 md:h-12 md:w-12 rounded-xl shadow-3xl bg-primary hover:bg-primary/90 transition-all duration-700",
                      isOpen ? "rotate-45 scale-110" : "hover:scale-110 hover:rotate-90"
                    )}
                  >
                    <Plus size={20} className="md:w-6 md:h-6" strokeWidth={3} />
                  </Button>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 md:w-80 p-3 md:p-4 rounded-xl shadow-3xl border mb-4 md:mb-8 animate-in slide-in-from-bottom-4 duration-500 bg-background dark:bg-card">
                <div className="px-3 py-1.5 md:py-2 mb-2 md:mb-4">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.4em]">Clinical Command</p>
                </div>
                
                <DropdownMenuItem 
                  onClick={() => { navigate("/practice/calibrate"); setIsOpen(false); }} 
                  className="rounded-xl py-4 px-5 md:py-5 md:px-6 cursor-pointer group transition-all hover:bg-muted"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-muted flex items-center justify-center mr-4 md:mr-5 group-hover:bg-muted/80 transition-colors shadow-inner">
                    <Zap size={20} className="text-muted-foreground md:w-6 md:h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-sm md:text-base block text-foreground truncate">Quick Calibrate</span>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate block">Instant Pathway Logic</span>
                  </div>
                  <kbd className="hidden md:inline-flex ml-auto pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-semibold text-muted-foreground">
                    ⌘Q
                  </kbd>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-2 md:my-3 bg-muted" />

                <DropdownMenuItem 
                  onClick={() => { setClientDialogOpen(true); setIsOpen(false); }} 
                  className="rounded-xl py-4 px-5 md:py-5 md:px-6 cursor-pointer group transition-all hover:bg-muted"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-muted flex items-center justify-center mr-4 md:mr-5 group-hover:bg-muted/80 transition-colors shadow-inner">
                    <UserPlus size={20} className="text-chart-primary md:w-6 md:h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-sm md:text-base block text-foreground truncate">New Client</span>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate block">Add to database</span>
                  </div>
                  <kbd className="hidden md:inline-flex ml-auto pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-semibold text-muted-foreground">
                    ⌘N
                  </kbd>
                </DropdownMenuItem>

                <DropdownMenuItem 
                  onClick={() => { setAppointmentDialogOpen(true); setIsOpen(false); }} 
                  className="rounded-xl py-4 px-5 md:py-5 md:px-6 cursor-pointer group transition-all hover:bg-muted"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-muted flex items-center justify-center mr-4 md:mr-5 group-hover:bg-muted/80 transition-colors shadow-inner">
                    <CalendarPlus size={20} className="text-chart-destructive md:w-6 md:h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-sm md:text-base block text-foreground truncate">Book Session</span>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate block">Schedule appointment</span>
                  </div>
                  <kbd className="hidden md:inline-flex ml-auto pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-semibold text-muted-foreground">
                    ⌘B
                  </kbd>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-2 md:my-3 bg-muted" />

                <DropdownMenuItem 
                  onClick={() => { navigate("/practice/procedures"); setIsOpen(false); }} 
                  className="rounded-xl py-4 px-5 md:py-5 md:px-6 cursor-pointer group transition-all hover:bg-muted"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-muted flex items-center justify-center mr-4 md:mr-5 group-hover:bg-muted/80 transition-colors shadow-inner">
                    <Target size={20} className="text-chart-emerald md:w-6 md:h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-sm md:text-base block text-foreground truncate">Procedures</span>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate block">Track progress</span>
                  </div>
                  <kbd className="hidden md:inline-flex ml-auto pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-semibold text-muted-foreground">
                    ⌘P
                  </kbd>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-2 md:my-3 bg-muted" />

                <DropdownMenuItem 
                  onClick={() => { setHelpOpen(true); setIsOpen(false); }} 
                  className="rounded-xl py-4 px-5 md:py-5 md:px-6 cursor-pointer group transition-all hover:bg-muted"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-muted flex items-center justify-center mr-4 md:mr-5 group-hover:bg-muted/80 transition-colors shadow-inner">
                    <HelpCircle size={20} className="text-muted-foreground md:w-6 md:h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-sm md:text-base block text-foreground truncate">Help & Shortcuts</span>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate block">View all commands</span>
                  </div>
                  <kbd className="hidden md:inline-flex ml-auto pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-semibold text-muted-foreground">
                    ⌘/
                  </kbd>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipTrigger>
          <TooltipContent side="left" className="rounded-xl font-medium text-xs p-3 shadow-sm border bg-card text-foreground">
            <p>Quick Actions Menu</p>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">Click to open</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[550px] max-h-[90vh] overflow-y-auto rounded-xl p-0 border-none shadow-3xl">
          <div className="p-10">
            <DialogHeader className="mb-8">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                  <UserPlus size={28} />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-serif font-medium tracking-tight">Add New Client</DialogTitle>
                  <DialogDescription className="text-base font-medium">Create a new client profile in your clinical database.</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <ClientForm onSuccess={handleClientSuccess} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={appointmentDialogOpen} onOpenChange={(open) => { setAppointmentDialogOpen(open); if (!open) setPrefilledClientId(undefined); }}>
        <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto rounded-xl p-0 border-none shadow-3xl">
          <div className="p-10">
            <DialogHeader className="mb-8">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-14 h-14 rounded-2xl bg-destructive text-destructive-foreground flex items-center justify-center shadow-sm">
                  <CalendarPlus size={28} />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-serif font-medium tracking-tight">Schedule Session</DialogTitle>
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
