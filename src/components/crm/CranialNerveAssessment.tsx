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
    <div className="space-y-16">
      {CRANIAL_NERVES.map((nerve) => {
        const test = getTestData(nerve.id);
        const images = customImages[`cn${nerve.id}`];
        const hasImages = images?.primary || images?.secondary;
        const id = `nerve-section-${nerve.id}`;

        return (
          <section 
            key={nerve.id} 
            id={id}
            className={cn(
              "space-y-6 scroll-mt-40 pb-12 border-b border-slate-100 last:border-0 transition-colors",
              test.is_inhibited && "bg-rose-50/30 -mx-10 px-10 rounded-3xl"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-serif font-bold text-black">
                    {nerve.name}: {nerve.latinName}
                  </h2>
                  <Badge variant="outline" className="border-black text-black font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-none">
                    {nerve.nuclei} • {nerve.toneEffect} Tone
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Cranial Nerve Assessment</p>
              </div>

              <div className="flex items-center gap-4 print:hidden">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id={`inhib-${nerve.id}`}
                    checked={test.is_inhibited}
                    onCheckedChange={(checked) => updateTest(nerve.id.toString(), { is_inhibited: !!checked })}
                    className="h-5 w-5 border-black rounded-none"
                  />
                  <label htmlFor={`inhib-${nerve.id}`} className="text-[10px] font-black uppercase tracking-widest cursor-pointer">
                    Inhibited
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id={`priority-${nerve.id}`}
                    checked={test.is_priority}
                    onCheckedChange={(checked) => updateTest(nerve.id.toString(), { is_priority: !!checked })}
                    className="h-5 w-5 border-black rounded-none"
                  />
                  <label htmlFor={`priority-${nerve.id}`} className="text-[10px] font-black uppercase tracking-widest cursor-pointer">
                    Priority
                  </label>
                </div>
                {test.is_primary_priority ? (
                  <Badge className="bg-black text-white border-none font-black text-[8px] uppercase tracking-widest px-3 py-1 rounded-none">
                    Primary
                  </Badge>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => updateTest(nerve.id.toString(), { is_primary_priority: true })}
                    className="h-7 px-2 text-[8px] font-black uppercase tracking-widest text-slate-400 hover:text-black"
                  >
                    Set Primary
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <Hand size={12} /> Reflex Point
                  </div>
                  <p className="text-sm font-bold text-slate-900 leading-relaxed">{nerve.reflexPoint}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <PlayCircle size={12} /> Stimulus
                  </div>
                  <p className="text-sm font-bold text-slate-900 leading-relaxed">{nerve.stimulus}</p>
                </div>
                <div className="pt-4">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2">
                    <Sparkles size={12} /> Clinical Pearl
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {nerve.clinicalPearl}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {hasImages ? (
                  <div className={cn(
                    "grid gap-4",
                    images.primary && images.secondary ? "grid-cols-2" : "grid-cols-1"
                  )}>
                    {images.primary && (
                      <div className="aspect-video border border-slate-200 p-1 rounded-sm bg-slate-50 overflow-hidden">
                        <img src={images.primary} alt="Primary" className="w-full h-full object-cover" />
                      </div>
                    )}
                    {images.secondary && (
                      <div className="aspect-video border border-slate-200 p-1 rounded-sm bg-slate-50 overflow-hidden">
                        <img src={images.secondary} alt="Secondary" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video border-2 border-dashed border-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-300">
                    <ImageIcon size={32} className="mb-2 opacity-20" />
                    <p className="text-[8px] font-black uppercase tracking-widest">No Reference Images</p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <FileText size={12} /> Assessment Notes
                  </div>
                  <textarea 
                    value={test.notes || ""}
                    onChange={(e) => updateTest(nerve.id.toString(), { notes: e.target.value })}
                    className="w-full min-h-[80px] bg-slate-50 border-none rounded-xl p-4 text-sm font-medium focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                    placeholder="Document findings..."
                  />
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}