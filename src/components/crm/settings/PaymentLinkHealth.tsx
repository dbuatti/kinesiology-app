import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  RefreshCw,
  Link2Off,
  CheckCircle2,
  Copy,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";

interface PaymentLinkProblem {
  id: string;
  name: string;
  email: string | null;
  date: string;
  reason: "expired" | "missing" | "error";
  payment_link: string;
}

interface CheckResult {
  success: boolean;
  checked: number;
  flagged: number;
  skipped: number;
  problems: PaymentLinkProblem[];
}

/**
 * Payment-link health.
 *
 * Clients only see a dead link when they click it, which is the worst possible
 * time. This runs the same check the edge function does and lists every unpaid
 * appointment whose stored link Stripe says is expired or gone, with a one-click
 * way to issue a fresh one.
 */
export function PaymentLinkHealth() {
  const [loading, setLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [sending, setSending] = useState<string | null>(null);

  const runCheck = useCallback(async (silent = false) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-payment-links", {
        body: { sinceDays: 90 },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Check failed");
      setResult(data as CheckResult);
      setHasRun(true);
      if (!silent) {
        if (data.flagged > 0) showError(`${data.flagged} payment link${data.flagged === 1 ? "" : "s"} need attention`);
        else showSuccess("All payment links are healthy");
      }
    } catch (err: any) {
      if (!silent) showError(err.message || "Couldn't check payment links");
      setHasRun(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    runCheck(true);
  }, [runCheck]);

  const sendNewLink = async (problem: PaymentLinkProblem) => {
    setSending(problem.id);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-manager", {
        body: {
          action: "create-checkout",
          appointmentId: problem.id,
          clientData: { email: problem.email },
        },
      });
      if (error) throw error;
      if (!data?.url) throw new Error(data?.error || "No link returned");

      try {
        await navigator.clipboard.writeText(data.url);
        showSuccess(`New payment link for ${problem.name.split(" ")[0]} copied to clipboard`);
      } catch {
        showSuccess("New payment link created — copy it from the row below");
      }
      setResult((prev) =>
        prev
          ? {
              ...prev,
              problems: prev.problems.map((p) =>
                p.id === problem.id ? { ...p, payment_link: data.url, reason: "error" } : p,
              ),
            }
          : prev,
      );
      await runCheck(true);
    } catch (err: any) {
      showError(err.message || "Couldn't create a payment link");
    } finally {
      setSending(null);
    }
  };

  const problems = result?.problems ?? [];

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-chart-destructive/10 text-chart-destructive flex items-center justify-center">
            <Link2Off size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground text-sm">Payment link health</h3>
            <p className="text-xs text-muted-foreground font-medium">
              Emailed links that Stripe has expired, so clients can't pay.
            </p>
          </div>
        </div>

        {loading && !hasRun ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 size={15} className="animate-spin" /> Checking payment links…
          </div>
        ) : problems.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl border border-success/25 bg-success/[0.06] px-4 py-4">
            <CheckCircle2 size={18} className="text-success shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                {hasRun ? "All payment links are healthy" : "No check has run yet"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {hasRun
                  ? `${result?.checked ?? 0} checkout links checked; payment links don't expire.`
                  : "Run a check to scan unpaid appointments."}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {problems.map((p) => (
              <div
                key={p.id}
                className="flex flex-col gap-3 rounded-xl border border-destructive/25 bg-destructive/[0.04] p-3 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {p.name}
                    <span className="ml-2 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">
                      {p.reason === "expired" ? "Link expired" : "Link broken"}
                    </span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(p.date).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {p.email ? ` · ${p.email}` : ""}
                  </p>
                  <p className="mt-1 truncate text-[10px] text-muted-foreground/70">{p.payment_link}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5"
                    onClick={() => sendNewLink(p)}
                    disabled={sending === p.id}
                  >
                    {sending === p.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <RefreshCw size={13} />
                    )}
                    New link
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 px-0"
                    aria-label="Copy payment link"
                    title="Copy payment link"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(p.payment_link);
                        showSuccess("Payment link copied");
                      } catch {
                        showError("Couldn't access the clipboard");
                      }
                    }}
                  >
                    <Copy size={13} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 px-0"
                    aria-label="Open appointment"
                    title="Open appointment"
                    onClick={() => window.open(`/appointments/${p.id}`, "_blank")}
                  >
                    <ExternalLink size={13} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-[11px] text-muted-foreground">
            {hasRun && result
              ? `${result.checked} checkout link${result.checked === 1 ? "" : "s"} checked · ${result.skipped} non-expiring skipped`
              : "Checks unpaid appointments from the last 90 days."}
          </p>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5"
            onClick={() => runCheck(false)}
            disabled={loading}
          >
            <RefreshCw size={13} className={cn(loading && "animate-spin")} />
            Check now
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PaymentLinkHealth;