import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { QuickSessionDialog } from "@/components/crm/QuickSessionDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useIpadMode } from "@/hooks/use-ipad-mode";
import {
  Activity, FileText, BookMarked, Plus, Loader2, Zap, Clock, User, Calendar, Tablet
} from "lucide-react";
import { format } from "date-fns";
import FooterLinks from "@/components/crm/FooterLinks";

interface RecentSession {
  id: string;
  date: string;
  client_name: string;
  tag?: string;
}

const ClinicalHubPage = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { enabled: ipadMode, toggle: toggleIpadMode } = useIpadMode();
  const [quickSessionOpen, setQuickSessionOpen] = useState(false);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<RecentSession | null>(null);

  useEffect(() => {
    if (!session) return;
    supabase
      .from("appointments")
      .select("id, date, clients!inner(name), tag")
      .order("date", { ascending: false })
      .limit(10)
      .then(({ data, error }) => {
        if (!error && data) {
          setRecentSessions(data.map((a: { id: string; date: string; clients?: { name: string | null } | null; tag?: string | null }) => ({
            id: a.id,
            date: a.date,
            client_name: a.clients?.name || "Unknown",
            tag: a.tag,
          })));
        }
        setLoading(false);
      });
  }, [session]);

  if (!session) return <Navigate to="/login" replace />;

  const MODES = [
    {
      id: 'peace',
      label: 'PEACE V2',
      description: 'Full session wizard — Preliminary → Ease → Align → Correct → Embed',
      icon: Activity,
      color: 'border-l-primary hover:bg-primary/30 dark:hover:bg-primary/30',
      accent: 'text-primary dark:text-primary',
      iconBg: 'bg-primary/10 dark:bg-primary/50',
      badge: 'Interactive',
    },
    {
      id: 'doc',
      label: 'DOC V2',
      description: 'Printable session notes — findings, corrections, homework summary',
      icon: FileText,
      color: 'border-l-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/30',
      accent: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-100 dark:bg-emerald-950/50',
      badge: 'Print',
    },
    {
      id: 'manual',
      label: 'Corrections Manual',
      description: 'Reference — afferent, efferent, heart wall & limiting beliefs protocols',
      icon: BookMarked,
      color: 'border-l-amber-500 hover:bg-amber-50/30 dark:hover:bg-amber-950/30',
      accent: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-100 dark:bg-amber-950/50',
      badge: 'Reference',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap size={20} className="text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Clinical Hub</h1>
                <p className="text-xs text-muted-foreground font-medium">PEACE V2 · DOC V2 · Corrections Manual</p>
              </div>
            </div>
            <button
              onClick={toggleIpadMode}
              className={cn(
                "flex items-center gap-2 px-3 h-9 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-colors shrink-0",
                ipadMode
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              title={ipadMode ? "Exit iPad Mode — restore the sidebar" : "Enter iPad Mode — no sidebar, straight to the hub"}
            >
              <Tablet size={14} />
              {ipadMode ? "iPad Mode: On" : "iPad Mode"}
            </button>
          </div>
        </div>

        {/* Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => {
                  if (mode.id === 'manual') {
                    navigate('/practice/corrections-manual');
                  } else {
                    navigate(`/practice/trial/${mode.id}`);
                  }
                }}
                className={cn(
                  "text-left border border-border rounded-xl p-5 transition-all border-l-4",
                  mode.color
                )}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", mode.iconBg)}>
                    <Icon size={16} className={mode.accent} />
                  </div>
                  <span className={cn("text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border", mode.accent, "border-current/20 bg-current/5")}>
                    {mode.badge}
                  </span>
                </div>
                <h3 className="text-sm font-bold mb-1">{mode.label}</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{mode.description}</p>
              </button>
            );
          })}
        </div>

        {/* New Session CTA */}
        <div className="mb-10">
          <button
            onClick={() => setQuickSessionOpen(true)}
            className="w-full flex items-center justify-center gap-3 h-16 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary"
          >
            <Plus size={20} />
            <span className="font-bold text-sm uppercase tracking-wider">New Session</span>
          </button>
        </div>

        {/* Recent Sessions */}
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Recent Sessions</h2>
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="animate-spin text-muted-foreground" size={20} /></div>
          ) : recentSessions.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-border rounded-xl">
              <p className="text-xs text-muted-foreground font-medium">No sessions yet — create one above.</p>
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
                  <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-wider">
                    Open →
                  </span>
                </button>
              ))}
            </div>
          )}
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
              onClick={() => { setSelectedSession(null); navigate(`/appointments/${selectedSession?.id}/v2`); }}
              className="w-full rounded-xl h-11 gap-2"
            >
              <Activity size={16} /> Open in PEACE V2
            </Button>
            <Button
              variant="outline"
              onClick={() => { setSelectedSession(null); navigate(`/appointments/${selectedSession?.id}/v2?view=doc`); }}
              className="w-full rounded-xl h-11 gap-2"
            >
              <FileText size={16} /> Open in DOC V2
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <QuickSessionDialog open={quickSessionOpen} onOpenChange={setQuickSessionOpen} v2 />
      <FooterLinks />
    </div>
  );
};

export default ClinicalHubPage;
