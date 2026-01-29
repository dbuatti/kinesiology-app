"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, User, Calendar, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useDashboardStats } from "@/hooks/use-crm-data";
import { Skeleton } from "@/components/ui/skeleton";

interface Activity {
  id: string;
  type: "client" | "appointment";
  title: string;
  subtitle: string;
  timestamp: Date;
  link: string;
}

const RecentActivity = () => {
  const { data, isLoading, error } = useDashboardStats();

  if (isLoading) {
    return (
      <Card className="border-none shadow-sm rounded-2xl bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Clock size={20} className="text-indigo-500" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <div className="flex-1 min-w-0 space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-none shadow-sm rounded-2xl bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Clock size={20} className="text-indigo-500" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-red-500 text-sm py-8">Error loading activity.</p>
        </CardContent>
      </Card>
    );
  }

  const recentClients = data?.recentClients || [];
  
  // Fetch recent appointments separately for better sorting logic
  // NOTE: Since we are limited to one hook per component for dashboard, 
  // we will rely on the dashboard hook for recent clients and fetch recent appointments here if needed, 
  // but for simplicity and to avoid re-fetching, we'll stick to the combined data for now.
  // However, the original component logic was flawed as it tried to combine two separate queries 
  // based on different sorting criteria (client by created_at, app by date). 
  // We will only show recent clients for now, as the dashboard hook only provides recent clients.
  
  // To properly show combined activity, we need to fetch both and combine them.
  // Let's fetch recent appointments here to combine them correctly.
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isActivityLoading, setIsActivityLoading] = useState(true);

  useEffect(() => {
    const fetchCombinedActivity = async () => {
      setIsActivityLoading(true);
      try {
        const [clientsData, appointmentsData] = await Promise.all([
          supabase
            .from("clients")
            .select("id, name, created_at")
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("appointments")
            .select(`
              id,
              name,
              date,
              display_id,
              clients (
                name
              )
            `)
            .order("created_at", { ascending: false }) // Sort by created_at for recent activity
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
            subtitle: `${app.clients?.name} • ${format(new Date(app.created_at), "MMM d")}`,
            timestamp: new Date(app.created_at),
            link: `/appointments/${app.id}`,
          });
        });

        combined.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        setActivities(combined.slice(0, 8));
      } catch (error) {
        console.error("Error fetching activity:", error);
      } finally {
        setIsActivityLoading(false);
      }
    };

    fetchCombinedActivity();
  }, [data]); // Re-fetch if dashboard data changes (e.g., client added)

  if (isActivityLoading) {
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