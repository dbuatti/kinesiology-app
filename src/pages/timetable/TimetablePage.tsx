import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarRange,
  Loader2,
  RefreshCw,
  TrendingUp,
  CalendarDays,
  Ban,
  CheckCircle2,
  Circle,
  AlertTriangle,
  User,
  Music,
  Check,
  X,
  PenLine,
  ChevronLeft,
  ChevronRight,
  Mail,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { useBookingProposals, BookingProposal } from "@/hooks/useBookingProposals";
import { useIcloudCalendar, IcloudCalendarEvent } from "@/hooks/useIcloudCalendar";
import { CALCOM_CONFIG } from "@/config/integrations";
import {
  format,
  startOfWeek,
  addWeeks,
  eachDayOfInterval,
  addDays,
  startOfDay,
  endOfDay,
  differenceInMinutes,
  isSameDay,
} from "date-fns";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface SlotInfo {
  start: string;
  time: string;
}

interface BookingInfo {
  id?: string;
  uid?: string;
  start?: string;
  attendeeName?: string;
  attendeeEmail?: string;
  title?: string;
}

interface SlotsResponse {
  status?: string;
  message?: string;
  data?: Record<string, SlotInfo[]>;
  blockedDates?: string[];
  bookings?: Record<string, BookingInfo[]>;
}

interface VoiceStudent {
  id: string;
  name: string | null;
  email: string | null;
}

interface VoiceClientsResponse {
  students?: {
    id: string;
    name: string | null;
    email: string | null;
  }[];
}

interface FnhClient {
  id: string;
  name: string | null;
  email: string | null;
}

enum DayState {
  BLOCKED = "blocked",
  BOOKED = "booked",
  OPEN = "open",
  EMPTY = "empty",
}

type SessionKind = "fnh" | "voice";

const VIEW_RANGE_WEEKS = 12;

const VOICE_EVENT_TYPES = [
  { id: CALCOM_CONFIG.VOICE_EVENT_TYPE_60, label: "60 min" },
  { id: CALCOM_CONFIG.VOICE_EVENT_TYPE_45, label: "45 min" },
  { id: CALCOM_CONFIG.VOICE_EVENT_TYPE_30, label: "30 min" },
];

function zonedDateKey(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

const TimetablePage = () => {
  const [tab, setTab] = useState(() => {
    const t = new URLSearchParams(window.location.search).get("view");
    return t === "forecast" ? "forecast" : "fortnight";
  });
  const [fortnightIndex, setFortnightIndex] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slots, setSlots] = useState<Record<string, SlotInfo[]>>({});
  const [bookings, setBookings] = useState<Record<string, BookingInfo[]>>({});
  const [blockedDates, setBlockedDates] = useState<string[]>([]);

  // ── Phase 2: manual planning state ─────────────────────────────
  const [kind, setKind] = useState<SessionKind>("fnh");
  const [fnhEventType, setFnhEventType] = useState(CALCOM_CONFIG.DEFAULT_EVENT_TYPE_ID);
  const [voiceEventType, setVoiceEventType] = useState(CALCOM_CONFIG.VOICE_EVENT_TYPE_60);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedStudentName, setSelectedStudentName] = useState<string>("");
  const [selectedStudentEmail, setSelectedStudentEmail] = useState<string>("");

  const [pickingDay, setPickingDay] = useState<Date | null>(null);
  const [proposalFor, setProposalFor] = useState<BookingProposal | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const eventTypeId = kind === "fnh" ? fnhEventType : voiceEventType;

  // FNH clients + voice students for the selector.
  const { data: fnhClients = [] } = useQuery<FnhClient[]>({
    queryKey: ["timetable-fnh-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, email")
        .not("is_practitioner", "eq", true)
        .order("name");
      if (error) throw error;
      return (data || []) as FnhClient[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: voiceStudents = [] } = useQuery<VoiceStudent[]>({
    queryKey: ["timetable-voice-students"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<VoiceClientsResponse>("voice-clients");
      if (error) throw error;
      return (data?.students || []).map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const today = startOfDay(new Date());
      const start = startOfWeek(today, { weekStartsOn: 1 });
      const end = endOfDay(addDays(start, VIEW_RANGE_WEEKS * 7 - 1));

      const { data, error: invokeError } = await supabase.functions.invoke<SlotsResponse>(
        "get-calcom-slots",
        {
          body: {
            start: start.toISOString(),
            end: end.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        }
      );

      if (invokeError) throw invokeError;
      if (!data || data.status === "error") {
        setError(data?.message || "Could not load availability.");
        setSlots({});
        setBookings({});
        setBlockedDates([]);
        return;
      }

      setSlots(data.data || {});
      setBookings(data.bookings || {});
      setBlockedDates(data.blockedDates || []);
    } catch (err) {
      console.error("Failed to load timetable:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const dateRange = useMemo(() => {
    const start = startOfWeek(startOfDay(new Date()), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end: addDays(start, VIEW_RANGE_WEEKS * 7 - 1) });
  }, []);

  const { proposalsInWindow, createProposal, confirmProposal, dropProposal } = useBookingProposals(
    dateRange[0].toISOString(),
    dateRange[dateRange.length - 1].toISOString()
  );

  const {
    events: icloudEvents,
    total: icloudTotal,
    loading: icloudLoading,
    error: icloudError,
  } = useIcloudCalendar(dateRange[0].toISOString(), dateRange[dateRange.length - 1].toISOString());

  const stateFor = (d: Date): DayState => {
    const key = zonedDateKey(d);
    if (blockedDates.includes(key)) return DayState.BLOCKED;
    if ((bookings[key] || []).length > 0) return DayState.BOOKED;
    if ((slots[key] || []).length > 0) return DayState.OPEN;
    return DayState.EMPTY;
  };

  const summary = useMemo(() => {
    let openSlots = 0;
    let booked = 0;
    let blocked = 0;
    dateRange.forEach((d) => {
      const key = zonedDateKey(d);
      openSlots += (slots[key] || []).length;
      booked += (bookings[key] || []).length;
      if (blockedDates.includes(key)) blocked++;
    });
    return { openSlots, booked, blocked, days: dateRange.length };
  }, [dateRange, slots, bookings, blockedDates]);

  // Weekly forecast buckets for the bar chart
  const forecastData = useMemo(() => {
    const weeksArr: { label: string; open: number; booked: number; blocked: number }[] = [];
    for (let w = 0; w < VIEW_RANGE_WEEKS; w++) {
      const weekStart = addWeeks(startOfWeek(startOfDay(new Date()), { weekStartsOn: 1 }), w);
      const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });
      let open = 0;
      let booked = 0;
      let blocked = 0;
      days.forEach((d) => {
        const key = zonedDateKey(d);
        open += (slots[key] || []).length;
        booked += (bookings[key] || []).length;
        if (blockedDates.includes(key)) blocked++;
      });
      weeksArr.push({
        label: `W${w + 1} ${format(weekStart, "d MMM")}`,
        open,
        booked,
        blocked,
      });
    }
    return weeksArr;
  }, [slots, bookings, blockedDates]);

  const weekdayLabel = (d: Date) => format(d, "EEE");

  // ── Proposal actions ──────────────────────────────────────────
  const handleCreateProposal = async (slotStart: string, slotEnd: string) => {
    if (kind === "fnh" && !selectedClientId) {
      showError("Pick an FNH client first.");
      return;
    }
    if (kind === "voice" && !selectedStudentEmail) {
      showError("Pick a voice student first.");
      return;
    }
    setWorking(true);
    try {
      const created = await createProposal({
        kind,
        clientId: kind === "fnh" ? selectedClientId : null,
        studentName: kind === "voice" ? selectedStudentName : null,
        studentEmail: kind === "voice" ? selectedStudentEmail : null,
        eventTypeId,
        slotStart,
        slotEnd,
      });
      showSuccess("Pencilled in as Proposed.");
      setCreateOpen(false);
      setPickingDay(null);
      setProposalFor(created);
      setManageOpen(true);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Could not create proposal.");
    } finally {
      setWorking(false);
    }
  };

  const handleConfirm = async () => {
    if (!proposalFor) return;
    setWorking(true);
    try {
      const updated = await confirmProposal(proposalFor);
      showSuccess("Confirmed — booking created in Cal.com.");
      setProposalFor(updated);
      setManageOpen(false);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Could not confirm proposal.");
    } finally {
      setWorking(false);
    }
  };

  const handleDrop = async () => {
    if (!proposalFor) return;
    setWorking(true);
    try {
      await dropProposal(proposalFor.id);
      showSuccess("Proposal dropped.");
      setManageOpen(false);
      setProposalFor(null);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Could not drop proposal.");
    } finally {
      setWorking(false);
    }
  };

  const handleSendEmail = async (days: number) => {
    setSendingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke<{
        success?: boolean;
        eventCount?: number;
        dayCount?: number;
        sentTo?: string;
        error?: string;
      }>("gmail-schedule-email", { body: { days } });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Could not send schedule email.");
      showSuccess(`Schedule email sent (${data.eventCount ?? 0} events over ${data.dayCount ?? 0} days).`);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Could not send schedule email.");
    } finally {
      setSendingEmail(false);
    }
  };

  const openDay = (d: Date) => {
    if (stateFor(d) !== DayState.OPEN) return;
    setPickingDay(d);
    setCreateOpen(true);
  };

  const openProposal = (p: BookingProposal) => {
    setProposalFor(p);
    setManageOpen(true);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-chart-primary/10 flex items-center justify-center">
            <CalendarRange size={20} className="text-chart-primary" />
          </div>
          <div>
            <h1 className="text-xl font-serif font-bold text-foreground">Timetable Simulator</h1>
            <p className="text-xs text-muted-foreground font-medium">
              Mock-up your fortnight, pencil in proposals, then confirm to Cal.com.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-chart-primary/10 text-chart-primary border-none" variant="outline">
            {summary.openSlots} open
          </Badge>
          <Badge className="bg-rose-600/10 text-rose-600 border-none" variant="outline">
            {summary.booked} booked
          </Badge>
          <Badge className="bg-muted text-muted-foreground border-none" variant="outline">
            {summary.blocked} blocked
          </Badge>
          <Button variant="ghost" size="sm" onClick={fetchData} disabled={loading} className="gap-1.5">
            <RefreshCw size={14} className={cn(loading && "animate-spin")} /> Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSendEmail(14)}
            disabled={sendingEmail}
            className="gap-1.5"
            title="Email the next 14 days' agenda to your inbox"
          >
            <Mail size={14} className={cn(sendingEmail && "animate-pulse")} /> Email schedule
          </Button>
        </div>
      </div>

      {/* Phase 3: iCloud calendar status */}
      <GcalStatusRow
        events={icloudEvents}
        total={icloudTotal}
        loading={icloudLoading}
        error={icloudError}
      />

      {/* Phase 2: planner bar */}
      <PlannerBar
        kind={kind}
        onKindChange={setKind}
        fnhEventType={fnhEventType}
        onFnhEventType={setFnhEventType}
        voiceEventType={voiceEventType}
        onVoiceEventType={setVoiceEventType}
        selectedClientId={selectedClientId}
        onSelectedClientId={setSelectedClientId}
        selectedStudentEmail={selectedStudentEmail}
        onSelectStudent={(name, email) => {
          setSelectedStudentName(name);
          setSelectedStudentEmail(email);
        }}
        fnhClients={fnhClients}
        voiceStudents={voiceStudents}
      />

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <div className="sticky top-0 z-10 bg-background border-b border-border -mx-4 px-4 md:-mx-6 md:px-6 py-2">
          <TabsList className="w-full sm:w-auto flex-wrap gap-1 bg-muted/60 rounded-xl p-1">
            <TabsTrigger value="fortnight" className="gap-2">
              <CalendarDays size={14} /> Fortnightly Mock-up
            </TabsTrigger>
            <TabsTrigger value="forecast" className="gap-2">
              <TrendingUp size={14} /> Forward Forecast
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="fortnight" className="m-0 mt-4">
          <FortnightMockup
            dateRange={dateRange.slice(fortnightIndex * 14, fortnightIndex * 14 + 14)}
            totalFortnights={Math.ceil(dateRange.length / 14)}
            fortnightIndex={fortnightIndex}
            onPrev={() => setFortnightIndex((i) => Math.max(0, i - 1))}
            onNext={() =>
              setFortnightIndex((i) =>
                Math.min(Math.ceil(dateRange.length / 14) - 1, i + 1)
              )
            }
            slots={slots}
            bookings={bookings}
            blockedDates={blockedDates}
            icloudEvents={icloudEvents}
            stateFor={stateFor}
            proposals={proposalsInWindow}
            loading={loading}
            error={error}
            onOpenDay={openDay}
            onOpenProposal={openProposal}
          />
        </TabsContent>

        <TabsContent value="forecast" className="m-0 mt-4">
          <ForecastPlot
            data={forecastData}
            proposals={proposalsInWindow}
            loading={loading}
            error={error}
          />
        </TabsContent>
      </Tabs>

      <LegendRow />

      {/* Create proposal dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pencil in a proposal</DialogTitle>
            <DialogDescription>
              {pickingDay ? format(pickingDay, "EEEE d MMM yyyy") : ""} — choose a slot time to
              propose for {kind === "fnh" ? "an FNH session" : "a voice lesson"}.
            </DialogDescription>
          </DialogHeader>
          {pickingDay && (
            <div className="grid gap-2 max-h-72 overflow-y-auto pr-1">
              {(slots[zonedDateKey(pickingDay)] || []).map((s, i) => (
                <Button
                  key={i}
                  variant="outline"
                  className="justify-start font-medium"
                  disabled={working}
                  onClick={() => {
                    const startIso = new Date(s.start).toISOString();
                    const endIso = new Date(
                      new Date(s.start).getTime() + 60 * 60 * 1000
                    ).toISOString();
                    handleCreateProposal(startIso, endIso);
                  }}
                >
                  <PenLine size={14} className="mr-2 text-chart-primary" />
                  {format(new Date(s.start), "h:mm a")} — 60 min
                </Button>
              ))}
              {!slots[zonedDateKey(pickingDay)]?.length && (
                <p className="text-sm text-muted-foreground">No times on this day.</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={working}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage proposal dialog */}
      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proposal</DialogTitle>
            <DialogDescription>
              {proposalFor
                ? `${format(new Date(proposalFor.slot_start), "EEEE d MMM yyyy, h:mm a")}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {proposalFor && (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                <span className="text-xs font-semibold text-muted-foreground">Who</span>
                <span className="text-sm font-bold text-foreground">
                  {proposalFor.kind === "fnh"
                    ? fnhClients.find((c) => c.id === proposalFor.client_id)?.name ||
                      "FNH client"
                    : proposalFor.student_name || "Voice student"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                <span className="text-xs font-semibold text-muted-foreground">Type</span>
                <Badge variant="outline" className="capitalize">
                  {proposalFor.kind}
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                <span className="text-xs font-semibold text-muted-foreground">Status</span>
                <StatusBadge status={proposalFor.status} />
              </div>
            </div>
          )}
          <DialogFooter className="flex sm:justify-between">
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={handleDrop}
              disabled={working || proposalFor?.status === "confirmed"}
            >
              <X size={14} /> Drop
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setManageOpen(false)} disabled={working}>
                Close
              </Button>
              <Button
                className="gap-1.5"
                onClick={handleConfirm}
                disabled={working || proposalFor?.status === "confirmed"}
              >
                {working ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                Confirm booking
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function GcalStatusRow({
  events,
  total,
  loading,
  error,
}: {
  events: IcloudCalendarEvent[];
  total: number;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card/60 px-3 py-2">
      <div className="flex items-center gap-2">
        {loading ? (
          <Loader2 size={14} className="text-muted-foreground animate-spin" />
        ) : (
          <CalendarDays size={14} className="text-chart-primary" />
        )}
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Calendar
        </span>
      </div>
      {error ? (
        <p className="text-[10px] font-medium text-rose-600">{error}</p>
      ) : (
        <p className="text-[10px] font-medium text-muted-foreground">
          {loading
            ? "Loading…"
            : total > events.length
              ? `${events.length} of ${total} busy events shown (${total - events.length} all-day)`
              : `${events.length} busy events in range`}
        </p>
      )}
    </div>
  );
}

function PlannerBar({
  kind,
  onKindChange,
  fnhEventType,  onFnhEventType,
  voiceEventType,
  onVoiceEventType,
  selectedClientId,
  onSelectedClientId,
  selectedStudentEmail,
  onSelectStudent,
  fnhClients,
  voiceStudents,
}: {
  kind: SessionKind;
  onKindChange: (k: SessionKind) => void;
  fnhEventType: string;
  onFnhEventType: (v: string) => void;
  voiceEventType: string;
  onVoiceEventType: (v: string) => void;
  selectedClientId: string;
  onSelectedClientId: (v: string) => void;
  selectedStudentEmail: string;
  onSelectStudent: (name: string, email: string) => void;
  fnhClients: FnhClient[];
  voiceStudents: VoiceStudent[];
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 flex flex-col lg:flex-row gap-3 lg:items-end">
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Session type
        </label>
        <Select value={kind} onValueChange={(v) => onKindChange(v as SessionKind)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fnh" className="gap-2">
              <User size={14} /> FNH clinical
            </SelectItem>
            <SelectItem value="voice">
              <Music size={14} /> Voice / piano
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          {kind === "fnh" ? "Event type" : "Lesson length"}
        </label>
        <Select
          value={kind === "fnh" ? fnhEventType : voiceEventType}
          onValueChange={kind === "fnh" ? onFnhEventType : onVoiceEventType}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {kind === "fnh"
              ? CALCOM_CONFIG.EVENT_TYPES.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))
              : VOICE_EVENT_TYPES.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.label}
                  </SelectItem>
                ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5 flex-[1.5] min-w-0">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          {kind === "fnh" ? "Client" : "Student"}
        </label>
        {kind === "fnh" ? (
          <Select value={selectedClientId} onValueChange={onSelectedClientId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a client" />
            </SelectTrigger>
            <SelectContent>
              {fnhClients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name || "Unnamed client"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Select
            value={selectedStudentEmail}
            onValueChange={(email) => {
              const s = voiceStudents.find((st) => st.email === email);
              onSelectStudent(s?.name || email, email);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a student" />
            </SelectTrigger>
            <SelectContent>
              {voiceStudents.map((s) =>
                s.email ? (
                  <SelectItem key={s.email} value={s.email}>
                    {s.name || s.email}
                  </SelectItem>
                ) : null
              )}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: BookingProposal["status"] }) {
  if (status === "confirmed")
    return (
      <Badge className="bg-emerald-600/10 text-emerald-600 border-none" variant="outline">
        Confirmed
      </Badge>
    );
  if (status === "suggested")
    return (
      <Badge className="bg-sky-600/10 text-sky-600 border-none" variant="outline">
        Suggested
      </Badge>
    );
  return (
    <Badge className="bg-amber-600/10 text-amber-600 border-none" variant="outline">
      Proposed
    </Badge>
  );
}

function FortnightMockup({
  dateRange,
  totalFortnights,
  fortnightIndex,
  onPrev,
  onNext,
  slots,
  bookings,
  blockedDates,
  icloudEvents,
  stateFor,
  proposals,
  loading,
  error,
  onOpenDay,
  onOpenProposal,
}: {
  dateRange: Date[];
  totalFortnights: number;
  fortnightIndex: number;
  onPrev: () => void;
  onNext: () => void;
  slots: Record<string, SlotInfo[]>;
  bookings: Record<string, BookingInfo[]>;
  blockedDates: string[];
  icloudEvents: IcloudCalendarEvent[];
  stateFor: (d: Date) => DayState;
  proposals: BookingProposal[];
  loading: boolean;
  error: string | null;
  onOpenDay: (d: Date) => void;
  onOpenProposal: (p: BookingProposal) => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="animate-spin mr-2" size={18} /> Loading timetable…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-sm">
        <AlertTriangle size={16} className="shrink-0 mt-0.5" /> {error}
      </div>
    );
  }

  const weeks = dateRange.length
    ? [dateRange.slice(0, 7), dateRange.slice(7, 14)]
    : [];
  const weekdayLabel = (d: Date) => format(d, "EEE");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrev}
          disabled={fortnightIndex <= 0}
          className="gap-1.5"
        >
          <ChevronLeft size={14} /> Previous
        </Button>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
          Fortnight {fortnightIndex + 1} of {totalFortnights}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={fortnightIndex >= totalFortnights - 1}
          className="gap-1.5"
        >
          Next <ChevronRight size={14} />
        </Button>
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
              Week {wi + 1} — {format(week[0], "d MMM")} to {format(week[6], "d MMM yyyy")}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {week.map((d) => (
              <DayCell
                key={d.toISOString()}
                date={d}
                state={stateFor(d)}
                slots={slots[zonedDateKey(d)] || []}
                bookings={bookings[zonedDateKey(d)] || []}
                proposals={proposals.filter((p) => isSameDay(new Date(p.slot_start), d))}
                icloudEvents={icloudEvents.filter((ev) => {
                  if (!ev.start || ev.transparent) return false;
                  const s = new Date(ev.start);
                  const e = ev.end ? new Date(ev.end) : s;
                  return (
                    isSameDay(s, d) ||
                    isSameDay(e, d) ||
                    (s < endOfDay(d) && e > startOfDay(d))
                  );
                })}
                blocked={blockedDates.includes(zonedDateKey(d))}
                weekdayLabel={weekdayLabel}
                onOpenDay={onOpenDay}
                onOpenProposal={onOpenProposal}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function DayCell({
  date,
  state,
  slots,
  bookings,
  proposals,
  icloudEvents,
  blocked,
  weekdayLabel,
  onOpenDay,
  onOpenProposal,
}: {
  date: Date;
  state: DayState;
  slots: SlotInfo[];
  bookings: BookingInfo[];
  proposals: BookingProposal[];
  icloudEvents: IcloudCalendarEvent[];
  blocked: boolean;
  weekdayLabel: (d: Date) => string;
  onOpenDay: (d: Date) => void;
  onOpenProposal: (p: BookingProposal) => void;
}) {
  const isPast = differenceInMinutes(date, new Date()) < -1;
  const isOpen = state === DayState.OPEN;

  return (
    <div
      onClick={() => onOpenDay(date)}
      className={cn(
        "rounded-xl border p-2.5 min-h-[140px] flex flex-col transition-all",
        state === DayState.BLOCKED && "bg-muted/40 border-border/60 opacity-70 cursor-default",
        state === DayState.OPEN && "bg-card border-border hover:border-chart-primary/50 cursor-pointer",
        state === DayState.BOOKED && "bg-rose-50/50 border-rose-200/70 cursor-default",
        state === DayState.EMPTY && "bg-muted/20 border-border/40 cursor-default",
        isPast && "opacity-45"
      )}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {weekdayLabel(date)}
          </p>
          <p className="text-sm font-bold text-foreground leading-tight">{format(date, "d")}</p>
        </div>
        <StateDot state={state} />
      </div>

      <div className="flex-1 space-y-1 overflow-hidden">
        {blocked && (
          <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
            <Ban size={9} /> Blocked
          </div>
        )}

        {bookings.slice(0, 2).map((b, i) => (
          <div
            key={b.uid || b.id || i}
            className="text-[9px] font-semibold bg-rose-600 text-primary-foreground rounded-md px-1.5 py-0.5 truncate"
          >
            {b.attendeeName || b.title || "Booked"}
          </div>
        ))}
        {bookings.length > 2 && (
          <div className="text-[9px] font-bold text-rose-600 pl-0.5">+{bookings.length - 2} more</div>
        )}

        {icloudEvents.slice(0, 2).map((ev) => (
          <div
            key={ev.id}
            title={ev.summary || "Busy"}
            className="text-[9px] font-medium bg-violet-500/10 text-violet-700 border border-violet-200/60 rounded-md px-1.5 py-0.5 truncate"
          >
            {ev.summary || "Busy"}
          </div>
        ))}
        {icloudEvents.length > 2 && (
          <div className="text-[9px] font-bold text-violet-600 pl-0.5">
            +{icloudEvents.length - 2} more
          </div>
        )}

        {proposals.map((p) => (
          <button
            key={p.id}
            onClick={(e) => {
              e.stopPropagation();
              onOpenProposal(p);
            }}
            className={cn(
              "w-full text-left text-[9px] font-semibold rounded-md px-1.5 py-0.5 truncate border",
              p.status === "confirmed" &&
                "bg-emerald-600 text-primary-foreground border-emerald-700",
              p.status === "suggested" && "bg-sky-600 text-primary-foreground border-sky-700",
              p.status === "proposed" &&
                "bg-amber-500 text-primary-foreground border-amber-600"
            )}
          >
            {p.kind === "fnh"
              ? "Proposed FNH"
              : `Proposed · ${p.student_name || "student"}`}
          </button>
        ))}

        {!blocked && isOpen && (
          <div className="text-[9px] font-semibold text-chart-primary">
            {slots.length} open slots
          </div>
        )}
        {!isOpen && state === DayState.EMPTY && (
          <div className="text-[9px] text-muted-foreground/50 font-medium">No availability</div>
        )}
      </div>
    </div>
  );
}

function StateDot({ state }: { state: DayState }) {
  if (state === DayState.BLOCKED)
    return <Ban size={11} className="text-muted-foreground" />;
  if (state === DayState.BOOKED) return <CheckCircle2 size={11} className="text-rose-500" />;
  if (state === DayState.OPEN) return <Circle size={11} className="text-chart-primary" />;
  return <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />;
}

function ForecastPlot({
  data,
  proposals,
  loading,
  error,
}: {
  data: { label: string; open: number; booked: number; blocked: number }[];
  proposals: BookingProposal[];
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="animate-spin mr-2" size={18} /> Building forecast…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-sm">
        <AlertTriangle size={16} className="shrink-0 mt-0.5" /> {error}
      </div>
    );
  }

  const proposed = proposals.filter((p) => p.status === "proposed").length;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <p className="text-xs font-bold text-foreground">Potential load over the next {data.length} weeks</p>
          <Badge className="bg-amber-500/10 text-amber-600 border-none" variant="outline">
            {proposed} proposed
          </Badge>
        </div>
        <p className="text-[10px] text-muted-foreground font-medium mb-4">
          Open slots per week vs. confirmed bookings and blocked days from your availability.
        </p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="open" name="Open" stackId="a" fill="hsl(var(--chart-primary))" radius={[0, 0, 0, 0]} />
              <Bar dataKey="booked" name="Booked" stackId="a" fill="hsl(var(--chart-destructive))" />
              <Bar dataKey="blocked" name="Blocked" stackId="b" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs font-bold text-foreground mb-3">Weekly breakdown</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {data.map((w) => (
            <div key={w.label} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{w.label}</span>
              <span className="text-[10px] font-semibold text-chart-primary">{w.open} open</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LegendRow() {
  return (
    <div className="flex flex-wrap items-center gap-4 px-1 text-[10px] font-semibold text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <Circle size={11} className="text-chart-primary" /> Open
      </span>
      <span className="flex items-center gap-1.5">
        <CheckCircle2 size={11} className="text-rose-500" /> Booked
      </span>
      <span className="flex items-center gap-1.5">
        <Ban size={11} className="text-muted-foreground" /> Blocked
      </span>
      <span className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-muted-foreground/30" /> No availability
      </span>
      <span className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Proposed
      </span>
      <span className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-sm bg-emerald-600" /> Confirmed
      </span>
    </div>
  );
}

export default TimetablePage;
