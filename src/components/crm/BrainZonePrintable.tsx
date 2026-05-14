"use client";

import React, { useState, useEffect } from 'react';
import { BRAIN_REFLEX_POINTS } from '@/data/brain-reflex-data';
import { supabase } from "@/integrations/supabase/client";
import { cn } from '@/lib/utils';
import { Brain, Layers } from 'lucide-react';

const BrainZonePrintable = () => {
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
        console.error("Failed to fetch images:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, []);

  const corticalZones = BRAIN_REFLEX_POINTS.filter(p => p.category === 'Cortical');
  const subcorticalZones = BRAIN_REFLEX_POINTS.filter(p => p.category === 'Subcortical');

  const ZoneCard = ({ point, color }: { point: any, color: string }) => {
    const images = customImages[point.id];
    
    return (
      <div className="border border-black p-2 flex flex-col h-full break-inside-avoid bg-white">
        <div className="flex items-start justify-between mb-2 border-b border-black/10 pb-1 min-h-[24px]">
          <h4 className="font-black text-[10px] uppercase leading-tight pr-2">{point.name}</h4>
          <span className={cn("text-[7px] font-black px-1.5 py-0.5 rounded-sm text-white leading-none shrink-0", color)}>
            {point.acupoint || point.category[0]}
          </span>
        </div>
        
        <div className="relative aspect-video bg-slate-50 border border-slate-100 mb-2 overflow-hidden flex items-center justify-center shrink-0">
          {images?.primary ? (
            <img src={images.primary} alt={point.name} className="w-full h-full object-cover" />
          ) : (
            <Brain size={20} className="text-slate-200" />
          )}
          
          {images?.secondary && (
            <div className="absolute bottom-1 right-1 w-1/3 aspect-square border-2 border-white shadow-md overflow-hidden bg-white">
              <img src={images.secondary} alt="Inset" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div className="space-y-1 text-[8px] leading-tight text-slate-800">
          <p><strong>Loc:</strong> {point.location}</p>
          <p><strong>Stim:</strong> {point.stimulus || point.technique || "Standard"}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white text-black p-8 max-w-[210mm] mx-auto font-sans print:p-0 print:m-0">
      {/* Header */}
      <div className="border-b-2 border-black pb-2 mb-6 flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-3xl font-serif font-bold tracking-tight uppercase leading-none">Brain Zone Reference Map</h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Functional Neuro Health • Clinical Infrastructure</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">A4 Portrait Edition</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Cortical Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-purple-600 pb-1">
            <Brain size={12} className="text-purple-600" />
            <h2 className="text-[11px] font-black uppercase text-purple-600">Cortical Zones (Contralateral)</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {corticalZones.map(p => <ZoneCard key={p.id} point={p} color="bg-purple-600" />)}
          </div>
        </div>

        {/* Subcortical Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-indigo-600 pb-1">
            <Layers size={12} className="text-indigo-600" />
            <h2 className="text-[11px] font-black uppercase text-indigo-600">Subcortical Zones (Ipsilateral)</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {subcorticalZones.map(p => <ZoneCard key={p.id} point={p} color="bg-indigo-600" />)}
          </div>
        </div>
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

export default BrainZonePrintable;