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
} from "@/components/ui/command";
import { Search, User, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";

interface SearchResult {
  type: "client" | "appointment";
  id: string;
  title: string;
  subtitle?: string;
  path: string;
}

const fetchSearchResults = async (query: string): Promise<SearchResult[]> => {
  if (!query || query.length < 2) {
    return [];
  }

  const [clientsData, appointmentsData] = await Promise.all([
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

  return searchResults;
};

const SearchBar = () => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 300);
  const navigate = useNavigate();

  const { data: results, isLoading } = useQuery<SearchResult[], Error>({
    queryKey: ['globalSearch', debouncedQuery],
    queryFn: () => fetchSearchResults(debouncedQuery),
    enabled: open && debouncedQuery.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

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

  const handleSelect = (path: string) => {
    setOpen(false);
    setSearchQuery("");
    navigate(path);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden lg:flex items-center gap-2 px-4 py-2 text-sm text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
      >
        <Search size={16} />
        <span>Search...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-slate-100 px-1.5 font-mono text-[10px] font-medium text-slate-600">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search clients and appointments..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>
            {isLoading ? "Searching..." : "No results found."}
          </CommandEmpty>
          {results && results.length > 0 && (
            <>
              <CommandGroup heading="Clients">
                {results
                  .filter((r) => r.type === "client")
                  .map((result) => (
                    <CommandItem
                      key={result.id}
                      onSelect={() => handleSelect(result.path)}
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
              <CommandGroup heading="Appointments">
                {results
                  .filter((r) => r.type === "appointment")
                  .map((result) => (
                    <CommandItem
                      key={result.id}
                      onSelect={() => handleSelect(result.path)}
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
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default SearchBar;