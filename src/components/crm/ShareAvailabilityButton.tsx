import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { Clipboard, Check, Loader2, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";
import { CALCOM_CONFIG, TIMEZONE } from "@/config/integrations";

const SERVICES = [
  { key: "voice60", label: "Voice 60", eventTypeId: CALCOM_CONFIG.VOICE_EVENT_TYPE_60 },
  { key: "voice45", label: "Voice 45", eventTypeId: CALCOM_CONFIG.VOICE_EVENT_TYPE_45 },
  { key: "voice30", label: "Voice 30", eventTypeId: CALCOM_CONFIG.VOICE_EVENT_TYPE_30 },
  { key: "fnh", label: "FNH", eventTypeId: CALCOM_CONFIG.DEFAULT_EVENT_TYPE_ID },
];

const RANGES = [
  { key: "1", label: "Next week", days: 7 },
  { key: "2", label: "2 weeks", days: 14 },
  { key: "4", label: "4 weeks", days: 28 },
];

const ShareAvailabilityButton = () => {
  const [open, setOpen] = useState(false);
  const [service, setService] = useState(SERVICES[0]);
  const [range, setRange] = useState(RANGES[0]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);

  const build = useCallback(async () => {
    setLoading(true);
    setCopied(false);
    try {
      const start = new Date();
      const end = new Date();
      end.setDate(end.getDate() + range.days);

      const res = await supabase.functions.invoke("get-calcom-slots", {
        body: { start: start.toISOString(), end: end.toISOString(), eventTypeId: service.eventTypeId, timeZone: TIMEZONE },
      });
      if (res.error) throw res.error;
      const byDate = (res.data?.data || {}) as Record<string, any[]>;

      const lines: string[] = [];
      const dates = Object.keys(byDate).sort();
      for (const dateKey of dates) {
        const slots = byDate[dateKey] || [];
        if (!slots.length) continue;
        const times = slots
          .map((s) => new Date(s.start || s.time))
          .sort((a, b) => a.getTime() - b.getTime())
          .map((d) => format(d, "h:mma").toLowerCase());
        const label = format(new Date(dateKey + "T00:00:00"), "EEE d MMM");
        lines.push(`${label} — ${times.join(", ")}`);
      }

      const header = `Here are my available times for a ${service.label === "FNH" ? "session" : "lesson"} (Melbourne / AEST):`;
      const footer = `\nReply with a time that suits and I'll lock it in 🙂`;
      const out = lines.length
        ? `${header}\n\n${lines.join("\n")}\n${footer}`
        : `I don't have any open times in the ${range.label.toLowerCase()} window — reach out and we'll find something.`;
      setText(out);
    } catch (err: any) {
      showError(err.message || "Failed to load availability");
      setText("");
    } finally {
      setLoading(false);
    }
  }, [service, range]);

  useEffect(() => {
    if (open) build();
  }, [open, build]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showSuccess("Availability copied — paste it to your client.");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showError("Couldn't access clipboard.");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 rounded-xl font-semibold text-xs gap-2">
          <CalendarClock size={15} /> Share Availability
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[340px] p-4 rounded-2xl">
        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Service</p>
            <div className="flex bg-muted rounded-lg p-0.5 border border-border">
              {SERVICES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setService(s)}
                  className={cn(
                    "flex-1 px-2 py-1.5 rounded-md text-xs font-semibold transition-all",
                    service.key === s.key ? "bg-card text-amber-700 dark:text-amber-400 shadow-sm ring-1 ring-amber-200/60 dark:ring-amber-900/40" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Horizon</p>
            <div className="flex bg-muted rounded-lg p-0.5 border border-border">
              {RANGES.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setRange(r)}
                  className={cn(
                    "flex-1 px-2 py-1.5 rounded-md text-xs font-semibold transition-all",
                    range.key === r.key ? "bg-card text-amber-700 dark:text-amber-400 shadow-sm ring-1 ring-amber-200/60 dark:ring-amber-900/40" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <textarea
              readOnly
              value={loading ? "Loading availability…" : text}
              className="w-full h-44 text-xs rounded-xl border border-border bg-muted/30 p-3 font-mono resize-none focus:outline-none"
            />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="animate-spin text-muted-foreground" size={20} />
              </div>
            )}
          </div>

          <Button onClick={copy} disabled={loading || !text} className="w-full rounded-xl font-semibold">
            {copied ? <><Check size={15} className="mr-2" /> Copied!</> : <><Clipboard size={15} className="mr-2" /> Copy to clipboard</>}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ShareAvailabilityButton;
