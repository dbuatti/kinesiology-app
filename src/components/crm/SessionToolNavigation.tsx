"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  Dumbbell, 
  Footprints, 
  History, 
  Activity, 
  Zap, 
  Wrench, 
  FileText, 
  Clock, 
  UserCircle, 
  BookOpen, 
  ChevronDown,
  Brain,
  LayoutGrid
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export type ActiveView = 'home' | 'kinesiology' | 'muscles' | 'gait' | 'previous' | 'context' | 'journal' | 'recheck' | 'audit';

interface SessionToolNavigationProps {
  appointmentId: string;
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  onOpenDocument: () => void;
}

const SessionToolNavigation = ({ 
  appointmentId, 
  activeView, 
  onViewChange, 
  onOpenDocument 
}: SessionToolNavigationProps) => {
  const location = useLocation();
  const isToolActive = ['kinesiology', 'muscles', 'gait', 'context', 'journal', 'recheck', 'audit'].includes(activeView);

  const NavItem = ({ view, label, Icon }: { view: ActiveView, label: string, Icon: React.ElementType }) => (
    <Button
      variant="ghost"
      onClick={() => onViewChange(view)}
      className={cn(
        "h-10 px-5 rounded-xl transition-all font-black text-[9px] uppercase tracking-widest shrink-0 gap-2.5",
        activeView === view 
          ? "bg-white text-indigo-600 shadow-md border border-slate-100" 
          : "text-slate-500 hover:bg-white/50"
      )}
    >
      <Icon size={16} className={cn(activeView === view ? "text-indigo-600" : "text-slate-400")} />
      {label}
    </Button>
  );

  return (
    <div className="flex flex-col md:flex-row items-center justify-between bg-slate-100/50 dark:bg-slate-800/50 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 gap-4">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto px-1">
        <NavItem view="home" label="PHASES" Icon={LayoutGrid} />
        
        <Button
          variant="ghost"
          asChild
          className={cn(
            "h-10 px-5 rounded-xl transition-all font-black text-[9px] uppercase tracking-widest shrink-0 gap-2.5",
            location.pathname.includes('/protocols') ? "bg-white text-purple-600 shadow-md border border-slate-100" : "text-slate-500 hover:bg-white/50"
          )}
        >
          <Link to={`/appointments/${appointmentId}/protocols`}>
            <Brain size={16} className={cn(location.pathname.includes('/protocols') ? "text-purple-600" : "text-purple-400")} />
            Protocols
          </Link>
        </Button>

        <NavItem view="recheck" label="Recheck" Icon={Activity} />
        <NavItem view="previous" label="History" Icon={History} />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "h-10 px-5 rounded-xl transition-all font-black text-[9px] uppercase tracking-widest shrink-0 flex items-center gap-2.5",
                isToolActive ? "bg-white text-indigo-600 shadow-md border border-slate-100" : "text-slate-500 hover:bg-white/50"
              )}
            >
              <Wrench size={16} className={cn(isToolActive ? "text-indigo-600" : "text-slate-400")} />
              Tools
              <ChevronDown size={12} className="opacity-50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72 p-2 rounded-2xl border-none shadow-3xl bg-white dark:bg-slate-900">
            <div className="px-4 py-2 mb-1">
              <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">Clinical Utilities</p>
            </div>
            <DropdownMenuItem onClick={() => onViewChange('context')} className="rounded-xl py-3 px-4 cursor-pointer group">
              <UserCircle size={18} className="mr-3 text-indigo-500" /> 
              <div className="flex flex-col">
                <span className="font-bold text-xs">Client Context</span>
                <span className="text-[9px] text-slate-400 font-medium">History & Background</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewChange('journal')} className="rounded-xl py-3 px-4 cursor-pointer group">
              <BookOpen size={18} className="mr-3 text-amber-500 group-hover:scale-110 transition-transform" /> 
              <div className="flex flex-col">
                <span className="font-bold text-xs">Session Journal</span>
                <span className="text-[9px] text-slate-400 font-medium">Practitioner Reflections</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />

            <DropdownMenuItem onClick={() => onViewChange('kinesiology')} className="rounded-xl py-3 px-4 cursor-pointer group">
              <Heart size={18} className="mr-3 text-rose-500 group-hover:scale-110 transition-transform" /> 
              <div className="flex flex-col">
                <span className="font-bold text-xs">Kinesiology Tools</span>
                <span className="text-[9px] text-slate-400 font-medium">Luscher & Emotions</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewChange('muscles')} className="rounded-xl py-3 px-4 cursor-pointer group">
              <Dumbbell size={18} className="mr-3 text-indigo-500 group-hover:scale-110 transition-transform" /> 
              <div className="flex flex-col">
                <span className="font-bold text-xs">Muscle Log</span>
                <span className="text-[9px] text-slate-400 font-medium">Detailed Testing</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewChange('gait')} className="rounded-xl py-3 px-4 cursor-pointer group">
              <Footprints size={18} className="mr-3 text-emerald-500 group-hover:scale-110 transition-transform" /> 
              <div className="flex flex-col">
                <span className="font-bold text-xs">Gait Integration</span>
                <span className="text-[9px] text-slate-400 font-medium">Movement Patterns</span>
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />
            
            <DropdownMenuItem onClick={() => onViewChange('audit')} className="rounded-xl py-3 px-4 cursor-pointer group">
              <Clock size={18} className="mr-3 text-slate-400 group-hover:scale-110 transition-transform" /> 
              <div className="flex flex-col">
                <span className="font-bold text-xs">Session Audit Log</span>
                <span className="text-[9px] text-slate-400 font-medium">Timestamped Findings</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onOpenDocument} className="rounded-xl py-3 px-4 cursor-pointer group bg-indigo-50 text-indigo-600 hover:bg-indigo-100">
              <FileText size={18} className="mr-3 group-hover:scale-110 transition-transform" /> 
              <div className="flex flex-col">
                <span className="font-bold text-xs">Document View</span>
                <span className="text-[9px] text-indigo-400 font-medium">Full Session Report</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default SessionToolNavigation;