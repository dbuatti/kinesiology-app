import { useState } from "react";
import { Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type Person = { name: string; email: string; practices?: string[]; from?: string[]; to?: string[] };
interface Report {
  action: "dry_run" | "apply" | "undo";
  toInsert?: Person[];
  toTag?: Person[];
  duplicates?: { email: string; names: string[] }[];
  noEmail?: { name: string; from: string }[];
  unchangedCount?: number;
  inserted?: number;
  tagged?: number;
  failed?: { email: string; error: string }[];
  removed?: number;
  restored?: number;
  kept?: string[];
}

const list = (xs: string[]) => xs.join(", ");
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * Phase 5 step 2: give every voice and piano student a row in `clients`
 * (people-backfill edge function). Always shows a dry run before anything
 * is written, and can undo exactly what it did.
 */
export default function PeopleBackfill() {
  const [busy, setBusy] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: Report["action"]) => {
    if (action === "undo" && !window.confirm("Undo the people update? Students added by it are removed unless sessions or a portal account are attached to them.")) return;
    setBusy(action); setError(null);
    const { data, error: err } = await supabase.functions.invoke("people-backfill", { body: { action } });
    setBusy(null);
    if (err || !data?.success) { setError(data?.error || err?.message || "Something went wrong"); return; }
    setReport(data);
  };

  const r = report;
  const dry = r?.action === "dry_run";
  const nothingToDo = dry && !r?.toInsert?.length && !r?.toTag?.length;

  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3 border-b border-border pb-3">
        <Users size={18} className="mt-0.5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-foreground">One list of people</h2>
          <p className="text-sm text-muted-foreground">
            Adds your voice and piano students to your client records, matched by email, so someone who does kinesiology and voice is one person.
            Check the preview first; nothing changes until you apply it, and it can be undone.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => run("dry_run")} disabled={!!busy} className="gap-1.5">
          {busy === "dry_run" && <Loader2 size={14} className="animate-spin" />}Preview changes
        </Button>
        <Button size="sm" onClick={() => run("apply")} disabled={!!busy || !dry || nothingToDo} className="gap-1.5">
          {busy === "apply" && <Loader2 size={14} className="animate-spin" />}Apply
        </Button>
        <Button size="sm" variant="ghost" onClick={() => run("undo")} disabled={!!busy} className="gap-1.5 text-muted-foreground">
          {busy === "undo" && <Loader2 size={14} className="animate-spin" />}Undo
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {r && r.action === "undo" && (
        <p className="text-sm text-foreground">
          Undone: {r.removed} added students removed, {r.restored} records restored.
          {r.kept?.length ? ` Kept because sessions or a portal account are attached: ${list(r.kept)}.` : ""}
        </p>
      )}

      {r && r.action !== "undo" && (
        <div className="space-y-4 text-sm">
          {r.action === "apply" && (
            <p className="font-medium text-foreground">
              Done: {plural(r.inserted ?? 0, "student", "students")} added, {plural(r.tagged ?? 0, "existing client", "existing clients")} updated.
              {r.failed?.length ? ` ${r.failed.length} couldn't be saved: ${list(r.failed.map((f) => `${f.email} (${f.error})`))}.` : ""}
            </p>
          )}
          {dry && nothingToDo && <p className="text-foreground">Everyone is already in your records — nothing to change.</p>}
          {!!r.toInsert?.length && (
            <div>
              <p className="font-medium text-foreground">{dry ? "Will add" : "Added"} {plural(r.toInsert.length, "student", "students")}</p>
              <ul className="mt-1 divide-y divide-border/60">
                {r.toInsert.map((p) => (
                  <li key={p.email} className="flex gap-3 py-1.5">
                    <span className="min-w-0 flex-1 truncate text-foreground blur-sensitive">{p.name}</span>
                    <span className="hidden truncate text-muted-foreground sm:inline blur-sensitive">{p.email}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{list(p.practices || [])}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!!r.toTag?.length && (
            <div>
              <p className="font-medium text-foreground">{dry ? "Will update" : "Updated"} {plural(r.toTag.length, "existing client", "existing clients")} (same email)</p>
              <ul className="mt-1 divide-y divide-border/60">
                {r.toTag.map((p) => (
                  <li key={p.email} className="flex gap-3 py-1.5">
                    <span className="min-w-0 flex-1 truncate text-foreground blur-sensitive">{p.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{list(p.from || [])} → {list(p.to || [])}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!!r.duplicates?.length && (
            <div>
              <p className="font-medium text-foreground">Skipped — more than one client already has this email</p>
              <p className="text-muted-foreground">Merge these in Duplicate resolution below, then preview again: {list(r.duplicates.map((d) => `${list(d.names)} (${d.email})`))}.</p>
            </div>
          )}
          {!!r.noEmail?.length && (
            <div>
              <p className="font-medium text-foreground">Skipped — no email in Notion</p>
              <p className="text-muted-foreground blur-sensitive">{list(r.noEmail.map((n) => n.name))}</p>
            </div>
          )}
          {!!r.unchangedCount && <p className="text-muted-foreground">{r.unchangedCount} already up to date.</p>}
        </div>
      )}
    </section>
  );
}
