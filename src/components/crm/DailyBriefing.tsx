
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, ArrowRight, Target, Clock, Activity, Coffee } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AppointmentWithClient } from "@/types/crm";

interface DailyBriefingProps {
  todaySessions: AppointmentWithClient[];
  activeSession: AppointmentWithClient | null;
}

const DailyBriefing = ({ todaySessions, activeSession }: DailyBriefingProps) => {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
        <div className="space-y-1">
          <h2 className="text-2xl font-serif font-bold text-foreground dark:text-primary-foreground flex items-center gap-4">
            <Zap size={28} className="text-amber-500 fill-amber-400" /> Daily Briefing
          </h2>
          <p className="text-muted-foreground font-medium text-base">
            {todaySessions.length > 0 
              ? `You have ${todaySessions.length} session${todaySessions.length === 1 ? '' : 's'} scheduled for today.`
              : "Your schedule is clear for today."}
          </p>
        </div>
        {activeSession && (
          <Link to={`/appointments/${activeSession.id}`}>
            <Badge className="bg-rose-600 hover:bg-rose-700 text-primary-foreground border-none px-6 py-2 animate-pulse cursor-pointer font-black text-[10px] uppercase tracking-[0.3em] rounded-full shadow-xl shadow-rose-500/20">
              <Activity size={16} className="mr-2" /> LIVE: {activeSession.clients?.name}
            </Badge>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {todaySessions.length > 0 ? (
          todaySessions.map(session => (
            <Link key={session.id} to={`/appointments/${session.id}`}>
              <div className={cn(
                "p-5 rounded-2xl border transition-all duration-500 flex flex-col gap-6 group relative overflow-hidden",
                activeSession?.id === session.id 
                  ? "bg-foreground text-primary-foreground border-border shadow-2xl" 
                  : "bg-card dark:bg-foreground border-border/50 dark:border-foreground hover:border-chart-primary/40 shadow-sm hover:shadow-xl"
              )}>
                <div className="flex items-center justify-between w-full relative z-10">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock size={16} className={cn(activeSession?.id === session.id ? "text-amber-400" : "text-muted-foreground")} />
                      <p className={cn(
                        "text-[10px] font-black uppercase tracking-[0.3em]",
                        activeSession?.id === session.id ? "text-amber-400" : "text-muted-foreground"
                      )}>
                        {activeSession?.id === session.id ? "ONGOING" : format(session.date, "h:mm a")}
                      </p>
                    </div>
                    <p className="font-serif font-bold text-xl truncate tracking-tight">{session.clients?.name}</p>
                  </div>
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm",
                    activeSession?.id === session.id ? "bg-card/10 text-primary-foreground" : "bg-muted/50 dark:bg-foreground text-muted-foreground group-hover:bg-chart-primary group-hover:text-primary-foreground"
                  )}>
                    <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
                
                {session.goal && (
                  <div className={cn(
                    "p-5 rounded-2xl text-sm font-medium flex items-start gap-4 relative z-10",
                    activeSession?.id === session.id ? "bg-card/5 text-muted-foreground/60" : "bg-muted/50 dark:bg-foreground/50 text-muted-foreground dark:text-muted-foreground"
                  )}>
                    <Target size={18} className="shrink-0 mt-0.5 opacity-50" />
                    <p className="italic leading-relaxed">"{session.goal}"</p>
                  </div>
                )}
              </div>
            </Link>
          ))
        ) : (
          <div className="md:col-span-2 flex flex-col items-center justify-center gap-4 p-10 bg-muted/50 dark:bg-foreground/50 rounded-2xl border-2 border-dashed border-border dark:border-foreground text-center">
            <div className="w-20 h-20 rounded-[1.5rem] bg-card dark:bg-foreground flex items-center justify-center text-muted-foreground/60 shadow-sm">
              <Coffee size={40} />
            </div>
            <div className="space-y-2">
              <p className="font-serif font-bold text-foreground dark:text-primary-foreground text-2xl">No sessions today.</p>
              <p className="text-muted-foreground font-medium text-base max-w-xs mx-auto leading-relaxed">
                Use this time for clinical research or personal practice.
              </p>
            </div>
            <Link to="/practice/self">
              <Button variant="outline" className="rounded-xl px-8 h-12 font-black text-[10px] uppercase tracking-widest border-border hover:bg-card transition-all shadow-sm">
                Start Self Practice
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyBriefing;