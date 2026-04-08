"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Quote, Sparkles, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const WINS = [
  {
    client: "Susan Lord",
    text: "Slept like a baby — 9 hours and no wake ups or bad dreams — feeling good 🤗",
    context: "Post-session feedback",
    color: "bg-rose-500"
  }
];

const ClientWins = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <Heart size={18} className="text-rose-500 fill-rose-500" />
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Client Wins</h3>
        </div>
      </div>

      <div className="space-y-4">
        {WINS.map((win, i) => (
          <Card key={i} className="border-none shadow-lg rounded-[2rem] bg-white overflow-hidden group hover:shadow-xl transition-all duration-500">
            <CardContent className="p-6 relative">
              <Quote className="absolute top-4 right-6 text-rose-100 group-hover:text-rose-200 transition-colors" size={40} />
              
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm", win.color)}>
                    <Sparkles size={14} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">{win.client}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{win.context}</p>
                  </div>
                </div>

                <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                  "{win.text}"
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
        
        <button className="w-full py-4 rounded-[1.5rem] border-2 border-dashed border-slate-200 text-slate-400 hover:border-rose-300 hover:text-rose-500 hover:bg-rose-50/30 transition-all flex flex-col items-center justify-center gap-1 group">
          <MessageSquare size={20} className="group-hover:scale-110 transition-transform" />
          <span className="text-[9px] font-black uppercase tracking-widest">Log a new win</span>
        </button>
      </div>
    </div>
  );
};

export default ClientWins;