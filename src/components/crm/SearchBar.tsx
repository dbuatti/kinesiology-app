"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAppMode } from "@/components/ModeProvider";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { 
  Search, User, Calendar, Zap, Clock, 
  LayoutDashboard, Settings
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const SearchBar = () => {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { mode } = useAppMode();
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSearch = async (query: string) => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const [clientsData, appointmentsData] = await Promise.all([
        supabase.from("clients").select("id, name").ilike("name", `%${query}%`).limit(3),
        supabase.from("appointments").select("id, name, date, clients(name)").ilike("name", `%${query}%`).limit(3)
      ]);
      const searchResults: any[] = [];
      clientsData.data?.forEach(c => searchResults.push({ type: 'client', id: c.id, title: c.name, path: `/clients/${c.id}`, icon: User }));
      appointmentsData.data?.forEach((a: any) => searchResults.push({ type: 'session', id: a.id, title: `${a.clients?.name} - ${format(new Date(a.date), "MMM d")}`, path: `/appointments/${a.id}`, icon: Calendar }));
      setResults(searchResults);
    } catch (e) {} finally { setLoading(false); }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 px-3 py-1.5 border border-border hover:bg-muted transition-colors w-full group"
      >
        <Search size={14} className="text-slate-400 group-hover:text-primary" />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Search...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-4 select-none items-center gap-1 bg-slate-100 px-1.5 font-mono text-[9px] font-black text-slate-400">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center border-b border-slate-900 px-4 bg-slate-900">
          <Search className="mr-3 h-4 w-4 shrink-0 text-indigo-400" />
          <CommandInput
            placeholder="Type a command or search..."
            className="flex h-14 w-full bg-transparent py-4 text-sm outline-none text-white placeholder:text-white/20"
            onValueChange={handleSearch}
          />
        </div>
        <CommandList className="max-h-[400px] p-0 rounded-none">
          <CommandEmpty className="py-10 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">No results found.</CommandEmpty>
          
          {results.length === 0 && (
            <CommandGroup heading={<span className="label-caps px-2">Quick Navigation</span>}>
              {[
                { title: "Dashboard", path: "/", icon: LayoutDashboard },
                { title: "Clients", path: "/clients", icon: User },
                { title: "Schedule", path: "/schedule", icon: Calendar },
                { title: "Settings", path: "/settings", icon: Settings },
              ].map((action) => (
                <CommandItem
                  key={action.path}
                  onSelect={() => { setOpen(false); navigate(action.path); }}
                  className="py-3 px-4 cursor-pointer border-b border-slate-50 last:border-b-0 focus:bg-slate-50 rounded-none"
                >
                  <action.icon size={16} className="mr-4 text-primary" />
                  <span className="font-black text-[10px] uppercase tracking-widest">{action.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results.length > 0 && (
            <CommandGroup heading={<span className="label-caps px-2">Search Results</span>}>
              {results.map((res) => (
                <CommandItem
                  key={res.id}
                  onSelect={() => { setOpen(false); navigate(res.path); }}
                  className="py-3 px-4 cursor-pointer border-b border-slate-50 last:border-b-0 focus:bg-slate-50 rounded-none"
                >
                  <res.icon size={16} className="mr-4 text-primary" />
                  <span className="font-black text-[10px] uppercase tracking-widest">{res.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default SearchBar;