import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Search, Loader2, LayoutGrid, List, Users, AlertCircle, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ClientForm from "@/components/crm/ClientForm";
import AppointmentForm from "@/components/crm/AppointmentForm";
import { Client } from "@/types/crm";
import AppLayout from "@/components/crm/AppLayout";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/shared/PageHeader";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import ClientTableView from "@/components/crm/ClientTableView";
import ClientGridView from "@/components/crm/ClientGridView";

interface ClientWithStats extends Client {
  session_count: number;
  last_session_at: string | null;
  latest_bolt: number | null;
}

const ClientsPage = () => {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const { isPrivate } = usePrivacyMode();
  const navigate = useNavigate();
  
  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*, appointments(date, bolt_score, status)')
        .or('is_practitioner.eq.false,is_practitioner.is.null')
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      const mapped = (data || []).map(c => {
        const activeApps = (c.appointments || []).filter((a: any) => a.status !== 'Cancelled');
        const sortedApps = [...activeApps]
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        const latestBoltApp = (c.appointments || [])
          .filter((a: any) => a.bolt_score !== null)
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        return {
          ...c,
          born: c.born ? new Date(c.born) : null,
          suburbs: c.suburbs || [],
          session_count: activeApps.length,
          last_session_at: sortedApps.length > 0 ? sortedApps[0].date : null,
          latest_bolt: latestBoltApp ? latestBoltApp.bolt_score : null
        };
      }) as unknown as ClientWithStats[];
      
      setClients(mapped);
    } catch (err) {
      console.error("Error fetching clients:", err);
      setError("Failed to load clients. Please try again.");
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
        <PageHeader 
          title="Client Database"
          subtitle="Manage your kinesiology client profiles, history, and clinical data."
          icon={Users}
          actions={
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/10 rounded-2xl h-12 px-8 font-black text-xs uppercase tracking-widest">
                  <Plus size={20} className="mr-2" /> New Client
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px] rounded-[2rem] p-0 overflow-hidden">
                <div className="p-8">
                  <DialogHeader className="mb-6">
                    <DialogTitle className="text-2xl font-black">Add New Client</DialogTitle>
                    <DialogDescription className="font-medium">Create a new client profile in your clinical database.</DialogDescription>
                  </DialogHeader>
                  <ClientForm onSuccess={() => { setOpen(false); fetchClients(); }} />
                </div>
              </DialogContent>
            </Dialog>
          }
        />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card p-4 rounded-[2rem] border border-border shadow-sm">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              placeholder="Search by name, email, or suburb..." 
              className="pl-12 bg-muted/50 border-none focus:ring-2 focus:ring-primary h-12 rounded-xl font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 bg-muted p-1.5 rounded-xl">
            <Button 
              variant={view === 'table' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setView('table')}
              className={cn("rounded-lg h-9 px-4 font-bold text-xs uppercase tracking-widest", view === 'table' ? "bg-card text-primary shadow-sm hover:bg-card" : "text-muted-foreground")}
            >
              <List size={16} className="mr-2" /> Table
            </Button>
            <Button 
              variant={view === 'grid' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setView('grid')}
              className={cn("rounded-lg h-9 px-4 font-bold text-xs uppercase tracking-widest", view === 'grid' ? "bg-card text-primary shadow-sm hover:bg-card" : "text-muted-foreground")}
            >
              <LayoutGrid size={16} className="mr-2" /> Grid
            </Button>
          </div>
        </div>

        {error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle size={28} className="text-destructive" />
            </div>
            <p className="text-destructive font-semibold text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={() => { setError(null); setLoading(true); fetchClients(); }} className="rounded-xl text-xs gap-2">
              <RefreshCw size={14} /> Retry
            </Button>
          </div>
        ) : loading ? (
          <div className="p-24 flex flex-col items-center justify-center gap-6">
            <Loader2 className="animate-spin text-primary" size={48} />
            <p className="text-muted-foreground font-black text-xs uppercase tracking-widest">Loading clients...</p>
          </div>
        ) : filteredClients.length > 0 ? (
          view === 'table' ? (
            <ClientTableView 
              clients={filteredClients} 
              isPrivate={isPrivate} 
              onQuickBook={handleQuickBook} 
            />
          ) : (
            <ClientGridView 
              clients={filteredClients} 
              isPrivate={isPrivate} 
              onQuickBook={handleQuickBook} 
            />
          )
        ) : clients.length === 0 ? (
          <div className="text-center py-32 bg-muted/30 rounded-[3rem] border-2 border-dashed border-border">
            <div className="mx-auto w-20 h-20 bg-card rounded-3xl flex items-center justify-center mb-6 shadow-xl">
               <Users className="text-muted-foreground" size={32} />
            </div>
            <p className="text-foreground font-black text-xl">No clients yet</p>
            <p className="text-muted-foreground mt-2 mb-8 font-medium">Add your first client to start building your clinical database.</p>
            <Button className="h-12 px-8 bg-primary hover:bg-primary/90 rounded-2xl font-bold text-primary-foreground" onClick={() => setOpen(true)}>
              <Plus size={18} className="mr-2" /> Add First Client
            </Button>
          </div>
        ) : (
          <div className="text-center py-32 bg-muted/30 rounded-[3rem] border-2 border-dashed border-border">
            <div className="mx-auto w-20 h-20 bg-card rounded-3xl flex items-center justify-center mb-6 shadow-xl">
               <Search className="text-muted-foreground" size={32} />
            </div>
            <p className="text-foreground font-black text-xl">No clients match "{search}"</p>
            <p className="text-muted-foreground mt-2 mb-8 font-medium">Try a different name, email, or suburb.</p>
            <Button variant="outline" className="h-12 px-8 border-border hover:bg-card rounded-2xl font-bold" onClick={() => { setSearch(""); }}>Clear Search</Button>
          </div>
        )}
      </div>

      <Dialog open={bookOpen} onOpenChange={setBookOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-[2rem] p-0 overflow-hidden">
          <div className="p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black">Quick Book Session</DialogTitle>
              <DialogDescription className="font-medium">Schedule a new appointment for this client.</DialogDescription>
            </DialogHeader>
            {selectedClientId && <AppointmentForm initialClientId={selectedClientId} onSuccess={() => { setBookOpen(false); fetchClients(); }} />}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default ClientsPage;