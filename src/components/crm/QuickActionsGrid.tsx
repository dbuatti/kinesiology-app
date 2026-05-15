"use client";

import React from "react";
import { Link } from "react-router-dom";
import { UserPlus, CalendarPlus, Zap, Target, ArrowRight } from "lucide-react";

interface QuickActionsGridProps {
  onNewClient: () => void;
  onBookSession: () => void;
}

const QuickActionsGrid = ({ onNewClient, onBookSession }: QuickActionsGridProps) => {
  const ActionButton = ({ icon: Icon, label, sub, onClick, path }: any) => {
    const content = (
      <div className="h-28 p-6 bg-white hover:bg-slate-50 transition-all flex flex-col justify-between group border-r border-border last:border-r-0">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 bg-indigo-50 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
            <Icon size={20} />
          </div>
          <ArrowRight size={14} className="text-slate-200 group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
        <div>
          <span className="font-black text-[10px] uppercase tracking-widest text-slate-900 block">{label}</span>
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{sub}</span>
        </div>
      </div>
    );

    if (path) return <Link to={path} className="block">{content}</Link>;
    return <button onClick={onClick} className="block text-left w-full">{content}</button>;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-border">
      <ActionButton icon={UserPlus} label="New Client" sub="Add to database" onClick={onNewClient} />
      <ActionButton icon={CalendarPlus} label="Book Session" sub="Schedule appointment" onClick={onBookSession} />
      <ActionButton icon={Zap} label="Quick Calibrate" sub="Instant Pathway Logic" path="/practice/calibrate" />
      <ActionButton icon={Target} label="Protocols" sub="Clinical Reference" path="/practice/procedures" />
    </div>
  );
};

export default QuickActionsGrid;