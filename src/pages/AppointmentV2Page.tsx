import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAppointment } from "@/hooks/useAppointment";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { showError } from "@/utils/toast";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Loader2, Activity, FileText,
  Maximize2, Minimize2, Calendar, Clock, User, BookOpen,
  Plus, BookMarked, LayoutGrid, Archive, StickyNote
} from "lucide-react";
import {
  HoverCard, HoverCardContent, HoverCardTrigger,
} from "@/components/ui/hover-card";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import PeaceWizard from "@/components/crm/v2/PeaceWizard";
import AppointmentV2DocView from "@/components/crm/v2/AppointmentV2DocView";
import CorrectionsManualContent from "@/components/crm/CorrectionsManualContent";
import { QuickSessionDialog } from "@/components/crm/QuickSessionDialog";
import PathwayReflexStimGrid from "@/components/crm/PathwayReflexStimGrid";
import QuickNotesDialog from "@/components/crm/QuickNotesDialog";
import { parseClientJournal } from "@/utils/journal-helper";


const AppointmentV2Page = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();

  const {
    appointment,
    history,
    loading,
    saveField,
    updatePriorityPattern,
    refresh
  } = useAppointment(id);

  const [viewMode, setViewMode] = useState<'peace' | 'grid' | 'doc' | 'manual'>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') === 'doc' ? 'doc' : 'peace';
  });
  const [isFullScreen, setIsFullScreen] = useState(() => localStorage.getItem('rk_v2_fullscreen') === 'true');
  const [quickSessionOpen, setQuickSessionOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  useEffect(() => {
    const handler = () => setIsFullScreen(localStorage.getItem('rk_v2_fullscreen') === 'true');
    window.addEventListener('antigravity_fullscreen_change', handler);
    return () => window.removeEventListener('antigravity_fullscreen_change', handler);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setNotesOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const toggleFullScreen = () => {
    const next = !isFullScreen;
    localStorage.setItem('rk_v2_fullscreen', String(next));
    setIsFullScreen(next);
    window.dispatchEvent(new Event('antigravity_fullscreen_change'));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background space-y-4">
        <p className="text-muted-foreground font-medium">Session not found.</p>
        <Button asChild variant="outline" className="rounded-xl">
          <Link to="/practice/clinical-hub"><ArrowLeft size={16} className="mr-2" /> Back to Hub</Link>
        </Button>
      </div>
    );
  }

  if (!session) {
    navigate("/login");
    return null;
  }

  const MODE_TABS = [
    { id: 'peace' as const, label: 'PEACE', icon: Activity },
    { id: 'grid' as const, label: 'GRID', icon: LayoutGrid },
    { id: 'doc' as const, label: 'DOC', icon: FileText },
    { id: 'manual' as const, label: 'MANUAL', icon: BookMarked },
  ];

  return (
    <div className={cn("min-h-screen bg-background", isFullScreen && "fixed inset-0 z-50 overflow-y-auto")}>
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="px-4 md:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/practice/clinical-hub')}
              className="rounded-xl text-muted-foreground shrink-0"
            >
              <ArrowLeft size={16} className="mr-1.5" /> Back
            </Button>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <User size={18} className="text-primary" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Link
                    to={`/clients/${appointment.clients?.id}`}
                    className="text-sm font-semibold text-foreground truncate hover:text-chart-primary hover:underline underline-offset-2 transition-colors"
                    title="Open client page"
                  >
                    {appointment.clients?.name || "Unknown"}
                  </Link>
                  {(() => {
                    const notes = appointment.clients?.journal ? parseClientJournal(appointment.clients.journal).notes : null;
                    if (!notes) return null;
                    return (
                      <HoverCard openDelay={200} closeDelay={100}>
                        <HoverCardTrigger asChild>
                          <button className="shrink-0 text-amber-500 hover:text-amber-600 transition-colors" title="View practitioner notes">
                            <BookOpen size={14} />
                          </button>
                        </HoverCardTrigger>
                        <HoverCardContent side="bottom" align="start" className="w-80 rounded-xl p-4 border-border">
                          <p className="text-xs text-muted-foreground whitespace-pre-wrap italic leading-relaxed">
                            "{notes}"
                          </p>
                        </HoverCardContent>
                      </HoverCard>
                    );
                  })()}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium hidden min-[520px]:flex">
                  <Calendar size={10} />
                  <span>{format(new Date(appointment.date), "EEE, MMM d")}</span>
                  <Clock size={10} className="ml-1" />
                  <span>{format(new Date(appointment.date), "h:mm a")}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 min-w-0">
            <div className="flex items-center gap-0.5 mr-2 md:mr-3 border-r border-border pr-2 md:pr-3 overflow-x-auto whitespace-nowrap min-w-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {MODE_TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = viewMode === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setViewMode(tab.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 md:px-3 h-8 text-[10px] font-bold uppercase tracking-wider transition-colors rounded-lg shrink-0 whitespace-nowrap",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Icon size={13} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setQuickSessionOpen(true)}
              className="flex items-center gap-1.5 px-2 md:px-3 h-8 text-[10px] font-bold uppercase tracking-wider border border-foreground/20 hover:bg-foreground hover:text-background transition-colors rounded-lg shrink-0 whitespace-nowrap"
              title="FILE > NEW — Create a new session"
            >
              <Plus size={13} /> <span className="hidden md:inline">New</span>
            </button>
            <button
              onClick={() => setNotesOpen(true)}
              className="flex items-center gap-1.5 px-2 md:px-3 h-8 text-[10px] font-bold uppercase tracking-wider border border-foreground/20 hover:bg-foreground hover:text-background transition-colors rounded-lg shrink-0 whitespace-nowrap"
              title="Quick notes — open a notes box from anywhere (N)"
            >
              <StickyNote size={13} /> <span className="hidden md:inline">Notes</span>
            </button>
            <div className="w-px h-6 bg-border mx-0.5 shrink-0" />
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="rounded-xl text-muted-foreground shrink-0"
              title="Open the archived (legacy) session page"
            >
              <Link to={`/appointments/${id}/archive`}>
                <Archive size={16} />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullScreen}
              className="rounded-xl text-muted-foreground shrink-0"
            >
              {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      {viewMode === 'peace' && (
        <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
          <ErrorBoundary>
            <PeaceWizard
              appointment={appointment}
              history={history}
              onUpdate={refresh}
              saveField={saveField}
              updatePriorityPattern={updatePriorityPattern}
              onFinalise={async () => {
                try {
                  const { error } = await supabase
                    .from('appointments')
                    .update({ status: 'Completed' })
                    .eq('id', id);
                  if (error) throw error;
                  navigate(`/appointments/${id}`);
                } catch (err) {
                  console.error("Failed to finalise session:", err);
                  showError("Failed to complete session. Please try again.");
                }
              }}
            />
          </ErrorBoundary>
        </div>
      )}

      {viewMode === 'grid' && (
        <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
          <ErrorBoundary>
            <PathwayReflexStimGrid
              appointmentId={appointment.id}
              priorityPattern={appointment.priority_pattern}
              updatePriorityPattern={updatePriorityPattern}
              isFullScreen={isFullScreen}
              onToggleFullScreen={toggleFullScreen}
            />
          </ErrorBoundary>
        </div>
      )}

      {viewMode === 'doc' && (
        <AppointmentV2DocView
          appointment={appointment}
          history={history}
          onBack={() => setViewMode('peace')}
          saveField={saveField}
          updatePriorityPattern={updatePriorityPattern}
        />
      )}

      {viewMode === 'manual' && (
        <div className="h-[calc(100vh-3.5rem)]">
          <CorrectionsManualContent />
        </div>
      )}

      <QuickSessionDialog open={quickSessionOpen} onOpenChange={setQuickSessionOpen} />
      <QuickNotesDialog
        open={notesOpen}
        onOpenChange={setNotesOpen}
        initialValue={appointment.notes}
        onSave={saveField}
        title={`Quick Notes — ${appointment.clients?.name || "Session"}`}
        subtitle={format(new Date(appointment.date), "EEE, MMM d · h:mm a")}
      />
    </div>
  );
};

export default AppointmentV2Page;
