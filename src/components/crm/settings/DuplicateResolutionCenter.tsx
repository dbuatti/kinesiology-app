"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Merge, 
  Loader2, 
  Sparkles, 
  UserCheck, 
  ArrowRightLeft, 
  CheckCircle2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";
import { 
  getStringSimilarity, 
  normalizeName, 
  normalizeEmail, 
  normalizePhone 
} from "@/utils/duplicate-detector";
import MergeConflictDialog from "./MergeConflictDialog";

interface DuplicateGroup {
  name: string;
  primary: any;
  duplicates: any[];
  matchReason: string;
  confidence: number; // 0-100%
}

const FIELDS_TO_MERGE = [
  'name', 'email', 'phone', 'born', 'suburbs', 'pronouns', 'occupation',
  'marital_status', 'children', 'medical_history', 'medications_supplements',
  'emergency_contact_name', 'emergency_contact_phone', 'referral_source',
  'current_stress_level', 'sleep_quality', 'digestive_health', 'chatgpt_url',
  'journal', 'stripe_customer_id', 'notion_page_id', 'notion_link'
];

const DuplicateResolutionCenter = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [sourceClientId, setSourceClientId] = useState<string>("");
  const [targetClientId, setTargetClientId] = useState<string>("");
  const [merging, setMerging] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedDuplicates, setDetectedDuplicates] = useState<DuplicateGroup[]>([]);
  const [activeMerge, setActiveMerge] = useState<{
    primary: any;
    duplicate: any;
    fields: Record<string, any>;
  } | null>(null);

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

  useEffect(() => {
    fetchClients();
  }, []);

  const detectDuplicates = (clientsList: any[]) => {
    setIsDetecting(true);
    const visited = new Set<string>();
    const duplicatesFound: DuplicateGroup[] = [];

    for (let i = 0; i < clientsList.length; i++) {
      const clientA = clientsList[i];
      if (visited.has(clientA.id)) continue;

      const duplicates: any[] = [];
      let matchReason = "";
      let maxConfidence = 0;

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
        let confidence = 0;

        if (emailA && emailB && emailA === emailB) {
          isMatch = true;
          reason = "Exact Email Match";
          confidence = 100;
        } else if (phoneA && phoneB && phoneA === phoneB) {
          isMatch = true;
          reason = "Exact Phone Match";
          confidence = 95;
        } else if (nameA && nameB && nameA === nameB) {
          isMatch = true;
          reason = "Exact Name Match";
          confidence = 90;
        } else {
          const similarity = getStringSimilarity(clientA.name, clientB.name);
          if (similarity >= 0.8) {
            const sameDOB = bornA && bornB && bornA === bornB;
            const sameSuburb = clientA.suburbs?.some((s: string) => clientB.suburbs?.includes(s));
            
            if (sameDOB) {
              isMatch = true;
              reason = `Fuzzy Name Match (${Math.round(similarity * 100)}%) & Same DOB`;
              confidence = 95;
            } else if (sameSuburb) {
              isMatch = true;
              reason = `Fuzzy Name Match (${Math.round(similarity * 100)}%) & Same Suburb`;
              confidence = 85;
            } else if (similarity >= 0.9) {
              isMatch = true;
              reason = `High Similarity Name Match (${Math.round(similarity * 100)}%)`;
              confidence = 80;
            }
          }
        }

        if (isMatch) {
          duplicates.push(clientB);
          if (confidence > maxConfidence) {
            maxConfidence = confidence;
            matchReason = reason;
          }
        }
      }

      if (duplicates.length > 0) {
        visited.add(clientA.id);
        duplicates.forEach(d => visited.add(d.id));

        const allInGroup = [clientA, ...duplicates];
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
          if (fieldsA !== fieldsB) return fieldsB - fieldsA;

          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });

        duplicatesFound.push({
          name: sorted[0].name,
          primary: sorted[0],
          duplicates: sorted.slice(1),
          matchReason,
          confidence: maxConfidence
        });
      }
    }

    setDetectedDuplicates(duplicatesFound);
    setIsDetecting(false);
  };

  const cleanFieldsForDb = (fields: Record<string, any>) => {
    const cleaned: Record<string, any> = {};
    Object.entries(fields).forEach(([key, val]) => {
      if (val === "" || val === undefined) {
        cleaned[key] = null;
      } else if (key === 'current_stress_level') {
        const num = parseInt(val);
        cleaned[key] = isNaN(num) ? null : num;
      } else if (key === 'born') {
        try {
          cleaned[key] = val ? new Date(val).toISOString() : null;
        } catch (e) {
          cleaned[key] = null;
        }
      } else {
        cleaned[key] = val;
      }
    });
    return cleaned;
  };

  const executeMerge = async (sourceId: string, targetId: string, mergedFields?: Record<string, any>) => {
    const cleaned = mergedFields ? cleanFieldsForDb(mergedFields) : undefined;
    const { error } = await supabase.functions.invoke('sync-to-notion', {
      body: {
        action: 'merge-clients',
        sourceClientId: sourceId,
        targetClientId: targetId,
        mergedFields: cleaned,
        origin: window.location.origin
      }
    });
    if (error) throw error;
  };

  const startMergeSession = (primary: any, duplicate: any) => {
    const initialFields: Record<string, any> = {};

    FIELDS_TO_MERGE.forEach(field => {
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

    FIELDS_TO_MERGE.forEach(field => {
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

  return (
    <Card className="border-none shadow-xl rounded-[2.5rem] bg-white dark:bg-slate-950 overflow-hidden border-2 border-amber-100">
      <CardHeader className="p-8 pb-4 bg-amber-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl font-black flex items-center gap-3 text-amber-900">
              <Merge size={24} /> Duplicate Resolution Center
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
        {isDetecting ? (
          <div className="py-12 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-amber-500" size={32} />
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Scanning Database for Duplicates...</p>
          </div>
        ) : detectedDuplicates.length > 0 ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-2 px-1">
              <Sparkles size={16} className="text-amber-500" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Smart Duplicate Detector</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {detectedDuplicates.map((group, idx) => (
                <div key={idx} className="p-5 bg-amber-50/50 rounded-3xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-base text-amber-900">"{group.name}"</h4>
                      <Badge className="bg-amber-500 text-white border-none font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full">
                        {group.confidence}% Match Confidence
                      </Badge>
                    </div>
                    <p className="text-xs text-amber-800 font-medium">
                      <strong>Reason:</strong> {group.matchReason}
                    </p>
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
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => startMergeSession(group.primary, group.duplicates[0])}
                      disabled={merging}
                      variant="outline"
                      className="border-amber-200 text-amber-700 hover:bg-amber-50 rounded-xl h-9 px-4 font-black text-[10px] uppercase tracking-widest"
                    >
                      Review & Merge
                    </Button>
                    <Button 
                      onClick={() => handleAutoMergeGroup(group)}
                      disabled={merging}
                      className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl h-9 px-4 font-black text-[10px] uppercase tracking-widest shadow-md"
                    >
                      {merging ? <Loader2 className="mr-1.5" /> : <Merge size={12} className="mr-1.5" />}
                      Auto-Merge
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
              <UserCheck size={20} />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-black text-emerald-900">No Duplicates Detected</p>
              <p className="text-xs text-emerald-700 font-medium">Your client database is clean and fully consolidated.</p>
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
            <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
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

      <MergeConflictDialog
        activeMerge={activeMerge}
        onClose={() => setActiveMerge(null)}
        onFieldsChange={(fields) => setActiveMerge(prev => prev ? { ...prev, fields } : null)}
        onConfirmMerge={async () => {
          if (!activeMerge) return;
          setMerging(true);
          try {
            await executeMerge(activeMerge.duplicate.id, activeMerge.primary.id, activeMerge.fields);
            showSuccess(`Successfully merged "${activeMerge.duplicate.name}" into "${activeMerge.primary.name}"!`);
            setActiveMerge(null);
            fetchClients();
          } catch (err: any) {
            showError(err.message || "Failed to merge clients.");
          } finally {
            setMerging(false);
          }
        }}
        merging={merging}
      />
    </Card>
  );
};

export default DuplicateResolutionCenter;