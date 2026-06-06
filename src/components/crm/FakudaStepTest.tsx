
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Footprints, Info, Save, Loader2, RotateCcw, Plus, Target, Upload, X, ImageIcon, CheckCircle2, Zap, RefreshCw, ArrowRightLeft, Move } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { safeParse } from "@/utils/safe-json";

const BUCKET_NAME = 'reflex-images';

interface FakudaStepTestProps {
  appointmentId: string;
  initialFakudaNotes: string | null | undefined;
  onUpdate: () => void;
}

const ImageZone = ({ 
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
      const filePath = `${user.id}/fakuda_${type}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;
      const dbField = type === 'primary' ? 'image_url' : 'secondary_image_url';

      const { error: dbError } = await supabase
        .from('brain_reflex_customizations')
        .upsert({
          user_id: user.id,
          reflex_id: 'fakuda-test',
          [dbField]: publicUrl 
        }, { onConflict: 'user_id,reflex_id' });

      if (dbError) throw dbError;

      onUploadComplete(cacheBustedUrl);
      showSuccess("Image updated!");
    } catch (error: any) {
      showError(error.message || "Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Remove this image?")) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const dbField = type === 'primary' ? 'image_url' : 'secondary_image_url';
      const { error } = await supabase
        .from('brain_reflex_customizations')
        .update({ [dbField]: null })
        .eq('user_id', user.id)
        .eq('reflex_id', 'fakuda-test');

      if (error) throw error;
      onUploadComplete(null);
      showSuccess("Image removed.");
    } catch (error) {
      showError("Failed to remove image.");
    }
  };

  return (
    <div 
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); const file = e.dataTransfer.files?.[0]; if (file) handleUpload(file); }}
      onClick={() => fileInputRef.current?.click()}
      className={cn(
        "relative group transition-all duration-300 flex flex-col items-center justify-center overflow-hidden outline-none cursor-pointer h-full w-full",
        currentUrl ? "bg-white" : "bg-slate-50 hover:bg-slate-100",
        isDragging && "bg-indigo-50 ring-2 ring-indigo-500 ring-inset",
        isUploading && "opacity-50 pointer-events-none"
      )}
    >
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleUpload(file); }} />
      {currentUrl ? (
        <>
          <img src={currentUrl} alt="Fakuda Reference" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button variant="secondary" size="icon" className="h-8 w-8 rounded-xl shadow-lg"><Upload size={14} /></Button>
            <Button variant="destructive" size="icon" className="h-8 w-8 rounded-xl shadow-lg" onClick={handleRemove}><X size={14} /></Button>
          </div>
        </>
      ) : (
        <div className="text-center p-2 space-y-1">
          {isUploading ? (
            <Loader2 className="animate-spin text-indigo-500 mx-auto" size={20} />
          ) : (
            <>
              <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-100 flex items-center justify-center mx-auto text-slate-300 group-hover:text-indigo-500 transition-colors">
                <Plus size={18} />
              </div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Add {type}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const FakudaStepTest = ({ 
  appointmentId, 
  initialFakudaNotes,
  onUpdate 
}: FakudaStepTestProps) => {
  const [loading, setLoading] = useState(false);
  const [fakudaNotes, setFakudaNotes] = useState(initialFakudaNotes || '');
  const [currentStatus, setCurrentStatus] = useState<'Clear' | 'Inhibited' | 'Recheck' | null>(null);
  const [customImages, setCustomImages] = useState<{ primary: string | null, secondary: string | null }>({
    primary: "/images/fakuda-1.png",
    secondary: "/images/fakuda-2.png"
  });

  // Structured Fields
  const [driftDirection, setDriftDirection] = useState<string>("");
  const [angleRotation, setAngleRotation] = useState<string>("");
  const [distanceDisplaced, setDistanceDisplaced] = useState<string>("");

  useEffect(() => {
    const fetchInitialState = async () => {
      try {
        const { data: app } = await supabase.from('appointments').select('priority_pattern').eq('id', appointmentId).single();
        if (app?.priority_pattern) {
          const pattern = safeParse(app.priority_pattern, {} as any);
          const status = pattern.brainZones?.['Fakuda Step Test'];
          if (status) setCurrentStatus(status as any);
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: images } = await supabase.from('brain_reflex_customizations').select('image_url, secondary_image_url').eq('user_id', user.id).eq('reflex_id', 'fakuda-test').maybeSingle();
        if (images) {
          setCustomImages({
            primary: images.image_url || "/images/fakuda-1.png",
            secondary: images.secondary_image_url || "/images/fakuda-2.png"
          });
        }
      } catch (err) {
        console.error("Error fetching initial state:", err);
      }
    };
    fetchInitialState();
  }, [appointmentId]);

  // Parse initial notes to pre-fill structured fields if possible
  useEffect(() => {
    if (initialFakudaNotes) {
      const driftMatch = initialFakudaNotes.match(/Drift Direction:\s*([^\n,]+)/i);
      const angleMatch = initialFakudaNotes.match(/Angle of Rotation:\s*([^\n,°]+)/i);
      const distMatch = initialFakudaNotes.match(/Distance Displaced:\s*([^\n,cm]+)/i);

      if (driftMatch) setDriftDirection(driftMatch[1].trim());
      if (angleMatch) setAngleRotation(angleMatch[1].trim());
      if (distMatch) setDistanceDisplaced(distMatch[1].trim());
    }
  }, [initialFakudaNotes]);

  const generateNotes = (drift: string, angle: string, dist: string) => {
    let generated = "FUKUDA STEP TEST ASSESSMENT:\n";
    if (drift) generated += `- Drift Direction: ${drift}\n`;
    if (angle) generated += `- Angle of Rotation: ${angle}°\n`;
    if (dist) generated += `- Distance Displaced: ${dist} cm\n`;
    
    // Append any existing manual notes that aren't part of the structured template
    const lines = fakudaNotes.split('\n');
    const manualLines = lines.filter(line => 
      !line.startsWith("FUKUDA STEP TEST ASSESSMENT:") &&
      !line.startsWith("- Drift Direction:") &&
      !line.startsWith("- Angle of Rotation:") &&
      !line.startsWith("- Distance Displaced:")
    );
    
    if (manualLines.length > 0) {
      const manualText = manualLines.join('\n').trim();
      if (manualText) {
        generated += `\nAdditional Observations:\n${manualText}`;
      }
    }
    
    setFakudaNotes(generated);
  };

  const handleDriftChange = (val: string) => {
    setDriftDirection(val);
    generateNotes(val, angleRotation, distanceDisplaced);
  };

  const handleAngleChange = (val: string) => {
    setAngleRotation(val);
    generateNotes(driftDirection, val, distanceDisplaced);
  };

  const handleDistanceChange = (val: string) => {
    setDistanceDisplaced(val);
    generateNotes(driftDirection, angleRotation, val);
  };

  const handleSetStatus = async (status: 'Clear' | 'Inhibited' | 'Recheck') => {
    setLoading(true);
    try {
      const { data: app } = await supabase.from('appointments').select('priority_pattern').eq('id', appointmentId).single();
      const pattern = safeParse(app?.priority_pattern, {} as any);
      
      if (!pattern.brainZones) pattern.brainZones = {};
      pattern.brainZones['Fakuda Step Test'] = status;

      const { error } = await supabase
        .from("appointments")
        .update({ 
          priority_pattern: JSON.stringify(pattern),
          fakuda_notes: fakudaNotes || null 
        })
        .eq("id", appointmentId);

      if (error) throw error;
      setCurrentStatus(status);
      showSuccess(`Fakuda result logged as ${status}`);
      onUpdate();
    } catch (error: any) {
      showError(error.message || "Failed to log result.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from("appointments").update({ fakuda_notes: fakudaNotes || null }).eq("id", appointmentId);
      if (error) throw error;
      showSuccess("Notes saved.");
      onUpdate();
    } catch (error: any) {
      showError(error.message || "Failed to save notes.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Reset Fukuda Step Test data?")) return;
    setLoading(true);
    try {
      const { data: app } = await supabase.from('appointments').select('priority_pattern').eq('id', appointmentId).single();
      const pattern = safeParse(app?.priority_pattern, {} as any);
      if (pattern.brainZones) delete pattern.brainZones['Fakuda Step Test'];

      await supabase.from("appointments").update({ 
        fakuda_notes: null,
        priority_pattern: JSON.stringify(pattern)
      }).eq("id", appointmentId);
      
      setFakudaNotes('');
      setDriftDirection('');
      setAngleRotation('');
      setDistanceDisplaced('');
      setCurrentStatus(null);
      showSuccess("Data reset.");
      onUpdate();
    } catch (error: any) {
      showError(error.message || "Failed to reset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assessment Result</p>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={() => handleSetStatus('Clear')}
              className={cn(
                "h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                currentStatus === 'Clear' ? "bg-emerald-600 text-white shadow-lg" : "bg-white text-slate-600 border-slate-200 hover:bg-emerald-50"
              )}
            >
              <CheckCircle2 size={14} className="mr-2" /> Clear
            </Button>
            <Button 
              size="sm" 
              onClick={() => handleSetStatus('Inhibited')}
              className={cn(
                "h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                currentStatus === 'Inhibited' ? "bg-rose-600 text-white shadow-lg" : "bg-white text-slate-600 border-slate-200 hover:bg-rose-50"
              )}
            >
              <Zap size={14} className="mr-2" /> Inhibited
            </Button>
            <Button 
              size="sm" 
              onClick={() => handleSetStatus('Recheck')}
              className={cn(
                "h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                currentStatus === 'Recheck' ? "bg-amber-500 text-white shadow-lg" : "bg-white text-slate-600 border-slate-200 hover:bg-amber-50"
              )}
            >
              <RefreshCw size={14} className="mr-2" /> Recheck
            </Button>
          </div>
        </div>
        {currentStatus && (
          <Badge className="bg-indigo-600 text-white border-none font-black text-[8px] uppercase tracking-widest px-3 py-1 rounded-full">
            Auto-synced to Align phase
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-green-50 border-2 border-green-200 rounded-xl overflow-hidden">
            <h3 className="text-lg font-bold text-green-900 p-4 flex items-center gap-2 border-b border-green-100">
              <Footprints size={20} className="text-green-600" />
              Test Protocol
            </h3>
            
            <div className="grid grid-cols-2 h-[200px] bg-white border-b border-green-100">
              <ImageZone 
                reflexId="fakuda-test" 
                type="primary" 
                currentUrl={customImages.primary} 
                onUploadComplete={(url) => setCustomImages(prev => ({ ...prev, primary: url || "/images/fakuda-1.png" }))} 
              />
              <ImageZone 
                reflexId="fakuda-test" 
                type="secondary" 
                currentUrl={customImages.secondary} 
                onUploadComplete={(url) => setCustomImages(prev => ({ ...prev, secondary: url || "/images/fakuda-2.png" }))} 
              />
            </div>

            <div className="p-4">
              <ol className="space-y-2 text-sm text-green-900 list-decimal list-inside">
                <li>Client stands with eyes closed and shoulders flexed to 90 degrees.</li>
                <li>Instruct the client to march on the spot for 30-60 seconds.</li>
                <li>Observe final position relative to start position.</li>
              </ol>
            </div>
          </div>

          {/* Structured Clinical Fields */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ArrowRightLeft size={14} className="text-indigo-500" /> Clinical Metrics
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Drift Direction</Label>
                <ToggleGroup type="single" value={driftDirection} onValueChange={handleDriftChange} className="justify-start gap-1">
                  <ToggleGroupItem value="Left" className="rounded-lg border border-slate-200 text-xs font-bold px-3 py-1.5">L</ToggleGroupItem>
                  <ToggleGroupItem value="Right" className="rounded-lg border border-slate-200 text-xs font-bold px-3 py-1.5">R</ToggleGroupItem>
                  <ToggleGroupItem value="Forward" className="rounded-lg border border-slate-200 text-xs font-bold px-3 py-1.5">Fwd</ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Angle of Rotation</Label>
                <div className="relative">
                  <Input type="number" placeholder="e.g. 30" value={angleRotation} onChange={(e) => handleAngleChange(e.target.value)} className="h-10 rounded-xl pr-8 text-xs font-bold" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">°</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Distance Displaced</Label>
                <div className="relative">
                  <Input type="number" placeholder="e.g. 50" value={distanceDisplaced} onChange={(e) => handleDistanceChange(e.target.value)} className="h-10 rounded-xl pr-10 text-xs font-bold" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">cm</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Label htmlFor="fakudaNotes" className="text-base font-bold text-slate-900 mb-2 block">
            Fakuda Step Test Notes:
          </Label>
          <Textarea
            id="fakudaNotes"
            placeholder="Document observations..."
            value={fakudaNotes}
            onChange={(e) => setFakudaNotes(e.target.value)}
            className="min-h-[350px] resize-none"
          />
          <div className="flex gap-3">
            <Button onClick={handleSaveNotes} disabled={loading} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white h-12 font-semibold rounded-xl shadow-lg">
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Save Notes"}
            </Button>
            {(initialFakudaNotes || currentStatus) && (
              <Button variant="outline" onClick={handleReset} disabled={loading} className="h-12 px-6 rounded-xl border-red-200 text-red-600 hover:bg-red-50">
                <RotateCcw size={16} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FakudaStepTest;