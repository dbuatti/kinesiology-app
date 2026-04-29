"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  RefreshCw, 
  Zap, 
  Brain, 
  Dumbbell, 
  Baby, 
  AlertCircle,
  Loader2,
  ClipboardCheck,
  ArrowRight,
  ShieldCheck,
  Info,
  Lightbulb
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { safeParse } from "@/utils/safe-json";
import EditableField from '@/components/shared/EditableField';
import { showSuccess, showError } from '@/utils/toast';

interface EmbedTabProps {
  appointment: any;
  onUpdate: () => void;
  saveField: (field: string, value: any) => Promise<void>;
  updatePriorityPattern: (category: string, itemName: string, status: 'Clear' | 'Inhibited' | null, side?: 'L' | 'R') => Promise<void>;
}

const EmbedTab = ({ appointment, onUpdate, saveField, updatePriorityPattern }: EmbedTabProps) => {
  const [muscleTests, setMuscleTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearingId, setClearingId] = useState<string | null>(null);

  const fetchMuscleTests = async () => {
    try {
      const { data, error } = await supabase
        .from('muscle_tests')
        .select('*')
        .eq('appointment_id', appointment.id);
      
      if (!error) setMuscleTests(data || []);
    } catch (err) {
      console.error("Error fetching muscle tests for embed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMuscleTests();
  }, [appointment.id]);

  const inhibitedItems = useMemo(() => {
    const items: { id: string; name: string; category: string; type: 'pattern' | 'muscle'; status: string; side?: 'L' | 'R' }[] = [];
    
    // 1. Parse Priority Pattern (Reflexes, Nerves, Brain Zones)
    const pattern = safeParse(appointment.priority_pattern, {} as any);
    Object.entries(pattern).forEach(([catKey, categoryItems]: [string, any]) => {
      Object.entries(categoryItems).forEach(([name, status]) => {
        if (status === 'Inhibited') {
          const sideMatch = name.match(/\(([LR])\)$/);
          const side = sideMatch ? sideMatch[1] as 'L' | 'R' : undefined;
          const baseName = name.replace(/ \([LR]\)$/, '');
          
          items.push({
            id: `${catKey}-${name}`,
            name: baseName,
            category: catKey,
            type: 'pattern',
            status: 'Inhibited',
            side
          });
        }
      });
    });

    // 2. Add Non-Normotonic Muscles from table
    muscleTests.forEach(test => {
      if (test.status !== 'Normotonic') {
        const sideMatch = test.muscle_name.match(/\(([LR])\)$/);
        const side = sideMatch ? sideMatch[1] as 'L' | 'R' : undefined;
        const baseName = test.muscle_name.replace(/ \([LR]\)$/, '');

        // Avoid duplicates if already in pattern
        if (!items.find(i => i.name === baseName && i.side === side)) {
          items.push({
            id: test.id,
            name: baseName,
            category: 'Muscles',
            type: 'muscle',
            status: test.status,
            side
          });
        }
      }
    });

    return items;
  }, [appointment.priority_pattern, muscleTests]);

  const handleClearItem = async (item: any) => {
    setClearingId(item.id);
    try {
      if (item.type === 'pattern') {
        await updatePriorityPattern(item.category, item.name, 'Clear', item.side);
      } else {
        const { error } = await supabase
          .from('muscle_tests')
          .update({ status: 'Normotonic' })
          .eq('id', item.id);
        
        if (error) throw error;
        await fetchMuscleTests();
      }
      showSuccess(`${item.name} marked as Clear.`);
      onUpdate();
    } catch (err) {
      showError("Failed to clear item.");
    } finally {
      setClearingId(null);
    }
  };

  const getIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('reflex')) return Baby;
    if (cat.includes('nerve')) return Zap;
    if (cat.includes('muscle')) return Dumbbell;
    return Brain;
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Re-challenge Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg">
              <RefreshCw size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Clinical Verification</h2>
              <p className="text-xs text-slate-500 font-medium">Re-challenge all inhibited findings to confirm integration.</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-500 font-bold">
            {inhibitedItems.length} Items to Check
          </Badge>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-indigo-500" /></div>
        ) : inhibitedItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inhibitedItems.map((item) => {
              const Icon = getIcon(item.category);
              const isClearing = clearingId === item.id;

              return (
                <Card key={item.id} className="border-none shadow-sm bg-white group hover:shadow-md transition-all rounded-2xl overflow-hidden border-l-4 border-rose-500">
                  <CardContent className="p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                        <Icon size={20} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-black text-slate-900 truncate">{item.name}</p>
                          {item.side && (
                            <Badge variant="outline" className="text-[8px] font-black uppercase px-1.5 py-0 border-slate-200 text-slate-400">
                              {item.side}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest">{item.status}</p>
                      </div>
                    </div>

                    <Button 
                      onClick={() => handleClearItem(item)}
                      disabled={isClearing}
                      className="bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-xl h-10 px-4 font-black text-[10px] uppercase tracking-widest transition-all border border-emerald-100"
                    >
                      {isClearing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} className="mr-2" />}
                      Mark Clear
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-emerald-50/50 rounded-[2.5rem] border-2 border-dashed border-emerald-200">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <ShieldCheck size={32} className="text-emerald-500" />
            </div>
            <h3 className="text-lg font-black text-emerald-900">All Findings Integrated</h3>
            <p className="text-emerald-700/70 font-medium text-sm max-w-xs mx-auto mt-1">
              No active inhibitions detected. The system is balanced and ready for embedding.
            </p>
          </div>
        )}
      </div>

      {/* Notes Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <ClipboardCheck size={16} />
          </div>
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Re-Assessment & Homework</h3>
        </div>
        <EditableField 
          field="session_north_star" 
          label="Integration Notes" 
          value={appointment.session_north_star} 
          multiline 
          placeholder="Document final re-test results and prescribed homework for the next session..." 
          onSave={saveField} 
          className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm min-h-[400px]" 
        />
      </div>

      {/* Clinical Pearl */}
      <div className="p-8 bg-slate-900 text-white rounded-[2.5rem] flex items-start gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><Info size={100} /></div>
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shrink-0 relative z-10">
          <Lightbulb size={24} />
        </div>
        <div className="space-y-1 relative z-10">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Clinical Mastery</p>
          <p className="text-base text-slate-300 font-medium leading-relaxed italic">
            "The Embed phase is where we verify the fractal resolution. If an item remains inhibited after re-challenge, it indicates a deeper layer or a missing SNS reset. Never leave a session with an active primary priority."
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmbedTab;