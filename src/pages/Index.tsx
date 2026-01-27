import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Activity, TrendingUp, Loader2, Plus, ArrowRight, UserPlus } from "lucide-react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Client } from "@/types/crm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ClientForm from "@/components/crm/ClientForm";
import AppointmentForm from "@/components/crm/AppointmentForm";

const Index = () => {
  const [stats, setStats] = useState({ clients: 0, appointments: 0 });
  const [recentClients, setRecentClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [appDialogOpen, setAppDialogOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [{ count: clientCount }, { count: appCount }, { data: recent }] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact', head: true }),
        supabase.from('appointments').select('*', { count: 'exact', head: true }),
        supabase.from('clients').select('*').order('created_at', { ascending: false }).limit(4)
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
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center space-y-4">
        <Loader2 className="animate-spin text-indigo-500 mx-auto" size={48} />
        <p className="text-slate-500 font-medium animate-pulse">Initializing Antigravity...</p>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Welcome back! Here's a summary of your practice.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100"
            onClick={() => setClientDialogOpen(true)}
          >
            <UserPlus size={18} className="mr-2" /> Add Client
          </Button>
          <Button 
            variant="outline" 
            className="border-slate-200 bg-white"
            onClick={() => setAppDialogOpen(true)}
          >
            <Plus size={18} className="mr-2" /> New Session
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Clients", val: stats.clients, icon: Users, color: "bg-indigo-50 text-indigo-600", border: "border-indigo-500" },
          { label: "Sessions Done", val: stats.appointments, icon: Activity, color: "bg-emerald-50 text-emerald-600", border: "border-emerald-500" },
          { label: "Upcoming", val: 0, icon: Calendar, color: "bg-amber-50 text-amber-600", border: "border-amber-500" },
          { label: "New Leads", val: "+0%", icon: TrendingUp, color: "bg-rose-50 text-rose-600", border: "border-rose-500" }
        ].map((stat, i) => (
          <Card key={i} className={`border-none shadow-sm overflow-hidden relative group`}>
             <div className={`absolute top-0 left-0 w-1 h-full ${stat.border.replace('border-', 'bg-')}`} />
             <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                  <h4 className="text-3xl font-bold mt-1 text-slate-900">{stat.val}</h4>
                </div>
                <div className={`p-3 ${stat.color} rounded-2xl transition-transform group-hover:scale-110`}>
                  <stat.icon size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-bold">Recent Clients</CardTitle>
            <Link to="/clients" className="text-indigo-600 text-sm font-medium hover:underline flex items-center">
              View All <ArrowRight size={14} className="ml-1" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentClients.map(client => (
                <div key={client.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold uppercase">
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{client.name}</p>
                      <p className="text-xs text-slate-500 font-medium">{client.email || 'No email provided'}</p>
                    </div>
                  </div>
                  <Link to={`/clients/${client.id}`}>
                    <Button variant="ghost" size="sm" className="text-indigo-600">Profile</Button>
                  </Link>
                </div>
              ))}
              {recentClients.length === 0 && (
                 <div className="text-center py-10">
                    <p className="text-slate-400">No clients yet.</p>
                    <Button variant="link" onClick={() => setClientDialogOpen(true)}>Add your first client</Button>
                 </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-indigo-600 text-white overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg">Quick Session</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-indigo-100 text-sm">Need to log a session quickly? Start here to pick a client and tag.</p>
              <Button 
                variant="secondary" 
                className="w-full bg-white text-indigo-600 hover:bg-indigo-50 border-none"
                onClick={() => setAppDialogOpen(true)}
              >
                Schedule Session
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">App Navigation</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-28 flex flex-col gap-3 rounded-2xl border-slate-100 hover:bg-slate-50 hover:border-indigo-100 transition-all group" asChild>
                <Link to="/clients">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:scale-110 transition-transform">
                    <Users size={20} />
                  </div>
                  <span className="font-bold text-slate-700">Client List</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-28 flex flex-col gap-3 rounded-2xl border-slate-100 hover:bg-slate-50 hover:border-emerald-100 transition-all group" asChild>
                <Link to="/appointments">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:scale-110 transition-transform">
                    <Calendar size={20} />
                  </div>
                  <span className="font-bold text-slate-700">Schedule</span>
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
          </DialogHeader>
          <ClientForm 
            onSuccess={() => {
              setClientDialogOpen(false);
              fetchDashboardData();
            }} 
          />
        </DialogContent>
      </Dialog>

      <Dialog open={appDialogOpen} onOpenChange={setAppDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule New Session</DialogTitle>
          </DialogHeader>
          <AppointmentForm 
            onSuccess={() => {
              setAppDialogOpen(false);
              fetchDashboardData();
            }} 
          />
        </DialogContent>
      </Dialog>
      
      <MadeWithDyad />
    </div>
  );
};

export default Index;