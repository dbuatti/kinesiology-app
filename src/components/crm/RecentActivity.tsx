"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, Calendar, Loader2, EyeOff, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";

interface Activity {
  id: string;
  type: "client" | "appointment";
  title: string;
  subtitle: string;
  timestamp: Date;
  link: string;
}

const RecentActivity = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const { isPrivate } = usePrivacyMode();

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const [clientsData, appointmentsData] = await Promise.all([
          supabase
            .from("clients")
            .select("id, name, created_at, is_practitioner")
            .or('is_practitioner.eq.false,is_practitioner.is.null')
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("appointments")
            .select(`
              id,
              name,
              date,
              display_id,
              clients!inner (
                name,
                is_practitioner
              )
            `)
            .or('is_practitioner.eq.false,is_practitioner.is.null', { foreignTable: 'clients' })
            .order("date", { ascending: false })
            .limit(5),
        ]);

        const combined: Activity[] = [];

        clientsData.data?.forEach((client) => {
          combined.push({
            id: client.id,
            type: "client",
            title: client.name,
            subtitle: "New client added",
            timestamp: new Date(client.created_at),
            link: `/clients/${client.id}`,
          });
        });

        appointmentsData.data?.forEach((app: any) => {
          combined.push({
            id: app.id,
            type: "appointment",
            title: app.name || app.display_id || "Session",
            subtitle: `${app.clients?.name} • ${format(new Date(app.date), "MMM d")}`,
            timestamp: new Date(app.date),
            link: `/appointments/${app.id}`,
          });
        });

        combined.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        setActivities(combined.slice(0, 8));
      } catch (error) {
        console.error("Error fetching activity:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, []);

  if (loading) {
    return (
      <div className="p-8 bg-white dark:bg-slate-900 rounded-[2rem] border border-secondary/30 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-white dark:bg-slate-900 rounded-[2rem] border border-secondary/30 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-serif font-bold flex items-center gap-3 text-primary">
          <Clock size={20} className="text-indigo-500" />
          Recent Activity
        </h3>
        {isPrivate && (
          <Badge variant="outline" className="h-5 px-2 text-[8px] font-black uppercase border-rose-200 text-rose-400 rounded-full">
            <EyeOff size={10} className="mr-1" /> Private
          </Badge>
        )}
      </div>
      
      <div className="space-y-2">
        {activities.map((activity) => (
          <Link
            key={activity.id}
            to={activity.link}
            className="flex items-center gap-4 p-3 rounded-2xl hover:bg-muted/50 transition-all duration-300 group"
          >
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner group-hover:scale-110 transition-transform",
                activity.type === "client"
                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                  : "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400"
              )}
            >
              {activity.type === "client" ? (
                <User size={18} />
              ) : (
                <Calendar size={18} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn(
                "font-black text-sm text-foreground group-hover:text-primary transition-colors truncate",
                isPrivate && "blur-sm select-none"
              )}>
                {activity.title}
              </p>
              <p className={cn(
                "text-[10px] text-muted-foreground font-black uppercase tracking-widest truncate mt-0.5",
                isPrivate && "blur-[2px] select-none"
              )}>{activity.subtitle}</p>
            </div>
            <div className="text-[9px] text-muted-foreground font-black uppercase tracking-widest flex-shrink-0">
              {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
            </div>
          </Link>
        ))}
        {activities.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm font-medium">
              No recent activity to show.
            </p>
          </div>
        )}
      </div>
      
      <Link to="/appointments" className="mt-6 block">
        <Button variant="ghost" className="w-full rounded-xl h-10 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-muted group">
          View All Activity <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </Link>
    </div>
  );
};

export default RecentActivity;