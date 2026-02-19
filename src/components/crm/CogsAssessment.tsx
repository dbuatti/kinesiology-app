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
  sagittal: ["FX Restricted", "EX Restricted", "AT Priority", "PT Priority", "Hyper-lordosis", "Flat Back"],
  frontal: ["LFX Restricted", "RFX Restricted", "L Hip Hike", "R Hip Hike", "Pelvic Tilt", "Scoliotic Curve"],
  transverse: ["L Rotation Restricted", "R Rotation Restricted", "Pelvic Rotation", "Ribcage Torque", "Cervical Block"],
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

  const [sagittalImageError, setSagittalImageError] = useState(false);
  const [frontalImageError, setFrontalImageError] = useState(false);
  const [transverseImageError, setTransverseImageError] = useState(false);

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
      showSuccess("Range of Motion assessment saved!");
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
      showError("Failed to reset.");
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
    icon: Icon,
    imagePath,
    imageError,
    setImageError
  }: any) => (
    <div className={cn("p-6 rounded-[2.5rem] border-2 transition-all duration-500 space-y-6", color)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
            <Icon size={20} className={color.split(' ')[0].replace('bg-', 'text-')} />
          </div>
          <h4 className="text-lg font-black text-slate-900 tracking-tight">{title}</h4>
        </div>
        <Badge className="bg-white/50 text-slate-600 border-none font-black text-[9px] uppercase tracking-widest">Anatomical Plane</Badge>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white/40 rounded-2xl p-4 border border-white/60">
          {!imageError ? (
            <img src={imagePath} alt={title} className="w-full h-32 object-contain rounded-lg mix-blend-multiply" onError={() => setImageError(true)} />
          ) : (
            <div className="h-32 flex flex-col items-center justify-center text-slate-400"><ImageOff size={24} /><p className="text-[10px] mt-1">Diagram N/A</p></div>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Quick Findings</p>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag: string) => (
              <button 
                key={tag} 
                onClick={() => addTag(plane, tag)}
                className="px-2 py-1 rounded-lg bg-white/60 border border-white hover:bg-white hover:shadow-sm transition-all text-[10px] font-bold text-slate-600"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Assessment Notes</Label>
          <Textarea 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)} 
            placeholder="Document restrictions..." 
            className="min-h-[120px] rounded-2xl border-none bg-white/80 focus:ring-2 focus:ring-indigo-500 font-medium text-sm"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-lg overflow-hidden transition-all hover:shadow-xl">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className={cn(
            "p-6 flex items-center justify-between cursor-pointer transition-all duration-500",
            isOpen ? "bg-slate-50/80" : "hover:bg-slate-50/50",
            hasSavedNotes && !isOpen && "bg-purple-50/30"
          )}>
            <div className="flex items-center gap-5">
              <div className={cn(
                "w-14 h-14 rounded-[1.25rem] bg-purple-600 flex items-center justify-center shadow-lg transition-transform duration-500",
                isOpen ? "scale-110 rotate-12" : ""
              )}>
                <Move size={28} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Range of Motion (Cogs)</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">3-Plane Mobility Assessment</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {hasSavedNotes && (
                <Badge className="bg-purple-500 text-white border-none font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm">
                  Notes Recorded
                </Badge>
              )}
              <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400">
                <ChevronDown className={cn("h-5 w-5 transition-transform duration-500", isOpen && "rotate-180")} />
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-8 border-t border-slate-100 space-y-10 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <PlaneCard 
                title="Sagittal" 
                plane="sagittal" 
                notes={sagittalNotes} 
                setNotes={setSagittalNotes} 
                tags={QUICK_TAGS.sagittal} 
                color="bg-orange-50 border-orange-100" 
                icon={Zap}
                imagePath="/images/cogs/sagittal-plane.png"
                imageError={sagittalImageError}
                setImageError={setSagittalImageError}
              />
              <PlaneCard 
                title="Frontal" 
                plane="frontal" 
                notes={frontalNotes} 
                setNotes={setFrontalNotes} 
                tags={QUICK_TAGS.frontal} 
                color="bg-emerald-50 border-emerald-100" 
                icon={Move}
                imagePath="/images/cogs/frontal-plane.png"
                imageError={frontalImageError}
                setImageError={setFrontalImageError}
              />
              <PlaneCard 
                title="Transverse" 
                plane="transverse" 
                notes={transverseNotes} 
                setNotes={setTransverseNotes} 
                tags={QUICK_TAGS.transverse} 
                color="bg-blue-50 border-blue-100" 
                icon={RefreshCw}
                imagePath="/images/cogs/transverse-plane.png"
                imageError={transverseImageError}
                setImageError={setTransverseImageError}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">
                {loading ? <Loader2 className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                Save ROM Assessment
              </Button>
              {hasSavedNotes && (
                <Button variant="ghost" onClick={handleReset} className="text-rose-600 hover:bg-rose-50 h-14 px-6 rounded-2xl font-bold">
                  <RotateCcw size={20} />
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