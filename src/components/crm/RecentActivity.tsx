"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
            subtitle: "NEW CLIENT ADDED",
            timestamp: new Date(client.created_at),
            link: `/clients/${client.id}`,
          });
        });

        appointmentsData.data?.forEach((app: any) => {
          combined.push({
            id: app.id,
            type: "appointment",
            title: app.name || app.display_id || "SESSION",
            subtitle: `${app.clients?.name.toUpperCase()} • ${format(new Date(app.date), "MMM D").toUpperCase()}`,
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
      <div className="p-8 border border-border flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  return (
    <div className="p-8 border border-border bg-background">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3 text-primary">
          <Clock size={18} />
          <h3 className="text-xl font-medium uppercase tracking-tight">Recent Activity</h3>
        </div>
        {isPrivate && (
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-destructive">
            <EyeOff size={12} />
            <span>Private</span>
          </div>
        )}
      </div>
      
      <div className="space-y-0 border border-border">
        {activities.map((activity) => (
          <Link
            key={activity.id}
            to={activity.link}
            className="flex items-center gap-4 p-4 border-b border-border last:border-b-0 hover:bg-muted transition-colors group"
          >
            <div className="w-10 h-10 border border-border flex items-center justify-center flex-shrink-0 text-primary">
              {activity.type === "client" ? (
                <User size={16} />
              ) : (
                <Calendar size={16} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn(
                "font-bold text-sm uppercase tracking-tight group-hover:text-primary transition-colors truncate",
                isPrivate && "blur-sm select-none"
              )}>
                {activity.title}
              </p>
              <p className={cn(
                "text-[10px] text-muted-foreground font-bold uppercase tracking-widest truncate mt-0.5",
                isPrivate && "blur-[2px] select-none"
              )}>{activity.subtitle}</p>
            </div>
            <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest flex-shrink-0">
              {formatDistanceToNow(activity.timestamp, { addSuffix: true }).toUpperCase()}
            </div>
          </Link>
        ))}
        {activities.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
              No recent activity to show.
            </p>
          </div>
        )}
      </div>
      
      <Link to="/appointments" className="mt-8 block">
        <Button variant="ghost" className="w-full h-12 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-muted group">
          View All Activity <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </Link>
    </div>
  );
};

export default RecentActivity;