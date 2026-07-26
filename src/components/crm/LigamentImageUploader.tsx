
import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from '@/utils/toast';
import ConfirmDialog from "@/components/shared/ConfirmDialog";

const BUCKET_NAME = 'ligament-images';

interface LigamentImageUploaderProps {
  userId: string;
  category: string;
  imageIndex: number;
  initialUrl: string | null;
  onUploadComplete: (category: string, index: number, url: string | null) => void;
  title: string;
}

const LigamentImageUploader = ({ userId, category, imageIndex, initialUrl, onUploadComplete, title }: LigamentImageUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showError("Please upload an image file.");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop() || 'png';
      const filePath = `${userId}/${category}_${imageIndex}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;
      
      const { error: dbError } = await supabase
        .from('ligament_images')
        .upsert({
          user_id: userId,
          category: category,
          image_index: imageIndex,
          image_url: publicUrl
        }, { onConflict: 'user_id,category,image_index' });

      if (dbError) throw dbError;

      onUploadComplete(category, imageIndex, cacheBustedUrl);
      showSuccess(`${title} image updated!`);
    } catch (error: any) {
      showError(error.message || "Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const executeDelete = async () => {
    setShowDeleteConfirm(false);
    try {
      const { error } = await supabase
        .from('ligament_images')
        .update({ image_url: null })
        .match({ user_id: userId, category: category, image_index: imageIndex });

      if (error) throw error;

      onUploadComplete(category, imageIndex, null);
      showSuccess("Image removed.");
    } catch (error: any) {
      showError("Failed to remove image.");
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  }, [userId, category, imageIndex]);

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{title}</p>
      <div
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative group aspect-video transition-all duration-300 flex flex-col items-center justify-center overflow-hidden outline-none cursor-pointer rounded-2xl border-2 border-dashed",
          initialUrl ? "border-transparent" : "border-border bg-muted/50 hover:border-indigo-400 hover:bg-indigo-50/30",
          isDragging && "border-indigo-600 bg-indigo-100/80 scale-[1.02] ring-4 ring-indigo-500/20",
          isUploading && "opacity-50 pointer-events-none"
        )}
      >
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleUpload(file); }} />
        {initialUrl ? (
          <>
            <img key={initialUrl} src={initialUrl} alt={title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button variant="secondary" size="icon" className="rounded-xl h-8 w-8 shadow-lg"><Upload size={14} /></Button>
              <Button variant="destructive" size="icon" className="rounded-xl h-8 w-8 shadow-lg" onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}><X size={14} /></Button>
            </div>
          </>
        ) : (
          <div className="text-center p-3 space-y-2">
            {isUploading ? (
              <Loader2 className="mx-auto text-indigo-500 animate-spin" size={24} />
            ) : (
              <>
                <div className="w-12 h-12 rounded-xl bg-card shadow-sm border border-border/50 flex items-center justify-center mx-auto text-muted-foreground group-hover:text-indigo-600 group-hover:scale-110 transition-all">
                  <ImageIcon size={24} />
                </div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Click or Drop Image</p>
              </>
            )}
          </div>
        )}
      </div>
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Remove image?"
        description="This will remove this image."
        onConfirm={executeDelete}
      />
    </div>
  );
};

export default LigamentImageUploader;