"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Search,
  Filter,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Edit2,
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
  HelpCircle
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Client, Appointment } from "@/types/crm";

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
  { label: "$80", value: 80 },
  { label: "$100", value: 100 },
  { label: "$120", value: 120 },
  { label: "$150", value: 150 },
  { label: "Custom", value: -1 }
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

  // Simulator State
  const [targetRate, setTargetRate] = useState(100);
  const [simulatorClients, setSimulatorClients] = useState(25);
  const [simulatorFrequency, setSimulatorFrequency] = useState(1.5);

  useEffect(() => {
    fetchData();
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

      const processedClients: ClientWithAppointments[] = (clientsData || []).map((client) => {
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

    // Optimistic UI update
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, standard_rate: rateValue } : c));

    try {
      const { error } = await supabase
        .from("clients")
        .update({ standard_rate: rateValue })
        .eq("id", clientId);

      if (error) throw error;
      showSuccess("Standard rate updated successfully.");
    } catch (error: any) {
      console.error("Error updating rate:", error);
      showError("Failed to update standard rate.");
      // Revert on error
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

    // Optimistic UI update
    setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, standard_rate: rateNum } : c));
    setIsCustomRateModalOpen(false);

    try {
      const { error } = await supabase
        .from("clients")
        .update({ standard_rate: rateNum })
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

  // Filter and Sort Clients
  const filteredClients = clients.filter((client) => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesRate = true;
    if (filterRate !== "all") {
      if (filterRate === "free") {
        matchesRate = client.standard_rate === 0;
      } else if (filterRate === "custom") {
        const standardValues = [0, 30, 50, 80, 100, 120, 150];
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
      (c) => c.lastSeenDate && c.lastSeenDate >= oneMonthAgo
    ),
    oneToThreeMonths: sortedClients.filter(
      (c) =>
        c.lastSeenDate &&
        c.lastSeenDate < oneMonthAgo &&
        c.lastSeenDate >= threeMonthsAgo
    ),
    threePlusMonths: sortedClients.filter(
      (c) => !c.lastSeenDate || c.lastSeenDate < threeMonthsAgo
    ),
  };

  // Financial Calculations
  const activeClients = clients.filter((c) => {
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
  // Calculate dynamic frequency: total sessions in last 90 days / 3
  const totalSessionsLast90Days = clients.reduce((acc, c) => {
    const recentApps = c.appointments.filter(app => {
      const appDate = new Date(app.date);
      const diffDays = (now.getTime() - appDate.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 90;
    });
    return acc + recentApps.length;
  }, 0);

  const dynamicMonthlyFrequency = totalSessionsLast90Days / 3;
  
  // Projected Monthly Revenue = Sum of (client.standard_rate * client's monthly session frequency)
  // If a client has no sessions in the last 90 days but is active (seen in last 30 days), assume 1 session/month.
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
    r80: clients.filter(c => (c.standard_rate ?? 50) === 80).length,
    r100: clients.filter(c => (c.standard_rate ?? 50) === 100).length,
    r120: clients.filter(c => (c.standard_rate ?? 50) === 120).length,
    r150: clients.filter(c => (c.standard_rate ?? 50) === 150).length,
    custom: clients.filter(c => {
      const rate = c.standard_rate ?? 50;
      return ![0, 30, 50, 80, 100, 120, 150].includes(rate);
    }).length,
  };

  const maxDistributionCount = Math.max(...Object.values(rateDistribution), 1);

  // Simulator Calculations
  const currentProjectedRevenue = totalActiveClients * averageSessionRate * simulatorFrequency;
  const targetProjectedRevenue = simulatorClients * targetRate * simulatorFrequency;
  const revenueIncrease = targetProjectedRevenue - currentProjectedRevenue;
  const percentageIncrease = currentProjectedRevenue > 0 ? (revenueIncrease / currentProjectedRevenue) * 100 : 0;

  return (
    <AppLayout>
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
            <TabsList className="bg-muted/50 p-1 rounded-2xl border border-border/50 w-full max-w-md grid grid-cols-3">
              <TabsTrigger value="rates" className="rounded-xl font-bold text-xs py-2.5">
                Rates & Recency
              </TabsTrigger>
              <TabsTrigger value="audit" className="rounded-xl font-bold text-xs py-2.5">
                Full Audit
              </TabsTrigger>
              <TabsTrigger value="suggestions" className="rounded-xl font-bold text-xs py-2.5">
                AI Suggestions
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: RATES & RECENCY */}
            <TabsContent value="rates" className="space-y-6">
              {/* Controls Card */}
              <Card className="border-none shadow-md rounded-[2rem] bg-card">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    {/* Search */}
                    <div className="relative w-full md:max-w-xs">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                      <Input
                        placeholder="Search clients..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 rounded-xl border-border/60 bg-muted/30 focus-visible:ring-indigo-500"
                      />
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
                          <SelectContent className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
                            <SelectItem value="all">All Rates</SelectItem>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="30">$30</SelectItem>
                            <SelectItem value="50">$50</SelectItem>
                            <SelectItem value="80">$80</SelectItem>
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
                        <SelectContent className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
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
                        <SelectContent className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
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
                  <button
                    onClick={() => toggleSection("lastMonth")}
                    className="w-full p-6 flex items-center justify-between bg-muted/20 hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 size={18} />
                      </div>
                      <div>
                        <h3 className="font-black text-foreground text-base">Last Month</h3>
                        <p className="text-xs text-muted-foreground font-medium">Seen in the last 30 days</p>
                      </div>
                      <Badge variant="secondary" className="ml-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-none font-bold">
                        {groups.lastMonth.length} {groups.lastMonth.length === 1 ? "client" : "clients"}
                      </Badge>
                    </div>
                    {collapsedSections.lastMonth ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                  </button>

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
                                <th className="p-4 pl-6">Client</th>
                                <th className="p-4">Last Seen</th>
                                <th className="p-4">Standard Rate ($)</th>
                                <th className="p-4">Preferred Time</th>
                                <th className="p-4 pr-6">Follow-up Status</th>
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
                  <button
                    onClick={() => toggleSection("oneToThreeMonths")}
                    className="w-full p-6 flex items-center justify-between bg-muted/20 hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
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
                    </div>
                    {collapsedSections.oneToThreeMonths ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                  </button>

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
                                <th className="p-4 pl-6">Client</th>
                                <th className="p-4">Last Seen</th>
                                <th className="p-4">Standard Rate ($)</th>
                                <th className="p-4">Preferred Time</th>
                                <th className="p-4 pr-6">Follow-up Status</th>
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
                                />
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>

                {/* Section 3: 3+ Months */}
                <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-card">
                  <button
                    onClick={() => toggleSection("threePlusMonths")}
                    className="w-full p-6 flex items-center justify-between bg-muted/20 hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 flex items-center justify-center">
                        <AlertCircle size={18} />
                      </div>
                      <div>
                        <h3 className="font-black text-foreground text-base">3+ Months</h3>
                        <p className="text-xs text-muted-foreground font-medium">Seen more than 90 days ago, or never seen</p>
                      </div>
                      <Badge variant="secondary" className="ml-2 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-none font-bold">
                        {groups.threePlusMonths.length} {groups.threePlusMonths.length === 1 ? "client" : "clients"}
                      </Badge>
                    </div>
                    {collapsedSections.threePlusMonths ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                  </button>

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
                                <th className="p-4 pl-6">Client</th>
                                <th className="p-4">Last Seen</th>
                                <th className="p-4">Standard Rate ($)</th>
                                <th className="p-4">Preferred Time</th>
                                <th className="p-4 pr-6">Follow-up Status</th>
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

            {/* TAB 2: FULL AUDIT & FINANCIALS */}
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
                      <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 flex items-center justify-center">
                        <Percent size={16} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-3xl font-black text-foreground">{freeSessionRatio.toFixed(1)}%</h3>
                      <p className="text-xs text-muted-foreground font-medium">Of total sessions logged</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Metric 5: Projected Monthly Revenue */}
                <Card className="border-none shadow-md rounded-[2rem] bg-indigo-600 text-white overflow-hidden relative group">
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
                        { label: "$80", count: rateDistribution.r80, color: "bg-emerald-500" },
                        { label: "$100", count: rateDistribution.r100, color: "bg-teal-500" },
                        { label: "$120", count: rateDistribution.r120, color: "bg-blue-500" },
                        { label: "$150", count: rateDistribution.r150, color: "bg-indigo-500" },
                        { label: "Custom", count: rateDistribution.custom, color: "bg-purple-500" },
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

            {/* TAB 3: AI SUGGESTIONS */}
            <TabsContent value="suggestions" className="space-y-8">
              {/* Goal Banner */}
              <Card className="border-none shadow-2xl rounded-[3rem] bg-slate-900 text-white overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-900/40 via-slate-950 to-indigo-900/40" />
                <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
                  <Sparkles size={200} />
                </div>
                <CardContent className="p-10 md:p-14 relative z-10">
                  <div className="max-w-3xl space-y-6">
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 font-black text-[10px] uppercase tracking-[0.3em] px-4 py-1">
                      Strategic AI Roadmap
                    </Badge>
                    <h2 className="text-4xl md:text-5xl font-serif font-bold tracking-tighter leading-tight">
                      The Path to $150/Session <br/>by the End of 2027.
                    </h2>
                    <p className="text-lg text-slate-300 font-medium leading-relaxed">
                      Reaching a $150 average session rate requires a gradual, value-driven transition plan. By elevating your clinical offerings, packaging sessions, and implementing structured rate increases, you can double your practice revenue while delivering exceptional client outcomes.
                    </p>
                    <div className="flex flex-wrap gap-4 pt-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-amber-400" />
                        <span className="text-sm font-bold text-slate-200">Gradual Rate Escalation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-amber-400" />
                        <span className="text-sm font-bold text-slate-200">Value-Add Client Support</span>
                      </div>
                    </div>
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
                      {/* Step 1 */}
                      <div className="relative">
                        <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white dark:border-slate-900" />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-none font-bold text-[10px] uppercase tracking-wider">
                              Phase 1: Q3 2026
                            </Badge>
                          </div>
                          <h4 className="font-black text-foreground text-base">Elevate Low-Tier Clients</h4>
                          <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                            Transition clients currently paying <strong className="text-foreground">$30</strong> to <strong className="text-foreground">$50</strong>. Introduce basic homework tools and email support to justify the adjustment.
                          </p>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="relative">
                        <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white dark:border-slate-900" />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-none font-bold text-[10px] uppercase tracking-wider">
                              Phase 2: Q1 2027
                            </Badge>
                          </div>
                          <h4 className="font-black text-foreground text-base">Standardize Mid-Tier Clients</h4>
                          <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                            Transition <strong className="text-foreground">$50</strong> clients to <strong className="text-foreground">$80</strong>, and <strong className="text-foreground">$80</strong> clients to <strong className="text-foreground">$100</strong>. Offer custom integration worksheets and specialized neurological protocols.
                          </p>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="relative">
                        <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white dark:border-slate-900" />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-none font-bold text-[10px] uppercase tracking-wider">
                              Phase 3: Q3 2027
                            </Badge>
                          </div>
                          <h4 className="font-black text-foreground text-base">The Premium Shift</h4>
                          <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                            Transition <strong className="text-foreground">$100</strong> clients to <strong className="text-foreground">$120</strong>. Introduce premium session packages (e.g., 5 sessions for $550) to lock in commitment and ease the transition.
                          </p>
                        </div>
                      </div>

                      {/* Step 4 */}
                      <div className="relative">
                        <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white dark:border-slate-900" />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-none font-bold text-[10px] uppercase tracking-wider">
                              Phase 4: Q4 2027
                            </Badge>
                          </div>
                          <h4 className="font-black text-foreground text-base">Target Goal Achieved</h4>
                          <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                            Transition all active clients to the standard rate of <strong className="text-foreground">$150/session</strong>. All new clients onboarded from this point forward start at the $150 rate.
                          </p>
                        </div>
                      </div>
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
                      {/* Strategy 1 */}
                      <div className="p-5 rounded-2xl bg-muted/30 border border-border/40 space-y-2">
                        <h4 className="font-black text-foreground text-sm flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-600" />
                          Package Sessions
                        </h4>
                        <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                          Offer packages of 5 or 10 sessions at a slight discount (e.g., 5 sessions for $650 instead of $750) to secure upfront commitment, increase lifetime value, and ease the transition to higher rates.
                        </p>
                      </div>

                      {/* Strategy 2 */}
                      <div className="p-5 rounded-2xl bg-muted/30 border border-border/40 space-y-2">
                        <h4 className="font-black text-foreground text-sm flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-600" />
                          Premium Support
                        </h4>
                        <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                          Provide email/chat support between sessions, custom homework tools, and personalized integration worksheets. This positions you as a dedicated partner in their healing journey.
                        </p>
                      </div>

                      {/* Strategy 3 */}
                      <div className="p-5 rounded-2xl bg-muted/30 border border-border/40 space-y-2">
                        <h4 className="font-black text-foreground text-sm flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-600" />
                          Highlight Clinical Wins
                        </h4>
                        <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                          Use the Marketing Engine and Wins Vault to document and share client breakthroughs. Demonstrating high-value outcomes and clinical success builds trust and justifies premium pricing.
                        </p>
                      </div>

                      {/* Strategy 4 */}
                      <div className="p-5 rounded-2xl bg-muted/30 border border-border/40 space-y-2">
                        <h4 className="font-black text-foreground text-sm flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-600" />
                          Specialized Protocols
                        </h4>
                        <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                          Introduce advanced neurological and somatic protocols (e.g., Cranial Nerve, Primitive Reflex, Heart Wall) to justify specialist rates. Clients are willing to pay more for highly specialized expertise.
                        </p>
                      </div>
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
    </AppLayout>
  );
}

interface ClientRowProps {
  client: ClientWithAppointments;
  calculateAge: (born: string | Date | null) => string | number;
  handleRateChange: (clientId: string, rateValue: number) => void;
  handleOpenOverrideModal: (client: ClientWithAppointments) => void;
}

function ClientRow({
  client,
  calculateAge,
  handleRateChange,
  handleOpenOverrideModal,
}: ClientRowProps) {
  const lastSeenText = client.lastSeenDate ? format(client.lastSeenDate, "MMM d, yyyy") : "Never";
  const relativeTime = client.lastSeenDate ? formatDistanceToNow(client.lastSeenDate, { addSuffix: true }) : "";

  const isCustomRate = client.standard_rate !== null && client.standard_rate !== undefined && ![0, 30, 50, 80, 100, 120, 150].includes(client.standard_rate);
  const currentRateValue = isCustomRate ? -1 : (client.standard_rate ?? 50);

  return (
    <tr className="hover:bg-muted/10 transition-colors">
      {/* Client */}
      <td className="p-4 pl-6">
        <div className="space-y-1">
          <h4 className="font-black text-foreground text-sm">{client.name}</h4>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            {client.pronouns && <span>{client.pronouns}</span>}
            {client.pronouns && <span>•</span>}
            <span>Age: {calculateAge(client.born)}</span>
          </div>
        </div>
      </td>

      {/* Last Seen */}
      <td className="p-4">
        <div className="space-y-1">
          <span className="text-sm font-bold text-foreground">{lastSeenText}</span>
          {relativeTime && (
            <span className="text-xs text-muted-foreground font-medium block">
              {relativeTime}
            </span>
          )}
        </div>
      </td>

      {/* Standard Rate */}
      <td className="p-4">
        <div className="flex items-center gap-2">
          <Select
            value={currentRateValue.toString()}
            onValueChange={(val) => handleRateChange(client.id, parseInt(val))}
          >
            <SelectTrigger className="w-[120px] rounded-xl border-border/60 bg-muted/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
              {RATE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value.toString()}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isCustomRate && (
            <Badge variant="outline" className="rounded-lg border-indigo-200 dark:border-indigo-900/50 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-bold text-[10px]">
              ${client.standard_rate}
            </Badge>
          )}
        </div>
      </td>

      {/* Preferred Time */}
      <td className="p-4">
        <div className="flex items-center gap-2 group">
          <div className="space-y-0.5">
            {client.preferred_time ? (
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-foreground">{client.preferred_time}</span>
                <Badge className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-none font-bold text-[8px] uppercase tracking-wider px-1.5 py-0">
                  Manual
                </Badge>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-foreground">
                  {client.preferredTimeAnalyzed.text}
                </span>
                {client.preferredTimeAnalyzed.isLowData && !client.preferred_time && (
                  <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-none font-bold text-[8px] uppercase tracking-wider px-1.5 py-0">
                    Low Data
                  </Badge>
                )}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenOverrideModal(client)}
            className="w-7 h-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
          >
            <Edit2 size={12} className="text-muted-foreground" />
          </Button>
        </div>
      </td>

      {/* Follow-up Status */}
      <td className="p-4 pr-6">
        {client.followUpStatus === "Booked" ? (
          <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-none font-bold text-xs px-2.5 py-0.5 rounded-full">
            Booked
          </Badge>
        ) : client.followUpStatus === "Needs Follow-up" ? (
          <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-none font-bold text-xs px-2.5 py-0.5 rounded-full">
            Needs Follow-up
          </Badge>
        ) : (
          <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-none font-bold text-xs px-2.5 py-0.5 rounded-full">
            No Future Bookings
          </Badge>
        )}
      </td>
    </tr>
  );
}