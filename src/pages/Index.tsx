import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Activity, TrendingUp, Loader2 } from "lucide-react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Client } from "@/types/crm";

const Index = () => {
  const [stats, setStats] = useState({ clients: 0, appointments: 0 });
  const [recentClients, setRecentClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [{ count: clientCount }, { count: appCount }, { data: recent }] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact', head: true }),
        supabase.from('appointments').select('*', { count: 'exact', head: true }),
        supabase.from('clients').select('*').order('created_at', { ascending: false }).limit(3)
      ]);

      setStats({ 
        clients: clientCount || 0, 
        appointments: appCount || 0 
      });
      setRecentClients(recent as unknown as Client[] || []);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="animate-spin text-indigo-500" size={48} />
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Antigravity Dashboard</h1>
        <p className="text-slate-500">Welcome back! Here is what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-indigo-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase">Total Clients</p>
                <h4 className="text-3xl font-bold">{stats.clients}</h4>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Users size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-emerald-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase">Sessions Done</p>
                <h4 className="text-3xl font-bold">{stats.appointments}</h4>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Activity size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-amber-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase">Upcoming</p>
                <h4 className="text-3xl font-bold">0</h4>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Calendar size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-rose-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase">New Leads</p>
                <h4 className="text-3xl font-bold">+0%</h4>
              </div>
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <TrendingUp size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentClients.map(client => (
                <div key={client.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold">{client.name}</p>
                      <p className="text-xs text-slate-500">{client.email}</p>
                    </div>
                  </div>
                  <Link to={`/clients/${client.id}`}>
                    <Button variant="ghost" size="sm">View</Button>
                  </Link>
                </div>
              ))}
              {recentClients.length === 0 && (
                 <p className="text-center py-4 text-slate-500">No clients yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-24 flex flex-col gap-2" asChild>
              <Link to="/clients">
                <Users size={24} className="text-indigo-500" />
                <span>Client List</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2" asChild>
              <Link to="/appointments">
                <Calendar size={24} className="text-emerald-500" />
                <span>Schedule</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <MadeWithDyad />
    </div>
  );
};

export default Index;