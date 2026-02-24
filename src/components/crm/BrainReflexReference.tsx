"use client";

import React, { useState, useEffect, useCallback } from "react";
import { BRAIN_REFLEX_POINTS, BrainRegionCategory, BrainReflexPoint } from "@/data/brain-reflex-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, Brain, Zap, Info, 
  ArrowRightLeft, MousePointer2, 
  Layers, Activity, ShieldAlert,
  Upload, Image as ImageIcon, X, Loader2,
  Plus, Sparkles, Target
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";

const BUCKET_NAME = 'reflex-images';

interface ReflexImageData {
  primaryUrl: string | null;
  secondaryUrl: string | null;
}

const ReflexImageZone = ({ 
  reflexId, 
  type,
  currentUrl, 
  onUploadComplete 
}: { 
  reflexId: string; 
  type: 'primary' | 'secondary';
  currentUrl?: string | null; 
  onUploadComplete: (url: string | null) => void 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showError("Please upload an image file.");
      return;
    }

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const fileExt = file.name.split('.').pop() || 'png';
      const filePath = `${user.id}/${reflexId}_${type}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, { 
          upsert: true,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      const dbField = type === 'primary' ? 'image_url' : 'secondary_image_url';

      const { error: dbError } = await supabase
        .from('brain_reflex_customizations')
        .upsert({
          user_id: user.id,
          reflex_id: reflexId,
          [dbField]: publicUrl
        }, { 
          onConflict: 'user_id,reflex_id' 
        });

      if (dbError) throw dbError;

      onUploadComplete(publicUrl);
      showSuccess(`${type === 'primary' ? 'Main' : 'Reflex'} image saved!`);
    } catch (error: any) {
      showError(error.message || "Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Remove this ${type} image?`)) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dbField = type === 'primary' ? 'image_url' : 'secondary_image_url';

      const { error } = await supabase
        .from('brain_reflex_customizations')
        .update({ [dbField]: null })
        .eq('user_id', user.id)
        .eq('reflex_id', reflexId);

      if (error) throw error;

      onUploadComplete(null);
      showSuccess("Image removed.");
    } catch (error) {
      showError("Failed to remove image.");
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  }, [reflexId, type]);

  const isPrimary = type === 'primary';

  return (
    <div 
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
      onDrop={onDrop}
      className={cn(
        "relative group/image transition-all duration-300 flex flex-col items-center justify-center overflow-hidden outline-none",
        isPrimary ? "aspect-video rounded-2xl border-2 border-dashed" : "w-24 h-24 rounded-2xl border-2 border-dashed bg-white/90 backdrop-blur-md shadow-xl",
        currentUrl ? "border-transparent" : "border-slate-200 bg-slate-50/50 hover:border-indigo-400 hover:bg-indigo-50/30",
        isDragging && "border-indigo-600 bg-indigo-100/80 scale-[1.02] ring-4 ring-indigo-500/20",
        isUploading && "opacity-50 pointer-events-none"
      )}
    >
      {currentUrl ? (
        <>
          <img src={currentUrl} alt="Reflex Reference" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button variant="secondary" size="icon" className="rounded-xl h-8 w-8 shadow-lg" onClick={(e) => { e.stopPropagation(); onUploadComplete(null); }}>
              <ImageIcon size={14} />
            </Button>
            <Button variant="destructive" size="icon" className="rounded-xl h-8 w-8 shadow-lg" onClick={handleRemove}>
              <X size={14} />
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center p-3 space-y-2">
          {isUploading ? (
            <Loader2 className="mx-auto text-indigo-500 animate-spin" size={isPrimary ? 24 : 16} />
          ) : (
            <>
              <div className={cn(
                "rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mx-auto text-slate-400 group-hover/image:text-indigo-600 group-hover/image:scale-110 transition-all",
                isPrimary ? "w-12 h-12" : "w-8 h-8"
              )}>
                {isPrimary ? <Plus size={24} /> : <Target size={18} />}
              </div>
              <p className={cn("font-black text-slate-500 uppercase tracking-widest", isPrimary ? "text-[10px]" : "text-[8px]")}>
                {isPrimary ? "Drop Main Image" : "Drop Reflex Point"}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const BrainReflexReference = () => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<BrainRegionCategory | 'All'>('All');
  const [customizations, setCustomizations] = useState<Record<string, ReflexImageData>>({});

  useEffect(() => {
    const fetchCustomizations = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('brain_reflex_customizations')
          .select('reflex_id, image_url, secondary_image_url')
          .eq('user_id', user.id);
        
        const mapping: Record<string, ReflexImageData> = {};
        data?.forEach(item => { 
          mapping[item.reflex_id] = {
            primaryUrl: item.image_url || null,
            secondaryUrl: item.secondary_image_url || null
          };
        });
        setCustomizations(mapping);
      } catch (err) {}
    };
    fetchCustomizations();
  }, []);

  const updateLocalCustomization = (reflexId: string, type: 'primary' | 'secondary', url: string | null) => {
    setCustomizations(prev => {
      const current = prev[reflexId] || { primaryUrl: null, secondaryUrl: null };
      return {
        ...prev,
        [reflexId]: {
          ...current,
          [type === 'primary' ? 'primaryUrl' : 'secondaryUrl']: url
        }
      };
    });
  };

  const filteredPoints = BRAIN_REFLEX_POINTS.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                         p.location.toLowerCase().includes(search.toLowerCase()) ||
                         (p.acupoint && p.acupoint.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories: (BrainRegionCategory | 'All')[] = ['All', 'Cortical', 'Subcortical', 'Cranial Nerve'];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Search reflex areas (e.g. Limbic, M1, GV16)..." 
            className="pl-12 bg-white border-slate-200 rounded-2xl h-14 shadow-sm font-medium focus:ring-2 focus:ring-indigo-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {categories.map(cat => (
            <Button 
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "rounded-xl h-14 px-6 font-black text-[10px] uppercase tracking-widest whitespace-nowrap transition-all",
                selectedCategory === cat ? "bg-slate-900 shadow-lg" : "border-slate-200 bg-white hover:bg-slate-50"
              )}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredPoints.map(point => {
          const data = customizations[point.id] || { primaryUrl: null, secondaryUrl: null };
          
          return (
            <Card key={point.id} className="border-none shadow-lg rounded-[2.5rem] bg-white hover:shadow-2xl transition-all group overflow-hidden">
              <CardHeader className={cn(
                "pb-4 border-b transition-colors",
                point.category === 'Cortical' ? "bg-purple-50/50 border-purple-100" :
                point.category === 'Subcortical' ? "bg-indigo-50/50 border-indigo-100" :
                "bg-emerald-50/50 border-emerald-100"
              )}>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex gap-2 mb-2">
                      <Badge className={cn(
                        "border-none font-black text-[8px] uppercase tracking-widest",
                        point.category === 'Cortical' ? "bg-purple-100 text-purple-700" :
                        point.category === 'Subcortical' ? "bg-indigo-100 text-indigo-700" :
                        "bg-emerald-100 text-emerald-700"
                      )}>
                        {point.category}
                      </Badge>
                      <Badge variant="outline" className="border-slate-200 text-slate-500 font-black text-[8px] uppercase tracking-widest">
                        {point.lateralization}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {point.name}
                    </CardTitle>
                  </div>
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-all",
                    point.category === 'Cortical' ? "bg-purple-600 text-white" :
                    point.category === 'Subcortical' ? "bg-indigo-600 text-white" :
                    "bg-emerald-600 text-white"
                  )}>
                    {point.category === 'Cortical' ? <Brain size={20} /> : 
                     point.category === 'Subcortical' ? <Layers size={20} /> : 
                     <Zap size={20} />}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Image Container with Hover Logic */}
                <div className="relative group/container">
                  <ReflexImageZone 
                    reflexId={point.id} 
                    type="primary"
                    currentUrl={data.primaryUrl} 
                    onUploadComplete={(url) => updateLocalCustomization(point.id, 'primary', url)}
                  />
                  
                  {/* Secondary Image Zone - Bottom Right */}
                  <div className={cn(
                    "absolute bottom-3 right-3 transition-all duration-500 z-20",
                    data.secondaryUrl 
                      ? "opacity-60 group-hover/container:opacity-100 group-hover/container:scale-105" 
                      : "opacity-0 group-hover/container:opacity-100"
                  )}>
                    <ReflexImageZone 
                      reflexId={point.id} 
                      type="secondary"
                      currentUrl={data.secondaryUrl} 
                      onUploadComplete={(url) => updateLocalCustomization(point.id, 'secondary', url)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Location & Technique</p>
                    <p className="text-sm font-bold text-slate-700 leading-relaxed">{point.location}</p>
                    {point.technique && <p className="text-xs text-slate-500 mt-1 italic">{point.technique}</p>}
                  </div>
                  
                  {point.pearl && (
                    <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-10"><Sparkles size={32} className="text-indigo-600" /></div>
                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <Info size={10} /> Clinical Pearl
                      </p>
                      <p className="text-xs text-indigo-900 font-bold leading-relaxed">{point.pearl}</p>
                    </div>
                  )}

                  {point.acupoint && (
                    <Badge className="bg-amber-50 text-amber-700 border-amber-100 text-[9px] font-black px-2 py-0.5 rounded-md">
                      Acupoint: {point.acupoint}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default BrainReflexReference;