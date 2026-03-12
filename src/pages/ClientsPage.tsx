import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { calculateAge, getStarSign } from "@/utils/crm-utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, Loader2, UserPlus, Activity, CalendarPlus, Clock, LayoutGrid, List, Mail, Phone, MapPin, ArrowRight, ExternalLink } from "lucide-react";
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
  const navigate = useNavigate();
  
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
          suburbs: c.suburbs || [],
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
    c.suburbs.some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Clients</h1>
            <p className="text-muted-foreground font-medium mt-1">Manage your kinesiology client database and history.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20 rounded-2xl h-12 px-8 font-black text-xs uppercase tracking-widest">
                <Plus size={20} className="mr-2" /> New Client
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] rounded-[2rem]">
              <DialogHeader><DialogTitle className="text-2xl font-black">Add New Client</DialogTitle></DialogHeader>
              <ClientForm onSuccess={() => { setOpen(false); fetchClients(); }} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card p-4 rounded-[2rem] border border-border shadow-sm">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              placeholder="Search by name, email, or suburb..." 
              className="pl-12 bg-muted/50 border-none focus:ring-2 focus:ring-indigo-500 h-12 rounded-xl font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 bg-muted p-1.5 rounded-xl">
            <Button 
              variant={view === 'table' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setView('table')}
              className={cn("rounded-lg h-9 px-4 font-bold text-xs uppercase tracking-widest", view === 'table' ? "bg-card text-indigo-600 shadow-sm hover:bg-card" : "text-muted-foreground")}
            >
              <List size={16} className="mr-2" /> Table
            </Button>
            <Button 
              variant={view === 'grid' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setView('grid')}
              className={cn("rounded-lg h-9 px-4 font-bold text-xs uppercase tracking-widest", view === 'grid' ? "bg-card text-indigo-600 shadow-sm hover:bg-card" : "text-muted-foreground")}
            >
              <LayoutGrid size={16} className="mr-2" /> Grid
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="p-24 flex flex-col items-center justify-center gap-6">
            <Loader2 className="animate-spin text-indigo-500" size={48} />
            <p className="text-muted-foreground font-black text-xs uppercase tracking-widest">Loading clients...</p>
          </div>
        ) : filteredClients.length > 0 ? (
          view === 'table' ? (
            <div className="bg-card rounded-[2.5rem] border border-border shadow-xl overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground h-14 px-8">Client Name</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground h-14">Age / Sign</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground h-14">Last Session</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground h-14 text-center">Total</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground h-14 text-right px-8">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group border-border">
                      <TableCell className="px-8 py-5">
                        <Link to={`/clients/${client.id}`} className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-lg font-black uppercase shadow-sm group-hover:bg-card transition-colors">
                            {client.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-foreground text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{client.name}</span>
                            <span className="text-xs text-muted-foreground font-medium">{client.email || 'No email recorded'}</span>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground">{client.born ? `${calculateAge(client.born)} yrs` : "-"}</span>
                          {client.born && (
                            <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                              <Clock size={10} /> {getStarSign(client.born)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                          <CalendarPlus size={14} className="text-indigo-400" />
                          {client.last_session_at ? format(new Date(client.last_session_at), "MMM d, yyyy") : "Never"}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex flex-col items-center px-3 py-1 bg-muted rounded-xl border border-border">
                          <span className="font-black text-foreground">{client.session_count}</span>
                          <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Sessions</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right px-8">
                        <div className="flex items-center justify-end gap-2">
                          {client.email && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20" asChild>
                                  <a href={`mailto:${client.email}`}><Mail size={18} /></a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="rounded-xl font-bold text-xs">Email Client</TooltipContent>
                            </Tooltip>
                          )}
                          {client.phone && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" asChild>
                                  <a href={`tel:${client.phone}`}><Phone size={18} /></a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="rounded-xl font-bold text-xs">Call Client</TooltipContent>
                            </Tooltip>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-9 w-9 rounded-xl text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleQuickBook(client.id); }}
                              >
                                <CalendarPlus size={18} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="rounded-xl font-bold text-xs">Quick Book Session</TooltipContent>
                          </Tooltip>
                          <Link to={`/clients/${client.id}`}>
                            <Button variant="outline" size="sm" className="rounded-xl font-black text-[10px] uppercase tracking-widest border-border hover:bg-card hover:shadow-md ml-2">View Profile</Button>
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
                <Card 
                  key={client.id} 
                  className="hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-none shadow-lg rounded-[2rem] overflow-hidden group cursor-pointer bg-card h-full"
                  onClick={() => navigate(`/clients/${client.id}`)}
                >
                  <CardContent className="p-8 space-y-6">
                    <div className="flex items-start justify-between">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600 text-white flex items-center justify-center text-2xl font-black uppercase shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20 group-hover:scale-110 transition-transform">
                        {client.name.charAt(0)}
                      </div>
                      <div className="flex flex-col items-end">
                        <Badge className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-none font-black text-[10px] uppercase tracking-widest mb-2">
                          {client.session_count} Sessions
                        </Badge>
                        <div className="flex items-center gap-1 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          <Clock size={12} /> {client.last_session_at ? format(new Date(client.last_session_at), "MMM d") : "Never"}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-2xl font-black text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">{client.name}</h3>
                      <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                        {client.born && <span>{calculateAge(client.born)} yrs • {getStarSign(client.born)}</span>}
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-border">
                      {client.email && (
                        <div className="flex items-center justify-between group/contact">
                          <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
                            <Mail size={14} className="text-indigo-400" /> {client.email}
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg opacity-0 group-hover/contact:opacity-100 transition-opacity" asChild onClick={(e) => e.stopPropagation()}>
                            <a href={`mailto:${client.email}`}><ExternalLink size={12} /></a>
                          </Button>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center justify-between group/contact">
                          <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
                            <Phone size={14} className="text-indigo-400" /> {client.phone}
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg opacity-0 group-hover/contact:opacity-100 transition-opacity" asChild onClick={(e) => e.stopPropagation()}>
                            <a href={`tel:${client.phone}`}><ExternalLink size={12} /></a>
                          </Button>
                        </div>
                      )}
                      {client.suburbs.length > 0 && (
                        <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
                          <MapPin size={14} className="text-indigo-400" /> {client.suburbs.join(", ")}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 flex items-center justify-between">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-0 text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest hover:bg-transparent"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleQuickBook(client.id); }}
                      >
                        <CalendarPlus size={14} className="mr-2" /> Quick Book
                      </Button>
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-32 bg-muted/30 rounded-[3rem] border-2 border-dashed border-border">
            <div className="mx-auto w-20 h-20 bg-card rounded-3xl flex items-center justify-center mb-6 shadow-xl">
               <Search className="text-muted-foreground" size={32} />
            </div>
            <p className="text-foreground font-black text-xl">No clients found</p>
            <p className="text-muted-foreground mt-2 mb-8 font-medium">Try adjusting your search or add a new client.</p>
            <Button variant="outline" className="h-12 px-8 border-border hover:bg-card rounded-2xl font-bold" onClick={() => setSearch("")}>Clear Search</Button>
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