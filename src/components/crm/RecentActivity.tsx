"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Calendar, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

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
      <Card className="border-none shadow-sm rounded-2xl bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Clock size={20} className="text-indigo-500" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-indigo-500" size={24} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-sm rounded-2xl bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Clock size={20} className="text-indigo-500" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity) => (
            <Link
              key={activity.id}
              to={activity.link}
              className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  activity.type === "client"
                    ? "bg-indigo-50 text-indigo-600"
                    : "bg-rose-50 text-rose-600"
                )}
              >
                {activity.type === "client" ? (
                  <User size={16} />
                ) : (
                  <Calendar size={16} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                  {activity.title}
                </p>
                <p className="text-xs text-slate-500 truncate">{activity.subtitle}</p>
              </div>
              <div className="text-xs text-slate-400 flex-shrink-0">
                {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
              </div>
            </Link>
          ))}
          {activities.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-8">
              No recent activity
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;