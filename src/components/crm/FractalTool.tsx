"use client";

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
  Plus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { showSuccess, showError } from "@/utils/toast";
import FractalNode from './FractalNode';
import { useNavigate } from 'react-router-dom';

const FractalTool = () => {
  const navigate = useNavigate();
  const [backlog, setBacklog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [proposedRelationships, setProposedRelationships] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('identity_backlog')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;
      setBacklog(data || []);
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
    try {
      const { data, error } = await supabase.functions.invoke('analyze-fractals');
      if (error) throw error;
      
      if (data.suggestions && data.suggestions.length > 0) {
        setProposedRelationships(data.suggestions);
        showSuccess(`AI found ${data.suggestions.length} potential fractal relationships.`);
      } else {
        showSuccess("No new fractal patterns detected.");
      }
    } catch (err: any) {
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
      
      setProposedRelationships(prev => prev.filter(r => r.child_id !== rel.child_id));
      fetchData();
    } catch (err) {
      showError("Failed to update relationship.");
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

      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error);
      
      if (errors.length > 0) throw new Error("Some updates failed");

      setProposedRelationships(prev => prev.filter(r => r.parent_id !== parentId));
      fetchData();
      showSuccess(`Accepted ${rels.length} relationships under parent.`);
    } catch (err) {
      showError("Failed to update relationships.");
    }
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

    return roots.sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));
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

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Proposed Relationships Bar */}
      {proposedRelationships.length > 0 && (
        <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <Sparkles size={20} className="text-amber-500" />
              <h3 className="text-xl font-black text-slate-900">Proposed Fractal Groups</h3>
            </div>
            <Badge className="bg-amber-500 text-white border-none font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">
              {proposedRelationships.length} Patterns Detected
            </Badge>
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
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setProposedRelationships(prev => prev.filter(r => r.child_id !== rel.child_id))}
                                className="h-8 w-8 rounded-lg text-slate-300 hover:text-rose-600"
                              >
                                <X size={16} />
                              </Button>
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
        <Button 
          onClick={handleScan} 
          disabled={isScanning || backlog.length < 2}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 px-8 font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100"
        >
          {isScanning ? <Loader2 className="mr-2 animate-spin" /> : <Wand2 size={18} className="mr-2" />}
          Scan for Fractals
        </Button>
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