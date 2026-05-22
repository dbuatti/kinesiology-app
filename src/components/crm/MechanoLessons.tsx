"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Info, 
  PlayCircle, 
  CheckCircle,
  Smile,
  Heart,
  Zap,
  RefreshCw,
  Target,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  icon: any;
  difficulty: 'Beginner' | 'Intermediate';
  content: React.ReactNode;
}

const MechanoLessons = () => {
  const [activeSubTab, setActiveSubTab] = useState<'lessons' | 'anatomy' | 'sandbox'>('lessons');
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [lessonProgress, setLessonProgress] = useState<Record<string, boolean>>({
    '1': false,
    '2': false,
    '3': false,
    '4': false
  });
  const [selectedAnatomyJoint, setSelectedAnatomyJoint] = useState<'knee' | 'ankle'>('knee');
  const [selectedStructure, setSelectedStructure] = useState<string | null>('mcl');

  // Sandbox State
  const [sandboxJoint, setSandboxJoint] = useState<string>('Knee');
  const [sandboxTissue, setSandboxTissue] = useState<'Ligament' | 'Tendon'>('Ligament');
  const [sandboxPlane, setSandboxPlane] = useState<string>('Sagittal');
  const [sandboxAction, setSandboxAction] = useState<string>('Flexion');

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
          <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <Shield size={20} />
            </div>
            <div>
              <h4 className="font-black text-emerald-900 text-sm uppercase tracking-tight">The Core Concept</h4>
              <p className="text-xs text-emerald-800 font-medium mt-1">
                Ligaments connect <strong>bone to bone</strong>. They are not just mechanical straps; they are high-density sensory organs packed with mechanoreceptors that feed 85% of your movement data to the cerebellum.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-black text-slate-900 text-base">Why You Shouldn't Be Intimidated:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Smile className="text-emerald-500" size={16} /> They are Passive Sensors
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ligaments don't contract. They only sense stretch. If a joint is unstable, the ligament gets over-stretched, sending a "threat" signal to the brain.
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <CheckCircle className="text-emerald-500" size={16} /> The Correction is Simple
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  To clear the threat, we simply stretch the ligament slightly (re-creating the stimulus) while holding <strong>GV16</strong> (the cerebellum's reflex point) to update the map.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-3">
            <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">The Neural Pathway</p>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-bold">
              <div className="px-3 py-2 bg-white/10 rounded-lg border border-white/10 text-center w-full md:w-auto">Ligament Stretch</div>
              <ChevronRight className="text-slate-500 hidden md:block" />
              <div className="px-3 py-2 bg-white/10 rounded-lg border border-white/10 text-center w-full md:w-auto">Spinocerebellar Tract</div>
              <ChevronRight className="text-slate-500 hidden md:block" />
              <div className="px-3 py-2 bg-white/10 rounded-lg border border-white/10 text-center w-full md:w-auto">Ipsilateral Cerebellum</div>
              <ChevronRight className="text-slate-500 hidden md:block" />
              <div className="px-3 py-2 bg-emerald-600 rounded-lg text-center w-full md:w-auto">GV16 Reset</div>
            </div>
          </div>

          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
            <Lightbulb className="text-amber-500 shrink-0 mt-0.5" size={18} />
            <p className="text-xs text-amber-800 font-medium leading-relaxed">
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
          <div className="p-5 bg-rose-50 rounded-2xl border border-rose-100 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <LinkIcon size={20} />
            </div>
            <div>
              <h4 className="font-black text-rose-900 text-sm uppercase tracking-tight">The Core Concept</h4>
              <p className="text-xs text-rose-800 font-medium mt-1">
                Tendons connect <strong>muscle to bone</strong>. They house the Golgi Tendon Organs (GTOs), which act as springy tension scales. If a muscle pulls too hard, the GTO inhibits the muscle to prevent it from tearing.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-black text-slate-900 text-base">Why You Shouldn't Be Intimidated:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Smile className="text-rose-500" size={16} /> They are Active Regulators
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tendons respond to active muscle contraction. When a tendon's threshold is "smudged," the brain keeps the muscle weak or chronically tight to protect it.
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <CheckCircle className="text-rose-500" size={16} /> The Correction is Active
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  To reset the GTO threshold, we perform a light, pain-free <strong>isometric contraction (30-40% effort)</strong> in the restricted action while holding the contralateral sensory cortex.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-3">
            <p className="text-xs font-black text-rose-400 uppercase tracking-widest">The Neural Pathway</p>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-bold">
              <div className="px-3 py-2 bg-white/10 rounded-lg border border-white/10 text-center w-full md:w-auto">Isometric Hold</div>
              <ChevronRight className="text-slate-500 hidden md:block" />
              <div className="px-3 py-2 bg-white/10 rounded-lg border border-white/10 text-center w-full md:w-auto">DCML Pathway</div>
              <ChevronRight className="text-slate-500 hidden md:block" />
              <div className="px-3 py-2 bg-white/10 rounded-lg border border-white/10 text-center w-full md:w-auto">Contralateral S1 Cortex</div>
              <ChevronRight className="text-slate-500 hidden md:block" />
              <div className="px-3 py-2 bg-rose-600 rounded-lg text-center w-full md:w-auto">30-40% Effort Reset</div>
            </div>
          </div>

          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
            <Lightbulb className="text-amber-500 shrink-0 mt-0.5" size={18} />
            <p className="text-xs text-amber-800 font-medium leading-relaxed">
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
                color: "border-amber-500 bg-amber-50/30 text-amber-900"
              },
              {
                step: "Step 2: Localize (Find the Geometry)",
                desc: "Follow the hierarchy: Region (Upper/Lower) -> Laterality (Left/Right) -> Skeleton (Axial/Appendicular) -> Specific Joint. Then find the plane of motion (Sagittal, Frontal, Transverse).",
                color: "border-indigo-500 bg-indigo-50/30 text-indigo-900"
              },
              {
                step: "Step 3: Calibrate (Apply the Correction)",
                desc: "Apply the specific correction. For Unconscious (ligaments), hold GV16 and stretch. For Conscious (tendons), hold contralateral S1 and perform a light isometric hold.",
                color: "border-emerald-500 bg-emerald-50/30 text-emerald-900"
              }
            ].map((item, i) => (
              <div key={i} className={cn("p-5 rounded-2xl border-2 space-y-2", item.color)}>
                <h4 className="font-black text-base">{item.step}</h4>
                <p className="text-xs leading-relaxed opacity-90 font-medium">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-3">
            <p className="text-xs font-black text-indigo-400 uppercase tracking-widest">The Golden Rule</p>
            <p className="text-sm font-bold leading-relaxed italic">
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
          <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <Heart size={20} />
            </div>
            <div>
              <h4 className="font-black text-indigo-900 text-sm uppercase tracking-tight">A Message for You</h4>
              <p className="text-xs text-indigo-800 font-medium mt-1">
                It is completely normal to feel intimidated by neurology. But remember: you are not performing brain surgery. You are simply communicating with the nervous system using its own language.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-black text-slate-900 text-base">Three Safety Guarantees:</h4>
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
                <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <p className="font-bold text-slate-900 text-sm">{item.title}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
            <Smile className="text-amber-500 shrink-0 mt-1" size={24} />
            <div>
              <h4 className="font-black text-amber-900 text-sm uppercase tracking-tight">Your Confidence Mantra</h4>
              <p className="text-xs text-amber-800 font-medium mt-1 italic">
                "I am a facilitator of the brain's own healing. I don't need to be perfect; I just need to be curious, gentle, and systematic."
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
        correction: "Hold GV16 while applying a light stretch to the LCL. Tap the cranium or apply a tuning fork for 3-5 seconds."
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
    }
  };

  const getSandboxProtocol = () => {
    if (sandboxTissue === 'Ligament') {
      return {
        title: `Unconscious Ligament Protocol: ${sandboxJoint}`,
        pathway: "Spinocerebellar Tract -> Ipsilateral Cerebellum",
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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Sub-navigation */}
      <div className="flex justify-center">
        <div className="bg-slate-100 p-1.5 rounded-2xl flex flex-wrap justify-center gap-1 border border-slate-200">
          <Button 
            variant={activeSubTab === 'lessons' ? 'default' : 'ghost'}
            onClick={() => { setActiveSubTab('lessons'); setCurrentLessonId(null); }}
            className={cn("rounded-xl h-10 px-6 font-bold text-[10px] uppercase tracking-widest", activeSubTab === 'lessons' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500")}
          >
            <BookOpen size={16} className="mr-2" /> Confidence Lessons
          </Button>
          <Button 
            variant={activeSubTab === 'anatomy' ? 'default' : 'ghost'}
            onClick={() => setActiveSubTab('anatomy')}
            className={cn("rounded-xl h-10 px-6 font-bold text-[10px] uppercase tracking-widest", activeSubTab === 'anatomy' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500")}
          >
            <Layers size={16} className="mr-2" /> Interactive Anatomy
          </Button>
          <Button 
            variant={activeSubTab === 'sandbox' ? 'default' : 'ghost'}
            onClick={() => setActiveSubTab('sandbox')}
            className={cn("rounded-xl h-10 px-6 font-bold text-[10px] uppercase tracking-widest", activeSubTab === 'sandbox' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500")}
          >
            <Compass size={16} className="mr-2" /> Protocol Sandbox
          </Button>
        </div>
      </div>

      {/* Lessons Tab */}
      {activeSubTab === 'lessons' && (
        <div className="max-w-4xl mx-auto space-y-8">
          {!currentLessonId ? (
            <div className="space-y-6">
              <div className="text-center max-w-xl mx-auto space-y-2">
                <h3 className="text-2xl font-black text-slate-900">Confidence Lessons</h3>
                <p className="text-slate-500 font-medium">Bite-sized, reassuring lessons designed to demystify tendons, ligaments, and the clinical process.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {lessons.map((lesson) => {
                  const Icon = lesson.icon;
                  const isCompleted = lessonProgress[lesson.id];
                  return (
                    <Card key={lesson.id} className="border-none shadow-lg rounded-[2rem] bg-white hover:shadow-xl transition-all group overflow-hidden flex flex-col justify-between">
                      <CardHeader className="p-6 pb-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center shadow-md transition-all group-hover:scale-110",
                            lesson.id === '1' ? "bg-emerald-50 text-emerald-600" :
                            lesson.id === '2' ? "bg-rose-50 text-rose-600" :
                            lesson.id === '3' ? "bg-indigo-50 text-indigo-600" :
                            "bg-blue-50 text-blue-600"
                          )}>
                            <Icon size={24} />
                          </div>
                          <div className="flex gap-2">
                            <Badge className="bg-slate-100 text-slate-600 border-none font-black text-[8px] uppercase tracking-widest">
                              {lesson.duration}
                            </Badge>
                            {isCompleted && (
                              <Badge className="bg-emerald-100 text-emerald-700 border-none font-black text-[8px] uppercase tracking-widest flex items-center gap-1">
                                <CheckCircle2 size={10} /> Completed
                              </Badge>
                            )}
                          </div>
                        </div>
                        <CardTitle className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {lesson.title}
                        </CardTitle>
                        <CardDescription className="font-medium mt-1">
                          {lesson.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 pt-0">
                        <Button 
                          onClick={() => setCurrentLessonId(lesson.id)}
                          className="w-full bg-slate-900 hover:bg-indigo-600 h-11 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all"
                        >
                          Start Lesson <PlayCircle size={14} className="ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : (
            <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden animate-in zoom-in-95 duration-300">
              <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
                <div className="flex items-center justify-between">
                  <Button 
                    variant="ghost" 
                    onClick={() => setCurrentLessonId(null)}
                    className="rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-100"
                  >
                    <ChevronLeft size={16} className="mr-1" /> Back to Lessons
                  </Button>
                  <Badge className="bg-indigo-50 text-indigo-600 border-none font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">
                    Lesson {activeLesson?.id} of {lessons.length}
                  </Badge>
                </div>
                <div className="mt-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                    {activeLesson && React.createElement(activeLesson.icon, { size: 24 })}
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-black text-slate-900">{activeLesson?.title}</CardTitle>
                    <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-indigo-600 mt-1">
                      {activeLesson?.difficulty} • {activeLesson?.duration}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                {activeLesson?.content}

                <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                  <Button 
                    variant="ghost" 
                    onClick={() => setCurrentLessonId(null)}
                    className="rounded-xl font-bold text-slate-500"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => handleCompleteLesson(activeLesson!.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 h-12 px-8 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-100"
                  >
                    Complete Lesson & Build Confidence <CheckCircle2 size={16} className="ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Interactive Anatomy Tab */}
      {activeSubTab === 'anatomy' && (
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Interactive SVG */}
          <Card className="lg:col-span-7 border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden flex flex-col justify-between">
            <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black text-slate-900">Interactive Anatomy Model</CardTitle>
                  <CardDescription className="font-medium">Click on any structure to see its clinical logic.</CardDescription>
                </div>
                <div className="flex gap-1 bg-slate-200/50 p-1 rounded-xl">
                  <Button 
                    variant={selectedAnatomyJoint === 'knee' ? 'default' : 'ghost'}
                    onClick={() => { setSelectedAnatomyJoint('knee'); setSelectedStructure('mcl'); }}
                    className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest"
                  >
                    Knee
                  </Button>
                  <Button 
                    variant={selectedAnatomyJoint === 'ankle' ? 'default' : 'ghost'}
                    onClick={() => { setSelectedAnatomyJoint('ankle'); setSelectedStructure('atfl'); }}
                    className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest"
                  >
                    Ankle
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 flex items-center justify-center min-h-[350px] bg-slate-50/50">
              {selectedAnatomyJoint === 'knee' ? (
                <svg viewBox="0 0 200 240" className="w-full max-w-[280px] h-auto">
                  {/* Femur (Thigh Bone) */}
                  <path d="M70,10 L130,10 L130,80 C130,100 140,110 125,120 C110,130 90,130 75,120 C60,110 70,100 70,80 Z" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />
                  {/* Tibia (Shin Bone) */}
                  <path d="M75,150 C90,140 110,140 125,150 L125,230 L75,230 Z" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />
                  {/* Fibula */}
                  <rect x="60" y="160" width="12" height="70" rx="4" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1.5" />

                  {/* Quadriceps Tendon */}
                  <path 
                    d="M90,40 L110,40 L110,90 L90,90 Z" 
                    fill={selectedStructure === 'quadriceps' ? '#F43F5E' : '#FDA4AF'} 
                    stroke={selectedStructure === 'quadriceps' ? '#E11D48' : '#FB7185'} 
                    strokeWidth="2" 
                    className="cursor-pointer transition-all hover:opacity-90"
                    onClick={() => setSelectedStructure('quadriceps')}
                  />
                  {/* Patella (Kneecap) */}
                  <circle 
                    cx="100" 
                    cy="105" 
                    r="18" 
                    fill="#F1F5F9" 
                    stroke="#64748B" 
                    strokeWidth="2" 
                  />
                  {/* Patellar Tendon */}
                  <path 
                    d="M92,120 L108,120 L105,155 L95,155 Z" 
                    fill={selectedStructure === 'patellar' ? '#F43F5E' : '#FDA4AF'} 
                    stroke={selectedStructure === 'patellar' ? '#E11D48' : '#FB7185'} 
                    strokeWidth="2" 
                    className="cursor-pointer transition-all hover:opacity-90"
                    onClick={() => setSelectedStructure('patellar')}
                  />

                  {/* Medial Collateral Ligament (MCL) */}
                  <path 
                    d="M125,95 C128,110 128,130 125,145" 
                    fill="none" 
                    stroke={selectedStructure === 'mcl' ? '#10B981' : '#6EE7B7'} 
                    strokeWidth="8" 
                    strokeLinecap="round"
                    className="cursor-pointer transition-all hover:opacity-90"
                    onClick={() => setSelectedStructure('mcl')}
                  />

                  {/* Lateral Collateral Ligament (LCL) */}
                  <path 
                    d="M70,95 C67,110 62,130 65,145" 
                    fill="none" 
                    stroke={selectedStructure === 'lcl' ? '#10B981' : '#6EE7B7'} 
                    strokeWidth="6" 
                    strokeLinecap="round"
                    className="cursor-pointer transition-all hover:opacity-90"
                    onClick={() => setSelectedStructure('lcl')}
                  />

                  {/* Labels */}
                  <text x="100" y="30" textAnchor="middle" className="text-[8px] font-black fill-slate-400 uppercase tracking-widest">Femur</text>
                  <text x="100" y="210" textAnchor="middle" className="text-[8px] font-black fill-slate-400 uppercase tracking-widest">Tibia</text>
                </svg>
              ) : (
                <svg viewBox="0 0 200 240" className="w-full max-w-[280px] h-auto">
                  {/* Tibia & Fibula */}
                  <rect x="75" y="10" width="35" height="110" rx="4" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />
                  <rect x="55" y="20" width="15" height="100" rx="4" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1.5" />

                  {/* Talus & Calcaneus (Heel) */}
                  <path d="M65,130 C65,120 120,120 130,130 C140,140 150,160 140,180 C130,190 60,190 55,170 Z" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />
                  <path d="M55,170 C55,190 70,210 100,210 C130,210 140,190 140,180 Z" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1.5" />

                  {/* Achilles Tendon */}
                  <path 
                    d="M110,40 L120,40 L115,150 L105,150 Z" 
                    fill={selectedStructure === 'achilles' ? '#F43F5E' : '#FDA4AF'} 
                    stroke={selectedStructure === 'achilles' ? '#E11D48' : '#FB7185'} 
                    strokeWidth="2" 
                    className="cursor-pointer transition-all hover:opacity-90"
                    onClick={() => setSelectedStructure('achilles')}
                  />

                  {/* Anterior Talofibular Ligament (ATFL) */}
                  <path 
                    d="M65,115 L90,135" 
                    fill="none" 
                    stroke={selectedStructure === 'atfl' ? '#10B981' : '#6EE7B7'} 
                    strokeWidth="6" 
                    strokeLinecap="round"
                    className="cursor-pointer transition-all hover:opacity-90"
                    onClick={() => setSelectedStructure('atfl')}
                  />

                  {/* Calcaneofibular Ligament (CFL) */}
                  <path 
                    d="M60,125 L75,165" 
                    fill="none" 
                    stroke={selectedStructure === 'cfl' ? '#10B981' : '#6EE7B7'} 
                    strokeWidth="6" 
                    strokeLinecap="round"
                    className="cursor-pointer transition-all hover:opacity-90"
                    onClick={() => setSelectedStructure('cfl')}
                  />

                  {/* Labels */}
                  <text x="92" y="30" textAnchor="middle" className="text-[8px] font-black fill-slate-400 uppercase tracking-widest">Tibia</text>
                  <text x="100" y="200" textAnchor="middle" className="text-[8px] font-black fill-slate-400 uppercase tracking-widest">Calcaneus</text>
                </svg>
              )}
            </CardContent>
          </Card>

          {/* Right Column: Clinical Logic Card */}
          <div className="lg:col-span-5 space-y-6">
            {currentStructure ? (
              <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden border-l-4 border-indigo-600 animate-in fade-in slide-in-from-right-4 duration-300">
                <CardHeader className="p-6 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={cn(
                      "border-none font-black text-[8px] uppercase tracking-widest",
                      currentStructure.type === 'Ligament' ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                    )}>
                      {currentStructure.type}
                    </Badge>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Anatomy Guide</span>
                  </div>
                  <CardTitle className="text-xl font-black text-slate-900">{currentStructure.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</p>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">{currentStructure.desc}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">How to Test / Stimulate</p>
                    <p className="text-xs text-slate-700 font-bold leading-relaxed">{currentStructure.test}</p>
                  </div>

                  <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 space-y-2">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                      <Zap size={12} /> Correction Protocol
                    </p>
                    <p className="text-xs text-indigo-900 font-bold leading-relaxed">{currentStructure.correction}</p>
                  </div>

                  <div className="p-4 bg-slate-900 text-white rounded-xl space-y-1">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Neurological Logic</p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {currentStructure.type === 'Ligament' 
                        ? "Targets the Spinocerebellar tract to the ipsilateral cerebellum. Hold GV16 to clear the threat." 
                        : "Targets the DCML pathway to the contralateral sensory cortex. Perform a light isometric hold to reset GTO threshold."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-none shadow-lg rounded-[2.5rem] bg-white p-8 text-center flex flex-col items-center justify-center h-full min-h-[300px]">
                <HelpCircle size={48} className="text-slate-200 mb-4" />
                <h4 className="font-black text-slate-900">Select a Structure</h4>
                <p className="text-xs text-slate-400 mt-2 max-w-xs">Click on any highlighted ligament or tendon in the interactive model to view its clinical logic.</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Protocol Sandbox Tab */}
      {activeSubTab === 'sandbox' && (
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h3 className="text-2xl font-black text-slate-900">Protocol Sandbox</h3>
            <p className="text-slate-500 font-medium">Select a joint and tissue type to generate a step-by-step confidence protocol.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Left Column: Configuration */}
            <Card className="md:col-span-5 border-none shadow-lg rounded-[2.5rem] bg-white p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">1. Select Joint</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Knee", "Ankle", "Shoulder"].map(j => (
                    <Button 
                      key={j}
                      variant={sandboxJoint === j ? 'default' : 'outline'}
                      onClick={() => { setSandboxJoint(j); setSandboxAction(sandboxActions[j as keyof typeof sandboxActions][sandboxPlane as keyof typeof sandboxActions['Knee']][0] || 'Flexion'); }}
                      className="h-10 rounded-xl text-xs font-bold"
                    >
                      {j}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">2. Select Tissue Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant={sandboxTissue === 'Ligament' ? 'default' : 'outline'}
                    onClick={() => setSandboxTissue('Ligament')}
                    className="h-10 rounded-xl text-xs font-bold"
                  >
                    Ligament (Unconscious)
                  </Button>
                  <Button 
                    variant={sandboxTissue === 'Tendon' ? 'default' : 'outline'}
                    onClick={() => setSandboxTissue('Tendon')}
                    className="h-10 rounded-xl text-xs font-bold"
                  >
                    Tendon (Conscious)
                  </Button>
                </div>
              </div>

              {sandboxTissue === 'Tendon' && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">3. Select Plane of Motion</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["Sagittal", "Frontal", "Transverse"].map(p => (
                        <Button 
                          key={p}
                          variant={sandboxPlane === p ? 'default' : 'outline'}
                          onClick={() => { setSandboxPlane(p); setSandboxAction(sandboxActions[sandboxJoint as keyof typeof sandboxActions][p as keyof typeof sandboxActions['Knee']][0] || 'Flexion'); }}
                          className="h-10 rounded-xl text-xs font-bold"
                        >
                          {p}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">4. Select Action</label>
                    <div className="grid grid-cols-2 gap-2">
                      {sandboxActions[sandboxJoint as keyof typeof sandboxActions][sandboxPlane as keyof typeof sandboxActions['Knee']].map(a => (
                        <Button 
                          key={a}
                          variant={sandboxAction === a ? 'default' : 'outline'}
                          onClick={() => setSandboxAction(a)}
                          className="h-10 rounded-xl text-xs font-bold"
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
            <Card className="md:col-span-7 border-none shadow-xl rounded-[2.5rem] bg-slate-900 text-white overflow-hidden flex flex-col justify-between">
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge className={cn(
                    "border-none font-black text-[8px] uppercase tracking-widest",
                    sandboxTissue === 'Ligament' ? "bg-emerald-500" : "bg-rose-500"
                  )}>
                    {sandboxTissue} Priority
                  </Badge>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generated Protocol</span>
                </div>
                <CardTitle className="text-2xl font-black">{sandboxProtocol.title}</CardTitle>
                <p className="text-xs text-indigo-300 font-bold mt-1">Pathway: {sandboxProtocol.pathway}</p>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step 1: Stimulate (Find the Threat)</p>
                  <p className="text-sm font-bold text-white leading-relaxed">{sandboxProtocol.stimulus}</p>
                </div>

                <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step 2: Calibrate (Apply Correction)</p>
                  <p className="text-sm font-bold text-white leading-relaxed">{sandboxProtocol.correction}</p>
                </div>

                <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20 flex items-start gap-3">
                  <Lightbulb className="text-amber-400 shrink-0 mt-0.5" size={18} />
                  <p className="text-xs text-amber-200 font-medium leading-relaxed">
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