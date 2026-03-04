"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import LigamentImageUploader from './LigamentImageUploader';

interface LigamentImageData {
  category: string;
  image_index: number;
  image_url: string | null;
}

const LIGAMENT_CATEGORIES = {
  spinal: { title: "Spinal Ligaments", count: 2 },
  hip_shoulder: { title: "Hip and Shoulder Ligaments", count: 3 },
  knee_elbow: { title: "Knee and Elbow Ligaments", count: 4 },
  ankle_wrist: { title: "Ankle and Hand/Wrist Ligaments", count: 3 },
};

const LigamentReference = () => {
  const [images, setImages] = useState<Record<string, (string | null)[]>>({});
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data, error } = await supabase
          .from('ligament_images')
          .select('category, image_index, image_url')
          .eq('user_id', user.id);

        if (!error && data) {
          const imageMap: Record<string, (string | null)[]> = {};
          Object.keys(LIGAMENT_CATEGORIES).forEach(cat => {
            imageMap[cat] = Array((LIGAMENT_CATEGORIES as any)[cat].count).fill(null);
          });

          data.forEach(item => {
            if (imageMap[item.category] && item.image_index < imageMap[item.category].length) {
              const timestamp = Date.now();
              imageMap[item.category][item.image_index] = item.image_url ? `${item.image_url}?t=${timestamp}` : null;
            }
          });
          setImages(imageMap);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleUploadComplete = (category: string, index: number, url: string | null) => {
    setImages(prev => {
      const newCategoryImages = [...(prev[category] || [])];
      newCategoryImages[index] = url;
      return { ...prev, [category]: newCategoryImages };
    });
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;
  }

  if (!userId) {
    return <Alert variant="destructive">You must be logged in to manage images.</Alert>;
  }

  return (
    <div className="space-y-10">
      <Alert className="bg-blue-50 border-blue-100">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          Upload your own reference images for mechanoreceptive corrections. These will be available in the Pathway Logic Wizard.
        </AlertDescription>
      </Alert>

      {Object.entries(LIGAMENT_CATEGORIES).map(([key, { title, count }]) => (
        <div key={key} className="space-y-4">
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: count }).map((_, index) => (
              <LigamentImageUploader
                key={index}
                userId={userId}
                category={key}
                imageIndex={index}
                initialUrl={images[key]?.[index] || null}
                onUploadComplete={handleUploadComplete}
                title={`${title} #${index + 1}`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default LigamentReference;