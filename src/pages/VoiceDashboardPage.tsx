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
import { formatVoiceTime } from "@/utils/availability";

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
  discipline?: string | null;
}

const now = new Date();
const threeMonthsAgo = new Date();
threeMonthsAgo.setDate(now.getDate() - 90);
const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

type DisciplineFilter = "all" | "voice" | "piano";

const VoiceDashboardPage = () => {
  const navigate = useNavigate();
  const [disciplineFilter, setDisciplineFilter] = useState<DisciplineFilter>("all");

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

  const filteredLessons = useMemo(() => {
    if (disciplineFilter === "all") return lessons;
    return lessons.filter((l) => (l.discipline || "voice") === disciplineFilter);
  }, [lessons, disciplineFilter]);

  const stats = useMemo(() => {
    const thisMonthLessons = filteredLessons.filter(
      (l) => l.date && new Date(l.date) >= monthStart && new Date(l.date) <= now
    );
    const unpaid = filteredLessons.filter((l) => l.paymentStatus === "Unpaid");
    const futureLessons = filteredLessons
    .filter((l) => l.date && new Date(l.date) > now)
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""))
    .slice(0, 5);
    const pastDue = students.filter(
      (s) => s.latestDate && new Date(s.latestDate) < threeMonthsAgo
    );
    return { thisMonthLessons, unpaid, futureLessons, pastDue };
  }, [filteredLessons, students]);

 const quickActions = [
 { label: "Add Student", icon: Plus, path: "/voice/clients", color: "bg-destructive", onClick: () => navigate("/voice/clients") },
 { label: "Book Lesson", icon: Calendar, path: "/voice/book", color: "bg-primary", onClick: () => navigate("/voice/book") },
 { label: "View Calendar", icon: BarChart3, path: "/voice/calendar", color: "bg-chart-emerald", onClick: () => navigate("/voice/calendar") },
 { label: "Clients", icon: Users, path: "/voice/clients", color: "bg-muted", onClick: () => navigate("/voice/clients") },
 ];

 if (isLoading) {
 return (
 <AppLayout>
 <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
 <Loader2 className="animate-spin text-destructive" size={48} />
 <p className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Loading voice studio...</p>
 </div>
 </AppLayout>
 );
 }

  const DISCIPLINE_FILTERS: { key: DisciplineFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "voice", label: "Voice" },
    { key: "piano", label: "Piano" },
  ];

  return (
    <AppLayout>
      <div className="space-y-8 pb-32">
        <PageHeader
          title="Voice Studio"
          subtitle="Your studio at a glance — students, lessons, and actions."
          icon={Mic}
          iconClassName="bg-destructive text-white "
        />

      {/* Discipline filter */}
      <div className="flex bg-muted rounded-xl p-0.5 border border-border w-fit">
        {DISCIPLINE_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setDisciplineFilter(f.key)}
            className={cn(
              "px-4 py-2 rounded-[10px] text-xs font-semibold transition-all",
              disciplineFilter === f.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
 {[
 { label: "Students", value: students.length, icon: Users, color: "text-chart-destructive", bg: "bg-chart-destructive/10 " },
 { label: "Lessons This Month", value: stats.thisMonthLessons.length, icon: Music, color: "text-chart-primary", bg: "bg-chart-primary/10 " },
 { label: "Unpaid", value: stats.unpaid.length, icon: CreditCard, color: "text-muted-foreground", bg: "bg-muted " },
 { label: "Past Due (3+ mo)", value: stats.pastDue.length, icon: AlertCircle, color: "text-chart-destructive", bg: "bg-chart-destructive/10 " },
 ].map((stat) => (
 <div key={stat.label} className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
 <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", stat.bg)}>
 <stat.icon size={22} className={stat.color} />
 </div>
 <div>
 <div className={cn("text-3xl font-semibold", stat.color)}>{stat.value}</div>
 <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">{stat.label}</div>
 </div>
 </div>
 ))}
 </div>

 {/* Quick Actions */}
 <div>
 <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Quick Actions</h3>
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
 {quickActions.map((action) => (
 <button
 key={action.label}
 onClick={action.onClick}
 className="flex items-center gap-3 bg-card border border-border rounded-xl p-4 hover:border-border transition-all text-left group"
 >
 <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", action.color.replace("bg-", "bg-").replace("500", "100 "))}>
 <action.icon size={18} className={action.color.replace("bg-", "text-")} />
 </div>
 <span className="font-medium text-sm text-foreground flex-1">{action.label}</span>
 <ArrowUpRight size={14} className="text-muted-foreground group-hover:text-destructive transition-colors shrink-0" />
 </button>
 ))}
 </div>
 </div>

 {/* Two columns: Upcoming + Attention */}
 <div className="grid lg:grid-cols-2 gap-6">
 {/* Upcoming Lessons */}
 <div className="bg-card rounded-xl border border-border overflow-hidden">
 <div className="flex items-center justify-between p-5 border-b border-border">
 <div className="flex items-center gap-2">
 <Calendar size={16} className="text-destructive" />
 <h3 className="font-semibold text-sm">Upcoming Lessons</h3>
 </div>
 <Button variant="ghost" size="sm" onClick={() => navigate("/voice/calendar")} className="text-[10px] font-semibold uppercase tracking-wider text-destructive h-8">
 View All
 </Button>
 </div>
 <div className="p-4 space-y-2">
 {stats.futureLessons.length === 0 ? (
 <p className="text-xs text-muted-foreground text-center py-6">No upcoming lessons.</p>
 ) : (
 stats.futureLessons.map((lesson) => (
 <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
 <div className="w-9 h-9 rounded-lg bg-chart-destructive/10 flex items-center justify-center shrink-0">
 <Music size={14} className="text-chart-destructive" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="font-medium text-xs truncate">{lesson.studentName || lesson.name || "Voice Lesson"}</p>
                  <p className="text-[10px] text-muted-foreground">
                  {lesson.date && format(new Date(lesson.date), "EEE, MMM d")}
                  {lesson.date && lesson.time && ` · ${formatVoiceTime(lesson.date, lesson.time)}`}
                  </p>
 </div>
 {lesson.paymentStatus && (
 <Badge className={cn(
 "text-[10px] font-semibold border-none shrink-0",
 lesson.paymentStatus === "Paid (Stripe)" ? "bg-chart-emerald/10 text-chart-emerald" :
 lesson.paymentStatus === "Paid on Day" ? "bg-chart-primary/10 text-chart-primary" :
 "bg-muted text-muted-foreground"
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
 <div className="bg-card rounded-xl border border-border overflow-hidden">
 <div className="flex items-center justify-between p-5 border-b border-border">
 <div className="flex items-center gap-2">
 <AlertCircle size={16} className="text-muted-foreground" />
 <h3 className="font-semibold text-sm">Needs Attention</h3>
 </div>
 <Button variant="ghost" size="sm" onClick={() => navigate("/voice/clients")} className="text-[10px] font-semibold uppercase tracking-wider text-destructive h-8">
 View All
 </Button>
 </div>
 <div className="p-4 space-y-2">
 {stats.pastDue.length === 0 ? (
 <p className="text-xs text-muted-foreground text-center py-6">All students contacted recently.</p>
 ) : (
 stats.pastDue.slice(0, 8).map((student) => (
 <div key={student.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
 <div className="w-9 h-9 rounded-lg bg-chart-destructive/10 flex items-center justify-center shrink-0">
 <Users size={14} className="text-chart-destructive" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="font-medium text-xs truncate">{student.name || "Unnamed"}</p>
 <p className="text-[10px] text-muted-foreground">
 {student.latestDate
 ? `Last seen ${format(new Date(student.latestDate), "MMM d, yyyy")}`
 : "No lessons yet"}
 </p>
 </div>
 <div className="flex gap-1 shrink-0">
 {student.email && (
 <a href={`mailto:${student.email}`} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-all" title="Email">
 <Mail size={13} />
 </a>
 )}
 {student.notionUrl && (
 <a href={student.notionUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-all" title="Notion">
 <ExternalLink size={13} />
 </a>
 )}
 </div>
 </div>
 ))
 )}
 {stats.pastDue.length > 8 && (
 <p className="text-[10px] font-medium text-muted-foreground text-center pt-1">
 + {stats.pastDue.length - 8} more
 </p>
 )}
 </div>
 </div>
 </div>

 {/* Recent Lessons */}
 <div className="bg-card rounded-xl border border-border overflow-hidden">
 <div className="flex items-center justify-between p-5 border-b border-border">
 <div className="flex items-center gap-2">
 <Clock size={16} className="text-primary" />
 <h3 className="font-semibold text-sm">Recent Lessons</h3>
 </div>
 <Button variant="ghost" size="sm" onClick={() => navigate("/voice/calendar")} className="text-[10px] font-semibold uppercase tracking-wider text-destructive h-8">
 View Calendar
 </Button>
 </div>
 <div className="p-4">
 {lessons.length === 0 ? (
 <p className="text-xs text-muted-foreground text-center py-6">No lessons yet.</p>
 ) : (
 <div className="space-y-1">
                {[...filteredLessons]
              .filter((l) => l.date && new Date(l.date) <= now)
              .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
              .slice(0, 10)
 .map((lesson) => (
 <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors">
 <div className="w-9 h-9 rounded-lg bg-chart-primary/10 flex items-center justify-center shrink-0">
 <BookOpen size={14} className="text-chart-primary" />
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <p className="font-medium text-xs truncate">{lesson.studentName || lesson.name || "Voice Lesson"}</p>
 {lesson.paymentStatus && (
 <Badge className={cn(
 "text-[10px] font-semibold border-none shrink-0",
 lesson.paymentStatus === "Paid (Stripe)" ? "bg-chart-emerald/10 text-chart-emerald" :
 lesson.paymentStatus === "Paid on Day" ? "bg-chart-primary/10 text-chart-primary" :
 "bg-muted text-muted-foreground"
 )}>
 {lesson.paymentStatus}
 </Badge>
 )}
 </div>
                  <p className="text-[10px] text-muted-foreground">
                  {lesson.date && format(new Date(lesson.date), "MMM d, yyyy")}
                  {lesson.date && lesson.time && ` · ${formatVoiceTime(lesson.date, lesson.time)}`}
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
