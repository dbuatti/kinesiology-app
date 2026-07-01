
import React, { useState, useEffect, useCallback, useRef } from "react";
import { BRAIN_REFLEX_POINTS, BrainRegionCategory, BrainReflexPoint } from "@/data/brain-reflex-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, Brain, Zap, Info, 
  ArrowRightLeft, MousePointer2, 
  Layers, Activity, ShieldAlert,
  Upload, Image as ImageIcon, X, Loader2,
  Plus, Sparkles, Target, Maximize2, Hand, PlayCircle,
  ChevronDown, ChevronUp, ChevronRight, Map as MapIcon,
  Printer
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import BrainReflexModal from "./BrainReflexModal";
import { Link } from "react-router-dom";

const BUCKET_NAME = 'reflex-images';

interface ReflexImageData {
  primaryUrl: string | null;
  secondaryUrl: string | null;
  tertiaryUrl: string | null;
}

const ReflexImageZone = ({ 
  reflexId, 
  type,
  currentUrl, 
  onUploadComplete 
}: { 
  reflexId: string; 
  type: 'primary' | 'secondary' | 'tertiary';
  currentUrl?: string | null; 
  onUploadComplete: (url: string | null) => void 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<{type: string} | null>(null);

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

      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;
      const dbField = type === 'primary' ? 'image_url' : type === 'secondary' ? 'secondary_image_url' : 'tertiary_image_url';

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

      onUploadComplete(cacheBustedUrl);
      showSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} image updated!`);
    } catch (error: any) {
      console.error("[ReflexImageZone] Upload error:", error);
      showError(error.message || "Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const executeDelete = async () => {
    if (!deleteTarget?.type) return;
    const currentType = deleteTarget.type;
    setDeleteTarget(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dbField = currentType === 'primary' ? 'image_url' : currentType === 'secondary' ? 'secondary_image_url' : 'tertiary_image_url';

      const { error } = await supabase
        .from('brain_reflex_customizations')
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
        isPrimary ? "aspect-video rounded-xl border-2 border-dashed" : "w-24 h-24 rounded-xl border-2 border-dashed bg-white/90 backdrop-blur-md shadow-sm",
        currentUrl ? "border-transparent" : "border-border bg-muted/50 hover:border-chart-primary hover:bg-muted/30",
        isDragging && "border-chart-primary bg-chart-primary/80 scale-[1.02] ring-4 ring-chart-primary/20",
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
                <Button variant="secondary" size="icon" className="rounded-xl h-8 w-8 shadow-sm">
                  <Upload size={14} />
                </Button>
                <Button variant="destructive" size="icon" className="rounded-xl h-8 w-8 shadow-sm" onClick={(e) => { e.stopPropagation(); setDeleteTarget({type}); }}>
                  <X size={14} />
                </Button>
              </div>
              <p className="text-[10px] font-medium text-white uppercase tracking-wider">Click to Change</p>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center p-3 space-y-2">
          {isUploading ? (
            <Loader2 className="mx-auto text-chart-primary animate-spin" size={isPrimary ? 24 : 16} />
          ) : (
            <>
              <div className={cn(
                "rounded-xl bg-white shadow-sm border border-border flex items-center justify-center mx-auto text-muted-foreground group-hover/image:text-chart-primary group-hover/image:scale-110 transition-all",
                isPrimary ? "w-12 h-12" : "w-8 h-8"
              )}>
                <Plus size={24} />
              </div>
              <p className={cn("font-medium text-muted-foreground uppercase tracking-wider text-[10px]")}>
                {isPrimary ? "Click or Drop Main Image" : `Add ${type}`}
              </p>
            </>
          )}
        </div>
      )}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Remove image?"
        description={`This will remove this ${deleteTarget?.type} image.`}
        onConfirm={executeDelete}
      />
    </div>
  );
};

const BrainReflexReference = () => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<BrainRegionCategory | 'All'>('All');
  const [customizations, setCustomizations] = useState<Record<string, ReflexImageData>>({});
  const [selectedPoint, setSelectedPoint] = useState<BrainReflexPoint | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);

  useEffect(() => {
    const fetchCustomizations = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('brain_reflex_customizations')
          .select('reflex_id, image_url, secondary_image_url, tertiary_image_url')
          .eq('user_id', user.id);
        
        const mapping: Record<string, ReflexImageData> = {};
        data?.forEach(item => { 
          const timestamp = Date.now();
          mapping[item.reflex_id] = {
            primaryUrl: item.image_url ? `${item.image_url}?t=${timestamp}` : null,
            secondaryUrl: item.secondary_image_url ? `${item.secondary_image_url}?t=${timestamp}` : null,
            tertiaryUrl: item.tertiary_image_url ? `${item.tertiary_image_url}?t=${timestamp}` : null
          };
        });
        setCustomizations(mapping);
      } catch (err) {
        console.error("Failed to fetch customizations:", err);
      }
    };
    fetchCustomizations();
  }, []);

  const updateLocalCustomization = (reflexId: string, type: 'primary' | 'secondary' | 'tertiary', url: string | null) => {
    setCustomizations(prev => {
      const current = prev[reflexId] || { primaryUrl: null, secondaryUrl: null, tertiaryUrl: null };
      return {
        ...prev,
        [reflexId]: {
          ...current,
          [type === 'primary' ? 'primaryUrl' : type === 'secondary' ? 'secondaryUrl' : 'tertiaryUrl']: url
        }
      };
    });
  };

  const handleCardClick = (point: BrainReflexPoint) => {
    setSelectedPoint(point);
    setModalOpen(true);
  };

  const filteredPoints = BRAIN_REFLEX_POINTS.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                         p.location.toLowerCase().includes(search.toLowerCase()) ||
                         (p.acupoint && p.acupoint.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories: (BrainRegionCategory | 'All')[] = ['All', 'Cortical', 'Subcortical', 'Cranial Nerve'];

  const corticalCount = BRAIN_REFLEX_POINTS.filter(p => p.category === 'Cortical').length;
  const subcorticalCount = BRAIN_REFLEX_POINTS.filter(p => p.category === 'Subcortical').length;

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-3xl font-semibold text-foreground tracking-tight">Brain Zone Reference</h2>
            <p className="text-muted-foreground font-medium max-w-2xl">
              A simplified, therapeutic zone-based guide to common neurological pathways — hand placements, acupoints, key functions, and correction protocols for FNH clinical practice.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="px-4 py-2 bg-muted dark:bg-indigo-900/20 rounded-xl border border-border dark:border-indigo-900/30 text-center">
              <p className="text-[10px] font-medium text-chart-primary uppercase tracking-wider">Cortical</p>
              <p className="text-xl font-semibold text-chart-primary dark:text-indigo-400">{corticalCount}</p>
            </div>
            <div className="px-4 py-2 bg-muted dark:bg-rose-900/20 rounded-xl border border-border dark:border-rose-900/30 text-center">
              <p className="text-[10px] font-medium text-chart-destructive uppercase tracking-wider">Sub-Cortical</p>
              <p className="text-xl font-semibold text-chart-destructive dark:text-rose-400">{subcorticalCount}</p>
            </div>
          </div>
        </div>

        {/* Reference Map Card */}
        <Card className="border-none shadow-sm rounded-xl bg-slate-900 text-white overflow-hidden">
          <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-semibold flex items-center gap-3">
                <MapIcon size={24} className="text-chart-primary" /> Brain Zone Reference Map
              </CardTitle>
              <CardDescription className="text-muted-foreground font-medium">
                Use this diagram to locate zones on the skull before applying each protocol
              </CardDescription>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="ghost" 
                asChild
                className="text-chart-primary hover:text-white hover:bg-white/10 rounded-xl font-medium text-xs uppercase tracking-wider"
              >
                <Link to="/resources/brain-zones/print">
                  <Printer size={18} className="mr-2" /> Print Reference
                </Link>
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setMapExpanded(!mapExpanded)}
                className="text-chart-primary hover:text-white hover:bg-white/10 rounded-xl font-medium text-xs uppercase tracking-wider"
              >
                {mapExpanded ? <ChevronUp size={18} className="mr-2" /> : <Maximize2 size={18} className="mr-2" />}
                {mapExpanded ? "Collapse map" : "Expand map"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <div className={cn(
              "relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 transition-all duration-700",
              mapExpanded ? "aspect-auto" : "aspect-[21/9]"
            )}>
              <img 
                src="/images/mechanoreceptive/homunculus.png" 
                alt="FNH Brain Zone Reference Map" 
                className="w-full h-full object-contain opacity-80 hover:opacity-100 transition-opacity"
              />
              {!mapExpanded && (
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent flex items-end justify-center pb-8">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.4em]">FNH Brain Zone Reference Map — all zones labelled with acupoints and hand placements</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              placeholder="Search zones, functions, acupoints..." 
              className="pl-12 bg-white border-border rounded-xl h-14 shadow-sm font-medium focus:ring-2 focus:ring-chart-primary"
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
                  "rounded-xl h-14 px-6 font-medium text-[10px] uppercase tracking-wider whitespace-nowrap transition-all",
                  selectedCategory === cat ? "bg-slate-900 shadow-sm" : "border-border bg-white hover:bg-muted"
                )}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPoints.map(point => {
            const data = customizations[point.id] || { primaryUrl: null, secondaryUrl: null, tertiaryUrl: null };
            
            return (
              <Card 
                key={point.id} 
                className="border-none shadow-sm rounded-xl bg-white hover:shadow-2xl transition-all group overflow-hidden cursor-pointer flex flex-col"
                onClick={() => handleCardClick(point)}
              >
                <CardHeader className={cn(
                  "pb-4 border-b transition-colors relative",
                  point.category === 'Cortical' ? "bg-muted/50 border-border" :
                  point.category === 'Subcortical' ? "bg-muted/50 border-border" :
                  "bg-muted/50 border-border"
                )}>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground shadow-sm">
                      <Maximize2 size={14} />
                    </div>
                  </div>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex gap-2 mb-2">
                        <Badge className={cn(
                          "border-none font-medium text-[10px] uppercase tracking-wider",
                          point.category === 'Cortical' ? "bg-chart-primary/10 text-chart-primary" :
                          point.category === 'Subcortical' ? "bg-chart-destructive/10 text-chart-destructive" :
                          "bg-chart-emerald/10 text-chart-emerald"
                        )}>
                          {point.category}
                        </Badge>
                        {point.acupoint && (
                          <Badge variant="outline" className="border-border text-muted-foreground font-medium text-[10px] uppercase tracking-wider">
                            {point.acupoint}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl font-semibold text-foreground group-hover:text-chart-primary transition-colors">
                        {point.name}
                      </CardTitle>
                    </div>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm bg-primary text-primary-foreground">
                      {point.category === 'Cortical' ? <Brain size={20} /> : 
                       point.category === 'Subcortical' ? <Layers size={20} /> : 
                       <Zap size={20} />}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6 flex-1 flex flex-col">
                  <div className="relative group/container" onClick={(e) => e.stopPropagation()}>
                    <ReflexImageZone 
                      reflexId={point.id} 
                      type="primary"
                      currentUrl={data.primaryUrl} 
                      onUploadComplete={(url) => updateLocalCustomization(point.id, 'primary', url)}
                    />
                    
                    <div className="absolute bottom-3 right-3 flex flex-col gap-2 transition-all duration-500 z-20">
                      <div className={cn(
                        "transition-all duration-500",
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
                  </div>

                  <div className="space-y-4 flex-1">
                    <div className="p-4 bg-muted rounded-xl border border-border">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Hand size={10} /> Location
                      </p>
                      <p className="text-xs font-medium text-foreground leading-relaxed">{point.location}</p>
                    </div>

                    {point.functions && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Key Functions</p>
                        <div className="space-y-1">
                          {point.functions.map(f => (
                            <div key={f} className="flex items-start gap-2 text-[10px] font-medium text-muted-foreground">
                              <div className="w-1 h-1 rounded-full bg-chart-primary mt-1.5 shrink-0" />
                              {f}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-border flex items-center justify-between">
                    <span className="text-[10px] font-medium text-chart-primary uppercase tracking-wider">View full details</span>
                    <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <BrainReflexModal 
        point={selectedPoint}
        primaryUrl={selectedPoint ? customizations[selectedPoint.id]?.primaryUrl : null}
        secondaryUrl={selectedPoint ? customizations[selectedPoint.id]?.secondaryUrl : null}
        tertiaryUrl={selectedPoint ? customizations[selectedPoint.id]?.tertiaryUrl : null}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
};

export default BrainReflexReference;