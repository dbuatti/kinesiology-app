"use client";

import React, { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronDown, Move, Info, Save, Loader2, ImageOff, RotateCcw, Zap, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface CogsAssessmentProps {
  appointmentId: string;
  initialSagittalNotes: string | null | undefined;
  initialFrontalNotes: string | null | undefined;
  initialTransverseNotes: string | null | undefined;
  onUpdate: () => void;
}

const QUICK_TAGS = {
  sagittal: ["FX Restricted", "EX Restricted", "AT Priority", "PT Priority"],
  frontal: ["LFX Restricted", "RFX Restricted", "L Hip Hike", "R Hip Hike"],
  transverse: ["L Rotation", "R Rotation", "Pelvic Rot", "Rib Torque"],
};

const CogsAssessment = ({ 
  appointmentId, 
  initialSagittalNotes,
  initialFrontalNotes,
  initialTransverseNotes,
  onUpdate 
}: CogsAssessmentProps) => {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const [sagittalNotes, setSagittalNotes] = useState(initialSagittalNotes || '');
  const [frontalNotes, setFrontalNotes] = useState(initialFrontalNotes || '');
  const [transverseNotes, setTransverseNotes] = useState(initialTransverseNotes || '');

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ 
          sagittal_plane_notes: sagittalNotes || null,
          frontal_plane_notes: frontalNotes || null,
          transverse_plane_notes: transverseNotes || null,
        })
        .eq("id", appointmentId);

      if (error) throw error;
      showSuccess("ROM saved!");
      onUpdate();
    } catch (error: any) {
      showError(error.message || "Failed to save assessment.");
    } finally {
      setLoading(false);
    }
  };

  const addTag = (plane: 'sagittal' | 'frontal' | 'transverse', tag: string) => {
    const setter = plane === 'sagittal' ? setSagittalNotes : plane === 'frontal' ? setFrontalNotes : setTransverseNotes;
    const current = plane === 'sagittal' ? sagittalNotes : plane === 'frontal' ? frontalNotes : transverseNotes;
    
    if (current.includes(tag)) return;
    setter(prev => prev ? `${prev}, ${tag}` : tag);
  };

  const handleReset = async () => {
    if (!confirm("Reset all ROM notes?")) return;
    setLoading(true);
    try {
      await supabase.from("appointments").update({ sagittal_plane_notes: null, frontal_plane_notes: null, transverse_plane_notes: null }).eq("id", appointmentId);
      setSagittalNotes(''); setFrontalNotes(''); setTransverseNotes('');
      showSuccess("Reset complete.");
      onUpdate();
    } catch (error: any) {
      showError(error.message || "Failed to reset.");
    } finally {
      setLoading(false);
    }
  };

  const hasSavedNotes = initialSagittalNotes || initialFrontalNotes || initialTransverseNotes;

  const PlaneCard = ({ 
    title, 
    plane, 
    notes, 
    setNotes, 
    tags, 
    color, 
    icon: Icon
  }: any) => (
    <div className={cn("p-4 rounded-2xl border transition-all duration-300 space-y-3", color)}>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-card rounded-lg flex items-center justify-center shadow-sm">
          <Icon size={14} className={color.split(' ')[0].replace('bg-', 'text-')} />
        </div>
        <h4 className="text-xs font-black text-foreground uppercase tracking-tight">{title}</h4>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-1">
          {tags.map((tag: string) => (
            <button 
              key={tag} 
              onClick={() => addTag(plane, tag)}
              className="px-1.5 py-0.5 rounded-md bg-card/60 border border-border hover:bg-card transition-all text-[8px] font-black uppercase tracking-wider text-muted-foreground"
            >
              + {tag}
            </button>
          ))}
        </div>
        <Textarea 
          value={notes} 
          onChange={(e) => setNotes(e.target.value)} 
          placeholder="Notes..." 
          className="min-h-[60px] rounded-xl border-none bg-card/80 focus:ring-1 focus:ring-indigo-500 font-medium text-[11px] p-2"
        />
      </div>
    </div>
  );

  return (
    <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden transition-all hover:shadow-md">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className={cn(
            "p-4 flex items-center justify-between cursor-pointer transition-all duration-300",
            isOpen ? "bg-muted/50" : "hover:bg-muted/30",
            hasSavedNotes && !isOpen && "bg-purple-500/10"
          )}>
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-transform",
                isOpen ? "scale-105" : ""
              )}>
                <Move size={20} className="text-white bg-purple-600 rounded-xl p-1" />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground tracking-tight">ROM (Cogs)</h3>
                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">3-Plane Mobility</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {hasSavedNotes && (
                <Badge className="bg-purple-500 text-white border-none font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full">
                  Recorded
                </Badge>
              )}
              <div className="w-8 h-8 rounded-full bg-card shadow-sm border border-border flex items-center justify-center text-muted-foreground">
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", isOpen && "rotate-180")} />
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-6 border-t border-border space-y-6 animate-in fade-in slide-in-from-top-1 duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <PlaneCard title="Sagittal" plane="sagittal" notes={sagittalNotes} setNotes={setSagittalNotes} tags={QUICK_TAGS.sagittal} color="bg-orange-500/10 border-orange-500/20" icon={Zap} />
              <PlaneCard title="Frontal" plane="frontal" notes={frontalNotes} setNotes={setFrontalNotes} tags={QUICK_TAGS.frontal} color="bg-emerald-500/10 border-emerald-500/20" icon={Move} />
              <PlaneCard title="Transverse" plane="transverse" notes={transverseNotes} setNotes={setTransverseNotes} tags={QUICK_TAGS.transverse} color="bg-blue-500/10 border-blue-500/20" icon={RefreshCw} />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 h-10 rounded-xl font-black text-[10px] uppercase tracking-widest">
                {loading ? <Loader2 className="animate-spin mr-2" /> : <Save size={14} className="mr-2" />}
                Save ROM
              </Button>
              {hasSavedNotes && (
                <Button variant="ghost" onClick={handleReset} className="text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 h-9 px-3 rounded-xl font-bold text-[10px] uppercase tracking-widest">
                  <RotateCcw size={14} />
                </Button>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default CogsAssessment;