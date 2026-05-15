"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  RefreshCw, 
  Zap, 
  Brain, 
  Dumbbell, 
  Baby, 
  Loader2,
  Plus,
  Target,
  FileText,
  Save
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { safeParse } from "@/utils/safe-json";
import EditableField from '@/components/shared/EditableField';
import { showSuccess, showError } from '@/utils/toast';

const EmbedTab = ({ appointment, onUpdate, saveField, updatePriorityPattern }: any) => {
  const [clearingId, setClearingId] = useState<string | null>(null);
  const [muscleTests, setMuscleTests] = useState<any[]>([]);

  useEffect(() => {
    const fetchMuscles = async () => {
      const { data } = await supabase.from('muscle_tests').select('*').eq('appointment_id', appointment.id);
      if (data) setMuscleTests(data);
    };
    fetchMuscles();
  }, [appointment.id]);

  const inhibitedItems = useMemo(() => {
    const items: any[] = [];
    const pattern = safeParse(appointment.priority_pattern, {} as any);
    Object.entries(pattern).forEach(([cat, vals]: [string, any]) => {
      Object.entries(vals).forEach(([name, status]) => {
        if (status === 'Inhibited') items.push({ id: `${cat}-${name}`, name, category: cat, type: 'pattern' });
      });
    });
    muscleTests.forEach(t => {
      if (t.status !== 'Normotonic') items.push({ id: t.id, name: t.muscle_name, category: 'Muscles', type: 'muscle' });
    });
    return items;
  }, [appointment.priority_pattern, muscleTests]);

  const handleClearItem = async (item: any) => {
    setClearingId(item.id);
    try {
      if (item.type === 'pattern') {
        await updatePriorityPattern(item.category, item.name, 'Clear');
      } else {
        await supabase.from('muscle_tests').update({ status: 'Normotonic' }).eq('id', item.id);
      }
      showSuccess("Cleared.");
      onUpdate();
    } catch (err) {
      showError("Failed.");
    } finally {
      setClearingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <RefreshCw size={14} className="text-primary" />
            <h3 className="text-[11px] font-black uppercase tracking-widest">Verification</h3>
          </div>
          <div className="border border-slate-100 bg-white">
            {inhibitedItems.length > 0 ? (
              inhibitedItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 border-b border-slate-50 last:border-b-0">
                  <span className="text-[11px] font-bold text-slate-900 truncate pr-4">{item.name}</span>
                  <Button 
                    size="sm" 
                    onClick={() => handleClearItem(item)}
                    disabled={clearingId === item.id}
                    className="h-7 px-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white text-[9px] font-black uppercase tracking-widest border border-emerald-100"
                  >
                    {clearingId === item.id ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle2 size={10} className="mr-1.5" />}
                    Clear
                  </Button>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 italic text-xs">All findings integrated.</div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Target size={14} className="text-primary" />
            <h3 className="text-[11px] font-black uppercase tracking-widest">Homework</h3>
          </div>
          <EditableField 
            field="session_north_star" 
            label="" 
            value={appointment.session_north_star} 
            multiline 
            placeholder="Prescribed daily practice..." 
            onSave={saveField} 
            className="bg-white p-4 rounded-none border border-slate-100 shadow-sm min-h-[150px] text-sm font-bold italic" 
          />
        </div>
      </div>

      <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText size={16} className="text-indigo-400" />
          <span className="text-[11px] font-black uppercase tracking-widest">Final Session Notes</span>
        </div>
        <Button onClick={() => saveField('status', 'Completed')} className="h-8 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] uppercase tracking-widest">
          Finalize Session
        </Button>
      </div>
    </div>
  );
};

export default EmbedTab;