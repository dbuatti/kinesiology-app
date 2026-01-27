import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { calculateAge, getStarSign } from "@/utils/crm-utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Client } from "@/types/crm";

const ClientsPage = () => {
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      // Map Supabase dates back to JS Dates
      const mapped = (data || []).map(c => ({
        ...c,
        born: new Date(c.born),
        suburb: c.suburbs || []
      })) as unknown as Client[];
      
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

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM_Clients</h1>
          <p className="text-slate-500">Manage your kinesiology client database</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <Plus size={18} className="mr-2" /> New Client
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <Input 
          placeholder="Search by name..." 
          className="pl-10 max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold">Name</TableHead>
                <TableHead>Pronouns</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Star Sign</TableHead>
                <TableHead>Suburb</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-medium">
                    <Link to={`/clients/${client.id}`} className="text-indigo-600 hover:underline">
                      {client.name}
                    </Link>
                  </TableCell>
                  <TableCell>{client.pronouns}</TableCell>
                  <TableCell>{calculateAge(client.born)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {getStarSign(client.born)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {client.suburb.map(s => (
                        <Badge key={s} variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-500">{client.email}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Edit</Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredClients.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                    No clients found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default ClientsPage;