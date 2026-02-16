"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertTriangle, Info, RotateCcw, Save, Dumbbell, Zap, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { MUSCLE_GROUPS, MUSCLE_STATUSES, MUSCLE_TEST_ASSISTANCE, MuscleStatus } from "@/data/muscle-data";
import { MuscleTestResult } from "@/types/crm";
import { Alert, AlertDescription } from "@/components/ui/alert";

const PRIMARY_14_MUSCLES = [
  'Supraspinatus', 'Teres Major', 'Pectoralis Major (Clavicular)', 'Latissimus Dorsi', 
  'Subscapularis', 'Quadriceps Group', 'Peroneus', 'Psoas', 'Gluteus Medius', 
  'Teres Minor', 'Anterior Deltoid', 'Pectoralis Major (Sternal)', 'Serratus Anterior', 'Middle Trapezius'
];

interface MuscleTestingTabProps {
  appointmentId: string;
}

const MuscleTestingTab = ({ appointmentId }: MuscleTestingTabProps) => {
  const [results, setResults] = useState<Record<string, MuscleTestResult>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      console.error("Error fetching muscle tests:", error);
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
      
      setResults(prev => ({
        ...prev,
        [muscleName]: newResult
      }));

      showSuccess(`${muscleName} status updated to ${status}`);
    } catch (error: any) {
      showError(error.message || `Failed to update ${muscleName} status.`);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickLog14 = async () => {
    if (!confirm("This will log all 14 Primary Muscles as 'Normotonic'. Existing results for these muscles will be updated. Continue?")) return;
    
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

      // We use upsert logic here by deleting existing ones first for simplicity in this context
      await supabase.from('muscle_tests').delete().eq('appointment_id', appointmentId).in('muscle_name', PRIMARY_14_MUSCLES);
      
      const { data, error } = await supabase.from('muscle_tests').insert(inserts).select();
      if (error) throw error;

      const newResults = { ...results };
      (data || []).forEach(r => {
        newResults[r.muscle_name] = r as MuscleTestResult;
      });
      setResults(newResults);
      
      showSuccess("14 Primary Muscles logged as Normotonic!");
    } catch (err: any) {
      showError(err.message || "Failed to quick-log muscles.");
    } finally {
      setSaving(false);
    }
  };

  const handleClearMuscle = async (muscleName: string) => {
    const result = results[muscleName];
    if (!result) return;

    if (!confirm(`Are you sure you want to clear the test result for ${muscleName}?`)) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("muscle_tests")
        .delete()
        .eq('id', result.id);

      if (error) throw error;

      setResults(prev => {
        const newResults = { ...prev };
        delete newResults[muscleName];
        return newResults;
      });
      showSuccess(`${muscleName} test cleared.`);
    } catch (error: any) {
      showError(error.message || `Failed to clear ${muscleName} test.`);
    } finally {
      setSaving(false);
    }
  };

  const getStatusDetails = (statusValue: MuscleStatus['value']) => {
    return MUSCLE_STATUSES.find(s => s.value === statusValue);
  };

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-indigo-600 rounded-[2rem] text-white shadow-xl shadow-indigo-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
            <Sparkles size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black">14 Muscle Balance</h3>
            <p className="text-indigo-100 text-xs font-medium">Quick-log the standard Touch for Health primary balance.</p>
          </div>
        </div>
        <Button 
          onClick={handleQuickLog14}
          disabled={saving}
          className="bg-white text-indigo-600 hover:bg-indigo-50 rounded-xl font-black text-xs uppercase tracking-widest h-12 px-8 shadow-lg"
        >
          {saving ? <Loader2 className="mr-2 animate-spin" /> : <Zap size={18} className="mr-2 fill-current" />}
          Log 14 Primary Muscles
        </Button>
      </div>

      <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
          <CardTitle className="text-xl font-black">Muscle Status Legend</CardTitle>
          <CardDescription className="font-medium">Click a status to log the result for a muscle.</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {MUSCLE_STATUSES.map(status => {
              const Icon = status.icon;
              return (
                <div key={status.value} className={cn("p-4 rounded-2xl border-2 transition-all", status.color)}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={18} className={status.color.split(' ')[0]} />
                    <span className="font-black text-xs text-slate-900 uppercase tracking-wider">{status.label}</span>
                  </div>
                  <p className="text-[10px] text-slate-700 font-medium leading-relaxed">{status.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {Object.entries(MUSCLE_GROUPS).map(([groupName, muscles]) => (
        <Card key={groupName} className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="bg-slate-900 text-white p-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Dumbbell size={20} />
              </div>
              <CardTitle className="text-2xl font-black">{groupName}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {muscles.map(muscle => {
              const currentResult = results[muscle];
              const statusDetails = currentResult ? getStatusDetails(currentResult.status) : null;
              const Icon = statusDetails?.icon || CheckCircle2;

              return (
                <div key={muscle} className="p-6 border border-slate-100 rounded-[2rem] space-y-5 hover:border-indigo-100 hover:shadow-lg transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-lg text-slate-800">{muscle}</h4>
                    {currentResult && (
                      <div className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm", statusDetails?.color)}>
                        <Icon size={14} />
                        {statusDetails?.label}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {MUSCLE_STATUSES.map(status => {
                      const isSelected = currentResult?.status === status.value;
                      const StatusIcon = status.icon;
                      
                      return (
                        <Button
                          key={status.value}
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleStatusChange(muscle, status.value)}
                          className={cn(
                            "h-9 text-[10px] font-black uppercase tracking-widest transition-all duration-300 rounded-xl",
                            isSelected 
                              ? "bg-slate-900 text-white hover:bg-slate-800 shadow-lg"
                              : "border-slate-200 bg-white hover:bg-slate-50 text-slate-500"
                          )}
                          disabled={saving}
                        >
                          <StatusIcon size={14} className="mr-2" />
                          {status.label.split(' ')[0]}
                        </Button>
                      );
                    })}
                    {currentResult && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleClearMuscle(muscle)}
                        className="h-9 w-9 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        disabled={saving}
                      >
                        <RotateCcw size={16} />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      <Card className="border-none shadow-xl rounded-[2.5rem] bg-indigo-900 text-white overflow-hidden">
        <CardHeader className="p-8 pb-4">
          <CardTitle className="text-2xl font-black flex items-center gap-3">
            <AlertTriangle size={28} className="text-amber-400" />
            {MUSCLE_TEST_ASSISTANCE.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 pt-0 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MUSCLE_TEST_ASSISTANCE.steps.map((step, index) => (
              <div key={index} className="p-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
                <h4 className="font-black text-sm text-indigo-300 mb-2 uppercase tracking-wider">{step.title}</h4>
                <p className="text-sm text-slate-300 font-medium leading-relaxed">{step.details}</p>
              </div>
            ))}
          </div>
          
          <div className="bg-white/10 p-6 rounded-3xl border border-white/10">
            <h4 className="font-black text-lg mb-4 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-emerald-400" />
              Muscle Testing Process:
            </h4>
            <ol className="space-y-3 text-sm text-slate-200 font-medium">
              {MUSCLE_TEST_ASSISTANCE.process.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-black shrink-0">{index + 1}</span>
                  {item}
                </li>
              ))}
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MuscleTestingTab;