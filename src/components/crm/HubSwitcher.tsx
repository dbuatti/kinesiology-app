import React from "react";
import { Activity, Zap, BookOpen, BarChart3, ChevronDown } from "lucide-react";
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={cn(
          "flex items-center gap-1.5 sm:gap-2 pl-2 pr-1 py-1 sm:pl-3 sm:pr-1.5 rounded-lg border transition-all duration-500 hover:shadow-md group cursor-pointer",
          activeMode.color
        )}>
          <div className="relative">
            <activeMode.icon size={14} className="animate-in fade-in zoom-in duration-500" />
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center">
              <div className="w-1 h-1 bg-current rounded-full animate-pulse" />
            </div>
          </div>
          <div className="hidden sm:flex items-center">
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em]">{activeMode.label}</span>
          </div>
          <ChevronDown size={12} className="ml-0.5 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 p-2 rounded-[2rem] border-none shadow-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl z-[110]">
        <div className="space-y-1">
          {modes.map((m) => (
            <DropdownMenuItem key={m.id} asChild>
              <Link
                to={m.path}
                onClick={(e) => { if (!e.metaKey && !e.ctrlKey) setMode(m.id); }}
                className={cn(
                  "rounded-2xl p-3 cursor-pointer transition-all duration-300 flex items-start gap-4 no-underline",
                  mode === m.id ? "bg-slate-100 dark:bg-slate-700 ring-1 ring-slate-200 dark:ring-slate-500" : "hover:bg-slate-50 dark:hover:bg-slate-700"
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
                  <span className={cn("font-bold text-sm", mode === m.id ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-200")}>
                    {m.label}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-300 font-medium leading-tight mt-0.5">
                    {m.description}
                  </span>
                </div>
              </Link>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default HubSwitcher;
