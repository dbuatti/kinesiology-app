
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { 
  Layers, 
  Sparkles, 
  Loader2, 
  Wand2, 
  RefreshCw, 
  Info, 
  Check, 
  X,
  ArrowRight,
  Target,
  ShieldAlert,
  Fingerprint,
  History,
  LayoutGrid,
  CheckCircle2,
  ChevronRight,
  Plus,
  Crown,
  ShieldCheck,
  Zap,
  AlertCircle,
  Merge,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { showSuccess, showError } from "@/utils/toast";
import FractalNode from './FractalNode';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatDistanceToNow } from 'date-fns';

const SUGGESTIONS_CACHE_KEY = "antigravity_fractal_suggestions_cache";

const FractalTool = () => {
  const navigate = useNavigate();
  const [backlog, setBacklog] = useState<any[]>([]);
  const [sessionCounts, setSessionCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  
  // Suggestions State
  const [proposedRelationships, setProposedRelationships] = useState<any[]>([]);
  const [proposedMerges, setProposedMerges] = useState<any[]>([]);
  const [proposedPrimary, setProposedPrimary] = useState<any>(null);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: backlogData, error: backlogError } = await supabase
        .from('identity_backlog')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (backlogError) throw backlogError;

      const [shiftingRes, alignmentRes, beliefsRes] = await Promise.all([
        supabase.from('identity_shifting_sessions').select('backlog_id, is_complete'),
        supabase.from('identity_alignment_sessions').select('backlog_id, is_complete'),
        supabase.from('limiting_belief_sessions').select('backlog_id, is_complete')
      ]);

      const allSessions = [
        ...(shiftingRes.data || []),
        ...(alignmentRes.data || []),
        ...(beliefsRes.data || [])
      ];

      const counts: Record<string, number> = {};
      allSessions.forEach(s => {
        if (s.backlog_id) counts[s.backlog_id] = (counts[s.backlog_id] || 0) + 1;
      });

      setBacklog(backlogData || []);
      setSessionCounts(counts);

      const cached = localStorage.getItem(SUGGESTIONS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        setProposedRelationships(parsed.suggestions || []);
        setProposedMerges(parsed.merges || []);
        setProposedPrimary(parsed.primary_primary || null);
        setLastScanned(parsed.last_scanned || null);
      }

    } catch (err) {
      console.error("Error fetching backlog:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleScan = async () => {
    setIsScanning(true);
    setScanError(null);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-fractals');
      
      if (error) throw error;
      
      setProposedRelationships(data.suggestions || []);
      setProposedMerges(data.merges || []);
      setProposedPrimary(data.primary_primary || null);
      setLastScanned(data.last_scanned || new Date().toISOString());
      
      localStorage.setItem(SUGGESTIONS_CACHE_KEY, JSON.stringify(data));
      showSuccess("AI analysis complete. Review the suggestions below.");
    } catch (err: any) {
      console.error("[FractalTool] Scan Error:", err);
      setScanError(err.message || "An unexpected error occurred during the scan.");
      showError(err.message || "Scan failed.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleAcceptRelationship = async (rel: any) => {
    try {
      const { error } = await supabase
        .from('identity_backlog')
        .update({ parent_id: rel.parent_id })
        .eq('id', rel.child_id);

      if (error) throw error;
      
      const newRels = proposedRelationships.filter(r => r.child_id !== rel.child_id);
      setProposedRelationships(newRels);
      updateCache(newRels, proposedMerges, proposedPrimary);
      fetchData();
    } catch (err) {
      showError("Failed to update relationship.");
    }
  };

  const handleAcceptMerge = async (merge: any) => {
    try {
      const [keepId, ...removeIds] = merge.ids;
      
      await supabase
        .from('identity_backlog')
        .update({ content: merge.suggested_content })
        .eq('id', keepId);

      await supabase
        .from('identity_backlog')
        .update({ parent_id: keepId })
        .in('parent_id', removeIds);

      await supabase
        .from('identity_backlog')
        .delete()
        .in('id', removeIds);

      const newMerges = proposedMerges.filter(m => m.ids[0] !== keepId);
      setProposedMerges(newMerges);
      updateCache(proposedRelationships, newMerges, proposedPrimary);
      fetchData();
      showSuccess("Identities merged successfully.");
    } catch (err) {
      showError("Failed to merge identities.");
    }
  };

  const handleAcceptAll = async (parentId: string, rels: any[]) => {
    try {
      const promises = rels.map(rel => 
        supabase
          .from('identity_backlog')
          .update({ parent_id: rel.parent_id })
          .eq('id', rel.child_id)
      );

      await Promise.all(promises);

      const newRels = proposedRelationships.filter(r => r.parent_id !== parentId);
      setProposedRelationships(newRels);
      updateCache(newRels, proposedMerges, proposedPrimary);
      fetchData();
      showSuccess(`Accepted ${rels.length} relationships.`);
    } catch (err) {
      showError("Failed to update relationships.");
    }
  };

  const handleAcceptPrimary = async () => {
    if (!proposedPrimary) return;
    try {
      await supabase.from('identity_backlog').update({ is_primary_primary: false }).eq('is_primary_primary', true);
      
      const { error } = await supabase
        .from('identity_backlog')
        .update({ is_primary_primary: true })
        .eq('id', proposedPrimary.id);

      if (error) throw error;
      
      setProposedPrimary(null);
      updateCache(proposedRelationships, proposedMerges, null);
      fetchData();
      showSuccess("Primary Primary pattern established.");
    } catch (err) {
      showError("Failed to set primary.");
    }
  };

  const updateCache = (rels: any[], merges: any[], primary: any) => {
    localStorage.setItem(SUGGESTIONS_CACHE_KEY, JSON.stringify({
      suggestions: rels,
      merges: merges,
      primary_primary: primary,
      last_scanned: lastScanned
    }));
  };

  const clearSuggestions = () => {
    setProposedRelationships([]);
    setProposedMerges([]);
    setProposedPrimary(null);
    localStorage.removeItem(SUGGESTIONS_CACHE_KEY);
  };

  const handleUpdateRating = async (id: string, rating: number) => {
    try {
      const { error } = await supabase
        .from('identity_backlog')
        .update({ muscle_test_stars: rating })
        .eq('id', id);

      if (error) throw error;
      setBacklog(prev => prev.map(item => item.id === id ? { ...item, muscle_test_stars: rating } : item));
    } catch (err) {
      showError("Failed to update rating.");
    }
  };

  const handleMove = async (id: string, parentId: string | null) => {
    try {
      const { error } = await supabase
        .from('identity_backlog')
        .update({ parent_id: parentId })
        .eq('id', id);

      if (error) throw error;
      showSuccess("Hierarchy updated.");
      fetchData();
    } catch (err) {
      showError("Failed to move item.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    try {
      const { error } = await supabase.from('identity_backlog').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      showError("Failed to delete.");
    }
  };

  const handleProcess = (item: any) => {
    const path = item.type === 'alignment' ? '/sandbox/identity-alignment' : 
                 item.type === 'belief' ? '/sandbox/limiting-beliefs' : 
                 '/sandbox/identity-shifting';
    navigate(path, { state: { prefill: item.content, backlogId: item.id } });
  };

  const hierarchicalData = useMemo(() => {
    const itemMap: Record<string, any> = {};
    backlog.forEach(item => {
      itemMap[item.id] = { ...item, children: [] };
    });

    const roots: any[] = [];
    Object.values(itemMap).forEach(item => {
      if (item.parent_id && itemMap[item.parent_id]) {
        itemMap[item.parent_id].children.push(item);
      } else {
        roots.push(item);
      }
    });

    return roots.sort((a, b) => {
        if (a.is_primary_primary) return -1;
        if (b.is_primary_primary) return 1;
        return (b.priority_score || 0) - (a.priority_score || 0);
    });
  }, [backlog]);

  const groupedSuggestions = useMemo(() => {
    const groups: Record<string, any[]> = {};
    proposedRelationships.forEach(rel => {
      if (!groups[rel.parent_id]) groups[rel.parent_id] = [];
      groups[rel.parent_id].push(rel);
    });
    return groups;
  }, [proposedRelationships]);

  const renderTree = (nodes: any[], level = 0) => {
    return nodes.map(node => (
      <FractalNode 
        key={node.id} 
        item={node} 
        level={level}
        onUpdateRating={handleUpdateRating}
        onDelete={handleDelete}
        onMove={handleMove}
        onProcess={handleProcess}
        allPossibleParents={backlog}
        sessionCount={sessionCounts[node.id] || 0}
      >
        {node.children.length > 0 && renderTree(node.children, level + 1)}
      </FractalNode>
    ));
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="animate-spin text-indigo-600" size={48} />
    </div>
  );

  const proposedPrimaryContent = proposedPrimary ? backlog.find(b => b.id === proposedPrimary.id)?.content : null;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {scanError && (
        <Alert variant="destructive" className="bg-rose-50 border-rose-200 rounded-2xl animate-in slide-in-from-top-2">
          <AlertCircle className="h-5 w-5 text-rose-600" />
          <AlertDescription className="text-sm text-rose-900 font-bold flex items-center justify-between">
            {scanError}
            <Button variant="outline" size="sm" onClick={handleScan} className="h-8 border-rose-200 text-rose-600 hover:bg-rose-100">
              Retry Scan
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {proposedPrimary && proposedPrimaryContent && (
        <Card className="border-none shadow-2xl bg-slate-900 text-white rounded-[3rem] overflow-hidden animate-in slide-in-from-top-4 duration-500">
          <CardContent className="p-10 flex flex-col md:flex-row items-center gap-10 relative">
            <div className="absolute top-0 right-0 p-8 opacity-10"><Crown size={150} /></div>
            <div className="w-24 h-24 rounded-[2rem] bg-amber-500 flex items-center justify-center shrink-0 shadow-2xl shadow-amber-500/40 relative z-10">
              <Crown size={48} className="text-white" />
            </div>
            <div className="space-y-4 relative z-10 flex-1">
              <Badge className="bg-amber-400 text-slate-900 border-none font-black text-[10px] uppercase tracking-[0.3em] px-4 py-1">AI Root Discovery</Badge>
              <h3 className="text-3xl font-black tracking-tight">Proposed Primary Primary</h3>
              <p className="text-xl font-serif italic text-amber-100">
                "{proposedPrimaryContent}"
              </p>
              <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
                {proposedPrimary.reasoning}
              </p>
              <div className="flex gap-3 pt-2">
                <Button onClick={handleAcceptPrimary} className="bg-white text-slate-900 hover:bg-amber-50 h-12 px-8 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg">
                  Establish as Root
                </Button>
                <Button variant="ghost" onClick={() => { setProposedPrimary(null); updateCache(proposedRelationships, proposedMerges, null); }} className="text-slate-400 hover:text-white">
                  Dismiss
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {proposedMerges.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <Merge size={20} className="text-rose-500" />
            <h3 className="text-xl font-black text-slate-900">Merge Suggestions</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {proposedMerges.map((merge, idx) => (
              <Card key={idx} className="border-none shadow-md bg-rose-50/50 border-2 border-rose-100 rounded-[2rem] overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest">Duplicate Cluster</p>
                      <h4 className="text-lg font-black text-rose-900">"{merge.suggested_content}"</h4>
                    </div>
                    <Button 
                      onClick={() => handleAcceptMerge(merge)}
                      className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-9 px-4 font-black text-[10px] uppercase tracking-widest shadow-lg"
                    >
                      Merge Items
                    </Button>
                  </div>
                  <div className="p-3 bg-white/60 rounded-xl border border-rose-100">
                    <p className="text-[10px] text-rose-700 font-medium italic">"{merge.reasoning}"</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {proposedRelationships.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <Sparkles size={20} className="text-amber-500" />
              <h3 className="text-xl font-black text-slate-900">Proposed Fractal Groups</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={clearSuggestions} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-600">
              Clear All Suggestions
            </Button>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {Object.entries(groupedSuggestions).map(([parentId, rels]) => {
              const parent = backlog.find(b => b.id === parentId);
              if (!parent) return null;

              return (
                <Card key={parentId} className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden border-2 border-indigo-100">
                  <CardHeader className="bg-indigo-600 p-8 text-white">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
                          <Layers size={24} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200">Parent Pattern</p>
                          <h4 className="text-2xl font-black tracking-tight">"{parent.content}"</h4>
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleAcceptAll(parentId, rels)}
                        className="bg-white text-indigo-600 hover:bg-indigo-50 h-12 px-8 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg"
                      >
                        <CheckCircle2 size={18} className="mr-2" /> Accept All ({rels.length})
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {rels.map((rel, idx) => {
                        const child = backlog.find(b => b.id === rel.child_id);
                        if (!child) return null;

                        return (
                          <div key={idx} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-indigo-200 transition-all">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-white border-indigo-100 text-indigo-600 text-[8px] font-black uppercase px-2 py-0.5">Child</Badge>
                                <p className="text-sm font-bold text-slate-900">"{child.content}"</p>
                              </div>
                              <button 
                                onClick={() => {
                                    const newRels = proposedRelationships.filter(r => r.child_id !== rel.child_id);
                                    setProposedRelationships(newRels);
                                    updateCache(newRels, proposedMerges, proposedPrimary);
                                }}
                                className="h-8 w-8 rounded-lg text-slate-300 hover:text-rose-600 flex items-center justify-center transition-colors"
                              >
                                <X size={16} />
                              </button>
                            </div>
                            <p className="text-xs text-slate-500 font-medium italic leading-relaxed pl-1 border-l-2 border-indigo-200">
                              {rel.reasoning}
                            </p>
                            <div className="mt-4 flex justify-end">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleAcceptRelationship(rel)}
                                className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50"
                              >
                                Accept Single <ChevronRight size={14} className="ml-1" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <Layers size={24} className="text-indigo-600" /> Fractal Hierarchy
          </h2>
          <p className="text-sm text-slate-500 font-medium">Organize specific patterns under overarching motivators.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Button 
            onClick={handleScan} 
            disabled={isScanning || backlog.length < 2}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 px-8 font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100"
          >
            {isScanning ? <Loader2 className="mr-2 animate-spin" /> : <Wand2 size={18} className="mr-2" />}
            Scan for Fractals
          </Button>
          {lastScanned && (
            <div className="flex items-center gap-1.5 text-[8px] font-black text-slate-400 uppercase tracking-widest">
              <Clock size={10} /> Last Analyzed {formatDistanceToNow(new Date(lastScanned), { addSuffix: true })}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {backlog.length > 0 ? (
          <div className="space-y-2">
            {renderTree(hierarchicalData)}
          </div>
        ) : (
          <div className="text-center py-32 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Layers className="text-slate-300" size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-900">No active identities</h3>
            <p className="text-slate-500 mt-2">Add items to your backlog from the Sandbox or Journal to begin fractal analysis.</p>
          </div>
        )}
      </div>

      <div className="p-8 bg-slate-900 text-white rounded-[3rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10"><Sparkles size={150} /></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <div className="w-24 h-24 rounded-[2rem] bg-indigo-600 flex items-center justify-center shrink-0 shadow-2xl shadow-indigo-500/40">
            <Info size={48} className="text-white" />
          </div>
          <div className="space-y-4">
            <h4 className="text-2xl font-black">The Fractal Principle</h4>
            <p className="text-indigo-200 font-medium text-lg leading-relaxed">
              "The nervous system works in fractal patterns. A single overarching identity often 'runs' dozens of smaller beliefs. By identifying and shifting the parent pattern, you create a cascade of resolution across the entire system."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FractalTool;