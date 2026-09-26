
import SectionCard from "@/components/shared/SectionCard";
import React, { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

const SCRATCHPAD_KEY = "rk_practitioner_scratchpad";
const SCRATCHPAD_TIME_KEY = "rk_practitioner_scratchpad_time";

const Scratchpad = () => {
  const [scratchpad, setScratchpad] = useState("");
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(SCRATCHPAD_KEY);
    const savedTime = localStorage.getItem(SCRATCHPAD_TIME_KEY);
    if (saved) setScratchpad(saved);
    if (savedTime) setLastSaved(savedTime);
  }, []);

  const handleScratchpadChange = (val: string) => {
    const now = format(new Date(), "h:mm a");
    setScratchpad(val);
    setLastSaved(now);
    localStorage.setItem(SCRATCHPAD_KEY, val);
    localStorage.setItem(SCRATCHPAD_TIME_KEY, now);
  };

  const addTag = (tag: string) => {
    handleScratchpadChange(scratchpad ? `${scratchpad}\n[${tag}] ` : `[${tag}] `);
  };

  return (
    <SectionCard
      title="Scratchpad"
      icon={StickyNote}
      iconClassName="text-chart-amber"
      description="Quick notes and research ideas — saved in this browser"
      action={
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <CheckCircle2 size={13} className="text-chart-emerald" /> {lastSaved ? `Saved ${lastSaved}` : "Auto-saves"}
        </span>
      }
      bodyClassName="px-5 pb-5"
    >
      <div className="mb-3 flex flex-wrap gap-1.5">
        {["Research", "Follow-up", "Protocol idea", "Clinical note"].map((tag) => (
          <button
            key={tag}
            onClick={() => addTag(tag)}
            className="inline-flex h-7 items-center gap-1 rounded-full border border-border bg-background px-2.5 text-xs font-medium text-muted-foreground hover:border-foreground/15 hover:text-foreground"
          >
            <span className="text-muted-foreground/60">+</span> {tag}
          </button>
        ))}
      </div>
      <Textarea
        value={scratchpad}
        onChange={(e) => handleScratchpadChange(e.target.value)}
        placeholder="Jot something down…"
        className="min-h-[220px] resize-y rounded-xl border-border bg-background p-4 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground/60 md:min-h-[260px]"
      />
    </SectionCard>
  );
};

export default Scratchpad;