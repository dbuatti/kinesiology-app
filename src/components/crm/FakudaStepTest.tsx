"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Footprints, Info, Save, Loader2, RotateCcw, Plus, Target, Upload, X, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

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
    if (!confirm(`Remove this image?`)) return;

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
        "relative group transition-all duration-300 flex flex-col items-center justify-center overflow-hidden outline-none cursor-pointer flex-1 h-full",
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
  const [customImages, setCustomImages] = useState<{ primary: string | null, secondary: string | null }>({
    primary: "/images/fakuda-1.png",
    secondary: "/images/fakuda-2.png"
  });

  useEffect(() => {
    const fetchImages = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('brain_reflex_customizations').select('image_url, secondary_image_url').eq('user_id', user.id).eq('reflex_id', 'fakuda-test').maybeSingle();
      if (data) {
        setCustomImages({
          primary: data.image_url || "/images/fakuda-1.png",
          secondary: data.secondary_image_url || "/images/fakuda-2.png"
        });
      }
    };
    fetchImages();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from("appointments").update({ fakuda_notes: fakudaNotes || null }).eq("id", appointmentId);
      if (error) throw error;
      showSuccess("Fakuda Step Test assessment saved!");
      onUpdate();
    } catch (error: any) {
      showError(error.message || "Failed to save assessment.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Reset Fakuda Step Test notes?")) return;
    setLoading(true);
    try {
      await supabase.from("appointments").update({ fakuda_notes: null }).eq("id", appointmentId);
      setFakudaNotes('');
      showSuccess("Notes reset.");
      onUpdate();
    } catch (error: any) {
      showError("Failed to reset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-sm text-blue-900">
          <strong>Assessment Guide:</strong> This test assesses for imbalances in the midline or vestibule cerebellum. Observe rotation and movement patterns.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-green-50 border-2 border-green-200 rounded-xl overflow-hidden">
            <h3 className="text-lg font-bold text-green-900 p-4 flex items-center gap-2 border-b border-green-100">
              <Footprints size={20} className="text-green-600" />
              Test Protocol
            </h3>
            
            <div className="flex h-[400px] bg-white border-b border-green-100">
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
          
          <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-xl">
            <h4 className="font-bold text-amber-900 mb-2">Interpretation</h4>
            <ul className="space-y-1.5 text-sm text-amber-800 list-disc list-inside">
              <li><strong>Central:</strong> No imbalances.</li>
              <li><strong>Rotation:</strong> Indicates weakness on the side of rotation.</li>
              <li><strong>Move Forward:</strong> May indicate flexor dominance.</li>
            </ul>
          </div>
        </div>

        <div>
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
          <div className="flex gap-3 mt-4">
            <Button onClick={handleSave} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 h-12 font-semibold rounded-xl shadow-lg">
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Save Notes"}
            </Button>
            {initialFakudaNotes && (
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