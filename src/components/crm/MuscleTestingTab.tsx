
import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw, Zap, Sparkles, Trash2, Filter, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { MUSCLE_GROUPS, PRIMARY_14_MUSCLES, MuscleStatus, MIDLINE_MUSCLES } from "@/data/muscle-data";
import { MuscleTestResult } from "@/types/crm";
import MuscleInfoModal from "./MuscleInfoModal";
import ClinicalReasoningModal from "./ClinicalReasoningModal";
import { getChannelByMuscle, TCM_CHANNELS } from "@/data/tcm-channel-data";
import MuscleTestingFilters from "./MuscleTestingFilters";
import MuscleGroupCollapsible from "./MuscleGroupCollapsible";
import MuscleStatusLegend from "./MuscleStatusLegend";
import MuscleTestAssistanceCard from "./MuscleTestAssistanceCard";
import MuscleProgressCard from "./MuscleProgressCard";
import { useMuscleProficiency } from "@/hooks/useMuscleProficiency";
import { isMeridianPeakNow } from "@/utils/crm-utils";

interface MuscleTestingTabProps {
  appointmentId: string;
}

const DEMO_ID = "00000000-0000-0000-0000-000000000000";

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
  
  const [selectedMuscleForLogic, setSelectedMuscleForLogic] = useState<string | null>(null);
  const [selectedStatusForLogic, setSelectedStatusForLogic] = useState<MuscleStatus['value'] | null>(null);
  const [logicModalOpen, setLogicModalOpen] = useState(false);
  
  const { counts: proficiencyCounts } = useMuscleProficiency();

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    Object.keys(MUSCLE_GROUPS).forEach(group => {
      initial[group] = true;
    });
    return initial;
  });

  const currentPeakMeridian = useMemo(() => {
    const hour = new Date().getHours();
    return TCM_CHANNELS.find(c => isMeridianPeakNow(c.peakTime, hour));
  }, []);

  const fetchMuscleTests = useCallback(async () => {
    if (appointmentId === DEMO_ID) {
      setLoading(false);
      return;
    }

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

  const handleStatusChange = async (muscleName: string, status: MuscleStatus['value'], side?: 'L' | 'R') => {
    const dbMuscleName = side ? `${muscleName} (${side})` : muscleName;

    if (appointmentId === DEMO_ID) {
      setResults(prev => ({
        ...prev,
        [dbMuscleName]: {
          id: 'demo-' + dbMuscleName,
          appointment_id: DEMO_ID,
          muscle_name: dbMuscleName,
          status: status,
          created_at: new Date().toISOString()
        } as MuscleTestResult
      }));
      showSuccess(`${dbMuscleName} status updated (Demo Mode)`);
      return;
    }

    if (saving) return;
    setSaving(true);

    const existingResult = results[dbMuscleName];
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      showError("User not authenticated.");
      setSaving(false);
      return;
    }

    const payload = {
      user_id: user.id,
      appointment_id: appointmentId,
      muscle_name: dbMuscleName,
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
      
      setResults(prev => ({ ...prev, [dbMuscleName]: newResult }));
      showSuccess(`${dbMuscleName} status updated to ${status}`);
    } catch (error: any) {
      showError(error.message || `Failed to update ${dbMuscleName} status.`);
    } finally {
      setSaving(false);
    }
  };

  const executeQuickLog14 = async () => {
    setSaving(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Not authenticated");

      const inserts: any[] = [];
      const namesToDelete: string[] = [];

      PRIMARY_14_MUSCLES.forEach(name => {
        const isMidline = MIDLINE_MUSCLES.includes(name);
        if (isMidline) {
          inserts.push({ user_id: user.id, appointment_id: appointmentId, muscle_name: name, status: 'Normotonic' });
          namesToDelete.push(name);
        } else {
          inserts.push({ user_id: user.id, appointment_id: appointmentId, muscle_name: `${name} (L)`, status: 'Normotonic' });
          inserts.push({ user_id: user.id, appointment_id: appointmentId, muscle_name: `${name} (R)`, status: 'Normotonic' });
          namesToDelete.push(`${name} (L)`, `${name} (R)`);
        }
      });

      await supabase.from('muscle_tests').delete().eq('appointment_id', appointmentId).in('muscle_name', namesToDelete);
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

  const handleQuickLog14 = () => {
    if (appointmentId === DEMO_ID) {
      const newResults = { ...results };
      PRIMARY_14_MUSCLES.forEach(name => {
        const isMidline = MIDLINE_MUSCLES.includes(name);
        if (isMidline) {
          newResults[name] = { id: 'demo-' + name, appointment_id: DEMO_ID, muscle_name: name, status: 'Normotonic', created_at: new Date().toISOString() } as MuscleTestResult;
        } else {
          newResults[`${name} (L)`] = { id: 'demo-' + name + '-L', appointment_id: DEMO_ID, muscle_name: `${name} (L)`, status: 'Normotonic', created_at: new Date().toISOString() } as MuscleTestResult;
          newResults[`${name} (R)`] = { id: 'demo-' + name + '-R', appointment_id: DEMO_ID, muscle_name: `${name} (R)`, status: 'Normotonic', created_at: new Date().toISOString() } as MuscleTestResult;
        }
      });
      setResults(newResults);
      showSuccess("14 Primary Muscles logged (Demo Mode)!");
      return;
    }
    setConfirmDialog({
      open: true,
      title: "Log 14 Primary Muscles?",
      description: "This will log all 14 Primary Muscles (bilateral) as 'Normotonic'. Continue?",
      onConfirm: executeQuickLog14,
    });
  };

  const executeClearAll = async () => {
    if (appointmentId === DEMO_ID) {
      setResults({});
      showSuccess("All muscle tests cleared (Demo Mode).");
      return;
    }
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

  const handleClearAll = () => {
    if (Object.keys(results).length === 0) return;
    setConfirmDialog({
      open: true,
      title: "Clear all muscle tests?",
      description: "This will remove ALL muscle test results for this session.",
      onConfirm: executeClearAll,
    });
  };

  const handleClearMuscle = (muscleName: string, side?: 'L' | 'R') => {
    const dbMuscleName = side ? `${muscleName} (${side})` : muscleName;
    const result = results[dbMuscleName];
    if (!result) return;

    const executeClear = async () => {
      setConfirmDialog(prev => ({ ...prev, open: false }));
      if (appointmentId === DEMO_ID) {
        setResults(prev => {
          const newResults = { ...prev };
          delete newResults[dbMuscleName];
          return newResults;
        });
        showSuccess(`${dbMuscleName} test cleared (Demo Mode).`);
        return;
      }
      setSaving(true);
      try {
        const { error } = await supabase.from("muscle_tests").delete().eq('id', result.id);
        if (error) throw error;
        setResults(prev => {
          const newResults = { ...prev };
          delete newResults[dbMuscleName];
          return newResults;
        });
        showSuccess(`${dbMuscleName} test cleared.`);
      } catch (error: any) {
        showError(`Failed to clear ${dbMuscleName} test.`);
      } finally {
        setSaving(false);
      }
    };

    setConfirmDialog({
      open: true,
      title: `Clear test for ${dbMuscleName}?`,
      description: `Remove the test result for ${dbMuscleName}.`,
      onConfirm: executeClear,
    });
  };

  const filteredGroups = useMemo(() => {
    const filtered: Record<string, string[]> = {};
    Object.entries(MUSCLE_GROUPS).forEach(([group, muscles]) => {
      const matchingMuscles = muscles.filter(m => {
        const matchesSearch = m.toLowerCase().includes(searchTerm.toLowerCase());
        
        const isTested = !!(results[m] || results[`${m} (L)`] || results[`${m} (R)`]);
        const isDysfunctional = (results[m]?.status && results[m].status !== 'Normotonic') || 
                                (results[`${m} (L)`]?.status && results[`${m} (L)`].status !== 'Normotonic') ||
                                (results[`${m} (R)`]?.status && results[`${m} (R)`].status !== 'Normotonic');

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
  const testedCount = useMemo(() => {
    const uniqueMuscles = new Set<string>();
    Object.keys(results).forEach(key => {
      const baseName = key.replace(/ \([LR]\)$/, '');
      uniqueMuscles.add(baseName);
    });
    return uniqueMuscles.size;
  }, [results]);

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-chart-primary" size={48} />
        <p className="text-muted-foreground font-semibold text-[10px] uppercase tracking-wider">Loading muscle log...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-primary rounded-xl text-primary-foreground shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-card/20 backdrop-blur-md rounded-xl flex items-center justify-center"><Sparkles size={24} /></div>
            <div>
              <h3 className="text-xl font-semibold">14 Muscle Balance</h3>
              <p className="text-primary-foreground/80 text-xs font-medium">Quick-log the standard TFH primary balance.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleQuickLog14} disabled={saving} className="bg-card text-chart-primary hover:bg-muted rounded-xl font-semibold text-xs uppercase tracking-wider h-12 px-8 shadow-sm">
              {saving ? <Loader2 className="mr-2 animate-spin" /> : <Zap size={18} className="mr-2 fill-current" />}
              Log 14 Primary
            </Button>
            {testedCount > 0 && (
              <Button variant="outline" onClick={handleClearAll} disabled={saving} className="bg-primary/50 border-primary/50 text-primary-foreground hover:bg-primary/80 rounded-xl h-12 px-4"><Trash2 size={18} /></Button>
            )}
          </div>
        </div>
        <MuscleProgressCard testedCount={testedCount} totalCount={totalMusclesCount} />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Filter size={14} className="text-chart-primary" /> Filters & Smart Suggestions
          </h3>
          {currentPeakMeridian && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setMeridianFilter(currentPeakMeridian.name)}
              className={cn(
                "rounded-xl h-9 px-4 font-semibold text-[10px] uppercase tracking-wider transition-all",
                meridianFilter === currentPeakMeridian.name ? "bg-primary text-primary-foreground border-none shadow-sm" : "border-border bg-card hover:bg-muted"
              )}
            >
              <Clock size={14} className="mr-2" /> Peak Now: {currentPeakMeridian.name}
            </Button>
          )}
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
      </div>

      <div className="space-y-6">
        {Object.entries(filteredGroups).map(([groupName, muscles]) => (
          <MuscleGroupCollapsible
            key={groupName} groupName={groupName} muscles={muscles} results={results}
            proficiencyCounts={proficiencyCounts}
            isOpen={openGroups[groupName]} onToggle={() => setOpenGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }))}
            onStatusChange={handleStatusChange} onClear={handleClearMuscle}
            onShowInfo={(m) => { setSelectedMuscleForInfo(m); setInfoModalOpen(true); }}
            onShowLogic={(m, s) => { setSelectedMuscleForLogic(m); setSelectedStatusForLogic(s); setLogicModalOpen(true); }}
            disabled={saving}
          />
        ))}

        {Object.keys(filteredGroups).length === 0 && (
          <div className="text-center py-20 bg-muted rounded-xl border-2 border-dashed border-border">
            <div className="mx-auto w-16 h-16 bg-card rounded-xl flex items-center justify-center mb-4 shadow-sm"><Filter className="text-muted-foreground" size={24} /></div>
            <p className="text-foreground font-semibold text-xl">No muscles match your filters</p>
            <Button variant="link" onClick={() => { setShowOnlyTested(false); setShowOnlyDysfunctional(false); setSearchTerm(""); setMeridianFilter("all"); }} className="mt-4 text-chart-primary font-medium">Reset All Filters</Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <MuscleStatusLegend />
        <MuscleTestAssistanceCard />
      </div>

      <MuscleInfoModal muscleName={selectedMuscleForInfo} open={infoModalOpen} onOpenChange={setInfoModalOpen} />
      <ClinicalReasoningModal 
        muscleName={selectedMuscleForLogic} 
        status={selectedStatusForLogic} 
        open={logicModalOpen} 
        onOpenChange={setLogicModalOpen} 
      />

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={confirmDialog.title.startsWith("Clear") ? "Clear" : "Log"}
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  );
};

export default MuscleTestingTab;