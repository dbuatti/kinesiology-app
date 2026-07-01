
import { useState, useEffect, useMemo } from 'react';
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Merge, Loader2, CheckCircle2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import {
  getStringSimilarity,
  getTokenSimilarity,
  normalizeName,
  normalizeEmail,
  normalizePhone
} from "@/utils/duplicate-detector";
import MergeConflictDialog from "./MergeConflictDialog";
import ManualMergeForm from "./ManualMergeForm";
import DetectedDuplicatesList from "./DetectedDuplicatesList";

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
  const [merging, setMerging] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [pullingNotion, setPullingNotion] = useState(false);
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
          const tokenSimilarity = getTokenSimilarity(clientA.name, clientB.name);
          const sameDOB = bornA && bornB && bornA === bornB;
          const sameSuburb = clientA.suburbs?.some((s: string) => clientB.suburbs?.includes(s));

          if (similarity >= 0.8) {
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
          } else if (tokenSimilarity >= 0.8) {
            if (sameDOB) {
              isMatch = true;
              reason = `Token Name Match (${Math.round(tokenSimilarity * 100)}%) & Same DOB`;
              confidence = 90;
            } else if (sameSuburb) {
              isMatch = true;
              reason = `Token Name Match (${Math.round(tokenSimilarity * 100)}%) & Same Suburb`;
              confidence = 80;
            } else if (tokenSimilarity === 1.0) {
              isMatch = true;
              reason = `Subset Name Match (100%)`;
              confidence = 75;
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

  const handlePullFromNotion = async () => {
    setPullingNotion(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-to-notion', {
        body: { 
          action: 'pull-from-notion',
          origin: window.location.origin
        }
      });

      if (error) throw error;
      showSuccess(data.message || "Successfully pulled all clients from Notion!");
      fetchClients();
    } catch (err: any) {
      showError(err.message || "Failed to pull clients from Notion.");
    } finally {
      setPullingNotion(false);
    }
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
          cleaned[key] = val ? new Date(val).toISOString().split('T')[0] : null;
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

  const handleMergeClients = (sourceId: string, targetId: string) => {
    const sourceClient = clients.find(c => c.id === sourceId);
    const targetClient = clients.find(c => c.id === targetId);

    if (sourceClient && targetClient) {
      startMergeSession(targetClient, sourceClient);
    }
  };

  const [confirmAction, setConfirmAction] = useState<{
    callback: () => void;
    title: string;
    description: string;
  } | null>(null);

  const executeAutoMergeGroup = async (group: DuplicateGroup) => {
    setConfirmAction(null);
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

  const executeAutoMergeAll = async () => {
    setConfirmAction(null);
    if (detectedDuplicates.length === 0) return;
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
    <Card className="border-none shadow-xl rounded-[2.5rem] bg-card overflow-hidden border-2 border-amber-100 dark:border-amber-900/30">
      <CardHeader className="p-8 pb-4 bg-amber-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl font-black flex items-center gap-3 text-amber-900">
              <Merge size={24} /> Duplicate Resolution Center
            </CardTitle>
            <CardDescription className="text-amber-700 font-medium">Consolidate duplicate client profiles in both the CRM and Notion.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={handlePullFromNotion}
              disabled={pullingNotion || merging}
              variant="outline"
              className="border-amber-200 text-amber-700 hover:bg-amber-50 rounded-xl h-10 px-4 font-black text-[10px] uppercase tracking-widest"
            >
              {pullingNotion ? <Loader2 className="mr-2 animate-spin" /> : <RefreshCw size={14} className="mr-1.5" />}
              Pull from Notion
            </Button>
            {detectedDuplicates.length > 0 && (
              <Button 
                onClick={() => setConfirmAction({
                  callback: executeAutoMergeAll,
                  title: "Auto-merge all duplicate groups?",
                  description: `This will automatically merge ALL ${detectedDuplicates.length} duplicate groups into their primary profiles. This is a bulk operation. Are you sure you want to proceed?`
                })}
                disabled={merging}
                className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl h-10 px-4 font-black text-[10px] uppercase tracking-widest shadow-lg"
              >
                {merging ? <Loader2 className="mr-2 animate-spin" /> : <CheckCircle2 size={14} className="mr-1.5" />}
                Auto-Merge All ({detectedDuplicates.length})
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 pt-0 space-y-8">
        <DetectedDuplicatesList 
          detectedDuplicates={detectedDuplicates}
          isDetecting={isDetecting}
          merging={merging}
          onReviewMerge={startMergeSession}
          onAutoMerge={(group) => setConfirmAction({
            callback: () => executeAutoMergeGroup(group),
            title: `Auto-merge duplicates for "${group.name}"?`,
            description: "This will automatically combine non-empty fields into the primary profile."
          })}
        />

        <div className="h-px bg-border" />

        <ManualMergeForm 
          clients={clients}
          loadingClients={loadingClients}
          merging={merging}
          onMerge={handleMergeClients}
        />
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

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => { if (!open) setConfirmAction(null); }}
        title={confirmAction?.title || ""}
        description={confirmAction?.description || ""}
        confirmLabel="Merge"
        onConfirm={() => confirmAction?.callback()}
      />
    </Card>
  );
};

export default DuplicateResolutionCenter;