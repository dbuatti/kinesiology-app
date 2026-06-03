"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import AppLayout from "@/components/crm/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
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
  CalendarDays
} from "lucide-react";
import { format, formatDistanceToNow, differenceInMonths } from "date-fns";
import { Client, Appointment } from "@/types/crm";
import AppointmentForm from "@/components/crm/AppointmentForm";
import { ClientRow } from "@/components/crm/settings/ClientRow";
import TimetableVisualizer from "@/components/crm/settings/TimetableVisualizer";

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

export default function ClientAuditPage() {
  const [clients, setClients] = useState<ClientWithAppointments[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "lastSeen" | "rate" | "age">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filterRate, setFilterRate] = useState<string>("all");
  const [filterFollowUp, setFilterFollowUp] = useState<string>("all");
  
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

  useEffect(() => {
    fetchData();
    
    // Load cached AI suggestions
    const cached = localStorage.getItem("antigravity_client_audit_suggestions");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setAiSuggestions(parsed.suggestions);
        setLastAnalyzed(parsed.lastAnalyzed);
      } catch (e) {
        console.error("Failed to parse cached audit suggestions", e);
      }
    }

    const cachedWeeklyClients = localStorage.getItem("antigravity_selected_weekly_clients");
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
        .select("id, client_id, date, price_amount, is_paid, payment_received")
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
      const cachedTargetRates = localStorage.getItem("antigravity_client_target_rates");
      const cachedRateUpdatedDates = localStorage.getItem("antigravity_client_rate_updated_dates");
      const cachedReengagementTags = localStorage.getItem("antigravity_client_reengagement_tags");

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
        localStorage.removeItem("antigravity_client_target_rates");
        localStorage.removeItem("antigravity_client_rate_updated_dates");
        localStorage.removeItem("antigravity_client_reengagement_tags");
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

      localStorage.setItem("antigravity_client_audit_suggestions", JSON.stringify({
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
      localStorage.setItem("antigravity_selected_weekly_clients", JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearWeeklyClients = () => {
    setSelectedWeeklyClients([]);
    localStorage.removeItem("antigravity_selected_weekly_clients");
    showSuccess("Weekly booking simulator cleared.");
  };

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

  const handleBulkSendOnboarding = async () => {
    if (selectedWeeklyClients.length === 0) return;
    
    const clientsWithEmail = clients.filter(c => selectedWeeklyClients.includes(c.id) && c.email);
    if (clientsWithEmail.length === 0) {
      showError("None of the selected clients have a valid email address.");
      return;
    }

    if (!confirm(`Are you sure you want to send onboarding emails to ${clientsWithEmail.length} clients?`)) {
      return;
    }

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
          console.error(`Failed to send onboarding to ${client.name}: err`);
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

  const groups = {
    lastMonth: sortedClients.filter(
      (c) => (c.lastSeenDate && c.lastSeenDate >= oneMonthAgo) || c.appointments.some(app => new Date(app.date) > now)
    ),
    oneToThreeMonths: sortedClients.filter(
      (c) =>
        !c.appointments.some(app => new Date(app.date) > now) &&
        c.lastSeenDate &&
        c.lastSeenDate < oneMonthAgo &&
        c.lastSeenDate >= threeMonthsAgo
    ),
    threePlusMonths: sortedClients.filter(
      (c) =>
        !c.appointments.some(app => new Date(app.date) > now) &&
        (!c.lastSeenDate || c.lastSeenDate < threeMonthsAgo)
    ),
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
    localStorage.setItem("antigravity_selected_weekly_clients", JSON.stringify(activeIds));
    showSuccess("Selected all active clients (seen in last 30 days).");
  };

  const handleSelectAllNeedsFollowUp = () => {
    const needsFollowUpIds = clients.filter(c => c.followUpStatus === "Needs Follow-up").map(c => c.id);
    setSelectedWeeklyClients(needsFollowUpIds);
    localStorage.setItem("antigravity_selected_weekly_clients", JSON.stringify(needsFollowUpIds));
    showSuccess("Selected all clients needing follow-up.");
  };

  const handleSelectAllOneToThreeMonths = () => {
    const ids = groups.oneToThreeMonths.map(c => c.id);
    setSelectedWeeklyClients(ids);
    localStorage.setItem("antigravity_selected_weekly_clients", JSON.stringify(ids));
    showSuccess("Selected all clients seen 1-3 months ago.");
  };

  // SECTION SELECT ALL HANDLERS
  const isAllLastMonthSelected = groups.lastMonth.length > 0 && groups.lastMonth.every(c => selectedWeeklyClients.includes(c.id));
  const handleToggleAllLastMonth = () => {
    const lastMonthIds = groups.lastMonth.map(c => c.id);
    if (isAllLastMonthSelected) {
      setSelectedWeeklyClients(prev => {
        const updated = prev.filter(id => !lastMonthIds.includes(id));
        localStorage.setItem("antigravity_selected_weekly_clients", JSON.stringify(updated));
        return updated;
      });
    } else {
      setSelectedWeeklyClients(prev => {
        const updated = Array.from(new Set([...prev, ...lastMonthIds]));
        localStorage.setItem("antigravity_selected_weekly_clients", JSON.stringify(updated));
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
        localStorage.setItem("antigravity_selected_weekly_clients", JSON.stringify(updated));
        return updated;
      });
    } else {
      setSelectedWeeklyClients(prev => {
        const updated = Array.from(new Set([...prev, ...ids]));
        localStorage.setItem("antigravity_selected_weekly_clients", JSON.stringify(updated));
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
        localStorage.setItem("antigravity_selected_weekly_clients", JSON.stringify(updated));
        return updated;
      });
    } else {
      setSelectedWeeklyClients(prev => {
        const updated = Array.from(new Set([...prev, ...ids]));
        localStorage.setItem("antigravity_selected_weekly_clients", JSON.stringify(updated));
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
      showSuccess("Sandbox reset to actual values.");
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
    <AppLayout variant="full">
      <div className="space-y-8 animate-in fade-in duration-700 pb-20">
        <PageHeader
          title="Client Payment & Audit"
          subtitle="Review client rates, track appointment recency, identify follow-up needs, and perform financial audits with AI-driven pricing suggestions."
          icon={FileText}
          iconClassName="bg-amber-600"
          breadcrumbs={[{ label: "Business", path: "/business" }, { label: "Client Audit" }]}
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">Loading Audit Data...</p>
          </div>
        ) : (
          <Tabs defaultValue="rates" className="space-y-8">
            <TabsList className="bg-muted/50 p-1 rounded-2xl border border-border/50 w-full max-w-3xl grid grid-cols-5">
              <TabsTrigger value="rates" className="rounded-xl font-bold text-xs py-2.5">
                Rates
              </TabsTrigger>
              <TabsTrigger value="timetable" className="rounded-xl font-bold text-xs py-2.5">
                Timetable
              </TabsTrigger>
              <TabsTrigger value="salary" className="rounded-xl font-bold text-xs py-2.5">
                Salary Sim
              </TabsTrigger>
              <TabsTrigger value="audit" className="rounded-xl font-bold text-xs py-2.5">
                Financials
              </TabsTrigger>
              <TabsTrigger value="suggestions" className="rounded-xl font-bold text-xs py-2.5">
                AI Roadmap
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: RATES & RECENCY */}
            <TabsContent value="rates" className="space-y-6">
              {/* WEEKLY BOOKING SIMULATOR CARD */}
              <Card className="border-none shadow-lg rounded-[2.5rem] bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white overflow-hidden relative group">
                <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
                <CardContent className="p-8 space-y-6 relative z-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-black text-[9px] uppercase tracking-widest px-3 py-0.5">
                        Interactive Tool
                      </Badge>
                      <h3 className="text-2xl font-black tracking-tight flex items-center gap-2">
                        <CalendarCheck className="text-indigo-400" size={24} />
                        Weekly Booking Simulator
                      </h3>
                      <p className="text-xs text-slate-300 font-medium">
                        Select clients from the lists below to simulate this week's bookings and see the direct impact of your rate ladder.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {weeklySimulatorMetrics.count > 0 && (
                        <Button
                          variant="ghost"
                          onClick={handleClearWeeklyClients}
                          className="text-slate-300 hover:text-white hover:bg-white/10 rounded-xl text-xs font-bold"
                        >
                          <Trash2 size={14} className="mr-2" /> Clear Simulator
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Quick Select Buttons */}
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-900/70 dark:bg-slate-900/60 rounded-2xl border border-slate-800/80">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 self-center px-2">
                      Quick Select:
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllActive}
                      className="bg-slate-950/40 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl text-xs font-bold h-8"
                    >
                      Active (Last 30 Days)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllOneToThreeMonths}
                      className="bg-slate-950/40 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl text-xs font-bold h-8"
                    >
                      1-3 Months Ago
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllNeedsFollowUp}
                      className="bg-slate-950/40 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl text-xs font-bold h-8"
                    >
                      Needs Follow-up
                    </Button>
                  </div>

                  {weeklySimulatorMetrics.count === 0 ? (
                    <div className="p-6 rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 text-center space-y-2">
                      <p className="text-sm font-bold text-slate-400">No clients selected for this week.</p>
                      <p className="text-xs text-slate-500">
                        Check the box next to any client's name in the lists below to add them to this week's schedule.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                      {/* Selected Badges */}
                      <div className="lg:col-span-6 space-y-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                          This Week's Schedule ({weeklySimulatorMetrics.count})
                        </span>
                        <ScrollArea className="h-[100px] pr-2">
                          <div className="flex flex-wrap gap-2">
                            {weeklySimulatorMetrics.details.map(c => (
                              <Badge
                                key={c.id}
                                className="bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700/50 pl-3 pr-1.5 py-1 rounded-xl flex items-center gap-1.5 text-xs font-bold"
                              >
                                {c.name}
                                <span className="text-indigo-400 font-black">${c.currentRate}</span>
                                <button
                                  onClick={() => handleToggleWeeklyClient(c.id)}
                                  className="w-4 h-4 rounded-full bg-slate-700 hover:bg-rose-50/20 hover:text-rose-400 flex items-center justify-center transition-colors"
                                >
                                  <X size={10} />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>

                      {/* Projections */}
                      <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/50 p-5 rounded-3xl border border-slate-800/60">
                        <div className="space-y-1">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Current Earnings</span>
                          <h4 className="text-2xl font-black text-white">${weeklySimulatorMetrics.currentTotal}</h4>
                          <span className="text-[10px] text-slate-500 font-medium block">at current rates</span>
                        </div>
                        <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-slate-800/80 pt-3 sm:pt-0 sm:pl-4">
                          <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 block">Target Earnings</span>
                          <h4 className="text-2xl font-black text-indigo-400">${weeklySimulatorMetrics.targetTotal}</h4>
                          <span className="text-[10px] text-slate-500 font-medium block">at target rates</span>
                        </div>
                        <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-slate-800/80 pt-3 sm:pt-0 sm:pl-4">
                          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 block">Weekly Increase</span>
                          <h4 className="text-2xl font-black text-emerald-400">
                            +${weeklySimulatorMetrics.increase}
                          </h4>
                          <span className="text-[10px] text-slate-500 font-medium block">
                            +${weeklySimulatorMetrics.annualizedImpact.toLocaleString()}/yr
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Controls Card */}
              <Card className="border-none shadow-md rounded-[2rem] bg-card">
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
                          className="pl-10 rounded-xl border-border/60 bg-muted/30 focus-visible:ring-indigo-500"
                        />
                      </div>
                      {isFilterActive && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium shrink-0">
                          <span>Showing {filteredClients.length} of {clients.length}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleResetFilters}
                            className="h-7 px-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg text-[10px] font-black uppercase tracking-wider"
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
                          <SelectContent className="rounded-xl shadow-xl">
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
                        <SelectContent className="rounded-xl shadow-xl">
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
                        <SelectContent className="rounded-xl shadow-xl">
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
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Grouped Collapsible Sections */}
              <div className="space-y-4">
                {/* Section 1: Last Month */}
                <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-card">
                  <div className="w-full p-6 flex flex-col sm:flex-row sm:items-center justify-between bg-muted/20 hover:bg-muted/30 transition-colors text-left gap-4">
                    <button
                      onClick={() => toggleSection("lastMonth")}
                      className="flex items-center gap-3 flex-1"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 size={18} />
                      </div>
                      <div>
                        <h3 className="font-black text-foreground text-base">Active & Upcoming</h3>
                        <p className="text-xs text-muted-foreground font-medium">Seen in the last 30 days OR booked in the future</p>
                      </div>
                      <Badge variant="secondary" className="ml-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-none font-bold">
                        {groups.lastMonth.length} {groups.lastMonth.length === 1 ? "client" : "clients"}
                      </Badge>
                    </button>
                    
                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {groups.lastMonth.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleToggleAllLastMonth}
                          className="h-8 rounded-xl text-xs font-bold border-border/60 bg-background hover:bg-muted"
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
                              <tr className="border-b border-border/40 bg-muted/10 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
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
                                  onQuickBook={setBookingClientId}
                                  onRefresh={fetchData}
                                  averageSessionRate={averageSessionRate}
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
                <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-card">
                  <div className="w-full p-6 flex flex-col sm:flex-row sm:items-center justify-between bg-muted/20 hover:bg-muted/30 transition-colors text-left gap-4">
                    <button
                      onClick={() => toggleSection("oneToThreeMonths")}
                      className="flex items-center gap-3 flex-1"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 flex items-center justify-center">
                        <Clock size={18} />
                      </div>
                      <div>
                        <h3 className="font-black text-foreground text-base">1-3 Months</h3>
                        <p className="text-xs text-muted-foreground font-medium">Seen 30 to 90 days ago</p>
                      </div>
                      <Badge variant="secondary" className="ml-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-none font-bold">
                        {groups.oneToThreeMonths.length} {groups.oneToThreeMonths.length === 1 ? "client" : "clients"}
                      </Badge>
                    </button>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {groups.oneToThreeMonths.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleToggleAllOneToThreeMonths}
                          className="h-8 rounded-xl text-xs font-bold border-border/60 bg-background hover:bg-muted"
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
                        <div className="p-8 text-center text-muted-foreground text-sm font-medium">
                          No clients in this section.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-border/40 bg-muted/10 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
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
                                  onQuickBook={setBookingClientId}
                                  onRefresh={fetchData}
                                  averageSessionRate={averageSessionRate}
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
                <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-card">
                  <div className="w-full p-6 flex flex-col sm:flex-row sm:items-center justify-between bg-muted/20 hover:bg-muted/30 transition-colors text-left gap-4">
                    <button
                      onClick={() => toggleSection("threePlusMonths")}
                      className="flex items-center gap-3 flex-1"
                    >
                      <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 flex items-center justify-center">
                        <AlertCircle size={18} />
                      </div>
                      <div>
                        <h3 className="font-black text-foreground text-base">3+ Months (Re-engagement Goldmine)</h3>
                        <p className="text-xs text-muted-foreground font-medium">Seen more than 90 days ago, or never seen</p>
                      </div>
                      <Badge variant="secondary" className="ml-2 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-none font-bold">
                        {groups.threePlusMonths.length} {groups.threePlusMonths.length === 1 ? "client" : "clients"}
                      </Badge>
                    </button>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {groups.threePlusMonths.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleToggleAllThreePlusMonths}
                          className="h-8 rounded-xl text-xs font-bold border-border/60 bg-background hover:bg-muted"
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
                        <div className="p-8 text-center text-muted-foreground text-sm font-medium">
                          No clients in this section.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-border/40 bg-muted/10 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
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
                                  onQuickBook={setBookingClientId}
                                  onRefresh={fetchData}
                                  averageSessionRate={averageSessionRate}
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
              {/* How-to guide */}
              <Card className="border-none shadow-sm rounded-[2rem] bg-muted/30 border border-border">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Info size={18} />
                    </div>
                    <div className="space-y-3 min-w-0">
                      <h4 className="font-black text-foreground text-sm">How to use the Salary Simulator</h4>
                      <ol className="space-y-2 text-xs text-muted-foreground font-medium list-none">
                        <li className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">1</span>
                          <span><strong className="text-foreground">Check your current baseline</strong> — the left column shows what you're earning now, based on clients seen in the last 30 days and their actual session frequencies.</span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">2</span>
                          <span><strong className="text-foreground">Toggle Sandbox Mode on</strong> — use the global sliders or client-by-client controls on the right to test a new rate or frequency scenario. The right column instantly reflects the impact.</span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">3</span>
                          <span><strong className="text-foreground">Try a Preset</strong> — Conservative (+10%), Moderate (+25%), or Target ($150) are quick-start scenarios. Hit Reset Sandbox any time to return to your actual numbers.</span>
                        </li>
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Row: Progress to $150/session & Active Client Base */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Progress to $150/session */}
                <Card className="border-none shadow-md rounded-[2rem] bg-card overflow-hidden relative group">
                  <CardContent className="p-8 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Progress to $150/Session</span>
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 flex items-center justify-center">
                        <Target size={16} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-4xl font-black text-foreground">
                          ${isSandboxActive ? salaryMetrics.simulated.avgRate.toFixed(0) : salaryMetrics.current.avgRate.toFixed(0)}
                        </h3>
                        <span className="text-muted-foreground text-sm font-bold">/ $150 target</span>
                      </div>
                      <Progress 
                        value={((isSandboxActive ? salaryMetrics.simulated.avgRate : salaryMetrics.current.avgRate) / 150) * 100} 
                        className="h-2 bg-muted [&>div]:bg-indigo-600" 
                      />
                      <p className="text-xs text-muted-foreground font-medium">
                        {isSandboxActive ? "Sandbox" : "Current"} average rate of clients seen in the last 30 days.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Active Client Base */}
                <Card className="border-none shadow-md rounded-[2rem] bg-card overflow-hidden relative group">
                  <CardContent className="p-8 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Client Base</span>
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center">
                        <Users size={16} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-4xl font-black text-foreground">{salaryMetrics.clientsCount}</h3>
                        <span className="text-muted-foreground text-sm font-bold">clients seen in last 30 days</span>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                        These clients represent your active recurring practice.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sandbox Presets Card */}
              <Card className="border-none shadow-md rounded-[2rem] bg-card overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Sliders className="text-indigo-600" size={18} />
                    <h4 className="text-sm font-black uppercase tracking-wider text-foreground">Sandbox Presets</h4>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">
                    Quickly apply pre-configured pricing scenarios to see their immediate impact on your practice financials.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      onClick={() => handleApplyPreset('conservative')}
                      className="rounded-xl text-xs font-bold border-indigo-100 dark:border-indigo-950/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400"
                    >
                      Conservative (+10% Rate)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleApplyPreset('moderate')}
                      className="rounded-xl text-xs font-bold border-emerald-100 dark:border-emerald-950/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                    >
                      Moderate (+25% Rate)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleApplyPreset('target')}
                      className="rounded-xl text-xs font-bold border-purple-100 dark:border-purple-950/50 hover:bg-purple-50 dark:hover:bg-purple-950/30 text-purple-600 dark:text-purple-400"
                    >
                      Target ($150 Standard Rate)
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => handleApplyPreset('reset')}
                      className="rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      <RotateCcw size={14} className="mr-1.5" /> Reset Sandbox
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Main Grid: Projections vs Client Sandbox */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Projections */}
                <div className="lg:col-span-7 space-y-6">
                  <Card className="border-none shadow-lg rounded-[2.5rem] bg-card overflow-hidden">
                    <CardHeader className="p-8 pb-4 border-b border-border bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-xl font-black flex items-center gap-3">
                            <TrendingUp size={22} className="text-indigo-600" /> Salary Projections
                          </CardTitle>
                          <CardDescription className="font-medium">Based on active clients seen in the last 30 days.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch 
                            id="sandbox-mode-toggle"
                            checked={isSandboxActive}
                            onCheckedChange={setIsSandboxActive}
                            className="data-[state=checked]:bg-indigo-600"
                          />
                          <Label htmlFor="sandbox-mode-toggle" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground cursor-pointer">
                            Sandbox Mode
                          </Label>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                      {/* Projections Table */}
                      <div className="border border-border rounded-2xl overflow-hidden">
                        <div className="grid grid-cols-3 bg-muted/40 border-b border-border text-[10px] font-black uppercase tracking-widest text-muted-foreground p-4">
                          <div>Frequency</div>
                          <div>Current</div>
                          <div className="text-indigo-600 dark:text-indigo-400">Sandbox</div>
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
                              row.highlight ? "bg-indigo-50/30 dark:bg-indigo-950/10 font-bold" : ""
                            )}>
                              <div className="font-bold text-foreground">{row.label}</div>
                              <div className="text-muted-foreground">${Math.round(row.current).toLocaleString()}</div>
                              <div className={cn("font-black", isSandboxActive ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground/40")}>
                                ${Math.round(row.sim).toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Global Sandbox Controls */}
                      {isSandboxActive && (
                        <div className="space-y-6 p-6 bg-muted/30 rounded-2xl border border-border animate-in slide-in-from-top-2 duration-300">
                          <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Sparkles size={14} className="text-indigo-500 dark:text-indigo-400" /> Global Sandbox Controls
                          </h4>

                          {/* Global Rate Slider */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="text-xs font-bold text-muted-foreground">
                                Global Simulated Rate
                              </label>
                              <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">${globalSimRate}/session</span>
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
                              <label className="text-xs font-bold text-muted-foreground">
                                Global Simulated Frequency
                              </label>
                              <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{globalSimFrequency} sessions/mo</span>
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
                  <Card className="border-none shadow-lg rounded-[2.5rem] bg-card overflow-hidden">
                    <CardHeader className="p-8 pb-4 border-b border-border bg-muted/30">
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Users size={20} className="text-indigo-600" /> Client Sandbox
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
                                "p-4 rounded-2xl border transition-all space-y-3",
                                isActive ? "bg-card border-border shadow-sm" : "bg-muted/20 border-border/40 opacity-50"
                              )}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Switch 
                                      checked={isActive}
                                      onCheckedChange={(checked) => handleClientOverrideChange(client.id, 'active', checked)}
                                      className="data-[state=checked]:bg-emerald-500 scale-75"
                                    />
                                    <Link 
                                      to={`/clients/${client.id}`}
                                      className="font-bold text-sm text-foreground hover:underline hover:text-indigo-600 transition-colors"
                                    >
                                      {client.name}
                                    </Link>
                                  </div>
                                  <Badge variant="outline" className="text-[8px] font-black uppercase">
                                    ${Math.round(client.currentWeeklyRev * 52).toLocaleString()}/yr
                                  </Badge>
                                </div>

                                {isActive && isSandboxActive && (
                                  <div className="space-y-3 pt-2 border-t border-border/60 animate-in fade-in duration-300">
                                    {/* Individual Rate Slider */}
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-[9px] font-bold text-muted-foreground">
                                        <span>Simulated Rate</span>
                                        <span className="text-indigo-600 dark:text-indigo-400 font-black">${rate}</span>
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
                                      <div className="flex justify-between text-[9px] font-bold text-muted-foreground">
                                        <span>Sessions/Mo</span>
                                        <span className="text-indigo-600 dark:text-indigo-400 font-black">{freq.toFixed(1)}</span>
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
                <Card className="border-none shadow-md rounded-[2rem] bg-card overflow-hidden relative group">
                  <CardContent className="p-6 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Clients</span>
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 flex items-center justify-center">
                        <Users size={16} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-3xl font-black text-foreground">{totalActiveClients}</h3>
                      <p className="text-xs text-muted-foreground font-medium">Seen in the last 90 days</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Metric 2: Average Session Rate */}
                <Card className="border-none shadow-md rounded-[2rem] bg-card overflow-hidden relative group">
                  <CardContent className="p-6 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Avg Session Rate</span>
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center">
                        <DollarSign size={16} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-3xl font-black text-foreground">${averageSessionRate.toFixed(2)}</h3>
                      <p className="text-xs text-muted-foreground font-medium">Across all clients</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Metric 3: Total Revenue */}
                <Card className="border-none shadow-md rounded-[2rem] bg-card overflow-hidden relative group">
                  <CardContent className="p-6 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Revenue</span>
                      <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 flex items-center justify-center">
                        <TrendingUp size={16} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-3xl font-black text-foreground">${totalRevenue.toLocaleString()}</h3>
                      <p className="text-xs text-muted-foreground font-medium">Sum of paid appointments</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Metric 4: Free Session Ratio */}
                <Card className="border-none shadow-md rounded-[2rem] bg-card overflow-hidden relative group">
                  <CardContent className="p-6 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Free Session Ratio</span>
                      <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                        <Percent size={16} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h3 className={cn("text-3xl font-black", freeSessionRatio > 30 ? "text-rose-600 dark:text-rose-400" : "text-foreground")}>
                        {freeSessionRatio.toFixed(1)}%
                      </h3>
                      <p className="text-xs text-muted-foreground font-medium">{freeSessions} of {totalSessions} sessions unpaid</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Metric 5: Projected Monthly Revenue */}
                <Card className="border-none shadow-sm rounded-[2.5rem] bg-indigo-600 text-white overflow-hidden relative group">
                  <CardContent className="p-6 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Projected Monthly</span>
                      <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
                        <Sparkles size={16} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-3xl font-black">${Math.round(projectedMonthlyRevenue).toLocaleString()}</h3>
                      <p className="text-xs text-indigo-200 font-medium">Based on standard rates</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Rate Distribution Chart */}
              <Card className="border-none shadow-md rounded-[2.5rem] bg-card">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-xl font-black text-foreground">Rate Distribution</CardTitle>
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
                        { label: "$100", count: rateDistribution.r100, color: "bg-blue-500" },
                        { label: "$120", count: rateDistribution.r120, color: "bg-indigo-500" },
                        { label: "$150", count: rateDistribution.r150, color: "bg-purple-500" },
                        { label: "Custom", count: rateDistribution.custom, color: "bg-pink-500" },
                      ].map((tier) => {
                        const percentage = clients.length > 0 ? (tier.count / clients.length) * 100 : 0;
                        const barHeight = (tier.count / maxDistributionCount) * 150; // max height 150px

                        return (
                          <div key={tier.label} className="flex flex-col items-center justify-end space-y-3 group">
                            {/* Bar Container */}
                            <div className="w-full bg-muted/30 rounded-2xl h-[180px] flex items-end p-2 relative overflow-hidden">
                              {/* Tooltip */}
                              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
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
                              <span className="text-xs font-black text-foreground block">{tier.label}</span>
                              <span className="text-[10px] font-bold text-muted-foreground block">
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
              <Card className="border-none shadow-xl rounded-[2.5rem] bg-slate-900 text-white overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-900/30 via-slate-950 to-indigo-900/30" />
                <CardContent className="p-8 md:p-10 relative z-10">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="space-y-3 max-w-2xl">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">Rate Increase Roadmap</p>
                      <h2 className="text-3xl font-black tracking-tight leading-tight text-white">
                        $150/session by end of 2027
                      </h2>
                      <p className="text-sm text-slate-300 font-medium leading-relaxed">
                        {aiSuggestions?.summary || "A four-phase plan to move every client to $150. Each phase targets a specific rate tier — use the Rates tab to action contact emails and confirm upgrades as you go."}
                      </p>
                      {lastAnalyzed && (
                        <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5">
                          <Clock size={12} />
                          AI analysis updated {formatDistanceToNow(new Date(lastAnalyzed), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={handleGenerateSuggestions}
                      disabled={isAnalyzing}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] uppercase tracking-widest h-10 px-6 rounded-xl shadow-lg shrink-0 self-start"
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

              {/* Transition Roadmap & Value-Add Strategies */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Transition Roadmap */}
                <Card className="border-none shadow-md rounded-[2.5rem] bg-card">
                  <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-xl font-black text-foreground flex items-center gap-2">
                      <TrendingUp className="text-indigo-600" size={22} />
                      Transition Roadmap
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground font-medium">
                      Step-by-step timeline to transition existing clients to higher rate tiers.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 pt-4 space-y-6">
                    <div className="relative border-l-2 border-indigo-100 dark:border-indigo-950/50 pl-6 ml-4 space-y-8">
                      {activeRoadmap.map((step, idx) => (
                        <div key={idx} className="relative">
                          <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white dark:border-slate-900" />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-none font-bold text-[10px] uppercase tracking-wider">
                                {step.phase}
                              </Badge>
                            </div>
                            <h4 className="font-black text-foreground text-base">{step.title}</h4>
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
                <Card className="border-none shadow-md rounded-[2.5rem] bg-card">
                  <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-xl font-black text-foreground flex items-center gap-2">
                      <Sparkles className="text-amber-500" size={22} />
                      Value-Add Strategies
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground font-medium">
                      AI-generated advice on how to justify higher rates and elevate client experience.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 pt-4 space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                      {activeStrategies.map((strategy, idx) => (
                        <div key={idx} className="p-5 rounded-2xl bg-muted/30 border border-border/40 space-y-2">
                          <h4 className="font-black text-foreground text-sm flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-600" />
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
              <Card className="border-none shadow-md rounded-[2.5rem] bg-card">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-xl font-black text-foreground flex items-center gap-2">
                    <TrendingUp className="text-emerald-600" size={22} />
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
                          <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                            Target Average Session Rate
                          </label>
                          <span className="text-sm font-black text-indigo-600">${targetRate}</span>
                        </div>
                        <Slider
                          value={[targetRate]}
                          onValueChange={(val) => setTargetRate(val[0])}
                          min={30}
                          max={150}
                          step={5}
                          className="py-4"
                        />
                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                          <span>$30</span>
                          <span>$90</span>
                          <span>$150</span>
                        </div>
                      </div>

                      {/* Slider 2: Active Client Count */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                            Active Client Count
                          </label>
                          <span className="text-sm font-black text-indigo-600">{simulatorClients} clients</span>
                        </div>
                        <Slider
                          value={[simulatorClients]}
                          onValueChange={(val) => setSimulatorClients(val[0])}
                          min={5}
                          max={100}
                          step={1}
                          className="py-4"
                        />
                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                          <span>5 clients</span>
                          <span>50 clients</span>
                          <span>100 clients</span>
                        </div>
                      </div>

                      {/* Slider 3: Average Sessions per Client per Month */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                            Avg Sessions per Client / Month
                          </label>
                          <span className="text-sm font-black text-indigo-600">{simulatorFrequency} sessions</span>
                        </div>
                        <Slider
                          value={[simulatorFrequency]}
                          onValueChange={(val) => setSimulatorFrequency(val[0])}
                          min={0.5}
                          max={4.0}
                          step={0.1}
                          className="py-4"
                        />
                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                          <span>0.5 sessions</span>
                          <span>2.0 sessions</span>
                          <span>4.0 sessions</span>
                        </div>
                      </div>
                    </div>

                    {/* Results Card */}
                    <div className="p-6 rounded-3xl bg-muted/30 border border-border/40 flex flex-col justify-between space-y-6">
                      <div className="space-y-4">
                        <h4 className="font-black text-foreground text-sm uppercase tracking-wider">
                          Projected Revenue Impact
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground block">Current Projected</span>
                            <span className="text-xl font-black text-muted-foreground">
                              ${Math.round(currentProjectedRevenue).toLocaleString()}/mo
                            </span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-indigo-600 block">Target Projected</span>
                            <span className="text-xl font-black text-indigo-600">
                              ${Math.round(targetProjectedRevenue).toLocaleString()}/mo
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Revenue Increase Callout */}
                      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                            Monthly Revenue Increase
                          </span>
                          <h3 className="text-2xl font-black text-emerald-800 dark:text-emerald-300">
                            +${Math.round(revenueIncrease).toLocaleString()}
                          </h3>
                        </div>
                        <Badge className="bg-emerald-500 text-white border-none font-black text-xs px-3 py-1 rounded-full">
                          +{percentageIncrease.toFixed(0)}%
                        </Badge>
                      </div>

                      {/* Annual Impact */}
                      <div className="text-xs text-muted-foreground font-medium text-center">
                        Annualized practice revenue increase of{" "}
                        <strong className="text-foreground font-black">
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
        )}
      </div>

      {/* Preferred Time Override Modal */}
      <Dialog open={isOverrideModalOpen} onOpenChange={setIsOverrideModalOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground">Set Preferred Time Override</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground font-medium">
              Set a manual preferred appointment time for {selectedClient?.name}. This will override the auto-analyzed time.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black tracking-wider text-muted-foreground">
                Preferred Appointment Time
              </label>
              <Input
                placeholder="e.g., Tuesdays at 10:00 AM"
                value={overrideTimeValue}
                onChange={(e) => setOverrideTimeValue(e.target.value)}
                className="rounded-xl border-border/60 focus-visible:ring-indigo-500"
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
            <Button onClick={handleSaveOverride} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white">
              Save Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Rate Modal */}
      <Dialog open={isCustomRateModalOpen} onOpenChange={setIsCustomRateModalOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground">Set Custom Standard Rate</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground font-medium">
              Enter a custom standard session rate ($) for {selectedClient?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black tracking-wider text-muted-foreground">
                Standard Rate ($)
              </label>
              <Input
                type="number"
                placeholder="e.g., 75"
                value={customRateValue}
                onChange={(e) => setCustomRateValue(e.target.value)}
                className="rounded-xl border-border/60 focus-visible:ring-indigo-500"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsCustomRateModalOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleSaveCustomRate} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white">
              Save Rate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Booking Modal */}
      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto rounded-[2rem] p-0">
          <div className="p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black">Quick Book Session</DialogTitle>
              <DialogDescription className="font-medium">Schedule a new appointment for this client.</DialogDescription>
            </DialogHeader>
            {bookingClientId && (
              <AppointmentForm 
                initialClientId={bookingClientId} 
                onSuccess={() => {
                  setIsBookingModalOpen(false);
                  fetchData();
                }} 
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* STICKY BULK ACTIONS BAR */}
      {selectedWeeklyClients.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-4 animate-in slide-in-from-bottom-10 duration-500">
          <div className="bg-slate-950/95 text-white rounded-[2rem] p-4 shadow-2xl border border-slate-800/80 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
                {selectedWeeklyClients.length}
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Bulk Actions</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Apply changes to selected clients</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              {/* Bulk Target Rate */}
              <Select onValueChange={(val) => handleBulkSetTargetRate(parseInt(val))} disabled={bulkActionLoading}>
                <SelectTrigger className="w-[120px] h-9 rounded-xl bg-slate-900 border-slate-800 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                  <SelectValue placeholder="Set Target" />
                </SelectTrigger>
                <SelectContent className="rounded-xl bg-slate-900 text-white border-slate-800">
                  {RATE_OPTIONS.filter(opt => opt.value !== -1).map(opt => (
                    <SelectItem key={opt.value} value={opt.value.toString()} className="text-xs font-bold">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Bulk Re-engagement Tag */}
              <Select onValueChange={(val: any) => handleBulkSetReengagementTag(val === "neutral" ? null : val)} disabled={bulkActionLoading}>
                <SelectTrigger className="w-[120px] h-9 rounded-xl bg-slate-900 border-slate-800 text-[10px] font-black uppercase tracking-widest text-rose-400">
                  <SelectValue placeholder="Set Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl bg-slate-900 text-white border-slate-800">
                  <SelectItem value="neutral" className="text-xs font-bold">Neutral</SelectItem>
                  <SelectItem value="warm" className="text-xs font-bold text-emerald-400">Warm</SelectItem>
                  <SelectItem value="cold" className="text-xs font-bold text-blue-400">Cold</SelectItem>
                  <SelectItem value="lost" className="text-xs font-bold text-slate-500">Lost</SelectItem>
                </SelectContent>
              </Select>

              {/* Bulk Onboarding */}
              <Button
                size="sm"
                onClick={handleBulkSendOnboarding}
                disabled={bulkActionLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-9 px-4 font-black text-[10px] uppercase tracking-widest"
              >
                {bulkActionLoading ? <Loader2 className="animate-spin" size={12} /> : <Send size={12} className="mr-1.5" />}
                Onboard
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearWeeklyClients}
                className="text-slate-400 hover:text-white rounded-xl h-9 px-3 font-black text-[10px] uppercase tracking-widest"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}