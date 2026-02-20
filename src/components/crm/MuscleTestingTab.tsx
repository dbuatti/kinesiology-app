"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw, Zap, Sparkles, Trash2, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { MUSCLE_GROUPS, PRIMARY_14_MUSCLES, MuscleStatus } from "@/data/muscle-data";
import { MuscleTestResult } from "@/types/crm";
import MuscleInfoModal from "./MuscleInfoModal";
import { getChannelByMuscle } from "@/data/tcm-channel-data";
import MuscleTestingFilters from "./MuscleTestingFilters";
import MuscleGroupCollapsible from "./MuscleGroupCollapsible";
import MuscleStatusLegend from "./MuscleStatusLegend";
import MuscleTestAssistanceCard from "./MuscleTestAssistanceCard";
import MuscleProgressCard from "./MuscleProgressCard";

interface MuscleTestingTabProps {
  appointmentId: string;
}

const MuscleTestingTab = ({ appointmentId }: MuscleTestingTabProps) => {
  const [results, setResults] = useState<Record<string, MuscleTestResult>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [meridianFilter, setMeridianFilter] = useState<string>("all");
  const [showOnlyTested, setShowOnlyTested] = useState(false);
  const [showOnlyDysfunctional, setShowOnlyDysfunctional] = useState(false);
  const [selectedMuscleForInfo, setSelectedMuscleForInfo] = useState<string | null>(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    Object.keys(MUSCLE_GROUPS).forEach(group => {
      initial[group] = true;
    });
    return initial;
  });

  const fetchMuscleTests = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('muscle_tests')
        .select('*')
        .eq('appointment_id', appointmentId);

      if (error) throw error;

      const resultsMap: Record<string, MuscleTestResult> = {};
      (data || []).forEach(r => {
        resultsMap[r.muscle_name] = r as MuscleTestResult;
      });
      setResults(resultsMap);
    } catch (error: any) {
      showError("Failed to load muscle test data.");
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    fetchMuscleTests();
  }, [fetchMuscleTests]);

  const handleStatusChange = async (muscleName: string, status: MuscleStatus['value']) => {
    if (saving) return;
    setSaving(true);

    const existingResult = results[muscleName];
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      showError("User not authenticated.");
      setSaving(false);
      return;
    }

    const payload = {
      user_id: user.id,
      appointment_id: appointmentId,
      muscle_name: muscleName,
      status: status,
    };

    try {
      let newResult: MuscleTestResult;

      if (existingResult) {
        const { error } = await supabase
          .from("muscle_tests")
          .update(payload)
          .eq('id', existingResult.id);
        if (error) throw error;
        newResult = { ...existingResult, ...payload };
      } else {
        const { data, error } = await supabase
          .from("muscle_tests")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        newResult = data as MuscleTestResult;
      }
      
      setResults(prev => ({ ...prev, [muscleName]: newResult }));
      showSuccess(`${muscleName} status updated to ${status}`);
    } catch (error: any) {
      showError(error.message || `Failed to update ${muscleName} status.`);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickLog14 = async () => {
    if (!confirm("This will log all 14 Primary Muscles as 'Normotonic'. Continue?")) return;
    
    setSaving(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Not authenticated");

      const inserts = PRIMARY_14_MUSCLES.map(name => ({
        user_id: user.id,
        appointment_id: appointmentId,
        muscle_name: name,
        status: 'Normotonic' as const
      }));

      await supabase.from('muscle_tests').delete().eq('appointment_id', appointmentId).in('muscle_name', PRIMARY_14_MUSCLES);
      const { data, error } = await supabase.from('muscle_tests').insert(inserts).select();
      if (error) throw error;

      const newResults = { ...results };
      (data || []).forEach(r => { newResults[r.muscle_name] = r as MuscleTestResult; });
      setResults(newResults);
      showSuccess("14 Primary Muscles logged!");
    } catch (err: any) {
      showError(err.message || "Failed to quick-log muscles.");
    } finally {
      setSaving(false);
    }
  };

  const handleClearAll = async () => {
    if (Object.keys(results).length === 0) return;
    if (!confirm("Clear ALL muscle test results for this session?")) return;

    setSaving(true);
    try {
      const { error } = await supabase.from("muscle_tests").delete().eq('appointment_id', appointmentId);
      if (error) throw error;
      setResults({});
      showSuccess("All muscle tests cleared.");
    } catch (error: any) {
      showError("Failed to clear muscle tests.");
    } finally {
      setSaving(false);
    }
  };

  const handleClearMuscle = async (muscleName: string) => {
    const result = results[muscleName];
    if (!result) return;
    if (!confirm(`Clear test result for ${muscleName}?`)) return;

    setSaving(true);
    try {
      const { error } = await supabase.from("muscle_tests").delete().eq('id', result.id);
      if (error) throw error;
      setResults(prev => {
        const newResults = { ...prev };
        delete newResults[muscleName];
        return newResults;
      });
      showSuccess(`${muscleName} test cleared.`);
    } catch (error: any) {
      showError(`Failed to clear ${muscleName} test.`);
    } finally {
      setSaving(false);
    }
  };

  const filteredGroups = useMemo(() => {
    const filtered: Record<string, string[]> = {};
    Object.entries(MUSCLE_GROUPS).forEach(([group, muscles]) => {
      const matchingMuscles = muscles.filter(m => {
        const matchesSearch = m.toLowerCase().includes(searchTerm.toLowerCase());
        const isTested = !!results[m];
        const isDysfunctional = isTested && results[m].status !== 'Normotonic';
        let matchesMeridian = true;
        if (meridianFilter !== "all") {
          const channel = getChannelByMuscle(m);
          matchesMeridian = channel?.name === meridianFilter || channel?.code === meridianFilter;
        }
        if (!matchesSearch || !matchesMeridian) return false;
        if (showOnlyDysfunctional && !isDysfunctional) return false;
        if (showOnlyTested && !isTested) return false;
        return true;
      });
      if (matchingMuscles.length > 0) filtered[group] = matchingMuscles;
    });
    return filtered;
  }, [searchTerm, meridianFilter, showOnlyTested, showOnlyDysfunctional, results]);

  const totalMusclesCount = useMemo(() => Object.values(MUSCLE_GROUPS).reduce((acc, curr) => acc + curr.length, 0), []);
  const testedCount = Object.keys(results).length;

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Loading muscle log...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-indigo-600 rounded-[2rem] text-white shadow-xl shadow-indigo-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center"><Sparkles size={24} /></div>
            <div>
              <h3 className="text-xl font-black">14 Muscle Balance</h3>
              <p className="text-indigo-100 text-xs font-medium">Quick-log the standard TFH primary balance.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleQuickLog14} disabled={saving} className="bg-white text-indigo-600 hover:bg-indigo-50 rounded-xl font-black text-xs uppercase tracking-widest h-12 px-8 shadow-lg">
              {saving ? <Loader2 className="mr-2 animate-spin" /> : <Zap size={18} className="mr-2 fill-current" />}
              Log 14 Primary
            </Button>
            {testedCount > 0 && (
              <Button variant="outline" onClick={handleClearAll} disabled={saving} className="bg-indigo-700/50 border-indigo-400 text-white hover:bg-indigo-700 rounded-xl h-12 px-4"><Trash2 size={18} /></Button>
            )}
          </div>
        </div>
        <MuscleProgressCard testedCount={testedCount} totalCount={totalMusclesCount} />
      </div>

      <MuscleTestingFilters
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        meridianFilter={meridianFilter} setMeridianFilter={setMeridianFilter}
        showOnlyTested={showOnlyTested} setShowOnlyTested={setShowOnlyTested}
        showOnlyDysfunctional={showOnlyDysfunctional} setShowOnlyDysfunctional={setShowOnlyDysfunctional}
        isAllExpanded={Object.values(openGroups).every(v => v)}
        onToggleAllGroups={() => {
          const allOpen = Object.values(openGroups).every(v => v);
          const newState: Record<string, boolean> = {};
          Object.keys(MUSCLE_GROUPS).forEach(k => newState[k] = !allOpen);
          setOpenGroups(newState);
        }}
      />

      <div className="space-y-6">
        {Object.entries(filteredGroups).map(([groupName, muscles]) => (
          <MuscleGroupCollapsible
            key={groupName} groupName={groupName} muscles={muscles} results={results}
            isOpen={openGroups[groupName]} onToggle={() => setOpenGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }))}
            onStatusChange={handleStatusChange} onClear={handleClearMuscle}
            onShowInfo={(m) => { setSelectedMuscleForInfo(m); setInfoModalOpen(true); }}
            disabled={saving}
          />
        ))}

        {Object.keys(filteredGroups).length === 0 && (
          <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <div className="mx-auto w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm"><Filter className="text-slate-300" size={24} /></div>
            <p className="text-slate-900 font-black text-lg">No muscles match your filters</p>
            <Button variant="link" onClick={() => { setShowOnlyTested(false); setShowOnlyDysfunctional(false); setSearchTerm(""); setMeridianFilter("all"); }} className="mt-4 text-indigo-600 font-bold">Reset All Filters</Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <MuscleStatusLegend />
        <MuscleTestAssistanceCard />
      </div>

      <MuscleInfoModal muscleName={selectedMuscleForInfo} open={infoModalOpen} onOpenChange={setInfoModalOpen} />
    </div>
  );
};

export default MuscleTestingTab;