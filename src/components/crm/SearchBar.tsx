
import React, { useState, useEffect } from "react";
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
        searchResults.push({ type: "mode", id: "clinical", title: "Switch to Clinical Hub", subtitle: "Practice management", path: "/", icon: Activity, color: "text-indigo-500" });
      }
      if ("practice lab".includes(query.toLowerCase())) {
        searchResults.push({ type: "mode", id: "lab", title: "Switch to Practice Lab", subtitle: "Personal integration", path: "/", icon: Zap, color: "text-emerald-500" });
      }
      if ("knowledge hub".includes(query.toLowerCase())) {
        searchResults.push({ type: "mode", id: "library", title: "Switch to Knowledge Hub", subtitle: "Protocols & study", path: "/", icon: BookOpen, color: "text-amber-500" });
      }
      if ("voice studio".includes(query.toLowerCase())) {
        searchResults.push({ type: "mode", id: "voice", title: "Switch to Voice Studio", subtitle: "Voice & piano lessons", path: "/voice", icon: Mic, color: "text-rose-500" });
      }

      // Pages
      if ("peace framework".includes(query.toLowerCase())) {
        searchResults.push({ type: "page", id: "peace-framework", title: "The PEACE Framework", subtitle: "Clinical Methodology Guide", path: "/peace-framework", icon: ShieldCheck, color: "text-indigo-500" });
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
        searchResults.push({ type: "channel", id: c.id, title: `${c.name} Meridian`, subtitle: `${c.element} Element • ${c.peakTime}`, path: `/resources?tab=channels`, icon: Layers, color: "text-indigo-500" });
      });

      if (clientsData.data) {
        clientsData.data.forEach((client) => {
          searchResults.push({ type: "client", id: client.id, title: client.name, subtitle: client.email || undefined, path: `/clients/${client.id}`, icon: User, color: "text-indigo-500" });
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
      { type: "action", id: "dashboard", title: "Go to Dashboard", subtitle: "Main overview", path: "/", icon: LayoutDashboard, color: "text-slate-500" },
      { type: "action", id: "settings", title: "System Settings", subtitle: "Account & preferences", path: "/settings", icon: Settings, color: "text-slate-500" },
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
        { type: "action", id: "new-client", title: "Add New Client", subtitle: "Create profile", path: "/clients", icon: UserPlus, color: "text-indigo-500" },
        { type: "action", id: "book-session", title: "Book New Session", subtitle: "Schedule appointment", path: "/appointments", icon: CalendarPlus, color: "text-indigo-500" },
        ...baseActions
      ];
    }

    if (mode === 'lab') {
      return [
        { type: "action", id: "morning-program", title: "Morning Program", subtitle: "Daily readiness", path: "/morning-program", icon: Sparkles, color: "text-emerald-500" },
        { type: "action", id: "identity-shifting", title: "Identity Shifting", subtitle: "Sandbox tool", path: "/sandbox/identity-shifting", icon: Fingerprint, color: "text-emerald-500" },
        ...baseActions
      ];
    }

    return [
      { type: "action", id: "quiz", title: "Start Infinite Quiz", subtitle: "Mastery practice", path: "/practice/quiz", icon: Zap, color: "text-amber-500" },
      { type: "action", id: "bible", title: "Clinical Bible", subtitle: "Reference guide", path: "/resources", icon: BookOpen, color: "text-amber-500" },
      ...baseActions
    ];
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center lg:justify-start gap-3 px-3 lg:px-4 py-2.5 text-sm text-slate-500 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all w-full group"
      >
        <Search size={16} className="group-hover:text-indigo-600 transition-colors shrink-0" />
        <span className="font-medium hidden lg:inline">Command Center...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded-lg border bg-white dark:bg-slate-950 px-2 font-mono text-[10px] font-black text-slate-400 shadow-sm hidden lg:inline-flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <CommandInput
            placeholder="Search anything or type a command..."
            className="flex h-14 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
            onValueChange={handleSearch}
          />
        </div>
        <CommandList className="max-h-[450px]">
          <CommandEmpty>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <Sparkles className="animate-pulse text-indigo-500" size={24} />
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Searching the Oracle...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <p className="text-sm font-medium text-slate-500">No results found.</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Try searching for "Clinical Hub" or "PEACE"</p>
              </div>
            )}
          </CommandEmpty>
          
          {results.length === 0 && (
            <CommandGroup heading={
              <div className="flex items-center gap-2">
                <Sparkles size={12} className="text-indigo-500" />
                <span>Contextual Actions ({isVoiceMode ? 'voice' : mode})</span>
              </div>
            }>
              {getQuickActions().map((action) => (
                <CommandItem
                  key={action.id}
                  onSelect={() => handleSelect(action)}
                  className="rounded-xl py-3 px-4 cursor-pointer"
                >
                  <action.icon size={18} className={cn("mr-3", action.color)} />
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">{action.title}</span>
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{action.subtitle}</span>
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
                      <Clock size={12} className="text-slate-400" />
                      <span>Recent Searches</span>
                    </div>
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
                    className="rounded-xl py-3 px-4 cursor-pointer"
                  >
                    <Clock size={18} className="mr-3 text-slate-300" />
                    <div className="flex flex-col">
                      <span className="font-bold text-sm">{result.title}</span>
                      {result.subtitle && (
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
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
                        className="rounded-xl py-3 px-4 cursor-pointer"
                      >
                        {result.icon ? <result.icon size={18} className={cn("mr-3", result.color)} /> : <Search size={18} className="mr-3 text-slate-300" />}
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{result.title}</span>
                          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
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