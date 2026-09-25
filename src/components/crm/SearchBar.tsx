
import { useState, useEffect } from "react"; import type { MouseEvent } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
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
  UserPlus, CalendarPlus, Upload, Settings, Layers, 
  ShieldCheck, Mic, Sparkles, Activity, BookOpen,
  Fingerprint, Heart, Brain, LayoutDashboard, CalendarDays, Users
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SearchResult {
  type: "client" | "appointment" | "procedure" | "action" | "channel" | "page" | "mode";
  id: string;
  title: string;
  subtitle?: string;
  path: string;
  icon?: any;
  color?: string;
}

const RECENT_SEARCHES_KEY = "rk_recent_searches";

const SearchBar = ({ compact = false, responsive = false }: { compact?: boolean; responsive?: boolean }) => {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { mode, setMode } = useAppMode();
  const navigate = useNavigate();
  const location = useLocation();
  const isVoiceMode = location.pathname.startsWith('/voice');

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

  const clearRecentSearches = (e: MouseEvent) => {
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
      const [clientsData, appointmentsData, proceduresData, voiceStudentsData, voiceBookingsData] = await Promise.all([
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
          .limit(3),
        supabase
          .from("voice_onboarding")
          .select("id, name, email")
          .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
          .limit(5),
        supabase
          .from("voice_bookings")
          .select("id, student_name, student_email, lesson_date, status")
          .or(`student_name.ilike.%${query}%,student_email.ilike.%${query}%`)
          .limit(5),
      ]);

      const searchResults: SearchResult[] = [];

      // Mode Switching
      if ("clinical hub".includes(query.toLowerCase())) {
        searchResults.push({ type: "mode", id: "clinical", title: "Switch to Clinical Hub", subtitle: "Practice management", path: "/", icon: Activity, color: "text-chart-primary" });
      }
      if ("voice studio".includes(query.toLowerCase())) {
        searchResults.push({ type: "mode", id: "voice", title: "Switch to Voice Studio", subtitle: "Voice & piano lessons", path: "/voice", icon: Mic, color: "text-rose-500" });
      }

      // Pages
      if ("peace framework".includes(query.toLowerCase())) {
        searchResults.push({ type: "page", id: "peace-framework", title: "The PEACE Framework", subtitle: "Clinical Methodology Guide", path: "/peace-framework", icon: ShieldCheck, color: "text-chart-primary" });
      }
      if ("marketing engine".includes(query.toLowerCase())) {
        searchResults.push({ type: "page", id: "marketing-engine", title: "AI Marketing Engine", subtitle: "Voice to Notion Workflow", path: "/business/marketing-engine", icon: Mic, color: "text-emerald-500" });
      }
      if ("voice clients".includes(query.toLowerCase())) {
        searchResults.push({ type: "page", id: "voice-clients", title: "Voice Clients", subtitle: "Student directory", path: "/voice/clients", icon: Users, color: "text-rose-500" });
      }
      if ("studio calendar".includes(query.toLowerCase()) || "voice calendar".includes(query.toLowerCase())) {
        searchResults.push({ type: "page", id: "voice-calendar", title: "Studio Calendar", subtitle: "Voice lesson schedule", path: "/voice/calendar", icon: CalendarDays, color: "text-rose-500" });
      }

      // TCM Channels
      const matchingChannels = TCM_CHANNELS.filter(c => 
        c.name.toLowerCase().includes(query.toLowerCase()) || 
        c.code.toLowerCase().includes(query.toLowerCase())
      );
      matchingChannels.forEach(c => {
        searchResults.push({ type: "channel", id: c.id, title: `${c.name} Meridian`, subtitle: `${c.element} Element • ${c.peakTime}`, path: `/resources?tab=channels`, icon: Layers, color: "text-chart-primary" });
      });

      if (clientsData.data) {
        clientsData.data.forEach((client) => {
          searchResults.push({ type: "client", id: client.id, title: client.name, subtitle: client.email || undefined, path: `/clients/${client.id}`, icon: User, color: "text-chart-primary" });
        });
      }

      if (appointmentsData.data) {
        appointmentsData.data.forEach((appointment: any) => {
          searchResults.push({ type: "appointment", id: appointment.id, title: appointment.name || appointment.display_id || "Appointment", subtitle: `${appointment.clients?.name} • ${format(new Date(appointment.date), "MMM d, yyyy")}`, path: `/appointments/${appointment.id}`, icon: Calendar, color: "text-rose-500" });
        });
      }

      if (proceduresData.data) {
        proceduresData.data.forEach((proc) => {
          searchResults.push({ type: "procedure", id: proc.id, title: proc.name, subtitle: "Protocol / Procedure", path: `/practice/procedures`, icon: Target, color: "text-emerald-500" });
        });
      }

      if (voiceStudentsData.data) {
        voiceStudentsData.data.forEach((student: any) => {
          searchResults.push({ type: "client", id: `voice-${student.id}`, title: `${student.name} (Voice)`, subtitle: student.email || undefined, path: `/voice/clients`, icon: Mic, color: "text-rose-500" });
        });
      }

      if (voiceBookingsData.data) {
        voiceBookingsData.data.forEach((booking: any) => {
          searchResults.push({ type: "appointment", id: `voice-booking-${booking.id}`, title: `${booking.student_name} — Voice Lesson`, subtitle: booking.lesson_date ? format(new Date(booking.lesson_date), "MMM d, yyyy") : undefined, path: `/voice/calendar`, icon: Calendar, color: "text-rose-500" });
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
      if (result.id === 'voice') {
        setOpen(false);
        navigate('/voice');
      } else {
        setMode(result.id as any);
        setOpen(false);
        navigate('/');
      }
      return;
    }
    saveRecentSearch(result);
    setOpen(false);
    navigate(result.path);
  };

  const getQuickActions = (): SearchResult[] => {
    const baseActions: SearchResult[] = [
      { type: "action", id: "dashboard", title: "Go to Dashboard", subtitle: "Main overview", path: "/", icon: LayoutDashboard, color: "text-muted-foreground" },
      { type: "action", id: "settings", title: "System Settings", subtitle: "Account & preferences", path: "/settings", icon: Settings, color: "text-muted-foreground" },
    ];

    if (isVoiceMode) {
      return [
        { type: "action", id: "voice-clients", title: "Voice Clients", subtitle: "Student directory", path: "/voice/clients", icon: Users, color: "text-rose-500" },
        { type: "action", id: "book-lesson", title: "Book a Lesson", subtitle: "Schedule voice lesson", path: "/voice/book", icon: CalendarPlus, color: "text-rose-500" },
        { type: "action", id: "studio-calendar", title: "Studio Calendar", subtitle: "Lesson schedule", path: "/voice/calendar", icon: CalendarDays, color: "text-rose-500" },
        ...baseActions
      ];
    }

    if (mode === 'clinical') {
      return [
        { type: "action", id: "new-client", title: "Add New Client", subtitle: "Create profile", path: "/clients", icon: UserPlus, color: "text-chart-primary" },
        { type: "action", id: "book-session", title: "Book New Session", subtitle: "Schedule appointment", path: "/appointments", icon: CalendarPlus, color: "text-chart-primary" },
        ...baseActions
      ];
    }

    return [...baseActions];
  };

  return (
    <>
      {(compact || responsive) && (
        <button
          onClick={() => setOpen(true)}
          className={cn("flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground", responsive && "lg:hidden")}
          title="Search (⌘K)"
          aria-label="Search"
        >
          <Search size={16} strokeWidth={1.9} />
        </button>
      )}
      {!compact && (
        <button
          onClick={() => setOpen(true)}
          className={cn(
            "group h-8 w-full items-center gap-2 rounded-lg border border-border bg-card pl-2.5 pr-1.5 text-[13px] text-muted-foreground shadow-xs hover:border-foreground/15 hover:text-foreground",
            responsive ? "hidden lg:flex" : "flex"
          )}
        >
          <Search size={14} strokeWidth={2} className="shrink-0" />
          <span className="truncate">Search or jump to…</span>
          <kbd className="kbd ml-auto">⌘K</kbd>
        </button>
      )}

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search clients, sessions, tools…"
          className="h-12 text-[15px]"
          onValueChange={handleSearch}
        />
        <CommandList className="max-h-[min(460px,60vh)] p-1.5">
          <CommandEmpty>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <Sparkles className="animate-pulse text-chart-primary" size={24} />
                <p className="text-sm text-muted-foreground">Searching…</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <p className="text-sm font-medium text-muted-foreground">No results found.</p>
                <p className="text-xs text-muted-foreground/80">Try a client name, "Clinical Hub" or "PEACE"</p>
              </div>
            )}
          </CommandEmpty>
          
          {results.length === 0 && (
            <CommandGroup heading={
              <div className="flex items-center gap-2">
                <Sparkles size={12} className="text-chart-primary" />
                <span>Suggested</span>
              </div>
            }>
              {getQuickActions().map((action) => (
                <CommandItem
                  key={action.id}
                  onSelect={() => handleSelect(action)}
                  className="gap-3 rounded-lg px-2.5 py-2 cursor-pointer"
                >
                  <action.icon size={16} className={cn("shrink-0", action.color)} />
                  <div className="flex flex-col">
                    <span className="text-[13px] font-medium text-foreground">{action.title}</span>
                    <span className="text-xs text-muted-foreground">{action.subtitle}</span>
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
                    <div className="flex items-center gap-2">
                      <Clock size={12} className="text-muted-foreground" />
                      <span>Recent Searches</span>
                    </div>
                    <button 
                      onClick={clearRecentSearches}
                      className="text-[11px] font-medium normal-case tracking-normal text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
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
                    className="gap-3 rounded-lg px-2.5 py-2 cursor-pointer"
                  >
                    <Clock size={16} className="shrink-0 text-muted-foreground/70" />
                    <div className="flex flex-col">
                      <span className="text-[13px] font-medium text-foreground">{result.title}</span>
                      {result.subtitle && (
                        <span className="text-xs text-muted-foreground">
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
            <div className="p-2">
              {/* Grouped Results */}
              {["mode", "page", "client", "appointment", "procedure", "channel"].map(type => {
                const filtered = results.filter(r => r.type === type);
                if (filtered.length === 0) return null;
                
                return (
                  <CommandGroup key={type} heading={type.charAt(0).toUpperCase() + type.slice(1) + "s"}>
                    {filtered.map((result) => (
                      <CommandItem
                        key={result.id}
                        onSelect={() => handleSelect(result)}
                        className="gap-3 rounded-lg px-2.5 py-2 cursor-pointer"
                      >
                        {result.icon ? <result.icon size={16} className={cn("shrink-0", result.color)} /> : <Search size={16} className="shrink-0 text-muted-foreground/70" />}
                        <div className="flex flex-col">
                          <span className="text-[13px] font-medium text-foreground">{result.title}</span>
                          <span className="text-xs text-muted-foreground">
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