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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-border">
      <button 
        onClick={onNewClient}
        className="h-32 p-8 bg-background border-r border-border last:border-r-0 hover:bg-muted transition-colors flex flex-col items-start justify-between group"
      >
        <div className="w-10 h-10 bg-primary text-primary-foreground flex items-center justify-center">
          <UserPlus size={20} />
        </div>
        <span className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">New Client</span>
      </button>
      
      <button 
        onClick={onBookSession}
        className="h-32 p-8 bg-background border-r border-border last:border-r-0 hover:bg-muted transition-colors flex flex-col items-start justify-between group"
      >
        <div className="w-10 h-10 bg-primary text-primary-foreground flex items-center justify-center">
          <CalendarPlus size={20} />
        </div>
        <span className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Book Session</span>
      </button>
      
      <Link to="/practice/calibrate" className="h-32 p-8 bg-background border-r border-border last:border-r-0 hover:bg-muted transition-colors flex flex-col items-start justify-between group">
        <div className="w-10 h-10 bg-primary text-primary-foreground flex items-center justify-center">
          <Zap size={20} />
        </div>
        <span className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Quick Calibrate</span>
      </Link>
      
      <Link to="/practice/procedures" className="h-32 p-8 bg-background border-r border-border last:border-r-0 hover:bg-muted transition-colors flex flex-col items-start justify-between group">
        <div className="w-10 h-10 bg-primary text-primary-foreground flex items-center justify-center">
          <Target size={20} />
        </div>
        <span className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Protocols</span>
      </Link>
    </div>
  );
};

export default QuickActionsGrid;