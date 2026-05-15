"use client";

import React from "react";
import { Activity, Zap, BookOpen, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppMode, AppMode } from "@/components/ModeProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

const HubSwitcher = () => {
  const { mode, setMode } = useAppMode();
  const navigate = useNavigate();

  const modes: { id: AppMode; label: string; icon: any; description: string; color: string }[] = [
    { 
      id: 'clinical', 
      label: 'Clinical Hub', 
      icon: Activity, 
      description: 'Practice management',
      color: 'text-indigo-600'
    },
    { 
      id: 'lab', 
      label: 'Practice Lab', 
      icon: Zap, 
      description: 'Personal integration',
      color: 'text-amber-500'
    },
    { 
      id: 'library', 
      label: 'Knowledge Hub', 
      icon: BookOpen, 
      description: 'Protocols & study',
      color: 'text-purple-600'
    },
  ];

  const activeMode = modes.find(m => m.id === mode) || modes[0];

  const handleSwitch = (newMode: AppMode) => {
    setMode(newMode);
    navigate('/');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 transition-all group">
          <activeMode.icon size={14} className={activeMode.color} />
          <span className="text-[10px] font-black uppercase tracking-widest">{activeMode.label}</span>
          <ChevronDown size={10} className="text-white/40 group-hover:translate-y-0.5 transition-transform" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 p-0 border-2 border-slate-900 bg-background z-[110] rounded-none shadow-2xl">
        <div className="px-4 py-3 border-b border-border bg-slate-50">
          <p className="text-[9px] font-black uppercase tracking-widest text-primary">Switch Workspace</p>
        </div>
        
        <div className="space-y-0">
          {modes.map((m) => (
            <DropdownMenuItem 
              key={m.id} 
              onClick={() => handleSwitch(m.id)}
              className={cn(
                "p-4 cursor-pointer transition-colors flex items-start gap-4 border-b border-border last:border-b-0 focus:bg-muted rounded-none",
                mode === m.id ? "bg-muted" : ""
              )}
            >
              <div className="w-8 h-8 border border-border flex items-center justify-center shrink-0">
                <m.icon size={16} className={m.color} />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-[10px] uppercase tracking-tight">
                  {m.label}
                </span>
                <span className="text-[9px] text-muted-foreground leading-tight mt-1 font-medium">
                  {m.description}
                </span>
              </div>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default HubSwitcher;