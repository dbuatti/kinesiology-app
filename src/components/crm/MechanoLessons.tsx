
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
  Pause,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";

// Modular Imports
import { lessons, Lesson } from '@/data/mechano-lessons-data';
import { anatomyStructures, sandboxActions } from '@/data/mechano-anatomy-data';
import ReflexImageZone from './ReflexImageZone';
import AnatomyModel from './AnatomyModel';
import PracticeSimulator from './PracticeSimulator';

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

  // Lesson Quiz State
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<string | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizIsCorrect, setQuizIsCorrect] = useState(false);

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

  const handleCompleteLesson = (id: string) => {
    const nextProgress = { ...lessonProgress, [id]: true };
    setLessonProgress(nextProgress);
    localStorage.setItem('antigravity_mechano_lessons_progress', JSON.stringify(nextProgress));
    setCurrentLessonId(null);
    setSelectedQuizAnswer(null);
    setQuizSubmitted(false);
    setQuizIsCorrect(false);
    showSuccess("Lesson completed! Your clinical confidence is growing.");
  };

  const handleQuizSubmit = () => {
    if (!activeLesson || !selectedQuizAnswer) return;
    const correct = selectedQuizAnswer === activeLesson.quiz.correctAnswer;
    setQuizIsCorrect(correct);
    setQuizSubmitted(true);
    if (correct) {
      showSuccess("Correct! You've mastered this concept.");
    } else {
      showError("Not quite. Review the explanation and try again.");
    }
  };

  const activeLesson = lessons.find(l => l.id === currentLessonId);
  const currentStructure = selectedStructure ? anatomyStructures[selectedAnatomyJoint][selectedStructure] : null;

  const getSandboxProtocol = () => {
    if (sandboxTissue === 'Ligament') {
      return {
        title: `Unconscious Ligament Protocol: ${sandboxJoint}`,
        pathway: "Spinocerebellar Tract -> Unconscious Cerebellum",
        text: `Gently stretch the priority ligament of the ${sandboxJoint} joint.`,
        correction: "Hold GV16 (base of skull) while maintaining the stretch. Tap the cranium or apply a tuning fork for 3-5 seconds.",
        tip: "Ligaments are passive sensors. Always use light, gentle stretch. Never force a joint into pain."
      };
    } else {
      return {
        title: `Conscious Tendon Protocol: ${sandboxJoint} ${sandboxAction}`,
        pathway: "DCML Pathway -> Contralateral S1 Sensory Cortex",
        text: `Place the ${sandboxJoint} joint into the restricted action (${sandboxAction}).`,
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
                          onClick={() => {
                            setCurrentLessonId(lesson.id);
                            setSelectedQuizAnswer(null);
                            setQuizSubmitted(false);
                            setQuizIsCorrect(false);
                          }}
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

                {/* Check Your Understanding Mini-Quiz */}
                {activeLesson && (
                  <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      <HelpCircle size={16} className="text-indigo-600" /> Check Your Understanding
                    </h4>
                    <p className="text-sm font-bold text-slate-900">{activeLesson.quiz.question}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeLesson.quiz.options.map((option) => {
                        const isSelected = selectedQuizAnswer === option;
                        const isCorrectAnswer = option === activeLesson.quiz.correctAnswer;
                        
                        return (
                          <button
                            key={option}
                            type="button"
                            disabled={quizSubmitted}
                            onClick={() => setSelectedQuizAnswer(option)}
                            className={cn(
                              "p-4 rounded-xl border-2 text-left transition-all font-bold text-xs flex items-center justify-between",
                              quizSubmitted
                                ? isCorrectAnswer
                                  ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                                  : isSelected
                                    ? "bg-rose-50 border-rose-500 text-rose-700"
                                    : "bg-slate-50 border-slate-100 text-slate-400"
                                : isSelected
                                  ? "bg-indigo-50 border-indigo-600 text-indigo-900"
                                  : "bg-white border-slate-100 hover:border-indigo-200 text-slate-600"
                            )}
                          >
                            <span>{option}</span>
                            {quizSubmitted && isCorrectAnswer && <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />}
                            {quizSubmitted && isSelected && !isCorrectAnswer && <XCircle size={14} className="text-rose-500 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    {quizSubmitted && (
                      <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2 animate-in fade-in duration-300">
                        <p className={cn(
                          "text-xs font-black uppercase tracking-widest",
                          quizIsCorrect ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {quizIsCorrect ? "Correct!" : "Incorrect"}
                        </p>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                          {activeLesson.quiz.explanation}
                        </p>
                      </div>
                    )}

                    {!quizSubmitted && (
                      <Button 
                        onClick={handleQuizSubmit}
                        disabled={!selectedQuizAnswer}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 px-6 font-bold text-xs uppercase tracking-wider"
                      >
                        Submit Answer
                      </Button>
                    )}
                  </div>
                )}

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
                    disabled={!quizIsCorrect}
                    className={cn(
                      "h-10 px-6 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all",
                      quizIsCorrect ? "bg-slate-900 hover:bg-slate-800 text-white" : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    )}
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
                <AnatomyModel 
                  selectedAnatomyJoint={selectedAnatomyJoint}
                  selectedStructure={selectedStructure}
                  onSelectStructure={setSelectedStructure}
                />
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
                    <p className="text-xs font-bold text-white leading-relaxed">{sandboxProtocol.text}</p>
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
              <PracticeSimulator 
                simStep={simStep}
                simImStatus={simImStatus}
                simHoldReflex={simHoldReflex}
                simApplyStretch={simApplyStretch}
                simApplyIsometric={simApplyIsometric}
                simNasalBreathing={simNasalBreathing}
                simTimer={simTimer}
                simTimerActive={simTimerActive}
                sandboxJoint={sandboxJoint}
                sandboxTissue={sandboxTissue}
                sandboxAction={sandboxAction}
                sandboxProtocol={sandboxProtocol}
                setSimHoldReflex={setSimHoldReflex}
                setSimApplyStretch={setSimApplyStretch}
                setSimApplyIsometric={setSimApplyIsometric}
                setSimNasalBreathing={setSimNasalBreathing}
                onStartSimulation={handleStartSimulation}
                onTestBaseline={handleTestBaseline}
                onApplyChallenge={handleApplyChallenge}
                onStartCorrectionTimer={handleStartCorrectionTimer}
                onRetest={handleRetest}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MechanoLessons;