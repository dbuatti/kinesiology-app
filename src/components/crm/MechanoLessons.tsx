"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  ImageIcon,
  Maximize2,
  ArrowRightLeft,
  Move,
  Volume2,
  AlertCircle,
  Check,
  Play,
  Pause
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
  const [lessonProgress, setLessonProgress] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('antigravity_mechano_lessons_progress');
    return saved ? JSON.parse(saved) : {
      '1': false,
      '2': false,
      '3': false,
      '4': false,
      '5': false,
      '6': false
    };
  });
  const [selectedAnatomyJoint, setSelectedAnatomyJoint] = useState<'knee' | 'ankle' | 'shoulder' | 'hip'>('knee');
  const [selectedStructure, setSelectedStructure] = useState<string | null>('mcl');
  const [imageSourceMode, setImageSourceMode] = useState<'sourced' | 'custom'>('sourced');

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

  // Interactive Simulator State
  const [simStep, setSimStep] = useState<'idle' | 'test_baseline' | 'apply_challenge' | 'apply_correction' | 'retest' | 'complete'>('idle');
  const [simImStatus, setSimImStatus] = useState<'Normotonic' | 'Inhibited'>('Normotonic');
  const [simHoldReflex, setSimHoldReflex] = useState(false);
  const [simApplyStretch, setSimApplyStretch] = useState(false);
  const [simApplyIsometric, setSimApplyIsometric] = useState(false);
  const [simNasalBreathing, setSimNasalBreathing] = useState(false);
  const [simTimer, setSimTimer] = useState(0);
  const [simTimerActive, setSimTimerActive] = useState(false);
  const simIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Simulator Timer Effect
  useEffect(() => {
    if (simTimerActive && simTimer > 0) {
      simIntervalRef.current = setInterval(() => {
        setSimTimer(prev => {
          if (prev <= 1) {
            setSimTimerActive(false);
            if (simIntervalRef.current) clearInterval(simIntervalRef.current);
            setSimStep('retest');
            setSimImStatus('Normotonic'); // Correction clears the threat
            showSuccess("Correction phase complete! Ready to re-test.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    }
    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, [simTimerActive, simTimer]);

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
  const customImageUrl = activeMapping ? dbImages[`${activeMapping.category}_${activeMapping.index}`] : null;

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
      setImageSourceMode('custom');
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
      setImageSourceMode('sourced');
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
                  Ligaments don't contract. They only sense stretch. If a joint is unstable, the ligament gets over-stretched, sending a "threat" signal to the brain.
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
                  Tendons respond to active muscle contraction. When a tendon's threshold is "smudged," the brain keeps the muscle weak or chronically tight to protect it.
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
              "Joints act, muscles and tissues react. Always focus on the joint action first, and let the muscles take care of themselves."
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
                  desc: "If you apply the wrong correction, the brain simply ignores it. You cannot 'break' the client or make them worse by holding the wrong point or stretching the wrong way. It is safe."
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
                  <p className="font-bold text-xs text-slate-900">{item.title}</p>
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
                "I am a facilitator of the brain's own healing. I don't need to be perfect; I just need to be curious, gentle, and systematic."
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: '5',
      title: "The Lovett-Brother Spinal Engine",
      description: "Understand how spinal segments work in pairs and how to resolve reciprocal tension.",
      duration: "6 mins",
      icon: ArrowRightLeft,
      difficulty: "Intermediate",
      content: (
        <div className="space-y-6 text-slate-700">
          <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-md">
              <ArrowRightLeft size={20} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm uppercase tracking-tight">The Core Concept</h4>
              <p className="text-xs text-slate-600 font-medium mt-1">
                The spine operates as a reciprocal engine. Tension or fixation at one end of the spine (e.g., C1) immediately creates a compensatory dysfunction at the reciprocating partner (e.g., L5).
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 text-base">The Lovett-Brother Rules:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Layers className="text-slate-900" size={16} /> Parallel Motion
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Cervical and lumbar vertebrae rotate and lateral-flex in parallel directions. If C1 is locked, L5 will lock to compensate and preserve dural tension.
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Activity className="text-slate-900" size={16} /> Reciprocal Organs
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The associated organs and muscles of partner segments are also linked. For example, C1 (Buccinator/Pancreas) is paired with L5 (Hamstrings/Large Intestine).
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
            <Lightbulb className="text-slate-900 shrink-0 mt-0.5" size={18} />
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              <strong>Clinical Pearl:</strong> If a client presents with chronic, stubborn L5 lower back pain, do not just rub the lower back! Check C1 (atlas) rotation and the Buccinator muscle. Clearing the C1 restriction often instantly resolves the L5 pain.
            </p>
          </div>
        </div>
      )
    },
    {
      id: '6',
      title: "Planes of Motion & Joint Geometry",
      description: "Master the three planes of motion to quickly isolate and correct joint restrictions.",
      duration: "6 mins",
      icon: Move,
      difficulty: "Intermediate",
      content: (
        <div className="space-y-6 text-slate-700">
          <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-md">
              <Move size={20} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm uppercase tracking-tight">The Core Concept</h4>
              <p className="text-xs text-slate-600 font-medium mt-1">
                The brain maps movement in three distinct geometric planes: Sagittal, Frontal, and Transverse. When a joint is threatened, the brain restricts movement in the specific plane of threat to protect the tissue.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 text-base">The Three Planes:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-1">
                <p className="font-bold text-blue-900 text-xs">1. Sagittal Plane</p>
                <p className="text-[10px] text-blue-700 font-bold uppercase">Flexion / Extension</p>
                <p className="text-[11px] text-slate-600 leading-relaxed">Forward and backward movement. E.g., nodding head, bending forward.</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 space-y-1">
                <p className="font-bold text-emerald-900 text-xs">2. Frontal Plane</p>
                <p className="text-[10px] text-emerald-700 font-bold uppercase">Abduction / Adduction</p>
                <p className="text-[11px] text-slate-600 leading-relaxed">Side-to-side movement. E.g., tilting head, raising arm to the side.</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 space-y-1">
                <p className="font-bold text-orange-900 text-xs">3. Transverse Plane</p>
                <p className="text-[10px] text-orange-700 font-bold uppercase">Rotation</p>
                <p className="text-[11px] text-slate-600 leading-relaxed">Twisting and rotational movement. E.g., turning head, rotating hip.</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
            <Lightbulb className="text-slate-900 shrink-0 mt-0.5" size={18} />
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              <strong>Clinical Pearl:</strong> Always ask the body for the <strong>Plane of Motion</strong> first during your challenge. This instantly narrows down your search from dozens of possible joint actions to just 2 or 3, saving valuable session time.
            </p>
          </div>
        </div>
      )
    }
  ];

  const handleCompleteLesson = (id: string) => {
    const nextProgress = { ...lessonProgress, [id]: true };
    setLessonProgress(nextProgress);
    localStorage.setItem('antigravity_mechano_lessons_progress', JSON.stringify(nextProgress));
    setCurrentLessonId(null);
    showSuccess("Lesson completed! Your clinical confidence is growing.");
  };

  const activeLesson = lessons.find(l => l.id === currentLessonId);

  // Anatomy Structure Data with Sourced Medical Illustrations
  const anatomyStructures: Record<string, Record<string, { name: string, type: 'Ligament' | 'Tendon', desc: string, test: string, correction: string, defaultImageUrl: string }>> = {
    knee: {
      mcl: {
        name: "Medial Collateral Ligament (MCL)",
        type: "Ligament",
        desc: "Located on the inside of the knee. Resists valgus (knock-knee) forces.",
        test: "Gently push the outside of the knee inwards while holding the ankle to stretch the MCL.",
        correction: "Hold GV16 (base of skull) while applying a light stretch to the MCL. Tap the cranium or apply a tuning fork for 3-5 seconds.",
        defaultImageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80"
      },
      lcl: {
        name: "Lateral Collateral Ligament (LCL)",
        type: "Ligament",
        desc: "Located on the outside of the knee. Resists varus (bow-leg) forces.",
        test: "Gently push the inside of the knee outwards while holding the ankle to stretch the LCL.",
        correction: "Hold GV16 (base of skull) while applying a light stretch to the LCL. Tap the cranium or apply a tuning fork for 3-5 seconds.",
        defaultImageUrl: "https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&w=800&q=80"
      },
      patellar: {
        name: "Patellar Tendon",
        type: "Tendon",
        desc: "Connects the kneecap (patella) to the shinbone (tibia). Transmits force from the quadriceps.",
        test: "Have the client perform a light knee extension (straightening the leg).",
        correction: "Hold contralateral S1 (opposite sensory cortex) while the client performs a 30% isometric knee extension for 60 seconds.",
        defaultImageUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80"
      },
      quadriceps: {
        name: "Quadriceps Tendon",
        type: "Tendon",
        desc: "Connects the quadriceps muscle to the top of the kneecap.",
        test: "Have the client perform a light knee extension or resist knee flexion.",
        correction: "Hold contralateral S1 while the client performs a 30% isometric knee extension for 60 seconds.",
        defaultImageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80"
      }
    },
    ankle: {
      atfl: {
        name: "Anterior Talofibular Ligament (ATFL)",
        type: "Ligament",
        desc: "Located on the front-outside of the ankle. Most commonly injured ligament in ankle sprains.",
        test: "Gently pull the foot forward and turn it inwards (plantarflexion + inversion) to stretch the ATFL.",
        correction: "Hold GV16 while applying a light stretch to the ATFL. Tap the cranium or apply a tuning fork for 3-5 seconds.",
        defaultImageUrl: "https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=800&q=80"
      },
      cfl: {
        name: "Calcaneofibular Ligament (CFL)",
        type: "Ligament",
        desc: "Located on the outside of the ankle, connecting the fibula to the heel bone.",
        test: "Gently tilt the sole of the foot inwards (inversion) to stretch the CFL.",
        correction: "Hold GV16 while applying a light stretch to the CFL. Tap the cranium or apply a tuning fork for 3-5 seconds.",
        defaultImageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80"
      },
      achilles: {
        name: "Achilles Tendon",
        type: "Tendon",
        desc: "The thickest tendon in the body, connecting the calf muscles to the heel bone.",
        test: "Have the client perform a light calf raise or point the toes down against resistance.",
        correction: "Hold contralateral S1 while the client performs a 30% isometric plantarflexion (pointing toes down) for 60 seconds.",
        defaultImageUrl: "https://images.unsplash.com/photo-1599447421416-3414500d18a5?auto=format&fit=crop&w=800&q=80"
      }
    },
    shoulder: {
      supraspinatus: {
        name: "Supraspinatus Tendon",
        type: "Tendon",
        desc: "Part of the rotator cuff. Initiates abduction and stabilizes the humeral head.",
        test: "Have the client perform a light shoulder abduction (raising arm to the side) or 'empty can' test.",
        correction: "Hold contralateral S1 (opposite sensory cortex) while the client performs a 30% isometric shoulder abduction for 60 seconds.",
        defaultImageUrl: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=800&q=80"
      },
      ghl: {
        name: "Glenohumeral Ligament (GHL)",
        type: "Ligament",
        desc: "Reinforces the joint capsule. Resists anterior translation and external rotation.",
        test: "Gently perform an anterior drawer test or passive external rotation of the shoulder.",
        correction: "Hold GV16 (base of skull) while applying a light passive external rotation stretch to the shoulder. Tap the cranium or apply a tuning fork for 3-5 seconds.",
        defaultImageUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80"
      },
      biceps: {
        name: "Biceps Tendon (Long Head)",
        type: "Tendon",
        desc: "Runs through the bicipital groove. Stabilizes the shoulder and flexes the elbow.",
        test: "Have the client perform a light shoulder flexion or elbow flexion against resistance.",
        correction: "Hold contralateral S1 while the client performs a 30% isometric shoulder flexion for 60 seconds.",
        defaultImageUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80"
      },
      ac: {
        name: "Acromioclavicular (AC) Ligament",
        type: "Ligament",
        desc: "Connects the acromion of the scapula to the clavicle.",
        test: "Gently press down on the distal clavicle or perform a horizontal adduction stretch.",
        correction: "Hold GV16 while applying a light downward pressure on the AC joint. Tap the cranium or apply a tuning fork for 3-5 seconds.",
        defaultImageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80"
      }
    },
    hip: {
      iliofemoral: {
        name: "Iliofemoral Ligament (Y-Ligament)",
        type: "Ligament",
        desc: "The strongest ligament in the body. Resists hyperextension of the hip.",
        test: "Gently extend the hip passively to stretch the iliofemoral ligament.",
        correction: "Hold GV16 while applying a light passive hip extension stretch. Tap the cranium or apply a tuning fork for 3-5 seconds.",
        defaultImageUrl: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80"
      },
      gluteus_med: {
        name: "Gluteus Medius Tendon",
        type: "Tendon",
        desc: "Inserts into the greater trochanter. Stabilizes the pelvis during single-leg stance.",
        test: "Have the client perform a light hip abduction (pushing leg out to the side).",
        correction: "Hold contralateral S1 while the client performs a 30% isometric hip abduction for 60 seconds.",
        defaultImageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80"
      },
      hamstring: {
        name: "Hamstring Tendon",
        type: "Tendon",
        desc: "Connects the hamstring muscles to the ischial tuberosity (sit bone).",
        test: "Have the client perform a light knee flexion or hip extension against resistance.",
        correction: "Hold contralateral S1 while the client performs a 30% isometric knee flexion for 60 seconds.",
        defaultImageUrl: "https://images.unsplash.com/photo-1434608519344-49d77a699e1d?auto=format&fit=crop&w=800&q=80"
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

  const handleSendToSandbox = () => {
    if (!currentStructure) return;
    
    // Map selected joint to sandbox joint
    const jointMap: Record<string, string> = {
      knee: 'Knee',
      ankle: 'Ankle',
      shoulder: 'Shoulder',
      hip: 'Hip'
    };

    setSandboxJoint(jointMap[selectedAnatomyJoint]);
    setSandboxTissue(currentStructure.type);
    
    if (currentStructure.type === 'Tendon') {
      // Default to Sagittal Flexion for demo purposes
      setSandboxPlane('Sagittal');
      setSandboxAction('Flexion');
    }

    showSuccess(`Loaded ${currentStructure.name} into the Sandbox!`);
  };

  // Interactive Simulator Handlers
  const handleStartSimulation = () => {
    setSimStep('test_baseline');
    setSimImStatus('Normotonic');
    setSimHoldReflex(false);
    setSimApplyStretch(false);
    setSimApplyIsometric(false);
    setSimNasalBreathing(false);
    setSimTimer(0);
    setSimTimerActive(false);
  };

  const handleTestBaseline = () => {
    setSimImStatus('Normotonic');
    showSuccess("Indicator Muscle (IM) is Normotonic (Strong). Ready to apply challenge.");
    setSimStep('apply_challenge');
  };

  const handleApplyChallenge = () => {
    setSimImStatus('Inhibited');
    showSuccess("Challenge applied! The Indicator Muscle (IM) is now Inhibited (Weak).");
    setSimStep('apply_correction');
  };

  const handleStartCorrectionTimer = () => {
    if (sandboxTissue === 'Ligament') {
      if (!simHoldReflex || !simApplyStretch) {
        showError("You must hold the reflex point and apply the stretch first!");
        return;
      }
      setSimTimer(5); // 5 seconds for ligament
    } else {
      if (!simHoldReflex || !simApplyIsometric || !simNasalBreathing) {
        showError("You must hold the reflex point, apply isometric contraction, and enable nasal breathing!");
        return;
      }
      setSimTimer(10); // 10 seconds for tendon
    }
    setSimTimerActive(true);
  };

  const handleRetest = () => {
    setSimImStatus('Normotonic');
    showSuccess("Indicator Muscle (IM) is Normotonic! The pathway is successfully integrated.");
    setSimStep('complete');
  };

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
                      fill={selectedStructure === 'quadriceps' ? '#4f46e5' : '#CBD5E1'} 
                      stroke={selectedStructure === 'quadriceps' ? '#4f46e5' : '#94A3B8'} 
                      strokeWidth="2" 
                      className="cursor-pointer transition-all hover:opacity-90 hover:fill-indigo-500"
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
                      fill={selectedStructure === 'patellar' ? '#4f46e5' : '#CBD5E1'} 
                      stroke={selectedStructure === 'patellar' ? '#4f46e5' : '#94A3B8'} 
                      strokeWidth="2" 
                      className="cursor-pointer transition-all hover:opacity-90 hover:fill-indigo-500"
                      onClick={() => setSelectedStructure('patellar')}
                    />

                    {/* Medial Collateral Ligament (MCL) */}
                    <path 
                      d="M125,95 C128,110 128,130 125,145" 
                      fill="none" 
                      stroke={selectedStructure === 'mcl' ? '#4f46e5' : '#94A3B8'} 
                      strokeWidth="8" 
                      strokeLinecap="round"
                      className="cursor-pointer transition-all hover:opacity-90 hover:stroke-indigo-500"
                      onClick={() => setSelectedStructure('mcl')}
                    />

                    {/* Lateral Collateral Ligament (LCL) */}
                    <path 
                      d="M70,95 C67,110 62,130 65,145" 
                      fill="none" 
                      stroke={selectedStructure === 'lcl' ? '#4f46e5' : '#94A3B8'} 
                      strokeWidth="6" 
                      strokeLinecap="round"
                      className="cursor-pointer transition-all hover:opacity-90 hover:stroke-indigo-500"
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
                      fill={selectedStructure === 'achilles' ? '#4f46e5' : '#CBD5E1'} 
                      stroke={selectedStructure === 'achilles' ? '#4f46e5' : '#94A3B8'} 
                      strokeWidth="2" 
                      className="cursor-pointer transition-all hover:opacity-90 hover:fill-indigo-500"
                      onClick={() => setSelectedStructure('achilles')}
                    />

                    {/* Anterior Talofibular Ligament (ATFL) */}
                    <path 
                      d="M65,115 L90,135" 
                      fill="none" 
                      stroke={selectedStructure === 'atfl' ? '#4f46e5' : '#94A3B8'} 
                      strokeWidth="6" 
                      strokeLinecap="round"
                      className="cursor-pointer transition-all hover:opacity-90 hover:stroke-indigo-500"
                      onClick={() => setSelectedStructure('atfl')}
                    />

                    {/* Calcaneofibular Ligament (CFL) */}
                    <path 
                      d="M60,125 L75,165" 
                      fill="none" 
                      stroke={selectedStructure === 'cfl' ? '#4f46e5' : '#94A3B8'} 
                      strokeWidth="6" 
                      strokeLinecap="round"
                      className="cursor-pointer transition-all hover:opacity-90 hover:stroke-indigo-500"
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
                      stroke={selectedStructure === 'supraspinatus' ? '#4f46e5' : '#CBD5E1'} 
                      strokeWidth="6" 
                      strokeLinecap="round"
                      className="cursor-pointer transition-all hover:opacity-90 hover:stroke-indigo-500"
                      onClick={() => setSelectedStructure('supraspinatus')}
                    />

                    {/* Glenohumeral Ligament (GHL) */}
                    <path 
                      d="M98,80 C98,90 105,95 110,100" 
                      fill="none" 
                      stroke={selectedStructure === 'ghl' ? '#4f46e5' : '#94A3B8'} 
                      strokeWidth="6" 
                      strokeLinecap="round"
                      className="cursor-pointer transition-all hover:opacity-90 hover:stroke-indigo-500"
                      onClick={() => setSelectedStructure('ghl')}
                    />

                    {/* Biceps Tendon (Long Head) */}
                    <path 
                      d="M110,72 L110,150" 
                      fill="none" 
                      stroke={selectedStructure === 'biceps' ? '#4f46e5' : '#CBD5E1'} 
                      strokeWidth="4" 
                      strokeLinecap="round"
                      className="cursor-pointer transition-all hover:opacity-90 hover:stroke-indigo-500"
                      onClick={() => setSelectedStructure('biceps')}
                    />

                    {/* Acromioclavicular (AC) Ligament */}
                    <path 
                      d="M125,40 L135,55" 
                      fill="none" 
                      stroke={selectedStructure === 'ac' ? '#4f46e5' : '#94A3B8'} 
                      strokeWidth="6" 
                      strokeLinecap="round"
                      className="cursor-pointer transition-all hover:opacity-90 hover:stroke-indigo-500"
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
                      stroke={selectedStructure === 'iliofemoral' ? '#4f46e5' : '#94A3B8'} 
                      strokeWidth="6" 
                      strokeLinecap="round"
                      className="cursor-pointer transition-all hover:opacity-90 hover:stroke-indigo-500"
                      onClick={() => setSelectedStructure('iliofemoral')}
                    />

                    {/* Gluteus Medius Tendon */}
                    <path 
                      d="M70,100 C70,120 75,135 78,145" 
                      fill="none" 
                      stroke={selectedStructure === 'gluteus_med' ? '#4f46e5' : '#CBD5E1'} 
                      strokeWidth="6" 
                      strokeLinecap="round"
                      className="cursor-pointer transition-all hover:opacity-90 hover:stroke-indigo-500"
                      onClick={() => setSelectedStructure('gluteus_med')}
                    />

                    {/* Hamstring Tendon */}
                    <path 
                      d="M115,120 L105,180" 
                      fill="none" 
                      stroke={selectedStructure === 'hamstring' ? '#4f46e5' : '#CBD5E1'} 
                      strokeWidth="5" 
                      strokeLinecap="round"
                      className="cursor-pointer transition-all hover:opacity-90 hover:stroke-indigo-500"
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
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Reference Image</p>
                        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                          <Button 
                            variant={imageSourceMode === 'sourced' ? 'default' : 'ghost'} 
                            size="sm" 
                            onClick={() => setImageSourceMode('sourced')}
                            className="h-6 px-2.5 rounded-md text-[8px] font-black uppercase tracking-widest"
                          >
                            Sourced
                          </Button>
                          <Button 
                            variant={imageSourceMode === 'custom' ? 'default' : 'ghost'} 
                            size="sm" 
                            onClick={() => setImageSourceMode('custom')}
                            className="h-6 px-2.5 rounded-md text-[8px] font-black uppercase tracking-widest"
                          >
                            Custom
                          </Button>
                        </div>
                      </div>

                      {imageSourceMode === 'sourced' ? (
                        <div className="aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center relative group/img">
                          <img src={currentStructure.defaultImageUrl} alt={currentStructure.name} className="w-full h-full object-cover" />
                          <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md">
                            Sourced Reference
                          </div>
                        </div>
                      ) : (
                        <div 
                          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                          onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                          onDrop={onDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={cn(
                            "relative group/img aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden cursor-pointer transition-all duration-300",
                            customImageUrl ? "border-transparent" : "border-slate-200 bg-slate-50/50 hover:border-indigo-400 hover:bg-indigo-50/30",
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
                          {customImageUrl ? (
                            <>
                              <img src={customImageUrl} alt={currentStructure.name} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <div className="flex flex-col items-center gap-2">
                                  <div className="flex gap-2">
                                    <Button variant="secondary" size="icon" className="rounded-xl h-8 w-8 shadow-lg"><Upload size={14} /></Button>
                                    <Button variant="destructive" size="icon" className="rounded-xl h-8 w-8 shadow-lg" onClick={handleRemoveImage}><X size={14} /></Button>
                                  </div>
                                  <p className="text-[8px] font-black text-white uppercase tracking-widest">Click to Change</p>
                                </div>
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
                      )}
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

                    <Button 
                      onClick={handleSendToSandbox}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg"
                    >
                      <Compass size={16} className="mr-2" /> Send to Sandbox
                    </Button>
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

            {/* Right Column: Generated Protocol & Interactive Simulator */}
            <div className="md:col-span-7 space-y-6">
              <Card className="border border-slate-200 shadow-sm rounded-2xl bg-slate-900 text-white overflow-hidden flex flex-col justify-between">
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

              {/* Interactive Simulator Panel */}
              <Card className="border border-slate-200 shadow-lg rounded-2xl bg-white overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-slate-200 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="text-indigo-600" size={20} />
                      <CardTitle className="text-base font-bold text-slate-900">Live Practice Simulator</CardTitle>
                    </div>
                    <Badge className={cn(
                      "font-black text-[8px] uppercase tracking-widest px-2.5 py-1 rounded-full",
                      simImStatus === 'Normotonic' ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                    )}>
                      IM: {simImStatus}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {simStep === 'idle' && (
                    <div className="text-center py-8 space-y-4">
                      <p className="text-sm text-slate-500 font-medium">Ready to test your clinical skills? Run a simulated walkthrough of this protocol.</p>
                      <Button onClick={handleStartSimulation} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-11 px-8 font-bold text-xs uppercase tracking-wider">
                        Start Practice Simulator
                      </Button>
                    </div>
                  )}

                  {simStep === 'test_baseline' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <p className="text-sm font-bold text-slate-700">Step 1: Test the baseline Indicator Muscle (IM) to ensure it is strong (Normotonic).</p>
                      <div className="flex justify-center py-4">
                        <Button onClick={handleTestBaseline} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-12 px-8 font-bold text-xs uppercase tracking-wider">
                          Test Indicator Muscle (IM)
                        </Button>
                      </div>
                    </div>
                  )}

                  {simStep === 'apply_challenge' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <p className="text-sm font-bold text-slate-700">Step 2: Apply the physical challenge to find the threat.</p>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
                        {sandboxTissue === 'Ligament' 
                          ? `Action: Gently stretch the priority ligament of the ${sandboxJoint}.`
                          : `Action: Place the ${sandboxJoint} into the restricted action (${sandboxAction}) and apply resistance.`}
                      </div>
                      <div className="flex justify-center py-4">
                        <Button onClick={handleApplyChallenge} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-12 px-8 font-bold text-xs uppercase tracking-wider">
                          {sandboxTissue === 'Ligament' ? 'Apply Ligament Stretch' : 'Apply Muscle Resistance'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {simStep === 'apply_correction' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <p className="text-sm font-bold text-slate-700">Step 3: Apply the correction coordinates and hold.</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {sandboxTissue === 'Ligament' ? (
                          <>
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                              <span className="text-xs font-bold text-slate-700">Hold GV16 (Cerebellum)</span>
                              <Switch checked={simHoldReflex} onCheckedChange={setSimHoldReflex} />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                              <span className="text-xs font-bold text-slate-700">Maintain Ligament Stretch</span>
                              <Switch checked={simApplyStretch} onCheckedChange={setSimApplyStretch} />
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                              <span className="text-xs font-bold text-slate-700">Hold Contralateral S1</span>
                              <Switch checked={simHoldReflex} onCheckedChange={setSimHoldReflex} />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                              <span className="text-xs font-bold text-slate-700">30% Isometric Contraction</span>
                              <Switch checked={simApplyIsometric} onCheckedChange={setSimApplyIsometric} />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 sm:col-span-2">
                              <span className="text-xs font-bold text-slate-700">Nasal Breathing (In & Out)</span>
                              <Switch checked={simNasalBreathing} onCheckedChange={setSimNasalBreathing} />
                            </div>
                          </>
                        )}
                      </div>

                      <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col items-center justify-center border border-slate-800">
                        <div className="text-4xl font-black text-indigo-400 mb-4 font-mono">{simTimer}s</div>
                        <Button 
                          onClick={handleStartCorrectionTimer} 
                          disabled={simTimerActive}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-11 px-8 font-bold text-xs uppercase tracking-wider"
                        >
                          {simTimerActive ? "Calibrating..." : "Apply Correction"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {simStep === 'retest' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <p className="text-sm font-bold text-slate-700">Step 4: Re-test the Indicator Muscle (IM) to verify the correction.</p>
                      <div className="flex justify-center py-4">
                        <Button onClick={handleRetest} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12 px-8 font-bold text-xs uppercase tracking-wider">
                          Re-Test Indicator Muscle (IM)
                        </Button>
                      </div>
                    </div>
                  )}

                  {simStep === 'complete' && (
                    <div className="text-center py-8 space-y-4 animate-in zoom-in-95 duration-300">
                      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                        <CheckCircle2 size={32} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-lg font-bold text-slate-900">Pathway Integrated!</h4>
                        <p className="text-xs text-slate-500">Excellent work. You have successfully completed the clinical loop.</p>
                      </div>
                      <Button onClick={handleStartSimulation} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-10 px-6 font-bold text-xs uppercase tracking-wider">
                        Practice Again
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const jointToCategoryMap: Record<string, string> = {
  "Hip": "hip_shoulder", "Shoulder (GH Joint)": "hip_shoulder", "Scapula": "hip_shoulder",
  "Knee": "knee_elbow", "Elbow": "knee_elbow",
  "Foot/Ankle": "ankle_wrist", "Wrist": "ankle_wrist", "Hand/Fingers": "ankle_wrist",
  "Cranium": "spinal", "Jaw": "spinal", "Cervical Spine": "spinal", "Thoracic Spine": "spinal", "Lumbar Spine": "spinal", "Pelvis": "spinal", "Sacrum": "spinal"
};

export default MechanoLessons;