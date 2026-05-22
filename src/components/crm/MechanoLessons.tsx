"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Activity, 
  Sparkles, 
  BookOpen, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  HelpCircle, 
  Lightbulb, 
  Shield, 
  Link as LinkIcon, 
  Layers, 
  Compass, 
  PlayCircle, 
  CheckCircle,
  Smile,
  Heart,
  Zap,
  RefreshCw,
  Target,
  Upload,
  X,
  Loader2,
  ImageIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  icon: any;
  difficulty: 'Beginner' | 'Intermediate';
  content: React.ReactNode;
}

interface MechanoLessonsProps {
  activeSubTab?: 'lessons' | 'anatomy' | 'sandbox';
}

const LESSON_URL = "https://share.descript.com/view/gDxcvRrEKGw?t=448.630353&autoplay=1";
const BUCKET_NAME = 'ligament-images';

const MechanoLessons = ({ activeSubTab = 'lessons' }: MechanoLessonsProps) => {
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [lessonProgress, setLessonProgress] = useState<Record<string, boolean>>({
    '1': false,
    '2': false,
    '3': false,
    '4': false
  });
  const [selectedAnatomyJoint, setSelectedAnatomyJoint] = useState<'knee' | 'ankle' | 'shoulder' | 'hip'>('knee');
  const [selectedStructure, setSelectedStructure] = useState<string | null>('mcl');

  // Image Upload & Database States
  const [userId, setUserId] = useState<string | null>(null);
  const [dbImages, setDbImages] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sandbox State
  const [sandboxJoint, setSandboxJoint] = useState<string>('Knee');
  const [sandboxTissue, setSandboxTissue] = useState<'Ligament' | 'Tendon'>('Ligament');
  const [sandboxPlane, setSandboxPlane] = useState<string>('Sagittal');
  const [sandboxAction, setSandboxAction] = useState<string>('Flexion');

  // Fetch User and Custom Images
  const fetchImages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data, error } = await supabase
          .from('ligament_images')
          .select('category, image_index, image_url')
          .eq('user_id', user.id);

        if (!error && data) {
          const mapping: Record<string, string> = {};
          const timestamp = Date.now();
          data.forEach(item => {
            if (item.image_url) {
              mapping[`${item.category}_${item.image_index}`] = `${item.image_url}?t=${timestamp}`;
            }
          });
          setDbImages(mapping);
        }
      }
    } catch (err) {
      console.error("Error fetching custom images:", err);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  // Map selected structure to database category and index
  const structureMapping = useMemo(() => {
    const mapping: Record<string, { category: string; index: number }> = {
      // Knee
      mcl: { category: 'knee_elbow', index: 0 },
      lcl: { category: 'knee_elbow', index: 1 },
      patellar: { category: 'knee_elbow', index: 2 },
      quadriceps: { category: 'knee_elbow', index: 3 },
      // Ankle
      atfl: { category: 'ankle_wrist', index: 0 },
      cfl: { category: 'ankle_wrist', index: 1 },
      achilles: { category: 'ankle_wrist', index: 2 },
      // Shoulder
      supraspinatus: { category: 'hip_shoulder', index: 0 },
      ghl: { category: 'hip_shoulder', index: 1 },
      biceps: { category: 'hip_shoulder', index: 2 },
      ac: { category: 'hip_shoulder', index: 3 },
      // Hip
      iliofemoral: { category: 'hip_shoulder', index: 0 },
      gluteus_med: { category: 'hip_shoulder', index: 1 },
      hamstring: { category: 'hip_shoulder', index: 2 }
    };
    return mapping;
  }, []);

  const activeMapping = selectedStructure ? structureMapping[selectedStructure] : null;
  const activeImageUrl = activeMapping ? dbImages[`${activeMapping.category}_${activeMapping.index}`] : null;

  // Handle Image Upload
  const handleUpload = async (file: File) => {
    if (!userId || !activeMapping || !selectedStructure) return;
    if (!file.type.startsWith('image/')) {
      showError("Please upload an image file.");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop() || 'png';
      const filePath = `${userId}/${activeMapping.category}_${activeMapping.index}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('ligament_images')
        .upsert({
          user_id: userId,
          category: activeMapping.category,
          image_index: activeMapping.index,
          image_url: publicUrl
        }, { onConflict: 'user_id,category,image_index' });

      if (dbError) throw dbError;

      showSuccess("Reference image updated successfully!");
      fetchImages();
    } catch (error: any) {
      showError(error.message || "Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId || !activeMapping) return;
    if (!confirm("Are you sure you want to remove this reference image?")) return;

    try {
      const { error } = await supabase
        .from('ligament_images')
        .update({ image_url: null })
        .match({ user_id: userId, category: activeMapping.category, image_index: activeMapping.index });

      if (error) throw error;

      showSuccess("Reference image removed.");
      fetchImages();
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
  }, [userId, activeMapping, selectedStructure]);

  const lessons: Lesson[] = [
    {
      id: '1',
      title: "Demystifying Ligaments (The Unconscious GPS)",
      description: "Learn why ligaments are your body's silent sensors and how they talk to the cerebellum.",
      duration: "5 mins",
      icon: Shield,
      difficulty: "Beginner",
      content: (
        <div className="space-y-6 text-slate-700">
          <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Shield size={20} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm uppercase tracking-tight">The Core Concept</h4>
              <p className="text-xs text-slate-600 font-medium mt-1">
                Ligaments connect <strong>bone to bone</strong>. They are not just mechanical straps; they are high-density sensory organs packed with mechanoreceptors that feed 85% of your movement data to the cerebellum.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 text-base">Why You Shouldn't Be Intimidated:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Smile className="text-slate-900" size={16} /> They are Passive Sensors
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ligaments don't contract. They only sense stretch. If a joint is unstable, the ligament gets over-stretched, sending a \"threat\" signal to the brain.
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <CheckCircle className="text-slate-900" size={16} /> The Correction is Simple
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  To clear the threat, we simply stretch the ligament slightly (re-creating the stimulus) while holding <strong>GV16</strong> (the cerebellum's reflex point) to update the map.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 bg-slate-900 text-white rounded-xl space-y-3">
            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">The Neural Pathway</p>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-bold">
              <div className="px-3 py-2 bg-white/10 rounded-lg border border-white/10 text-center w-full md:w-auto">Ligament Stretch</div>
              <ChevronRight className="text-slate-500 hidden md:block" />
              <div className="px-3 py-2 bg-white/10 rounded-lg border border-white/10 text-center w-full md:w-auto">Spinocerebellar Tract</div>
              <ChevronRight className="text-slate-500 hidden md:block" />
              <div className="px-3 py-2 bg-white/10 rounded-lg border border-white/10 text-center w-full md:w-auto">Ipsilateral Cerebellum</div>
              <ChevronRight className="text-slate-500 hidden md:block" />
              <div className="px-3 py-2 bg-slate-800 rounded-lg text-center w-full md:w-auto">GV16 Reset</div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
            <Lightbulb className="text-slate-900 shrink-0 mt-0.5" size={18} />
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              <strong>Confidence Tip:</strong> You don't need to know the exact name of every ligament. If you know the joint is the knee, and the threat is on the inside, you are stretching the medial collateral ligament (MCL). Trust your hands and the client's feedback!
            </p>
          </div>
        </div>
      )
    },
    {
      id: '2',
      title: "Demystifying Tendons (The Tension Scales)",
      description: "Understand how tendons monitor muscle force and how to reset their threshold.",
      duration: "5 mins",
      icon: LinkIcon,
      difficulty: "Beginner",
      content: (
        <div className="space-y-6 text-slate-700">
          <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-md">
              <LinkIcon size={20} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm uppercase tracking-tight">The Core Concept</h4>
              <p className="text-xs text-slate-600 font-medium mt-1">
                Tendons connect <strong>muscle to bone</strong>. They house the Golgi Tendon Organs (GTOs), which act as springy tension scales. If a muscle pulls too hard, the GTO inhibits the muscle to prevent it from tearing.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 text-base">Why You Shouldn't Be Intimidated:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Smile className="text-slate-900" size={16} /> They are Active Regulators
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tendons respond to active muscle contraction. When a tendon's threshold is \"smudged,\" the brain keeps the muscle weak or chronically tight to protect it.
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <CheckCircle className="text-slate-900" size={16} /> The Correction is Active
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  To reset the GTO threshold, we perform a light, pain-free <strong>isometric contraction (30-40% effort)</strong> in the restricted action while holding the contralateral sensory cortex.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 bg-slate-900 text-white rounded-xl space-y-3">
            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">The Neural Pathway</p>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-bold">
              <div className="px-3 py-2 bg-white/10 rounded-lg border border-white/10 text-center w-full md:w-auto">Isometric Hold</div>
              <ChevronRight className="text-slate-500 hidden md:block" />
              <div className="px-3 py-2 bg-white/10 rounded-lg border border-white/10 text-center w-full md:w-auto">DCML Pathway</div>
              <ChevronRight className="text-slate-500 hidden md:block" />
              <div className="px-3 py-2 bg-white/10 rounded-lg border border-white/10 text-center w-full md:w-auto">Contralateral S1 Cortex</div>
              <ChevronRight className="text-slate-500 hidden md:block" />
              <div className="px-3 py-2 bg-slate-800 rounded-lg text-center w-full md:w-auto">30-40% Effort Reset</div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
            <Lightbulb className="text-slate-900 shrink-0 mt-0.5" size={18} />
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              <strong>Confidence Tip:</strong> If a client has pain during the isometric hold, you are pushing too hard! Back off to 10% or 20% effort. The brain learns from clear, pain-free signals, not from force.
            </p>
          </div>
        </div>
      )
    },
    {
      id: '3',
      title: "The 3-Step Mechano Process Demystified",
      description: "Master the simple, repeatable loop that guarantees clinical success.",
      duration: "7 mins",
      icon: Compass,
      difficulty: "Beginner",
      content: (
        <div className="space-y-6 text-slate-700">
          <p className="text-sm font-medium leading-relaxed">
            Every single mechanoreceptive correction follows the exact same 3-step loop. Once you memorize this loop, you can apply it to any joint in the body with complete confidence.
          </p>

          <div className="space-y-4">
            {[
              {
                step: "Step 1: Stimulate (Find the Threat)",
                desc: "Aggravate the joint or tissue. For ligaments, stretch them. For tendons, contract them. If the indicator muscle (IM) goes weak, you've found the threat.",
                color: "border-slate-200 bg-slate-50/50 text-slate-900"
              },
              {
                step: "Step 2: Localize (Find the Geometry)",
                desc: "Follow the hierarchy: Region (Upper/Lower) -> Laterality (Left/Right) -> Skeleton (Axial/Appendicular) -> Specific Joint. Then find the plane of motion (Sagittal, Frontal, Transverse).",
                color: "border-slate-200 bg-slate-50/50 text-slate-900"
              },
              {
                step: "Step 3: Calibrate (Apply the Correction)",
                desc: "Apply the specific correction. For Unconscious (ligaments), hold GV16 and stretch. For Conscious (tendons), hold contralateral S1 and perform a light isometric hold.",
                color: "border-slate-200 bg-slate-50/50 text-slate-900"
              }
            ].map((item, i) => (
              <div key={i} className={cn("p-5 rounded-xl border space-y-2", item.color)}>
                <h4 className="font-bold text-sm">{item.step}</h4>
                <p className="text-xs leading-relaxed opacity-90 font-medium">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="p-5 bg-slate-900 text-white rounded-xl space-y-3">
            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">The Golden Rule</p>
            <p className="text-xs font-bold leading-relaxed italic">
              \"Joints act, muscles and tissues react. Always focus on the joint action first, and let the muscles take care of themselves.\"
            </p>
          </div>
        </div>
      )
    },
    {
      id: '4',
      title: "Overcoming Clinical Intimidation",
      description: "Mindset shifts and safety guarantees to build your clinical confidence.",
      duration: "4 mins",
      icon: Heart,
      difficulty: "Beginner",
      content: (
        <div className="space-y-6 text-slate-700">
          <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-md">
              <Heart size={20} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm uppercase tracking-tight">A Message for You</h4>
              <p className="text-xs text-slate-600 font-medium mt-1">
                It is completely normal to feel intimidated by neurology. But remember: you are not performing brain surgery. You are simply communicating with the nervous system using its own language.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 text-base">Three Safety Guarantees:</h4>
            <div className="space-y-3">
              {[
                {
                  title: "1. The Body is Self-Correcting",
                  desc: "If you apply the wrong correction, the brain simply ignores it. You cannot 'break' the client or make them worse by holding the wrong point or stretching the wrong way. It is completely safe."
                },
                {
                  title: "2. You Don't Need to Memorize Everything",
                  desc: "The Joint Explorer, the Bible, and the reference charts are always here. Keep them open during your sessions. Clients love seeing that you use precise, scientific tools."
                },
                {
                  title: "3. Stay Loose in the Saddle",
                  desc: "Expect layers. If a correction doesn't hold, it doesn't mean you failed—it just means you cleared one layer and the brain is showing you the next one. Stay curious!"
                }
              ].map((item, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <p className="font-bold text-slate-900 text-xs">{item.title}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-4">
            <Smile className="text-slate-900 shrink-0 mt-1" size={24} />
            <div>
              <h4 className="font-bold text-slate-900 text-sm uppercase tracking-tight">Your Confidence Mantra</h4>
              <p className="text-xs text-slate-600 font-medium mt-1 italic">
                \"I am a facilitator of the brain's own healing. I don't need to be perfect; I just need to be curious, gentle, and systematic.\"
              </p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const handleCompleteLesson = (id: string) => {
    setLessonProgress(prev => ({ ...prev, [id]: true }));
    setCurrentLessonId(null);
  };

  const activeLesson = lessons.find(l => l.id === currentLessonId);

  // Anatomy Structure Data
  const anatomyStructures: Record<string, Record<string, { name: string, type: 'Ligament' | 'Tendon', desc: string, test: string, correction: string }>> = {
    knee: {
      mcl: {
        name: "Medial Collateral Ligament (MCL)",
        type: "Ligament",
        desc: "Located on the inside of the knee. Resists valgus (knock-knee) forces.",
        test: "Gently push the outside of the knee inwards while holding the ankle to stretch the MCL.",
        correction: "Hold GV16 (base of skull) while applying a light stretch to the MCL. Tap the cranium or apply a tuning fork for 3-5 seconds."
      },
      lcl: {
        name: "Lateral Collateral Ligament (LCL)",
        type: "Ligament",
        desc: "Located on the outside of the knee. Resists varus (bow-leg) forces.",
        test: "Gently push the inside of the knee outwards while holding the ankle to stretch the LCL.",
        correction: "Hold GV16 (base of skull) while applying a light stretch to the LCL. Tap the cranium or apply a tuning fork for 3-5 seconds."
      },
      patellar: {
        name: "Patellar Tendon",
        type: "Tendon",
        desc: "Connects the kneecap (patella) to the shinbone (tibia). Transmits force from the quadriceps.",
        test: "Have the client perform a light knee extension (straightening the leg).",
        correction: "Hold contralateral S1 (opposite sensory cortex) while the client performs a 30% isometric knee extension for 60 seconds."
      },
      quadriceps: {
        name: "Quadriceps Tendon",
        type: "Tendon",
        desc: "Connects the quadriceps muscle to the top of the kneecap.",
        test: "Have the client perform a light knee extension or resist knee flexion.",
        correction: "Hold contralateral S1 while the client performs a 30% isometric knee extension for 60 seconds."
      }
    },
    ankle: {
      atfl: {
        name: "Anterior Talofibular Ligament (ATFL)",
        type: "Ligament",
        desc: "Located on the front-outside of the ankle. Most commonly injured ligament in ankle sprains.",
        test: "Gently pull the foot forward and turn it inwards (plantarflexion + inversion) to stretch the ATFL.",
        correction: "Hold GV16 while applying a light stretch to the ATFL. Tap the cranium or apply a tuning fork for 3-5 seconds."
      },
      cfl: {
        name: "Calcaneofibular Ligament (CFL)",
        type: "Ligament",
        desc: "Located on the outside of the ankle, connecting the fibula to the heel bone.",
        test: "Gently tilt the sole of the foot inwards (inversion) to stretch the CFL.",
        correction: "Hold GV16 while applying a light stretch to the CFL. Tap the cranium or apply a tuning fork for 3-5 seconds."
      },
      achilles: {
        name: "Achilles Tendon",
        type: "Tendon",
        desc: "The thickest tendon in the body, connecting the calf muscles to the heel bone.",
        test: "Have the client perform a light calf raise or point the toes down against resistance.",
        correction: "Hold contralateral S1 while the client performs a 30% isometric plantarflexion (pointing toes down) for 60 seconds."
      }
    },
    shoulder: {
      supraspinatus: {
        name: "Supraspinatus Tendon",
        type: "Tendon",
        desc: "Part of the rotator cuff. Initiates abduction and stabilizes the humeral head.",
        test: "Have the client perform a light shoulder abduction (raising arm to the side) or 'empty can' test.",
        correction: "Hold contralateral S1 (opposite sensory cortex) while the client performs a 30% isometric shoulder abduction for 60 seconds."
      },
      ghl: {
        name: "Glenohumeral Ligament (GHL)",
        type: "Ligament",
        desc: "Reinforces the joint capsule. Resists anterior translation and external rotation.",
        test: "Gently perform an anterior drawer test or passive external rotation of the shoulder.",
        correction: "Hold GV16 (base of skull) while applying a light passive external rotation stretch to the shoulder. Tap the cranium or apply a tuning fork for 3-5 seconds."
      },
      biceps: {
        name: "Biceps Tendon (Long Head)",
        type: "Tendon",
        desc: "Runs through the bicipital groove. Stabilizes the shoulder and flexes the elbow.",
        test: "Have the client perform a light shoulder flexion or elbow flexion against resistance.",
        correction: "Hold contralateral S1 while the client performs a 30% isometric shoulder flexion for 60 seconds."
      },
      ac: {
        name: "Acromioclavicular (AC) Ligament",
        type: "Ligament",
        desc: "Connects the acromion of the scapula to the clavicle.",
        test: "Gently press down on the distal clavicle or perform a horizontal adduction stretch.",
        correction: "Hold GV16 while applying a light downward pressure on the AC joint. Tap the cranium or apply a tuning fork for 3-5 seconds."
      }
    },
    hip: {
      iliofemoral: {
        name: "Iliofemoral Ligament (Y-Ligament)",
        type: "Ligament",
        desc: "The strongest ligament in the body. Resists hyperextension of the hip.",
        test: "Gently extend the hip passively to stretch the iliofemoral ligament.",
        correction: "Hold GV16 while applying a light passive hip extension stretch. Tap the cranium or apply a tuning fork for 3-5 seconds."
      },
      gluteus_med: {
        name: "Gluteus Medius Tendon",
        type: "Tendon",
        desc: "Inserts into the greater trochanter. Stabilizes the pelvis during single-leg stance.",
        test: "Have the client perform a light hip abduction (pushing leg out to the side).",
        correction: "Hold contralateral S1 while the client performs a 30% isometric hip abduction for 60 seconds."
      },
      hamstring: {
        name: "Hamstring Tendon",
        type: "Tendon",
        desc: "Connects the hamstring muscles to the ischial tuberosity (sit bone).",
        test: "Have the client perform a light knee flexion or hip extension against resistance.",
        correction: "Hold contralateral S1 while the client performs a 30% isometric knee flexion for 60 seconds."
      }
    }
  };

  const currentStructure = selectedStructure ? anatomyStructures[selectedAnatomyJoint][selectedStructure] : null;

  // Sandbox Logic
  const sandboxActions = {
    Knee: {
      Sagittal: ["Flexion", "Extension"],
      Frontal: ["No primary action"],
      Transverse: ["Tibial Internal Rotation", "Tibial External Rotation"]
    },
    Ankle: {
      Sagittal: ["Dorsiflexion", "Plantar Flexion"],
      Frontal: ["Inversion", "Eversion"],
      Transverse: ["Internal Rotation", "External Rotation"]
    },
    Shoulder: {
      Sagittal: ["Flexion", "Extension"],
      Frontal: ["Abduction", "Adduction"],
      Transverse: ["Internal Rotation", "External Rotation"]
    },
    Hip: {
      Sagittal: ["Flexion", "Extension"],
      Frontal: ["Abduction", "Adduction"],
      Transverse: ["Internal Rotation", "External Rotation"]
    }
  };

  const getSandboxProtocol = () => {
    if (sandboxTissue === 'Ligament') {
      return {
        title: `Unconscious Ligament Protocol: ${sandboxJoint}`,
        pathway: "Spinocerebellar Tract -> Unconscious Cerebellum",
        stimulus: `Gently stretch the priority ligament of the ${sandboxJoint} joint.`,
        correction: "Hold GV16 (base of skull) while maintaining the stretch. Tap the cranium or apply a tuning fork for 3-5 seconds.",
        tip: "Ligaments are passive sensors. Always use light, gentle stretch. Never force a joint into pain."
      };
    } else {
      return {
        title: `Conscious Tendon Protocol: ${sandboxJoint} ${sandboxAction}`,
        pathway: "DCML Pathway -> Contralateral S1 Sensory Cortex",
        stimulus: `Place the ${sandboxJoint} joint into the restricted action (${sandboxAction}).`,
        correction: `Hold the contralateral (opposite side) S1 brain zone. Have the client perform a 30-40% isometric contraction in the direction of ${sandboxAction} for 60 seconds with nasal breathing.`,
        tip: "Tendons monitor active tension. Keep the effort light (30-40%) and completely pain-free."
      };
    }
  };

  const sandboxProtocol = getSandboxProtocol();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Lessons Tab */}
      {activeSubTab === 'lessons' && (
        <div className="space-y-6">
          {!currentLessonId ? (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900">Confidence Lessons</h3>
                <p className="text-slate-500 text-sm">Bite-sized, reassuring lessons designed to demystify tendons, ligaments, and the clinical process.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {lessons.map((lesson) => {
                  const Icon = lesson.icon;
                  const isCompleted = lessonProgress[lesson.id];
                  return (
                    <Card key={lesson.id} className="border border-slate-200 shadow-sm rounded-xl bg-white hover:shadow-md transition-all group overflow-hidden flex flex-col justify-between">
                      <CardHeader className="p-6 pb-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700">
                            <Icon size={20} />
                          </div>
                          <div className="flex gap-1.5">
                            <Badge className="bg-slate-100 text-slate-600 border-none font-bold text-[8px] uppercase tracking-wider">
                              {lesson.duration}
                            </Badge>
                            {isCompleted && (
                              <Badge className="bg-slate-900 text-white border-none font-bold text-[8px] uppercase tracking-wider flex items-center gap-1">
                                <CheckCircle2 size={10} /> Completed
                              </Badge>
                            )}
                          </div>
                        </div>
                        <CardTitle className="text-base font-bold text-slate-900 group-hover:text-slate-800 transition-colors">
                          {lesson.title}
                        </CardTitle>
                        <CardDescription className="text-xs font-medium text-slate-500 mt-1">
                          {lesson.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 pt-0">
                        <Button 
                          onClick={() => setCurrentLessonId(lesson.id)}
                          className="w-full bg-slate-900 hover:bg-slate-800 h-10 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all"
                        >
                          Start Lesson <PlayCircle size={14} className="ml-1.5" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : (
            <Card className="border border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden animate-in zoom-in-95 duration-300">
              <CardHeader className="bg-slate-50 border-b border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <Button 
                    variant="ghost" 
                    onClick={() => setCurrentLessonId(null)}
                    className="rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-100 h-9 px-3"
                  >
                    <ChevronLeft size={16} className="mr-1" /> Back to Lessons
                  </Button>
                  <Badge className="bg-slate-900 text-white border-none font-bold text-[9px] uppercase tracking-wider px-3 py-1 rounded-full">
                    Lesson {activeLesson?.id} of {lessons.length}
                  </Badge>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
                    {activeLesson && React.createElement(activeLesson.icon, { size: 20 })}
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900">{activeLesson?.title}</CardTitle>
                    <CardDescription className="font-bold text-[9px] uppercase tracking-wider text-slate-500 mt-0.5">
                      {activeLesson?.difficulty} • {activeLesson?.duration}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {activeLesson?.content}

                <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                  <Button 
                    variant="ghost" 
                    onClick={() => setCurrentLessonId(null)}
                    className="rounded-xl font-bold text-xs text-slate-500"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => handleCompleteLesson(activeLesson!.id)}
                    className="bg-slate-900 hover:bg-slate-800 h-10 px-6 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm"
                  >
                    Complete Lesson & Build Confidence <CheckCircle2 size={14} className="ml-1.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Interactive Anatomy Tab */}
      {activeSubTab === 'anatomy' && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900">Interactive Anatomy Model</h3>
            <p className="text-slate-500 text-sm">Click on any structure to see its clinical logic. Use the buttons to switch joints.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Interactive SVG */}
            <Card className="lg:col-span-7 border border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden flex flex-col justify-between">
              <CardHeader className="bg-slate-50 border-b border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-bold text-slate-700">Select Joint Model:</span>
                  <div className="flex flex-wrap gap-1 bg-slate-200/50 p-1 rounded-xl">
                    {[
                      { id: 'knee', label: 'Knee', defaultStructure: 'mcl' },
                      { id: 'ankle', label: 'Ankle', defaultStructure: 'atfl' },
                      { id: 'shoulder', label: 'Shoulder', defaultStructure: 'supraspinatus' },
                      { id: 'hip', label: 'Hip', defaultStructure: 'iliofemoral' }
                    ].map(joint => (
                      <Button 
                        key={joint.id}
                        variant={selectedAnatomyJoint === joint.id ? 'default' : 'ghost'}
                        onClick={() => { setSelectedAnatomyJoint(joint.id as any); setSelectedStructure(joint.defaultStructure); }}
                        className="h-8 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                      >
                        {joint.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 flex items-center justify-center min-h-[350px] bg-slate-50/30">
                {selectedAnatomyJoint === 'knee' && (
                  <svg viewBox="0 0 200 240" className="w-full max-w-[280px] h-auto">
                    {/* Femur (Thigh Bone) */}
                    <path d="M70,10 L130,10 L130,80 C130,100 140,110 125,120 C110,130 90,130 75,120 C60,110 70,100 70,80 Z" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="2" />
                    {/* Tibia (Shin Bone) */}
                    <path d="M75,150 C90,140 110,140 125,150 L125,230 L75,230 Z" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="2" />
                    {/* Fibula */}
                    <rect x="60" y="160" width="12" height="70" rx="4" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />

                    {/* Quadriceps Tendon */}
                    <path 
                      d="M90,40 L110,40 L110,90 L90,90 Z" 
                      fill={selectedStructure === 'quadriceps' ? '#475569' : '#CBD5E1'} 
                      stroke={selectedStructure === 'quadriceps' ? '#0f172a' : '#94A3B8'} 
                      strokeWidth="2" 
                      className="cursor-pointer transition-all hover:opacity-90"
                      onClick={() => setSelectedStructure('quadriceps')}
                    />
                    {/* Patella (Kneecap) */}
                    <circle 
                      cx="100" 
                      cy="105" 
                      r="18" 
                      fill="#F8FAFC" 
                      stroke="#64748B" 
                      strokeWidth="2" 
                    />
                    {/* Patellar Tendon */}
                    <path 
                      d="M92,120 L108,120 L105,155 L95,155 Z" 
                      fill={selectedStructure === 'patellar' ? '#475569' : '#CBD5E1'} 
                      stroke={selectedStructure === 'patellar' ? '#0f172a' : '#94A3B8'} 
                      strokeWidth="2" 
                      className="cursor-pointer transition-all hover:opacity-90"
                      onClick={() => setSelectedStructure('patellar')}
                    />

                    {/* Medial Collateral Ligament (MCL) */}
                    <path 
                      d="M125,95 C128,110 128,130 125,145" 
                      fill="none" 
                      stroke={selectedStructure === 'mcl' ? '#0F172A' : '#94A3B8'} 
                      strokeWidth="8" 
                      strokeLinecap="round"
                      className="cursor-pointer transition-all hover:opacity-90"
                      onClick={() => setSelectedStructure('mcl')}
                    />

                    {/* Lateral Collateral Ligament (LCL) */}
                    <path 
                      d="M70,95 C67,110 62,130 65,145" 
                      fill="none" 
                      stroke={selectedStructure === 'lcl' ? '#0F172A' : '#94A3B8'} 
                      strokeWidth="6" 
                      strokeLinecap="round"
                      className="cursor-pointer transition-all hover:opacity-90"
                      onClick={() => setSelectedStructure('lcl')}
                    />

                    {/* Labels */}
                    <text x="100" y="30" textAnchor="middle" className="text-[8px] font-bold fill-slate-400 uppercase tracking-wider">Femur</text>
                    <text x="100" y="210" textAnchor="middle" className="text-[8px] font-bold fill-slate-400 uppercase tracking-wider">Tibia</text>
                  </svg>
                )}

                {selectedAnatomyJoint === 'ankle' && (
                  <svg viewBox="0 0 200 240" className="w-full max-w-[280px] h-auto">
                    {/* Tibia & Fibula */}
                    <rect x="75" y="10" width="35" height="110" rx="4" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="2" />
                    <rect x="55" y="20" width="15" height="100" rx="4" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />

                    {/* Talus & Calcaneus (Heel) */}
                    <path d="M65,130 C65,120 120,120 130,130 C140,140 150,160 140,180 C130,190 60,190 55,170 Z" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="2" />
                    <path d="M55,170 C55,190 70,210 100,210 C130,210 140,190 140,180 Z" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />

                    {/* Achilles Tendon */}
                    <path 
                      d="M110,40 L120,40 L115,150 L105,150 Z" 
                      fill={selectedStructure === 'achilles' ? '#475569' : '#CBD5E1'} 
                      stroke={selectedStructure === 'achilles' ? '#0f172a' : '#94A3B8'} 
                      strokeWidth="2" 
                      className="cursor-pointer transition-all hover:opacity-90"
                      onClick={() => setSelectedStructure('achilles')}
                    />

                    {/* Anterior Talofibular Ligament (ATFL) */}
                    <path 
                      d="M65,115 L90,135" 
                      fill="none" 
                      stroke={selectedStructure === 'atfl' ? '#0F172A' : '#94A3B8'} 
                      strokeWidth="6" 
                      strokeLinecap="round"
                      className="cursor-pointer transition-all hover:opacity-90"
                      onClick={() => setSelectedStructure('atfl')}
                    />

                    {/* Calcaneofibular Ligament (CFL) */}
                    <path 
                      d="M60,125 L75,165" 
                      fill="none" 
                      stroke={selectedStructure === 'cfl' ? '#0F172A' : '#94A3B8'} 
                      strokeWidth="6" 
                      strokeLinecap="round"
                      className="cursor-pointer transition-all hover:opacity-90"
                      onClick={() => setSelectedStructure('cfl')}
                    />

                    {/* Labels */}
                    <text x="92" y="30" textAnchor="middle" className="text-[8px] font-bold fill-slate-400 uppercase tracking-wider">Tibia</text>
                    <text x="100" y="200" textAnchor="middle" className="text-[8px] font-bold fill-slate-400 uppercase tracking-wider">Calcaneus</text>
                  </svg>
                )}

                {selectedAnatomyJoint === 'shoulder' && (
                  <svg viewBox="0 0 200 240" className="w-full max-w-[280px] h-auto">
                    {/* Clavicle (Collarbone) */}
                    <path d="M40,40 C80,35 120,45 150,40" fill="none" stroke="#F1F5F9" strokeWidth="10" strokeLinecap="round" />
                    {/* Scapula (Shoulder Blade) */}
                    <path d="M40,60 L80,60 L60,120 Z" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="2" />
                    {/* Humerus (Arm Bone) */}
                    <path d="M110,90 L110,220" fill="none" stroke="#F1F5F9" strokeWidth="18" strokeLinecap="round" />
                    {/* Humeral Head */}
                    <circle cx="110" cy="80" r="16" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="2" />

                    {/* Supraspinatus Tendon */}
                    <path 
                      d="M75,55 C90,55 100,65 110,72" 
                      fill="none" 
                      stroke={selectedStructure === 'supraspinatus' ? '#475569' : '#CBD5E1'} 
                      strokeWidth="6" 
                      strokeLinecap="round"
                      className="cursor-pointer transition-all hover:opacity-90"
                      onClick={() => setSelectedStructure('supraspinatus')}
                    />

                    {/* Glenohumeral Ligament (GHL) */}
                    <path 
                      d="M98,80 C98,90 105,95 110,100" 
                      fill="none" 
                      stroke={selectedStructure === 'ghl' ? '#0F172A' : '#94A3B8'} 
                      strokeWidth="6" 
                      strokeLinecap="round"
                      className="cursor-pointer transition-all hover:opacity-90"
                      onClick={() => setSelectedStructure('ghl')}
                    />

                    {/* Biceps Tendon (Long Head) */}
                    <path 
                      d="M110,72 L110,150" 
                      fill="none" 
                      stroke={selectedStructure === 'biceps' ? '#475569' : '#CBD5E1'} 
                      strokeWidth="4" 
                      strokeLinecap="round"
                      className="cursor-pointer transition-all hover:opacity-90"
                      onClick={() => setSelectedStructure('biceps')}
                    />

                    {/* Acromioclavicular (AC) Ligament */}
                    <path 
                      d="M125,40 L135,55" 
                      fill="none" 
                      stroke={selectedStructure === 'ac' ? '#0F172A' : '#94A3B8'} 
                      strokeWidth="6" 
                      strokeLinecap="round"
                      className="cursor-pointer transition-all hover:opacity-90"
                      onClick={() => setSelectedStructure('ac')}
                    />

                    {/* Labels */}
                    <text x="150" y="30" textAnchor="middle" className="text-[8px] font-bold fill-slate-400 uppercase tracking-wider">Clavicle</text>
                    <text x="110" y="235" textAnchor="middle" className="text-[8px] font-bold fill-slate-400 uppercase tracking-wider">Humerus</text>
                  </svg>
                )}

                {selectedAnatomyJoint === 'hip' && (
                  <svg viewBox="0 0 200 240" className="w-full max-w-[280px] h-auto">
                    {/* Pelvis (Hip Bone) */}
                    <path d="M50,40 C50,20 150,20 150,40 C150,60 130,80 130,100 C130,120 110,130 100,130 C90,130 70,120 70,100 C70,80 50,60 50,40 Z" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="2" />
                    {/* Femur (Thigh Bone) */}
                    <path d="M100,140 L100,230" fill="none" stroke="#F1F5F9" strokeWidth="18" strokeLinecap="round" />
                    {/* Greater Trochanter */}
                    <path d="M85,140 L75,150 L80,170 L100,160 Z" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />

                    {/* Iliofemoral Ligament (Y-Ligament) */}
                    <path 
                      d="M100,115 L85,150 M100,115 L115,150" 
                      fill="none" 
                      stroke={selectedStructure === 'iliofemoral' ? '#0F172A' : '#94A3B8'} 
                      strokeWidth="6" 
                      strokeLinecap="round"
                      className="cursor-pointer transition-all hover:opacity-90"
                      onClick={() => setSelectedStructure('iliofemoral')}
                    />

                    {/* Gluteus Medius Tendon */}
                    <path 
                      d="M70,100 C70,120 75,135 78,145" 
                      fill="none" 
                      stroke={selectedStructure === 'gluteus_med' ? '#475569' : '#CBD5E1'} 
                      strokeWidth="6" 
                      strokeLinecap="round"
                      className="cursor-pointer transition-all hover:opacity-90"
                      onClick={() => setSelectedStructure('gluteus_med')}
                    />

                    {/* Hamstring Tendon */}
                    <path 
                      d="M115,120 L105,180" 
                      fill="none" 
                      stroke={selectedStructure === 'hamstring' ? '#475569' : '#CBD5E1'} 
                      strokeWidth="5" 
                      strokeLinecap="round"
                      className="cursor-pointer transition-all hover:opacity-90"
                      onClick={() => setSelectedStructure('hamstring')}
                    />

                    {/* Labels */}
                    <text x="100" y="30" textAnchor="middle" className="text-[8px] font-bold fill-slate-400 uppercase tracking-wider">Pelvis</text>
                    <text x="100" y="235" textAnchor="middle" className="text-[8px] font-bold fill-slate-400 uppercase tracking-wider">Femur</text>
                  </svg>
                )}
              </CardContent>
            </Card>

            {/* Right Column: Clinical Logic Card with Image Upload */}
            <div className="lg:col-span-5 space-y-6">
              {currentStructure ? (
                <Card className="border border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden border-l-4 border-slate-900 animate-in fade-in slide-in-from-right-2 duration-300">
                  <CardHeader className="p-6 pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-slate-100 text-slate-800 border-none font-bold text-[8px] uppercase tracking-wider">
                        {currentStructure.type}
                      </Badge>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Anatomy Guide</span>
                    </div>
                    <CardTitle className="text-lg font-bold text-slate-900">{currentStructure.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-5">
                    {/* Real-time Image Upload Zone */}
                    <div className="space-y-2">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Reference Image</p>
                      <div 
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                        onDrop={onDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                          "relative group/img aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden cursor-pointer transition-all duration-300",
                          activeImageUrl ? "border-transparent" : "border-slate-200 bg-slate-50/50 hover:border-indigo-400 hover:bg-indigo-50/30",
                          isDragging && "border-indigo-600 bg-indigo-100/80 scale-[1.02]",
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
                        {activeImageUrl ? (
                          <>
                            <img src={activeImageUrl} alt={currentStructure.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button variant="secondary" size="icon" className="rounded-xl h-8 w-8 shadow-lg"><Upload size={14} /></Button>
                              <Button variant="destructive" size="icon" className="rounded-xl h-8 w-8 shadow-lg" onClick={handleRemoveImage}><X size={14} /></Button>
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-4 space-y-2">
                            {isUploading ? (
                              <Loader2 className="mx-auto text-indigo-500 animate-spin" size={24} />
                            ) : (
                              <>
                                <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mx-auto text-slate-400 group-hover/img:text-indigo-600 transition-all">
                                  <ImageIcon size={20} />
                                </div>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Click or Drop Reference Image</p>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Description</p>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">{currentStructure.desc}</p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <p className="text-[9px] font-bold text-slate-700 uppercase tracking-wider">How to Test / Stimulate</p>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">{currentStructure.test}</p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                      <p className="text-[9px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1">
                        <Zap size={12} /> Correction Protocol
                      </p>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">{currentStructure.correction}</p>
                    </div>

                    <div className="p-4 bg-slate-900 text-white rounded-xl space-y-1">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Neurological Logic</p>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {currentStructure.type === 'Ligament' 
                          ? "Targets the Spinocerebellar tract to the ipsilateral cerebellum. Hold GV16 to clear the threat." 
                          : "Targets the DCML pathway to the contralateral sensory cortex. Perform a light isometric hold to reset GTO threshold."}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border border-slate-200 shadow-sm rounded-2xl bg-white p-8 text-center flex flex-col items-center justify-center h-full min-h-[300px]">
                  <HelpCircle size={40} className="text-slate-300 mb-3" />
                  <h4 className="font-bold text-slate-900 text-sm">Select a Structure</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">Click on any highlighted ligament or tendon in the interactive model to view its clinical logic.</p>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Protocol Sandbox Tab */}
      {activeSubTab === 'sandbox' && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900">Protocol Sandbox</h3>
            <p className="text-slate-500 text-sm">Select a joint and tissue type to generate a step-by-step confidence protocol.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Left Column: Configuration */}
            <Card className="md:col-span-5 border border-slate-200 shadow-sm rounded-2xl bg-white p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">1. Select Joint</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {["Knee", "Ankle", "Shoulder", "Hip"].map(j => (
                    <Button 
                      key={j}
                      variant={sandboxJoint === j ? 'default' : 'outline'}
                      onClick={() => { setSandboxJoint(j); setSandboxAction(sandboxActions[j as keyof typeof sandboxActions][sandboxPlane as keyof typeof sandboxActions['Knee']][0] || 'Flexion'); }}
                      className="h-9 rounded-xl text-xs font-bold"
                    >
                      {j}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">2. Select Tissue Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant={sandboxTissue === 'Ligament' ? 'default' : 'outline'}
                    onClick={() => setSandboxTissue('Ligament')}
                    className="h-9 rounded-xl text-xs font-bold"
                  >
                    Ligament (Unconscious)
                  </Button>
                  <Button 
                    variant={sandboxTissue === 'Tendon' ? 'default' : 'outline'}
                    onClick={() => setSandboxTissue('Tendon')}
                    className="h-9 rounded-xl text-xs font-bold"
                  >
                    Tendon (Conscious)
                  </Button>
                </div>
              </div>

              {sandboxTissue === 'Tendon' && (
                <>
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">3. Select Plane of Motion</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["Sagittal", "Frontal", "Transverse"].map(p => (
                        <Button 
                          key={p}
                          variant={sandboxPlane === p ? 'default' : 'outline'}
                          onClick={() => { setSandboxPlane(p); setSandboxAction(sandboxActions[sandboxJoint as keyof typeof sandboxActions][p as keyof typeof sandboxActions['Knee']][0] || 'Flexion'); }}
                          className="h-9 rounded-xl text-xs font-bold"
                        >
                          {p}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">4. Select Action</label>
                    <div className="grid grid-cols-2 gap-2">
                      {sandboxActions[sandboxJoint as keyof typeof sandboxActions][sandboxPlane as keyof typeof sandboxActions['Knee']].map(a => (
                        <Button 
                          key={a}
                          variant={sandboxAction === a ? 'default' : 'outline'}
                          onClick={() => setSandboxAction(a)}
                          className="h-9 rounded-xl text-xs font-bold"
                        >
                          {a}
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </Card>

            {/* Right Column: Generated Protocol */}
            <Card className="md:col-span-7 border border-slate-200 shadow-sm rounded-2xl bg-slate-900 text-white overflow-hidden flex flex-col justify-between">
              <CardHeader className="p-6 pb-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-white/10 text-white border-none font-bold text-[8px] uppercase tracking-wider">
                    {sandboxTissue} Priority
                  </Badge>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Generated Protocol</span>
                </div>
                <CardTitle className="text-xl font-bold">{sandboxProtocol.title}</CardTitle>
                <p className="text-xs text-slate-300 font-bold mt-0.5">Pathway: {sandboxProtocol.pathway}</p>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Step 1: Stimulate (Find the Threat)</p>
                  <p className="text-xs font-bold text-white leading-relaxed">{sandboxProtocol.stimulus}</p>
                </div>

                <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Step 2: Calibrate (Apply Correction)</p>
                  <p className="text-xs font-bold text-white leading-relaxed">{sandboxProtocol.correction}</p>
                </div>

                <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-start gap-3">
                  <Lightbulb className="text-amber-400 shrink-0 mt-0.5" size={16} />
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    {sandboxProtocol.tip}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default MechanoLessons;