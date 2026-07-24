
import { useState, useEffect, useMemo } from "react";
import { BRAIN_REFLEX_POINTS, BrainReflexPoint } from "@/data/brain-reflex-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Hand, 
  PlayCircle,
  CheckCircle2,
  Brain,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { safeParse } from "@/utils/safe-json";

interface ZoneTestItemProps {
  point: BrainReflexPoint;
  statusL?: 'Clear' | 'Inhibited';
  statusR?: 'Clear' | 'Inhibited';
  statusMidline?: 'Clear' | 'Inhibited';
  isLateralized: boolean;
  imageUrl?: string | null;
  showImage: boolean;
  compact?: boolean;
  onUpdate: (category: string, itemName: string, status: 'Clear' | 'Inhibited' | null, side?: 'L' | 'R') => Promise<void>;
}

const ZoneTestItem = ({ point, statusL, statusR, statusMidline, isLateralized, imageUrl, showImage, compact, onUpdate }: ZoneTestItemProps) => {
  const hasInhibition = statusL === 'Inhibited' || statusR === 'Inhibited' || statusMidline === 'Inhibited';
  const isFullyClear = (isLateralized ? (statusL === 'Clear' && statusR === 'Clear') : statusMidline === 'Clear');

  return (
    <section className={cn(
      "p-4 rounded-2xl border transition-all",
      hasInhibition ? "bg-rose-50 border-rose-200" : 
      isFullyClear ? "bg-emerald-50/10 border-emerald-100 opacity-80" :
      "border-slate-100 bg-white"
    )}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100/50 pb-2 mb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-serif font-bold text-slate-900">
            {point.name}
          </h2>
          <Badge variant="outline" className="border-slate-200 text-slate-400 font-black text-[7px] uppercase tracking-widest px-1.5 py-0 rounded-none">
            {point.category} • {point.lateralization}
          </Badge>
        </div>

        <div className="flex items-center gap-4 print:hidden">
          <div className="flex items-center gap-3 border-r border-slate-100 pr-4">
            {isLateralized ? (
              <>
                <div className="flex items-center gap-1.5">
                  <Checkbox 
                    id={`inhib-l-${point.id}`}
                    checked={statusL === 'Inhibited'}
                    onCheckedChange={(checked) => onUpdate('brainZones', point.name, checked ? 'Inhibited' : 'Clear', 'L')}
                    className="h-3.5 w-3.5 border-slate-400 rounded-none"
                  />
                  <label htmlFor={`inhib-l-${point.id}`} className="text-[8px] font-black uppercase tracking-widest cursor-pointer text-slate-500">
                    L Inhib
                  </label>
                </div>
                <div className="flex items-center gap-1.5">
                  <Checkbox 
                    id={`inhib-r-${point.id}`}
                    checked={statusR === 'Inhibited'}
                    onCheckedChange={(checked) => onUpdate('brainZones', point.name, checked ? 'Inhibited' : 'Clear', 'R')}
                    className="h-3.5 w-3.5 border-slate-400 rounded-none"
                  />
                  <label htmlFor={`inhib-r-${point.id}`} className="text-[8px] font-black uppercase tracking-widest cursor-pointer text-slate-500">
                    R Inhib
                  </label>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <Checkbox 
                  id={`inhib-mid-${point.id}`}
                  checked={statusMidline === 'Inhibited'}
                  onCheckedChange={(checked) => onUpdate('brainZones', point.name, checked ? 'Inhibited' : 'Clear')}
                  className="h-3.5 w-3.5 border-slate-400 rounded-none"
                />
                <label htmlFor={`inhib-mid-${point.id}`} className="text-[8px] font-black uppercase tracking-widest cursor-pointer text-slate-500">
                  Inhibited
                </label>
              </div>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => isLateralized ? (onUpdate('brainZones', point.name, 'Clear', 'L'), onUpdate('brainZones', point.name, 'Clear', 'R')) : onUpdate('brainZones', point.name, 'Clear')}
            className="h-5 px-2 text-[7px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 rounded-md"
          >
            <CheckCircle2 size={10} className="mr-1" /> Clear
          </Button>
        </div>
      </div>

      {!compact && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-slate-400">
                  <Hand size={10} /> Location
                </div>
                <p className="text-xs font-bold text-slate-700 leading-tight">{point.location}</p>
              </div>
              
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-slate-400">
                  <PlayCircle size={10} /> Stimulus
                </div>
                <p className="text-xs font-bold text-slate-700 leading-tight">{point.stimulus || point.technique || ""}</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            {showImage && imageUrl ? (
              <div className="aspect-video border border-slate-100 p-0.5 rounded-lg bg-slate-50 overflow-hidden">
                <img src={imageUrl} alt="Reference" className="w-full h-full object-cover rounded-md opacity-80" />
              </div>
            ) : showImage && (
              <div className="h-full min-h-[60px] border border-dashed border-slate-100 rounded-xl flex items-center justify-center text-slate-200 bg-slate-50/20">
                <Brain size={16} className="opacity-10" />
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export function BrainZoneAssessment({ 
  priorityPattern, 
  updatePriorityPattern,
  showImages,
  compactMode
}: { 
  priorityPattern?: string | null;
  updatePriorityPattern: (category: string, itemName: string, status: 'Clear' | 'Inhibited' | null, side?: 'L' | 'R') => Promise<void>;
  showImages: boolean;
  compactMode?: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [customImages, setCustomImages] = useState<Record<string, string | null>>({});

  const pattern = useMemo(() => safeParse(priorityPattern, {} as any), [priorityPattern]);
  const zonePattern = pattern.brainZones || {};

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        // Fetch secondary_image_url as requested
        const { data } = await supabase.from('brain_reflex_customizations').select('reflex_id, secondary_image_url').eq('user_id', user.id);
        const mapping: Record<string, string | null> = {};
        data?.forEach(item => {
          mapping[item.reflex_id] = item.secondary_image_url;
        });
        setCustomImages(mapping);
      } catch (err) {
        console.error("Error fetching zone images:", err);
      }
    };
    fetchImages();
  }, []);

  const brainZones = useMemo(() => 
    BRAIN_REFLEX_POINTS.filter(p => p.category !== 'Cranial Nerve'), 
  []);

  const filteredZones = useMemo(() => {
    return brainZones.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [brainZones, searchQuery]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 bg-muted/50 p-2 rounded-xl border border-border shadow-inner print:hidden mb-2">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="Search brain zones..."
            className="pl-8 h-7 rounded-lg border-border bg-card text-[10px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredZones.map((point) => (
          <ZoneTestItem 
            key={point.id}
            point={point}
            statusL={zonePattern[`${point.name} (L)`]}
            statusR={zonePattern[`${point.name} (R)`]}
            statusMidline={zonePattern[point.name]}
            isLateralized={point.lateralization !== 'Bilateral' && point.lateralization !== 'Mixed'}
            imageUrl={customImages[point.id]}
            showImage={showImages}
            compact={compactMode}
            onUpdate={updatePriorityPattern}
          />
        ))}
      </div>
    </div>
  );
}