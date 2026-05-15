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

  const modes: { id: AppMode; label: string; icon: any; description: string }[] = [
    { 
      id: 'clinical', 
      label: 'Clinical Hub', 
      icon: Activity, 
      description: 'Practice management & client sessions'
    },
    { 
      id: 'lab', 
      label: 'Practice Lab', 
      icon: Zap, 
      description: 'Personal integration & practitioner state'
    },
    { 
      id: 'library', 
      label: 'Knowledge Hub', 
      icon: BookOpen, 
      description: 'Protocols, study & mastery'
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
        <button className="flex items-center gap-4 px-4 py-2 border border-border hover:bg-muted transition-colors group">
          <activeMode.icon size={18} className="text-primary" />
          <div className="flex flex-col items-start">
            <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Workspace</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-tight">{activeMode.label}</span>
              <ChevronDown size={12} className="text-muted-foreground group-hover:translate-y-0.5 transition-transform" />
            </div>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 p-0 border border-border bg-background z-[110]">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-[8px] font-bold uppercase tracking-widest text-primary">Switch Workspace</p>
          <p className="text-xs text-muted-foreground">Select your focus for this session.</p>
        </div>
        
        <div className="space-y-0">
          {modes.map((m) => (
            <DropdownMenuItem 
              key={m.id} 
              onClick={() => handleSwitch(m.id)}
              className={cn(
                "p-4 cursor-pointer transition-colors flex items-start gap-4 border-b border-border last:border-b-0 focus:bg-muted",
                mode === m.id ? "bg-muted" : ""
              )}
            >
              <div className="w-10 h-10 border border-border flex items-center justify-center shrink-0 text-primary">
                <m.icon size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xs uppercase tracking-tight">
                  {m.label}
                </span>
                <span className="text-[10px] text-muted-foreground leading-tight mt-1">
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