import { cn } from "@/lib/utils";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Loader2, Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

interface WebhookFailure {
  id: string;
  source: string;
  event_type: string | null;
  reference: string | null;
  amount: number | null;
  detail: string | null;
  created_at: string;
}

// Friendly label + category per webhook source, so a Stripe-payment issue and a
// Cal.com calendar-sync issue are clearly distinguished.
const SOURCE_META: Record<string, { label: string; kind: "payment" | "sync" }> = {
  "voice-stripe-webhook": { label: "Voice payment", kind: "payment" },
  "stripe-webhook": { label: "FNH payment", kind: "payment" },
  "calcom-voice-webhook": { label: "Voice sync", kind: "sync" },
  "calcom-webhook": { label: "FNH sync", kind: "sync" },
  "reconcile-calcom": { label: "Reconcile", kind: "sync" },
};
const metaFor = (s: string) => SOURCE_META[s] || { label: s || "Unknown", kind: "sync" as const };

// Surfaces Stripe payments that couldn't be matched AND Cal.com syncs that failed,
// so neither money nor calendar drift is ever silently lost. "Resolve" = handled.
const UnmatchedPayments = () => {
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["webhook-failures"],
    queryFn: async (): Promise<WebhookFailure[]> => {
      const { data, error } = await supabase
        .from("webhook_failures")
        .select("*")
        .eq("resolved", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as WebhookFailure[];
    },
  });

  const resolve = async (id: string) => {
    setBusyId(id);
    try {
      const { error } = await supabase.from("webhook_failures").update({ resolved: true }).eq("id", id);
      if (error) throw error;
      showSuccess("Marked as resolved.");
      queryClient.invalidateQueries({ queryKey: ["webhook-failures"] });
    } catch (err: any) {
      showError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const count = rows.length;

  return (
    <Card className="border-2 border-amber-100 dark:border-amber-900/30 shadow-xl rounded-[2.5rem] bg-card overflow-hidden">
      <CardHeader className="p-8 pb-4 bg-amber-50/50 dark:bg-amber-950/10">
        <CardTitle className="text-xl font-black flex items-center gap-3 text-amber-900 dark:text-amber-200">
          <AlertTriangle size={24} /> Payment &amp; Sync Issues
          {count > 0 && (
            <Badge className="bg-amber-500 text-white border-none text-xs font-black">{count}</Badge>
          )}
        </CardTitle>
        <CardDescription className="text-amber-700 dark:text-amber-300/80 font-medium">
          Stripe payments that couldn’t be auto-linked to a booking, and Cal.com calendar
          syncs that failed. Each is tagged by type below — resolve once you’ve handled it.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8 pt-6">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
            <Loader2 size={16} className="animate-spin" /> Checking…
          </div>
        ) : count === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
              <Inbox size={22} className="text-chart-emerald" />
            </div>
            <p className="text-sm font-semibold text-foreground">All clear</p>
            <p className="text-xs text-muted-foreground">Payments matched and calendar in sync.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => {
              const meta = metaFor(r.source);
              return (
              <div key={r.id} className="flex items-center gap-3 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/30 bg-amber-50/40 dark:bg-amber-950/10">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full",
                      meta.kind === "payment"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                        : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400"
                    )}>
                      {meta.label}
                    </span>
                    {meta.kind === "payment" && r.amount != null && (
                      <span className="font-bold text-foreground tabular-nums">${r.amount}</span>
                    )}
                    <span className="text-[11px] text-muted-foreground">{format(new Date(r.created_at), "d MMM, h:mma")}</span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate mt-0.5">{r.detail || r.reference}</div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl font-semibold shrink-0"
                  disabled={busyId === r.id}
                  onClick={() => resolve(r.id)}
                >
                  {busyId === r.id ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <CheckCircle2 size={14} className="mr-1.5 text-chart-emerald" />}
                  Resolve
                </Button>
              </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UnmatchedPayments;
