
import { useState, useEffect, useMemo, type ElementType } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import AppLayout from "@/components/crm/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Percent,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Info,
  FileText,
  RotateCcw,
  Sliders,
  Send,
  Trash2,
  CalendarCheck,
  X,
  Target,
  Loader2,
  Wand2,
  CalendarDays,
  Mic2,
  Building2,
  Theater,
  Music2,
  Brain,
  Zap,
  Edit3,
  Columns,
  Inbox,
  ArrowLeft,
} from "lucide-react";
import { format, formatDistanceToNow, differenceInMonths, startOfWeek, endOfWeek, startOfMonth } from "date-fns";
import { Client, Appointment } from "@/types/crm";
import QuickBookDialog from "@/components/crm/QuickBookDialog";
import { ClientRow } from "@/components/crm/settings/ClientRow";
import TimetableVisualizer from "@/components/crm/settings/TimetableVisualizer";
import RoadmapTasks from "@/components/crm/settings/RoadmapTasks";

// ── Income stream types & defaults (outside component to avoid re-creation) ──
interface IncomeStream {
  id: string; name: string; unitLabel: string;
  ratePerUnit: number; unitsPerMonth: number; enabled: boolean;
}
const DEFAULT_EXTRA_STREAMS: IncomeStream[] = [
  { id: 'voice',     name: 'Voice Coaching',  unitLabel: 'sessions', ratePerUnit: 80,  unitsPerMonth: 3, enabled: true },
  { id: 'corporate', name: 'Corporate Gigs',   unitLabel: 'gigs',     ratePerUnit: 350, unitsPerMonth: 1, enabled: true },
  { id: 'theatre',   name: 'Musical Theatre',  unitLabel: 'shows',    ratePerUnit: 200, unitsPerMonth: 1, enabled: true },
  { id: 'piano',     name: 'Piano Backings',   unitLabel: 'sessions', ratePerUnit: 80,  unitsPerMonth: 4, enabled: true },
];
const STREAM_ICONS: Record<string, ElementType> = {
  fnh: Brain, voice: Mic2, corporate: Building2, theatre: Theater, piano: Music2,
};

interface ClientWithAppointments extends Client {
  appointments: Appointment[];
  lastSeenDate: Date | null;
  preferredTimeAnalyzed: { text: string; isLowData: boolean };
  followUpStatus: "Booked" | "Needs Follow-up" | "No Future Bookings";
}

const RATE_OPTIONS = [
  { label: "Free", value: 0 },
  { label: "$30", value: 30 },
  { label: "$50", value: 50 },
  { label: "$70", value: 70 },
  { label: "$80", value: 80 },
  { label: "$90", value: 90 },
  { label: "$100", value: 100 },
  { label: "$120", value: 120 },
  { label: "$150", value: 150 },
  { label: "Custom", value: -1 }
];

const STATIC_ROADMAP = [
  {
    phase: "Phase 1 · Now → Q3 2026",
    title: "Bring $30 clients to $50",
    description: "Use the Contact button on the Rates tab to send the rate increase email. Target anyone on $30 first — it's the smallest jump and easiest conversation."
  },
  {
    phase: "Phase 2 · Q1 2027",
    title: "Bring $50–$80 clients to $100",
    description: "Set their Target rate in the Rates tab, send the notification email, and confirm the upgrade once they acknowledge. Use the Session Packages strategy to soften the transition."
  },
  {
    phase: "Phase 3 · Q3 2027",
    title: "Bring $100 clients to $120",
    description: "At this stage most clients will expect incremental increases. Offer a 5-session package at $550 as an alternative to smooth the jump."
  },
  {
    phase: "Phase 4 · Q4 2027",
    title: "Everyone at $150 · New clients start here",
    description: "All active clients transition to $150. Every new client onboards at this rate from day one."
  }
];

const STATIC_STRATEGIES = [
  {
    title: "Session Packages",
    description: "5 sessions for $650 (instead of $750 individually). Clients get a small saving; you get upfront commitment and smoother rate transitions."
  },
  {
    title: "Between-Session Support",
    description: "Email check-ins, custom homework, and integration worksheets make the work feel ongoing — not just 60 minutes once a fortnight. This is your clearest value differentiator."
  },
  {
    title: "Document Your Wins",
    description: "Log client breakthroughs in the Wins Vault. When clients ask about the rate change, you can point to concrete outcomes from your work together."
  },
  {
    title: "Specialist Positioning",
    description: "You use Cranial Nerve, Primitive Reflex, Heart Wall, and Identity protocols that most practitioners don't have. Mention your specialist training when clients query rates — it's a legitimate reason."
  }
];

export function ClientAuditTool() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientWithAppointments[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "lastSeen" | "rate" | "age">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filterRate, setFilterRate] = useState<string>("all");
  const [filterFollowUp, setFilterFollowUp] = useState<string>("all");
  const [compactRows, setCompactRows] = useState(false);
  
  // Collapsible sections state
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    lastMonth: false,
    oneToThreeMonths: false,
    threePlusMonths: false,
  });

  // Preferred Time Override Modal State
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientWithAppointments | null>(null);
  const [overrideTimeValue, setOverrideTimeValue] = useState("");

  // Custom Rate Modal State
  const [isCustomRateModalOpen, setIsCustomRateModalOpen] = useState(false);
  const [customRateValue, setCustomRateValue] = useState("");

  // Quick Booking Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingClientId, setBookingClientId] = useState<string | null>(null);

  // Simulator State
  const [targetRate, setTargetRate] = useState(100);
  const [simulatorClients, setSimulatorClients] = useState(25);
  const [simulatorFrequency, setSimulatorFrequency] = useState(1.5);

  // Salary Simulator State
  const [isSandboxActive, setIsSandboxActive] = useState(false);
  const [globalSimRate, setGlobalSimRate] = useState(150);
  const [globalSimFrequency, setGlobalSimFrequency] = useState(1.5);
  const [clientOverrides, setClientOverrides] = useState<Record<string, { rate?: number; frequency?: number; active?: boolean }>>({});

  // AI Suggestions State
  const [aiSuggestions, setAiSuggestions] = useState<{
    summary: string;
    roadmap: { phase: string; title: string; description: string }[];
    strategies: { title: string; description: string }[];
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalyzed, setLastAnalyzed] = useState<string | null>(null);

  // NEW FEATURES STATE
  const [selectedWeeklyClients, setSelectedWeeklyClients] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Income streams & weekly calculator
  const [extraStreams, setExtraStreams] = useState<IncomeStream[]>(() => {
    try { const s = localStorage.getItem('income_streams_v1'); return s ? JSON.parse(s) : DEFAULT_EXTRA_STREAMS; }
    catch { return DEFAULT_EXTRA_STREAMS; }
  });
  const [weeklyTarget, setWeeklyTarget] = useState<number>(() => parseInt(localStorage.getItem('weekly_target') || '700'));
  const [editingWeeklyTarget, setEditingWeeklyTarget] = useState(false);
  const [weeklyTargetInput, setWeeklyTargetInput] = useState(() => localStorage.getItem('weekly_target') || '700');

  const updateStream = (id: string, field: keyof IncomeStream, value: any) => {
    setExtraStreams(prev => {
      const next = prev.map(s => s.id === id ? { ...s, [field]: value } : s);
      localStorage.setItem('income_streams_v1', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    fetchData();
    
    // Load cached AI suggestions
    const cached = localStorage.getItem("rk_client_audit_suggestions");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setAiSuggestions(parsed.suggestions);
        setLastAnalyzed(parsed.lastAnalyzed);
      } catch (e) {
        console.error("Failed to parse cached audit suggestions", e);
      }
    }

    const cachedWeeklyClients = localStorage.getItem("rk_selected_weekly_clients");
    if (cachedWeeklyClients) setSelectedWeeklyClients(JSON.parse(cachedWeeklyClients));
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("*")
        .or('is_practitioner.eq.false,is_practitioner.is.null')
        .order("name", { ascending: true });

      if (clientsError) throw clientsError;

      // Fetch appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from("appointments")
        .select("id, client_id, date, status, price_amount, is_paid, payment_received")
        .neq("status", "Cancelled")
        .order("date", { ascending: false });

      if (appointmentsError) throw appointmentsError;

      // Filter out practitioner self-profiles and test/bot accounts
      const filteredRawClients = (clientsData || []).filter(
        (client) => 
          client.name !== "Daniele Buatti" && 
          client.pronouns !== "Test/Bot" && 
          client.is_practitioner !== true
      );

      // Migrate localStorage data to database if present
      const cachedTargetRates = localStorage.getItem("rk_client_target_rates");
      const cachedRateUpdatedDates = localStorage.getItem("rk_client_rate_updated_dates");
      const cachedReengagementTags = localStorage.getItem("rk_client_reengagement_tags");

      if (cachedTargetRates || cachedRateUpdatedDates || cachedReengagementTags) {
        const targetRatesMap = cachedTargetRates ? JSON.parse(cachedTargetRates) : {};
        const rateUpdatedDatesMap = cachedRateUpdatedDates ? JSON.parse(cachedRateUpdatedDates) : {};
        const reengagementTagsMap = cachedReengagementTags ? JSON.parse(cachedReengagementTags) : {};

        for (const client of filteredRawClients) {
          const updates: any = {};
          if (targetRatesMap[client.id] && !client.target_rate) {
            updates.target_rate = targetRatesMap[client.id];
          }
          if (rateUpdatedDatesMap[client.id] && !client.rate_updated_at) {
            updates.rate_updated_at = rateUpdatedDatesMap[client.id];
          }
          if (reengagementTagsMap[client.id] && !client.reengagement_tag) {
            updates.reengagement_tag = reengagementTagsMap[client.id];
          }

          if (Object.keys(updates).length > 0) {
            await supabase
              .from("clients")
              .update(updates)
              .eq("id", client.id);
            
            // Update local object
            Object.assign(client, updates);
          }
        }

        // Clear localStorage so we don't run this again
        localStorage.removeItem("rk_client_target_rates");
        localStorage.removeItem("rk_client_rate_updated_dates");
        localStorage.removeItem("rk_client_reengagement_tags");
      }

      const processedClients: ClientWithAppointments[] = filteredRawClients.map((client) => {
        const clientApps = (appointmentsData || []).filter(
          (app) => app.client_id === client.id
        );

        const now = new Date();
        // Sort appointments by date descending
        const sortedApps = [...clientApps].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        // Find last seen date (past appointments only)
        const pastApps = sortedApps.filter((app) => new Date(app.date) <= now);
        const lastSeenDate = pastApps.length > 0 ? new Date(pastApps[0].date) : null;

        // Find future appointments
        const futureApps = sortedApps.filter((app) => new Date(app.date) > now);
        const hasFuture = futureApps.length > 0;

        // Determine follow-up status
        let followUpStatus: "Booked" | "Needs Follow-up" | "No Future Bookings" = "No Future Bookings";
        if (hasFuture) {
          followUpStatus = "Booked";
        } else if (lastSeenDate) {
          const diffDays = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays <= 30) {
            followUpStatus = "Needs Follow-up";
          }
        }

        // Analyze preferred time
        const preferredTimeAnalyzed = analyzePreferredTime(clientApps);

        return {
          ...client,
          appointments: clientApps,
          lastSeenDate,
          preferredTimeAnalyzed,
          followUpStatus,
        };
      });

      setClients(processedClients);
      
      // Set initial simulator values based on actual data if available
      if (processedClients.length > 0) {
        setSimulatorClients(processedClients.filter(c => {
          if (!c.lastSeenDate) return false;
          const diffDays = (new Date().getTime() - c.lastSeenDate.getTime()) / (1000 * 60 * 60 * 24);
          return diffDays <= 90;
        }).length || 15);
        
        const avgRate = processedClients.reduce((acc, c) => acc + (c.standard_rate || 50), 0) / processedClients.length;
        setTargetRate(Math.max(Math.round(avgRate), 50));
      }
    } catch (error: any) {
      console.error("Error fetching client audit data:", error);
      showError("Failed to load client audit data.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSuggestions = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-client-audit', {
        body: { clients }
      });

      if (error) throw error;

      setAiSuggestions(data);
      const nowStr = new Date().toISOString();
      setLastAnalyzed(nowStr);

      localStorage.setItem("rk_client_audit_suggestions", JSON.stringify({
        suggestions: data,
        lastAnalyzed: nowStr
      }));

      showSuccess("AI Audit Suggestions generated successfully!");
    } catch (err: any) {
      console.error("Error generating audit suggestions:", err);
      showError(err.message || "Failed to generate AI suggestions.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzePreferredTime = (appointments: any[]) => {
    if (!appointments || appointments.length === 0) {
      return { text: "No data", isLowData: true };
    }

    const days = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];
    const dayCounts: Record<number, number> = {};
    const hourCounts: Record<number, number> = {};

    appointments.forEach((app) => {
      const d = new Date(app.date);
      const day = d.getDay();
      const hour = d.getHours();

      dayCounts[day] = (dayCounts[day] || 0) + 1;
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    let maxDay = 0;
    let maxDayCount = 0;
    Object.entries(dayCounts).forEach(([day, count]) => {
      if (count > maxDayCount) {
        maxDayCount = count;
        maxDay = parseInt(day);
      }
    });

    let maxHour = 10; // default to 10 AM
    let maxHourCount = 0;
    Object.entries(hourCounts).forEach(([hour, count]) => {
      if (count > maxHourCount) {
        maxHourCount = count;
        maxHour = parseInt(hour);
      }
    });

    const ampm = maxHour >= 12 ? "PM" : "AM";
    const displayHour = maxHour % 12 === 0 ? 12 : maxHour % 12;
    const timeStr = `${days[maxDay]} at ${displayHour}:00 ${ampm}`;

    return {
      text: timeStr,
      isLowData: appointments.length < 3,
    };
  };

  const getClientAge = (bornStr: string | Date | null) => {
    if (!bornStr) return "N/A";
    try {
      const born = new Date(bornStr);
      if (isNaN(born.getTime())) return "N/A";
      const ageDifMs = Date.now() - born.getTime();
      const ageDate = new Date(ageDifMs);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
    } catch {
      return "N/A";
    }
  };

  const handleRateChange = async (clientId: string, rateValue: number) => {
    if (rateValue === -1) {
      // Custom rate selected
      const client = clients.find(c => c.id === clientId);
      if (client) {
        setSelectedClient(client);
        setCustomRateValue(client.standard_rate?.toString() || "");
        setIsCustomRateModalOpen(true);
      }
      return;
    }

    const todayStr = new Date().toISOString();

    // Optimistic UI update
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, standard_rate: rateValue, rate_updated_at: todayStr } : c));

    try {
      const { error } = await supabase
        .from("clients")
        .update({ standard_rate: rateValue, rate_updated_at: todayStr })
        .eq("id", clientId);

      if (error) throw error;
      showSuccess("Standard rate updated successfully.");
    } catch (error: any) {
      console.error("Error updating rate:", error);
      showError("Failed to update standard rate.");
      fetchData();
    }
  };

  const handleSaveCustomRate = async () => {
    if (!selectedClient) return;
    const rateNum = parseFloat(customRateValue);
    if (isNaN(rateNum) || rateNum < 0) {
      showError("Please enter a valid positive number.");
      return;
    }

    const todayStr = new Date().toISOString();

    // Optimistic UI update
    setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, standard_rate: rateNum, rate_updated_at: todayStr } : c));
    setIsCustomRateModalOpen(false);

    try {
      const { error } = await supabase
        .from("clients")
        .update({ standard_rate: rateNum, rate_updated_at: todayStr })
        .eq("id", selectedClient.id);

      if (error) throw error;
      showSuccess(`Custom rate of $${rateNum} set successfully.`);
    } catch (error: any) {
      console.error("Error saving custom rate:", error);
      showError("Failed to save custom rate.");
      fetchData();
    }
  };

  const handleOpenOverrideModal = (client: ClientWithAppointments) => {
    setSelectedClient(client);
    setOverrideTimeValue(client.preferred_time || "");
    setIsOverrideModalOpen(true);
  };

  const handleSaveOverride = async () => {
    if (!selectedClient) return;

    // Optimistic UI update
    setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, preferred_time: overrideTimeValue || null } : c));
    setIsOverrideModalOpen(false);

    try {
      const { error } = await supabase
        .from("clients")
        .update({ preferred_time: overrideTimeValue || null })
        .eq("id", selectedClient.id);

      if (error) throw error;
      showSuccess("Preferred time override updated successfully.");
    } catch (error: any) {
      console.error("Error saving preferred time override:", error);
      showError("Failed to save preferred time override.");
      fetchData();
    }
  };

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // NEW FEATURES HANDLERS
  const handleSetTargetRate = async (clientId: string, rate: number) => {
    // Optimistic UI update
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, target_rate: rate } : c));

    try {
      const { error } = await supabase
        .from("clients")
        .update({ target_rate: rate })
        .eq("id", clientId);

      if (error) throw error;
      showSuccess("Target rate updated.");
    } catch (error: any) {
      console.error("Error updating target rate:", error);
      showError("Failed to update target rate.");
      fetchData();
    }
  };

  const handleSetRateUpdatedDate = async (clientId: string, dateStr: string) => {
    // Optimistic UI update
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, rate_updated_at: dateStr } : c));

    try {
      const { error } = await supabase
        .from("clients")
        .update({ rate_updated_at: dateStr })
        .eq("id", clientId);

      if (error) throw error;
    } catch (error: any) {
      console.error("Error updating rate updated date:", error);
    }
  };

  const handleSetReengagementTag = async (clientId: string, tag: 'warm' | 'cold' | 'lost' | null) => {
    // Optimistic UI update
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, reengagement_tag: tag } : c));

    try {
      const { error } = await supabase
        .from("clients")
        .update({ reengagement_tag: tag })
        .eq("id", clientId);

      if (error) throw error;
      showSuccess(tag ? `Re-engagement status set to ${tag.toUpperCase()}.` : "Re-engagement status cleared.");
    } catch (error: any) {
      console.error("Error updating re-engagement status:", error);
      showError("Failed to update re-engagement status.");
      fetchData();
    }
  };

  const handleToggleWeeklyClient = (clientId: string) => {
    setSelectedWeeklyClients(prev => {
      const updated = prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId];
      localStorage.setItem("rk_selected_weekly_clients", JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearWeeklyClients = () => {
    setSelectedWeeklyClients([]);
    localStorage.removeItem("rk_selected_weekly_clients");
    showSuccess("Weekly booking simulator cleared.");
  };

  const [showEmailConfirm, setShowEmailConfirm] = useState(false);
  const [emailConfirmCount, setEmailConfirmCount] = useState(0);

  // BULK ACTIONS HANDLERS
  const handleBulkSetTargetRate = async (rate: number) => {
    if (selectedWeeklyClients.length === 0) return;
    setBulkActionLoading(true);
    try {
      const { error } = await supabase
        .from("clients")
        .update({ target_rate: rate })
        .in("id", selectedWeeklyClients);

      if (error) throw error;
      
      setClients(prev => prev.map(c => selectedWeeklyClients.includes(c.id) ? { ...c, target_rate: rate } : c));
      showSuccess(`Successfully set target rate to $${rate} for ${selectedWeeklyClients.length} clients.`);
    } catch (err: any) {
      showError("Failed to apply bulk target rate.");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkSetReengagementTag = async (tag: 'warm' | 'cold' | 'lost' | null) => {
    if (selectedWeeklyClients.length === 0) return;
    setBulkActionLoading(true);
    try {
      const { error } = await supabase
        .from("clients")
        .update({ reengagement_tag: tag })
        .in("id", selectedWeeklyClients);

      if (error) throw error;
      
      setClients(prev => prev.map(c => selectedWeeklyClients.includes(c.id) ? { ...c, reengagement_tag: tag } : c));
      showSuccess(`Successfully set re-engagement status to ${tag ? tag.toUpperCase() : 'NONE'} for ${selectedWeeklyClients.length} clients.`);
    } catch (err: any) {
      showError("Failed to apply bulk re-engagement status.");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkSendOnboardingClick = () => {
    if (selectedWeeklyClients.length === 0) return;
    const clientsWithEmail = clients.filter(c => selectedWeeklyClients.includes(c.id) && c.email);
    if (clientsWithEmail.length === 0) {
      showError("None of the selected clients have a valid email address.");
      return;
    }
    setEmailConfirmCount(clientsWithEmail.length);
    setShowEmailConfirm(true);
  };

  const executeSendEmails = async () => {
    if (selectedWeeklyClients.length === 0) return;
    setShowEmailConfirm(false);
    const clientsWithEmail = clients.filter(c => selectedWeeklyClients.includes(c.id) && c.email);
    if (clientsWithEmail.length === 0) return;

    setBulkActionLoading(true);
    let successCount = 0;
    try {
      for (const client of clientsWithEmail) {
        try {
          const { error } = await supabase.functions.invoke('send-manual-onboarding', {
            body: { clientId: client.id, force: true }
          });
          if (error) throw error;
          successCount++;
        } catch (err) {
          console.error(`Failed to send onboarding to ${client.name}: ${err}`);
        }
      }
      showSuccess(`Successfully sent onboarding emails to ${successCount} of ${clientsWithEmail.length} clients.`);
    } catch (err: any) {
      showError("Failed to complete bulk onboarding dispatch.");
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Filter and Sort Clients
  const filteredClients = clients.filter((client) => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesRate = true;
    if (filterRate !== "all") {
      if (filterRate === "free") {
        matchesRate = client.standard_rate === 0;
      } else if (filterRate === "custom") {
        const standardValues = [0, 30, 50, 70, 80, 90, 100, 120, 150];
        matchesRate = client.standard_rate !== null && client.standard_rate !== undefined && !standardValues.includes(client.standard_rate);
      } else {
        matchesRate = client.standard_rate === parseInt(filterRate);
      }
    }

    let matchesFollowUp = true;
    if (filterFollowUp !== "all") {
      matchesFollowUp = client.followUpStatus === filterFollowUp;
    }

    return matchesSearch && matchesRate && matchesFollowUp;
  });

  const sortedClients = [...filteredClients].sort((a, b) => {
    let comparison = 0;
    if (sortBy === "name") {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === "lastSeen") {
      const timeA = a.lastSeenDate ? a.lastSeenDate.getTime() : 0;
      const timeB = b.lastSeenDate ? b.lastSeenDate.getTime() : 0;
      comparison = timeA - timeB;
    } else if (sortBy === "rate") {
      const rateA = a.standard_rate || 0;
      const rateB = b.standard_rate || 0;
      comparison = rateA - rateB;
    } else if (sortBy === "age") {
      const ageA = typeof getClientAge(a.born) === "number" ? (getClientAge(a.born) as number) : 0;
      const ageB = typeof getClientAge(b.born) === "number" ? (getClientAge(b.born) as number) : 0;
      comparison = ageA - ageB;
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  // Grouping logic
  const now = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(now.getDate() - 30);
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setDate(now.getDate() - 90);

  const sortByLastSeenDesc = (a: ClientWithAppointments, b: ClientWithAppointments) => {
    const timeA = a.lastSeenDate ? a.lastSeenDate.getTime() : 0;
    const timeB = b.lastSeenDate ? b.lastSeenDate.getTime() : 0;
    return timeB - timeA;
  };

  const groups = {
    lastMonth: sortedClients.filter(
      (c) => (c.lastSeenDate && c.lastSeenDate >= oneMonthAgo) || c.appointments.some(app => new Date(app.date) > now)
    ).sort(sortByLastSeenDesc),
    oneToThreeMonths: sortedClients.filter(
      (c) =>
        !c.appointments.some(app => new Date(app.date) > now) &&
        c.lastSeenDate &&
        c.lastSeenDate < oneMonthAgo &&
        c.lastSeenDate >= threeMonthsAgo
    ).sort(sortByLastSeenDesc),
    threePlusMonths: sortedClients.filter(
      (c) =>
        !c.appointments.some(app => new Date(app.date) > now) &&
        (!c.lastSeenDate || c.lastSeenDate < threeMonthsAgo)
    ).sort(sortByLastSeenDesc),
  };

  // Financial Calculations
  const activeClients = clients.filter((c) => {
    if (c.appointments.some(app => new Date(app.date) > now)) return true;
    if (!c.lastSeenDate) return false;
    const diffDays = (now.getTime() - c.lastSeenDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 90;
  });

  const totalActiveClients = activeClients.length;
  
  const averageSessionRate = clients.length > 0
    ? clients.reduce((acc, c) => acc + (c.standard_rate ?? 50), 0) / clients.length
    : 0;

  // Total Revenue from paid appointments
  const totalRevenue = clients.reduce((acc, c) => {
    const paidApps = c.appointments.filter(app => app.is_paid || app.payment_received);
    const clientPaidSum = paidApps.reduce((sum, app) => sum + (Number(app.price_amount) || 0), 0);
    return acc + clientPaidSum;
  }, 0);

  // Free Session Ratio
  const totalSessions = clients.reduce((acc, c) => acc + c.appointments.length, 0);
  const freeSessions = clients.reduce((acc, c) => {
    const freeApps = c.appointments.filter(app => Number(app.price_amount) === 0 || app.price_amount === null);
    return acc + freeApps.length;
  }, 0);
  const freeSessionRatio = totalSessions > 0 ? (freeSessions / totalSessions) * 100 : 0;

  // Projected Monthly Revenue
  const totalSessionsLast90Days = clients.reduce((acc, c) => {
    const recentApps = c.appointments.filter(app => {
      const appDate = new Date(app.date);
      const diffDays = (now.getTime() - appDate.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 90;
    });
    return acc + recentApps.length;
  }, 0);

  const dynamicMonthlyFrequency = totalSessionsLast90Days / 3;
  
  const projectedMonthlyRevenue = clients.reduce((acc, c) => {
    const recentAppsCount = c.appointments.filter(app => {
      const appDate = new Date(app.date);
      const diffDays = (now.getTime() - appDate.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 90;
    }).length;
    
    let frequency = recentAppsCount / 3;
    if (frequency === 0 && c.lastSeenDate && (now.getTime() - c.lastSeenDate.getTime()) / (1000 * 60 * 60 * 24) <= 30) {
      frequency = 1.0; // default fallback for recently active
    }
    
    return acc + ((c.standard_rate ?? 50) * frequency);
  }, 0);

  // Rate Distribution Data
  const rateDistribution = {
    free: clients.filter(c => (c.standard_rate ?? 50) === 0).length,
    r30: clients.filter(c => (c.standard_rate ?? 50) === 30).length,
    r50: clients.filter(c => (c.standard_rate ?? 50) === 50).length,
    r70: clients.filter(c => (c.standard_rate ?? 50) === 70).length,
    r80: clients.filter(c => (c.standard_rate ?? 50) === 80).length,
    r90: clients.filter(c => (c.standard_rate ?? 50) === 90).length,
    r100: clients.filter(c => (c.standard_rate ?? 50) === 100).length,
    r120: clients.filter(c => (c.standard_rate ?? 50) === 120).length,
    r150: clients.filter(c => (c.standard_rate ?? 50) === 150).length,
    custom: clients.filter(c => {
      const rate = c.standard_rate ?? 50;
      return ![0, 30, 50, 70, 80, 90, 100, 120, 150].includes(rate);
    }).length,
  };

  const maxDistributionCount = Math.max(...Object.values(rateDistribution), 1);

  // Monthly Revenue Data for Chart (last 6 months)
  const monthlyRevenueData = useMemo(() => {
    const months: Record<string, { label: string; revenue: number; sessions: number }> = {};
    const nowDate = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(nowDate.getFullYear(), nowDate.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString("en-AU", { month: "short", timeZone: "Australia/Melbourne" });
      months[key] = { label, revenue: 0, sessions: 0 };
    }
    clients.forEach(c => {
      c.appointments.forEach(app => {
        if (!app.is_paid && !app.payment_received) return;
        const appDate = new Date(app.date);
        const key = `${appDate.getFullYear()}-${String(appDate.getMonth() + 1).padStart(2, '0')}`;
        if (months[key]) {
          months[key].revenue += Number(app.price_amount) || 0;
          months[key].sessions += 1;
        }
      });
    });
    return Object.values(months);
  }, [clients]);

  const maxMonthlyRevenue = Math.max(...monthlyRevenueData.map(m => m.revenue), 1);

  // Simulator Calculations
  const currentProjectedRevenue = totalActiveClients * averageSessionRate * simulatorFrequency;
  const targetProjectedRevenue = simulatorClients * targetRate * simulatorFrequency;
  const revenueIncrease = targetProjectedRevenue - currentProjectedRevenue;
  const percentageIncrease = currentProjectedRevenue > 0 ? (revenueIncrease / currentProjectedRevenue) * 100 : 0;

  // Weekly Booking Simulator Calculations
  const weeklySimulatorMetrics = useMemo(() => {
    let currentTotal = 0;
    let targetTotal = 0;
    const selectedClientsDetails = clients.filter(c => selectedWeeklyClients.includes(c.id)).map(c => {
      const currentRate = c.standard_rate ?? 50;
      const targetRate = c.target_rate ?? currentRate;
      currentTotal += currentRate;
      targetTotal += targetRate;
      return {
        id: c.id,
        name: c.name,
        currentRate,
        targetRate
      };
    });

    const increase = targetTotal - currentTotal;
    const annualizedImpact = increase * 52;

    return {
      count: selectedClientsDetails.length,
      details: selectedClientsDetails,
      currentTotal,
      targetTotal,
      increase,
      annualizedImpact
    };
  }, [clients, selectedWeeklyClients]);

  // Salary Simulator Calculations (Last Month Clients)
  const salaryMetrics = useMemo(() => {
    const lastMonthClients = clients.filter(
      (c) => (c.lastSeenDate && c.lastSeenDate >= oneMonthAgo) || c.appointments.some(app => new Date(app.date) > now)
    );

    let currentWeeklyTotal = 0;
    let simWeeklyTotal = 0;

    const clientDetails = lastMonthClients.map(client => {
      const rate = client.standard_rate ?? 50;
      
      // Calculate actual monthly frequency based on last 90 days
      const recentAppsCount = client.appointments.filter(app => {
        const appDate = new Date(app.date);
        const diffDays = (now.getTime() - appDate.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 90;
      }).length;
      
      let currentMonthlyFreq = recentAppsCount / 3;
      if (currentMonthlyFreq === 0) {
        currentMonthlyFreq = 1.0; // default fallback
      }

      const currentWeeklyFreq = currentMonthlyFreq / 4.33;
      const currentWeeklyRev = rate * currentWeeklyFreq;
      currentWeeklyTotal += currentWeeklyRev;

      // Sandbox calculations
      const override = clientOverrides[client.id] || {};
      const isActive = override.active !== false; // default to active
      
      let simRate = rate;
      let simFreq = currentMonthlyFreq;

      if (isSandboxActive) {
        if (override.rate !== undefined) {
          simRate = override.rate;
        } else {
          simRate = globalSimRate;
        }

        if (override.frequency !== undefined) {
          simFreq = override.frequency;
        } else {
          simFreq = globalSimFrequency;
        }
      }

      const simWeeklyFreq = isActive ? (simFreq / 4.33) : 0;
      const simWeeklyRev = simRate * simWeeklyFreq;
      if (isActive) {
        simWeeklyTotal += simWeeklyRev;
      }

      return {
        id: client.id,
        name: client.name,
        currentRate: rate,
        currentFreq: currentMonthlyFreq,
        currentWeeklyRev,
        simRate,
        simFreq,
        simWeeklyRev,
        isActive
      };
    });

    return {
      clientsCount: lastMonthClients.length,
      clientDetails,
      current: {
        weekly: currentWeeklyTotal,
        fortnightly: currentWeeklyTotal * 2,
        monthly: currentWeeklyTotal * 4.33,
        annual: currentWeeklyTotal * 52,
        avgRate: lastMonthClients.length > 0 ? lastMonthClients.reduce((acc, c) => acc + (c.standard_rate ?? 50), 0) / lastMonthClients.length : 0
      },
      simulated: {
        weekly: simWeeklyTotal,
        fortnightly: simWeeklyTotal * 2,
        monthly: simWeeklyTotal * 4.33,
        annual: simWeeklyTotal * 52,
        avgRate: lastMonthClients.length > 0 ? clientDetails.reduce((acc, c) => acc + (c.isActive ? c.simRate : 0), 0) / clientDetails.filter(c => c.isActive).length : 0
      }
    };
  }, [clients, isSandboxActive, globalSimRate, globalSimFrequency, clientOverrides]);

  // Weekly & monthly revenue — uses price_amount when set, falls back to client standard_rate
  const { thisWeekRevenue, thisWeekSessions, thisMonthRevenue, thisMonthSessions, daysLeftInWeek } = useMemo(() => {
    const now = new Date();
    const weekStart  = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd    = endOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    let weekRev = 0, weekCount = 0, monthRev = 0, monthCount = 0;
    clients.forEach(c => {
      const rate = c.standard_rate ?? 50;
      c.appointments.forEach(app => {
        const d = new Date(app.date);
        const earned = Number(app.price_amount) > 0 ? Number(app.price_amount) : rate;
        if (d >= weekStart && d <= weekEnd)  { weekRev  += earned; weekCount++; }
        if (d >= monthStart && d <= now)      { monthRev += earned; monthCount++; }
      });
    });
    // Days remaining Mon(1)–Sun(7); if today is Sun, 0 days left
    const todayDow = now.getDay(); // 0=Sun,1=Mon…6=Sat
    const daysLeft = todayDow === 0 ? 0 : 7 - todayDow;
    return { thisWeekRevenue: weekRev, thisWeekSessions: weekCount, thisMonthRevenue: monthRev, thisMonthSessions: monthCount, daysLeftInWeek: daysLeft };
  }, [clients]);

  const extraStreamsMonthly = useMemo(() =>
    extraStreams.filter(s => s.enabled).reduce((sum, s) => sum + s.ratePerUnit * s.unitsPerMonth, 0),
  [extraStreams]);

  const handleClientOverrideChange = (clientId: string, field: 'rate' | 'frequency' | 'active', value: any) => {
    setClientOverrides(prev => {
      const current = prev[clientId] || {};
      return {
        ...prev,
        [clientId]: {
          ...current,
          [field]: value
        }
      };
    });
  };

  // QUICK SELECT HANDLERS FOR SIMULATOR
  const handleSelectAllActive = () => {
    const activeIds = groups.lastMonth.map(c => c.id);
    setSelectedWeeklyClients(activeIds);
    localStorage.setItem("rk_selected_weekly_clients", JSON.stringify(activeIds));
    showSuccess("Selected all active clients (seen in last 30 days).");
  };

  const handleSelectAllNeedsFollowUp = () => {
    const needsFollowUpIds = clients.filter(c => c.followUpStatus === "Needs Follow-up").map(c => c.id);
    setSelectedWeeklyClients(needsFollowUpIds);
    localStorage.setItem("rk_selected_weekly_clients", JSON.stringify(needsFollowUpIds));
    showSuccess("Selected all clients needing follow-up.");
  };

  const handleSelectAllOneToThreeMonths = () => {
    const ids = groups.oneToThreeMonths.map(c => c.id);
    setSelectedWeeklyClients(ids);
    localStorage.setItem("rk_selected_weekly_clients", JSON.stringify(ids));
    showSuccess("Selected all clients seen 1-3 months ago.");
  };

  // SECTION SELECT ALL HANDLERS
  const isAllLastMonthSelected = groups.lastMonth.length > 0 && groups.lastMonth.every(c => selectedWeeklyClients.includes(c.id));
  const handleToggleAllLastMonth = () => {
    const lastMonthIds = groups.lastMonth.map(c => c.id);
    if (isAllLastMonthSelected) {
      setSelectedWeeklyClients(prev => {
        const updated = prev.filter(id => !lastMonthIds.includes(id));
        localStorage.setItem("rk_selected_weekly_clients", JSON.stringify(updated));
        return updated;
      });
    } else {
      setSelectedWeeklyClients(prev => {
        const updated = Array.from(new Set([...prev, ...lastMonthIds]));
        localStorage.setItem("rk_selected_weekly_clients", JSON.stringify(updated));
        return updated;
      });
    }
  };

  const isAllOneToThreeMonthsSelected = groups.oneToThreeMonths.length > 0 && groups.oneToThreeMonths.every(c => selectedWeeklyClients.includes(c.id));
  const handleToggleAllOneToThreeMonths = () => {
    const ids = groups.oneToThreeMonths.map(c => c.id);
    if (isAllOneToThreeMonthsSelected) {
      setSelectedWeeklyClients(prev => {
        const updated = prev.filter(id => !ids.includes(id));
        localStorage.setItem("rk_selected_weekly_clients", JSON.stringify(updated));
        return updated;
      });
    } else {
      setSelectedWeeklyClients(prev => {
        const updated = Array.from(new Set([...prev, ...ids]));
        localStorage.setItem("rk_selected_weekly_clients", JSON.stringify(updated));
        return updated;
      });
    }
  };

  const isAllThreePlusMonthsSelected = groups.threePlusMonths.length > 0 && groups.threePlusMonths.every(c => selectedWeeklyClients.includes(c.id));
  const handleToggleAllThreePlusMonths = () => {
    const ids = groups.threePlusMonths.map(c => c.id);
    if (isAllThreePlusMonthsSelected) {
      setSelectedWeeklyClients(prev => {
        const updated = prev.filter(id => !ids.includes(id));
        localStorage.setItem("rk_selected_weekly_clients", JSON.stringify(updated));
        return updated;
      });
    } else {
      setSelectedWeeklyClients(prev => {
        const updated = Array.from(new Set([...prev, ...ids]));
        localStorage.setItem("rk_selected_weekly_clients", JSON.stringify(updated));
        return updated;
      });
    }
  };

  // SANDBOX PRESETS
  const handleApplyPreset = (preset: 'conservative' | 'moderate' | 'target' | 'reset') => {
    if (preset === 'reset') {
      setIsSandboxActive(false);
      setGlobalSimRate(150);
      setGlobalSimFrequency(1.5);
      setClientOverrides({});
      showSuccess("Preview reset to actual values.");
      return;
    }

    setIsSandboxActive(true);
    if (preset === 'conservative') {
      setGlobalSimRate(Math.round(averageSessionRate * 1.1));
      setGlobalSimFrequency(1.5);
      const overrides: Record<string, any> = {};
      clients.forEach(c => {
        overrides[c.id] = {
          rate: Math.round((c.standard_rate ?? 50) * 1.1),
          frequency: 1.5,
          active: true
        };
      });
      setClientOverrides(overrides);
      showSuccess("Applied Conservative Preset (+10% rate increase).");
    } else if (preset === 'moderate') {
      setGlobalSimRate(Math.round(averageSessionRate * 1.25));
      setGlobalSimFrequency(1.5);
      const overrides: Record<string, any> = {};
      clients.forEach(c => {
        overrides[c.id] = {
          rate: Math.round((c.standard_rate ?? 50) * 1.25),
          frequency: 1.5,
          active: true
        };
      });
      setClientOverrides(overrides);
      showSuccess("Applied Moderate Preset (+25% rate increase).");
    } else if (preset === 'target') {
      setGlobalSimRate(150);
      setGlobalSimFrequency(1.5);
      const overrides: Record<string, any> = {};
      clients.forEach(c => {
        overrides[c.id] = {
          rate: 150,
          frequency: 1.5,
          active: true
        };
      });
      setClientOverrides(overrides);
      showSuccess("Applied Target Preset ($150 standard rate).");
    }
  };

  // RESET FILTERS
  const isFilterActive = filterRate !== "all" || filterFollowUp !== "all" || searchQuery !== "";
  const handleResetFilters = () => {
    setFilterRate("all");
    setFilterFollowUp("all");
    setSearchQuery("");
    showSuccess("Filters reset.");
  };

  const activeRoadmap = aiSuggestions?.roadmap || STATIC_ROADMAP;
  const activeStrategies = aiSuggestions?.strategies || STATIC_STRATEGIES;

  return (
      <>
      <div className="space-y-8 animate-in fade-in duration-700 pb-20">
        <PageHeader
          title="Client Payment & Audit"
          subtitle="Review client rates, track appointment recency, identify follow-up needs, and perform financial audits with AI-driven pricing suggestions."
          icon={FileText}
          iconClassName="bg-muted"
          actions={
            <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="rounded-xl text-xs gap-2">
              <ArrowLeft size={14} /> Back
            </Button>
          }
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Loading Audit Data...</p>
          </div>
        ) : (
          <div className="space-y-8">
          {/* ── Persistent summary strip ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Active Clients", value: totalActiveClients.toString(), sub: "seen last 90 days", colour: "text-chart-primary", icon: Users, gradient: "from-chart-primary/5 to-transparent" },
              { label: "Avg Session Rate", value: `$${averageSessionRate.toFixed(0)}`, sub: `target $150`, colour: "text-foreground", icon: DollarSign, gradient: "from-muted to-transparent" },
              { label: "This Week", value: `$${thisWeekRevenue.toLocaleString()}`, sub: `${thisWeekSessions} sessions · $${weeklyTarget} target`, colour: thisWeekRevenue >= weeklyTarget ? "text-chart-emerald" : "text-chart-destructive", icon: Calendar, gradient: thisWeekRevenue >= weeklyTarget ? "from-chart-emerald/5 to-transparent" : "from-chart-destructive/5 to-transparent" },
              { label: "Proj. Monthly", value: `$${Math.round(projectedMonthlyRevenue).toLocaleString()}`, sub: "FNH only · current rates", colour: "text-primary", icon: TrendingUp, gradient: "from-primary/5 to-transparent" },
            ].map(({ label, value, sub, colour, gradient, icon: Icon }) => (
              <div key={label} className={`relative bg-card rounded-xl border border-border px-5 py-4 space-y-1.5 overflow-hidden bg-gradient-to-br ${gradient} transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group`}>
                <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
                <div className="flex items-center justify-between relative z-10">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                  <Icon size={18} className="text-muted-foreground/20 group-hover:text-muted-foreground/40 transition-colors" />
                </div>
                <p className={`text-2xl font-bold relative z-10 ${colour}`}>{value}</p>
                <p className="text-[11px] text-muted-foreground font-medium relative z-10">{sub}</p>
                {(label === "Avg Session Rate") && (
                  <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden relative z-10">
                    <div className="h-full rounded-full bg-chart-primary transition-all duration-500" style={{ width: `${Math.min(100, (averageSessionRate / 150) * 100)}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          <Tabs defaultValue="rates" className="space-y-8">
            <TabsList className="bg-muted/50 p-1 rounded-xl border border-border/50 w-full max-w-3xl grid grid-cols-5">
              <TabsTrigger value="rates" className="rounded-xl font-medium text-xs py-2.5">
                Rates
              </TabsTrigger>
              <TabsTrigger value="timetable" className="rounded-xl font-medium text-xs py-2.5">
                Timetable
              </TabsTrigger>
              <TabsTrigger value="salary" className="rounded-xl font-medium text-xs py-2.5">
                Salary Sim
              </TabsTrigger>
              <TabsTrigger value="audit" className="rounded-xl font-medium text-xs py-2.5">
                Financials
              </TabsTrigger>
              <TabsTrigger value="suggestions" className="rounded-xl font-medium text-xs py-2.5">
                AI Roadmap
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: RATES & RECENCY */}
            <TabsContent value="rates" className="space-y-6">
              {/* WEEKLY BOOKING SIMULATOR CARD */}
              <Card className="border-none shadow-sm rounded-xl bg-card border border-border text-foreground overflow-hidden relative group">
                <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
                <CardContent className="p-8 space-y-6 relative z-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <Badge className="bg-primary/20 text-chart-primary border-primary/30 font-semibold text-[10px] uppercase tracking-wider px-3 py-0.5">
                        Interactive Tool
                      </Badge>
                      <h3 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                        <CalendarCheck className="text-chart-primary" size={24} />
                        Weekly Booking Simulator
                      </h3>
                      <p className="text-xs text-muted-foreground/60 font-medium">
                        Select clients from the lists below to simulate this week's bookings and see the direct impact of your rate ladder.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {weeklySimulatorMetrics.count > 0 && (
                        <Button
                          variant="ghost"
                          onClick={handleClearWeeklyClients}
                          className="text-muted-foreground/60 hover:text-foreground hover:bg-muted rounded-xl text-xs font-medium"
                        >
                          <Trash2 size={14} className="mr-2" /> Clear Simulator
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Quick Select Buttons */}
                  <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-xl border border-border">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 self-center px-2">
                      Quick Select:
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllActive}
                      className="bg-muted border-border text-muted-foreground/60 hover:text-foreground hover:bg-muted rounded-xl text-xs font-medium h-8"
                    >
                      Active (Last 30 Days)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllOneToThreeMonths}
                      className="bg-muted border-border text-muted-foreground/60 hover:text-foreground hover:bg-muted rounded-xl text-xs font-medium h-8"
                    >
                      1-3 Months Ago
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllNeedsFollowUp}
                      className="bg-muted border-border text-muted-foreground/60 hover:text-foreground hover:bg-muted rounded-xl text-xs font-medium h-8"
                    >
                      Needs Follow-up
                    </Button>
                  </div>

                  {weeklySimulatorMetrics.count === 0 ? (
                    <div className="p-6 rounded-xl border border-dashed border-border bg-muted text-center space-y-2">
                      <p className="text-sm font-medium text-muted-foreground/60">No clients selected for this week.</p>
                      <p className="text-xs text-muted-foreground">
                        Check the box next to any client's name in the lists below to add them to this week's schedule.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                      {/* Selected Badges */}
                      <div className="lg:col-span-6 space-y-3">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 block">
                          This Week's Schedule ({weeklySimulatorMetrics.count})
                        </span>
                        <ScrollArea className="h-[100px] pr-2">
                          <div className="flex flex-wrap gap-2">
                            {weeklySimulatorMetrics.details.map(c => (
                              <Badge
                                key={c.id}
                                className="bg-muted hover:bg-muted text-muted-foreground/60 border-border pl-3 pr-1.5 py-1 rounded-xl flex items-center gap-1.5 text-xs font-medium"
                              >
                                {c.name}
                                <span className="text-chart-primary font-semibold">${c.currentRate}</span>
                                <button
                                  onClick={() => handleToggleWeeklyClient(c.id)}
                                  className="w-4 h-4 rounded-full bg-muted hover:bg-muted/20 hover:text-chart-destructive flex items-center justify-center transition-colors"
                                >
                                  <X size={10} />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>

                      {/* Projections */}
                      <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-muted p-5 rounded-xl border border-border">
                        <div className="space-y-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 block">Current Earnings</span>
                          <h4 className="text-2xl font-semibold text-foreground">${weeklySimulatorMetrics.currentTotal}</h4>
                          <span className="text-[10px] text-muted-foreground font-medium block">at current rates</span>
                        </div>
                        <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-border pt-3 sm:pt-0 sm:pl-4">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-chart-primary block">Target Earnings</span>
                          <h4 className="text-2xl font-semibold text-chart-primary">${weeklySimulatorMetrics.targetTotal}</h4>
                          <span className="text-[10px] text-muted-foreground font-medium block">at target rates</span>
                        </div>
                        <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-border pt-3 sm:pt-0 sm:pl-4">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-chart-emerald block">Weekly Increase</span>
                          <h4 className="text-2xl font-semibold text-chart-emerald">
                            +${weeklySimulatorMetrics.increase}
                          </h4>
                          <span className="text-[10px] text-muted-foreground font-medium block">
                            +${weeklySimulatorMetrics.annualizedImpact.toLocaleString()}/yr
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Controls Card — Sticky */}
              <Card className="border-none shadow-sm rounded-xl bg-card/80 backdrop-blur-md sticky top-0 z-20 border-b border-primary/10">
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent pointer-events-none" />
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    {/* Search & Filter Indicator */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:max-w-md">
                      <div className="relative w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <Input
                          placeholder="Search clients..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 rounded-xl border-border/60 bg-muted/30 focus-visible:ring-primary"
                        />
                      </div>
                      {isFilterActive && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium shrink-0">
                          <span>Showing {filteredClients.length} of {clients.length}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleResetFilters}
                            className="h-7 px-2 text-chart-primary hover:bg-muted rounded-lg text-[10px] font-semibold uppercase tracking-wider"
                          >
                            Reset
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Filters & Sorting */}
                    <div className="flex flex-wrap gap-3 w-full md:w-auto justify-end">
                      {/* Rate Filter */}
                      <div className="flex items-center gap-2">
                        <Filter size={14} className="text-muted-foreground" />
                        <Select value={filterRate} onValueChange={setFilterRate}>
                          <SelectTrigger className="w-[130px] rounded-xl border-border/60 bg-muted/30">
                            <SelectValue placeholder="Rate Tier" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl shadow-sm">
                            <SelectItem value="all">All Rates</SelectItem>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="30">$30</SelectItem>
                            <SelectItem value="50">$50</SelectItem>
                            <SelectItem value="70">$70</SelectItem>
                            <SelectItem value="80">$80</SelectItem>
                            <SelectItem value="90">$90</SelectItem>
                            <SelectItem value="100">$100</SelectItem>
                            <SelectItem value="120">$120</SelectItem>
                            <SelectItem value="150">$150</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Follow-up Filter */}
                      <Select value={filterFollowUp} onValueChange={setFilterFollowUp}>
                        <SelectTrigger className="w-[150px] rounded-xl border-border/60 bg-muted/30">
                          <SelectValue placeholder="Follow-up" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl shadow-sm">
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="Booked">Booked</SelectItem>
                          <SelectItem value="Needs Follow-up">Needs Follow-up</SelectItem>
                          <SelectItem value="No Future Bookings">No Future Bookings</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Sort By */}
                      <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                        <SelectTrigger className="w-[130px] rounded-xl border-border/60 bg-muted/30">
                          <SelectValue placeholder="Sort By" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl shadow-sm">
                          <SelectItem value="name">Name</SelectItem>
                          <SelectItem value="lastSeen">Last Seen</SelectItem>
                          <SelectItem value="rate">Standard Rate</SelectItem>
                          <SelectItem value="age">Age</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Sort Order */}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                        className="rounded-xl border-border/60 bg-muted/30 hover:bg-muted/50"
                      >
                        <ArrowUpDown size={16} />
                      </Button>

                      {/* Compact Toggle */}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCompactRows(prev => !prev)}
                        className={cn(
                          "rounded-xl border-border/60 bg-muted/30 hover:bg-muted/50",
                          compactRows && "bg-primary/10 border-primary/30 text-primary"
                        )}
                        title={compactRows ? "Compact view" : "Normal view"}
                      >
                        <Columns size={16} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Grouped Collapsible Sections */}
              <div className="space-y-4">
                {/* Section 1: Last Month */}
                <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-card">
                  <div className="w-full p-6 flex flex-col sm:flex-row sm:items-center justify-between bg-muted/20 hover:bg-muted/30 transition-colors text-left gap-4">
                    <button
                      onClick={() => toggleSection("lastMonth")}
                      className="flex items-center gap-3 flex-1"
                    >
                      <div className="w-8 h-8 rounded-lg bg-muted text-chart-emerald flex items-center justify-center">
                        <CheckCircle2 size={18} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-base">Active & Upcoming</h3>
                        <p className="text-xs text-muted-foreground font-medium">Seen in the last 30 days OR booked in the future</p>
                      </div>
                      <Badge variant="secondary" className="ml-2 bg-chart-emerald/10 text-chart-emerald border-none font-medium">
                        {groups.lastMonth.length} {groups.lastMonth.length === 1 ? "client" : "clients"}
                      </Badge>
                    </button>
                    
                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {groups.lastMonth.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleToggleAllLastMonth}
                          className="h-8 rounded-xl text-xs font-medium border-border/60 bg-background hover:bg-muted"
                        >
                          {isAllLastMonthSelected ? "Deselect All" : "Select All for Sim"}
                        </Button>
                      )}
                      <button onClick={() => toggleSection("lastMonth")} className="p-1">
                        {collapsedSections.lastMonth ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                      </button>
                    </div>
                  </div>

                  {!collapsedSections.lastMonth && (
                    <CardContent className="p-0 border-t border-border/40">
                      {groups.lastMonth.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm font-medium">
                          No clients in this section.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-border/40 bg-muted/10 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                <th className="p-4 pl-6 w-12">Sim</th>
                                <th className="p-4">Client</th>
                                <th className="p-4">Last Seen / Next Booked</th>
                                <th className="p-4">Rate Ladder (Current vs Target)</th>
                                <th className="p-4">Preferred Time</th>
                                <th className="p-4">Follow-up Status</th>
                                <th className="p-4 pr-6 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                              {groups.lastMonth.map((client) => (
                                <ClientRow
                                  key={client.id}
                                  client={client}
                                  calculateAge={getClientAge}
                                  handleRateChange={handleRateChange}
                                  handleOpenOverrideModal={handleOpenOverrideModal}
                                  selectedWeeklyClients={selectedWeeklyClients}
                                  onToggleWeeklyClient={handleToggleWeeklyClient}
                                  onSetTargetRate={handleSetTargetRate}
                                  onSetRateUpdatedDate={handleSetRateUpdatedDate}
                                  onSetReengagementTag={handleSetReengagementTag}
                                  isLapsedSection={false}
                                  onQuickBook={(id) => { setBookingClientId(id); setIsBookingModalOpen(true); }}
                                  onRefresh={fetchData}
                                  averageSessionRate={averageSessionRate}
                                  compact={compactRows}
                                />
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>

                {/* Section 2: 1-3 Months */}
                <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-card">
                  <div className="w-full p-6 flex flex-col sm:flex-row sm:items-center justify-between bg-muted/20 hover:bg-muted/30 transition-colors text-left gap-4">
                    <button
                      onClick={() => toggleSection("oneToThreeMonths")}
                      className="flex items-center gap-3 flex-1"
                    >
                      <div className="w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center">
                        <Clock size={18} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-base">1-3 Months</h3>
                        <p className="text-xs text-muted-foreground font-medium">Seen 30 to 90 days ago</p>
                      </div>
                      <Badge variant="secondary" className="ml-2 bg-muted text-muted-foreground border-none font-medium">
                        {groups.oneToThreeMonths.length} {groups.oneToThreeMonths.length === 1 ? "client" : "clients"}
                      </Badge>
                    </button>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {groups.oneToThreeMonths.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleToggleAllOneToThreeMonths}
                          className="h-8 rounded-xl text-xs font-medium border-border/60 bg-background hover:bg-muted"
                        >
                          {isAllOneToThreeMonthsSelected ? "Deselect All" : "Select All for Sim"}
                        </Button>
                      )}
                      <button onClick={() => toggleSection("oneToThreeMonths")} className="p-1">
                        {collapsedSections.oneToThreeMonths ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                      </button>
                    </div>
                  </div>

                  {!collapsedSections.oneToThreeMonths && (
                    <CardContent className="p-0 border-t border-border/40">
                      {groups.oneToThreeMonths.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                            <Inbox size={20} className="text-muted-foreground/40" />
                          </div>
                          <p className="text-sm font-medium text-muted-foreground">All clients are staying active — great retention!</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-border/40 bg-muted/10 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                <th className="p-4 pl-6 w-12">Sim</th>
                                <th className="p-4">Client</th>
                                <th className="p-4">Last Seen / Next Booked</th>
                                <th className="p-4">Rate Ladder (Current vs Target)</th>
                                <th className="p-4">Preferred Time</th>
                                <th className="p-4">Follow-up Status</th>
                                <th className="p-4 pr-6 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                              {groups.oneToThreeMonths.map((client) => (
                                <ClientRow
                                  key={client.id}
                                  client={client}
                                  calculateAge={getClientAge}
                                  handleRateChange={handleRateChange}
                                  handleOpenOverrideModal={handleOpenOverrideModal}
                                  selectedWeeklyClients={selectedWeeklyClients}
                                  onToggleWeeklyClient={handleToggleWeeklyClient}
                                  onSetTargetRate={handleSetTargetRate}
                                  onSetRateUpdatedDate={handleSetRateUpdatedDate}
                                  onSetReengagementTag={handleSetReengagementTag}
                                  isLapsedSection={false}
                                  onQuickBook={(id) => { setBookingClientId(id); setIsBookingModalOpen(true); }}
                                  onRefresh={fetchData}
                                  averageSessionRate={averageSessionRate}
                                  compact={compactRows}
                                />
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>

                {/* Section 3: 3+ Months (Lapsed Clients with Re-engagement Priority) */}
                <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-card">
                  <div className="w-full p-6 flex flex-col sm:flex-row sm:items-center justify-between bg-muted/20 hover:bg-muted/30 transition-colors text-left gap-4">
                    <button
                      onClick={() => toggleSection("threePlusMonths")}
                      className="flex items-center gap-3 flex-1"
                    >
                      <div className="w-8 h-8 rounded-lg bg-muted text-chart-destructive flex items-center justify-center">
                        <AlertCircle size={18} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-base">3+ Months (Re-engagement Goldmine)</h3>
                        <p className="text-xs text-muted-foreground font-medium">Seen more than 90 days ago, or never seen</p>
                      </div>
                      <Badge variant="secondary" className="ml-2 bg-chart-destructive/10 text-chart-destructive border-none font-medium">
                        {groups.threePlusMonths.length} {groups.threePlusMonths.length === 1 ? "client" : "clients"}
                      </Badge>
                    </button>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {groups.threePlusMonths.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleToggleAllThreePlusMonths}
                          className="h-8 rounded-xl text-xs font-medium border-border/60 bg-background hover:bg-muted"
                        >
                          {isAllThreePlusMonthsSelected ? "Deselect All" : "Select All for Sim"}
                        </Button>
                      )}
                      <button onClick={() => toggleSection("threePlusMonths")} className="p-1">
                        {collapsedSections.threePlusMonths ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                      </button>
                    </div>
                  </div>

                  {!collapsedSections.threePlusMonths && (
                    <CardContent className="p-0 border-t border-border/40">
                      {groups.threePlusMonths.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                            <CheckCircle2 size={20} className="text-muted-foreground/40" />
                          </div>
                          <p className="text-sm font-medium text-muted-foreground">Every client has visited in the last 90 days — well done!</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-border/40 bg-muted/10 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                <th className="p-4 pl-6 w-12">Sim</th>
                                <th className="p-4">Client</th>
                                <th className="p-4">Last Seen</th>
                                <th className="p-4">Rate Ladder (Current vs Target)</th>
                                <th className="p-4">Re-engagement Priority</th>
                                <th className="p-4">Follow-up Status</th>
                                <th className="p-4 pr-6 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                              {groups.threePlusMonths.map((client) => (
                                <ClientRow
                                  key={client.id}
                                  client={client}
                                  calculateAge={getClientAge}
                                  handleRateChange={handleRateChange}
                                  handleOpenOverrideModal={handleOpenOverrideModal}
                                  selectedWeeklyClients={selectedWeeklyClients}
                                  onToggleWeeklyClient={handleToggleWeeklyClient}
                                  onSetTargetRate={handleSetTargetRate}
                                  onSetRateUpdatedDate={handleSetRateUpdatedDate}
                                  onSetReengagementTag={handleSetReengagementTag}
                                  isLapsedSection={true}
                                  onQuickBook={(id) => { setBookingClientId(id); setIsBookingModalOpen(true); }}
                                  onRefresh={fetchData}
                                  averageSessionRate={averageSessionRate}
                                  compact={compactRows}
                                />
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              </div>
            </TabsContent>

            {/* TAB 2: TIMETABLE VISUALIZER */}
            <TabsContent value="timetable" className="space-y-8">
              <TimetableVisualizer clients={clients} />
            </TabsContent>

            {/* TAB 3: SALARY SIMULATOR */}
            <TabsContent value="salary" className="space-y-8">

              {/* ── WEEKLY CALCULATOR ── */}
              {(() => {
                const gap = Math.max(0, weeklyTarget - thisWeekRevenue);
                const fhnRate = Math.round(averageSessionRate) || 70;
                const sessionsNeeded = fhnRate > 0 ? Math.ceil(gap / fhnRate) : 0;
                const corpStream = extraStreams.find(s => s.id === 'corporate');
                const corpRate = corpStream?.ratePerUnit ?? 350;
                const corpGigsNeeded = corpRate > 0 ? Math.ceil(gap / corpRate) : 0;
                const pct = Math.min(100, weeklyTarget > 0 ? Math.round((thisWeekRevenue / weeklyTarget) * 100) : 0);
                const onTarget = thisWeekRevenue >= weeklyTarget;
                return (
                  <Card className="border-none shadow-sm rounded-xl bg-card border border-border text-foreground overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-10 opacity-[0.06] pointer-events-none"><Zap size={160} /></div>
                    <CardContent className="p-8 relative z-10 space-y-6">

                      {/* Header + target */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-chart-primary">Weekly Calculator</p>
                          <h3 className="text-2xl font-semibold">What do I need this week?</h3>
                          <p className="text-xs text-muted-foreground/60 font-medium">
                            Mon–Sun · {thisWeekSessions} session{thisWeekSessions !== 1 ? 's' : ''} so far
                            {daysLeftInWeek > 0 ? ` · ${daysLeftInWeek} day${daysLeftInWeek !== 1 ? 's' : ''} remaining` : ' · Last day of working week'}
                          </p>
                        </div>
                        {/* Editable weekly target */}
                        <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-4 py-3 border border-border self-start shrink-0">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Target</span>
                          {editingWeeklyTarget ? (
                            <input autoFocus
                              className="w-20 bg-transparent text-foreground font-semibold text-sm text-right outline-none border-b border-primary pb-0.5"
                              value={weeklyTargetInput}
                              onChange={e => setWeeklyTargetInput(e.target.value)}
                              onBlur={() => {
                                const n = parseInt(weeklyTargetInput);
                                if (!isNaN(n) && n > 0) { setWeeklyTarget(n); localStorage.setItem('weekly_target', String(n)); }
                                setEditingWeeklyTarget(false);
                              }}
                              onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                            />
                          ) : (
                            <button onClick={() => { setWeeklyTargetInput(String(weeklyTarget)); setEditingWeeklyTarget(true); }}
                              className="flex items-center gap-1.5 font-semibold text-sm text-foreground hover:text-chart-primary transition-colors">
                              ${weeklyTarget.toLocaleString()}<Edit3 size={11} className="opacity-40" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* This week vs this month side by side */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 bg-muted/50 rounded-xl border border-border space-y-1">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-chart-primary">This week</p>
                          <p className="text-2xl font-semibold text-foreground">${thisWeekRevenue.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground/60">{thisWeekSessions} session{thisWeekSessions !== 1 ? 's' : ''} · {pct}% of target</p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-xl border border-border space-y-1">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">This month</p>
                          <p className="text-2xl font-semibold text-foreground">${thisMonthRevenue.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground/60">{thisMonthSessions} session{thisMonthSessions !== 1 ? 's' : ''} total</p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1.5">
                        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all duration-700", onTarget ? "bg-chart-emerald" : "bg-primary")}
                            style={{ width: `${pct}%` }} />
                        </div>
                      </div>

                      {onTarget ? (
                        <div className="flex items-center gap-3 p-4 bg-chart-emerald/10 border border-chart-emerald/20 rounded-xl">
                          <CheckCircle2 size={20} className="text-chart-emerald shrink-0" />
                          <p className="text-sm font-medium text-chart-emerald">Weekly target hit — great work!</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-xs text-muted-foreground/60 font-medium">
                            Still needed: <span className="text-foreground font-semibold text-base">${gap.toLocaleString()}</span>
                            {daysLeftInWeek > 0 && <span className="text-muted-foreground"> · ~${Math.ceil(gap / daysLeftInWeek).toLocaleString()}/day</span>}
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3.5 bg-muted/50 border border-border rounded-xl space-y-0.5">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-chart-primary">FNH sessions</p>
                              <p className="text-xl font-semibold text-foreground">{sessionsNeeded}</p>
                              <p className="text-[10px] text-muted-foreground/60">at ${fhnRate} avg</p>
                            </div>
                            <div className="p-3.5 bg-muted/50 border border-border rounded-xl space-y-0.5">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Corporate gig</p>
                              <p className="text-xl font-semibold text-foreground">{corpGigsNeeded}</p>
                              <p className="text-[10px] text-muted-foreground/60">at ${corpRate}/gig</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })()}

              {/* ── INCOME STREAMS ── */}
              <Card className="border-none shadow-sm rounded-xl bg-card overflow-hidden">
                <CardHeader className="p-8 pb-4 border-b border-border bg-muted/20">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-semibold flex items-center gap-3">
                        <DollarSign size={22} className="text-chart-emerald" /> Income Streams
                      </CardTitle>
                      <CardDescription className="font-medium">All five streams combined — adjust rates and frequency per stream.</CardDescription>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Combined Monthly</p>
                      <p className="text-2xl font-semibold text-foreground">
                        ${Math.round(salaryMetrics.current.monthly + extraStreamsMonthly).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium">
                        ${Math.round((salaryMetrics.current.monthly + extraStreamsMonthly) * 12).toLocaleString()}/yr
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/50">
                    {/* FNH row — read from real salary data */}
                    {(() => {
                      const src = isSandboxActive ? salaryMetrics.simulated : salaryMetrics.current;
                      const fnh_monthly = Math.round(src.monthly);
                      const fnh_annual  = fnh_monthly * 12;
                      const fnh_rate    = Math.round(src.avgRate) || Math.round(averageSessionRate) || 70;
                      const fnh_sessions = fnh_rate > 0 ? Math.round(fnh_monthly / fnh_rate) : 0;
                      return (
                        <div className="flex items-center gap-4 px-8 py-4 bg-muted">
                          <div className="w-8 h-8 rounded-lg bg-muted text-chart-primary flex items-center justify-center shrink-0">
                            <Brain size={16} />
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <p className="text-sm font-semibold text-foreground">FNH Sessions</p>
                            <p className="text-[10px] text-muted-foreground font-medium">
                              ~{fnh_sessions} sessions/mo · ${fnh_rate}/session avg
                              {isSandboxActive ? ' · Preview' : ' · Live'}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold text-foreground">${fnh_monthly.toLocaleString()}<span className="text-[10px] text-muted-foreground font-medium">/mo</span></p>
                            <p className="text-[10px] text-muted-foreground">${fnh_annual.toLocaleString()}/yr</p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Extra streams — editable */}
                    {extraStreams.map(stream => {
                      const Icon = STREAM_ICONS[stream.id] ?? DollarSign;
                      const monthly = stream.enabled ? Math.round(stream.ratePerUnit * stream.unitsPerMonth) : 0;
                      const annual  = monthly * 12;
                      return (
                        <div key={stream.id} className={cn("flex items-center gap-4 px-8 py-4 transition-opacity", !stream.enabled && "opacity-40")}>
                          <div className="w-8 h-8 rounded-lg bg-muted/60 text-muted-foreground flex items-center justify-center shrink-0">
                            <Icon size={16} />
                          </div>
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={stream.enabled}
                                onCheckedChange={v => updateStream(stream.id, 'enabled', v)}
                                className="scale-75 data-[state=checked]:bg-chart-emerald"
                              />
                              <p className="text-sm font-semibold text-foreground">{stream.name}</p>
                            </div>
                            {stream.enabled && (
                              <div className="grid grid-cols-2 gap-4 pr-4 animate-in fade-in duration-200">
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                                    <span>Rate / {(stream as any).unitLabel ?? 'unit'}</span>
                                    <span className="text-foreground font-semibold">${stream.ratePerUnit}</span>
                                  </div>
                                  <Slider value={[stream.ratePerUnit]} onValueChange={([v]) => updateStream(stream.id, 'ratePerUnit', v)}
                                    min={20} max={600} step={5} className="py-1" />
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                                    <span>{(stream as any).unitLabel ?? 'units'} / month</span>
                                    <span className="text-foreground font-semibold">{stream.unitsPerMonth}</span>
                                  </div>
                                  <Slider value={[stream.unitsPerMonth]} onValueChange={([v]) => updateStream(stream.id, 'unitsPerMonth', v)}
                                    min={0} max={20} step={0.5} className="py-1" />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="text-right shrink-0 min-w-[80px]">
                            <p className="text-sm font-semibold text-foreground">${monthly.toLocaleString()}<span className="text-[10px] text-muted-foreground font-medium">/mo</span></p>
                            <p className="text-[10px] text-muted-foreground">${annual.toLocaleString()}/yr</p>
                          </div>
                        </div>
                      );
                    })}

                    {/* Total row */}
                    <div className="flex items-center gap-4 px-8 py-5 bg-muted">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground uppercase tracking-wider">Total Combined</p>
                        <p className="text-[10px] text-muted-foreground font-medium">All enabled streams · {isSandboxActive ? 'Preview' : 'Current'} FNH</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-semibold text-chart-emerald">
                          ${Math.round(salaryMetrics.current.monthly + extraStreamsMonthly).toLocaleString()}
                          <span className="text-sm text-muted-foreground font-medium">/mo</span>
                        </p>
                        <p className="text-sm font-semibold text-chart-emerald">
                          ${Math.round((salaryMetrics.current.monthly + extraStreamsMonthly) * 12).toLocaleString()}/yr
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* How-to guide */}
              <Card className="border-none shadow-sm rounded-xl bg-muted/30 border border-border">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-xl bg-muted text-chart-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Info size={18} />
                    </div>
                    <div className="space-y-3 min-w-0">
                      <h4 className="font-semibold text-foreground text-sm">How to use the Salary Simulator</h4>
                      <ol className="space-y-2 text-xs text-muted-foreground font-medium list-none">
                        <li className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center shrink-0 mt-0.5">1</span>
                          <span><strong className="text-foreground">Check your current baseline</strong> — the left column shows what you're earning now, based on clients seen in the last 30 days and their actual session frequencies.</span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center shrink-0 mt-0.5">2</span>
                          <span><strong className="text-foreground">Toggle Preview Mode on</strong> — use the global sliders or client-by-client controls on the right to test a new rate or frequency scenario. The right column instantly reflects the impact.</span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center shrink-0 mt-0.5">3</span>
                          <span><strong className="text-foreground">Try a Preset</strong> — Conservative (+10%), Moderate (+25%), or Target ($150) are quick-start scenarios. Hit Reset Preview any time to return to your actual numbers.</span>
                        </li>
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Row: Progress to $150/session & Active Client Base */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Progress to $150/session */}
                <Card className="border-none shadow-sm rounded-xl bg-card overflow-hidden relative group">
                  <CardContent className="p-8 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Progress to $150/Session</span>
                      <div className="w-8 h-8 rounded-lg bg-muted text-chart-primary flex items-center justify-center">
                        <Target size={16} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-4xl font-semibold text-foreground">
                          ${isSandboxActive ? salaryMetrics.simulated.avgRate.toFixed(0) : salaryMetrics.current.avgRate.toFixed(0)}
                        </h3>
                        <span className="text-muted-foreground text-sm font-medium">/ $150 target</span>
                      </div>
                      <Progress 
                        value={((isSandboxActive ? salaryMetrics.simulated.avgRate : salaryMetrics.current.avgRate) / 150) * 100} 
                        className="h-2 bg-muted [&>div]:bg-primary" 
                      />
                      <p className="text-xs text-muted-foreground font-medium">
                        {isSandboxActive ? "Preview" : "Current"} average rate of clients seen in the last 30 days.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Active Client Base */}
                <Card className="border-none shadow-sm rounded-xl bg-card overflow-hidden relative group">
                  <CardContent className="p-8 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Active Client Base</span>
                      <div className="w-8 h-8 rounded-lg bg-muted text-chart-emerald flex items-center justify-center">
                        <Users size={16} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-4xl font-semibold text-foreground">{salaryMetrics.clientsCount}</h3>
                        <span className="text-muted-foreground text-sm font-medium">clients seen in last 30 days</span>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                        These clients represent your active recurring practice.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sandbox Presets Card */}
              <Card className="border-none shadow-sm rounded-xl bg-card overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Sliders className="text-chart-primary" size={18} />
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">Preview Presets</h4>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">
                    Quickly apply pre-configured pricing scenarios to see their immediate impact on your practice financials.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      onClick={() => handleApplyPreset('conservative')}
                      className="rounded-xl text-xs font-medium border-border hover:bg-muted text-chart-primary"
                    >
                      Conservative (+10% Rate)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleApplyPreset('moderate')}
                      className="rounded-xl text-xs font-medium border-border hover:bg-muted text-chart-emerald"
                    >
                      Moderate (+25% Rate)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleApplyPreset('target')}
                      className="rounded-xl text-xs font-medium border-border hover:bg-muted text-muted-foreground"
                    >
                      Target ($150 Standard Rate)
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => handleApplyPreset('reset')}
                      className="rounded-xl text-xs font-medium text-chart-destructive hover:bg-muted"
                    >
                      <RotateCcw size={14} className="mr-1.5" /> Reset Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Main Grid: Projections vs Client Sandbox */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Projections */}
                <div className="lg:col-span-7 space-y-6">
                  <Card className="border-none shadow-sm rounded-xl bg-card overflow-hidden">
                    <CardHeader className="p-8 pb-4 border-b border-border bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-xl font-semibold flex items-center gap-3">
                            <TrendingUp size={22} className="text-chart-primary" /> Salary Projections
                          </CardTitle>
                          <CardDescription className="font-medium">Based on active clients seen in the last 30 days.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch 
                            id="sandbox-mode-toggle"
                            checked={isSandboxActive}
                            onCheckedChange={setIsSandboxActive}
                            className="data-[state=checked]:bg-primary"
                          />
                          <Label htmlFor="sandbox-mode-toggle" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer">
                            Preview Mode
                          </Label>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                      {/* Projections Table */}
                      <div className="border border-border rounded-xl overflow-hidden">
                        <div className="grid grid-cols-3 bg-muted/40 border-b border-border text-[10px] font-semibold uppercase tracking-wider text-muted-foreground p-4">
                          <div>Frequency</div>
                          <div>Current</div>
                          <div className="text-chart-primary">Preview</div>
                        </div>
                        <div className="divide-y divide-border">
                          {[
                            { label: "Weekly", current: salaryMetrics.current.weekly, sim: salaryMetrics.simulated.weekly },
                            { label: "Fortnightly", current: salaryMetrics.current.fortnightly, sim: salaryMetrics.simulated.fortnightly },
                            { label: "Monthly", current: salaryMetrics.current.monthly, sim: salaryMetrics.simulated.monthly },
                            { label: "Annual (Salary)", current: salaryMetrics.current.annual, sim: salaryMetrics.simulated.annual, highlight: true },
                          ].map((row) => (
                            <div key={row.label} className={cn(
                              "grid grid-cols-3 p-4 items-center text-sm",
                              row.highlight ? "bg-muted font-medium" : ""
                            )}>
                              <div className="font-medium text-foreground">{row.label}</div>
                              <div className="text-muted-foreground">${Math.round(row.current).toLocaleString()}</div>
                              <div className={cn("font-semibold", isSandboxActive ? "text-chart-primary" : "text-muted-foreground/40")}>
                                ${Math.round(row.sim).toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Global Sandbox Controls */}
                      {isSandboxActive && (
                        <div className="space-y-6 p-6 bg-muted/30 rounded-xl border border-border animate-in slide-in-from-top-2 duration-300">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Sparkles size={14} className="text-chart-primary" /> Global Preview Controls
                          </h4>

                          {/* Global Rate Slider */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="text-xs font-medium text-muted-foreground">
                                Global Simulated Rate
                              </label>
                              <span className="text-sm font-semibold text-chart-primary">${globalSimRate}/session</span>
                            </div>
                            <Slider
                              value={[globalSimRate]}
                              onValueChange={(val) => setGlobalSimRate(val[0])}
                              min={30}
                              max={200}
                              step={5}
                            />
                          </div>

                          {/* Global Frequency Slider */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="text-xs font-medium text-muted-foreground">
                                Global Simulated Frequency
                              </label>
                              <span className="text-sm font-semibold text-chart-primary">{globalSimFrequency} sessions/mo</span>
                            </div>
                            <Slider
                              value={[globalSimFrequency]}
                              onValueChange={(val) => setGlobalSimFrequency(val[0])}
                              min={0.5}
                              max={4.0}
                              step={0.1}
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column: Client-by-Client Sandbox */}
                <div className="lg:col-span-5 space-y-6">
                  <Card className="border-none shadow-sm rounded-xl bg-card overflow-hidden">
                    <CardHeader className="p-8 pb-4 border-b border-border bg-muted/30">
                      <CardTitle className="text-lg font-medium flex items-center gap-2">
                        <Users size={20} className="text-chart-primary" /> Client Preview
                      </CardTitle>
                      <CardDescription>Customize individual client rates and frequencies.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <ScrollArea className="h-[450px] pr-4">
                        <div className="space-y-4">
                          {salaryMetrics.clientDetails.map((client) => {
                            const override = clientOverrides[client.id] || {};
                            const isActive = override.active !== false;
                            const rate = override.rate !== undefined ? override.rate : (isSandboxActive ? globalSimRate : client.currentRate);
                            const freq = override.frequency !== undefined ? override.frequency : (isSandboxActive ? globalSimFrequency : client.currentFreq);

                            return (
                              <div key={client.id} className={cn(
                                "p-4 rounded-xl border transition-all space-y-3",
                                isActive ? "bg-card border-border shadow-sm" : "bg-muted/20 border-border/40 opacity-50"
                              )}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Switch 
                                      checked={isActive}
                                      onCheckedChange={(checked) => handleClientOverrideChange(client.id, 'active', checked)}
                                      className="data-[state=checked]:bg-chart-emerald scale-75"
                                    />
                                    <Link 
                                      to={`/clients/${client.id}`}
                                      className="font-medium text-sm text-foreground hover:underline hover:text-chart-primary transition-colors"
                                    >
                                      {client.name}
                                    </Link>
                                  </div>
                                  <Badge variant="outline" className="text-[10px] font-semibold uppercase">
                                    ${Math.round(client.currentWeeklyRev * 52).toLocaleString()}/yr
                                  </Badge>
                                </div>

                                {isActive && isSandboxActive && (
                                  <div className="space-y-3 pt-2 border-t border-border/60 animate-in fade-in duration-300">
                                    {/* Individual Rate Slider */}
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                                        <span>Simulated Rate</span>
                                        <span className="text-chart-primary font-semibold">${rate}</span>
                                      </div>
                                      <Slider
                                        value={[rate]}
                                        onValueChange={(val) => handleClientOverrideChange(client.id, 'rate', val[0])}
                                        min={0}
                                        max={200}
                                        step={5}
                                      />
                                    </div>

                                    {/* Individual Frequency Slider */}
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                                        <span>Sessions/Mo</span>
                                        <span className="text-chart-primary font-semibold">{freq.toFixed(1)}</span>
                                      </div>
                                      <Slider
                                        value={[freq]}
                                        onValueChange={(val) => handleClientOverrideChange(client.id, 'frequency', val[0])}
                                        min={0.5}
                                        max={4.0}
                                        step={0.1}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* TAB 4: FULL AUDIT & FINANCIALS */}
            <TabsContent value="audit" className="space-y-8">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {/* Metric 1: Total Active Clients */}
                <Card className="border-none shadow-sm rounded-xl bg-card overflow-hidden relative group">
                  <CardContent className="p-6 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Active Clients</span>
                      <div className="w-8 h-8 rounded-lg bg-muted text-chart-primary flex items-center justify-center">
                        <Users size={16} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-3xl font-semibold text-foreground">{totalActiveClients}</h3>
                      <p className="text-xs text-muted-foreground font-medium">Seen in the last 90 days</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Metric 2: Average Session Rate */}
                <Card className="border-none shadow-sm rounded-xl bg-card overflow-hidden relative group">
                  <CardContent className="p-6 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Avg Session Rate</span>
                      <div className="w-8 h-8 rounded-lg bg-muted text-chart-emerald flex items-center justify-center">
                        <DollarSign size={16} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-3xl font-semibold text-foreground">${averageSessionRate.toFixed(0)}</h3>
                      <p className="text-xs text-muted-foreground font-medium">Across all clients</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Metric 3: Total Revenue */}
                <Card className="border-none shadow-sm rounded-xl bg-card overflow-hidden relative group">
                  <CardContent className="p-6 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total Revenue</span>
                      <div className="w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center">
                        <TrendingUp size={16} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-3xl font-semibold text-foreground">${totalRevenue.toLocaleString()}</h3>
                      <p className="text-xs text-muted-foreground font-medium">Sum of paid appointments</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Metric 4: Free Session Ratio */}
                <Card className="border-none shadow-sm rounded-xl bg-card overflow-hidden relative group">
                  <CardContent className="p-6 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Free Session Ratio</span>
                      <div className="w-8 h-8 rounded-lg bg-muted text-chart-destructive flex items-center justify-center">
                        <Percent size={16} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h3 className={cn("text-3xl font-semibold", freeSessionRatio > 30 ? "text-chart-destructive" : "text-foreground")}>
                        {freeSessionRatio.toFixed(1)}%
                      </h3>
                      <p className="text-xs text-muted-foreground font-medium">{freeSessions} of {totalSessions} sessions unpaid</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Metric 5: Projected Monthly Revenue */}
                <Card className="border-none shadow-sm rounded-xl bg-primary text-primary-foreground overflow-hidden relative group">
                  <CardContent className="p-6 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Projected Monthly</span>
                      <div className="w-8 h-8 rounded-lg bg-muted text-foreground flex items-center justify-center">
                        <Sparkles size={16} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-3xl font-semibold">${Math.round(projectedMonthlyRevenue).toLocaleString()}</h3>
                      <p className="text-xs text-muted-foreground/60 font-medium">Based on standard rates</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue Over Time Chart */}
              <Card className="border-none shadow-sm rounded-xl bg-card overflow-hidden">
                <CardHeader className="p-8 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                        <TrendingUp className="text-chart-primary" size={20} />
                        Revenue Over Time
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground font-medium mt-1">
                        Paid appointment revenue for the last 6 months.
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total (6mo)</p>
                        <p className="text-lg font-semibold text-foreground">${monthlyRevenueData.reduce((s, m) => s + m.revenue, 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Avg / Month</p>
                        <p className="text-lg font-semibold text-chart-primary">${Math.round(monthlyRevenueData.reduce((s, m) => s + m.revenue, 0) / Math.max(monthlyRevenueData.length, 1)).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <div className="flex items-end justify-between gap-4 pt-6" style={{ height: 200 }}>
                    {monthlyRevenueData.map((month) => {
                      const pct = month.revenue / maxMonthlyRevenue;
                      return (
                        <div key={month.label} className="flex-1 flex flex-col items-center justify-end h-full space-y-2 group relative">
                          <div className="absolute bottom-full mb-2 bg-card text-foreground text-[10px] font-medium px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap border border-border shadow-sm">
                            ${month.revenue.toLocaleString()} · {month.sessions} session{month.sessions !== 1 ? 's' : ''}
                          </div>
                          <div
                            className="w-full max-w-[48px] rounded-lg bg-gradient-to-t from-chart-primary/80 to-chart-primary/30 transition-all duration-500 group-hover:brightness-110"
                            style={{ height: `${Math.max(pct * 160, 6)}px` }}
                          />
                          <span className="text-[10px] font-medium text-muted-foreground">{month.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Rate Distribution Chart */}
              <Card className="border-none shadow-sm rounded-xl bg-card">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-xl font-semibold text-foreground">Rate Distribution</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground font-medium">
                    Visual breakdown of clients across standard payment tiers.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <div className="space-y-6">
                    {/* Custom Bar Chart */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 pt-6">
                      {[
                        { label: "Free", count: rateDistribution.free, color: "bg-rose-500" },
                        { label: "$30", count: rateDistribution.r30, color: "bg-amber-500" },
                        { label: "$50", count: rateDistribution.r50, color: "bg-yellow-500" },
                        { label: "$70", count: rateDistribution.r70, color: "bg-orange-500" },
                        { label: "$80", count: rateDistribution.r80, color: "bg-emerald-500" },
                        { label: "$90", count: rateDistribution.r90, color: "bg-teal-500" },
                        { label: "$100", count: rateDistribution.r100, color: "bg-primary" },
                        { label: "$120", count: rateDistribution.r120, color: "bg-indigo-500" },
                        { label: "$150", count: rateDistribution.r150, color: "bg-purple-500" },
                        { label: "Custom", count: rateDistribution.custom, color: "bg-pink-500" },
                      ].map((tier) => {
                        const percentage = clients.length > 0 ? (tier.count / clients.length) * 100 : 0;
                        const barHeight = (tier.count / maxDistributionCount) * 150; // max height 150px

                        return (
                          <div key={tier.label} className="flex flex-col items-center justify-end space-y-3 group">
                            {/* Bar Container */}
                            <div className="w-full bg-muted/30 rounded-xl h-[180px] flex items-end p-2 relative overflow-hidden">
                              {/* Tooltip */}
                              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-card text-foreground text-[10px] font-medium px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                                {tier.count} {tier.count === 1 ? "client" : "clients"} ({percentage.toFixed(1)}%)
                              </div>
                              
                              {/* Actual Bar */}
                              <div
                                className={`w-full rounded-xl transition-all duration-500 group-hover:brightness-110 ${tier.color}`}
                                style={{ height: `${Math.max(barHeight, 8)}px` }}
                              />
                            </div>
                            
                            {/* Labels */}
                            <div className="text-center space-y-0.5">
                              <span className="text-xs font-semibold text-foreground block">{tier.label}</span>
                              <span className="text-[10px] font-medium text-muted-foreground block">
                                {tier.count} {tier.count === 1 ? "client" : "clients"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 4: AI SUGGESTIONS */}
            <TabsContent value="suggestions" className="space-y-8">
              {/* Goal Banner */}
              <Card className="border-none shadow-sm rounded-xl bg-card border border-border text-foreground">
                <div className="absolute inset-0 bg-gradient-to-br from-muted/30 via-background to-muted/30" />
                <CardContent className="p-8 md:p-10 relative z-10">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="space-y-3 max-w-2xl">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Rate Increase Roadmap</p>
                      <h2 className="text-3xl font-semibold tracking-tight leading-tight text-foreground">
                        $150/session by end of 2027
                      </h2>
                      <p className="text-sm text-muted-foreground/60 font-medium leading-relaxed">
                        {aiSuggestions?.summary || "A four-phase plan to move every client to $150. Each phase targets a specific rate tier — use the Rates tab to action contact emails and confirm upgrades as you go."}
                      </p>
                      {lastAnalyzed && (
                        <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5">
                          <Clock size={12} />
                          AI analysis updated {formatDistanceToNow(new Date(lastAnalyzed), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={handleGenerateSuggestions}
                      disabled={isAnalyzing}
                      className="bg-muted hover:bg-muted/80 text-foreground font-semibold text-[10px] uppercase tracking-wider h-10 px-6 rounded-xl shadow-sm shrink-0 self-start"
                    >
                      {isAnalyzing ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analysing...</>
                      ) : (
                        <><Wand2 className="mr-2 h-4 w-4" />Refresh AI Analysis</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Action Plan Tasks */}
              <RoadmapTasks rateDistribution={rateDistribution} averageSessionRate={averageSessionRate} />

              {/* Transition Roadmap & Value-Add Strategies */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Transition Roadmap */}
                <Card className="border-none shadow-sm rounded-xl bg-card">
                  <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                      <TrendingUp className="text-chart-primary" size={22} />
                      Transition Roadmap
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground font-medium">
                      Step-by-step timeline to transition existing clients to higher rate tiers.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 pt-4 space-y-6">
                    <div className="relative border-l-2 border-border pl-6 ml-4 space-y-8">
                      {activeRoadmap.map((step, idx) => (
                        <div key={idx} className="relative">
                          <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-primary border-4 border-background" />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-chart-primary/10 text-chart-primary border-none font-medium text-[10px] uppercase tracking-wider">
                                {step.phase}
                              </Badge>
                            </div>
                            <h4 className="font-semibold text-foreground text-base">{step.title}</h4>
                            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Value-Add Strategies */}
                <Card className="border-none shadow-sm rounded-xl bg-card">
                  <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                      <Sparkles className="text-muted-foreground" size={22} />
                      Value-Add Strategies
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground font-medium">
                      AI-generated advice on how to justify higher rates and elevate client experience.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 pt-4 space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                      {activeStrategies.map((strategy, idx) => (
                        <div key={idx} className="p-5 rounded-xl bg-muted/30 border border-border/40 space-y-2">
                          <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary" />
                            {strategy.title}
                          </h4>
                          <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                            {strategy.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue Projection Simulator */}
              <Card className="border-none shadow-sm rounded-xl bg-card">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <TrendingUp className="text-chart-emerald" size={22} />
                    Revenue Projection Simulator
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground font-medium">
                    Adjust the sliders to see how your monthly revenue changes as you increase your average session rate toward $150.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-4 space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Sliders */}
                    <div className="space-y-6">
                      {/* Slider 1: Target Average Session Rate */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Target Average Session Rate
                          </label>
                          <span className="text-sm font-semibold text-chart-primary">${targetRate}</span>
                        </div>
                        <Slider
                          value={[targetRate]}
                          onValueChange={(val) => setTargetRate(val[0])}
                          min={30}
                          max={150}
                          step={5}
                          className="py-4"
                        />
                        <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                          <span>$30</span>
                          <span>$90</span>
                          <span>$150</span>
                        </div>
                      </div>

                      {/* Slider 2: Active Client Count */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Active Client Count
                          </label>
                          <span className="text-sm font-semibold text-chart-primary">{simulatorClients} clients</span>
                        </div>
                        <Slider
                          value={[simulatorClients]}
                          onValueChange={(val) => setSimulatorClients(val[0])}
                          min={5}
                          max={100}
                          step={1}
                          className="py-4"
                        />
                        <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                          <span>5 clients</span>
                          <span>50 clients</span>
                          <span>100 clients</span>
                        </div>
                      </div>

                      {/* Slider 3: Average Sessions per Client per Month */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Avg Sessions per Client / Month
                          </label>
                          <span className="text-sm font-semibold text-chart-primary">{simulatorFrequency} sessions</span>
                        </div>
                        <Slider
                          value={[simulatorFrequency]}
                          onValueChange={(val) => setSimulatorFrequency(val[0])}
                          min={0.5}
                          max={4.0}
                          step={0.1}
                          className="py-4"
                        />
                        <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                          <span>0.5 sessions</span>
                          <span>2.0 sessions</span>
                          <span>4.0 sessions</span>
                        </div>
                      </div>
                    </div>

                    {/* Results Card */}
                    <div className="p-6 rounded-xl bg-muted/30 border border-border/40 flex flex-col justify-between space-y-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-foreground text-sm uppercase tracking-wider">
                          Projected Revenue Impact
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <span className="text-[10px] font-medium text-muted-foreground block">Current Projected</span>
                            <span className="text-xl font-semibold text-muted-foreground">
                              ${Math.round(currentProjectedRevenue).toLocaleString()}/mo
                            </span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-medium text-chart-primary block">Target Projected</span>
                            <span className="text-xl font-semibold text-chart-primary">
                              ${Math.round(targetProjectedRevenue).toLocaleString()}/mo
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Revenue Increase Callout */}
                      <div className="p-4 rounded-xl bg-muted border border-border flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-chart-emerald">
                            Monthly Revenue Increase
                          </span>
                          <h3 className="text-2xl font-semibold text-chart-emerald">
                            +${Math.round(revenueIncrease).toLocaleString()}
                          </h3>
                        </div>
                        <Badge className="bg-chart-emerald/10 text-chart-emerald border-none font-semibold text-xs px-3 py-1 rounded-full">
                          +{percentageIncrease.toFixed(0)}%
                        </Badge>
                      </div>

                      {/* Annual Impact */}
                      <div className="text-xs text-muted-foreground font-medium text-center">
                        Annualized practice revenue increase of{" "}
                        <strong className="text-foreground font-semibold">
                          +${Math.round(revenueIncrease * 12).toLocaleString()}
                        </strong>{" "}
                        per year.
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          </div>
        )}
      </div>

      {/* Preferred Time Override Modal */}
      <Dialog open={isOverrideModalOpen} onOpenChange={setIsOverrideModalOpen}>
        <DialogContent className="rounded-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-foreground">Set Preferred Time Override</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground font-medium">
              Set a manual preferred appointment time for {selectedClient?.name}. This will override the auto-analyzed time.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold tracking-wider text-muted-foreground">
                Preferred Appointment Time
              </label>
              <Input
                placeholder="e.g., Tuesdays at 10:00 AM"
                value={overrideTimeValue}
                onChange={(e) => setOverrideTimeValue(e.target.value)}
                className="rounded-xl border-border/60 focus-visible:ring-primary"
              />
              <p className="text-[10px] text-muted-foreground font-medium">
                Leave blank to clear override and use auto-analyzed time.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsOverrideModalOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleSaveOverride} className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground">
              Save Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Rate Modal */}
      <Dialog open={isCustomRateModalOpen} onOpenChange={setIsCustomRateModalOpen}>
        <DialogContent className="rounded-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-foreground">Set Custom Standard Rate</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground font-medium">
              Enter a custom standard session rate ($) for {selectedClient?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold tracking-wider text-muted-foreground">
                Standard Rate ($)
              </label>
              <Input
                type="number"
                placeholder="e.g., 75"
                value={customRateValue}
                onChange={(e) => setCustomRateValue(e.target.value)}
                className="rounded-xl border-border/60 focus-visible:ring-primary"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsCustomRateModalOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleSaveCustomRate} className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground">
              Save Rate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Booking Modal */}
      <QuickBookDialog
        clientId={bookingClientId}
        open={isBookingModalOpen}
        onOpenChange={setIsBookingModalOpen}
        onSuccess={() => {
          setIsBookingModalOpen(false);
          fetchData();
        }}
      />

      <ConfirmDialog
        open={showEmailConfirm}
        onOpenChange={setShowEmailConfirm}
        title="Send Onboarding Emails"
        description={`Are you sure you want to send onboarding emails to ${emailConfirmCount} clients?`}
        onConfirm={executeSendEmails}
      />

      {/* STICKY BULK ACTIONS BAR */}
      {selectedWeeklyClients.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-4 animate-in slide-in-from-bottom-10 duration-500">
          <div className="bg-card/95 text-foreground rounded-xl p-4 shadow-sm border border-border backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-semibold text-xs">
                {selectedWeeklyClients.length}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Bulk Actions</p>
                <p className="text-[10px] text-muted-foreground font-medium uppercase">Apply changes to selected clients</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              {/* Bulk Target Rate */}
              <Select onValueChange={(val) => handleBulkSetTargetRate(parseInt(val))} disabled={bulkActionLoading}>
                <SelectTrigger className="w-[120px] h-9 rounded-xl bg-muted border-border text-[10px] font-semibold uppercase tracking-wider text-chart-primary">
                  <SelectValue placeholder="Set Target" />
                </SelectTrigger>
                <SelectContent className="rounded-xl bg-card text-foreground border-border">
                  {RATE_OPTIONS.filter(opt => opt.value !== -1).map(opt => (
                    <SelectItem key={opt.value} value={opt.value.toString()} className="text-xs font-medium">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Bulk Re-engagement Tag */}
              <Select onValueChange={(val: any) => handleBulkSetReengagementTag(val === "neutral" ? null : val)} disabled={bulkActionLoading}>
                <SelectTrigger className="w-[120px] h-9 rounded-xl bg-muted border-border text-[10px] font-semibold uppercase tracking-wider text-chart-destructive">
                  <SelectValue placeholder="Set Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl bg-card text-foreground border-border">
                  <SelectItem value="neutral" className="text-xs font-medium">Neutral</SelectItem>
                  <SelectItem value="warm" className="text-xs font-medium text-chart-emerald">Warm</SelectItem>
                  <SelectItem value="cold" className="text-xs font-medium text-chart-primary">Cold</SelectItem>
                  <SelectItem value="lost" className="text-xs font-medium text-muted-foreground">Lost</SelectItem>
                </SelectContent>
              </Select>

              {/* Bulk Onboarding */}
              <Button
                size="sm"
                onClick={handleBulkSendOnboardingClick}
                disabled={bulkActionLoading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-9 px-4 font-semibold text-[10px] uppercase tracking-wider"
              >
                {bulkActionLoading ? <Loader2 className="animate-spin" size={12} /> : <Send size={12} className="mr-1.5" />}
                Onboard
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearWeeklyClients}
                className="text-muted-foreground/60 hover:text-foreground rounded-xl h-9 px-3 font-semibold text-[10px] uppercase tracking-wider"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}
      </>
  );
}

const ClientAuditPage = () => (
  <AppLayout variant="wide">
    <ClientAuditTool />
  </AppLayout>
);

export default ClientAuditPage;