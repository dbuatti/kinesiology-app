"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UserPlus, CalendarPlus, Zap, Target } from "lucide-react";

interface QuickActionsGridProps {
  onNewClient: () => void;
  onBookSession: () => void;
}

const QuickActionsGrid = ({ onNewClient, onBookSession }: QuickActionsGridProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      <Button 
        onClick={onNewClient}
        className="h-28 md:h-40 rounded-[2rem] md:rounded-[3rem] bg-white dark:bg-slate-900 border border-secondary/30 hover:border-indigo-500 hover:bg-indigo-50/30 text-indigo-600 flex flex-col gap-3 md:gap-4 shadow-sm hover:shadow-xl transition-all duration-500 group"
      >
        <div className="w-10 h-10 md:w-16 md:h-16 rounded-2xl md:rounded-[1.5rem] bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
          <UserPlus size={24} className="md:w-8 md:h-8" />
        </div>
        <span className="font-black text-[10px] md:text-[12px] uppercase tracking-[0.2em]">New Client</span>
      </Button>
      <Button 
        onClick={onBookSession}
        className="h-28 md:h-40 rounded-[2rem] md:rounded-[3rem] bg-white dark:bg-slate-900 border border-secondary/30 hover:border-rose-500 hover:bg-rose-50/30 text-rose-600 flex flex-col gap-3 md:gap-4 shadow-sm hover:shadow-xl transition-all duration-500 group"
      >
        <div className="w-10 h-10 md:w-16 md:h-16 rounded-2xl md:rounded-[1.5rem] bg-rose-50 dark:bg-rose-900/40 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
          <CalendarPlus size={24} className="md:w-8 md:h-8" />
        </div>
        <span className="font-black text-[10px] md:text-[12px] uppercase tracking-[0.2em]">Book Session</span>
      </Button>
      <Link to="/practice/calibrate" className="block">
        <Button 
          className="w-full h-28 md:h-40 rounded-[2rem] md:rounded-[3rem] bg-white dark:bg-slate-900 border border-secondary/30 hover:border-amber-500 hover:bg-amber-50/30 text-amber-600 flex flex-col gap-3 md:gap-4 shadow-sm hover:shadow-xl transition-all duration-500 group"
        >
          <div className="w-10 h-10 md:w-16 md:h-16 rounded-2xl md:rounded-[1.5rem] bg-amber-50 dark:bg-amber-900/40 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
            <Zap size={24} className="md:w-8 md:h-8" />
          </div>
          <span className="font-black text-[10px] md:text-[12px] uppercase tracking-[0.2em]">Quick Calibrate</span>
        </Button>
      </Link>
      <Link to="/practice/procedures" className="block">
        <Button 
          className="w-full h-28 md:h-40 rounded-[2rem] md:rounded-[3rem] bg-white dark:bg-slate-900 border border-secondary/30 hover:border-emerald-500 hover:bg-emerald-50/30 text-emerald-600 flex flex-col gap-3 md:gap-4 shadow-sm hover:shadow-xl transition-all duration-500 group"
        >
          <div className="w-10 h-10 md:w-16 md:h-16 rounded-2xl md:rounded-[1.5rem] bg-emerald-50 dark:bg-emerald-900/40 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
            <Target size={24} className="md:w-8 md:h-8" />
          </div>
          <span className="font-black text-[10px] md:text-[12px] uppercase tracking-[0.2em]">Protocols</span>
        </Button>
      </Link>
    </div>
  );
};

export default QuickActionsGrid;