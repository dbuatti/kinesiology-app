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
  Plus
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";

// Sub-component for the Image Upload/Display Zone
const ReflexImageZone = ({ 
  reflexId, 
  initialUrl, 
  onUploadComplete 
}: { 
  reflexId: string; 
  initialUrl?: string; 
  onUploadComplete: (url: string | null) => void 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(initialUrl || null);

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
      const fileName = `${user.id}/${reflexId}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `reflex-images/${fileName}`;

      // 1. Upload to Storage (using a public bucket 'practitioner-assets')
      const { error: uploadError } = await supabase.storage
        .from('practitioner-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('practitioner-assets')
        .getPublicUrl(filePath);

      // 3. Save to Database
      const { error: dbError } = await supabase
        .from('brain_reflex_customizations')
        .upsert({
          user_id: user.id,
          reflex_id: reflexId,
          image_url: publicUrl
        });

      if (dbError) throw dbError;

      setImageUrl(publicUrl);
      onUploadComplete(publicUrl);
      showSuccess("Reference image saved!");
    } catch (error: any) {
      console.error("Upload error:", error);
      showError(error.message || "Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Remove this reference image?")) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('brain_reflex_customizations')
        .delete()
        .eq('user_id', user.id)
        .eq('reflex_id', reflexId);

      setImageUrl(null);
      onUploadComplete(null);
      showSuccess("Image removed.");
    } catch (error) {
      showError("Failed to remove image.");
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  }, [reflexId]);

  const onPaste = useCallback((e: React.ClipboardEvent) => {
    const item = e.clipboardData.items[0];
    if (item?.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (file) handleUpload(file);
    }
  }, [reflexId]);

  return (
    <div 
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      onPaste={onPaste}
      tabIndex={0} // Make it focusable for paste
      className={cn(
        "relative group/image aspect-video rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center overflow-hidden",
        imageUrl ? "border-transparent" : "border-slate-200 bg-slate-50/50 hover:border-indigo-300 hover:bg-indigo-50/30",
        isDragging && "border-indigo-500 bg-indigo-100/50 scale-[0.98]",
        isUploading && "opacity-50 pointer-events-none"
      )}
    >
      {imageUrl ? (
        <>
          <img src={imageUrl} alt="Reflex Reference" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button variant="secondary" size="sm" className="rounded-xl font-bold h-8" onClick={() => setImageUrl(null)}>
              <ImageIcon size={14} className="mr-2" /> Change
            </Button>
            <Button variant="destructive" size="icon" className="rounded-xl h-8 w-8" onClick={handleRemove}>
              <X size={14} />
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center p-4 space-y-2">
          {isUploading ? (
            <Loader2 className="mx-auto text-indigo-500 animate-spin" size={24} />
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mx-auto text-slate-400 group-hover/image:text-indigo-500 group-hover/image:scale-110 transition-all">
                <Plus size={20} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Drop or Paste Image
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
  const [customizations, setCustomizations] = useState<Record<string, string>>({});
  const [loadingImages, setLoadingImages] = useState(true);

  useEffect(() => {
    const fetchCustomizations = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('brain_reflex_customizations')
          .select('reflex_id, image_url')
          .eq('user_id', user.id);

        if (error) throw error;

        const mapping: Record<string, string> = {};
        data?.forEach(item => {
          if (item.image_url) mapping[item.reflex_id] = item.image_url;
        });
        setCustomizations(mapping);
      } catch (err) {
        console.error("Error fetching reflex images:", err);
      } finally {
        setLoadingImages(false);
      }
    };

    fetchCustomizations();
  }, []);

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPoints.map(point => (
          <Card key={point.id} className="border-none shadow-md rounded-[2rem] bg-white hover:shadow-xl transition-all group overflow-hidden">
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
              {/* Reference Image Zone */}
              <ReflexImageZone 
                reflexId={point.id} 
                initialUrl={customizations[point.id]} 
                onUploadComplete={(url) => {
                  if (url) setCustomizations(prev => ({ ...prev, [point.id]: url }));
                  else setCustomizations(prev => {
                    const next = { ...prev };
                    delete next[point.id];
                    return next;
                  });
                }}
              />

              <div className="space-y-3">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Location</p>
                  <p className="text-sm font-bold text-slate-700 leading-relaxed">{point.location}</p>
                </div>
                
                {point.technique && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <MousePointer2 size={10} /> Technique
                    </p>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">{point.technique}</p>
                  </div>
                )}

                {point.acupoint && (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-amber-50 text-amber-700 border-amber-100 text-[9px] font-black px-2 py-0.5 rounded-md">
                      Acupoint: {point.acupoint}
                    </Badge>
                  </div>
                )}

                {point.clinicalNote && (
                  <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Info size={10} /> Clinical Insight
                    </p>
                    <p className="text-xs text-indigo-900 font-bold leading-relaxed italic">"{point.clinicalNote}"</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Clinical Logic Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
        <Card className="border-none shadow-lg rounded-[2.5rem] bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10"><ArrowRightLeft size={100} /></div>
          <CardHeader>
            <CardTitle className="text-xl font-black flex items-center gap-3">
              <ArrowRightLeft size={24} className="text-purple-400" /> Cortical Logic
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 relative z-10">
            <p className="text-sm text-slate-300 leading-relaxed">
              Cortical pathways generally <span className="text-purple-400 font-black">CROSS OVER</span>. Stimulating the body on one side sends information to the opposing cortex.
            </p>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-xs font-bold text-slate-400">Example:</p>
              <p className="text-sm font-medium">Stimulating the right eyebrow (Insular) affects the left insular cortex.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg rounded-[2.5rem] bg-indigo-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10"><Activity size={100} /></div>
          <CardHeader>
            <CardTitle className="text-xl font-black flex items-center gap-3">
              <Activity size={24} className="text-teal-400" /> Subcortical Logic
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 relative z-10">
            <p className="text-sm text-slate-300 leading-relaxed">
              Subcortical pathways are generally <span className="text-teal-400 font-black">IPSILATERAL</span>. Information stays on the same side of the body.
            </p>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-xs font-bold text-slate-400">Example:</p>
              <p className="text-sm font-medium">The cerebellum and brainstem primarily process information from the same side of the body.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {filteredPoints.length === 0 && (
        <div className="text-center py-32 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
          <Search size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-black text-slate-900">No reflex areas found</h3>
          <p className="text-slate-500 mt-2">Try searching for a different region or category.</p>
        </div>
      )}
    </div>
  );
};

export default BrainReflexReference;