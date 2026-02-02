"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertTriangle, Info, RotateCcw, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { MUSCLE_GROUPS, MUSCLE_STATUSES, MUSCLE_TEST_ASSISTANCE, MuscleStatus } from "@/data/muscle-data";
import { MuscleTestResult } from "@/types/crm";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MuscleTestingTabProps {
  appointmentId: string;
  // Removed onUpdate: () => void;
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
        // Update existing record
        const { error } = await supabase
          .from('muscle_tests')
          .update(payload)
          .eq('id', existingResult.id);
        if (error) throw error;
        newResult = { ...existingResult, ...payload };
      } else {
        // Insert new record
        const { data, error } = await supabase
          .from('muscle_tests')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        newResult = data as MuscleTestResult;
      }
      
      // Optimistically update local state
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

  const handleClearMuscle = async (muscleName: string) => {
    const result = results[muscleName];
    if (!result) return;

    if (!confirm(`Are you sure you want to clear the test result for ${muscleName}?`)) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('muscle_tests')
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
      <div className="p-8 flex justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Alert className="bg-indigo-50 border-indigo-200">
        <Info className="h-4 w-4 text-indigo-600" />
        <AlertDescription className="text-sm text-indigo-900">
          <strong>Muscle Testing Protocol:</strong> Log the status of each muscle tested during the session. Changes are saved automatically.
        </AlertDescription>
      </Alert>

      {/* Muscle Status Legend */}
      <Card className="border-none shadow-sm rounded-2xl bg-white">
        <CardHeader>
          <CardTitle className="text-lg">Muscle Status Legend</CardTitle>
          <CardDescription>Click a status to log the result for a muscle.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {MUSCLE_STATUSES.map(status => {
              const Icon = status.icon;
              return (
                <div key={status.value} className={cn("p-3 rounded-xl border-2", status.color)}>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={16} className={status.color.split(' ')[0]} />
                    <span className="font-bold text-sm text-slate-900">{status.label}</span>
                  </div>
                  <p className="text-xs text-slate-700">{status.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Muscle Groups */}
      {Object.entries(MUSCLE_GROUPS).map(([groupName, muscles]) => (
        <Card key={groupName} className="border-none shadow-lg rounded-2xl bg-white">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 rounded-t-2xl">
            <CardTitle className="text-xl font-bold text-slate-900">{groupName}</CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {muscles.map(muscle => {
              const currentResult = results[muscle];
              const statusDetails = currentResult ? getStatusDetails(currentResult.status) : null;
              const Icon = statusDetails?.icon || CheckCircle2;

              return (
                <div key={muscle} className="p-4 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-800">{muscle}</h4>
                    {currentResult && (
                      <div className={cn("px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1", statusDetails?.color)}>
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
                            "h-8 text-xs font-semibold transition-all",
                            isSelected 
                              ? statusDetails?.color.replace(/bg-\w+-\d+/g, 'bg-slate-900').replace(/text-\w+-\d+/g, 'text-white') + " hover:bg-slate-800"
                              : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                          )}
                          disabled={saving}
                        >
                          <StatusIcon size={14} className="mr-1" />
                          {status.label.split(' ')[0]}
                        </Button>
                      );
                    })}
                    {currentResult && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleClearMuscle(muscle)}
                        className="h-8 w-8 text-red-500 hover:bg-red-50"
                        disabled={saving}
                      >
                        <RotateCcw size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {/* Assistance Section */}
      <Card className="border-2 border-indigo-200 shadow-none rounded-2xl bg-indigo-50">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-indigo-900 flex items-center gap-2">
            <AlertTriangle size={20} className="text-indigo-600" />
            {MUSCLE_TEST_ASSISTANCE.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {MUSCLE_TEST_ASSISTANCE.steps.map((step, index) => (
              <div key={index} className="p-4 bg-white rounded-xl border border-indigo-100 shadow-sm">
                <h4 className="font-bold text-slate-900 mb-1">{step.title}</h4>
                <p className="text-sm text-slate-700">{step.details}</p>
              </div>
            ))}
          </div>
          
          <div className="bg-indigo-100 p-4 rounded-xl border border-indigo-200">
            <h4 className="font-bold text-indigo-900 mb-2">Muscle Testing Process:</h4>
            <ol className="space-y-1 text-sm text-indigo-800 list-decimal list-inside">
              {MUSCLE_TEST_ASSISTANCE.process.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MuscleTestingTab;