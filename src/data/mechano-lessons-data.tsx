import type { ReactNode } from 'react';
import { 
  Shield, 
  Link as LinkIcon, 
  Compass, 
  Heart, 
  ArrowRightLeft, 
  Move, 
  Smile, 
  CheckCircle, 
  ChevronRight, 
  Lightbulb,
  Layers,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  icon: any;
  difficulty: 'Beginner' | 'Intermediate';
  content: ReactNode;
  quiz: {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  };
}

export const lessons: Lesson[] = [
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
    ),
    quiz: {
      question: "What percentage of afferent input is processed unconsciously by the cerebellum?",
      options: ["15%", "50%", "85%", "100%"],
      correctAnswer: "85%",
      explanation: "85% of proprioceptive movement data is processed unconsciously by the cerebellum via the Spinocerebellar tracts, while only 15% is processed consciously by the sensory cortex."
    }
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
              desc: "Apply the specific correction. Hold GV16 and stretch the priority ligament, then apply a tuning fork to the cranium or tap for 3-5 seconds.",
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
    ),
    quiz: {
      question: "What is the correct order of the 3-step mechanoreceptive loop?",
      options: ["Calibrate -> Stimulate -> Localize", "Stimulate -> Localize -> Calibrate", "Localize -> Stimulate -> Calibrate", "Stimulate -> Calibrate -> Localize"],
      correctAnswer: "Stimulate -> Localize -> Calibrate",
      explanation: "The clinical loop always begins by stimulating the threat, localizing the specific joint and plane of motion, and finally calibrating the correction."
    }
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
    ),
    quiz: {
      question: "If you apply the wrong mechanoreceptive correction, what does the brain do?",
      options: ["It locks into a permanent spasm", "It ignores the correction safely", "It triggers a panic attack", "It inhibits all muscles"],
      correctAnswer: "It ignores the correction safely",
      explanation: "The nervous system is highly resilient and self-correcting. If you apply an incorrect stimulus, the brain simply filters it out as noise and ignores it safely."
    }
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
    ),
    quiz: {
      question: "If a client has chronic L5 lower back pain, which cervical segment should you check first?",
      options: ["C1 (Atlas)", "C3", "C7", "T1"],
      correctAnswer: "C1 (Atlas)",
      explanation: "According to Lovett-Brother spinal reciprocation, C1 (Atlas) is the direct partner to L5. Resolving a C1 fixation often instantly clears L5 lower back pain."
    }
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
    ),
    quiz: {
      question: "Which plane of motion divides the body into front and back halves?",
      options: ["Sagittal", "Frontal", "Transverse"],
      correctAnswer: "Frontal",
      explanation: "The Frontal (or Coronal) plane divides the body into anterior (front) and posterior (back) halves, and is the plane of lateral flexion, abduction, and adduction."
    }
  }
];