"use client";

import React, { useState, useEffect } from "react";
import { PRIMITIVE_REFLEXES, PrimitiveReflex } from "@/data/primitive-reflex-data";
import { usePrimitiveReflexTests } from "@/hooks/usePrimitiveReflexTests";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Zap, 
  ImageIcon, 
  Loader2, 
  Activity, 
  Hand, 
  FileText,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ReflexTestItemProps {
  reflex: PrimitiveReflex;
  test: any;
  images: { primary: string | null, secondary: string | null } | undefined;
  onUpdate: (reflexId: string, updates: any) => Promise<void>;
}

const ReflexTestItem = ({ reflex, test, images, onUpdate }: ReflexTestItemProps) => {
  const [localNotes, setLocalNotes] = useState(test.notes || "");
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (test.notes !== undefined && test.notes !== localNotes) {
      setLocalNotes(test.notes || "");
    }
  }, [test.notes]);

  const handleNotesChange = (val: string) => {
    setLocalNotes(val);
    
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(() => {
      onUpdate(reflex.id, { notes: val });
    }, 1000);
  };

  const hasImages = images?.primary || images?.secondary;

  return (
    <section className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-serif font-bold text-slate-900">
            {reflex.name}
          </h2>
          <Badge variant="outline" className="border-slate-200 text-slate-500 font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-none">
            {reflex.category} • {reflex.developmentalWindow}
          </Badge>
        </div>

        <div className="flex items-center gap-6 print:hidden">
          <div className="flex items-center gap-2">
            <Checkbox 
              id={`inhib-reflex-${reflex.id}`}
              checked={test.is_inhibited}
              onCheckedChange={(checked) => onUpdate(reflex.id, { is_inhibited: !!checked })}
              className="h-4 w-4 border-slate-400 rounded-none"
            />
            <label htmlFor={`inhib-reflex-${reflex.id}`} className="text-[9px] font-black uppercase tracking-widest cursor-pointer text-slate-600">
              Inhibited
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox 
              id={`priority-reflex-${reflex.id}`}
              checked={test.is_priority}
              onCheckedChange={(checked) => onUpdate(reflex.id, { is_priority: !!checked })}
              className="h-4 w-4 border-slate-400 rounded-none"
            />
            <label htmlFor={`priority-reflex-${reflex.id}`} className="text-[9px] font-black uppercase tracking-widest cursor-pointer text-slate-600">
              Priority
            </label>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onUpdate(reflex.id, { is_primary_priority: !test.is_primary_priority })}
            className={cn(
              "h-6 px-2 text-[8px] font-black uppercase tracking-widest transition-all",
              test.is_primary_priority ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-900"
            )}
          >
            {test.is_primary_priority ? "Primary" : "Set Primary"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                <Zap size={12} /> Stimulus
              </div>
              <p className="text-sm font-bold text-slate-800 leading-tight">{reflex.stimulus}</p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                <Activity size={12} /> Inhibition Pattern
              </div>
              <p className="text-sm font-bold text-slate-800 leading-tight">{reflex.inhibitionPattern}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
              <FileText size={12} /> Assessment Notes
            </div>
            <textarea 
              value={localNotes}
              onChange={(e) => handleNotesChange(e.target.value)}
              className="w-full min-h-[60px] bg-slate-50/50 border-none rounded-xl p-4 text-sm font-medium focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
              placeholder="Document findings..."
            />
          </div>
        </div>

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
};

export function PrimitiveReflexAssessment({ appointmentId }: PrimitiveReflexAssessmentProps) {
  const { tests, loading, updateTest } = usePrimitiveReflexTests(appointmentId);
  const [showOnlyInhibited, setShowOnlyInhibited] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
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
        console.error("Error fetching reflex images:", err);
      } finally {
        setLoadingImages(false);
      }
    };

    fetchImages();
  }, []);

  const filteredReflexes = PRIMITIVE_REFLEXES.filter(reflex => {
    const test = tests.find(t => t.reflex_id === reflex.id) || { is_inhibited: false };
    const matchesSearch = reflex.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         reflex.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesInhibited = showOnlyInhibited ? test.is_inhibited : true;
    return matchesSearch && matchesInhibited;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Assessment...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Filter Bar - Hidden on Print */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner print:hidden">
        <div className="flex items-center gap-4">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search reflexes..."
              className="pl-10 h-10 rounded-xl border-slate-200 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-3 px-4 border-l border-slate-200">
            <Switch
              id="inhibited-filter-reflex"
              checked={showOnlyInhibited}
              onCheckedChange={setShowOnlyInhibited}
              className="data-[state=checked]:bg-rose-600"
            />
            <Label htmlFor="inhibited-filter-reflex" className="text-[10px] font-black uppercase tracking-widest cursor-pointer text-slate-500">
              Show Only Inhibited
            </Label>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-white border-slate-200 font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full">
            {tests.filter(t => t.is_inhibited).length} Inhibited
          </Badge>
        </div>
      </div>

      {filteredReflexes.map((reflex) => (
        <ReflexTestItem 
          key={reflex.id}
          reflex={reflex}
          test={tests.find(t => t.reflex_id === reflex.id) || {}}
          images={customImages[reflex.id]}
          onUpdate={updateTest}
        />
      ))}
    </div>
  );
}