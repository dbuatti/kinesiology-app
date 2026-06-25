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

// Surfaces Stripe payments that completed but couldn't be matched to a booking,
// so money-in events are never silently lost. "Resolve" = you've handled it.
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
          <AlertTriangle size={24} /> Unmatched Payments
          {count > 0 && (
            <Badge className="bg-amber-500 text-white border-none text-xs font-black">{count}</Badge>
          )}
        </CardTitle>
        <CardDescription className="text-amber-700 dark:text-amber-300/80 font-medium">
          Stripe payments that came in but couldn’t be auto-linked to a booking (e.g. the
          client paid from a different email). Resolve them once you’ve matched the money up.
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
            <p className="text-sm font-semibold text-foreground">All payments matched</p>
            <p className="text-xs text-muted-foreground">Nothing needs your attention.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/30 bg-amber-50/40 dark:bg-amber-950/10">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground tabular-nums">
                      {r.amount != null ? `$${r.amount}` : "—"}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {r.source === "voice-stripe-webhook" ? "Voice" : "FNH"}
                    </span>
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
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UnmatchedPayments;
