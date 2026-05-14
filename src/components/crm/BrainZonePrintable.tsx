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
      <div className="border border-black p-1.5 flex flex-col h-full break-inside-avoid bg-white">
        <div className="flex items-start justify-between mb-1 border-b border-black/10 pb-0.5 min-h-[18px]">
          <h4 className="font-black text-[8px] uppercase leading-tight pr-1">{point.name}</h4>
          <span className={cn("text-[6px] font-black px-1 rounded-sm text-white leading-none shrink-0", color)}>
            {point.acupoint || point.category[0]}
          </span>
        </div>
        
        <div className="relative aspect-video bg-slate-50 border border-slate-100 mb-1 overflow-hidden flex items-center justify-center shrink-0">
          {images?.primary ? (
            <img src={images.primary} alt={point.name} className="w-full h-full object-cover" />
          ) : (
            <Brain size={14} className="text-slate-200" />
          )}
          
          {/* Secondary Image Overlay */}
          {images?.secondary && (
            <div className="absolute bottom-0.5 right-0.5 w-1/3 aspect-square border border-white shadow-md overflow-hidden bg-white">
              <img src={images.secondary} alt="Inset" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div className="space-y-0.5 text-[6.5px] leading-[1.1] text-slate-800">
          <p><strong>Loc:</strong> {point.location}</p>
          <p><strong>Stim:</strong> {point.stimulus || point.technique || "Standard"}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white text-black p-2 max-w-[297mm] mx-auto font-sans print:p-0 print:m-0">
      {/* Compact Header */}
      <div className="border-b-2 border-black pb-1 mb-2 flex justify-between items-end">
        <div>
          <h1 className="text-xl font-black tracking-tighter uppercase leading-none">Brain Zone Reference Map</h1>
          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em]">Functional Neuro Health • Clinical Infrastructure</p>
        </div>
        <div className="text-right">
          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Single Page Landscape</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Cortical Section */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 border-b border-purple-600 pb-0.5">
            <Brain size={10} className="text-purple-600" />
            <h2 className="text-[9px] font-black uppercase text-purple-600">Cortical Zones (Contralateral)</h2>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-1.5">
            {corticalZones.map(p => <ZoneCard key={p.id} point={p} color="bg-purple-600" />)}
          </div>
        </div>

        {/* Subcortical Section */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 border-b border-indigo-600 pb-0.5">
            <Layers size={10} className="text-indigo-600" />
            <h2 className="text-[9px] font-black uppercase text-indigo-600">Subcortical Zones (Ipsilateral)</h2>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-1.5">
            {subcorticalZones.map(p => <ZoneCard key={p.id} point={p} color="bg-indigo-600" />)}
          </div>
        </div>
      </div>

      {/* Ultra Compact Footer */}
      <div className="mt-3 pt-1 border-t border-slate-200 flex justify-between items-center">
        <div className="flex gap-4 text-[6px] font-black uppercase tracking-widest text-slate-400">
          <p>• Midbrain: Flexors (CN 3-4)</p>
          <p>• Pons: Extensors (CN 5-8)</p>
          <p>• Medulla: Flexors (CN 9-12)</p>
        </div>
        <p className="text-[6px] font-black text-slate-300 uppercase tracking-[0.5em]">Confidential Practitioner Resource</p>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 5mm;
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