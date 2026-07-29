import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Loader2, ListOrdered, ExternalLink, User, Calendar, AlertCircle, RefreshCw, ArrowLeft, Music } from "lucide-react";
import { voiceTimeDuration, parseVoiceTime } from "@/utils/availability";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AppLayout from "@/components/crm/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { format } from "date-fns";

const APPOINTMENT_TAGS = ["Kinesiology", "Community Kinesiology", "Consultation", "Initial Session", "Follow-up", "Quick Session"];
const APPOINTMENT_STATUSES = ["Scheduled", "Completed", "Cancelled", "No Show"];
const VOICE_STATUSES = ["booked", "paid", "cancelled", "rescheduled"];

type SourceType = "all" | "kinesiology" | "voice";

interface AppRow {
  id: string;
  display_id: string;
  date: Date;
  name: string;
  status: string;
  tag: string | null;
  clientId: string | null;
  clientName: string | null;
  priceAmount: number | null;
  isPaid: boolean;
  boltScore: number | null;
  source: SourceType;
  notionUrl?: string | null;
}

const AllAppointmentsPage = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const practitionerEmail = session?.user?.email || "";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState<SourceType>("all");
  const [apps, setApps] = useState<AppRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [apptResult, voiceResult] = await Promise.all([
          supabase
            .from("appointments")
            .select("id, display_id, date, name, status, tag, client_id, price_amount, payment_received, bolt_score, clients(name, standard_rate, is_practitioner)")
            .order("date", { ascending: false }),
          supabase
            .from("voice_bookings")
            .select("calcom_booking_id, student_name, student_email, lesson_date, lesson_time, cost, status, notion_lesson_id_2"),
        ]);

        if (apptResult.error) throw apptResult.error;

        const kinesiology: AppRow[] = (apptResult.data || [])
          .filter((a: any) => !a.clients?.is_practitioner)
          .map((a: any) => ({
            id: a.id,
            display_id: a.display_id,
            date: new Date(a.date),
            name: a.name,
            status: a.status,
            tag: a.tag,
            clientId: a.client_id,
            clientName: a.clients?.name ?? null,
            priceAmount: a.clients?.standard_rate ?? a.price_amount ?? null,
            isPaid: a.payment_received === true,
            boltScore: a.bolt_score ?? null,
            source: "kinesiology" as SourceType,
          }));

        const voice: AppRow[] = (voiceResult.data || [])
          .filter((vb: any) => vb.lesson_date && vb.student_name && vb.student_email !== practitionerEmail)
          .map((vb: any, idx: number) => {
            const dur = vb.lesson_time ? voiceTimeDuration(vb.lesson_time) : null;
            const derivedCost = vb.cost ?? (dur === 30 ? 50 : dur === 45 ? 75 : dur === 60 ? 95 : null);
            return {
              id: `vb-${vb.calcom_booking_id || idx}`,
              display_id: vb.calcom_booking_id ? `VB-${String(vb.calcom_booking_id).slice(0, 6)}` : `VB-${idx}`,
              date: parseVoiceTime(vb.lesson_date, vb.lesson_time),
              name: vb.lesson_time || "Voice Lesson",
              status: vb.status || "booked",
              tag: "Voice",
              clientId: null,
              clientName: vb.student_name || vb.student_email || null,
              priceAmount: derivedCost,
              isPaid: vb.status === "paid",
              boltScore: null,
              source: "voice" as SourceType,
              notionUrl: vb.notion_lesson_id_2 ? `https://notion.so/${vb.notion_lesson_id_2.replace(/-/g, "")}` : null,
            };
          });

        const all = [...kinesiology, ...voice].sort((a, b) => b.date.getTime() - a.date.getTime());
        setApps(all);
      } catch (err) {
        console.error("Error fetching appointments:", err);
        setError("Failed to load appointments. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const filtered = apps.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      a.clientName?.toLowerCase().includes(q) ||
      a.name?.toLowerCase().includes(q) ||
      a.display_id?.toLowerCase().includes(q);

    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    const matchTag = tagFilter === "all" || a.tag === tagFilter;
    const matchSource = sourceFilter === "all" || a.source === sourceFilter;

    return matchSearch && matchStatus && matchTag && matchSource;
  });

  const statusBadge = (status: string, source: SourceType) => {
    const voiceStatusColors: Record<string, string> = {
      booked: "bg-chart-primary/10 text-chart-primary border-chart-primary/20",
      paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
      cancelled: "bg-red-100 text-red-700 border-destructive/20",
      rescheduled: "bg-amber-100 text-amber-700 border-amber-200",
    };
    const kinesiologyColors: Record<string, string> = {
      Scheduled: "bg-chart-primary/10 text-chart-primary border-chart-primary/20",
      Completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
      Cancelled: "bg-red-100 text-red-700 border-destructive/20",
      "No Show": "bg-amber-100 text-amber-700 border-amber-200",
      AP: "bg-muted text-muted-foreground border-border",
    };
    const colors = source === "voice" ? voiceStatusColors : kinesiologyColors;
    const label = source === "voice" ? status.charAt(0).toUpperCase() + status.slice(1) : status;
    return (
      <Badge variant="outline" className={colors[status] || "bg-muted text-muted-foreground"}>
        {label}
      </Badge>
    );
  };

  return (
    <AppLayout variant="wide">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="All Appointments"
          subtitle={`${filtered.length} of ${apps.length} total`}
          icon={ListOrdered}
          actions={
            <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="rounded-xl text-xs gap-2">
              <ArrowLeft size={14} /> Back
            </Button>
          }
        />

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search client or appointment..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as SourceType)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="kinesiology">Kinesiology</SelectItem>
              <SelectItem value="voice">Voice</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {APPOINTMENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={tagFilter} onValueChange={setTagFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {APPOINTMENT_TAGS.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle size={28} className="text-destructive" />
            </div>
            <p className="text-destructive font-semibold text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={() => { setError(null); setLoading(true); }} className="rounded-xl text-xs gap-2">
              <RefreshCw size={14} /> Retry
            </Button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading appointments...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <ListOrdered className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-lg font-medium">No appointments found</p>
            <p className="text-sm">{search ? "Try a different search term." : "No appointments match the selected filters."}</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead className="w-[140px]">Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="hidden md:table-cell">Appointment</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="hidden lg:table-cell w-[140px]">Tag</TableHead>
                  <TableHead className="hidden sm:table-cell w-[80px] text-right">Price</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => (
                  <TableRow key={a.id} className="group">
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {a.display_id}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-sm">
                        {format(a.date, "MMM d, yyyy")}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {format(a.date, "h:mm a")}
                      </span>
                    </TableCell>
                    <TableCell>
                      {a.clientName ? (
                        a.source === "voice" ? (
                          <span className="flex items-center gap-1.5 text-sm font-medium">
                            <Music size={14} className="text-muted-foreground shrink-0" />
                            <span>{a.clientName}</span>
                          </span>
                        ) : (
                          <Link
                            to={`/clients/${a.clientId}`}
                            className="flex items-center gap-1.5 text-sm font-medium hover:text-primary transition-colors"
                          >
                            <User size={14} className="text-muted-foreground shrink-0" />
                            <span>{a.clientName}</span>
                          </Link>
                        )
                      ) : (
                        <span className="text-sm text-muted-foreground italic">No client</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[240px] truncate">
                      {a.name}
                    </TableCell>
                    <TableCell>{statusBadge(a.status, a.source)}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {a.tag && (
                        <Badge variant="secondary" className={`text-xs ${a.source === "voice" ? "bg-destructive/10 text-destructive border-destructive/20" : ""}`}>
                          {a.source === "voice" ? <Music size={10} className="mr-1" /> : null}
                          {a.tag}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-right">
                      <span className="text-sm font-medium tabular-nums">
                        {a.priceAmount != null ? `$${a.priceAmount}` : "—"}
                      </span>
                      {a.priceAmount != null && a.priceAmount > 0 && (
                        <span className={`block text-[10px] font-semibold uppercase tracking-wider ${a.isPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {a.isPaid ? "Paid" : "Due"}
                        </span>
                      )}
                      {a.priceAmount === 0 && (
                        <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Free</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {a.source === "kinesiology" ? (
                        <Link
                          to={`/appointments/${a.id}`}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ExternalLink size={14} />
                          </Button>
                        </Link>
                      ) : (
                        <Link
                          to="/calendar"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Calendar size={14} />
                          </Button>
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AllAppointmentsPage;
