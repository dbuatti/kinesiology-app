"use client";

import React, { useState, useEffect } from "react";
import { CRANIAL_NERVES } from "@/data/cranial-nerve-data";
import { useCranialNerveTests } from "@/hooks/useCranialNerveTests";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Zap, 
  ImageIcon, 
  Loader2, 
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
    <div className="space-y-12">
      {CRANIAL_NERVES.map((nerve) => {
        const test = getTestData(nerve.id);
        const images = customImages[`cn${nerve.id}`];
        const hasImages = images?.primary || images?.secondary;

        return (
          <section 
            key={nerve.id} 
            className="space-y-4"
          >
            {/* Header Row - Compact */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-serif font-bold text-slate-900">
                  {nerve.name}: {nerve.latinName}
                </h2>
                <Badge variant="outline" className="border-slate-200 text-slate-500 font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-none">
                  {nerve.nuclei} • {nerve.toneEffect}
                </Badge>
              </div>

              <div className="flex items-center gap-6 print:hidden">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id={`inhib-${nerve.id}`}
                    checked={test.is_inhibited}
                    onCheckedChange={(checked) => updateTest(nerve.id.toString(), { is_inhibited: !!checked })}
                    className="h-4 w-4 border-slate-400 rounded-none"
                  />
                  <label htmlFor={`inhib-${nerve.id}`} className="text-[9px] font-black uppercase tracking-widest cursor-pointer text-slate-600">
                    Inhibited
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id={`priority-${nerve.id}`}
                    checked={test.is_priority}
                    onCheckedChange={(checked) => updateTest(nerve.id.toString(), { is_priority: !!checked })}
                    className="h-4 w-4 border-slate-400 rounded-none"
                  />
                  <label htmlFor={`priority-${nerve.id}`} className="text-[9px] font-black uppercase tracking-widest cursor-pointer text-slate-600">
                    Priority
                  </label>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => updateTest(nerve.id.toString(), { is_primary_priority: !test.is_primary_priority })}
                  className={cn(
                    "h-6 px-2 text-[8px] font-black uppercase tracking-widest transition-all",
                    test.is_primary_priority ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-900"
                  )}
                >
                  {test.is_primary_priority ? "Primary" : "Set Primary"}
                </Button>
              </div>
            </div>

            {/* Content Grid - Compact */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Info */}
              <div className="lg:col-span-7 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                      <Hand size={12} /> Reflex Point
                    </div>
                    <p className="text-sm font-bold text-slate-800 leading-tight">{nerve.reflexPoint}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                      <PlayCircle size={12} /> Stimulus
                    </div>
                    <p className="text-sm font-bold text-slate-800 leading-tight">{nerve.stimulus}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                    <FileText size={12} /> Assessment Notes
                  </div>
                  <textarea 
                    value={test.notes || ""}
                    onChange={(e) => updateTest(nerve.id.toString(), { notes: e.target.value })}
                    className="w-full min-h-[60px] bg-slate-50/50 border-none rounded-xl p-4 text-sm font-medium focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                    placeholder="Document findings..."
                  />
                </div>
              </div>

              {/* Right Column: Images - Smaller */}
              <div className="lg:col-span-5">
                {hasImages ? (
                  <div className="grid grid-cols-2 gap-3">
                    {images.primary && (
                      <div className="aspect-video border border-slate-100 p-0.5 rounded-lg bg-slate-50 overflow-hidden">
                        <img src={images.primary} alt="Primary" className="w-full h-full object-cover rounded-md" />
                      </div>
                    )}
                    {images.secondary && (
                      <div className="aspect-video border border-slate-100 p-0.5 rounded-lg bg-slate-50 overflow-hidden">
                        <img src={images.secondary} alt="Secondary" className="w-full h-full object-cover rounded-md" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video border border-dashed border-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-200 bg-slate-50/30">
                    <ImageIcon size={24} className="opacity-20" />
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}