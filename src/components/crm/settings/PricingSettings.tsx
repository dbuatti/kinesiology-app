import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DollarSign, RefreshCw, Save, Clock, Info, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { EventPricing } from "@/hooks/useEventPricing";

interface DraftRow extends EventPricing {}

// Only show real bookable services — filters out the generic Cal.com event types
// (15 Min Meeting, Secret Meeting, IT 1:1, etc.) that get pulled in by Sync.
const isRealService = (slug?: string | null, label?: string | null) =>
  /voice|piano|fnh|neuro|kinesi/i.test(`${slug ?? ""} ${label ?? ""}`);

const PricingSettings = () => {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["event-pricing"],
    queryFn: async (): Promise<EventPricing[]> => {
      const { data, error } = await supabase
        .from("event_pricing")
        .select("*")
        .order("label", { ascending: true });
      if (error) throw error;
      return (data || []) as EventPricing[];
    },
  });

  useEffect(() => {
    if (data) setRows(data.filter((r) => isRealService(r.slug, r.label)).map((r) => ({ ...r })));
  }, [data]);

  const updateRow = (id: number, patch: Partial<DraftRow>) => {
    setRows((prev) => prev.map((r) => (r.calcom_event_type_id === id ? { ...r, ...patch } : r)));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = rows.map((r) => ({
        calcom_event_type_id: r.calcom_event_type_id,
        slug: r.slug,
        label: r.label,
        duration_minutes: r.duration_minutes,
        price: Number(r.price) || 0,
        currency: r.currency || "aud",
        send_payment_link: r.send_payment_link,
        active: r.active,
        updated_at: new Date().toISOString(),
      }));
      const { error } = await supabase
        .from("event_pricing")
        .upsert(payload, { onConflict: "calcom_event_type_id" });
      if (error) throw error;
      showSuccess("Appointment prices saved.");
      queryClient.invalidateQueries({ queryKey: ["event-pricing"] });
    } catch (err: any) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("list-calcom-event-types");
      if (error) throw error;
      const eventTypes: any[] = result?.eventTypes || [];
      const existingIds = new Set(rows.map((r) => r.calcom_event_type_id));
      const newRows: DraftRow[] = eventTypes
        .filter((et) => et.id && !existingIds.has(et.id) && isRealService(et.slug, et.title))
        .map((et) => ({
          calcom_event_type_id: et.id,
          slug: et.slug ?? null,
          label: et.title || et.slug || `Event ${et.id}`,
          duration_minutes: et.lengthInMinutes ?? null,
          // "free"/"community" appointments default to no payment link & $0.
          price: 0,
          currency: "aud",
          send_payment_link: !/free|community/i.test(`${et.slug} ${et.title}`),
          active: true,
        }));
      if (newRows.length === 0) {
        showSuccess("Already up to date — no new appointments found.");
      } else {
        setRows((prev) => [...prev, ...newRows].sort((a, b) => a.label.localeCompare(b.label)));
        showSuccess(`Added ${newRows.length} appointment${newRows.length > 1 ? "s" : ""}. Set prices and Save.`);
      }
    } catch (err: any) {
      showError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card className="border-2 border-emerald-100 dark:border-emerald-900/30 shadow-xl rounded-[2.5rem] bg-card overflow-hidden">
      <CardHeader className="p-8 pb-4 bg-emerald-50/50 dark:bg-emerald-950/10">
        <CardTitle className="text-xl font-black flex items-center gap-3 text-emerald-900 dark:text-emerald-200">
          <DollarSign size={24} /> Appointment Pricing
        </CardTitle>
        <CardDescription className="text-emerald-700 dark:text-emerald-300/80 font-medium">
          Set the price for each Cal.com appointment. Used by the booking dialogs and the
          automatic “Pay Now” email sent to clients who book via your embedded Cal.com.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8 pt-6 space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" /> Loading prices…
          </p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No appointments yet. Click <strong>Sync from Cal.com</strong> to pull them in.
          </p>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <div
                key={r.calcom_event_type_id}
                className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-3xl border border-border bg-muted/30"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-foreground truncate">{r.label}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    {r.duration_minutes ? (
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {r.duration_minutes} min
                      </span>
                    ) : null}
                    {r.slug ? <span className="truncate">/{r.slug}</span> : null}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-muted-foreground">$</span>
                  <Input
                    type="number"
                    min={0}
                    step="1"
                    value={r.price}
                    onChange={(e) => updateRow(r.calcom_event_type_id, { price: e.target.value as any })}
                    className="w-24 rounded-xl font-bold"
                  />
                  <span className="text-xs font-semibold uppercase text-muted-foreground">
                    {r.currency}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={r.send_payment_link}
                    onCheckedChange={(v) => updateRow(r.calcom_event_type_id, { send_payment_link: v })}
                  />
                  <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                    Send Pay link
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-100 dark:border-amber-900/30 flex gap-2">
          <Info size={15} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-200 font-medium">
            Turn <strong>Send Pay link</strong> off for free/community appointments — they’ll still
            book and sync to your calendar, but no payment email is sent.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button onClick={handleSave} disabled={saving} className="rounded-xl font-bold">
            <Save size={16} className="mr-2" />
            {saving ? "Saving…" : "Save Prices"}
          </Button>
          <Button
            onClick={handleSync}
            disabled={syncing}
            variant="outline"
            className="rounded-xl font-bold"
          >
            <RefreshCw size={16} className={`mr-2 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing…" : "Sync from Cal.com"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PricingSettings;
