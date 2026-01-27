import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { calculateAge, getStarSign, getClientRollups } from "@/utils/crm-utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Mail, Phone, MapPin, Calendar, Clock, Star, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Client, Appointment } from "@/types/crm";

const ClientDetailPage = () => {
  const { id } = useParams();
  const [client, setClient] = useState<Client | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClientData = async () => {
    try {
      // Fetch Client
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (clientError) throw clientError;

      // Fetch Related Appointments
      const { data: appData, error: appError } = await supabase
        .from('appointments')
        .select('*')
        .eq('client_id', id)
        .order('date', { ascending: false });

      if (appError) throw appError;

      setClient({
        ...clientData,
        born: new Date(clientData.born),
        suburb: clientData.suburbs || []
      } as unknown as Client);

      setAppointments((appData || []).map(a => ({
        ...a,
        date: new Date(a.date)
      })) as unknown as Appointment[]);

    } catch (err) {
      console.error("Error fetching client details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientData();
  }, [id]);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="animate-spin text-indigo-500" size={48} />
    </div>
  );

  if (!client) return <div className="p-12 text-center">Client not found</div>;

  const rollups = getClientRollups(appointments);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link to="/clients">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={18} className="mr-2" /> Back
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="overflow-hidden border-none shadow-lg">
            <div className="h-24 bg-indigo-600" />
            <CardContent className="pt-0 -mt-12 text-center space-y-4">
              <div className="inline-block p-1 bg-white rounded-full shadow-md">
                <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center text-3xl font-bold text-indigo-600">
                  {client.name.charAt(0)}
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold">{client.name}</h2>
                <p className="text-slate-500 font-medium">{client.pronouns}</p>
              </div>
              <div className="flex justify-center gap-2">
                <Badge className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-none">
                  {calculateAge(client.born)} years old
                </Badge>
                <Badge variant="outline" className="flex gap-1 items-center">
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                  {getStarSign(client.born)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail size={16} className="text-slate-400" />
                <span>{client.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone size={16} className="text-slate-400" />
                <span>{client.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin size={16} className="text-slate-400" />
                <div className="flex gap-1">
                  {client.suburb.map(s => <span key={s}>{s}</span>)}
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar size={16} className="text-slate-400" />
                <span>Born: {format(client.born, "MMMM d, yyyy")}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 text-white">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Session Rollups
                <Badge variant="outline" className="border-slate-700 text-slate-300">
                  {rollups.totalSessions} sessions
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Last Session</label>
                <p className="text-lg font-medium text-indigo-300">{rollups.lastAppointment}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">All History</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {rollups.allAppointmentDates.map((date, i) => (
                    <Badge key={i} className="bg-slate-800 text-slate-400 hover:text-white border-none">
                      {date}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Related to Appointments</h3>
            <Button size="sm" className="bg-indigo-600">
              <Plus size={16} className="mr-2" /> Book Session
            </Button>
          </div>

          <div className="grid gap-4">
            {appointments.map(app => (
              <Card key={app.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="font-bold">{(app as any).display_id || app.id.slice(0,8)}</Badge>
                        <span className="font-bold">{format(app.date, "MMM d, yyyy")}</span>
                        <Badge variant="outline">{app.tag}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1"><Clock size={14} /> {format(app.date, "h:mm a")}</span>
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-medium">{app.status}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm border-t pt-4">
                    <div>
                      <p className="font-bold text-slate-400 uppercase text-[10px] mb-1">Goal/Issue</p>
                      <p className="text-slate-700">{app.goal} • {app.issue}</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-400 uppercase text-[10px] mb-1">Acupoints</p>
                      <p className="text-slate-700 font-mono">{app.acupoints}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 bg-slate-50 p-3 rounded-lg text-sm italic text-slate-600">
                     " {app.notes} "
                  </div>
                </CardContent>
              </Card>
            ))}
            {appointments.length === 0 && (
              <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                <p className="text-slate-400">No appointments linked to this client yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetailPage;