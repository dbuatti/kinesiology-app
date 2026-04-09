"use client";

import React, { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

const SCRATCHPAD_KEY = "antigravity_practitioner_scratchpad";
const SCRATCHPAD_TIME_KEY = "antigravity_practitioner_scratchpad_time";

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
        <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-amber-600 flex items-center gap-3">
          <StickyNote size={28} /> Practitioner Scratchpad
        </h2>
        <p className="text-sm md:text-base text-muted-foreground font-medium">Quick notes or research ideas. Saves automatically to your browser.</p>
      </div>
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {["Research", "Follow-up", "Protocol Idea", "Clinical Note"].map(tag => (
            <button 
              key={tag}
              onClick={() => addTag(tag)}
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-secondary/30 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600 transition-all shadow-sm"
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
            className="min-h-[250px] md:min-h-[300px] bg-white dark:bg-slate-900/50 border-secondary/30 focus:ring-amber-500 focus:border-amber-500 resize-none text-foreground placeholder:text-slate-300 dark:placeholder:text-slate-800 rounded-[2.5rem] p-8 md:p-12 text-xl md:text-2xl font-medium leading-relaxed shadow-xl transition-all"
          />
          <div className="absolute bottom-6 right-8 md:bottom-10 md:right-12 flex items-center gap-2 text-[10px] font-black text-amber-600 uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-opacity">
            <CheckCircle2 size={14} /> {lastSaved ? `Last saved at ${lastSaved}` : 'Auto-saved'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scratchpad;