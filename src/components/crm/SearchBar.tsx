"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { TCM_CHANNELS } from "@/data/tcm-channel-data";
import { useAppMode } from "@/components/ModeProvider";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { 
  Search, User, Calendar, Target, Zap, Clock, Trash2, 
  UserPlus, CalendarPlus, Settings, Layers, 
  ShieldCheck, Mic, Activity, BookOpen,
  Fingerprint, LayoutDashboard
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface SearchResult {
  type: "client" | "appointment" | "procedure" | "action" | "channel" | "page" | "mode";
  id: string;
  title: string;
  subtitle?: string;
  path: string;
  icon?: any;
  color?: string;
}

const RECENT_SEARCHES_KEY = "antigravity_recent_searches";

const SearchBar = () => {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { mode, setMode } = useAppMode();
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
    if (result.type === 'action' || result.type === 'mode') return; 
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

      // Mode Switching
      if ("clinical hub".includes(query.toLowerCase())) {
        searchResults.push({ type: "mode", id: "clinical", title: "Switch to Clinical Hub", subtitle: "Practice management", path: "/", icon: Activity });
      }
      if ("practice lab".includes(query.toLowerCase())) {
        searchResults.push({ type: "mode", id: "lab", title: "Switch to Practice Lab", subtitle: "Personal integration", path: "/", icon: Zap });
      }
      if ("knowledge hub".includes(query.toLowerCase())) {
        searchResults.push({ type: "mode", id: "library", title: "Switch to Knowledge Hub", subtitle: "Protocols & study", path: "/", icon: BookOpen });
      }

      // Pages
      if ("peace framework".includes(query.toLowerCase())) {
        searchResults.push({ type: "page", id: "peace-framework", title: "The PEACE Framework", subtitle: "Clinical Methodology Guide", path: "/peace-framework", icon: ShieldCheck });
      }
      if ("marketing engine".includes(query.toLowerCase())) {
        searchResults.push({ type: "page", id: "marketing-engine", title: "AI Marketing Engine", subtitle: "Voice to Notion Workflow", path: "/business/marketing-engine", icon: Mic });
      }

      // TCM Channels
      const matchingChannels = TCM_CHANNELS.filter(c => 
        c.name.toLowerCase().includes(query.toLowerCase()) || 
        c.code.toLowerCase().includes(query.toLowerCase())
      );
      matchingChannels.forEach(c => {
        searchResults.push({ type: "channel", id: c.id, title: `${c.name} Meridian`, subtitle: `${c.element} Element • ${c.peakTime}`, path: `/resources?tab=channels`, icon: Layers });
      });

      if (clientsData.data) {
        clientsData.data.forEach((client) => {
          searchResults.push({ type: "client", id: client.id, title: client.name, subtitle: client.email || undefined, path: `/clients/${client.id}`, icon: User });
        });
      }

      if (appointmentsData.data) {
        appointmentsData.data.forEach((appointment: any) => {
          searchResults.push({ type: "appointment", id: appointment.id, title: appointment.name || appointment.display_id || "Appointment", subtitle: `${appointment.clients?.name} • ${format(new Date(appointment.date), "MMM d, yyyy")}`, path: `/appointments/${appointment.id}`, icon: Calendar });
        });
      }

      if (proceduresData.data) {
        proceduresData.data.forEach((proc) => {
          searchResults.push({ type: "procedure", id: proc.id, title: proc.name, subtitle: "Protocol / Procedure", path: `/practice/procedures`, icon: Target });
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
    if (result.type === 'mode') {
      setMode(result.id as any);
      setOpen(false);
      navigate('/');
      return;
    }
    saveRecentSearch(result);
    setOpen(false);
    navigate(result.path);
  };

  const getQuickActions = (): SearchResult[] => {
    const baseActions: SearchResult[] = [
      { type: "action", id: "dashboard", title: "Go to Dashboard", subtitle: "Main overview", path: "/", icon: LayoutDashboard },
      { type: "action", id: "settings", title: "System Settings", subtitle: "Account & preferences", path: "/settings", icon: Settings },
    ];

    if (mode === 'clinical') {
      return [
        { type: "action", id: "new-client", title: "Add New Client", subtitle: "Create profile", path: "/clients", icon: UserPlus },
        { type: "action", id: "book-session", title: "Book New Session", subtitle: "Schedule appointment", path: "/appointments", icon: CalendarPlus },
        ...baseActions
      ];
    }

    if (mode === 'lab') {
      return [
        { type: "action", id: "morning-program", title: "Morning Program", subtitle: "Daily readiness", path: "/morning-program", icon: Zap },
        { type: "action", id: "identity-shifting", title: "Identity Shifting", subtitle: "Sandbox tool", path: "/sandbox/identity-shifting", icon: Fingerprint },
        ...baseActions
      ];
    }

    return [
      { type: "action", id: "quiz", title: "Start Infinite Quiz", subtitle: "Mastery practice", path: "/practice/quiz", icon: Zap },
      { type: "action", id: "bible", title: "Clinical Bible", subtitle: "Reference guide", path: "/resources", icon: BookOpen },
      ...baseActions
    ];
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden lg:flex items-center gap-4 px-4 py-2 border border-border hover:bg-muted transition-colors w-full group"
      >
        <Search size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Command Center...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 bg-muted px-2 font-mono text-[10px] font-bold text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center border-b border-border px-4">
          <Search className="mr-3 h-4 w-4 shrink-0 text-muted-foreground" />
          <CommandInput
            placeholder="Search anything or type a command..."
            className="flex h-14 w-full bg-transparent py-4 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            onValueChange={handleSearch}
          />
        </div>
        <CommandList className="max-h-[450px] p-0">
          <CommandEmpty>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Activity className="animate-pulse text-primary" size={24} />
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Searching the Oracle...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-tight">No results found.</p>
              </div>
            )}
          </CommandEmpty>
          
          {results.length === 0 && (
            <CommandGroup heading={
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary">
                <span>Contextual Actions ({mode})</span>
              </div>
            }>
              {getQuickActions().map((action) => (
                <CommandItem
                  key={action.id}
                  onSelect={() => handleSelect(action)}
                  className="py-4 px-4 cursor-pointer border-b border-border last:border-b-0 focus:bg-muted"
                >
                  <action.icon size={18} className="mr-4 text-primary" />
                  <div className="flex flex-col">
                    <span className="font-bold text-xs uppercase tracking-tight">{action.title}</span>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{action.subtitle}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results.length === 0 && recentSearches.length > 0 && (
            <>
              <CommandSeparator className="bg-border" />
              <CommandGroup 
                heading={
                  <div className="flex items-center justify-between w-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock size={12} />
                      <span>Recent Searches</span>
                    </div>
                    <button 
                      onClick={clearRecentSearches}
                      className="hover:text-destructive transition-colors flex items-center gap-1"
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
                    className="py-4 px-4 cursor-pointer border-b border-border last:border-b-0 focus:bg-muted"
                  >
                    <Clock size={18} className="mr-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="font-bold text-xs uppercase tracking-tight">{result.title}</span>
                      {result.subtitle && (
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
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
            <div className="p-0">
              {["mode", "page", "client", "appointment", "procedure", "channel"].map(type => {
                const filtered = results.filter(r => r.type === type);
                if (filtered.length === 0) return null;
                
                return (
                  <CommandGroup key={type} heading={
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                      {type}s
                    </span>
                  }>
                    {filtered.map((result) => (
                      <CommandItem
                        key={result.id}
                        onSelect={() => handleSelect(result)}
                        className="py-4 px-4 cursor-pointer border-b border-border last:border-b-0 focus:bg-muted"
                      >
                        {result.icon ? <result.icon size={18} className="mr-4 text-primary" /> : <Search size={18} className="mr-4 text-muted-foreground" />}
                        <div className="flex flex-col">
                          <span className="font-bold text-xs uppercase tracking-tight">{result.title}</span>
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                            {result.subtitle}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })}
            </div>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default SearchBar;