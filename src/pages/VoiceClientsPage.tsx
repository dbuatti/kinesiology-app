import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
 Search, Plus, Mic, Mail, Phone, ExternalLink, Users,
 ChevronDown, ChevronRight, CheckCheck, Square, Loader2,
 Calendar, CalendarPlus, Music, MessageCircle, Trash2, RotateCcw, ArrowLeft
} from "lucide-react";
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogDescription,
 DialogFooter,
} from "@/components/ui/dialog";
import AppLayout from "@/components/crm/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import VoiceOnboardingForm from "@/components/crm/VoiceOnboardingForm";
import VoiceMessagePopover from "@/components/crm/VoiceMessagePopover";
import SimpleBookDialog from "@/components/crm/SimpleBookDialog";
import NewInfoBadge from "@/components/crm/NewInfoBadge";
import { cn } from "@/lib/utils";

interface VoiceStudent {
  id: string;
  notionUrl: string | null;
  archived: boolean;
  name: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  tags: string[];
  discipline?: string | null;
  latestDate: string | null;
  allDates: string | null;
  lastCommunication: string | null;
  createdAt: string;
  updatedAt: string;
}

interface VoiceLesson {
 id: string;
 notionUrl: string;
 name: string | null;
 date: string | null;
 time: string | null;
 studentIds: string[];
}

const now = new Date();
const oneMonthAgo = new Date();
oneMonthAgo.setDate(now.getDate() - 30);
const threeMonthsAgo = new Date();
threeMonthsAgo.setDate(now.getDate() - 90);

const VoiceClientsPage = () => {
 const navigate = useNavigate();
 const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState<"all" | "voice" | "piano">("all");
  const [onboardOpen, setOnboardOpen] = useState(false);
 const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
 const [selectedIds, setSelectedIds] = useState<string[]>([]);
 const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
 const [loggingContact, setLoggingContact] = useState<string | null>(null);
  const [simpleBookOpen, setSimpleBookOpen] = useState(false);
  const [simpleBookStudentId, setSimpleBookStudentId] = useState<string | null>(null);

 const logContact = useMutation({
 mutationFn: async (studentId: string) => {
 const { data, error } = await supabase.functions.invoke("voice-log-contact", {
 body: { studentId },
 });
 if (error) throw error;
 return data;
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["voice-students"] });
 },
 });

 const deleteStudent = useMutation({
 mutationFn: async (studentId: string) => {
 const { data, error } = await supabase.functions.invoke("voice-delete-student", {
 body: { studentId },
 });
 if (error) throw error;
 return data;
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["voice-students"] });
 },
 });

 const { data: students = [], isLoading, isError, error, refetch } = useQuery<VoiceStudent[]>({
 queryKey: ["voice-students"],
 queryFn: async () => {
 const { data, error } = await supabase.functions.invoke("voice-clients");
 if (error) throw error;
 return data?.students || [];
 },
 staleTime: 5 * 60 * 1000,
 gcTime: 10 * 60 * 1000,
 });

 const { data: lessons = [] } = useQuery<VoiceLesson[]>({
 queryKey: ["voice-lessons"],
 queryFn: async () => {
 const { data, error } = await supabase.functions.invoke("voice-lessons");
 if (error) throw error;
 return data?.lessons || [];
 },
 staleTime: 2 * 60 * 1000,
 gcTime: 5 * 60 * 1000,
 });

 // Voice onboarding submissions → "NEW" badge by student email.
 const { data: voiceOnboarding = [] } = useQuery({
 queryKey: ["voice-onboarding-status"],
 queryFn: async () => {
 const { data } = await supabase
 .from("voice_onboarding")
 .select("email, submitted_at, onboarding_completed");
 return data || [];
 },
 staleTime: 2 * 60 * 1000,
 });
 const onboardingByEmail = useMemo(() => {
 const m = new Map<string, string>();
 for (const o of voiceOnboarding as any[]) {
 if (o.email && o.onboarding_completed && o.submitted_at) m.set(o.email.toLowerCase(), o.submitted_at);
 }
 return m;
 }, [voiceOnboarding]);

 const enriched = useMemo(() => {
 return students.map((s) => {
 const studentLessons = lessons.filter((l) => l.studentIds.includes(s.id));
 const pastLessons = studentLessons.filter((l) => l.date && new Date(l.date) <= now);
 const futureLessons = studentLessons.filter((l) => l.date && new Date(l.date) > now);
 pastLessons.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
 const lastSeenDate = s.latestDate
 ? new Date(s.latestDate)
 : pastLessons.length > 0
 ? new Date(pastLessons[0].date!)
 : null;
 const nextLesson = futureLessons.sort((a, b) => (a.date || "").localeCompare(b.date || ""))[0] || null;
 return {
 ...s,
 lastSeenDate,
 nextLessonDate: nextLesson?.date || null,
 hasUpcoming: futureLessons.length > 0,
 lessonCount: studentLessons.length,
 };
 });
 }, [students, lessons]);

  const filtered = useMemo(() => {
    let result = enriched;
    if (disciplineFilter !== "all") {
      result = result.filter((s) => (s.discipline || "voice") === disciplineFilter);
    }
    if (!search) return result;
    const q = search.toLowerCase();
    return result.filter(
      (s) =>
      (s.name || "").toLowerCase().includes(q) ||
      (s.email || "").toLowerCase().includes(q) ||
      (s.phone || "").toLowerCase().includes(q) ||
      s.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [enriched, search, disciplineFilter]);

 const sortByLastSeen = (a: typeof filtered[0], b: typeof filtered[0]) => {
 if (a.hasUpcoming && !b.hasUpcoming) return -1;
 if (!a.hasUpcoming && b.hasUpcoming) return 1;
 if (a.lastSeenDate && b.lastSeenDate) return b.lastSeenDate.getTime() - a.lastSeenDate.getTime();
 if (a.lastSeenDate && !b.lastSeenDate) return -1;
 if (!a.lastSeenDate && b.lastSeenDate) return 1;
 return 0;
 };

 const groups = useMemo(() => ({
 active: filtered.filter(
 (s) => (s.lastSeenDate && s.lastSeenDate >= oneMonthAgo) || s.hasUpcoming
 ).sort(sortByLastSeen),
 oneToThree: filtered.filter(
 (s) =>
 !s.hasUpcoming &&
 s.lastSeenDate &&
 s.lastSeenDate < oneMonthAgo &&
 s.lastSeenDate >= threeMonthsAgo
 ).sort(sortByLastSeen),
 threePlus: filtered.filter(
 (s) =>
 !s.hasUpcoming &&
 (!s.lastSeenDate || s.lastSeenDate < threeMonthsAgo)
 ).sort(sortByLastSeen),
 }), [filtered]);

 const toggleCollapse = (key: string) =>
 setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

 const isAllSelected = (ids: string[]) =>
 ids.length > 0 && ids.every((id) => selectedIds.includes(id));

 const toggleSelectAll = (ids: string[]) => {
 if (isAllSelected(ids)) {
 setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
 } else {
 setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
 }
 };

 const toggleSelect = (id: string) => {
 setSelectedIds((prev) =>
 prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
 );
 };

 const handleBulkEmail = () => {
 const selected = students.filter((s) => selectedIds.includes(s.id) && s.email);
 if (selected.length === 0) return;
 window.open(`mailto:${selected.map((s) => s.email).join(",")}`, "_blank");
 };

 const formatRelativeDate = (d: Date | null): string => {
 if (!d) return "Never";
 const diffMs = now.getTime() - d.getTime();
 const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
 if (diffDays < 0) return "Upcoming";
 if (diffDays === 0) return "Today";
 if (diffDays === 1) return "Yesterday";
 if (diffDays < 30) return `${diffDays}d ago`;
 const diffMonths = Math.floor(diffDays / 30);
 if (diffMonths < 12) return `${diffMonths}mo ago`;
 return `${Math.floor(diffMonths / 12)}y ago`;
 };

 const bucketConfig = [
 {
 key: "active",
 label: "Active & Upcoming",
 desc: "Seen in the last 30 days OR booked in the future",
 color: "bg-chart-emerald",
 bg: "bg-chart-emerald/10 ",
 border: "border-border ",
 count: groups.active.length,
 students: groups.active,
 },
 {
 key: "oneToThree",
 label: "1\u20133 Months",
 desc: "Seen 30 to 90 days ago",
 color: "bg-muted",
 bg: "bg-muted ",
 border: "border-border ",
 count: groups.oneToThree.length,
 students: groups.oneToThree,
 },
 {
 key: "threePlus",
 label: "3+ Months (Re-engagement Goldmine)",
 desc: "Seen more than 90 days ago, or never seen",
 color: "bg-destructive",
 bg: "bg-chart-destructive/10 ",
 border: "border-border ",
 count: groups.threePlus.length,
 students: groups.threePlus,
 },
 ];

 if (isLoading) {
 return (
 <AppLayout>
 <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
 <Loader2 className="animate-spin text-destructive" size={48} />
 <p className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">
 Loading students...
 </p>
 </div>
 </AppLayout>
 );
 }

 if (isError) {
 return (
 <AppLayout>
 <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
 <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
 <span className="text-2xl font-semibold text-destructive">!</span>
 </div>
 <p className="text-destructive font-semibold text-xs uppercase tracking-wider text-center">Failed to load students</p>
 <p className="text-destructive/70 text-xs text-center max-w-md">{(error as any)?.message || "An unexpected error occurred"}</p>
 <Button onClick={() => refetch()} className="bg-destructive hover:bg-destructive/80 rounded-xl font-medium text-xs">
 <RotateCcw size={14} className="mr-2" /> Retry
 </Button>
 </div>
 </AppLayout>
 );
 }

 return (
 <AppLayout>
 <div className="flex flex-col gap-8 pb-32">
 <PageHeader
 title="Voice Clients"
 subtitle="Student engagement audit — grouped by recency and booking status."
 icon={Mic}
   iconClassName="bg-destructive text-primary-foreground "
  actions={
 <div className="flex gap-2">
 <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="rounded-xl text-xs gap-2">
 <ArrowLeft size={14} /> Back
 </Button>
 <Dialog open={onboardOpen} onOpenChange={setOnboardOpen}>
 <Button
 onClick={() => setOnboardOpen(true)}
 className="bg-destructive hover:bg-destructive/80 shadow-sm rounded-xl h-12 px-8 font-semibold text-xs uppercase tracking-wider"
 >
 <Plus size={20} className="mr-2" /> Add Student
 </Button>
 <DialogContent className="sm:max-w-[500px] rounded-xl p-0 overflow-hidden">
 <div className="p-8">
 <DialogHeader className="mb-6">
 <DialogTitle className="text-2xl font-semibold">New Student</DialogTitle>
 </DialogHeader>
  <VoiceOnboardingForm
  onSuccess={() => {
  setOnboardOpen(false);
  queryClient.invalidateQueries({ queryKey: ["voice-students"] });
  }}
  />
 </div>
 </DialogContent>
 </Dialog>
 </div>
 }
 />

  {/* Discipline filter */}
  <div className="flex bg-muted rounded-xl p-0.5 border border-border w-fit">
    {(["all", "voice", "piano"] as const).map((f) => (
      <button
        key={f}
        onClick={() => setDisciplineFilter(f)}
        className={cn(
          "px-4 py-2 rounded-[10px] text-xs font-semibold transition-all capitalize",
          disciplineFilter === f
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {f === "all" ? "All" : f}
      </button>
    ))}
  </div>

  {/* Summary strip */}
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
 <div className="bg-card rounded-xl border border-border p-5 flex flex-col gap-1">
 <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Students</span>
 <span className="text-3xl font-semibold text-foreground">{students.length}</span>
 </div>
 <div className="bg-card rounded-xl border border-border p-5 flex flex-col gap-1">
 <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active & Upcoming</span>
 <span className="text-3xl font-semibold text-chart-emerald">{groups.active.length}</span>
 </div>
 <div className="bg-card rounded-xl border border-border p-5 flex flex-col gap-1">
 <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">1\u20133 Months</span>
 <span className="text-3xl font-semibold text-muted-foreground">{groups.oneToThree.length}</span>
 </div>
 <div className="bg-card rounded-xl border border-border p-5 flex flex-col gap-1">
 <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">3+ Months</span>
 <span className="text-3xl font-semibold text-chart-destructive">{groups.threePlus.length}</span>
 </div>
 </div>

 {/* Search */}
 <div className="relative max-w-md">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
 <Input
 placeholder="Search students by name, email, phone or tag..."
 className="pl-12 bg-card border-border h-12 rounded-xl font-medium"
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 />
 </div>

 {/* Empty state */}
 {students.length === 0 && !search ? (
 <div className="flex flex-col items-center justify-center py-16 text-center">
 <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
 <Users size={20} className="text-muted-foreground" />
 </div>
 <h3 className="text-sm font-semibold text-foreground mb-1">No students yet</h3>
 <p className="text-xs text-muted-foreground max-w-[240px]">Students will appear here after they book their first lesson.</p>
 </div>
 ) : bucketConfig.map((cfg) => {
 const collapsedKey = `bucket_${cfg.key}`;
 const isCollapsed = collapsed[collapsedKey];
 const ids = cfg.students.map((s) => s.id);
 const allSelected = isAllSelected(ids);

 return (
 <div key={cfg.key} className={cn("rounded-xl border overflow-hidden transition-all", cfg.bg, cfg.border)}>
 <div
 className="flex items-center gap-3 p-4 cursor-pointer select-none"
 onClick={() => toggleCollapse(collapsedKey)}
 >
 <div className={cn("w-2 h-2 rounded-full shrink-0", cfg.color)} />
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <span className="font-semibold text-sm text-foreground">{cfg.label}</span>
 <Badge variant="secondary" className="text-[10px] font-semibold px-2 py-0 rounded-full bg-card border-border">
 {cfg.count}
 </Badge>
 </div>
 <p className="text-xs text-muted-foreground mt-0.5">{cfg.desc}</p>
 </div>
 <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
 {cfg.students.length > 0 && (
 <button
 onClick={() => toggleSelectAll(ids)}
 className={cn(
 "text-[10px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all",
 allSelected
  ? "bg-destructive text-primary-foreground border-destructive"
 : "bg-card border-border text-muted-foreground hover:text-foreground"
 )}
 >
 {allSelected ? "Deselect All" : "Select All"}
 </button>
 )}
 <button className="text-muted-foreground hover:text-foreground transition-colors p-1">
 {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
 </button>
 </div>
 </div>

 {!isCollapsed && (
 <div className="px-4 pb-4 space-y-2">
 {cfg.students.length === 0 ? (
 <p className="text-xs text-muted-foreground text-center py-6">No students in this group.</p>
 ) : (
 cfg.students.map((student) => {
 const selected = selectedIds.includes(student.id);
 return (
 <div
 key={student.id}
 className={cn(
 "flex items-center gap-3 bg-card p-4 rounded-xl border transition-all duration-200",
 selected
  ? "border-destructive/30 shadow-sm "
 : "border-border hover:border-border "
 )}
 >
 <button
 onClick={() => toggleSelect(student.id)}
 className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
 >
 {selected ? <CheckCheck size={20} className="text-destructive" /> : <Square size={20} />}
 </button>

 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <span className="font-medium text-sm text-foreground truncate">
 {student.name || "Unnamed"}
 </span>
 <NewInfoBadge submittedAt={student.email ? onboardingByEmail.get(student.email.toLowerCase()) : undefined} />
 {student.hasUpcoming && (
 <Badge className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-chart-emerald/10 text-chart-emerald border-none shrink-0">
 Booked
 </Badge>
 )}
                  {(student.discipline || "voice") && (
                    <Badge className={cn(
                      "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border-none shrink-0",
                      (student.discipline || "voice") === "piano"
                        ? "bg-chart-primary/10 text-chart-primary"
                        : "bg-chart-destructive/10 text-chart-destructive"
                    )}>
                      {student.discipline || "voice"}
                    </Badge>
                  )}
                  {student.tags.length > 0 && student.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-chart-destructive/10 text-chart-destructive border-none shrink-0">
                        {tag}
                      </Badge>
                    ))}
 </div>
 <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-muted-foreground mt-0.5">
 {student.email && (
 <span className="flex items-center gap-1"><Mail size={11} /> {student.email}</span>
 )}
 {student.phone && (
 <span className="flex items-center gap-1"><Phone size={11} /> {student.phone}</span>
 )}
 </div>
 </div>

 <div className="hidden sm:flex items-center gap-3 text-xs font-medium text-muted-foreground shrink-0">
 <span className="text-right">
 <div className="font-medium text-foreground">{formatRelativeDate(student.lastSeenDate)}</div>
 <div className="text-[10px]">Last seen</div>
 </span>
 <span className="text-right">
 <div className="font-medium text-foreground">{formatRelativeDate(student.lastCommunication ? new Date(student.lastCommunication) : null)}</div>
 <div className="text-[10px]">Contacted</div>
 </span>
 {student.lessonCount > 0 && (
 <span className="text-right">
 <div className="font-medium text-foreground">{student.lessonCount}</div>
 <div className="text-[10px]">Lessons</div>
 </span>
 )}
 </div>

 <div className="flex items-center gap-1 shrink-0">
 <VoiceMessagePopover
 student={student}
 hasUpcoming={student.hasUpcoming}
 onContactLogged={(id) => {
 logContact.mutate(id);
 }}
 />
  <button
  onClick={() => {
  setSimpleBookStudentId(student.id);
  setSimpleBookOpen(true);
  }}
  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-all"
  title="Book a lesson"
  >
  <CalendarPlus size={15} />
  </button>
 {student.notionUrl && (
 <a
 href={student.notionUrl}
 target="_blank"
 rel="noopener noreferrer"
 className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-all"
 title="Open in Notion"
 >
 <ExternalLink size={15} />
 </a>
 )}
 <button
 onClick={() => setDeleteConfirmId(student.id)}
 className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-all"
 title="Delete student"
 >
 <Trash2 size={15} />
 </button>
 </div>
 </div>
 );
 })
 )}
 </div>
 )}
 </div>
 );
 })}
 </div>

  {/* Simple Book Dialog (pick any date/time) */}
  <SimpleBookDialog
  open={simpleBookOpen}
  onOpenChange={(o) => {
  setSimpleBookOpen(o);
  if (!o) setSimpleBookStudentId(null);
  }}
  prefillStudentId={simpleBookStudentId || undefined}
  />

 {/* Delete confirmation */}
 <Dialog open={!!deleteConfirmId} onOpenChange={(o) => !o && setDeleteConfirmId(null)}>
 <DialogContent className="sm:max-w-[400px] rounded-xl">
 <DialogHeader>
 <DialogTitle>Delete Student</DialogTitle>
 <DialogDescription>
 This will permanently archive this student from Notion. This action cannot be undone.
 </DialogDescription>
 </DialogHeader>
 <DialogFooter className="flex gap-2 sm:gap-0">
 <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="rounded-xl font-medium text-xs">
 Cancel
 </Button>
 <Button
 onClick={() => {
 if (deleteConfirmId) {
 deleteStudent.mutate(deleteConfirmId, {
 onSettled: () => setDeleteConfirmId(null),
 });
 }
 }}
 disabled={deleteStudent.isPending}
 className="bg-destructive hover:bg-destructive/80 rounded-xl font-medium text-xs"
 >
 {deleteStudent.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : <Trash2 size={14} className="mr-2" />}
 Delete
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>

 {/* Bulk actions bar */}
 {selectedIds.length > 0 && (
 <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-background via-background to-transparent pointer-events-none">
 <div className="max-w-5xl mx-auto bg-card border border-border rounded-xl shadow-sm p-4 flex items-center justify-between gap-4 pointer-events-auto">
 <span className="text-sm font-medium">
 {selectedIds.length} student{selectedIds.length !== 1 ? "s" : ""} selected
 </span>
 <div className="flex items-center gap-2">
 <Button variant="outline" size="sm" className="h-10 rounded-xl border-border font-medium text-xs gap-2" onClick={() => setSelectedIds([])}>
 Clear
 </Button>
 <Button variant="outline" size="sm" className="h-10 rounded-xl border-border font-medium text-xs gap-2" onClick={handleBulkEmail}>
 <Mail size={14} /> Email All
 </Button>
 </div>
 </div>
 </div>
 )}
 </AppLayout>
 );
};

export default VoiceClientsPage;
