"use client";

import React, { useState, useEffect } from "react";
import { PRIMITIVE_REFLEXES, PrimitiveReflex } from "@/data/primitive-reflex-data";
import { usePrimitiveReflexTests } from "@/hooks/usePrimitiveReflexTests";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Activity,
  Zap,
  Info,
  Search,
  ImageIcon,
  Loader2,
  Sparkles,
  ExternalLink,
  FileText,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface PrimitiveReflexAssessmentProps {
  appointmentId: string;
}

export function PrimitiveReflexAssessment({ appointmentId }: PrimitiveReflexAssessmentProps) {
  const { tests, loading, updateTest } = usePrimitiveReflexTests(appointmentId);
  const [showOnlyInhibited, setShowOnlyInhibited] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Track multiple expanded reflexes
  const [expandedReflexes, setExpandedReflexes] = useState<Set<string>>(
    new Set(PRIMITIVE_REFLEXES.map(r => r.id))
  );

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

  const toggleReflex = (id: string) => {
    setExpandedReflexes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getTestData = (reflexId: string) => {
    return tests.find(t => t.reflex_id === reflexId) || {
      is_inhibited: false,
      is_stimulated: false,
      is_priority: false,
      is_primary_priority: false,
      notes: ""
    };
  };

  const filteredReflexes = PRIMITIVE_REFLEXES.filter(reflex => {
    const test = getTestData(reflex.id);
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/30 p-4 rounded-2xl border border-border shadow-inner">
        <div className="flex items-center gap-4">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reflexes..."
              className="pl-10 h-10 rounded-xl border-border bg-card"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-3 px-4 border-l border-border">
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
          <Badge variant="outline" className="bg-card border-border font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full">
            {tests.filter(t => t.is_inhibited).length} Inhibited
          </Badge>
          <Badge variant="outline" className="bg-card border-border font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full">
            {tests.filter(t => t.is_priority).length} Priority
          </Badge>
          {tests.some(t => t.is_primary_priority) && (
            <Badge className="bg-indigo-600 text-white border-none font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full shadow-lg shadow-indigo-100">
              Primary Selected
            </Badge>
          )}
        </div>
      </div>

      {filteredReflexes.map((reflex) => {
        const test = getTestData(reflex.id);
        const images = customImages[reflex.id];
        const hasImages = images?.primary || images?.secondary;
        const id = `reflex-section-${reflex.id}`;

        return (
          <section
            key={reflex.id}
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
                    {reflex.name}
                  </h2>
                  <Badge variant="outline" className="border-black text-black font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-none">
                    {reflex.category} • {reflex.developmentalWindow}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Primitive Reflex Assessment</p>
              </div>

              <div className="flex items-center gap-4 print:hidden">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`inhib-reflex-${reflex.id}`}
                    checked={test.is_inhibited}
                    onCheckedChange={(checked) => updateTest(reflex.id, { is_inhibited: !!checked })}
                    className="h-5 w-5 border-black rounded-none"
                  />
                  <label htmlFor={`inhib-reflex-${reflex.id}`} className="text-[10px] font-black uppercase tracking-widest cursor-pointer">
                    Inhibited
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`priority-reflex-${reflex.id}`}
                    checked={test.is_priority}
                    onCheckedChange={(checked) => updateTest(reflex.id, { is_priority: !!checked })}
                    className="h-5 w-5 border-black rounded-none"
                  />
                  <label htmlFor={`priority-reflex-${reflex.id}`} className="text-[10px] font-black uppercase tracking-widest cursor-pointer">
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
                    onClick={() => updateTest(reflex.id, { is_primary_priority: true })}
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
                    <Zap size={12} /> Stimulus
                  </div>
                  <p className="text-sm font-bold text-slate-900 leading-relaxed">{reflex.stimulus}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <Activity size={12} /> Inhibition Pattern
                  </div>
                  <p className="text-sm font-bold text-slate-900 leading-relaxed">{reflex.inhibitionPattern}</p>
                </div>
                {reflex.pearl && (
                  <div className="pt-4">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2">
                      <Sparkles size={12} /> Clinical Pearl
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {reflex.pearl}
                    </p>
                  </div>
                )}
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
                    onChange={(e) => updateTest(reflex.id, { notes: e.target.value })}
                    className="w-full min-h-[80px] bg-slate-50 border-none rounded-xl p-4 text-sm font-medium focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                    placeholder="Document findings..."
                  />
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {filteredReflexes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed rounded-[3rem] bg-muted/10 border-border">
          <div className="w-20 h-20 rounded-3xl bg-card flex items-center justify-center mb-6 shadow-xl">
            <Filter className="h-10 w-10 text-muted-foreground/20" />
          </div>
          <p className="text-foreground font-black text-xl">No reflexes match your filters</p>
          <Button 
            variant="link" 
            className="mt-2 text-indigo-600 font-bold"
            onClick={() => {
              setShowOnlyInhibited(false);
              setSearchQuery("");
            }}
          >
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );
}
