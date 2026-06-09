import React from "react";
import { Activity, Zap, BookOpen, BarChart3, ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppMode, AppMode } from "@/components/ModeProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";

const HubSwitcher = () => {
  const { mode, setMode } = useAppMode();

  const modes: { id: AppMode; label: string; icon: any; color: string; description: string; path: string }[] = [
    { 
      id: 'clinical', 
      label: 'Clinical Hub', 
      icon: Activity, 
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-800',
      description: 'Practice management & client sessions',
      path: '/'
    },
    { 
      id: 'lab', 
      label: 'Practice Lab', 
      icon: Zap, 
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800',
      description: 'Personal integration & practitioner state',
      path: '/'
    },
    { 
      id: 'library', 
      label: 'Knowledge Hub', 
      icon: BookOpen, 
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 border-amber-100 dark:border-amber-800',
      description: 'Protocols, study & mastery',
      path: '/'
    },
    { 
      id: 'business', 
      label: 'Business Hub', 
      icon: BarChart3, 
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800',
      description: 'Combined financials & overview',
      path: '/business/dashboard'
    },
  ];

  const activeMode = modes.find(m => m.id === mode) || modes[0];

  return (
    <div className="flex items-center">
      <Link
        to={activeMode.path}
        onClick={(e) => { if (!e.metaKey && !e.ctrlKey) setMode(activeMode.id); }}
        className={cn(
          "flex items-center gap-2 sm:gap-3 px-2.5 py-2 sm:px-4 rounded-2xl border transition-all duration-500 hover:shadow-lg group cursor-pointer no-underline",
          activeMode.color
        )}
      >
        <div className="relative">
          <activeMode.icon size={18} className="animate-in fade-in zoom-in duration-500" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center">
            <div className="w-1 h-1 bg-current rounded-full animate-pulse" />
          </div>
        </div>
        <div className="hidden sm:flex flex-col items-start">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-0.5">Active Focus</span>
          <span className="text-xs font-bold tracking-tight">{activeMode.label}</span>
        </div>
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className={cn(
            "ml-0.5 p-2 rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-slate-800",
            activeMode.color.split(' ')[0]
          )}>
            <ChevronDown size={14} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72 p-2 rounded-[2rem] border-none shadow-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl z-[110]">
          <div className="px-4 py-3 mb-2">
            <div className="flex items-center gap-2 text-indigo-600 mb-1">
              <Sparkles size={14} className="animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em]">Switch Workspace</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Select your focus for this session.</p>
          </div>
          
          <div className="space-y-1">
            {modes.map((m) => (
              <DropdownMenuItem key={m.id} asChild>
                <Link
                  to={m.path}
                  onClick={(e) => { if (!e.metaKey && !e.ctrlKey) setMode(m.id); }}
                  className={cn(
                    "rounded-2xl p-3 cursor-pointer transition-all duration-300 flex items-start gap-4 no-underline",
                    mode === m.id ? "bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  )}
                >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                  m.color,
                  "border-none"
                )}>
                  <m.icon size={20} />
                </div>
                <div className="flex flex-col">
                  <span className={cn("font-bold text-sm", mode === m.id ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400")}>
                    {m.label}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">
                    {m.description}
                  </span>
                </div>
                </Link>
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default HubSwitcher;
