"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Settings,
  User,
  LogOut,
  Mail,
  Loader2,
  RefreshCw,
  Zap,
  Info,
  Calendar,
  Copy,
  Check,
  ShieldCheck,
  Link as LinkIcon,
  Sparkles,
  Globe,
  CreditCard,
  DollarSign,
  Users,
  FileText,
  ArrowRight,
  LayoutGrid,
  Layers,
  Merge,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { useNavigate, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface DuplicateGroup {
  name: string;
  primary: any;
  duplicates: any[];
  matchReason?: string;
}

const SettingsPage = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState<string | null>(null);
  const [initializingStripe, setInitializingStripe] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingNotionAll, setSyncingNotionAll] = useState(false);
  const [syncingAppointmentsAll, setSyncingAppointmentsAll] = useState(false);
  const [configuringNotion, setConfiguringNotion] = useState(false);
  
  // Merge Clients State
  const [clients, setClients] = useState<any[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [sourceClientId, setSourceClientId] = useState<string>("");
  const [targetClientId, setTargetClientId] = useState<string>("");
  const [merging, setMerging] = useState(false);
  
  // Automated Duplicates State
  const [detectedDuplicates, setDetectedDuplicates] = useState<DuplicateGroup[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);

  // Active Merge Session for Side-by-Side Conflict Resolution
  const [activeMerge, setActiveMerge] = useState<{
    primary: any;
    duplicate: any;
    fields: Record<string, any>;
  } | null>(null);

  const projectRef = "xebtjnvfkroiplyzftas";
  const webhookUrl = `https://${projectRef}.supabase.co/functions/v1/calcom-webhook`;

  const fetchClients = async () => {
    setLoadingClients(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          id, name, email, phone, pronouns, born, suburbs, occupation,
          marital_status, children, chatgpt_url, journal, is_practitioner,
          emergency_contact_name, emergency_contact_phone, medications_supplements,
          current_stress_level, sleep_quality, digestive_health, medical_history,
          referral_source, stripe_customer_id, notion_page_id, notion_link, created_at
        `)
        .or('is_practitioner.eq.false,is_practitioner.is.null')
        .order('name');
      
      if (error) throw error;
      setClients(data || []);
      detectDuplicates(data || []);
    } catch (err) {
      console.error("Failed to fetch clients:", err);
    } finally {
      setLoadingClients(false);
    }
  };

  const detectDuplicates = (clientsList: any[]) => {
    setIsDetecting(true);
    
    const visited = new Set<string>();
    const duplicatesFound: DuplicateGroup[] = [];

    const normalizeName = (name: string) => (name || '').toLowerCase().trim().replace(/\s+/g, ' ');
    const normalizeEmail = (email: string) => (email || '').toLowerCase().trim();
    const normalizePhone = (phone: string) => {
      if (!phone) return "";
      const digits = phone.replace(/\D/g, "");
      return digits.length >= 9 ? digits.slice(-9) : digits;
    };

    // Helper to check if names are fuzzy matches
    const isFuzzyNameMatch = (name1: string, name2: string) => {
      const n1 = normalizeName(name1);
      const n2 = normalizeName(name2);
      if (!n1 || !n2) return false;
      if (n1 === n2) return true;
      if (n1.includes(n2) || n2.includes(n1)) {
        const shorter = n1.length < n2.length ? n1 : n2;
        if (shorter.length >= 3) return true;
      }
      // Check word overlap
      const words1 = n1.split(' ');
      const words2 = n2.split(' ');
      const commonWords = words1.filter(w => words2.includes(w) && w.length > 2);
      if (commonWords.length >= 2) return true;

      return false;
    };

    for (let i = 0; i < clientsList.length; i++) {
      const clientA = clientsList[i];
      if (visited.has(clientA.id)) continue;

      const duplicates: any[] = [];
      const matchReasons: string[] = [];

      const emailA = normalizeEmail(clientA.email);
      const phoneA = normalizePhone(clientA.phone);
      const nameA = normalizeName(clientA.name);
      const bornA = clientA.born;

      for (let j = i + 1; j < clientsList.length; j++) {
        const clientB = clientsList[j];
        if (visited.has(clientB.id)) continue;

        const emailB = normalizeEmail(clientB.email);
        const phoneB = normalizePhone(clientB.phone);
        const nameB = normalizeName(clientB.name);
        const bornB = clientB.born;

        let isMatch = false;
        let reason = "";

        if (emailA && emailB && emailA === emailB) {
          isMatch = true;
          reason = "Same Email";
        } else if (phoneA && phoneB && phoneA === phoneB) {
          isMatch = true;
          reason = "Same Phone Number";
        } else if (nameA && nameB && nameA === nameB) {
          isMatch = true;
          reason = "Same Name";
        } else if (bornA && bornB && bornA === bornB && isFuzzyNameMatch(clientA.name, clientB.name)) {
          isMatch = true;
          reason = "Fuzzy Name & Same DOB";
        }

        if (isMatch) {
          duplicates.push(clientB);
          if (!matchReasons.includes(reason)) {
            matchReasons.push(reason);
          }
        }
      }

      if (duplicates.length > 0) {
        visited.add(clientA.id);
        duplicates.forEach(d => visited.add(d.id));

        const allInGroup = [clientA, ...duplicates];
        
        // Sort to find the best "Primary" client
        // Heuristic:
        // 1. Has Stripe ID
        // 2. Has Notion ID
        // 3. Has more fields populated
        // 4. Oldest created_at
        const getPopulatedFieldCount = (c: any) => {
          return Object.entries(c).filter(([key, val]) => {
            if (key === 'id' || key === 'created_at' || key === 'user_id') return false;
            return val !== null && val !== undefined && val !== "" && (Array.isArray(val) ? val.length > 0 : true);
          }).length;
        };

        const sorted = [...allInGroup].sort((a, b) => {
          if (a.stripe_customer_id && !b.stripe_customer_id) return -1;
          if (!a.stripe_customer_id && b.stripe_customer_id) return 1;
          if (a.notion_page_id && !b.notion_page_id) return -1;
          if (!a.notion_page_id && b.notion_page_id) return 1;
          
          const fieldsA = getPopulatedFieldCount(a);
          const fieldsB = getPopulatedFieldCount(b);
          if (fieldsA !== fieldsB) return fieldsB - fieldsA; // More fields first

          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });

        duplicatesFound.push({
          name: sorted[0].name,
          primary: sorted[0],
          duplicates: sorted.slice(1),
          matchReason: matchReasons.join(", ")
        });
      }
    }

    setDetectedDuplicates(duplicatesFound);
    setIsDetecting(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);
  
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    showSuccess("Copied to clipboard!");
    setTimeout(() => setCopied(null), 2000);
  };

  const handleInitializeStripe = async () => {
    setInitializingStripe(true);
    try {
      const { error } = await supabase.functions.invoke('stripe-manager', {
        body: { action: 'setup-product' }
      });
      if (error) throw error;
      showSuccess("Stripe Product initialized!");
    } catch (err: any) {
      showError(err.message);
    } finally {
      setInitializingStripe(false);
    }
  };

  const handleSyncAllToStripe = async () => {
    setSyncingAll(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-manager', {
        body: { action: 'sync-all' }
      });
      if (error) throw error;
      showSuccess(`Successfully synced ${data.syncedCount} clients to Stripe!`);
    } catch (err: any) {
      showError(err.message);
    } finally {
      setSyncingAll(false);
    }
  };

  const handleConfigureNotionSchema = async () => {
    setConfiguringNotion(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-to-notion', {
        body: { 
          action: 'configure-schema',
          origin: window.location.origin
        }
      });
      if (error) throw error;
      showSuccess(data.message || "Notion databases successfully configured!");
    } catch (err: any) {
      showError(err.message || "Failed to configure Notion databases. Ensure your Notion integration has edit access.");
    } finally {
      setConfiguringNotion(false);
    }
  };

  const handleSyncAllToNotion = async () => {
    setSyncingNotionAll(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-to-notion', {
        body: { 
          action: 'sync-all-clients',
          origin: window.location.origin
        }
      });
      if (error) throw error;
      showSuccess(`Successfully synced ${data.syncedCount} clients to Notion!`);
    } catch (err: any) {
      showError(err.message);
    } finally {
      setSyncingNotionAll(false);
    }
  };

  const handleSyncAllAppointmentsToNotion = async () => {
    setSyncingAppointmentsAll(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-to-notion', {
        body: { 
          action: 'sync-all-appointments',
          origin: window.location.origin
        }
      });
      if (error) throw error;
      showSuccess(`Successfully synced ${data.syncedCount} appointments to Notion!`);
    } catch (err: any) {
      showError(err.message);
    } finally {
      setSyncingAppointmentsAll(false);
    }
  };

  const executeMerge = async (sourceId: string, targetId: string, mergedFields?: Record<string, any>) => {
    const { error } = await supabase.functions.invoke('sync-to-notion', {
      body: {
        action: 'merge-clients',
        sourceClientId: sourceId,
        targetClientId: targetId,
        mergedFields,
        origin: window.location.origin
      }
    });
    if (error) throw error;
  };

  const startMergeSession = (primary: any, duplicate: any) => {
    const initialFields: Record<string, any> = {};
    const fieldsToMerge = [
      'name', 'email', 'phone', 'born', 'suburbs', 'pronouns', 'occupation',
      'marital_status', 'children', 'medical_history', 'medications_supplements',
      'emergency_contact_name', 'emergency_contact_phone', 'referral_source',
      'current_stress_level', 'sleep_quality', 'digestive_health', 'chatgpt_url',
      'journal', 'stripe_customer_id', 'notion_page_id', 'notion_link'
    ];

    fieldsToMerge.forEach(field => {
      const valPrimary = primary[field];
      const valDuplicate = duplicate[field];

      if (field === 'suburbs') {
        const combined = [...(valPrimary || []), ...(valDuplicate || [])];
        initialFields[field] = Array.from(new Set(combined.map(s => s.trim()).filter(Boolean)));
      } else if (valPrimary !== null && valPrimary !== undefined && valPrimary !== "" && (Array.isArray(valPrimary) ? valPrimary.length > 0 : true)) {
        initialFields[field] = valPrimary;
      } else if (valDuplicate !== null && valDuplicate !== undefined && valDuplicate !== "" && (Array.isArray(valDuplicate) ? valDuplicate.length > 0 : true)) {
        initialFields[field] = valDuplicate;
      } else {
        initialFields[field] = "";
      }
    });

    setActiveMerge({
      primary,
      duplicate,
      fields: initialFields
    });
  };

  const getAutoMergedFields = (primary: any, duplicate: any) => {
    const merged: Record<string, any> = {};
    const fieldsToMerge = [
      'name', 'email', 'phone', 'born', 'suburbs', 'pronouns', 'occupation',
      'marital_status', 'children', 'medical_history', 'medications_supplements',
      'emergency_contact_name', 'emergency_contact_phone', 'referral_source',
      'current_stress_level', 'sleep_quality', 'digestive_health', 'chatgpt_url',
      'journal', 'stripe_customer_id', 'notion_page_id', 'notion_link'
    ];

    fieldsToMerge.forEach(field => {
      const valPrimary = primary[field];
      const valDuplicate = duplicate[field];

      if (field === 'suburbs') {
        const combined = [...(valPrimary || []), ...(valDuplicate || [])];
        merged[field] = Array.from(new Set(combined.map(s => s.trim()).filter(Boolean)));
      } else if (valPrimary !== null && valPrimary !== undefined && valPrimary !== "" && (Array.isArray(valPrimary) ? valPrimary.length > 0 : true)) {
        merged[field] = valPrimary;
      } else if (valDuplicate !== null && valDuplicate !== undefined && valDuplicate !== "" && (Array.isArray(valDuplicate) ? valDuplicate.length > 0 : true)) {
        merged[field] = valDuplicate;
      }
    });

    return merged;
  };

  const handleMergeClients = async () => {
    if (!sourceClientId || !targetClientId) {
      showError("Please select both a source and target client.");
      return;
    }

    if (sourceClientId === targetClientId) {
      showError("Source and target clients cannot be the same.");
      return;
    }

    const sourceClient = clients.find(c => c.id === sourceClientId);
    const targetClient = clients.find(c => c.id === targetClientId);

    if (!sourceClient || !targetClient) {
      showError("Could not find selected clients.");
      return;
    }

    startMergeSession(targetClient, sourceClient);
  };

  const handleAutoMergeGroup = async (group: DuplicateGroup) => {
    if (!confirm(`Are you sure you want to auto-merge all duplicates for "${group.name}" into the primary profile? This will automatically combine non-empty fields.`)) {
      return;
    }

    setMerging(true);
    try {
      let currentPrimary = { ...group.primary };
      for (const duplicate of group.duplicates) {
        const mergedFields = getAutoMergedFields(currentPrimary, duplicate);
        await executeMerge(duplicate.id, currentPrimary.id, mergedFields);
        currentPrimary = { ...currentPrimary, ...mergedFields };
      }
      showSuccess(`Successfully merged duplicates for "${group.name}"!`);
      fetchClients();
    } catch (err: any) {
      showError(err.message || "Failed to auto-merge group.");
    } finally {
      setMerging(false);
    }
  };

  const handleAutoMergeAll = async () => {
    if (detectedDuplicates.length === 0) return;
    
    if (!confirm(`WARNING: This will automatically merge ALL ${detectedDuplicates.length} duplicate groups into their primary profiles.\n\nThis is a bulk operation. Are you sure you want to proceed?`)) {
      return;
    }

    setMerging(true);
    let successCount = 0;
    try {
      for (const group of detectedDuplicates) {
        let currentPrimary = { ...group.primary };
        for (const duplicate of group.duplicates) {
          const mergedFields = getAutoMergedFields(currentPrimary, duplicate);
          await executeMerge(duplicate.id, currentPrimary.id, mergedFields);
          currentPrimary = { ...currentPrimary, ...mergedFields };
        }
        successCount++;
      }
      showSuccess(`Successfully merged ${successCount} duplicate groups!`);
      fetchClients();
    } catch (err: any) {
      showError(err.message || "Failed during bulk merge operation.");
    } finally {
      setMerging(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      showSuccess("Signed out successfully");
      navigate('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const IntegrationStatus = ({ name, icon: Icon, description, status = "Connected" }: any) => (
    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-indigo-600">
          <Icon size={20} />
        </div>
        <div>
          <p className="text-sm font-black text-slate-900 dark:text-white">{name}</p>
          <p className="text-[10px] text-slate-500 font-medium">{description}</p>
        </div>
      </div>
      <Badge className={cn(
        "border-none font-black text-[8px] uppercase tracking-widest",
        status === "Connected" ? "bg-emerald-50 text-white" : "bg-amber-500 text-white"
      )}>
        {status}
      </Badge>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-full mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Settings size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">System Settings</h1>
            <p className="text-slate-500 font-medium">Manage your clinical infrastructure and automations.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white dark:bg-slate-950 overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-black flex items-center gap-3">
                <Globe size={24} className="text-indigo-500" /> Integration Ecosystem
              </CardTitle>
              <CardDescription className="font-medium">Status of your linked clinical and marketing tools.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <IntegrationStatus name="Kit (ConvertKit)" icon={Mail} description="Marketing & Newsletter Sync" />
                <IntegrationStatus name="Notion" icon={LinkIcon} description="Clinical Database & Planner" />
                <IntegrationStatus name="Gmail API" icon={Sparkles} description="Automated Onboarding Emails" />
                <IntegrationStatus name="Cal.com" icon={Calendar} description="Booking & Scheduling" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white dark:bg-slate-950 overflow-hidden border-2 border-purple-100">
            <CardHeader className="p-8 pb-4 bg-purple-50/50">
              <CardTitle className="text-xl font-black flex items-center gap-3 text-purple-900">
                <Layers size={24} /> Notion Database Sync
              </CardTitle>
              <CardDescription className="text-purple-700 font-medium">Bulk sync your clients and appointments to Notion.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-purple-100 dark:border-purple-900/30 space-y-4">
                <div className="space-y-1">
                  <h4 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">Notion Schema Auto-Configurator</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">Automatically create all required properties and establish two-way relations in your Notion databases.</p>
                </div>
                <Button 
                  onClick={handleConfigureNotionSchema} 
                  disabled={configuringNotion}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-12 font-black text-[10px] uppercase tracking-widest shadow-lg"
                >
                  {configuringNotion ? <Loader2 className="mr-2 animate-spin" /> : <Sparkles size={16} className="mr-2" />}
                  Configure Notion Schema
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-purple-100 dark:border-purple-900/30 space-y-4">
                  <div className="space-y-1">
                    <h4 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">Bulk Sync Clients</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">Push all existing CRM clients into your Notion Client Database.</p>
                  </div>
                  <Button 
                    onClick={handleSyncAllToNotion} 
                    disabled={syncingNotionAll}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 font-black text-[10px] uppercase tracking-widest shadow-lg"
                  >
                    {syncingNotionAll ? <Loader2 className="mr-2 animate-spin" /> : <Users size={16} className="mr-2" />}
                    Sync All to Notion
                  </Button>
                </div>

                <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-purple-100 dark:border-purple-900/30 space-y-4">
                  <div className="space-y-1">
                    <h4 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">Bulk Sync Appointments</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">Push all existing appointments to Notion and link them to clients.</p>
                  </div>
                  <Button 
                    onClick={handleSyncAllAppointmentsToNotion} 
                    disabled={syncingAppointmentsAll}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 font-black text-[10px] uppercase tracking-widest shadow-lg"
                  >
                    {syncingAppointmentsAll ? <Loader2 className="mr-2 animate-spin" /> : <Calendar size={16} className="mr-2" />}
                    Sync All Appointments
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Merge Clients Card */}
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white dark:bg-slate-950 overflow-hidden border-2 border-amber-100">
            <CardHeader className="p-8 pb-4 bg-amber-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-black flex items-center gap-3 text-amber-900">
                    <Merge size={24} /> Merge Duplicate Clients
                  </CardTitle>
                  <CardDescription className="text-amber-700 font-medium">Consolidate duplicate client profiles in both the CRM and Notion.</CardDescription>
                </div>
                {detectedDuplicates.length > 0 && (
                  <Button 
                    onClick={handleAutoMergeAll}
                    disabled={merging}
                    className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl h-10 px-4 font-black text-[10px] uppercase tracking-widest shadow-lg"
                  >
                    {merging ? <Loader2 className="mr-2 animate-spin" /> : <CheckCircle2 size={14} className="mr-1.5" />}
                    Auto-Merge All ({detectedDuplicates.length})
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-8">
              {/* Smart Duplicate Detector Section */}
              {detectedDuplicates.length > 0 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center gap-2 px-1">
                    <Sparkles size={16} className="text-amber-500" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Smart Duplicate Detector</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {detectedDuplicates.map((group, idx) => (
                      <div key={idx} className="p-5 bg-amber-50/50 rounded-3xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <h4 className="font-black text-base text-amber-900">"{group.name}"</h4>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-amber-800">
                            <span className="font-bold">Keep:</span>
                            <code className="bg-white px-2 py-0.5 rounded border border-amber-100 text-[10px] font-mono">
                              {group.primary.email || 'No Email'}
                            </code>
                            <span className="opacity-40">|</span>
                            <span className="font-bold">Merge:</span>
                            {group.duplicates.map(d => (
                              <code key={d.id} className="bg-white px-2 py-0.5 rounded border border-amber-100 text-[10px] font-mono">
                                {d.email || 'No Email'}
                              </code>
                            ))}
                          </div>
                        </div>
                        <Button 
                          onClick={() => handleAutoMergeGroup(group)}
                          disabled={merging}
                          className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl h-9 px-4 font-black text-[10px] uppercase tracking-widest shadow-md"
                        >
                          {merging ? <Loader2 className="animate-spin mr-1.5" /> : <Merge size={12} className="mr-1.5" />}
                          Merge Group
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="h-px bg-slate-100 dark:bg-slate-800" />

              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Manual Merge Override</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Duplicate Client (To Remove)</label>
                    <Select value={sourceClientId} onValueChange={setSourceClientId} disabled={loadingClients || merging}>
                      <SelectTrigger className="h-12 rounded-xl font-bold bg-slate-50 border-slate-200">
                        <SelectValue placeholder={loadingClients ? "Loading..." : "Select duplicate..."} />
                      </SelectTrigger>
                      <SelectContent className="max-h-[250px]">
                        {clients.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Primary Client (To Keep)</label>
                    <Select value={targetClientId} onValueChange={setTargetClientId} disabled={loadingClients || merging}>
                      <SelectTrigger className="h-12 rounded-xl font-bold bg-slate-50 border-slate-200">
                        <SelectValue placeholder={loadingClients ? "Loading..." : "Select primary..."} />
                      </SelectTrigger>
                      <SelectContent className="max-h-[250px]">
                        {clients.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {sourceClientId && targetClientId && (
                  <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
                    <ArrowRightLeft size={20} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-amber-900">Merge Action Summary:</p>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        All appointments for <strong>{clients.find(c => c.id === sourceClientId)?.name}</strong> will be moved to <strong>{clients.find(c => c.id === targetClientId)?.name}</strong>. The duplicate page in Notion will be archived, and the duplicate profile in the CRM will be deleted.
                      </p>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleMergeClients}
                  disabled={merging || !sourceClientId || !targetClientId}
                  className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-100"
                >
                  {merging ? <Loader2 className="mr-2 animate-spin" /> : <Merge size={18} className="mr-2" />}
                  Merge Client Profiles
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white dark:bg-slate-950 overflow-hidden border-2 border-indigo-100">
            <CardHeader className="p-8 pb-4 bg-indigo-50/50">
              <CardTitle className="text-xl font-black flex items-center gap-3 text-indigo-900">
                <CreditCard size={24} /> Stripe Clinical Payments
              </CardTitle>
              <CardDescription className="text-indigo-700 font-medium">Link your CRM clients to Stripe for seamless Tap-to-Pay and invoicing.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-indigo-100 dark:border-indigo-900/30 space-y-4">
                  <div className="space-y-1">
                    <h4 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">1. Initialize FNH Product</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">Creates the '$50 FNH Clinical Assessment' product in Stripe.</p>
                  </div>
                  <Button 
                    onClick={handleInitializeStripe} 
                    disabled={initializingStripe}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 font-black text-[10px] uppercase tracking-widest shadow-lg"
                  >
                    {initializingStripe ? <Loader2 className="mr-2 animate-spin" /> : <Zap size={16} className="mr-2" />}
                    Initialize
                  </Button>
                </div>

                <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-indigo-100 dark:border-indigo-900/30 space-y-4">
                  <div className="space-y-1">
                    <h4 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">2. Bulk Sync Clients</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">Push all existing CRM clients into your Stripe customer list.</p>
                  </div>
                  <Button 
                    onClick={handleSyncAllToStripe} 
                    disabled={syncingAll}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 font-black text-[10px] uppercase tracking-widest shadow-lg"
                  >
                    {syncingAll ? <Loader2 className="mr-2 animate-spin" /> : <Users size={16} className="mr-2" />}
                    Sync All to Stripe
                  </Button>
                </div>
              </div>

              <div className="p-6 bg-amber-50 dark:bg-amber-950/20 rounded-3xl border border-amber-100 dark:border-amber-900/30 space-y-3">
                <div className="flex items-center gap-2">
                  <Info size={16} className="text-amber-600" />
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Automation Active</p>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-200 font-medium">
                  New bookings from Cal.com will now automatically create Stripe customers. Use the button above to sync your current database.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg rounded-[2.5rem] bg-white dark:bg-slate-950 overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-black flex items-center gap-3 text-indigo-500">
                <FileText size={24} className="text-indigo-500" /> Documentation & Audit
              </CardTitle>
              <CardDescription className="font-medium">Export site structure and content breakdowns.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-4">
              <Link to="/settings/audit">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:border-indigo-300 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                      <LayoutGrid size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white">Site Audit Tool</p>
                      <p className="text-[10px] text-slate-500 font-medium">Full text breakdown of all pages</p>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg rounded-[2.5rem] bg-white dark:bg-slate-950 overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-black flex items-center gap-3">
                <Calendar size={24} className="text-amber-500" /> Cal.com Webhook Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="space-y-3">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Your Unique Endpoint</p>
                <div className="flex gap-2">
                  <div className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-mono text-slate-600 dark:text-slate-400 truncate flex items-center">
                    {webhookUrl}
                  </div>
                  <Button variant="outline" size="icon" className="rounded-xl h-12 w-12 shrink-0" onClick={() => handleCopy(webhookUrl, 'web')}>
                    {copied === 'web' ? <Check size={20} className="text-emerald-500" /> : <Copy size={20} />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-lg rounded-[2.5rem] bg-white dark:bg-slate-950 overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-black flex items-center gap-3">
                <User size={24} className="text-rose-500" /> Account
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-lg">
                  P
                </div>
                <div>
                  <p className="font-black text-slate-900 dark:text-white">Practitioner Account</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active Session</p>
                </div>
              </div>
              <Button 
                variant="destructive" 
                onClick={handleSignOut}
                className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-100 dark:shadow-none"
              >
                <LogOut size={18} className="mr-2" /> Sign Out of System
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;