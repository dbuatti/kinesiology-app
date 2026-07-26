
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
    <div className="space-y-8">
      <div className="px-2 space-y-1">
        <h2 className="text-3xl font-serif font-bold tracking-tight text-amber-600 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shadow-sm">
            <StickyNote size={24} />
          </div>
          Practitioner Scratchpad
        </h2>
        <p className="text-base text-muted-foreground font-medium">Quick notes or research ideas. Saves automatically to your browser.</p>
      </div>
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3">
          {["Research", "Follow-up", "Protocol Idea", "Clinical Note"].map(tag => (
            <button 
              key={tag}
              onClick={() => addTag(tag)}
              className="px-5 py-2.5 rounded-xl bg-card dark:bg-foreground border border-border/50 dark:border-foreground text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600 transition-all shadow-sm hover:shadow-md"
            >
              + {tag}
            </button>
          ))}
        </div>
        <div className="relative group">
          <Textarea
            value={scratchpad}
            onChange={(e) => handleScratchpadChange(e.target.value)}
            placeholder="Type something here..."
            className="min-h-[300px] md:min-h-[400px] bg-card dark:bg-foreground/50 border-border/50 dark:border-foreground focus:ring-amber-500 focus:border-amber-500 resize-none text-foreground dark:text-primary-foreground placeholder:text-muted-foreground/60 dark:placeholder:text-foreground rounded-[2.5rem] p-10 md:p-16 text-2xl md:text-3xl font-medium leading-relaxed shadow-xl transition-all"
          />
          <div className="absolute bottom-8 right-10 md:bottom-12 md:right-16 flex items-center gap-2 text-[10px] font-black text-amber-600 uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-opacity">
            <CheckCircle2 size={16} /> {lastSaved ? `Last saved at ${lastSaved}` : 'Auto-saved'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scratchpad;