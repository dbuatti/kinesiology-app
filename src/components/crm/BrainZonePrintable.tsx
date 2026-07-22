
import React, { useState, useEffect } from 'react';
import { BRAIN_REFLEX_POINTS, BrainReflexPoint } from '@/data/brain-reflex-data';
import { supabase } from "@/integrations/supabase/client";
import { cn } from '@/lib/utils';
import { Brain, Layers, Columns, Rows, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BrainReflexModal from './BrainReflexModal';

const BrainZonePrintable = () => {
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('portrait');
  const [isCompact, setIsCompact] = useState(true);
  const [customImages, setCustomImages] = useState<Record<string, { primary: string | null, secondary: string | null }>>({});
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [selectedPoint, setSelectedPoint] = useState<BrainReflexPoint | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

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

  const handleCardClick = (point: BrainReflexPoint) => {
    setSelectedPoint(point);
    setModalOpen(true);
  };

  const ZoneCard = ({ point, color, onClick }: { point: any, color: string, onClick: () => void }) => {
    const images = customImages[point.id];
    
    const primaryImage = images?.primary;
    const secondaryImage = images?.secondary;

    // Main image is Image 2 (secondary), fallback to Image 1 (primary)
    const mainImage = secondaryImage || primaryImage;
    // Inset image is Image 1 (primary) if Image 2 is displayed as main
    const insetImage = secondaryImage ? primaryImage : null;
    
    return (
      <div 
        onClick={onClick}
        className="relative border border-black p-2 flex flex-col h-full break-inside-avoid bg-white cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all print:cursor-default print:hover:border-black print:hover:shadow-none group"
      >
        <div className="flex items-center justify-between mb-1.5 border-b border-black/10 pb-1">
          <h4 className="font-black text-[10px] sm:text-[9px] uppercase leading-none truncate pr-1">{point.name}</h4>
          <span className={cn("text-[8px] sm:text-[7px] font-black px-1.5 py-0.5 rounded-sm text-white whitespace-nowrap leading-none shrink-0", color)}>
            {point.acupoint || point.category[0]}
          </span>
        </div>
        
        <div className="relative aspect-[2.5/1] bg-slate-50 border border-slate-100 mb-2 overflow-hidden flex items-center justify-center shrink-0">
          {mainImage ? (
            <img src={mainImage} alt={point.name} className="w-full h-full object-cover" />
          ) : (
            <Brain size={16} className="text-slate-200" />
          )}
          
          {insetImage && (
            <div className="absolute bottom-0.5 right-0.5 w-[22%] aspect-square border border-white shadow-sm overflow-hidden bg-white">
              <img src={insetImage} alt="Inset" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* Floating Hover Popup of Image 2 (mainImage) outside boundaries, uncropped */}
        {mainImage && (
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[150%] aspect-video bg-white border-2 border-indigo-500 shadow-2xl rounded-2xl p-1.5 opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100 z-50 flex items-center justify-center print:hidden">
            <img src={mainImage} alt={`${point.name} Full`} className="w-full h-full object-contain rounded-xl" />
          </div>
        )}

        <div className={cn(
          "space-y-1 text-slate-800",
          isCompact ? "text-[8.5px] sm:text-[7px] leading-[1.1]" : "text-[10px] sm:text-[8.5px] leading-tight"
        )}>
          <p><strong>L:</strong> {point.location}</p>
          <p><strong>S:</strong> {point.stimulus || point.technique || "Standard"}</p>
        </div>
      </div>
    );
  };

  return (
    <div className={cn(
      "bg-white text-black p-4 sm:p-6 mx-auto font-sans print:p-0 print:m-0 transition-all duration-500",
      orientation === 'landscape' ? "max-w-[297mm]" : "max-w-[210mm]"
    )}>
      {/* Print Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-200 print:hidden gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-center">
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <Button 
              variant={orientation === 'landscape' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setOrientation('landscape')}
              className="rounded-lg h-9 px-4 font-bold text-[10px] uppercase tracking-widest"
            >
              <Columns size={14} className="mr-2" /> Landscape
            </Button>
            <Button 
              variant={orientation === 'portrait' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setOrientation('portrait')}
              className="rounded-lg h-9 px-4 font-bold text-[10px] uppercase tracking-widest"
            >
              <Rows size={14} className="mr-2" /> Portrait
            </Button>
          </div>

          <div className="hidden sm:block h-6 w-px bg-slate-200" />

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsCompact(!isCompact)}
            className="rounded-xl h-9 px-4 font-bold text-[10px] uppercase tracking-widest border-slate-200 bg-white"
          >
            {isCompact ? <Maximize2 size={14} className="mr-2" /> : <Minimize2 size={14} className="mr-2" />}
            {isCompact ? "Normal Text" : "Compact Text"}
          </Button>
        </div>
        
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {orientation.toUpperCase()} • {isCompact ? 'COMPACT' : 'NORMAL'}
        </p>
      </div>

      {/* Header */}
      <div className="border-b-2 border-black pb-2 mb-6 flex justify-between items-end">
        <div className="space-y-0.5">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight uppercase leading-none">Brain Zone Reference</h1>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Functional Neuro Health • Clinical Infrastructure • v2.4</p>
        </div>
        <div className="text-right">
          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Neurological Correction Map</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Cortical Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b-2 border-purple-600 pb-1">
            <Brain size={14} className="text-purple-600" />
            <h2 className="text-[11px] font-black uppercase text-purple-600 tracking-widest">Cortical Zones (Contralateral)</h2>
          </div>
          <div className={cn(
            "grid gap-3 grid-cols-1 sm:grid-cols-2",
            orientation === 'landscape' ? "md:grid-cols-4" : "md:grid-cols-3",
            "print:grid-cols-3",
            orientation === 'landscape' && "print:grid-cols-4"
          )}>
            {corticalZones.map(p => (
              <ZoneCard 
                key={p.id} 
                point={p} 
                color="bg-purple-600" 
                onClick={() => handleCardClick(p)}
              />
            ))}
          </div>
        </div>

        {/* Subcortical Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b-2 border-indigo-600 pb-1">
            <Layers size={14} className="text-indigo-600" />
            <h2 className="text-[11px] font-black uppercase text-indigo-600 tracking-widest">Subcortical Zones (Ipsilateral)</h2>
          </div>
          <div className={cn(
            "grid gap-3 grid-cols-1 sm:grid-cols-2",
            orientation === 'landscape' ? "md:grid-cols-4" : "md:grid-cols-3",
            "print:grid-cols-3",
            orientation === 'landscape' && "print:grid-cols-4"
          )}>
            {subcorticalZones.map(p => (
              <ZoneCard 
                key={p.id} 
                point={p} 
                color="bg-indigo-600" 
                onClick={() => handleCardClick(p)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-2 border-t border-slate-200 flex justify-between items-center">
        <div className="flex gap-6 text-[8px] font-black uppercase tracking-widest text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-600" /> Cortical (Opposite Side)
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-600" /> Subcortical (Same Side)
          </div>
        </div>
        <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.5em]">Confidential Practitioner Resource</p>
      </div>

      {/* Brain Reflex Modal */}
      <BrainReflexModal 
        point={selectedPoint}
        primaryUrl={selectedPoint ? customImages[selectedPoint.id]?.primary : null}
        secondaryUrl={selectedPoint ? customImages[selectedPoint.id]?.secondary : null}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />

      <style>{`
        @media print {
          @page {
            size: A4 ${orientation};
            margin: 8mm;
          }
          body {
            background: white;
            -webkit-print-color-adjust: exact;
          }
          body * {
            visibility: visible !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default BrainZonePrintable;