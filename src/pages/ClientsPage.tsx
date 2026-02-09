import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { calculateAge, getStarSign } from "@/utils/crm-utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Search, Loader2, UserPlus, Sparkles, Activity } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ClientForm from "@/components/crm/ClientForm";
import { Client } from "@/types/crm";

interface ClientWithStats extends Client {
  session_count: number;
}

const ClientsPage = () => {
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  
  const fetchClients = async () => {
    try {
      // Fetch clients and their appointment counts
      const { data, error } = await supabase
        .from('clients')
        .select('*, appointments(count)')
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      const mapped = (data || []).map(c => ({
        ...c,
        born: c.born ? new Date(c.born) : null,
        suburb: c.suburbs || [],
        session_count: c.appointments?.[0]?.count || 0
      })) as unknown as ClientWithStats[];
      
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

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "n" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.suburb.some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Clients</h1>
          <p className="text-slate-500">Manage your kinesiology client database</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100">
              <Plus size={18} className="mr-2" /> New Client
              <kbd className="ml-2 hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-indigo-700 px-1.5 font-mono text-[10px] font-medium text-white opacity-80">
                ⌘N
              </kbd>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
            </DialogHeader>
            <ClientForm 
              onSuccess={() => {
                setOpen(false);
                fetchClients();
              }} 
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Search by name, email, or suburb..." 
            className="pl-10 bg-white border-slate-200 focus:ring-indigo-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="text-sm text-slate-500 font-medium">
          {filteredClients.length} {filteredClients.length === 1 ? 'client' : 'clients'} found
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
            <p className="text-slate-400 animate-pulse">Loading clients...</p>
          </div>
        ) : filteredClients.length > 0 ? (
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-semibold text-slate-900">Name</TableHead>
                <TableHead className="text-slate-600">Age / Sign</TableHead>
                <TableHead className="text-slate-600">Suburb</TableHead>
                <TableHead className="text-slate-600 text-center">Sessions</TableHead>
                <TableHead className="text-slate-600 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                  <TableCell className="font-medium">
                    <Link to={`/clients/${client.id}`} className="text-indigo-600 hover:text-indigo-800 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold uppercase">
                        {client.name.charAt(0)}
                      </div>
                      {client.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm text-slate-700">{client.born ? `${calculateAge(client.born)} yrs` : "-"}</span>
                      {client.born && (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{getStarSign(client.born)}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {client.suburb.slice(0, 2).map(s => (
                        <Badge key={s} variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-none text-[10px]">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-black text-slate-900">{client.session_count}</span>
                      <Activity size={12} className="text-indigo-400" />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link to={`/clients/${client.id}`}>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600">
                        View Profile
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-20 bg-slate-50/50">
            <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
               <Search className="text-slate-400" size={24} />
            </div>
            <p className="text-slate-900 font-medium">No clients found</p>
            <Button variant="outline" className="mt-4" onClick={() => setSearch("")}>Clear Search</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientsPage;