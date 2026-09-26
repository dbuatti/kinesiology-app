
import { useState, useEffect } from "react"; import type { MouseEvent } from 'react';
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { TCM_CHANNELS } from "@/data/tcm-channel-data";
import { ZONES, ZONE_ORDER, normaliseZone } from "@/lib/zones";
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
  Fingerprint, Heart, Brain, LayoutDashboard, CalendarDays, Users, Mail
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
  // Opens a create dialog (handled by QuickActions) instead of navigating.
  create?: "client" | "session" | "quick" | "lesson";
}

const RECENT_SEARCHES_KEY = "rk_recent_searches";

// "Go to" list — section is the zone each page lives in (src/lib/zones.ts).
const NAV_DESTINATIONS: { title: string; path: string; icon: any; section: string; keywords?: string }[] = [
  { title: "Today", path: "/", icon: LayoutDashboard, section: "Practice", keywords: "home dashboard" },
  { title: "Calendar", path: "/calendar", icon: CalendarDays, section: "Practice", keywords: "bookings appointments lessons" },
  { title: "Sessions", path: "/sessions", icon: Activity, section: "Practice", keywords: "clinical hub peace" },
  { title: "Lessons", path: "/calendar?show=lessons", icon: Mic, section: "Practice", keywords: "voice piano studio lessons" },
  { title: "People", path: "/clients", icon: Users, section: "Practice", keywords: "clients students database" },
  { title: "Students", path: "/voice/clients", icon: Users, section: "Practice", keywords: "voice piano students outstanding" },
  { title: "Availability", path: "/availability", icon: CalendarDays, section: "Practice", keywords: "open hours cal.com schedule working hours" },
  { title: "Inbox", path: "/inbox", icon: Mail, section: "Business", keywords: "email reply messages portal" },
  { title: "Follow-up", path: "/follow-up", icon: Users, section: "Business", keywords: "drifting lapsed rebook" },
  { title: "Assistant", path: "/assistant", icon: Sparkles, section: "Business", keywords: "chat ai" },
  { title: "Money", path: "/money", icon: Target, section: "Business", keywords: "revenue payments unpaid outstanding earnings" },
  { title: "Client audit", path: "/audit", icon: Target, section: "Business", keywords: "rates reengagement triage" },
  { title: "Timetable", path: "/timetable", icon: Clock, section: "Business", keywords: "fortnight draft pencil" },
  { title: "Marketing", path: "/marketing", icon: Target, section: "Business", keywords: "kit newsletter content" },
  { title: "Morning Program", path: "/morning-program", icon: Zap, section: "Growth" },
  { title: "Journal", path: "/journal", icon: BookOpen, section: "Growth", keywords: "reflections" },
  { title: "Practice Hub", path: "/practice", icon: Heart, section: "Growth", keywords: "self practice quiz calibrate" },
  { title: "Practice session (sandbox)", path: "/practice/trial/peace", icon: Activity, section: "Growth", keywords: "sandbox trial practise peace" },
  { title: "Identity Work", path: "/identity", icon: Brain, section: "Growth", keywords: "beliefs fractals" },
  { title: "Library", path: "/library", icon: BookOpen, section: "Growth", keywords: "muscles reflexes cranial nerves tcm reference" },
  { title: "Worksheets", path: "/worksheets", icon: Layers, section: "Growth" },
  { title: "PEACE framework", path: "/library?tab=peace", icon: Activity, section: "Growth", keywords: "preliminary ease align correct embed" },
  { title: "Print hub", path: "/library?tab=print", icon: Layers, section: "Growth", keywords: "print sheets pdf" },
  { title: "Settings", path: "/settings", icon: Settings, section: "System" },
];

const SearchBar = ({ compact = false, responsive = false }: { compact?: boolean; responsive?: boolean }) => {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { setMode } = useAppMode();
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
          .contains("practices", ["kinesiology"])
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

      // Zone switching ("business", "growth", "practice")
      for (const z of ZONE_ORDER) {
        if (ZONES[z].label.toLowerCase().includes(query.toLowerCase())) {
          searchResults.push({ type: "mode", id: z, title: `Switch to ${ZONES[z].label}`, subtitle: "Zone", path: ZONES[z].home, icon: Layers, color: "text-muted-foreground" });
        }
      }

      // Pages
      if ("peace framework".includes(query.toLowerCase())) {
        searchResults.push({ type: "page", id: "peace-framework", title: "The PEACE Framework", subtitle: "Clinical Methodology Guide", path: "/library?tab=peace", icon: ShieldCheck, color: "text-chart-primary" });
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
      setMode(normaliseZone(result.id));
      setOpen(false);
      navigate(result.path);
      return;
    }
    if (result.create) {
      setOpen(false);
      window.dispatchEvent(new CustomEvent("rk:create", { detail: result.create }));
      return;
    }
    saveRecentSearch(result);
    setOpen(false);
    navigate(result.path);
  };

  const getQuickActions = (): SearchResult[] => {
    const baseActions: SearchResult[] = [
      { type: "action", id: "dashboard", title: "Go to Today", subtitle: "Your day at a glance", path: "/", icon: LayoutDashboard, color: "text-muted-foreground" },
      { type: "action", id: "settings", title: "System Settings", subtitle: "Account & preferences", path: "/settings", icon: Settings, color: "text-muted-foreground" },
    ];

    // Same create actions in every workspace — the practice is one practice.
    return [
      { type: "action", id: "quick-session", title: "Start quick session", subtitle: "No booking needed", path: "", create: "quick", icon: Zap, color: "text-chart-primary" },
      { type: "action", id: "book-session", title: "Book a session", subtitle: "Kinesiology", path: "", create: "session", icon: CalendarPlus, color: "text-chart-primary" },
      { type: "action", id: "book-lesson", title: "Book a lesson", subtitle: "Voice or piano", path: "", create: "lesson", icon: Mic, color: "text-chart-destructive" },
      { type: "action", id: "new-client", title: "New client", subtitle: "Kinesiology profile", path: "", create: "client", icon: UserPlus, color: "text-chart-primary" },
      { type: "action", id: "new-student", title: "New student", subtitle: "Voice or piano", path: "/voice/clients/new", icon: UserPlus, color: "text-chart-destructive" },
      { type: "action", id: "compose", title: "Write an email", subtitle: "Client inbox", path: "/assistant?view=inbox", icon: Mail, color: "text-muted-foreground" },
      ...baseActions
    ];
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

          {/* Always present (cmdk filters it by what's typed) — hiding it whenever
              a person or session matched made pages unfindable by name. */}
          {(
            <CommandGroup heading="Go to">
              {NAV_DESTINATIONS.map((d) => (
                <CommandItem
                  key={d.path}
                  value={`go ${d.title} ${d.keywords ?? ""}`}
                  onSelect={() => { setOpen(false); navigate(d.path); }}
                  className="gap-3 rounded-lg px-2.5 py-2 cursor-pointer"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                    <d.icon size={13} className="text-muted-foreground" />
                  </span>
                  <span className="text-[13px] font-medium text-foreground">{d.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{d.section}</span>
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
        <div className="flex items-center gap-4 border-t border-border bg-muted/40 px-4 py-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><kbd className="kbd">↑</kbd><kbd className="kbd">↓</kbd> navigate</span>
          <span className="flex items-center gap-1.5"><kbd className="kbd">↵</kbd> open</span>
          <span className="flex items-center gap-1.5"><kbd className="kbd">esc</kbd> close</span>
          <span className="ml-auto hidden sm:inline">Type a client’s name to search records</span>
        </div>
      </CommandDialog>
    </>
  );
};

export default SearchBar;