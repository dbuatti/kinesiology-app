"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation"; // ← fixed for Next.js App Router
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2, Trash2, Printer, Copy, Check, Play, Brain,
  PanelRightOpen, PanelRightClose, ClipboardList,
} from "lucide-react";
import { format, isToday } from "date-fns";
import { AppointmentWithClient } from "@/types/crm";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";
import EditableField from "@/components/shared/EditableField";
import SessionTimer from "@/components/crm/SessionTimer";
import AppLayout from "@/components/crm/AppLayout";
import SessionContentSwitcher from "@/components/crm/SessionContentSwitcher";
import PreviousSessionInsightsBar from "@/components/crm/PreviousSessionInsightsBar";
import AppointmentHeader from "@/components/crm/AppointmentHeader";
import AppointmentContextCards from "@/components/crm/AppointmentContextCards";
import BrainstemToneMap from "@/components/crm/BrainstemToneMap";
import SessionWorksheetTemplate from "@/components/crm/SessionWorksheetTemplate";
import PathwayFindingsList from "@/components/crm/PathwayFindingsList";
import WeeklyFocusBanner from "@/components/crm/WeeklyFocusBanner";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TCM_CHANNELS } from "@/data/tcm-channel-data";
import { generateSessionSummary } from "@/utils/summary-generator";
import { Nuclei } from "@/utils/brainstem-logic";

const AppointmentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [appointment, setAppointment] = useState<AppointmentWithClient | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fixedHeader, setFixedHeader] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [now, setNow] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedNucleus, setSelectedNucleus] = useState<Nuclei | null>(null);

  // ── Live clock for meridian ───────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const currentPeakMeridian = useMemo(() => {
    const h = now.getHours();
    return TCM_CHANNELS.find(c => {
      if (c.peakTime === 'None') return false;
      const [startStr, endStr] = c.peakTime.toLowerCase().split('-').map(s => s.trim());
      const parse = (s: string) => {
        let hr = parseInt(s);
        if (s.includes('pm') && hr !== 12) hr += 12;
        if (s.includes('am') && hr === 12) hr = 0;
        return hr;
      };
      const start = parse(startStr);
      const end = parse(endStr);
      return start > end ? (h >= start || h < end) : (h >= start && h < end);
    }) ?? null;
  }, [now]);

  // ── Data fetching ─────────────────────────────────────────────────────────
  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, clients!inner(id, name, born)')
        .eq('id', id)
        .single();

      if (error) throw error;

      const appt = { ...data, date: new Date(data.date) } as AppointmentWithClient;
      setAppointment(appt);

      const { data: hist } = await supabase
        .from('appointments')
        .select('*')
        .eq('client_id', appt.clients.id)
        .order('date', { ascending: true });

      setHistory((hist ?? []).map(h => ({ ...h, date: new Date(h.date) })));
    } catch (err) {
      console.error(err);
      showError("Could not load session data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id]);

  // Real-time updates
  useEffect(() => {
    if (!id) return;
    const ch = supabase
      .channel(`appt-detail-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'appointments', filter: `id=eq.${id}` },
        payload => {
          setAppointment(prev => {
            if (!prev) return null;
            const next = { ...payload.new };
            if (typeof next.date === 'string') next.date = new Date(next.date);
            return { ...prev, ...next } as AppointmentWithClient;
          });
        })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [id]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const save = async (field: string, value: any) => {
    if (!id || !appointment) return;
    const val = Array.isArray(value) ? value : (typeof value === 'string' ? (value.trim() || null) : value);

    try {
      const { error } = await supabase.from('appointments').update({ [field]: val }).eq('id', id);
      if (error) throw error;
      setAppointment(p => p ? { ...p, [field]: val } as any : null);
    } catch (err) {
      console.error(err);
      showError(`Could not save ${field}`);
    }
  };

  const startSession = async () => {
    if (!appointment) return;
    await save('date', new Date().toISOString());
    showSuccess("Session started");
  };

  const completeSession = async () => {
    await save('status', 'Completed');
    showSuccess("Session completed");
  };

  const copySummary = () => {
    if (!appointment) return;
    navigator.clipboard.writeText(generateSessionSummary(appointment));
    setCopied(true);
    showSuccess("Summary copied");
    setTimeout(() => setCopied(false), 2400);
  };

  const print = () => window.print();

  if (loading) {
    return (
      <div className="min-h-[80vh] grid place-items-center">
        <Loader2 className="h-14 w-14 animate-spin text-violet-500/70" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-[80vh] grid place-items-center text-muted-foreground">
        Session not found
      </div>
    );
  }

  const today = isToday(appointment.date);
  const canStart = today && appointment.status === 'Scheduled' && !fixedHeader;

  return (
    <>
      <SessionTimer
        appointmentDate={appointment.date}
        status={appointment.status}
        onFixedHeaderChange={setFixedHeader}
        onCompleteSession={completeSession}
      />

      <AppLayout variant="wide" hasFixedHeader={fixedHeader}>
        <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8 pb-20 print:p-0 print:max-w-none">
          {/* ── Top bar ──────────────────────────────────────────────────────── */}
          <div className="sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-4 pb-6 bg-gradient-to-b from-background/80 to-background/40 backdrop-blur-xl border-b print:hidden">
            <div className="flex items-center justify-between gap-4">
              <Breadcrumbs
                items={[
                  { label: "Sessions", path: "/appointments" },
                  { label: appointment.clients?.name || "Session" }
                ]}
              />

              <div className="flex items-center gap-3">
                {canStart && (
                  <Button
                    onClick={startSession}
                    className={cn(
                      "bg-gradient-to-r from-rose-500 to-rose-600",
                      "hover:from-rose-600 hover:to-rose-700",
                      "shadow-lg shadow-rose-500/20",
                      "rounded-full px-6 h-10 font-semibold tracking-tight"
                    )}
                  >
                    <Play className="mr-2 h-4 w-4 fill-current" />
                    Begin Session
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full border-muted-foreground/30"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  {sidebarOpen ? <PanelRightClose /> : <PanelRightOpen />}
                </Button>
              </div>
            </div>
          </div>

          {/* ── Weekly banner + history bar ─────────────────────────────────── */}
          <div className="pt-10 print:pt-0 space-y-8">
            <WeeklyFocusBanner
              appointmentId={appointment.id}
              priorityPattern={appointment.priority_pattern}
              onSaveField={save}
            />

            <PreviousSessionInsightsBar
              clientId={appointment.clients.id}
              currentAppointmentId={appointment.id}
            />
          </div>

          {/* ── Main content ────────────────────────────────────────────────── */}
          <div className="mt-10 grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* Left / Main area */}
            <div className={cn(
              "col-span-full transition-all duration-500 ease-out",
              sidebarOpen && "xl:col-span-8"
            )}>
              <div className="space-y-8">
                {/* Header Card */}
                <Card className={cn(
                  "border-none shadow-xl rounded-3xl overflow-hidden",
                  "bg-gradient-to-b from-white to-slate-50/60",
                  "backdrop-blur-sm"
                )}>
                  <AppointmentHeader
                    appointment={appointment}
                    onSaveField={save}
                    onUpdate={loadData}
                  />

                  <CardContent className="p-8 pt-2 grid md:grid-cols-2 gap-8">
                    <EditableField
                      field="goal"
                      label="Intention for this session"
                      value={appointment.goal ?? ""}
                      placeholder="What is the highest outcome you are holding for this balance?"
                      onSave={save}
                      className="min-h-[140px] rounded-2xl bg-white/60 backdrop-blur-sm border border-slate-200/60 shadow-sm focus-within:shadow-md transition-shadow"
                    />

                    <EditableField
                      field="issue"
                      label="Primary Concern"
                      value={appointment.issue ?? ""}
                      placeholder="What is asking for attention today?"
                      onSave={save}
                      className="min-h-[140px] rounded-2xl bg-white/60 backdrop-blur-sm border border-slate-200/60 shadow-sm focus-within:shadow-md transition-shadow"
                    />
                  </CardContent>
                </Card>

                {/* Content sections */}
                <div className="print:hidden">
                  <SessionContentSwitcher
                    appointment={appointment}
                    onUpdate={loadData}
                    saveField={save}
                    history={history}
                    nucleiFilter={selectedNucleus}
                    showSidebar={sidebarOpen}
                    onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                    onClonePrevious={() => {/* ... */}}
                    onPrint={print}
                    onCopySummary={copySummary}
                    onDelete={() => {/* ... */}}
                    onStartSession={startSession}
                    isCloning={cloning}
                    isCopied={copied}
                  />
                </div>
              </div>
            </div>

            {/* ── Right Sidebar ─────────────────────────────────────────────── */}
            {sidebarOpen && (
              <div className={cn(
                "col-span-full xl:col-span-4 space-y-8",
                "animate-in slide-in-from-right-6 fade-in duration-500",
                "print:hidden"
              )}>
                {/* Brainstem Map */}
                <div className="space-y-5">
                  <div className="flex items-center gap-3 px-1">
                    <Brain className="h-5 w-5 text-violet-600" />
                    <h3 className="text-sm font-semibold tracking-tight text-muted-foreground uppercase">
                      Brainstem Tone
                    </h3>
                  </div>
                  <BrainstemToneMap
                    priorityPattern={appointment.priority_pattern}
                    activeFilter={selectedNucleus}
                    onSelectNuclei={setSelectedNucleus}
                  />
                </div>

                <AppointmentContextCards
                  appointment={appointment}
                  currentPeakMeridian={currentPeakMeridian}
                  onSaveField={save}
                />

                {/* Live Summary Card */}
                <Card className={cn(
                  "rounded-3xl border-none shadow-lg",
                  "bg-gradient-to-b from-white/80 to-slate-50/40 backdrop-blur-md"
                )}>
                  <CardHeader className="pb-3 border-b border-slate-100/60">
                    <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2 text-muted-foreground">
                      <ClipboardList className="h-4 w-4 text-violet-600" />
                      Live Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6 text-sm">
                    <div className="space-y-4">
                      {[
                        { label: "BOLT", value: appointment.bolt_score ? `${appointment.bolt_score}s` : '—', color: "indigo" },
                        { label: "Coherence", value: appointment.coherence_score?.toFixed(2) ?? '—', color: "rose" },
                        {
                          label: "Hydration",
                          value: (
                            <Badge variant="outline" className={cn(
                              "text-[10px] font-bold px-3 py-0.5",
                              appointment.hydrated ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                            )}>
                              {appointment.hydrated ? "Optimal" : "Needs support"}
                            </Badge>
                          ),
                          color: ""
                        },
                      ].map(item => (
                        <div key={item.label} className="flex justify-between items-center">
                          <span className="text-muted-foreground font-medium">{item.label}</span>
                          <span className={cn("font-semibold", item.color && `text-${item.color}-600`)}>
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-slate-100/60">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                        Pathway Patterns
                      </p>
                      <PathwayFindingsList priorityPattern={appointment.priority_pattern} />
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full rounded-xl h-10 text-xs font-semibold tracking-wide"
                      onClick={copySummary}
                    >
                      {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                      {copied ? "Copied" : "Copy Full Summary"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* ── PRINT ONLY CONTENT ───────────────────────────────────────────── */}
          <div className="hidden print:block mt-12 space-y-10">
            {/* Header */}
            <div className="border-b-2 border-violet-800 pb-6 mb-10">
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-4xl font-bold text-slate-900">Session Summary</h1>
                  <p className="mt-1 text-slate-600 font-medium">Antigravity Kinesiology</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-violet-800">{format(appointment.date, "MMMM d, yyyy")}</p>
                  <p className="text-sm text-slate-500 mt-1">ID: {appointment.display_id || id?.slice(0,8)}</p>
                </div>
              </div>
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-2 gap-8">
              <div className="p-6 border rounded-xl">
                <h3 className="text-sm uppercase tracking-wider text-slate-500 font-semibold mb-5">Key Metrics</h3>
                <dl className="space-y-4">
                  <div className="flex justify-between">
                    <dt className="text-slate-600">BOLT Score</dt>
                    <dd className="font-bold text-indigo-700">{appointment.bolt_score ? `${appointment.bolt_score}s` : '—'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-600">Coherence</dt>
                    <dd className="font-bold text-rose-600">{appointment.coherence_score?.toFixed(2) ?? '—'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-600">Hydration</dt>
                    <dd className={cn(
                      "font-bold",
                      appointment.hydrated ? "text-emerald-600" : "text-rose-600"
                    )}>
                      {appointment.hydrated ? "Optimal" : "Attention needed"}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="p-6 border rounded-xl">
                <h3 className="text-sm uppercase tracking-wider text-slate-500 font-semibold mb-5">Acupoints</h3>
                <p className="whitespace-pre-line leading-relaxed">
                  {appointment.acupoints || "No points recorded."}
                </p>
              </div>
            </div>

            {/* Findings & Notes */}
            <div className="space-y-10">
              <div>
                <h3 className="text-lg font-semibold mb-4">Findings & Corrections</h3>
                <div className="p-6 border rounded-xl space-y-6">
                  <div>
                    <h4 className="font-medium text-violet-700 mb-2">Primary Patterns</h4>
                    <PathwayFindingsList priorityPattern={appointment.priority_pattern} showOnlyInhibited={false} />
                  </div>
                  <div>
                    <h4 className="font-medium text-violet-700 mb-2">Corrections & Modes</h4>
                    <p className="whitespace-pre-line text-slate-700 leading-relaxed">
                      {appointment.modes_balances || "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Practitioner Notes & Recommendations</h3>
                <div className="p-6 bg-violet-50/40 border border-violet-100 rounded-xl">
                  <p className="whitespace-pre-line leading-relaxed text-slate-800">
                    {appointment.session_north_star || appointment.notes || "No notes recorded."}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-16 text-center text-sm text-slate-400 italic">
              In service of your highest healing path • Thank you for your presence
            </div>
          </div>

          {/* Hidden worksheet for print / export */}
          <SessionWorksheetTemplate
            clientName={appointment.clients.name}
            date={appointment.date}
          />
        </div>
      </AppLayout>
    </>
  );
};

export default AppointmentDetailPage;