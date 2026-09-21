import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import {
  CampaignConfig, DEFAULT_CAMPAIGN_CONFIG, CampaignSegment,
  computeCampaignAudience, proposeRecurringSlot, computeFirstRegularDate,
  SEGMENT_LABELS, SEGMENT_TEMPLATE_PROMPT,
} from "@/lib/launchCampaign";
import { DraftEmail } from "@/types/assistant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DraftEmailCard from "@/components/assistant/DraftEmailCard";
import { Loader2, RefreshCw, Plus, X, Sparkles, Mic, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const STATUS_OPTIONS = ["drafted", "sent", "replied", "bridge_booked", "regular_locked"] as const;
type EntryStatus = typeof STATUS_OPTIONS[number];

interface Entry {
  id: string;
  campaign_id: string;
  client_id: string | null;
  voice_student_email: string | null;
  voice_student_name: string | null;
  client_name: string;
  segment: CampaignSegment;
  excluded: boolean;
  proposed_slot: string | null;
  first_regular_date: string | null;
  status: EntryStatus;
  notes: string | null;
}

function DayPicker({ value, onChange }: { value: number[]; onChange: (v: number[]) => void }) {
  return (
    <div className="flex gap-1">
      {DAY_NAMES.map((label, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(value.includes(i) ? value.filter((d) => d !== i) : [...value, i])}
          className={cn(
            "h-7 w-9 rounded-md text-[11px] font-bold border transition-colors",
            value.includes(i) ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// Config + tracker built first per Daniele's own note ("build the config +
// tracker first; add drafting second") — drafting was added in the same pass
// but always through the same draft-then-review pattern as everywhere else
// in this app (DraftEmailCard, never an automatic send).
export default function LaunchCampaignTab() {
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [config, setConfig] = useState<CampaignConfig>(DEFAULT_CAMPAIGN_CONFIG);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAudience, setLoadingAudience] = useState(false);
  const [draftingFor, setDraftingFor] = useState<string | null>(null);
  const [pendingDrafts, setPendingDrafts] = useState<Record<string, DraftEmail>>({});
  const [savingConfig, setSavingConfig] = useState(false);

  const loadEntries = useCallback(async (cid: string) => {
    const { data } = await supabase.from("launch_campaign_entries").select("*").eq("campaign_id", cid).order("client_name");
    setEntries((data || []) as Entry[]);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data: existing } = await supabase.from("launch_campaigns").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (existing) {
        setCampaignId(existing.id);
        setConfig({ ...DEFAULT_CAMPAIGN_CONFIG, ...(existing.config || {}) });
        await loadEntries(existing.id);
      } else {
        // Persist the defaults immediately rather than waiting for the user to
        // touch a field first — the day-picker already shows them as selected,
        // so "Load audience" should work right away, not silently no-op.
        const { data, error } = await supabase.from("launch_campaigns").insert({ user_id: user.id, config: DEFAULT_CAMPAIGN_CONFIG }).select("id").single();
        if (!error && data) setCampaignId(data.id);
      }
      setLoading(false);
    })();
  }, [loadEntries]);

  const saveConfig = async (next: CampaignConfig) => {
    setConfig(next);
    setSavingConfig(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      if (campaignId) {
        await supabase.from("launch_campaigns").update({ config: next, updated_at: new Date().toISOString() }).eq("id", campaignId);
      } else {
        const { data, error } = await supabase.from("launch_campaigns").insert({ user_id: user.id, config: next }).select("id").single();
        if (error) throw error;
        setCampaignId(data.id);
      }
    } catch (err: any) {
      showError(err.message || "Couldn't save campaign config.");
    } finally {
      setSavingConfig(false);
    }
  };

  const addBlackout = () => saveConfig({ ...config, blackoutRanges: [...config.blackoutRanges, { start: "", end: "" }] });
  const updateBlackout = (i: number, patch: Partial<{ start: string; end: string }>) => {
    const next = config.blackoutRanges.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    saveConfig({ ...config, blackoutRanges: next });
  };
  const removeBlackout = (i: number) => saveConfig({ ...config, blackoutRanges: config.blackoutRanges.filter((_, idx) => idx !== i) });

  const loadAudience = async () => {
    if (!campaignId) { showError("Set the campaign dates first."); return; }
    setLoadingAudience(true);
    try {
      const audience = await computeCampaignAudience();
      const existingKeys = new Set(entries.map((e) => e.client_id || `voice:${e.voice_student_email}`));
      const toInsert = audience
        .filter((m) => !existingKeys.has(m.clientId || `voice:${m.voiceStudentEmail}`))
        .map((m) => {
          const slot = proposeRecurringSlot(m.pattern, config.regularDays);
          const firstDate = computeFirstRegularDate(config.regularStart, config.regularDays, config.blackoutRanges);
          return {
            campaign_id: campaignId,
            client_id: m.clientId,
            voice_student_email: m.voiceStudentEmail,
            voice_student_name: m.voiceStudentEmail ? m.clientName : null,
            client_name: m.clientName,
            segment: m.segment,
            proposed_slot: slot.label,
            first_regular_date: firstDate,
            status: "drafted" as const,
          };
        });
      if (toInsert.length > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from("launch_campaign_entries").insert(toInsert.map((r) => ({ ...r, user_id: user?.id })));
        if (error) throw error;
      }
      await loadEntries(campaignId);
      showSuccess(`Audience loaded — ${toInsert.length} new, ${existingKeys.size} already tracked.`);
    } catch (err: any) {
      showError(err.message || "Couldn't load the audience.");
    } finally {
      setLoadingAudience(false);
    }
  };

  const updateEntry = async (id: string, patch: Partial<Entry>) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    await supabase.from("launch_campaign_entries").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
  };

  const draftMessage = async (entry: Entry) => {
    setDraftingFor(entry.id);
    try {
      const firstName = entry.client_name.split(" ")[0];
      const template = SEGMENT_TEMPLATE_PROMPT[entry.segment]
        .replace("{firstName}", firstName)
        .replace("{proposedSlot}", entry.proposed_slot || "a slot to be confirmed")
        .replace("{firstRegularDate}", entry.first_regular_date || "to be confirmed");
      const { data, error } = await supabase.functions.invoke("assistant-chat", {
        body: {
          conversation_id: null,
          client_id: entry.voice_student_email ? null : entry.client_id,
          voice_student_email: entry.voice_student_email,
          voice_student_name: entry.voice_student_name,
          message: `Draft ${template}.`,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data.draft_email) throw new Error("The assistant didn't produce a draft — try again.");
      setPendingDrafts((prev) => ({ ...prev, [entry.id]: data.draft_email }));
    } catch (err: any) {
      showError(err.message || "Couldn't draft that message.");
    } finally {
      setDraftingFor(null);
    }
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading campaign...</div>;
  }

  const bySegment = (seg: CampaignSegment) => entries.filter((e) => e.segment === seg && !e.excluded);
  const excludedCount = entries.filter((e) => e.excluded).length;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-6">
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <h3 className="text-sm font-bold text-foreground">Campaign config</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Bridge window</p>
            <DayPicker value={config.bridgeDays} onChange={(v) => saveConfig({ ...config, bridgeDays: v })} />
            <div className="flex gap-2">
              <Input type="date" value={config.bridgeStart} onChange={(e) => saveConfig({ ...config, bridgeStart: e.target.value })} className="h-8 text-xs" />
              <Input type="date" value={config.bridgeEnd} onChange={(e) => saveConfig({ ...config, bridgeEnd: e.target.value })} className="h-8 text-xs" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Regular days + start</p>
            <DayPicker value={config.regularDays} onChange={(v) => saveConfig({ ...config, regularDays: v })} />
            <Input type="date" value={config.regularStart} onChange={(e) => saveConfig({ ...config, regularStart: e.target.value })} className="h-8 text-xs w-40" />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Blackout ranges</p>
          {config.blackoutRanges.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input type="date" value={r.start} onChange={(e) => updateBlackout(i, { start: e.target.value })} className="h-8 text-xs" />
              <span className="text-xs text-muted-foreground">to</span>
              <Input type="date" value={r.end} onChange={(e) => updateBlackout(i, { end: e.target.value })} className="h-8 text-xs" />
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeBlackout(i)}><X className="h-3.5 w-3.5" /></Button>
            </div>
          ))}
          <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1" onClick={addBlackout}><Plus className="h-3 w-3" /> Add blackout range</Button>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Button size="sm" onClick={loadAudience} disabled={loadingAudience || !campaignId} className="gap-1.5">
            {loadingAudience ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Load audience from Follow-up data
          </Button>
          {savingConfig && <span className="text-[11px] text-muted-foreground">Saving...</span>}
          {excludedCount > 0 && <span className="text-[11px] text-muted-foreground">{excludedCount} excluded</span>}
        </div>
      </div>

      {(["active", "cancelled_no_rebook", "one_lesson_only"] as CampaignSegment[]).map((seg) => {
        const rows = bySegment(seg);
        if (rows.length === 0) return null;
        return (
          <div key={seg} className="space-y-2">
            <h4 className="text-sm font-bold text-foreground">{SEGMENT_LABELS[seg]} <span className="text-muted-foreground font-normal">({rows.length})</span></h4>

            {/* Mobile: stacked cards, one field per row, full-width — the
                fixed-width table below (proposed slot / date / status /
                notes / draft columns each with their own min-width) adds up
                to well over a phone's viewport, forcing a sideways scroll
                just to reach the Draft button and card ("I can scroll to
                right for the draft" — real complaint, not intended). */}
            <div className="md:hidden space-y-3">
              {rows.map((e) => (
                <div key={e.id} className="rounded-xl border border-border p-3 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Checkbox checked={!e.excluded} onCheckedChange={(v) => updateEntry(e.id, { excluded: !v })} />
                    {e.voice_student_email ? <Mic className="h-3 w-3 text-chart-destructive shrink-0" /> : <Brain className="h-3 w-3 text-chart-purple shrink-0" />}
                    <span className="font-semibold text-foreground text-sm">{e.client_name}</span>
                  </div>
                  {/* Full-width, one per row — not a 2-column grid. On a
                      375px phone, the outer page padding (16px) + this
                      card's own padding (12px) + halving via grid-cols-2
                      left each input only ~130px wide ("so much wasted
                      space... it's in a card with padding and then more
                      padding" — real complaint: two paddings deep AND
                      split in half on top of that). */}
                  <div>
                    <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Proposed slot</label>
                    <Input value={e.proposed_slot || ""} onChange={(ev) => updateEntry(e.id, { proposed_slot: ev.target.value })} className="h-8 text-xs mt-1" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wide text-muted-foreground">First regular date</label>
                    <Input type="date" value={e.first_regular_date || ""} onChange={(ev) => updateEntry(e.id, { first_regular_date: ev.target.value })} className="h-8 text-xs mt-1" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Status</label>
                    <Select value={e.status} onValueChange={(v) => updateEntry(e.id, { status: v as EntryStatus })}>
                      <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s} className="text-xs">{s.replace(/_/g, " ")}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Notes</label>
                    <Textarea value={e.notes || ""} onChange={(ev) => updateEntry(e.id, { notes: ev.target.value })} rows={1} className="text-xs mt-1" />
                  </div>
                  <Button size="sm" variant="outline" className="h-8 text-xs gap-1 w-full" onClick={() => draftMessage(e)} disabled={draftingFor === e.id}>
                    {draftingFor === e.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Draft
                  </Button>
                  {pendingDrafts[e.id] && (
                    <DraftEmailCard
                      draft={pendingDrafts[e.id]}
                      onSent={() => { setPendingDrafts((prev) => { const n = { ...prev }; delete n[e.id]; return n; }); updateEntry(e.id, { status: "sent" }); }}
                      onDiscard={() => setPendingDrafts((prev) => { const n = { ...prev }; delete n[e.id]; return n; })}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="hidden md:block rounded-xl border border-border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr className="text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                    <th className="p-2 font-semibold">Client</th>
                    <th className="p-2 font-semibold">Proposed slot</th>
                    <th className="p-2 font-semibold">First regular date</th>
                    <th className="p-2 font-semibold">Status</th>
                    <th className="p-2 font-semibold">Notes</th>
                    <th className="p-2 font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {/* A single <tr> per row (not a keyed Fragment pair) — this
                      repo's Dyad dev tooling crashes on explicit
                      <Fragment key={...}>, and the bare <>...</> shorthand
                      can't carry a key at all, so two sibling <tr>s per
                      iteration isn't an option here. The draft card renders
                      inside this row's own last cell instead of a separate row. */}
                  {rows.map((e) => (
                    <tr key={e.id} className="border-t border-border">
                      <td className="p-2 font-semibold text-foreground align-top">
                        <div className="flex items-center gap-1.5">
                          <Checkbox checked={!e.excluded} onCheckedChange={(v) => updateEntry(e.id, { excluded: !v })} />
                          {e.voice_student_email ? <Mic className="h-3 w-3 text-chart-destructive shrink-0" /> : <Brain className="h-3 w-3 text-chart-purple shrink-0" />}
                          {e.client_name}
                        </div>
                      </td>
                      <td className="p-2 align-top">
                        <Input value={e.proposed_slot || ""} onChange={(ev) => updateEntry(e.id, { proposed_slot: ev.target.value })} className="h-7 text-[11px] w-36" />
                      </td>
                      <td className="p-2 align-top">
                        <Input type="date" value={e.first_regular_date || ""} onChange={(ev) => updateEntry(e.id, { first_regular_date: ev.target.value })} className="h-7 text-[11px] w-36" />
                      </td>
                      <td className="p-2 align-top">
                        <Select value={e.status} onValueChange={(v) => updateEntry(e.id, { status: v as EntryStatus })}>
                          <SelectTrigger className="h-7 text-[11px] w-32"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s} className="text-[11px]">{s.replace(/_/g, " ")}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2 align-top">
                        <Textarea value={e.notes || ""} onChange={(ev) => updateEntry(e.id, { notes: ev.target.value })} rows={1} className="text-[11px] w-40 min-h-7" />
                      </td>
                      <td className="p-2 align-top min-w-[220px]">
                        <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => draftMessage(e)} disabled={draftingFor === e.id}>
                          {draftingFor === e.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} Draft
                        </Button>
                        {pendingDrafts[e.id] && (
                          <div className="mt-2">
                            <DraftEmailCard
                              draft={pendingDrafts[e.id]}
                              onSent={() => { setPendingDrafts((prev) => { const n = { ...prev }; delete n[e.id]; return n; }); updateEntry(e.id, { status: "sent" }); }}
                              onDiscard={() => setPendingDrafts((prev) => { const n = { ...prev }; delete n[e.id]; return n; })}
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {entries.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Set your campaign dates above, then load the audience.</p>
      )}
    </div>
  );
}
