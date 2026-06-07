import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mic, Users, Calendar, Mail, Phone, ExternalLink, Plus,
  Loader2, ArrowUpRight, Music, Clock, AlertCircle, MessageCircle,
  CreditCard, BarChart3, BookOpen
} from "lucide-react";
import AppLayout from "@/components/crm/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface VoiceStudent {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  tags: string[];
  latestDate: string | null;
  lastCommunication: string | null;
  notionUrl: string | null;
}

interface VoiceLesson {
  id: string;
  name: string | null;
  date: string | null;
  time: string | null;
  studentIds: string[];
  paymentStatus: string | null;
  studentName: string | null;
  studentEmail: string | null;
  notionUrl: string | null;
}

const now = new Date();
const threeMonthsAgo = new Date();
threeMonthsAgo.setDate(now.getDate() - 90);
const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

const VoiceDashboardPage = () => {
  const navigate = useNavigate();

  const { data: students = [], isLoading: studentsLoading } = useQuery<VoiceStudent[]>({
    queryKey: ["voice-students"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("voice-clients");
      if (error) throw error;
      return data?.students || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: lessons = [], isLoading: lessonsLoading } = useQuery<VoiceLesson[]>({
    queryKey: ["voice-lessons"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("voice-lessons");
      if (error) throw error;
      return data?.lessons || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  const isLoading = studentsLoading || lessonsLoading;

  const stats = useMemo(() => {
    const thisMonthLessons = lessons.filter(
      (l) => l.date && new Date(l.date) >= monthStart && new Date(l.date) <= now
    );
    const unpaid = lessons.filter((l) => l.paymentStatus === "Unpaid");
    const futureLessons = lessons
      .filter((l) => l.date && new Date(l.date) > now)
      .sort((a, b) => (a.date || "").localeCompare(b.date || ""))
      .slice(0, 5);
    const pastDue = students.filter(
      (s) => s.latestDate && new Date(s.latestDate) < threeMonthsAgo
    );
    return { thisMonthLessons, unpaid, futureLessons, pastDue };
  }, [lessons, students]);

  const quickActions = [
    { label: "Add Student", icon: Plus, path: "/voice/clients", color: "bg-rose-500", onClick: () => navigate("/voice/clients") },
    { label: "Book Lesson", icon: Calendar, path: "/voice/book", color: "bg-violet-500", onClick: () => navigate("/voice/book") },
    { label: "View Calendar", icon: BarChart3, path: "/voice/calendar", color: "bg-emerald-500", onClick: () => navigate("/voice/calendar") },
    { label: "Clients", icon: Users, path: "/voice/clients", color: "bg-amber-500", onClick: () => navigate("/voice/clients") },
  ];

  if (isLoading) {
    return (
      <AppLayout variant="workspace">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
          <Loader2 className="animate-spin text-rose-500" size={48} />
          <p className="text-muted-foreground font-black text-xs uppercase tracking-widest">Loading voice studio...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout variant="workspace">
      <div className="space-y-8 pb-32">
        <PageHeader
          title="Voice Studio"
          subtitle="Your studio at a glance — students, lessons, and actions."
          icon={Mic}
          iconClassName="bg-rose-500 text-white dark:bg-rose-500 dark:text-white"
          breadcrumbs={[{ label: "Voice Studio" }, { label: "Dashboard" }]}
          badge="Voice Studio"
        />

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Students", value: students.length, icon: Users, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-950/30" },
            { label: "Lessons This Month", value: stats.thisMonthLessons.length, icon: Music, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/30" },
            { label: "Unpaid", value: stats.unpaid.length, icon: CreditCard, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
            { label: "Past Due (3+ mo)", value: stats.pastDue.length, icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-950/30" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", stat.bg)}>
                <stat.icon size={22} className={stat.color} />
              </div>
              <div>
                <div className={cn("text-3xl font-black", stat.color)}>{stat.value}</div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4 hover:border-rose-200 dark:hover:border-rose-800 transition-all text-left group"
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", action.color.replace("bg-", "bg-").replace("500", "100 dark:bg-rose-950/30"))}>
                  <action.icon size={18} className={action.color.replace("bg-", "text-")} />
                </div>
                <span className="font-bold text-sm text-foreground flex-1">{action.label}</span>
                <ArrowUpRight size={14} className="text-muted-foreground group-hover:text-rose-500 transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Two columns: Upcoming + Attention */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Upcoming Lessons */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-rose-500" />
                <h3 className="font-black text-sm">Upcoming Lessons</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/voice/calendar")} className="text-[10px] font-black uppercase tracking-widest text-rose-500 h-8">
                View All
              </Button>
            </div>
            <div className="p-4 space-y-2">
              {stats.futureLessons.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No upcoming lessons.</p>
              ) : (
                stats.futureLessons.map((lesson) => (
                  <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center shrink-0">
                      <Music size={14} className="text-rose-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs truncate">{lesson.studentName || lesson.name || "Voice Lesson"}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {lesson.date && format(new Date(lesson.date), "EEE, MMM d")}
                        {lesson.time && ` · ${lesson.time}`}
                      </p>
                    </div>
                    {lesson.paymentStatus && (
                      <Badge className={cn(
                        "text-[9px] font-black border-none shrink-0",
                        lesson.paymentStatus === "Paid (Stripe)" ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700" :
                        lesson.paymentStatus === "Paid on Day" ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700" :
                        "bg-amber-100 dark:bg-amber-900/40 text-amber-700"
                      )}>
                        {lesson.paymentStatus}
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Attention Needed */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-amber-500" />
                <h3 className="font-black text-sm">Needs Attention</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/voice/clients")} className="text-[10px] font-black uppercase tracking-widest text-rose-500 h-8">
                View All
              </Button>
            </div>
            <div className="p-4 space-y-2">
              {stats.pastDue.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">All students contacted recently.</p>
              ) : (
                stats.pastDue.slice(0, 8).map((student) => (
                  <div key={student.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center shrink-0">
                      <Users size={14} className="text-rose-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs truncate">{student.name || "Unnamed"}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {student.latestDate
                          ? `Last seen ${format(new Date(student.latestDate), "MMM d, yyyy")}`
                          : "No lessons yet"}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {student.email && (
                        <a href={`mailto:${student.email}`} className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all" title="Email">
                          <Mail size={13} />
                        </a>
                      )}
                      {student.notionUrl && (
                        <a href={student.notionUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all" title="Notion">
                          <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
              {stats.pastDue.length > 8 && (
                <p className="text-[10px] font-bold text-muted-foreground text-center pt-1">
                  + {stats.pastDue.length - 8} more
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Lessons */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-violet-500" />
              <h3 className="font-black text-sm">Recent Lessons</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/voice/calendar")} className="text-[10px] font-black uppercase tracking-widest text-rose-500 h-8">
              View Calendar
            </Button>
          </div>
          <div className="p-4">
            {lessons.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No lessons yet.</p>
            ) : (
              <div className="space-y-1">
                {[...lessons]
                  .filter((l) => l.date && new Date(l.date) <= now)
                  .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
                  .slice(0, 10)
                  .map((lesson) => (
                    <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center shrink-0">
                        <BookOpen size={14} className="text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-xs truncate">{lesson.studentName || lesson.name || "Voice Lesson"}</p>
                          {lesson.paymentStatus && (
                            <Badge className={cn(
                              "text-[9px] font-black border-none shrink-0",
                              lesson.paymentStatus === "Paid (Stripe)" ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700" :
                              lesson.paymentStatus === "Paid on Day" ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700" :
                              "bg-amber-100 dark:bg-amber-900/40 text-amber-700"
                            )}>
                              {lesson.paymentStatus}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {lesson.date && format(new Date(lesson.date), "MMM d, yyyy")}
                          {lesson.time && ` · ${lesson.time}`}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default VoiceDashboardPage;
