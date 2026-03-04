import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ShieldCheck, 
  Brain, 
  Briefcase, 
  Users, 
  Heart, 
  Wind, 
  PenLine, 
  Sparkles,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { toast } from "sonner";

const Week3Worksheet = () => {
  const [name, setName] = useState('');
  const [isReleased, setIsReleased] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleAnswerChange = (id: string, value: string) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handleRelease = () => {
    if (!name) {
      toast.error("Please enter your full name to sign the release statement.");
      return;
    }
    setIsReleased(true);
    toast.success("Sovereignty Reclaimed. The release is sealed.");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/50 min-h-screen">
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-12"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-2 bg-indigo-100 rounded-full text-indigo-600 mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            The Integrated Healer Program: Week 3
          </h1>
          <p className="text-xl text-indigo-600 font-medium">Be your No.1 Client</p>
          <h2 className="text-2xl font-semibold text-slate-700">
            Releasing Curses, Generational Trauma & Secret Society Agreements
          </h2>
          <p className="max-w-2xl mx-auto text-slate-500 italic">
            "Shame, blame, and guilt are not just personal experiences—they are inherited patterns, passed down through generations."
          </p>
        </motion.div>

        {/* Section 1: Awareness Check */}
        <motion.div variants={itemVariants}>
          <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-indigo-50/50 rounded-t-xl">
              <CardTitle className="flex items-center gap-2 text-indigo-900">
                <AlertCircle className="w-5 h-5" />
                Self-Awareness Audit
              </CardTitle>
              <CardDescription>Reflect on how these patterns manifest in your current reality.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid gap-6">
                {[
                  { id: 'q1', label: "Do I feel guilty when I succeed?" },
                  { id: 'q2', label: "Do I avoid stepping into leadership out of fear of being judged?" },
                  { id: 'q3', label: "Do I self-sabotage when things start going well?" },
                  { id: 'q4', label: "Am I afraid to let go of certain relationships because of guilt?" },
                  { id: 'q5', label: "Do I subconsciously seek struggle in love or friendships?" },
                  { id: 'q6', label: "Am I staying small to avoid outgrowing my loved ones?" }
                ].map((q) => (
                  <div key={q.id} className="space-y-2">
                    <Label className="text-base font-medium text-slate-800">{q.label}</Label>
                    <Textarea 
                      placeholder="Reflect on your experience..."
                      className="min-h-[80px] border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                      value={answers[q.id] || ''}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Section 2: Impact Areas */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-rose-700">
                <Brain className="w-5 h-5" />
                Neurological Impact
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 space-y-2">
              <p>Your nervous system adapts as if you are the one experiencing the original trauma.</p>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>Fight:</strong> Overcompensating, excessive control.</li>
                <li><strong>Flight:</strong> Avoidance of success, fear of being seen.</li>
                <li><strong>Freeze:</strong> Chronic procrastination, feeling stuck.</li>
                <li><strong>Fawn:</strong> People-pleasing, overgiving.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700">
                <Briefcase className="w-5 h-5" />
                Business & Money
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 space-y-2">
              <p>How generational burdens show up in work:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Fear of charging what you're worth.</li>
                <li>Difficulty being visible online or in leadership.</li>
                <li>Under-earning or plateauing in income.</li>
                <li>Sabotaging growth opportunities.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Users className="w-5 h-5" />
                Societal & Cultural
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 space-y-2">
              <p>Control systems that reinforce guilt & shame:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>Religious:</strong> Tying suffering to morality.</li>
                <li><strong>Secret Societies:</strong> Oaths made by ancestors.</li>
                <li><strong>Cultural:</strong> "Keep your head down, don't stand out."</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-700">
                <Heart className="w-5 h-5" />
                Relational Impact
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 space-y-2">
              <p>How these patterns show up in love:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Attracting partners who reinforce unworthiness.</li>
                <li>Carrying family burdens in relationships.</li>
                <li>Struggling with codependency.</li>
                <li>Feeling guilty for choosing yourself.</li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        {/* Section 3: The Release Script */}
        <motion.div variants={itemVariants}>
          <Card className="border-2 border-indigo-200 shadow-2xl bg-indigo-900 text-white overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <ShieldCheck className="w-32 h-32" />
            </div>
            <CardHeader className="text-center border-b border-indigo-800 pb-8">
              <CardTitle className="text-3xl font-serif italic">Release & Renunciation Statement</CardTitle>
              <CardDescription className="text-indigo-200">Read this aloud with intention and authority.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 md:p-12 space-y-8">
              <div className="space-y-6 text-lg leading-relaxed font-serif text-indigo-50">
                <p className="italic">
                  "I, <input 
                    type="text" 
                    placeholder="[FULL NAME]" 
                    className="bg-transparent border-b border-indigo-400 focus:border-white outline-none px-2 text-white placeholder:text-indigo-400/50 w-64"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />, stand in my full sovereignty, fully present in my body, my mind, my soul, and my spirit."
                </p>
                <p>"I now revoke, dismantle, and dissolve—across all timelines, dimensions, and realities—any and all oaths, vows, contracts, or agreements made by my ancestors or myself, knowingly or unknowingly, that do not serve my highest good."</p>
                <p>"I break and release all generational burdens, inherited shame, curses, bindings, pacts, allegiances, and unseen contracts that have kept me bound in silence, servitude, fear, shame, guilt, scarcity, suffering, or limitation."</p>
                <p>"I call back my life force energy, my voice, my power, my abundance, and my divine connection, fully restored and whole."</p>
                <p>"I sever all energetic cords, karmic ties, and unseen influences that no longer serve me. I command all false programming, manipulations, or distortions placed upon me or my lineage to dissolve now."</p>
                <p>"I free myself and all future generations from these burdens. What has been bound is now released. What was taken is now restored. I reclaim my sacred sovereignty."</p>
                <p>"I ask for positive divine protection from those who seek my highest good to assist in healing, and guidance, and to fill the space that has been cleared, anchoring my body, mind, and spirit in truth, freedom, and unconditional love."</p>
                <p className="text-center text-2xl font-bold pt-4">"So it is. It is done. It is sealed."</p>
              </div>

              <div className="flex flex-col items-center gap-4 pt-8">
                {!isReleased ? (
                  <Button 
                    onClick={handleRelease}
                    className="bg-white text-indigo-900 hover:bg-indigo-50 px-12 py-6 text-xl font-bold rounded-full shadow-lg transition-all hover:scale-105"
                  >
                    Seal the Release
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-400 text-2xl font-bold animate-in zoom-in duration-500">
                    <CheckCircle2 className="w-8 h-8" />
                    Sovereignty Reclaimed
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Section 4: Somatic Integration */}
        <motion.div variants={itemVariants}>
          <Card className="border-none shadow-xl bg-emerald-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-900">
                <Wind className="w-5 h-5" />
                Somatic Integration & Breathwork
              </CardTitle>
              <CardDescription>Physically clear these imprints from your body.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100">
                  <h4 className="font-bold text-emerald-800 mb-2">1. Shake the Body</h4>
                  <p className="text-sm text-slate-600">Gently shake your limbs, loosen the joints, and release stored tension from your muscles.</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100">
                  <h4 className="font-bold text-emerald-800 mb-2">2. Deep Breathing</h4>
                  <p className="text-sm text-slate-600">Inhale sovereignty and self-authority. Exhale ancestral burdens and heavy energy.</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100">
                  <h4 className="font-bold text-emerald-800 mb-2">3. Lung Release ('SSSS')</h4>
                  <p className="text-sm text-slate-600">Exhale with a long 'SSSS' sound to release deep-seated grief and hidden agreements.</p>
                </div>
              </div>
              <div className="mt-8 p-4 bg-emerald-900 text-emerald-50 rounded-xl text-center italic">
                "As you exhale, feel the weight leaving your body. You are free. You are sovereign. You are whole."
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Section 5: Post-Session Journaling */}
        <motion.div variants={itemVariants}>
          <Card className="border-none shadow-xl bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <PenLine className="w-5 h-5" />
                Post-Session Journaling
              </CardTitle>
              <CardDescription>Capture the insights that surfaced during this deep work.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              {[
                { id: 'j1', label: "What feelings or sensations arose during the release?" },
                { id: 'j2', label: "Did any family memories, phrases, or emotions surface?" },
                { id: 'j3', label: "What parts of my life have felt 'blocked' that I now feel free to move forward in?" },
                { id: 'j4', label: "How does it feel to step into my own authority now?" }
              ].map((j) => (
                <div key={j.id} className="space-y-3">
                  <Label className="text-lg font-medium text-slate-800">{j.label}</Label>
                  <Textarea 
                    placeholder="Write your reflections here..."
                    className="min-h-[120px] border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 text-lg"
                    value={answers[j.id] || ''}
                    onChange={(e) => handleAnswerChange(j.id, e.target.value)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div variants={itemVariants} className="text-center pb-12">
          <p className="text-slate-400 text-sm">
            © {new Date().getFullYear()} The Integrated Healer Program. All rights reserved.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Week3Worksheet;
