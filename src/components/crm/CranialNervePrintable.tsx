"use client";

import React, { useState, useEffect } from 'react';
import { CRANIAL_NERVES } from '@/data/cranial-nerve-data';
import { supabase } from "@/integrations/supabase/client";
import { cn } from '@/lib/utils';
import { Zap, Activity } from 'lucide-react';

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

  const groupedNerves = {
    'Cortex': CRANIAL_NERVES.filter(n => n.nuclei === 'Cortex'),
    'Midbrain': CRANIAL_NERVES.filter(n => n.nuclei === 'Midbrain'),
    'Pons': CRANIAL_NERVES.filter(n => n.nuclei === 'Pons'),
    'Medulla': CRANIAL_NERVES.filter(n => n.nuclei === 'Medulla'),
  };

  const NerveCard = ({ nerve, color }: { nerve: any, color: string }) => {
    const images = customImages[`cn${nerve.id}`];
    
    return (
      <div className="border border-black p-2 flex flex-col h-full break-inside-avoid bg-white">
        <div className="flex items-start justify-between mb-2 border-b border-black/10 pb-1 min-h-[24px]">
          <div className="flex flex-col">
            <h4 className="font-black text-[10px] uppercase leading-none">{nerve.name}</h4>
            <p className="text-[7px] font-bold text-slate-500 uppercase mt-1">{nerve.latinName}</p>
          </div>
          <span className={cn("text-[7px] font-black px-1.5 py-0.5 rounded-sm text-white leading-none shrink-0", color)}>
            {nerve.toneEffect}
          </span>
        </div>
        
        <div className="relative aspect-video bg-slate-50 border border-slate-100 mb-2 overflow-hidden flex items-center justify-center shrink-0">
          {images?.primary ? (
            <img src={images.primary} alt={nerve.name} className="w-full h-full object-cover" />
          ) : (
            <Zap size={20} className="text-slate-200" />
          )}
          
          {images?.secondary && (
            <div className="absolute bottom-1 right-1 w-1/3 aspect-square border-2 border-white shadow-md overflow-hidden bg-white">
              <img src={images.secondary} alt="Inset" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div className="space-y-1 text-[8px] leading-tight text-slate-800">
          <p><strong>Reflex:</strong> {nerve.reflexPoint}</p>
          <p><strong>Stim:</strong> {nerve.stimulus}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white text-black p-8 max-w-[210mm] mx-auto font-sans print:p-0 print:m-0">
      {/* Header */}
      <div className="border-b-2 border-black pb-2 mb-6 flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-3xl font-serif font-bold tracking-tight uppercase leading-none">Cranial Nerve Reference</h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Functional Neuro Health • Clinical Infrastructure</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">A4 Portrait Edition</p>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedNerves).map(([nuclei, nerves]) => (
          <div key={nuclei} className="space-y-2">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
              <Activity size={12} className="text-slate-400" />
              <h2 className="text-[11px] font-black uppercase text-slate-600">{nuclei} Nuclei</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {nerves.map(n => (
                <NerveCard 
                  key={n.id} 
                  nerve={n} 
                  color={
                    nuclei === 'Cortex' ? "bg-purple-600" :
                    nuclei === 'Midbrain' ? "bg-amber-500" :
                    nuclei === 'Pons' ? "bg-indigo-600" :
                    "bg-rose-600"
                  } 
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-10 pt-4 border-t border-slate-200 flex justify-between items-center">
        <div className="flex gap-6 text-[8px] font-black uppercase tracking-widest text-slate-400">
          <p>• Midbrain: Flexors (CN 3-4)</p>
          <p>• Pons: Extensors (CN 5-8)</p>
          <p>• Medulla: Flexors (CN 9-12)</p>
        </div>
        <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.5em]">Confidential Practitioner Resource</p>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
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