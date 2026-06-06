
import React, { useState, useEffect } from 'react';
import { CRANIAL_NERVES } from '@/data/cranial-nerve-data';
import { supabase } from "@/integrations/supabase/client";
import { cn } from '@/lib/utils';
import { Zap, Activity, Brain, Layers } from 'lucide-react';

const CranialNervePrintable = () => {
  const [customImages, setCustomImages] = useState<Record<string, { primary: string | null, secondary: string | null }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('brain_reflex_customizations')
          .select('reflex_id, image_url, secondary_image_url')
          .like('reflex_id', 'cn%');

        const mapping: Record<string, { primary: string | null, secondary: string | null }> = {};
        data?.forEach(item => {
          mapping[item.reflex_id] = {
            primary: item.image_url,
            secondary: item.secondary_image_url
          };
        });
        setCustomImages(mapping);
      } catch (err) {
        console.error("Failed to fetch images:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, []);

  const NerveCard = ({ nerve }: { nerve: any }) => {
    const images = customImages[`cn${nerve.id}`];
    
    const nucleiColor = 
      nerve.nuclei === 'Cortex' ? "bg-purple-600" :
      nerve.nuclei === 'Midbrain' ? "bg-amber-500" :
      nerve.nuclei === 'Pons' ? "bg-indigo-600" :
      "bg-rose-600";

    return (
      <div className="border border-black p-2 flex flex-col h-full break-inside-avoid bg-white">
        <div className="flex items-start justify-between mb-1.5 border-b border-black/10 pb-1 min-h-[28px]">
          <div className="flex flex-col">
            <h4 className="font-black text-[10px] uppercase leading-none">{nerve.name}</h4>
            <p className="text-[7px] font-bold text-slate-500 uppercase mt-0.5">{nerve.latinName}</p>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className={cn("text-[6px] font-black px-1 py-0.5 rounded-sm text-white leading-none uppercase", nucleiColor)}>
              {nerve.nuclei}
            </span>
            <span className="text-[6px] font-bold text-slate-400 uppercase tracking-widest">
              {nerve.toneEffect} Tone
            </span>
          </div>
        </div>
        
        <div className="relative aspect-[2/1] bg-slate-50 border border-slate-100 mb-2 overflow-hidden flex items-center justify-center shrink-0">
          {images?.primary ? (
            <img src={images.primary} alt={nerve.name} className="w-full h-full object-cover" />
          ) : (
            <Zap size={16} className="text-slate-200" />
          )}
          
          {images?.secondary && (
            <div className="absolute bottom-0.5 right-0.5 w-[22%] aspect-square border border-white shadow-sm overflow-hidden bg-white">
              <img src={images.secondary} alt="Inset" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div className="space-y-1 text-[7px] leading-[1.1] text-slate-800">
          <p><strong>Reflex:</strong> {nerve.reflexPoint}</p>
          <p><strong>Stim:</strong> {nerve.stimulus}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white text-black p-4 sm:p-6 max-w-[297mm] mx-auto font-sans print:p-0 print:m-0">
      {/* Header */}
      <div className="border-b-2 border-black pb-1.5 mb-4 flex justify-between items-end">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-serif font-bold tracking-tight uppercase leading-none">Cranial Nerve Reference</h1>
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em]">Functional Neuro Health • Clinical Infrastructure • v2.4</p>
        </div>
        <div className="text-right">
          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">A4 Landscape Edition</p>
        </div>
      </div>

      {/* 4x3 Grid for 12 Nerves */}
      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 print:grid-cols-4">
        {CRANIAL_NERVES.map(n => (
          <NerveCard key={n.id} nerve={n} />
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-2 border-t border-slate-200 flex justify-between items-center">
        <div className="flex gap-6 text-[8px] font-black uppercase tracking-widest text-slate-400">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-600" /> Cortex
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Midbrain (Flexors)
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" /> Pons (Extensors)
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-600" /> Medulla (Flexors)
          </div>
        </div>
        <p className="text-[7px] font-black text-slate-300 uppercase tracking-[0.5em]">Confidential Practitioner Resource</p>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 8mm;
          }
          body {
            background: white;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};

export default CranialNervePrintable;