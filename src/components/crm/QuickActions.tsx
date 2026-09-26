
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, UserPlus, Calendar, CalendarPlus, Target, Upload, HelpCircle, Zap, StickyNote, Bolt } from "lucide-react";
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
import { QuickSessionDialog } from "./QuickSessionDialog";
import { useNavigate } from "react-router-dom";
import HelpModal from "./HelpModal";
import { cn } from "@/lib/utils";

const QuickActions = ({ compact = false }: { compact?: boolean }) => {
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [quickSessionOpen, setQuickSessionOpen] = useState(false);
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
        case "S":
          if (isTyping) return;
          e.preventDefault();
          setQuickSessionOpen(true);
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
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            className={cn(
              "h-8 gap-1.5 rounded-lg px-2.5 text-[13px] font-medium shadow-sm print:hidden",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "shadow-[inset_0_1px_0_hsl(0_0%_100%/0.16),0_1px_2px_hsl(var(--shadow-color)/0.2)]",
              compact && "w-8 px-0"
            )}
            aria-label="New…"
          >
            <Plus size={15} strokeWidth={2.25} className={cn("transition-transform duration-300 ease-out-expo", isOpen && "rotate-45")} />
            {!compact && <span>New</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="w-72">
          {[
            { label: "Quick session", hint: "Start now — no booking", icon: Bolt, tone: "text-primary", kbd: "⌘⇧S", run: () => setQuickSessionOpen(true) },
            { label: "Book session", hint: "Schedule an appointment", icon: CalendarPlus, tone: "text-chart-destructive", kbd: "⌘B", run: () => setAppointmentDialogOpen(true) },
            { label: "New client", hint: "Add to the database", icon: UserPlus, tone: "text-chart-primary", kbd: "⌘N", run: () => setClientDialogOpen(true) },
          ].map((a) => (
            <DropdownMenuItem key={a.label} onSelect={a.run} className="gap-3 py-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
                <a.icon size={15} className={a.tone} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium text-foreground">{a.label}</span>
                <span className="block truncate text-xs text-muted-foreground">{a.hint}</span>
              </span>
              <kbd className="kbd hidden md:inline-flex">{a.kbd}</kbd>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator className="my-1" />
          {[
            { label: "Quick calibrate", icon: Zap, kbd: "⌘Q", run: () => navigate("/practice/calibrate") },
            { label: "Procedures", icon: Target, kbd: "⌘P", run: () => navigate("/practice/procedures") },
            { label: "Help & shortcuts", icon: HelpCircle, kbd: "⌘/", run: () => setHelpOpen(true) },
          ].map((a) => (
            <DropdownMenuItem key={a.label} onSelect={a.run} className="gap-3">
              <a.icon size={15} className="ml-2 mr-1 text-muted-foreground" />
              <span className="flex-1 text-[13px]">{a.label}</span>
              <kbd className="kbd hidden md:inline-flex">{a.kbd}</kbd>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[550px] max-h-[90vh] overflow-y-auto rounded-2xl p-0">
          <div className="p-6 sm:p-8">
            <DialogHeader className="mb-6 text-left">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <UserPlus size={19} />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold tracking-tight">Add New Client</DialogTitle>
                  <DialogDescription className="text-sm">Create a new client profile in your clinical database.</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <ClientForm onSuccess={handleClientSuccess} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={appointmentDialogOpen} onOpenChange={(open) => { setAppointmentDialogOpen(open); if (!open) setPrefilledClientId(undefined); }}>
        <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto rounded-2xl p-0">
          <div className="p-6 sm:p-8">
            <DialogHeader className="mb-6 text-left">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 rounded-xl bg-chart-destructive/10 text-chart-destructive flex items-center justify-center">
                  <CalendarPlus size={19} />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold tracking-tight">Schedule Session</DialogTitle>
                  <DialogDescription className="text-sm">Select a client and set the appointment details.</DialogDescription>
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

      <QuickSessionDialog open={quickSessionOpen} onOpenChange={setQuickSessionOpen} />

      <HelpModal open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  );
};

export default QuickActions;
