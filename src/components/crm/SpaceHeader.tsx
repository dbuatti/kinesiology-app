
import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Settings, 
  LogOut, 
  Eye, 
  EyeOff,
  HelpCircle,
  Timer,
  Activity,
  Mic,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess } from "@/utils/toast";
import SearchBar from "./SearchBar";
import HelpModal from "./HelpModal";
import { useActiveSession } from "@/hooks/useActiveSession";
import { differenceInSeconds } from "date-fns";

const SpaceHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isPrivate, togglePrivacy } = usePrivacyMode();
  const [helpOpen, setHelpOpen] = useState(false);
  const activeSession = useActiveSession();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const sessionTimer = useMemo(() => {
    if (!activeSession) return null;
    const elapsed = differenceInSeconds(currentTime, activeSession.date);
    const total = 60 * 60;
    const remaining = Math.max(0, total - elapsed);
    const overtime = Math.max(0, elapsed - total);
    const mins = Math.floor(overtime > 0 ? overtime : remaining) / 60;
    const secs = (overtime > 0 ? overtime : remaining) % 60;
    const progress = Math.min(100, (elapsed / total) * 100);
    return {
      display: overtime > 0 ? `+${Math.floor(mins)}m ${secs.toString().padStart(2, '0')}s` : `${Math.floor(mins)}m ${secs.toString().padStart(2, '0')}s`,
      clientName: activeSession.clientName,
      stage: activeSession.stage,
      progress,
      isOvertime: overtime > 0,
      isFinished: activeSession.status === 'Completed',
    };
  }, [activeSession, currentTime]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    showSuccess("Signed out successfully");
    navigate('/login');
  };

  return (
    <header className="relative w-full bg-card/80 backdrop-blur-xl border-b border-border h-12 flex items-center justify-between">
      {/* LEFT: Context Switcher */}
      <div className="flex items-center gap-2 pl-4">
        <button
          onClick={() => navigate('/')}
          className={cn(
            "flex items-center gap-2 px-0 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
            !location.pathname.startsWith('/voice')
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span className={cn("w-7 h-7 rounded-full flex items-center justify-center", !location.pathname.startsWith('/voice') ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
            <Activity size={14} />
          </span>
          Kinesiology
        </button>
        <button
          onClick={() => navigate('/voice')}
          className={cn(
            "flex items-center gap-2 px-0 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
            location.pathname.startsWith('/voice')
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span className={cn("w-7 h-7 rounded-full flex items-center justify-center", location.pathname.startsWith('/voice') ? "bg-destructive text-white" : "bg-muted text-muted-foreground")}>
            <Mic size={14} />
          </span>
          Voice
        </button>
      </div>

      {/* CENTER: Session Timer */}
      <div className="absolute left-1/2 -translate-x-1/2">
        {sessionTimer && (
          <Link
            to={`/appointments/${activeSession!.id}`}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg no-underline",
              sessionTimer.isOvertime ? "bg-chart-destructive/10 text-chart-destructive" : "bg-chart-emerald/10 text-chart-emerald"
            )}
          >
            <Timer size={14} />
            <span className="text-xs font-semibold tabular-nums font-mono">{sessionTimer.display}</span>
            <span className="w-px h-4 bg-current opacity-20" />
            <span className="text-xs font-medium truncate max-w-[100px]">{sessionTimer.clientName}</span>
            <span className="text-[9px] font-semibold uppercase tracking-wider bg-white/10 px-1.5 py-0.5 rounded">{sessionTimer.stage}</span>
          </Link>
        )}
      </div>

      {/* RIGHT: Search + User Menu */}
      <div className="flex items-center gap-2 pr-4">
        <SearchBar compact />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Settings menu" className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground">
              <Settings size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl p-2 shadow-sm border-none bg-card">
            <DropdownMenuItem onClick={togglePrivacy} className="rounded-xl py-2.5 px-4 cursor-pointer gap-3">
              {isPrivate ? <EyeOff size={16} className="text-chart-destructive" /> : <Eye size={16} />}
              <span className="font-medium text-xs uppercase tracking-wider">{isPrivate ? "Disable Privacy" : "Enable Privacy"}</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => setHelpOpen(true)} className="rounded-xl py-2.5 px-4 cursor-pointer gap-3">
              <HelpCircle size={16} />
              <span className="font-medium text-xs uppercase tracking-wider">Help & Shortcuts</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-muted my-2" />
            
            <DropdownMenuItem asChild className="rounded-xl py-2.5 px-4 cursor-pointer gap-3">
              <Link to="/settings">
                <Settings size={16} />
                <span className="font-medium text-xs uppercase tracking-wider">System Settings</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleSignOut} className="rounded-xl py-2.5 px-4 cursor-pointer gap-3 text-chart-destructive hover:bg-muted">
              <LogOut size={16} />
              <span className="font-medium text-xs uppercase tracking-wider">Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <HelpModal open={helpOpen} onOpenChange={setHelpOpen} />
      {sessionTimer && !sessionTimer.isFinished && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-muted/30">
          <div className={cn("h-full transition-all duration-500", sessionTimer.isOvertime ? "bg-chart-destructive" : "bg-chart-primary")} style={{ width: `${sessionTimer.progress}%` }} />
        </div>
      )}
    </header>
  );
};

export default SpaceHeader;
