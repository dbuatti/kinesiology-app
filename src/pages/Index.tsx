import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Activity, TrendingUp, Loader2, Plus, ArrowRight, UserPlus, Sparkles } from "lucide-react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Client, Appointment } from "@/types/crm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ClientForm from "@/components/crm/ClientForm";
import AppointmentForm from "@/components/crm/AppointmentForm";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

const Index = () => {
  const [stats, setStats] = useState({ clients: 0, appointments: 0 });
  const [recentClients, setRecentClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [appDialogOpen, setAppDialogOpen] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      const [{ count: clientCount }, { count: appCount }, { data: recent }, { data: allApps }] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact', head: true }),
        supabase.from('appointments').select('*', { count: 'exact', head: true }),
        supabase.from('clients').select('*').order('created_at', { ascending: false }).limit(4),
        supabase.from('appointments').select('date').order('date', { ascending: true })
      ]);

      setStats({ 
        clients: clientCount || 0, 
        appointments: appCount || 0 
      });
      setRecentClients(recent as unknown as Client[] || []);

      // Process chart data for last 6 months
      const months = Array.from({ length: 6 }).map((_, i) => {
        const d = subMonths(new Date(), 5 - i);
        return {
          name: format(d, "MMM"),
          sessions: 0,
          date: d
        };
      });

      allApps?.forEach(app => {
        const appDate = new Date(app.date);
        const monthIndex = months.findIndex(m => 
          appDate.getMonth() === m.date.getMonth() && 
          appDate.getFullYear() === m.date.getFullYear()
        );
        if (monthIndex !== -1) {
          months[monthIndex].sessions += 1;
        }
      });

      setChartData(months);
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
        <p className="text-slate-500 font-medium animate-pulse">Synchronizing Antigravity...</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Practice Hub</h1>
          <p className="text-slate-500 font-medium">Insights and activity for your kinesiology practice.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 rounded-xl"
            onClick={() => setClientDialogOpen(true)}
          >
            <UserPlus size={18} className="mr-2" /> New Client
          </Button>
          <Button 
            variant="outline" 
            className="border-slate-200 bg-white rounded-xl hover:bg-slate-50"
            onClick={() => setAppDialogOpen(true)}
          >
            <Plus size={18} className="mr-2" /> Book Session
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Active Clients", val: stats.clients, icon: Users, color: "bg-indigo-50 text-indigo-600", border: "bg-indigo-500" },
          { label: "Total Sessions", val: stats.appointments, icon: Activity, color: "bg-emerald-50 text-emerald-600", border: "bg-emerald-500" },
          { label: "This Month", val: chartData[chartData.length - 1]?.sessions || 0, icon: Calendar, color: "bg-amber-50 text-amber-600", border: "bg-amber-500" },
          { label: "Retention Rate", val: "92%", icon: TrendingUp, color: "bg-rose-50 text-rose-600", border: "bg-rose-500" }
        ].map((stat, i) => (
          <Card key={i} className={`border-none shadow-sm overflow-hidden relative group rounded-2xl`}>
             <div className={`absolute top-0 left-0 w-1.5 h-full ${stat.border}`} />
             <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                  <h4 className="text-3xl font-black mt-1 text-slate-900">{stat.val}</h4>
                </div>
                <div className={`p-3 ${stat.color} rounded-2xl transition-all group-hover:scale-110 shadow-sm`}>
                  <stat.icon size={22} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm rounded-2xl overflow-hidden bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Session Activity</CardTitle>
            <CardDescription>Volume of appointments over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] mt-4">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 12, fill: '#94a3b8'}}
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 12, fill: '#94a3b8'}}
                    />
                    <Tooltip 
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="sessions" 
                        stroke="#4f46e5" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorSessions)" 
                    />
                </AreaChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="space-y-6">
            <Card className="border-none shadow-xl bg-slate-950 text-white overflow-hidden rounded-2xl relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Sparkles size={100} />
                </div>
                <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    Quick Action
                </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 relative z-10">
                <p className="text-slate-400 text-sm leading-relaxed">Book a session or update your practice records in seconds.</p>
                <Button 
                    variant="secondary" 
                    className="w-full bg-indigo-600 text-white hover:bg-indigo-700 border-none rounded-xl h-11 font-bold shadow-lg shadow-indigo-950/20"
                    onClick={() => setAppDialogOpen(true)}
                >
                    Log New Session
                </Button>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl bg-white">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold">Recent Sign-ups</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                    {recentClients.map(client => (
                        <div key={client.id} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-xs uppercase group-hover:bg-indigo-100 transition-colors">
                                {client.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{client.name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{client.suburb?.[0] || 'Remote'}</p>
                                </div>
                            </div>
                            <Link to={`/clients/${client.id}`}>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-indigo-50 hover:text-indigo-600">
                                    <ArrowRight size={16} />
                                </Button>
                            </Link>
                        </div>
                    ))}
                    {recentClients.length === 0 && (
                        <p className="text-center text-slate-400 text-sm py-4">No clients yet.</p>
                    )}
                    </div>
                    <Link to="/clients" className="mt-6 block text-center">
                        <Button variant="ghost" className="text-indigo-600 text-xs font-bold hover:bg-indigo-50 rounded-xl w-full">
                            VIEW ALL CLIENTS
                        </Button>
                    </Link>
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