"use client";

import React, { useState, useEffect } from "react";
import { PRIMITIVE_REFLEXES, PrimitiveReflex } from "@/data/primitive-reflex-data";
import { usePrimitiveReflexTests } from "@/hooks/usePrimitiveReflexTests";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Activity, 
  Zap, 
  Star, 
  Trophy, 
  Filter, 
  Info, 
  ChevronDown, 
  ChevronUp,
  Search,
  ImageIcon,
  Loader2,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";

interface PrimitiveReflexAssessmentProps {
  appointmentId: string;
}

export function PrimitiveReflexAssessment({ appointmentId }: PrimitiveReflexAssessmentProps) {
  const { tests, loading, updateTest } = usePrimitiveReflexTests(appointmentId);
  const [showOnlyInhibited, setShowOnlyInhibited] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Track multiple expanded reflexes
  const [expandedReflexes, setExpandedReflexes] = useState<Set<string>>(new Set());
  
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReflexes.map((reflex) => {
          const test = getTestData(reflex.id);
          const isExpanded = expandedReflexes.has(reflex.id);
          const images = customImages[reflex.id];
          const hasImages = images?.primary || images?.secondary;

          return (
            <Card 
              key={reflex.id} 
              className={cn(
                "transition-all duration-500 border-2 rounded-[2rem] overflow-hidden group",
                test.is_primary_priority ? "border-indigo-600 shadow-xl ring-4 ring-indigo-50" : 
                test.is_priority ? "border-amber-400 shadow-lg" : 
                test.is_inhibited ? "border-rose-200 bg-rose-50/30" : "border-slate-100 hover:border-indigo-200"
              )}
            >
              <CardHeader className="p-6 pb-4 flex flex-row items-start justify-between space-y-0">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110",
                    reflex.category === 'Foundational' ? 'bg-rose-500' : 
                    reflex.category === 'Postural' ? 'bg-amber-500' : 'bg-indigo-500'
                  )}>
                    <Activity size={24} />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {reflex.category}
                      </span>
                      <CardTitle className="text-lg font-black tracking-tight">{reflex.name}</CardTitle>
                    </div>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                      {reflex.developmentalWindow}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-xl text-slate-300 hover:text-indigo-600 hover:bg-indigo-50"
                  onClick={() => toggleReflex(reflex.id)}
                >
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </Button>
              </CardHeader>

              <CardContent className="p-6 pt-0 space-y-6">
                {hasImages && (
                  <div className={cn(
                    "grid gap-2 mb-4",
                    images.primary && images.secondary ? "grid-cols-2" : "grid-cols-1"
                  )}>
                    {images.primary && (
                      <div className="aspect-video rounded-xl overflow-hidden border border-slate-100 bg-slate-50 shadow-inner">
                        <img src={images.primary} alt="Primary Reference" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                    {images.secondary && (
                      <div className="aspect-video rounded-xl overflow-hidden border border-slate-100 bg-slate-50 shadow-inner">
                        <img src={images.secondary} alt="Secondary Reference" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-4 gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={test.is_inhibited ? "destructive" : "outline"}
                          size="sm"
                          className="h-10 px-0 flex flex-col gap-0.5 rounded-xl border-2"
                          onClick={() => updateTest(reflex.id, { is_inhibited: !test.is_inhibited })}
                        >
                          <Activity className="h-4 w-4" />
                          <span className="text-[8px] uppercase font-black tracking-widest">Reflex</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="rounded-xl font-bold text-xs">
                        <p>{test.is_inhibited ? "Mark as Clear" : "Mark as Inhibited"}</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={test.is_stimulated ? "secondary" : "outline"}
                          size="sm"
                          disabled={!test.is_inhibited}
                          className={cn(
                            "h-10 px-0 flex flex-col gap-0.5 rounded-xl border-2",
                            test.is_stimulated && "bg-indigo-600 text-white border-indigo-600"
                          )}
                          onClick={() => updateTest(reflex.id, { is_stimulated: !test.is_stimulated })}
                        >
                          <Zap className="h-4 w-4" />
                          <span className="text-[8px] uppercase font-black tracking-widest">Stim</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="rounded-xl font-bold text-xs">
                        <p>Toggle Stimulation</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "h-10 px-0 flex flex-col gap-0.5 rounded-xl border-2 transition-all",
                            test.is_priority && "bg-amber-500 text-white hover:bg-amber-600 border-amber-500 shadow-lg shadow-amber-100"
                          )}
                          onClick={() => updateTest(reflex.id, { is_priority: !test.is_priority })}
                        >
                          <Star className="h-4 w-4" />
                          <span className="text-[8px] uppercase font-black tracking-widest">Priority</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="rounded-xl font-bold text-xs">
                        <p>Mark as Priority</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={test.is_primary_priority ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "h-10 px-0 flex flex-col gap-0.5 rounded-xl border-2 transition-all",
                            test.is_primary_priority && "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100"
                          )}
                          onClick={() => updateTest(reflex.id, { is_primary_priority: !test.is_primary_priority })}
                        >
                          <Trophy className="h-4 w-4" />
                          <span className="text-[8px] uppercase font-black tracking-widest">Primary</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="rounded-xl font-bold text-xs">
                        <p>Mark as Primary Priority</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {isExpanded && (
                  <div className="space-y-6 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                          <Info size={12} className="text-indigo-500" /> Stimulus
                        </p>
                        <p className="text-xs font-bold text-slate-900 leading-relaxed">{reflex.stimulus}</p>
                      </div>
                      <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                          <Zap size={12} /> Inhibition Pattern
                        </p>
                        <p className="text-xs font-bold text-indigo-900 leading-relaxed">{reflex.inhibitionPattern}</p>
                      </div>
                    </div>

                    {reflex.pearl && (
                      <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={40} className="text-amber-600" /></div>
                        <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <Info size={14} /> Clinical Pearl
                        </p>
                        <p className="text-xs text-amber-900 font-bold leading-relaxed">
                          "{reflex.pearl}"
                        </p>
                      </div>
                    )}

                    {reflex.pageUrl && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full rounded-xl text-[10px] font-black uppercase tracking-widest"
                        onClick={() => window.open(reflex.pageUrl, '_blank')}
                      >
                        <ExternalLink className="mr-2 h-3 w-3" />
                        View Full Protocol
                      </Button>
                    )}
                  </div>
                )}

                <div className="relative group/notes">
                  <Input
                    placeholder="Add clinical notes..."
                    className="h-10 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all text-xs pr-10 font-medium"
                    value={test.notes || ""}
                    onChange={(e) => updateTest(reflex.id, { notes: e.target.value })}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/notes:text-indigo-500 transition-colors">
                    <ImageIcon size={16} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
