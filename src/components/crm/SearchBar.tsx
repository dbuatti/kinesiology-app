"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Search, User, Calendar, Target, Zap, Clock, Trash2, UserPlus, CalendarPlus, Upload, Settings } from "lucide-react";
import { format } from "date-fns";

interface SearchResult {
  type: "client" | "appointment" | "procedure" | "action";
  id: string;
  title: string;
  subtitle?: string;
  path: string;
}

const RECENT_SEARCHES_KEY = "antigravity_recent_searches";

const SearchBar = () => {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse recent searches", e);
      }
    }

    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const saveRecentSearch = (result: SearchResult) => {
    if (result.type === 'action') return; // Don't save generic actions to recent
    const updated = [
      result,
      ...recentSearches.filter((r) => r.id !== result.id || r.type !== result.type),
    ].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const clearRecentSearches = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const handleSearch = async (query: string) => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);

    try {
      const [clientsData, appointmentsData, proceduresData] = await Promise.all([
        supabase
          .from("clients")
          .select("id, name, email")
          .ilike("name", `%${query}%`)
          .limit(5),
        supabase
          .from("appointments")
          .select(`
            id,
            name,
            date,
            display_id,
            clients (
              name
            )
          `)
          .or(`name.ilike.%${query}%,display_id.ilike.%${query}%`)
          .limit(5),
        supabase
          .from("procedures")
          .select("id, name, description")
          .ilike("name", `%${query}%`)
          .limit(3)
      ]);

      const searchResults: SearchResult[] = [];

      if (clientsData.data) {
        clientsData.data.forEach((client) => {
          searchResults.push({
            type: "client",
            id: client.id,
            title: client.name,
            subtitle: client.email || undefined,
            path: `/clients/${client.id}`,
          });
        });
      }

      if (appointmentsData.data) {
        appointmentsData.data.forEach((appointment: any) => {
          searchResults.push({
            type: "appointment",
            id: appointment.id,
            title: appointment.name || appointment.display_id || "Appointment",
            subtitle: `${appointment.clients?.name} • ${format(new Date(appointment.date), "MMM d, yyyy")}`,
            path: `/appointments/${appointment.id}`,
          });
        });
      }

      if (proceduresData.data) {
        proceduresData.data.forEach((proc) => {
          searchResults.push({
            type: "procedure",
            id: proc.id,
            title: proc.name,
            subtitle: "Protocol / Procedure",
            path: `/procedures`,
          });
        });
      }

      setResults(searchResults);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (result: SearchResult) => {
    saveRecentSearch(result);
    setOpen(false);
    navigate(result.path);
  };

  const quickActions: SearchResult[] = [
    { type: "action", id: "new-client", title: "Add New Client", subtitle: "Create a new client profile", path: "/clients" },
    { type: "action", id: "book-session", title: "Book New Session", subtitle: "Schedule an appointment", path: "/appointments" },
    { type: "action", id: "import-data", title: "Import CSV Data", subtitle: "Bulk upload appointments", path: "/import" },
    { type: "action", id: "settings", title: "Settings", subtitle: "Manage account and preferences", path: "/settings" },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden lg:flex items-center gap-2 px-4 py-2 text-sm text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors w-full"
      >
        <Search size={16} />
        <span>Search...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-slate-100 px-1.5 font-mono text-[10px] font-medium text-slate-600">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search clients, sessions, or protocols..."
          onValueChange={handleSearch}
        />
        <CommandList>
          <CommandEmpty>
            {loading ? "Searching..." : "No results found."}
          </CommandEmpty>
          
          {results.length === 0 && (
            <CommandGroup heading="Quick Actions">
              {quickActions.map((action) => (
                <CommandItem
                  key={action.id}
                  onSelect={() => handleSelect(action)}
                >
                  {action.id === 'new-client' && <UserPlus size={16} className="mr-2 text-indigo-500" />}
                  {action.id === 'book-session' && <CalendarPlus size={16} className="mr-2 text-rose-500" />}
                  {action.id === 'import-data' && <Upload size={16} className="mr-2 text-emerald-500" />}
                  {action.id === 'settings' && <Settings size={16} className="mr-2 text-slate-500" />}
                  <div className="flex flex-col">
                    <span className="font-medium">{action.title}</span>
                    <span className="text-xs text-slate-500">{action.subtitle}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results.length === 0 && recentSearches.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup 
                heading={
                  <div className="flex items-center justify-between w-full">
                    <span>Recent Searches</span>
                    <button 
                      onClick={clearRecentSearches}
                      className="text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1"
                    >
                      <Trash2 size={10} /> Clear
                    </button>
                  </div>
                }
              >
                {recentSearches.map((result) => (
                  <CommandItem
                    key={`${result.type}-${result.id}`}
                    onSelect={() => handleSelect(result)}
                  >
                    <Clock size={16} className="mr-2 text-slate-400" />
                    <div className="flex flex-col">
                      <span className="font-medium">{result.title}</span>
                      {result.subtitle && (
                        <span className="text-xs text-slate-500">
                          {result.subtitle}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {results.length > 0 && (
            <>
              <CommandGroup heading="Clients">
                {results
                  .filter((r) => r.type === "client")
                  .map((result) => (
                    <CommandItem
                      key={result.id}
                      onSelect={() => handleSelect(result)}
                    >
                      <User size={16} className="mr-2 text-indigo-500" />
                      <div className="flex flex-col">
                        <span className="font-medium">{result.title}</span>
                        {result.subtitle && (
                          <span className="text-xs text-slate-500">
                            {result.subtitle}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
              </CommandGroup>
              <CommandGroup heading="Sessions">
                {results
                  .filter((r) => r.type === "appointment")
                  .map((result) => (
                    <CommandItem
                      key={result.id}
                      onSelect={() => handleSelect(result)}
                    >
                      <Calendar size={16} className="mr-2 text-rose-500" />
                      <div className="flex flex-col">
                        <span className="font-medium">{result.title}</span>
                        {result.subtitle && (
                          <span className="text-xs text-slate-500">
                            {result.subtitle}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
              </CommandGroup>
              <CommandGroup heading="Protocols">
                {results
                  .filter((r) => r.type === "procedure")
                  .map((result) => (
                    <CommandItem
                      key={result.id}
                      onSelect={() => handleSelect(result)}
                    >
                      <Target size={16} className="mr-2 text-emerald-500" />
                      <div className="flex flex-col">
                        <span className="font-medium">{result.title}</span>
                        <span className="text-xs text-slate-500">
                          {result.subtitle}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default SearchBar;