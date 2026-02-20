"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertTriangle, Info, RotateCcw, Save, Dumbbell, Zap, Sparkles, Search, ChevronDown, ChevronUp, Filter, Eye, EyeOff, Layers, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { MUSCLE_GROUPS, MUSCLE_STATUSES, MUSCLE_TEST_ASSISTANCE, MuscleStatus } from "@/data/muscle-data";
import { MuscleTestResult } from "@/types/crm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import MuscleInfoModal from "./MuscleInfoModal";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TCM_CHANNELS, getChannelByMuscle } from "@/data/tcm-channel-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [meridianFilter, setMeridianFilter] = useState<string>("all");
  const [showOnlyTested, setShowOnlyTested] = useState(false);
  const [showOnlyDysfunctional, setShowOnlyDysfunctional] = useState(false);
  const [selectedMuscleForInfo, setSelectedMuscleForInfo] = useState<string | null>(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    Object.keys(MUSCLE_GROUPS).forEach(group => {
      initial[group] = true; // Default all open
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

  const handleClearAll = async () => {
    if (Object.keys(results).length === 0) return;
    if (!confirm("Are you sure you want to clear ALL muscle test results for this session? This cannot be undone.")) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("muscle_tests")
        .delete()
        .eq('appointment_id', appointmentId);

      if (error) throw error;

      setResults({});
      showSuccess("All muscle tests cleared for this session.");
    } catch (error: any) {
      showError(error.message || "Failed to clear muscle tests.");
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

  const handleShowInfo = (muscleName: string) => {
    setSelectedMuscleForInfo(muscleName);
    setInfoModalOpen(true);
  };

  const getStatusDetails = (statusValue: MuscleStatus['value']) => {
    return MUSCLE_STATUSES.find(s => s.value === statusValue);
  };

  const toggleGroup = (group: string) => {
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const filteredGroups = useMemo(() => {
    const filtered: Record<string, string[]> = {};
    
    Object.entries(MUSCLE_GROUPS).forEach(([group, muscles]) => {
      const matchingMuscles = muscles.filter(m => {
        const matchesSearch = m.toLowerCase().includes(searchTerm.toLowerCase());
        const isTested = !!results[m];
        const isDysfunctional = isTested && results[m].status !== 'Normotonic';
        
        // Meridian Filter Logic
        let matchesMeridian = true;
        if (meridianFilter !== "all") {
          const channel = getChannelByMuscle(m);
          matchesMeridian = channel?.name === meridianFilter || channel?.code === meridianFilter;
        }
        
        if (!matchesSearch) return false;
        if (!matchesMeridian) return false;
        if (showOnlyDysfunctional && !isDysfunctional) return false;
        if (showOnlyTested && !isTested) return false;
        
        return true;
      });

      if (matchingMuscles.length > 0) {
        filtered[group] = matchingMuscles;
      }
    });
    return filtered;
  }, [searchTerm, meridianFilter, showOnlyTested, showOnlyDysfunctional, results]);

  const totalMusclesCount = useMemo(() => {
    return Object.values(MUSCLE_GROUPS).reduce((acc, curr) => acc + curr.length, 0);
  }, []);

  const testedCount = Object.keys(results).length;
  const progressPercent = (testedCount / totalMusclesCount) * 100;

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
      {/* Header & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-indigo-600 rounded-[2rem] text-white shadow-xl shadow-indigo-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black">14 Muscle Balance</h3>
              <p className="text-indigo-100 text-xs font-medium">Quick-log the standard TFH primary balance.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleQuickLog14}
              disabled={saving}
              className="bg-white text-indigo-600 hover:bg-indigo-50 rounded-xl font-black text-xs uppercase tracking-widest h-12 px-8 shadow-lg"
            >
              {saving ? <Loader2 className="mr-2 animate-spin" /> : <Zap size={18} className="mr-2 fill-current" />}
              Log 14 Primary
            </Button>
            {testedCount > 0 && (
              <Button 
                variant="outline"
                onClick={handleClearAll}
                disabled={saving}
                className="bg-indigo-700/50 border-indigo-400 text-white hover:bg-indigo-700 rounded-xl h-12 px-4"
              >
                <Trash2 size={18} />
              </Button>
            )}
          </div>
        </div>

        <Card className="border-none shadow-lg rounded-[2rem] bg-white overflow-hidden">
          <CardContent className="p-6 flex flex-col justify-center h-full space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Session Progress</p>
              <p className="text-sm font-black text-indigo-600">{testedCount} / {totalMusclesCount}</p>
            </div>
            <Progress value={progressPercent} className="h-2 bg-slate-100 [&>div]:bg-indigo-600" />
            <p className="text-[10px] text-slate-500 font-medium text-center">Muscles tested in this session</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Search muscles (e.g. Psoas, Deltoid)..." 
              className="pl-12 bg-white border-slate-200 h-12 rounded-2xl shadow-sm font-medium focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="w-full md:w-64">
            <Select value={meridianFilter} onValueChange={setMeridianFilter}>
              <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white font-bold text-slate-600">
                <div className="flex items-center gap-2">
                  <Layers size={16} className="text-indigo-500" />
                  <SelectValue placeholder="Filter by Meridian" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                <SelectItem value="all" className="rounded-xl">All Meridians</SelectItem>
                {TCM_CHANNELS.map(channel => (
                  <SelectItem key={channel.id} value={channel.name} className="rounded-xl">
                    {channel.name} ({channel.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <Button 
              variant="outline" 
              className="flex-1 md:flex-none rounded-xl h-12 px-6 border-slate-200 font-bold text-slate-600"
              onClick={() => {
                const allOpen = Object.values(openGroups).every(v => v);
                const newState: Record<string, boolean> = {};
                Object.keys(MUSCLE_GROUPS).forEach(k => newState[k] = !allOpen);
                setOpenGroups(newState);
              }}
            >
              {Object.values(openGroups).every(v => v) ? "Collapse All" : "Expand All"}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center space-x-2">
            <Switch 
              id="show-tested" 
              checked={showOnlyTested} 
              onCheckedChange={setShowOnlyTested} 
              className="data-[state=checked]:bg-indigo-600"
            />
            <Label htmlFor="show-tested" className="text-xs font-bold text-slate-600 cursor-pointer flex items-center gap-1.5">
              <Eye size={14} className="text-indigo-500" /> Show Only Tested
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch 
              id="show-dysfunctional" 
              checked={showOnlyDysfunctional} 
              onCheckedChange={setShowOnlyDysfunctional} 
              className="data-[state=checked]:bg-rose-600"
            />
            <Label htmlFor="show-dysfunctional" className="text-xs font-bold text-slate-600 cursor-pointer flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-rose-500" /> Show Only Dysfunctional
            </Label>
          </div>
          {(showOnlyTested || showOnlyDysfunctional || searchTerm || meridianFilter !== "all") && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setShowOnlyTested(false);
                setShowOnlyDysfunctional(false);
                setSearchTerm("");
                setMeridianFilter("all");
              }}
              className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 h-7 px-3 rounded-lg"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Muscle Groups */}
      <div className="space-y-6">
        {Object.entries(filteredGroups).map(([groupName, muscles]) => (
          <Collapsible 
            key={groupName} 
            open={openGroups[groupName]} 
            onOpenChange={() => toggleGroup(groupName)}
            className="w-full"
          >
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
              <CollapsibleTrigger asChild>
                <CardHeader className="bg-slate-900 text-white p-6 cursor-pointer hover:bg-slate-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                        <Dumbbell size={20} />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-black">{groupName}</CardTitle>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                          {muscles.length} Muscles • {muscles.filter(m => results[m]).length} Tested
                        </p>
                      </div>
                    </div>
                    {openGroups[groupName] ? <ChevronUp size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {muscles.map(muscle => {
                    const currentResult = results[muscle];
                    const statusDetails = currentResult ? getStatusDetails(currentResult.status) : null;
                    const Icon = statusDetails?.icon || CheckCircle2;
                    const isTested = !!currentResult;
                    const channel = getChannelByMuscle(muscle);

                    return (
                      <div 
                        key={muscle} 
                        className={cn(
                          "p-6 border rounded-[2rem] space-y-5 transition-all duration-300 group relative",
                          isTested 
                            ? "bg-indigo-50/30 border-indigo-100 shadow-sm" 
                            : "bg-white border-slate-100 hover:border-indigo-100 hover:shadow-lg"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-lg text-slate-800">{muscle}</h4>
                            {isTested && (
                              <Badge className="bg-indigo-600 text-white border-none text-[8px] font-black uppercase tracking-widest h-4 px-1.5">
                                Tested
                              </Badge>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 rounded-full text-slate-300 hover:text-indigo-600 hover:bg-indigo-50"
                              onClick={() => handleShowInfo(muscle)}
                            >
                              <Info size={14} />
                            </Button>
                          </div>
                          {currentResult && (
                            <div className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm", statusDetails?.color)}>
                              <Icon size={14} />
                              {statusDetails?.label}
                            </div>
                          )}
                        </div>

                        {channel && (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={cn("text-[8px] font-black uppercase tracking-widest border-none px-2 py-0.5", channel.color)}>
                              {channel.name} ({channel.code})
                            </Badge>
                          </div>
                        )}
                        
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
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}

        {Object.keys(filteredGroups).length === 0 && (
          <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <div className="mx-auto w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm">
              <Filter className="text-slate-300" size={24} />
            </div>
            <p className="text-slate-900 font-black text-lg">No muscles match your filters</p>
            <p className="text-slate-500 mt-1">Try clearing your search or toggling the filters.</p>
            <Button 
              variant="link" 
              onClick={() => {
                setShowOnlyTested(false);
                setShowOnlyDysfunctional(false);
                setSearchTerm("");
                setMeridianFilter("all");
              }}
              className="mt-4 text-indigo-600 font-bold"
            >
              Reset All Filters
            </Button>
          </div>
        )}
      </div>

      {/* Legend & Assistance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
            <CardTitle className="text-xl font-black">Muscle Status Legend</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        <Card className="border-none shadow-xl rounded-[2.5rem] bg-indigo-900 text-white overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-2xl font-black flex items-center gap-3">
              <AlertTriangle size={28} className="text-amber-400" />
              {MUSCLE_TEST_ASSISTANCE.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-6">
            <div className="grid grid-cols-1 gap-3">
              {MUSCLE_TEST_ASSISTANCE.steps.map((step, index) => (
                <div key={index} className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
                  <h4 className="font-black text-xs text-indigo-300 mb-1 uppercase tracking-wider">{step.title}</h4>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">{step.details}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <MuscleInfoModal 
        muscleName={selectedMuscleForInfo}
        open={infoModalOpen}
        onOpenChange={setInfoModalOpen}
      />
    </div>
  );
};

export default MuscleTestingTab;