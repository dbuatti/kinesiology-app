"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getMuscleInfo } from "@/data/muscle-info-data";
import { getChannelByName } from "@/data/tcm-channel-data";
import { VAGUS_ASSOCIATIONS } from "@/data/vagus-data";
import { isMeridianPeakNow } from "@/utils/crm-utils";
import { 
  Dumbbell, 
  Activity, 
  Zap, 
  Info, 
  Heart, 
  Apple,
  Move,
  Brain,
  AlertCircle,
  Link as LinkIcon,
  RefreshCw,
  Clock,
  Layers,
  ArrowRightLeft,
  PlayCircle,
  FileText,
  Upload,
  X,
  Loader2,
  Plus,
  Target,
  ImageIcon,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";

const BUCKET_NAME = 'muscle-images';

interface MuscleInfoModalProps {
  muscleName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MuscleImageZone = ({ 
  muscleName, 
  type,
  currentUrl, 
  onUploadComplete 
}: { 
  muscleName: string; 
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
      const filePath = `${user.id}/${muscleName.replace(/\s+/g, '_')}_${type}.${fileExt}`;

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
        .from('muscle_customizations')
        .upsert({
          user_id: user.id,
          muscle_name: muscleName,
          [dbField]: publicUrl 
        }, { 
          onConflict: 'user_id,muscle_name' 
        });

      if (dbError) throw dbError;

      onUploadComplete(cacheBustedUrl);
      showSuccess(`${type === 'primary' ? 'Main' : 'Secondary'} image updated!`);
    } catch (error: any) {
      console.error("[MuscleImageZone] Upload error:", error);
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
        .from('muscle_customizations')
        .update({ [dbField]: null })
        .eq('user_id', user.id)
        .eq('muscle_name', muscleName);

      if (error) throw error;

      onUploadComplete(null);
      showSuccess("Image removed.");
    } catch (error) {
      console.error("[MuscleImageZone] Remove error:", error);
      showError("Failed to remove image.");
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  }, [muscleName, type]);

  const isPrimary = type === 'primary';

  return (
    <div 
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
      onDrop={onDrop}
      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
      className={cn(
        "relative group/image transition-all duration-300 flex flex-col items-center justify-center overflow-hidden outline-none cursor-pointer",
        "aspect-video rounded-2xl border-2 border-dashed",
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
            alt="Muscle Reference" 
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
            <Loader2 className="mx-auto text-indigo-500 animate-spin" size={24} />
          ) : (
            <>
              <div className={cn(
                "rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mx-auto text-slate-400 group-hover/image:text-indigo-600 group-hover/image:scale-110 transition-all",
                isPrimary ? "w-12 h-12" : "w-8 h-8"
              )}>
                {isPrimary ? <Plus size={24} /> : <Target size={18} />}
              </div>
              <p className={cn("font-black text-slate-500 uppercase tracking-widest", isPrimary ? "text-[10px]" : "text-[8px]")}>
                {isPrimary ? "Add Main Image" : "Add Secondary Image"}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const MuscleInfoModal = ({ muscleName, open, onOpenChange }: MuscleInfoModalProps) => {
  const [currentTime, setCurrentTime] = useState(new Date().getHours());
  const [customImages, setCustomImages] = useState<{ primaryUrl: string | null, secondaryUrl: string | null }>({ primaryUrl: null, secondaryUrl: null });
  const [loadingImages, setLoadingImages] = useState(false);

  useEffect(() => {
    if (open && muscleName) {
      setCurrentTime(new Date().getHours());
      fetchCustomizations();
    }
  }, [open, muscleName]);

  const fetchCustomizations = async () => {
    if (!muscleName) return;
    setLoadingImages(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const baseName = muscleName.replace(/ \([LR]\)$/, '');
      const { data } = await supabase
        .from('muscle_customizations')
        .select('image_url, secondary_image_url')
        .eq('user_id', user.id)
        .eq('muscle_name', baseName)
        .maybeSingle();
      
      if (data) {
        const timestamp = Date.now();
        setCustomImages({
          primaryUrl: data.image_url ? `${data.image_url}?t=${timestamp}` : null,
          secondaryUrl: data.secondary_image_url ? `${data.secondary_image_url}?t=${timestamp}` : null
        });
      } else {
        setCustomImages({ primaryUrl: null, secondaryUrl: null });
      }
    } catch (err) {
      console.error("Failed to fetch muscle customizations:", err);
    } finally {
      setLoadingImages(false);
    }
  };

  const info = useMemo(() => muscleName ? getMuscleInfo(muscleName) : null, [muscleName]);
  const channel = useMemo(() => info?.meridian ? getChannelByName(info.meridian) : undefined, [info]);

  const lovettPartner = useMemo(() => {
    if (!muscleName) return null;
    const baseName = muscleName.replace(/ \([LR]\)$/, '');
    const association = VAGUS_ASSOCIATIONS.find(a => a.muscle.toLowerCase() === baseName.toLowerCase());
    if (!association) return null;
    
    const partnerAssoc = VAGUS_ASSOCIATIONS.find(a => a.spinalSegment === association.reciprocatingSegment);
    return {
      segment: association.spinalSegment,
      partnerSegment: association.reciprocatingSegment,
      partnerMuscle: partnerAssoc?.muscle || "Unknown",
      partnerOrgan: partnerAssoc?.organ || "Unknown"
    };
  }, [muscleName]);

  if (!muscleName || !info) return null;

  const isPeak = channel ? isMeridianPeakNow(channel.peakTime, currentTime) : false;

  const SectionHeader = ({ icon: Icon, title, color }: { icon: any, title: string, color: string }) => (
    <h4 className={cn("text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 mb-3", color)}>
      <Icon size={14} /> {title}
    </h4>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[95vh] rounded-[2.5rem] overflow-hidden p-0 border-none shadow-2xl">
        <DialogHeader className="p-0">
          <div className={cn("p-8 text-white transition-colors relative", channel ? channel.color.split(' ')[0] : "bg-indigo-600")}>
            {isPeak && (
              <div className="absolute top-6 right-6 animate-pulse">
                <Badge className="bg-white text-slate-900 border-none font-black text-[8px] uppercase tracking-widest px-2 py-0.5">
                  <Zap size={10} className="mr-1 fill-amber-400 text-amber-400" /> Peak Now
                </Badge>
              </div>
            )}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg">
                <Dumbbell size={32} />
              </div>
              <div>
                <DialogTitle className="text-3xl font-black tracking-tight">{info.name}</DialogTitle>
                <DialogDescription className="sr-only">Clinical details and associations for {info.name}</DialogDescription>
                <div className="flex gap-2 mt-2">
                  <Badge className="bg-white/20 text-white border-none font-bold text-[10px] uppercase tracking-widest">
                    {info.meridian || 'General'} Meridian
                  </Badge>
                  {info.myotome && (
                    <Badge className="bg-white/20 text-white border-none font-bold text-[10px] uppercase tracking-widest">
                      Myotome: {info.myotome}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-10 max-h-[70vh] overflow-y-auto">
          {/* Image Customization Section */}
          <section className="space-y-4">
            <SectionHeader icon={ImageIcon} title="Reference Images" color="text-indigo-600" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <MuscleImageZone 
                muscleName={info.name} 
                type="primary" 
                currentUrl={customImages.primaryUrl} 
                onUploadComplete={(url) => setCustomImages(prev => ({ ...prev, primaryUrl: url }))} 
              />
              <MuscleImageZone 
                muscleName={info.name} 
                type="secondary" 
                currentUrl={customImages.secondaryUrl} 
                onUploadComplete={(url) => setCustomImages(prev => ({ ...prev, secondaryUrl: url }))} 
              />
            </div>
          </section>

          {/* Educational Content: Description & Video */}
          {(info.description || info.videoUrl) && (
            <section className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {info.description && (
                  <div className="space-y-3">
                    <SectionHeader icon={FileText} title="Muscle Overview" color="text-slate-600" />
                    <p className="text-sm text-slate-600 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      {info.description}
                    </p>
                  </div>
                )}
                {info.videoUrl && (
                  <div className="space-y-3">
                    <SectionHeader icon={PlayCircle} title="Technique Video" color="text-rose-600" />
                    <div className="aspect-video rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm bg-slate-900">
                      <iframe
                        src={info.videoUrl}
                        title={`${info.name} Technique`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Testing Position - Highlighted */}
          <section className="p-6 bg-amber-50 rounded-[2rem] border-2 border-amber-100 space-y-3">
            <SectionHeader icon={Target} title="Testing Position" color="text-amber-600" />
            <p className="text-base font-bold text-amber-900 leading-relaxed">
              {info.testingPosition}
            </p>
          </section>

          {/* Lovett-Brother Partner */}
          {lovettPartner && (
            <section>
              <SectionHeader icon={ArrowRightLeft} title="Spinal / Lovett-Brother Relationship" color="text-rose-600" />
              <div className="p-5 bg-rose-50 rounded-2xl border-2 border-rose-100 flex items-center justify-between gap-6">
                <div className="text-center flex-1">
                  <p className="text-[10px] font-black text-rose-400 uppercase mb-1">Current Segment</p>
                  <p className="text-2xl font-black text-rose-900">{lovettPartner.segment}</p>
                  <p className="text-[10px] font-bold text-rose-600">{muscleName}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-rose-200">
                  <RefreshCw size={20} className="text-rose-400" />
                </div>
                <div className="text-center flex-1">
                  <p className="text-[10px] font-black text-rose-400 uppercase mb-1">Lovett Partner</p>
                  <p className="text-2xl font-black text-rose-900">{lovettPartner.partnerSegment}</p>
                  <p className="text-[10px] font-bold text-rose-600">{lovettPartner.partnerMuscle}</p>
                </div>
              </div>
            </section>
          )}

          {/* Meridian Insights */}
          {channel && (
            <section>
              <SectionHeader icon={Layers} title="Meridian Insights" color="text-indigo-600" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={cn(
                  "p-5 rounded-2xl border space-y-3 transition-all",
                  isPeak ? "bg-amber-50 border-amber-200 shadow-inner" : "bg-indigo-50 border-indigo-100"
                )}>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Peak Activity</p>
                    <Clock size={14} className={isPeak ? "text-amber-500" : "text-indigo-400"} />
                  </div>
                  <p className={cn("text-lg font-black", isPeak ? "text-amber-900" : "text-indigo-900")}>{channel.peakTime}</p>
                  <p className="text-xs text-indigo-700 leading-relaxed font-medium">
                    {channel.description}
                  </p>
                </div>
                <div className="p-5 bg-rose-50 rounded-2xl border border-rose-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Emotional Context</p>
                    <Heart size={14} className="text-rose-400" />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {channel.emotions.slice(0, 8).map(e => (
                      <Badge key={e} variant="outline" className="bg-white border-rose-100 text-rose-600 text-[9px] font-bold">
                        {e}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Clinical Indications */}
          {info.clinicalIndications && (
            <section>
              <SectionHeader icon={AlertCircle} title="Clinical Indications" color="text-rose-500" />
              <div className="p-5 bg-rose-50 rounded-2xl border border-rose-100">
                <p className="text-sm font-bold text-rose-900 leading-relaxed">
                  {info.clinicalIndications}
                </p>
              </div>
            </section>
          )}

          {/* Function & Kinetic Chain */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {info.function && (
              <section>
                <SectionHeader icon={Move} title="Primary Function" color="text-indigo-500" />
                <p className="text-sm text-slate-700 font-medium leading-relaxed">
                  {info.function}
                </p>
              </section>
            )}
            {info.kineticChain && (
              <section>
                <SectionHeader icon={LinkIcon} title="Kinetic Chain" color="text-blue-500" />
                <p className="text-sm text-slate-700 font-medium leading-relaxed">
                  {info.kineticChain}
                </p>
              </section>
            )}
          </div>

          {/* Neurological Section */}
          <section className="space-y-4">
            <SectionHeader icon={Brain} title="Neurological Control" color="text-purple-500" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {info.brainstemControl && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Brainstem Control</p>
                  <p className="text-sm font-bold text-slate-900">{info.brainstemControl}</p>
                </div>
              )}
              {info.nerveSupply && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Nerve Supply</p>
                  <p className="text-sm font-bold text-slate-900">{info.nerveSupply}</p>
                </div>
              )}
            </div>
          </section>

          {/* Structural Section */}
          {(info.ligamentsJoints || info.spinalFixation) && (
            <section className="space-y-4">
              <SectionHeader icon={Zap} title="Structural & Mechanical" color="text-amber-500" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {info.ligamentsJoints && (
                  <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                    <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Ligaments / Joints</p>
                    <p className="text-xs font-bold text-slate-800 leading-relaxed">{info.ligamentsJoints}</p>
                  </div>
                )}
                {info.spinalFixation && (
                  <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                    <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Spinal Fixation</p>
                    <p className="text-sm font-black text-slate-900">{info.spinalFixation}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Physiological & Nutritional */}
          <section className="space-y-4">
            <SectionHeader icon={Activity} title="Physiological & Nutritional" color="text-emerald-500" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {info.organGland && (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Organ / Gland</p>
                  <p className="text-sm font-black text-emerald-900">{info.organGland}</p>
                </div>
              )}
              {info.nutrition && (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Apple size={10} /> Nutritional Support
                  </p>
                  <p className="text-xs font-bold text-emerald-900 leading-relaxed">{info.nutrition}</p>
                </div>
              )}
            </div>
          </section>

          {/* Testing & Reflexes */}
          <section className="space-y-4 pt-6 border-t border-slate-100">
            <SectionHeader icon={Info} title="Testing & Reflexes" color="text-slate-400" />
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {info.neurolymphatic && (
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Neurolymphatic</p>
                    <p className="text-xs text-slate-700 font-bold">{info.neurolymphatic}</p>
                  </div>
                )}
                {info.neurovascular && (
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Neurovascular</p>
                    <p className="text-xs text-slate-700 font-bold">{info.neurovascular}</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Clinical Pearl */}
          {info.pearl && (
            <section>
              <div className="p-8 bg-slate-900 text-white rounded-[2.5rem] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10"><Sparkles size={80} /></div>
                <SectionHeader icon={Sparkles} title="Clinical Pearl" color="text-purple-400" />
                <p className="text-lg font-medium leading-relaxed relative z-10">
                  "{info.pearl}"
                </p>
              </div>
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MuscleInfoModal;