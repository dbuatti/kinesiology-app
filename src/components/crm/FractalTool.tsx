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
  LayoutGrid
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
        <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3 px-2">
            <Sparkles size={20} className="text-amber-500" />
            <h3 className="text-lg font-black text-slate-900">Proposed Fractal Relationships</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {proposedRelationships.map((rel, idx) => {
              const child = backlog.find(b => b.id === rel.child_id);
              const parent = backlog.find(b => b.id === rel.parent_id);
              if (!child || !parent) return null;

              return (
                <Card key={idx} className="border-none shadow-md bg-indigo-50/50 border-2 border-indigo-100 rounded-[2rem] overflow-hidden">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <Badge variant="outline" className="bg-white border-indigo-200 text-indigo-600 text-[8px] font-black uppercase px-2 py-0.5">Child</Badge>
                        <p className="text-sm font-bold truncate">"{child.content}"</p>
                      </div>
                      <ArrowRight size={16} className="text-indigo-400 shrink-0" />
                      <div className="flex items-center gap-3 min-w-0">
                        <Badge className="bg-indigo-600 text-white border-none text-[8px] font-black uppercase px-2 py-0.5">Parent</Badge>
                        <p className="text-sm font-bold truncate">"{parent.content}"</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 font-medium italic leading-relaxed">
                      {rel.reasoning}
                    </p>
                    <div className="flex gap-2 pt-2">
                      <Button 
                        onClick={() => handleAcceptRelationship(rel)}
                        className="flex-1 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg"
                      >
                        Accept Relationship
                      </Button>
                      <Button 
                        variant="ghost" 
                        onClick={() => setProposedRelationships(prev => prev.filter(r => r.child_id !== rel.child_id))}
                        className="h-10 w-10 rounded-xl text-slate-400 hover:text-rose-600"
                      >
                        <X size={18} />
                      </Button>
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