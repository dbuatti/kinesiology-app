import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { calculateAge, getStarSign } from "@/utils/crm-utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, Loader2, UserPlus, Activity, CalendarPlus, Clock, LayoutGrid, List, Mail, Phone, MapPin, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ClientForm from "@/components/crm/ClientForm";
import AppointmentForm from "@/components/crm/AppointmentForm";
import { Client } from "@/types/crm";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import AppLayout from "@/components/crm/AppLayout";
import { cn } from "@/lib/utils";

interface ClientWithStats extends Client {
  session_count: number;
  last_session_at: string | null;
}

const ClientsPage = () => {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  
  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*, appointments(date)')
        .or('is_practitioner.eq.false,is_practitioner.is.null')
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      const mapped = (data || []).map(c => {
        const sortedApps = (c.appointments || [])
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        return {
          ...c,
          born: c.born ? new Date(c.born) : null,
          suburb: c.suburbs || [],
          session_count: c.appointments?.length || 0,
          last_session_at: sortedApps.length > 0 ? sortedApps[0].date : null
        };
      }) as unknown as ClientWithStats[];
      
      setClients(mapped);
    } catch (err) {
      console.error("Error fetching clients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleQuickBook = (clientId: string) => {
    setSelectedClientId(clientId);
    setBookOpen(true);
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.suburb.some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Clients</h1>
            <p className="text-slate-500 font-medium mt-1">Manage your kinesiology client database and history.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 rounded-2xl h-12 px-8 font-black text-xs uppercase tracking-widest">
                <Plus size={20} className="mr-2" /> New Client
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] rounded-[2rem]">
              <DialogHeader><DialogTitle className="text-2xl font-black">Add New Client</DialogTitle></DialogHeader>
              <ClientForm onSuccess={() => { setOpen(false); fetchClients(); }} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Search by name, email, or suburb..." 
              className="pl-12 bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 h-12 rounded-xl font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl">
            <Button 
              variant={view === 'table' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setView('table')}
              className={cn("rounded-lg h-9 px-4 font-bold text-xs uppercase tracking-widest", view === 'table' ? "bg-white text-indigo-600 shadow-sm hover:bg-white" : "text-slate-500")}
            >
              <List size={16} className="mr-2" /> Table
            </Button>
            <Button 
              variant={view === 'grid' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setView('grid')}
              className={cn("rounded-lg h-9 px-4 font-bold text-xs uppercase tracking-widest", view === 'grid' ? "bg-white text-indigo-600 shadow-sm hover:bg-white" : "text-slate-500")}
            >
              <LayoutGrid size={16} className="mr-2" /> Grid
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="p-24 flex flex-col items-center justify-center gap-6">
            <Loader2 className="animate-spin text-indigo-500" size={48} />
            <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Loading clients...</p>
          </div>
        ) : filteredClients.length > 0 ? (
          view === 'table' ? (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-14 px-8">Client Name</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-14">Age / Sign</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-14">Last Session</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-14 text-center">Total</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 h-14 text-right px-8">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id} className="hover:bg-indigo-50/30 transition-colors group border-slate-50">
                      <TableCell className="px-8 py-5">
                        <Link to={`/clients/${client.id}`} className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg font-black uppercase shadow-sm group-hover:bg-white transition-colors">
                            {client.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">{client.name}</span>
                            <span className="text-xs text-slate-400 font-medium">{client.email || 'No email recorded'}</span>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-700">{client.born ? `${calculateAge(client.born)} yrs` : "-"}</span>
                          {client.born && (
                            <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider flex items-center gap-1">
                              <Clock size={10} /> {getStarSign(client.born)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                          <CalendarPlus size={14} className="text-indigo-400" />
                          {client.last_session_at ? format(new Date(client.last_session_at), "MMM d, yyyy") : "Never"}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex flex-col items-center px-3 py-1 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="font-black text-slate-900">{client.session_count}</span>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sessions</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right px-8">
                        <div className="flex items-center justify-end gap-3">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-10 w-10 rounded-xl text-indigo-600 hover:bg-white hover:shadow-md transition-all"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleQuickBook(client.id); }}
                              >
                                <CalendarPlus size={20} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="rounded-xl font-bold text-xs">Quick Book Session</TooltipContent>
                          </Tooltip>
                          <Link to={`/clients/${client.id}`}>
                            <Button variant="outline" size="sm" className="rounded-xl font-black text-[10px] uppercase tracking-widest border-slate-200 hover:bg-white hover:shadow-md">View Profile</Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClients.map((client) => (
                <Link key={client.id} to={`/clients/${client.id}`}>
                  <Card className="hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-none shadow-lg rounded-[2rem] overflow-hidden group cursor-pointer bg-white h-full">
                    <CardContent className="p-8 space-y-6">
                      <div className="flex items-start justify-between">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600 text-white flex items-center justify-center text-2xl font-black uppercase shadow-xl shadow-indigo-100 group-hover:scale-110 transition-transform">
                          {client.name.charAt(0)}
                        </div>
                        <div className="flex flex-col items-end">
                          <Badge className="bg-emerald-50 text-emerald-700 border-none font-black text-[10px] uppercase tracking-widest mb-2">
                            {client.session_count} Sessions
                          </Badge>
                          <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <Clock size={12} /> {client.last_session_at ? format(new Date(client.last_session_at), "MMM d") : "Never"}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{client.name}</h3>
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                          {client.born && <span>{calculateAge(client.born)} yrs • {getStarSign(client.born)}</span>}
                        </div>
                      </div>

                      <div className="space-y-3 pt-4 border-t border-slate-50">
                        {client.email && (
                          <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                            <Mail size={14} className="text-indigo-400" /> {client.email}
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                            <Phone size={14} className="text-indigo-400" /> {client.phone}
                          </div>
                        )}
                        {client.suburb.length > 0 && (
                          <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                            <MapPin size={14} className="text-indigo-400" /> {client.suburb.join(", ")}
                          </div>
                        )}
                      </div>

                      <div className="pt-4 flex items-center justify-between">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="p-0 text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:bg-transparent"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleQuickBook(client.id); }}
                        >
                          <CalendarPlus size={14} className="mr-2" /> Quick Book
                        </Button>
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          <ArrowRight size={16} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-32 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <div className="mx-auto w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-xl">
               <Search className="text-slate-300" size={32} />
            </div>
            <p className="text-slate-900 font-black text-xl">No clients found</p>
            <p className="text-slate-500 mt-2 mb-8">Try adjusting your search or add a new client.</p>
            <Button variant="outline" className="h-12 px-8 border-slate-200 hover:bg-white rounded-2xl font-bold" onClick={() => setSearch("")}>Clear Search</Button>
          </div>
        )}
      </div>

      <Dialog open={bookOpen} onOpenChange={setBookOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2rem]">
          <DialogHeader><DialogTitle className="text-2xl font-black">Quick Book Session</DialogTitle></DialogHeader>
          {selectedClientId && <AppointmentForm initialClientId={selectedClientId} onSuccess={() => { setBookOpen(false); fetchClients(); }} />}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default ClientsPage;