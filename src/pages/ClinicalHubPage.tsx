import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { QuickSessionDialog } from "@/components/crm/QuickSessionDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Activity, FileText, BookMarked, Plus, Loader2, Zap, Clock, User, Calendar
} from "lucide-react";
import { format } from "date-fns";

interface RecentSession {
  id: string;
  date: string;
  client_name: string;
  tag?: string;
}

const ClinicalHubPage = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [quickSessionOpen, setQuickSessionOpen] = useState(false);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    supabase
      .from("appointments")
      .select("id, date, clients!inner(name), tag")
      .order("date", { ascending: false })
      .limit(10)
      .then(({ data, error }) => {
        if (!error && data) {
          setRecentSessions(data.map((a: any) => ({
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
      color: 'border-l-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-950/30',
      accent: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-950/50',
      badge: 'Interactive',
      path: (sessionId: string) => `/appointments/${sessionId}/v2`,
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
      path: (sessionId: string) => `/appointments/${sessionId}/v2`,
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
      path: () => '/practice/corrections-manual',
    },
  ];

  const handleModeClick = (mode: typeof MODES[number], sessionId?: string) => {
    if (mode.id === 'manual') {
      navigate('/practice/corrections-manual');
      return;
    }
    if (sessionId) {
      navigate(mode.path(sessionId));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Zap size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Clinical Hub</h1>
              <p className="text-xs text-muted-foreground font-medium">PEACE V2 · DOC V2 · Corrections Manual</p>
            </div>
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
                    setQuickSessionOpen(true);
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
                  onClick={() => navigate(`/appointments/${s.id}/v2`)}
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

      <QuickSessionDialog open={quickSessionOpen} onOpenChange={setQuickSessionOpen} v2 />
    </div>
  );
};

export default ClinicalHubPage;
