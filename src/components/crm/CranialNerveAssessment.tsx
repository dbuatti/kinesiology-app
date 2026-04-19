"use client";

import React, { useState, useEffect } from "react";
import { CRANIAL_NERVES, CranialNerve } from "@/data/cranial-nerve-data";
import { useCranialNerveTests } from "@/hooks/useCranialNerveTests";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Zap, 
  Info, 
  ImageIcon, 
  Loader2, 
  Sparkles, 
  Activity, 
  Hand, 
  PlayCircle,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface CranialNerveAssessmentProps {
  appointmentId: string;
}

export function CranialNerveAssessment({ appointmentId }: CranialNerveAssessmentProps) {
  const { tests, loading, updateTest } = useCranialNerveTests(appointmentId);
  const [customImages, setCustomImages] = useState<Record<string, { primary: string | null, secondary: string | null }>>({});
  const [loadingImages, setLoadingImages] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('brain_reflex_customizations')
          .select('reflex_id, image_url, secondary_image_url')
          .eq('user_id', user.id);

        const mapping: Record<string, { primary: string | null, secondary: string | null }> = {};
        data?.forEach(item => {
          mapping[item.reflex_id] = {
            primary: item.image_url,
            secondary: item.secondary_image_url
          };
        });
        setCustomImages(mapping);
      } catch (err) {
        console.error("Error fetching nerve images:", err);
      } finally {
        setLoadingImages(false);
      }
    };

    fetchImages();
  }, []);

  const getTestData = (nerveId: number) => {
    return tests.find(t => t.nerve_id === nerveId.toString()) || {
      is_inhibited: false,
      is_stimulated: false,
      is_priority: false,
      is_primary_priority: false,
      notes: ""
    };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-4">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading Assessment...</p>
      </div>
    );
  }

  return (
    <div className="space-y-24">
      {CRANIAL_NERVES.map((nerve) => {
        const test = getTestData(nerve.id);
        const images = customImages[`cn${nerve.id}`];
        const hasImages = images?.primary || images?.secondary;

        return (
          <section 
            key={nerve.id} 
            className="space-y-8"
          >
            {/* Header Row */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-6">
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <h2 className="text-4xl font-serif font-bold text-slate-900">
                    {nerve.name}: {nerve.latinName}
                  </h2>
                  <Badge variant="outline" className="border-slate-900 text-slate-900 font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-none">
                    {nerve.nuclei} • {nerve.toneEffect} Tone
                  </Badge>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Cranial Nerve Assessment</p>
              </div>

              <div className="flex items-center gap-8 print:hidden">
                <div className="flex items-center gap-3">
                  <Checkbox 
                    id={`inhib-${nerve.id}`}
                    checked={test.is_inhibited}
                    onCheckedChange={(checked) => updateTest(nerve.id.toString(), { is_inhibited: !!checked })}
                    className="h-6 w-6 border-slate-900 rounded-none"
                  />
                  <label htmlFor={`inhib-${nerve.id}`} className="text-[10px] font-black uppercase tracking-widest cursor-pointer text-slate-900">
                    Inhibited
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox 
                    id={`priority-${nerve.id}`}
                    checked={test.is_priority}
                    onCheckedChange={(checked) => updateTest(nerve.id.toString(), { is_priority: !!checked })}
                    className="h-6 w-6 border-slate-900 rounded-none"
                  />
                  <label htmlFor={`priority-${nerve.id}`} className="text-[10px] font-black uppercase tracking-widest cursor-pointer text-slate-900">
                    Priority
                  </label>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => updateTest(nerve.id.toString(), { is_primary_priority: !test.is_primary_priority })}
                  className={cn(
                    "h-8 px-3 text-[10px] font-black uppercase tracking-widest transition-all",
                    test.is_primary_priority ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-900"
                  )}
                >
                  {test.is_primary_priority ? "Primary Set" : "Set Primary"}
                </Button>
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Left Column: Info */}
              <div className="lg:col-span-6 space-y-10">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <Hand size={14} /> Reflex Point
                  </div>
                  <p className="text-xl font-bold text-slate-900 leading-tight">{nerve.reflexPoint}</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <PlayCircle size={14} /> Stimulus
                  </div>
                  <p className="text-xl font-bold text-slate-900 leading-tight">{nerve.stimulus}</p>
                </div>
              </div>

              {/* Right Column: Images */}
              <div className="lg:col-span-6">
                {hasImages ? (
                  <div className="grid grid-cols-2 gap-4">
                    {images.primary && (
                      <div className="aspect-video border-2 border-slate-100 p-1 rounded-2xl bg-slate-50 overflow-hidden shadow-sm">
                        <img src={images.primary} alt="Primary" className="w-full h-full object-cover rounded-xl" />
                      </div>
                    )}
                    {images.secondary && (
                      <div className="aspect-video border-2 border-slate-100 p-1 rounded-2xl bg-slate-50 overflow-hidden shadow-sm">
                        <img src={images.secondary} alt="Secondary" className="w-full h-full object-cover rounded-xl" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video border-2 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center justify-center text-slate-300 bg-slate-50/50">
                    <ImageIcon size={32} className="mb-2 opacity-20" />
                    <p className="text-[8px] font-black uppercase tracking-widest">No Reference Images</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <FileText size={14} /> Assessment Notes
              </div>
              <textarea 
                value={test.notes || ""}
                onChange={(e) => updateTest(nerve.id.toString(), { notes: e.target.value })}
                className="w-full min-h-[100px] bg-slate-50/50 border-none rounded-[2rem] p-8 text-base font-medium focus:ring-2 focus:ring-indigo-500 transition-all resize-none shadow-inner"
                placeholder="Document findings..."
              />
            </div>
          </section>
        );
      })}
    </div>
  );
}