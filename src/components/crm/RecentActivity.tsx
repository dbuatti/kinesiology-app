
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, Calendar, Loader2, EyeOff, ArrowRight, History } from "lucide-react";
import SectionCard from "@/components/shared/SectionCard";
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
              status,
              created_at,
              display_id,
              clients!inner (
                name,
                is_practitioner
              )
            `)
            .or('is_practitioner.eq.false,is_practitioner.is.null', { foreignTable: 'clients' })
            .order("created_at", { ascending: false })
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
          // The client's live name is the trustworthy one for the bold title —
          // app.name/notion_link are a snapshot of whatever name was typed at
          // booking time (e.g. from an external Cal.com booking) and can go
          // stale or mismatch the actual client record. Confirmed live: a
          // booking snapshot-named "Lesley Belgrave" under client record
          // "Lesley Wiadrowski" showed the wrong name as the prominent title.
          combined.push({
            id: app.id,
            type: "appointment",
            title: app.clients?.name || app.name || app.display_id || "Session",
            subtitle: app.status === "Cancelled"
              ? `Cancelled • ${format(new Date(app.date), "MMM d")}`
              : `Session • ${format(new Date(app.date), "MMM d")}`,
            // created_at (when the record was actually made), not date (the
            // session's scheduled time) — this feed is "recent ACTIVITY", so
            // a booking made 5 minutes ago for a session in 2 months belongs
            // at the top; sorting by session date instead let far-future
            // bookings crowd out genuinely recent activity and made
            // "in about 2 months" read as if it just happened.
            timestamp: new Date(app.created_at || app.date),
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
      <SectionCard title="Recent activity" icon={History}>
        <div className="space-y-1 px-3 pb-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                <div className="h-2.5 w-1/4 animate-pulse rounded bg-muted/70" />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Recent activity"
      icon={History}
      action={
        <>
          {isPrivate && (
            <span className="inline-flex h-6 items-center gap-1 rounded-full border border-border px-2 text-[11px] text-muted-foreground">
              <EyeOff size={11} /> Private
            </span>
          )}
          <Link to="/appointments" className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[13px] text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground">
            View all <ArrowRight size={13} />
          </Link>
        </>
      }
    >
      <ul className="space-y-px">
        {activities.map((activity) => {
          const name = activity.title || "";
          const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((p: string) => p[0]?.toUpperCase()).join("");
          return (
            <li key={activity.id}>
              <Link to={activity.link} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-foreground/[0.03]">
                <div
                  className={cn(
                    "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                    activity.type === "client" ? "bg-primary/10 text-primary" : "bg-muted text-foreground/70",
                    isPrivate && "blur-[3px]"
                  )}
                >
                  {initials || (activity.type === "client" ? <User size={14} /> : <Calendar size={14} />)}
                  <span
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-card",
                      activity.type === "client" ? "bg-primary" : "bg-chart-destructive"
                    )}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate text-sm font-medium text-foreground", isPrivate && "blur-sm select-none")}>{activity.title}</p>
                  <p className={cn("truncate text-xs text-muted-foreground", isPrivate && "blur-[2px] select-none")}>{activity.subtitle}</p>
                </div>
                <div className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true }).replace("about ", "")}
                </div>
              </Link>
            </li>
          );
        })}
        {activities.length === 0 && (
          <li className="px-3 pb-8 pt-4 text-center text-[13px] text-muted-foreground">No recent activity yet.</li>
        )}
      </ul>
    </SectionCard>
  );
};

export default RecentActivity;