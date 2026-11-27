import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { QuickSessionDialog } from "@/components/crm/QuickSessionDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useIpadMode } from "@/hooks/use-ipad-mode";
import {
  Activity,
  FileText,
  BookMarked,
  Plus,
  Loader2,
  Zap,
  Clock,
  User,
  Calendar,
  Tablet,
} from "lucide-react";
import { format, isToday, differenceInMinutes } from "date-fns";
import { EmptyState } from "@/components/shared/PageState";
import PageHeader from "@/components/shared/PageHeader";

interface RecentSession {
  id: string;
  date: string;
  client_name: string;
  tag?: string;
}

// PostgREST types an embedded `clients` relation as an array, but a many-to-one
// join returns a single object at runtime — accept either shape.
type AppointmentRow = { id: string; date: string; clients?: { name: string | null } | { name: string | null }[] | null; tag?: string | null };
const toRecentSession = (a: AppointmentRow): RecentSession => {
  const client = Array.isArray(a.clients) ? a.clients[0] : a.clients;
  return {
    id: a.id,
    date: a.date,
    client_name: client?.name || "Unknown",
    tag: a.tag ?? undefined,
  };
};

const ClinicalHubPage = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { enabled: ipadMode, toggle: toggleIpadMode } = useIpadMode();
  const [quickSessionOpen, setQuickSessionOpen] = useState(false);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [upNext, setUpNext] = useState<RecentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<RecentSession | null>(null);

  useEffect(() => {
    if (!session?.user.id) return;
    supabase
      .from("appointments")
      .select("id, date, clients!inner(name), tag")
      .order("date", { ascending: false })
      .limit(10)
      .then(({ data, error }) => {
        if (!error && data) {
          setRecentSessions(data.map(toRecentSession));
        }
        setLoading(false);
      });
  }, [session?.user.id]);

  useEffect(() => {
    if (!session?.user.id) return;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    supabase
      .from("appointments")
      .select("id, date, clients!inner(name), tag")
      .or('is_practitioner.eq.false,is_practitioner.is.null', { foreignTable: "clients" })
      .neq("status", "Cancelled")
      .gte("date", startOfToday.toISOString())
      .order("date", { ascending: true })
      .limit(12)
      .then(({ data, error }) => {
        if (!error && data) {
          setUpNext(data.map(toRecentSession));
        }
      });
  }, [session?.user.id]);

  const nextTimeLabel = (date: string) => {
    const d = new Date(date);
    const diff = differenceInMinutes(d, new Date());
    if (isToday(d)) {
      if (diff <= 0) return "Today · now";
      if (diff < 60) return `Today · in ${diff}m`;
      return `Today · ${format(d, "h:mm a")}`;
    }
    const days = Math.ceil((d.getTime() - Date.now()) / 86400000);
    return days <= 1 ? "Tomorrow · " + format(d, "h:mm a") : format(d, "EEE MMM d · h:mm a");
  };

  if (!session) return <Navigate to="/login" replace />;

  const MODES = [
    {
      id: 'peace',
      label: 'Practise a session',
      description: 'Walk the PEACE wizard — Preliminary → Ease → Align → Correct → Embed — with a practice client',
      icon: Activity,
      color: 'border-l-primary hover:bg-primary/5',
      accent: 'text-primary dark:text-primary',
      iconBg: 'bg-primary/10',
      badge: 'Sandbox',
    },
    {
      id: 'doc',
      label: 'Practise session notes',
      description: 'The printable notes view — findings, corrections, homework — on the practice client',
      icon: FileText,
      color: 'border-l-primary/60 hover:bg-primary/10 dark:hover:bg-primary/15',
      accent: 'text-primary-strong dark:text-primary',
      iconBg: 'bg-primary/10',
      badge: 'Sandbox',
    },
    {
      id: 'manual',
      label: 'Corrections manual',
      description: 'Reference — afferent, efferent, heart wall & limiting beliefs protocols',
      icon: BookMarked,
      color: 'border-l-warning hover:bg-warning/5',
      accent: 'text-warning-strong',
      iconBg: 'bg-warning/10',
      badge: 'Reference',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full px-4 md:px-8 py-6">
        {/* Header */}
        <PageHeader
          className="mb-10"
          icon={Zap}
          title="Sessions"
          subtitle="Start, continue or review client sessions."
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={toggleIpadMode}
                className={cn(
                  "flex h-9 items-center gap-2 rounded-lg px-3 text-[12px] font-medium transition-colors",
                  ipadMode
                    ? "bg-primary/10 text-primary-strong"
                    : "text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground"
                )}
                title={ipadMode ? "Exit iPad Mode — restore the sidebar" : "Enter iPad Mode — no sidebar, straight to the hub"}
                aria-pressed={ipadMode}
              >
                <Tablet size={14} />
                <span className="hidden sm:inline">{ipadMode ? "iPad mode on" : "iPad mode"}</span>
              </button>
              <Button onClick={() => setQuickSessionOpen(true)} className="h-9 gap-1.5 rounded-lg px-3.5 text-[13px] font-medium shadow-sm">
                <Plus size={15} /> New session
              </Button>
            </div>
          }
        />

        {/* Up Next — Today & Upcoming */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-medium text-muted-foreground">
              Up next — today & upcoming
            </h2>
            {upNext.length > 0 && (
              <span className="text-[11px] font-medium text-muted-foreground">
                {upNext.length} scheduled
              </span>
            )}
          </div>
          {upNext.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="Nothing scheduled from today onward"
              hint="When a session or lesson is booked it will appear here, ready to start."
              className="rounded-xl border border-dashed border-border bg-muted/20 py-12"
              action={
                <Button variant="outline" className="h-10 rounded-lg px-4 text-sm font-medium" onClick={() => setQuickSessionOpen(true)}>
                  <Plus size={16} className="mr-1.5" /> Start a session
                </Button>
              }
            />
          ) : (
            <div className="space-y-1">
              {upNext.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSession(s)}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-xl border border-border/60 bg-card hover:bg-muted/50 hover:border-chart-destructive/30 transition-colors text-left group"
                >
                  <div className="w-8 h-8 rounded-full bg-chart-destructive/10 flex items-center justify-center shrink-0">
                    <Calendar size={14} className="text-chart-destructive" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{s.client_name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                      <Clock size={9} />
                      <span>{nextTimeLabel(s.date)}</span>
                      {s.tag && <span className="truncate">· {s.tag}</span>}
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    Open →
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recent Sessions */}
        <div>
          <h2 className="text-xs font-medium text-muted-foreground mb-4">Recent sessions</h2>
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="animate-spin text-muted-foreground" size={16} /></div>
          ) : recentSessions.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-border rounded-xl">
              <p className="text-xs text-muted-foreground font-medium">No sessions yet — start one above.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentSessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSession(s)}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-muted/50 transition-colors text-left group"
                >
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User size={14} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{s.client_name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                      <Calendar size={9} />
                      <span>{format(new Date(s.date), "MMM d, yyyy")}</span>
                      <Clock size={9} />
                      <span>{format(new Date(s.date), "h:mm a")}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    Open →
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Practice & reference — sandbox tools, kept below the real work so
            they're never mistaken for a client's session. */}
        <div className="mt-12">
          <h2 className="text-xs font-medium text-muted-foreground mb-1">Practice & reference</h2>
          <p className="text-[12px] text-muted-foreground/80 mb-4">The sandbox uses a practice client — nothing is saved to anyone's record.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => {
                  if (mode.id === 'manual') {
                    navigate('/library?tab=corrections-manual');
                  } else {
                    navigate(`/practice/trial/${mode.id}`);
                  }
                }}
                className={cn(
                  "spotlight group text-left rounded-xl border border-border bg-card p-5 shadow-xs transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:border-foreground/15 hover:shadow-md"
                )}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", mode.iconBg)}>
                    <Icon size={16} className={mode.accent} />
                  </div>
                  <span className={cn("rounded-full bg-foreground/[0.05] px-2 py-0.5 text-[11px] font-medium", mode.accent)}>
                    {mode.badge}
                  </span>
                </div>
                <h3 className="mb-1 text-[15px] font-semibold tracking-tight">{mode.label}</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{mode.description}</p>
              </button>
            );
          })}
        </div>
        </div>
      </div>

      {/* Session Modal */}
      <Dialog open={!!selectedSession} onOpenChange={(open) => { if (!open) setSelectedSession(null); }}>
        <DialogContent className="sm:max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base">{selectedSession?.client_name}</DialogTitle>
            <DialogDescription className="text-xs">
              {selectedSession && format(new Date(selectedSession.date), "EEEE, MMMM d, yyyy · h:mm a")}
              {selectedSession?.tag && (
                <span className="ml-2 text-muted-foreground">— {selectedSession.tag}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => { setSelectedSession(null); navigate(`/appointments/${selectedSession?.id}`); }}
              className="w-full rounded-xl h-11 gap-2"
            >
              <Activity size={16} /> Run session (PEACE)
            </Button>
            <Button
              variant="outline"
              onClick={() => { setSelectedSession(null); navigate(`/appointments/${selectedSession?.id}?view=doc`); }}
              className="w-full rounded-xl h-11 gap-2"
            >
              <FileText size={16} /> Session notes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <QuickSessionDialog open={quickSessionOpen} onOpenChange={setQuickSessionOpen} />
    </div>
  );
};

export default ClinicalHubPage;
