import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAppointment } from "@/hooks/useAppointment";
import { useSessionDocumentState } from "@/hooks/useSessionDocumentState";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Printer, FileText, Activity, Zap, GitBranch,
  Target, ClipboardCheck, CheckCircle2, ChevronRight, ChevronLeft,
  Maximize2, Minimize2, Calendar, Clock, User
} from "lucide-react";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import PeaceWizard from "@/components/crm/v2/PeaceWizard";
import AppointmentV2DocView from "@/components/crm/v2/AppointmentV2DocView";

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

  const [isDocView, setIsDocView] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(() => localStorage.getItem('rk_v2_fullscreen') === 'true');

  useEffect(() => {
    const handler = () => setIsFullScreen(localStorage.getItem('rk_v2_fullscreen') === 'true');
    window.addEventListener('antigravity_fullscreen_change', handler);
    return () => window.removeEventListener('antigravity_fullscreen_change', handler);
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
          <Link to="/schedule?view=list"><ArrowLeft size={16} className="mr-2" /> Back to Schedule</Link>
        </Button>
      </div>
    );
  }

  if (!session) {
    navigate("/login");
    return null;
  }

  if (isDocView) {
    return (
      <AppointmentV2DocView
        appointment={appointment}
        history={history}
        onBack={() => setIsDocView(false)}
        saveField={saveField}
        updatePriorityPattern={updatePriorityPattern}
      />
    );
  }

  return (
    <div className={cn("min-h-screen bg-background", isFullScreen && "fixed inset-0 z-50 overflow-y-auto")}>
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="px-4 md:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/schedule?view=list')}
              className="rounded-xl text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={16} className="mr-1.5" /> Back
            </Button>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <User size={18} className="text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{appointment.clients?.name || "Unknown"}</p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                  <Calendar size={10} />
                  <span>{format(new Date(appointment.date), "EEE, MMM d")}</span>
                  <Clock size={10} className="ml-1" />
                  <span>{format(new Date(appointment.date), "h:mm a")}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDocView(true)}
              className="rounded-xl text-muted-foreground hover:text-foreground"
            >
              <FileText size={16} className="mr-1.5" /> Doc View
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullScreen}
              className="rounded-xl text-muted-foreground hover:text-foreground"
            >
              {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </Button>
          </div>
        </div>
      </header>

      {/* Wizard */}
      <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
        <ErrorBoundary>
          <PeaceWizard
            appointment={appointment}
            history={history}
            onUpdate={refresh}
            saveField={saveField}
            updatePriorityPattern={updatePriorityPattern}
            onFinalise={async () => {
              await supabase
                .from('appointments')
                .update({ status: 'Completed' })
                .eq('id', id);
              navigate(`/appointments/${id}`);
            }}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default AppointmentV2Page;