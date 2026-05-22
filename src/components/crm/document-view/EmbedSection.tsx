"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { safeParse } from "@/utils/safe-json";
import { PRIMITIVE_REFLEXES } from "@/data/primitive-reflex-data";
import { BRAIN_REFLEX_POINTS } from "@/data/brain-reflex-data";
import { 
  CheckCircle2, 
  Loader2, 
  Baby, 
  Zap, 
  Dumbbell, 
  Brain, 
  Activity, 
  Heart, 
  ShieldAlert, 
  RefreshCw, 
  Info, 
  Target, 
  Sparkles,
  Check,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { showSuccess, showError } from '@/utils/toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DocInput from './DocInput';

interface EmbedSectionProps {
  appointment: any;
  saveField: (field: string, value: any) => Promise<void>;
  updatePriorityPattern: (category: string, itemName: string, status: string | null, side?: 'L' | 'R') => Promise<void>;
  onTogglePatternItem: (category: string, name: string, nextStatus: string, side?: 'L' | 'R') => void;
  onUpdate?: () => void;
}

interface RecheckItem {
  id: string;
  name: string;
  category: string;
  type: 'pattern' | 'muscle';
  status: string;
  side?: 'L' | 'R';
  isCleared: boolean;
}

const getCanonicalName = (name: string): string => {
  const cleanName = name.replace(/ \([LR]\)$/, '').trim();
  const lowerClean = cleanName.toLowerCase();
  const reflex = PRIMITIVE_REFLEXES.find(r => 
    r.id.toLowerCase() === lowerClean || 
    r.name.toLowerCase() === lowerClean ||
    r.name.toLowerCase().includes(lowerClean)
  );
  if (reflex) return reflex.name;
  const point = BRAIN_REFLEX_POINTS.find(p => 
    p.id.toLowerCase() === lowerClean || 
    p.name.toLowerCase() === lowerClean ||
    p.name.toLowerCase().split(':')[0].trim() === lowerClean
  );
  if (point) return point.name.split(':')[0].trim();
  return cleanName;
};

const EmbedSection = ({ appointment, saveField, updatePriorityPattern, onTogglePatternItem, onUpdate }: EmbedSectionProps) => {
  const [muscleTests, setMuscleTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearingId, setClearingId] = useState<string | null>(null);

  const fetchMuscleTests = async () => {
    if (!appointment.id || appointment.id.includes('00000000')) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('muscle_tests')
        .select('*')
        .eq('appointment_id', appointment.id);
      
      if (!error) setMuscleTests(data || []);
    } catch (err) {
      console.error("Error fetching muscle tests for embed section:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMuscleTests();
  }, [appointment.id]);

  const pattern = useMemo(() => safeParse(appointment.priority_pattern, {} as any), [appointment.priority_pattern]);

  // 1. Compute all findings (both clear and inhibited)
  const allFindings = useMemo(() => {
    const items: { name: string; status: string; category: string; type: 'pattern' | 'muscle' }[] = [];
    
    Object.entries(pattern).forEach(([catKey, categoryItems]: [string, any]) => {
      Object.entries(categoryItems).forEach(([name, status]) => {
        const sideMatch = name.match(/\(([LR])\)$/);
        const side = sideMatch ? sideMatch[1] : "";
        const base = getCanonicalName(name);
        const displayName = side ? `${base} (${side})` : base;

        items.push({
          name: displayName,
          status: status as string,
          category: catKey.replace(/([A-Z])/g, ' $1').trim(),
          type: 'pattern'
        });
      });
    });

    muscleTests.forEach(test => {
      const sideMatch = test.muscle_name.match(/\(([LR])\)$/);
      const side = sideMatch ? sideMatch[1] : "";
      const base = getCanonicalName(test.muscle_name);
      const displayName = side ? `${base} (${side})` : base;

      if (!items.find(i => i.name === displayName)) {
        items.push({
          name: displayName,
          status: test.status,
          category: 'Muscles',
          type: 'muscle'
        });
      }
    });

    return items.sort((a, b) => a.name.localeCompare(b.name));
  }, [pattern, muscleTests]);

  // 2. Filter out only currently and historically inhibited findings for the "Clinical Verification" re-challenge list
  const inhibitedItems = useMemo(() => {
    const items: RecheckItem[] = [];
    
    Object.entries(pattern).forEach(([catKey, categoryItems]: [string, any]) => {
      Object.entries(categoryItems).forEach(([name, status]) => {
        const strStatus = status as string;
        const isCleared = strStatus.endsWith('_Cleared');
        const baseStatus = strStatus.replace('_Cleared', '');

        if (baseStatus === 'Inhibited' || baseStatus === 'Hypertonic') {
          const sideMatch = name.match(/\(([LR])\)$/);
          const side = sideMatch ? sideMatch[1] as 'L' | 'R' : undefined;
          const baseName = name.replace(/ \([LR]\)$/, '');
          
          items.push({
            id: `${catKey}-${name}`,
            name: baseName,
            category: catKey,
            type: 'pattern',
            status: baseStatus,
            side,
            isCleared
          });
        }
      });
    });

    muscleTests.forEach(test => {
      const strStatus = test.status as string;
      const isCleared = strStatus.endsWith('_Cleared') || strStatus === 'Normotonic_Cleared';
      const baseStatus = strStatus.replace('_Cleared', '');

      if (baseStatus === 'Inhibition' || baseStatus === 'Hypertonic' || baseStatus === 'Switching' || baseStatus === 'Dysfunctional' || isCleared) {
        const sideMatch = test.muscle_name.match(/\(([LR])\)$/);
        const side = sideMatch ? sideMatch[1] as 'L' | 'R' : undefined;
        const baseName = test.muscle_name.replace(/ \([LR]\)$/, '').trim();

        if (!items.find(i => i.name === baseName && i.side === side)) {
          items.push({
            id: test.id,
            name: baseName,
            category: 'Muscles',
            type: 'muscle',
            status: baseStatus === 'Normotonic' ? 'Inhibition' : baseStatus,
            side,
            isCleared
          });
        }
      }
    });

    return items.sort((a, b) => a.name.localeCompare(b.name));
  }, [pattern, muscleTests]);

  const handleClearItem = async (item: RecheckItem) => {
    setClearingId(item.id);
    try {
      if (item.type === 'pattern') {
        const nextStatus = item.isCleared ? 'Inhibited' : 'Inhibited_Cleared';
        await updatePriorityPattern(item.category, item.name, nextStatus, item.side);
      } else {
        const nextStatus = item.isCleared ? 'Inhibition' : 'Inhibition_Cleared';
        const { error } = await supabase
          .from('muscle_tests')
          .update({ status: nextStatus })
          .eq('id', item.id);
        
        if (error) throw error;
        await fetchMuscleTests();
      }
      showSuccess(`${item.name} status updated.`);
      onUpdate?.();
    } catch (err) {
      showError("Failed to update item status.");
    } finally {
      setClearingId(null);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    saveField(field, value);
  };

  const getIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('reflex')) return Baby;
    if (cat.includes('nerve')) return Zap;
    if (cat.includes('muscle')) return Dumbbell;
    return Brain;
  };

  const hasSnsResets = !!(appointment.harmonic_rocking_notes || appointment.t1_reset_notes || appointment.diaphragm_reset_notes || appointment.vagus_nerve_notes);

  return (
    <div className="space-y-12">
      {/* 1. Clinical Verification (Re-challenge) */}
      <div className="space-y-4">
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 border-l-4 border-slate-200 pl-3">
          Clinical Verification
        </h3>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          Re-challenge all inhibited findings to confirm integration.
        </p>

        {loading ? (
          <div className="py-6 flex justify-center"><Loader2 className="animate-spin text-slate-400" size={20} /></div>
        ) : inhibitedItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {inhibitedItems.map((item) => {
              const Icon = getIcon(item.category);
              const isClearing = clearingId === item.id;

              return (
                <div key={item.id} className={cn(
                  "p-4 border flex items-center justify-between gap-4 bg-white transition-all",
                  item.isCleared ? "border-emerald-200 bg-emerald-50/10" : "border-rose-200 bg-rose-50/10"
                )}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      item.isCleared ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    )}>
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={cn("font-bold text-xs text-slate-900 truncate", item.isCleared && "text-slate-500 line-through")}>{item.name}</p>
                        {item.side && (
                          <span className="text-[8px] font-black uppercase px-1.5 py-0 border border-slate-200 text-slate-400">
                            {item.side}
                          </span>
                        )}
                      </div>
                      <p className={cn(
                        "text-[8px] font-black uppercase tracking-widest",
                        item.isCleared ? "text-emerald-600" : "text-rose-500"
                      )}>
                        {item.isCleared ? "Cleared" : item.status}
                      </p>
                    </div>
                  </div>

                  <Button 
                    variant="ghost"
                    size="sm" 
                    onClick={() => handleClearItem(item)}
                    disabled={isClearing}
                    className={cn(
                      "h-8 px-3 rounded-none border text-[9px] font-black uppercase tracking-widest transition-all shrink-0",
                      item.isCleared 
                        ? "border-slate-200 hover:bg-slate-100 text-slate-600" 
                        : "border-emerald-500 hover:bg-emerald-600 hover:text-white text-emerald-600"
                    )}
                  >
                    {isClearing ? <Loader2 size={12} className="animate-spin" /> : item.isCleared ? "Undo" : "Mark Clear"}
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 border border-dashed border-slate-200 text-center bg-slate-50/50">
            <CheckCircle2 className="mx-auto text-emerald-500 mb-2" size={24} />
            <p className="text-xs font-bold text-emerald-800">All Findings Integrated</p>
            <p className="text-[10px] text-slate-400 mt-0.5">No active inhibitions detected. The system is balanced.</p>
          </div>
        )}
      </div>

      {/* 2. Pathway Findings Review */}
      <div className="space-y-4">
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 border-l-4 border-slate-200 pl-3">
          Pathway Findings
        </h3>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          Review of all findings and their final status logged during this session.
        </p>

        {allFindings.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {allFindings.map((finding, idx) => {
              const isClear = finding.status === 'Clear' || finding.status === 'Normotonic' || finding.status.endsWith('_Cleared') || finding.status === 'Normotonic_Cleared';
              return (
                <div 
                  key={idx} 
                  className={cn(
                    "p-2.5 border text-[9px] font-bold flex items-center justify-between rounded-sm",
                    isClear ? "bg-emerald-50/30 border-emerald-100 text-emerald-800" : "bg-rose-50/30 border-rose-100 text-rose-800"
                  )}
                >
                  <span className="truncate mr-2">{finding.name}</span>
                  <span className={cn(
                    "text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm",
                    isClear ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                  )}>
                    {finding.status.replace('_Cleared', ' (Cleared)')}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No findings recorded in this session.</p>
        )}
      </div>

      {/* 3. Corrections & Logic */}
      <div className="space-y-6">
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 border-l-4 border-slate-200 pl-3">
          Corrections & Logic
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Balances Applied</label>
            <div className="p-4 bg-slate-50/50 border border-slate-200 min-h-[100px] text-xs font-mono leading-relaxed text-slate-700 whitespace-pre-wrap">
              {appointment.modes_balances || "No corrections logged."}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Acupoints</label>
            <div className="p-4 bg-slate-50/50 border border-slate-200 min-h-[100px] text-xs font-bold text-indigo-600">
              {appointment.acupoints || "No acupoints recorded."}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Standard Inputs */}
      <div className="space-y-10 pt-6 border-t border-slate-200">
        <DocInput 
          label="Final Re-Assessment & Prescribed Homework" 
          value={appointment.session_north_star} 
          field="session_north_star" 
          placeholder="Verify integration and define the client's daily practice..." 
          multiline 
          onChange={handleFieldChange}
        />
        <DocInput 
          label="General Session Notes" 
          value={appointment.notes} 
          field="notes" 
          placeholder="Any additional observations or context..." 
          multiline 
          onChange={handleFieldChange}
        />
        <DocInput 
          label="Practitioner Reflection (Private)" 
          value={appointment.journal} 
          field="journal" 
          placeholder="Personal insights for the Sandbox..." 
          multiline 
          onChange={handleFieldChange}
        />
      </div>
    </div>
  );
};

export default EmbedSection;