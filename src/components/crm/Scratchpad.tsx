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
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <StickyNote size={18} />
          <p className="text-[10px] font-bold uppercase tracking-widest">Clinical Notes</p>
        </div>
        <h2 className="text-2xl font-medium uppercase tracking-tight">Practitioner Scratchpad</h2>
        <p className="text-sm text-muted-foreground">Quick notes or research ideas. Saves automatically to your browser.</p>
      </div>
      
      <div className="space-y-6">
        <div className="flex flex-wrap gap-0 border border-border">
          {["Research", "Follow-up", "Protocol Idea", "Clinical Note"].map(tag => (
            <button 
              key={tag}
              onClick={() => addTag(tag)}
              className="px-4 py-3 border-r border-border last:border-r-0 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
            >
              + {tag}
            </button>
          ))}
        </div>
        
        <div className="relative">
          <Textarea
            value={scratchpad}
            onChange={(e) => handleScratchpadChange(e.target.value)}
            placeholder="Type something here..."
            className="min-h-[300px] bg-background border-border focus:ring-primary focus:border-primary resize-none text-foreground placeholder:text-muted-foreground rounded-none p-8 text-xl font-medium leading-relaxed transition-all"
          />
          <div className="absolute bottom-4 right-4 flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest">
            <CheckCircle2 size={14} /> {lastSaved ? `Last saved at ${lastSaved}` : 'Auto-saved'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scratchpad;