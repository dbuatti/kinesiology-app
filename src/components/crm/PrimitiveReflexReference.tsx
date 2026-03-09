"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { PRIMITIVE_REFLEXES, PrimitiveReflex } from "@/data/primitive-reflex-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Zap, 
  Info, 
  Activity, 
  Sparkles,
  Baby,
  PlayCircle,
  ShieldAlert,
  Workflow,
  ListChecks,
  Upload,
  X,
  Loader2,
  Plus,
  Target,
  ImageIcon
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const filePath = `${user.id}/primitive_${reflexId}_${type}.${fileExt}`;

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

      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;
      const dbField = type === 'primary' ? 'image_url' : 'secondary_image_url';

      const { error: dbError } = await supabase
        .from('primitive_reflex_customizations')
        .upsert({
          user_id: user.id,
          reflex_id: reflexId,
          [dbField]: publicUrl 
        }, { 
          onConflict: 'user_id,reflex_id' 
        });

      if (dbError) throw dbError;

      onUploadComplete(cacheBustedUrl);
      showSuccess(`${type === 'primary' ? 'Main' : 'Secondary'} image updated!`);
    } catch (error: any) {
      console.error("[ReflexImageZone] Upload error:", error);
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
        .from('primitive_reflex_customizations')
        .update({ [dbField]: null })
        .eq('user_id', user.id)
        .eq('reflex_id', reflexId);

      if (error) throw error;

      onUploadComplete(null);
      showSuccess("Image removed.");
    } catch (error) {
      console.error("[ReflexImageZone] Remove error:", error);
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
      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
      className={cn(
        "relative group/image transition-all duration-300 flex flex-col items-center justify-center overflow-hidden outline-none cursor-pointer",
        isPrimary ? "aspect-video rounded-2xl border-2 border-dashed" : "w-24 h-24 rounded-2xl border-2 border-dashed bg-white/90 backdrop-blur-md shadow-xl",
        currentUrl ? "border-transparent" : "border-slate-200 bg-slate-50/50 hover:border-indigo-400 hover:bg-indigo-50/30",
        isDragging && "border-indigo-600 bg-indigo-100/80 scale-[1.02] ring-4 ring-indigo-500/20",
        isUploading && "opacity-50 pointer-events-none"
      )}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
      />
      
      {currentUrl ? (
        <>
          <img 
            key={currentUrl} 
            src={currentUrl} 
            alt="Reflex Reference" 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-2">
                <Button variant="secondary" size="icon" className="rounded-xl h-8 w-8 shadow-lg">
                  <Upload size={14} />
                </Button>
                <Button variant="destructive" size="icon" className="rounded-xl h-8 w-8 shadow-lg" onClick={handleRemove}>
                  <X size={14} />
                </Button>
              </div>
              <p className="text-[8px] font-black text-white uppercase tracking-widest">Click to Change</p>
            </div>
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
                {isPrimary ? "Click or Drop Main Image" : "Click or Drop Reflex"}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const PrimitiveReflexReference = () => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | 'All'>('All');
  const [customizations, setCustomizations] = useState<Record<string, ReflexImageData>>({});
  const [loadingImages, setLoadingImages] = useState(true);

  useEffect(() => {
    const fetchCustomizations = async () => {
      setLoadingImages(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('primitive_reflex_customizations')
          .select('reflex_id, image_url, secondary_image_url')
          .eq('user_id', user.id);
        
        const mapping: Record<string, ReflexImageData> = {};
        data?.forEach(item => { 
          const timestamp = Date.now();
          mapping[item.reflex_id] = {
            primaryUrl: item.image_url ? `${item.image_url}?t=${timestamp}` : null,
            secondaryUrl: item.secondary_image_url ? `${item.secondary_image_url}?t=${timestamp}` : null
          };
        });
        setCustomizations(mapping);
      } catch (err) {
        console.error("Failed to fetch customizations:", err);
      } finally {
        setLoadingImages(false);
      }
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

  const filteredReflexes = PRIMITIVE_REFLEXES.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) || 
                         r.stimulus.toLowerCase().includes(search.toLowerCase()) ||
                         r.inhibitionPattern.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || r.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', 'Foundational', 'Postural', 'Tactile'];

  return (
    <div className="space-y-12">
      {/* Theory & Process Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-lg rounded-[2.5rem] bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-10 opacity-5"><Workflow size={150} /></div>
          <CardHeader className="p-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Baby size={24} />
              </div>
              <div>
                <CardTitle className="text-3xl font-black">The Base Language of the Brain</CardTitle>
                <CardDescription className="text-slate-400 text-lg font-medium mt-1">Understanding Primitive Reflexes in Clinical Practice.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-10 pt-0 space-y-6 relative z-10">
            <p className="text-slate-300 leading-relaxed font-medium">
              Primitive reflexes are the foundational OS of the nervous system. They set up our movement and postural patterns, directly affecting cognitive and emotional development. While they typically disappear as the brain matures, retained reflexes can cause long-term physical and emotional health challenges.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                <h4 className="font-black text-indigo-400 text-xs uppercase tracking-widest mb-2">Sensory-Motor Role</h4>
                <p className="text-xs text-slate-400 leading-relaxed">Essential for navigating the world and developing complex motor skills.</p>
              </div>
              <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                <h4 className="font-black text-rose-400 text-xs uppercase tracking-widest mb-2">Retained Reflexes</h4>
                <p className="text-xs text-slate-400 leading-relaxed">Dis-inhibited reflexes often correlate with chronic health and emotional issues.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg rounded-[2.5rem] bg-indigo-50 border-2 border-indigo-100 overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-xl font-black flex items-center gap-3 text-indigo-900">
              <ListChecks size={24} className="text-indigo-600" /> Assessment Process
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-4">
            {[
              { step: 1, title: "Stimulate & Assess", desc: "Trigger the reflex and test the specific muscle pattern." },
              { step: 2, title: "Switch to IM", desc: "Test a clear Indicator Muscle; it should now inhibit." },
              { step: 3, title: "Find Pathway", desc: "Ask for Afferent or Efferent correction direction." },
              { step: 4, title: "Correct & Re-test", desc: "Apply correction and immediately re-assess the reflex." }
            ].map((item) => (
              <div key={item.step} className="flex gap-4 items-start">
                <span className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">{item.step}</span>
                <div>
                  <h5 className="font-black text-indigo-900 text-xs uppercase tracking-tight">{item.title}</h5>
                  <p className="text-[10px] text-indigo-700 font-medium leading-tight">{item.desc}</p>
                </div>
              </div>
            ))}
            <div className="pt-4 border-t border-indigo-200">
              <p className="text-[10px] text-indigo-600 font-bold italic">"Usually 1-3 corrections are needed to re-integrate the reflex."</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Search reflexes (e.g. Moro, ATNR, Babinski)..." 
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
          {filteredReflexes.map(reflex => {
            const data = customizations[reflex.id] || { primaryUrl: null, secondaryUrl: null };

            return (
              <Card key={reflex.id} className="border-none shadow-lg rounded-[2.5rem] bg-white hover:shadow-2xl transition-all group overflow-hidden">
                <CardHeader className={cn(
                  "pb-6 border-b transition-colors relative",
                  reflex.category === 'Foundational' ? "bg-indigo-50/50 border-indigo-100" :
                  reflex.category === 'Postural' ? "bg-emerald-50/50 border-emerald-100" :
                  "bg-amber-50/50 border-amber-100"
                )}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex gap-2 mb-2">
                        <Badge className={cn(
                          "border-none font-black text-[8px] uppercase tracking-widest",
                          reflex.category === 'Foundational' ? "bg-indigo-100 text-indigo-700" :
                          reflex.category === 'Postural' ? "bg-emerald-100 text-emerald-700" :
                          "bg-amber-100 text-amber-700"
                        )}>
                          {reflex.category} Reflex
                        </Badge>
                      </div>
                      <CardTitle className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {reflex.name}
                      </CardTitle>
                    </div>
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm text-white",
                      reflex.category === 'Foundational' ? "bg-indigo-600" :
                      reflex.category === 'Postural' ? "bg-emerald-600" :
                      "bg-amber-600"
                    )}>
                      <Baby size={24} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  {/* Images Section */}
                  <div className="relative group/container">
                    <ReflexImageZone 
                      reflexId={reflex.id} 
                      type="primary"
                      currentUrl={data.primaryUrl} 
                      onUploadComplete={(url) => updateLocalCustomization(reflex.id, 'primary', url)}
                    />
                    
                    <div className={cn(
                      "absolute bottom-3 right-3 transition-all duration-500 z-20",
                      data.secondaryUrl 
                        ? "opacity-60 group-hover/container:opacity-100 group-hover/container:scale-105" 
                        : "opacity-0 group-hover/container:opacity-100"
                    )}>
                      <ReflexImageZone 
                        reflexId={reflex.id} 
                        type="secondary"
                        currentUrl={data.secondaryUrl} 
                        onUploadComplete={(url) => updateLocalCustomization(reflex.id, 'secondary', url)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <PlayCircle size={12} className="text-indigo-500" /> Stimulus
                      </p>
                      <p className="text-sm font-bold text-slate-900 leading-relaxed">{reflex.stimulus}</p>
                    </div>
                    <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                      <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <ShieldAlert size={12} /> Inhibition Pattern
                      </p>
                      <p className="text-sm font-bold text-rose-900 leading-relaxed">{reflex.inhibitionPattern}</p>
                    </div>
                  </div>

                  {reflex.pearl && (
                    <div className="p-5 bg-amber-50 rounded-3xl border border-amber-100 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={40} className="text-amber-600" /></div>
                      <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Info size={14} /> Clinical Pearl
                      </p>
                      <p className="text-xs text-amber-900 font-bold leading-relaxed italic">
                        "{reflex.pearl}"
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PrimitiveReflexReference;