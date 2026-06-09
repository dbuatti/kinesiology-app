
import React, { useState, useEffect } from 'react';
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
  LayoutGrid,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export type ActiveView = 'home' | 'kinesiology' | 'muscles' | 'gait' | 'previous' | 'context' | 'journal' | 'recheck' | 'audit' | 'psychology';

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
  const navigate = useNavigate();
  const isToolActive = ['kinesiology', 'muscles', 'gait', 'context', 'journal', 'recheck', 'audit'].includes(activeView);

  const isDocViewActive = location.search.includes('view=document');

  const toggleDocumentView = () => {
    if (isDocViewActive) {
      navigate(location.pathname);
    } else {
      navigate(`${location.pathname}?view=document`);
    }
  };

  const NavItem = ({ view, label, Icon }: { view: ActiveView, label: string, Icon: React.ElementType }) => (
    <Button
      variant="ghost"
      onClick={() => onViewChange(view)}
      className={cn(
        "h-10 px-5 rounded-xl font-medium text-[10px] uppercase tracking-wider shrink-0 gap-2.5 text-foreground",
        activeView === view && "bg-card shadow-sm border border-border"
      )}
    >
      <Icon size={16} className={cn(activeView === view ? "text-foreground" : "text-muted-foreground")} />
      {label}
    </Button>
  );

  return (
    <div className="flex flex-col md:flex-row items-center justify-between p-2 gap-4">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto px-1">
        <NavItem view="home" label="PHASES" Icon={LayoutGrid} />
        
        <Button
          variant="ghost"
          asChild
          className={cn(
            "h-10 px-5 rounded-xl font-medium text-[10px] uppercase tracking-wider shrink-0 gap-2.5 text-foreground",
            location.pathname.includes('/protocols') && "bg-card shadow-sm border border-border"
          )}
        >
          <Link to={`/appointments/${appointmentId}/protocols`}>
            <Brain size={16} className={cn(location.pathname.includes('/protocols') ? "text-foreground" : "text-muted-foreground")} />
            Protocols
          </Link>
        </Button>

        <NavItem view="recheck" label="Recheck" Icon={Activity} />
        <NavItem view="previous" label="History" Icon={History} />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "h-10 px-5 rounded-xl transition-all font-medium text-[10px] uppercase tracking-wider shrink-0 flex items-center gap-2.5 text-foreground hover:bg-accent hover:text-accent-foreground",
                isToolActive && "bg-card shadow-sm border border-border"
              )}
            >
              <Wrench size={16} className={cn(isToolActive ? "text-foreground" : "text-muted-foreground")} />
              Tools
              <ChevronDown size={12} className="opacity-50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72 md:w-80 p-2 rounded-xl border border-border shadow-sm bg-card">
            <div className="px-4 py-2 mb-1">
              <p className="text-[10px] font-medium text-muted-foreground">Clinical Utilities</p>
            </div>
            <DropdownMenuItem onClick={() => onViewChange('context')} className="rounded-xl py-3 px-4 cursor-pointer group">
              <UserCircle size={18} className="mr-3 text-muted-foreground" /> 
              <div className="flex flex-col">
                <span className="font-medium text-xs">Client Context</span>
                <span className="text-[10px] text-muted-foreground">History & Background</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewChange('journal')} className="rounded-xl py-3 px-4 cursor-pointer group">
              <BookOpen size={18} className="mr-3 text-muted-foreground group-hover:scale-110 transition-transform" /> 
              <div className="flex flex-col">
                <span className="font-medium text-xs">Session Journal</span>
                <span className="text-[10px] text-muted-foreground">Practitioner Reflections</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1 bg-border" />

            <DropdownMenuItem onClick={() => onViewChange('kinesiology')} className="rounded-xl py-3 px-4 cursor-pointer group">
              <Heart size={18} className="mr-3 text-muted-foreground group-hover:scale-110 transition-transform" /> 
              <div className="flex flex-col">
                <span className="font-medium text-xs">Kinesiology Tools</span>
                <span className="text-[10px] text-muted-foreground">Luscher & Emotions</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewChange('muscles')} className="rounded-xl py-3 px-4 cursor-pointer group">
              <Dumbbell size={18} className="mr-3 text-muted-foreground group-hover:scale-110 transition-transform" /> 
              <div className="flex flex-col">
                <span className="font-medium text-xs">Muscle Log</span>
                <span className="text-[10px] text-muted-foreground">Detailed Testing</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewChange('gait')} className="rounded-xl py-3 px-4 cursor-pointer group">
              <Footprints size={18} className="mr-3 text-muted-foreground group-hover:scale-110 transition-transform" /> 
              <div className="flex flex-col">
                <span className="font-medium text-xs">Gait Integration</span>
                <span className="text-[10px] text-muted-foreground">Movement Patterns</span>
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="my-1 bg-border" />
            
            <DropdownMenuItem onClick={() => onViewChange('audit')} className="rounded-xl py-3 px-4 cursor-pointer group">
              <Clock size={18} className="mr-3 text-muted-foreground group-hover:scale-110 transition-transform" /> 
              <div className="flex flex-col">
                <span className="font-medium text-xs">Session Audit Log</span>
                <span className="text-[10px] text-muted-foreground">Timestamped Findings</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1 bg-border" />

            <DropdownMenuItem onClick={() => onViewChange('psychology')} className="rounded-xl py-3 px-4 cursor-pointer group">
              <Brain size={18} className="mr-3 text-muted-foreground group-hover:scale-110 transition-transform" /> 
              <div className="flex flex-col">
                <span className="font-medium text-xs">Psychology Tools</span>
                <span className="text-[10px] text-muted-foreground">Identity, Beliefs & Alignment</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onOpenDocument} className="rounded-xl py-3 px-4 cursor-pointer group hover:bg-muted">
              <FileText size={18} className="mr-3 text-muted-foreground group-hover:scale-110 transition-transform" /> 
              <div className="flex flex-col">
                <span className="font-medium text-xs">Document View</span>
                <span className="text-[10px] text-muted-foreground">Full Session Report</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Quick Toggles */}
      <div className="flex items-center gap-2 px-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleDocumentView}
          className="h-9 px-3 rounded-xl text-[10px] font-medium tracking-wider gap-1 md:gap-1.5"
        >
          {isDocViewActive ? <LayoutGrid size={14} /> : <FileText size={14} />}
          {isDocViewActive ? "Standard View" : "Doc View"}
        </Button>
      </div>
    </div>
  );
};

export default SessionToolNavigation;