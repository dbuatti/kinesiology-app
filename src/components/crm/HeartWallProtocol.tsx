"use client";

import React, { useState } from 'react';
import { 
  Heart, 
  Shield, 
  Layers, 
  Zap, 
  CheckCircle2, 
  Info, 
  ArrowRight, 
  Search,
  Target,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  MousePointer2,
  Hand,
  ImageIcon,
  BookOpen,
  Activity,
  AlertCircle,
  Dumbbell,
  History,
  ShieldCheck,
  Brain,
  Plus,
  LayoutGrid,
  ClipboardList,
  Workflow,
  ArrowRightLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EMOTION_CODE_CHART, ROW_DATA } from '@/data/emotion-code-data';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const ASSESSMENT_STEPS = [
  { id: 1, title: "Permission", desc: "Assess Heart Wall presence & permission.", icon: ShieldCheck, color: "text-indigo-600", bg: "bg-indigo-50" },
  { id: 2, title: "Find Emotion", desc: "Identify the specific trapped emotion.", icon: Search, color: "text-rose-600", bg: "bg-rose-50" },
  { id: 3, title: "Verify Muscles", desc: "Test associated organ/row muscles.", icon: Dumbbell, color: "text-amber-600", bg: "bg-amber-50" },
  { id: 4, title: "Brain Zones", desc: "Identify Efferent brain coordinates.", icon: Brain, color: "text-purple-600", bg: "bg-purple-50" },
  { id: 5, title: "Context (CH)", desc: "Age, Event, or Inherited status.", icon: History, color: "text-blue-600", bg: "bg-blue-50" }
];

const CORRECTION_STEPS = [
  { id: 6, title: "Permission", desc: "Confirm readiness to release layer.", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
  { id: 7, title: "Stim Zone", desc: "Stimulate Heart Referral Zone.", icon: Activity, color: "text-rose-500", bg: "bg-rose-50" },
  { id: 8, title: "Hold Point", desc: "Hold Organ Pulse Point or Muscle.", icon: Hand, color: "text-indigo-500", bg: "bg-indigo-50" },
  { id: 9, title: "Tap & Release", desc: "Tap Efferent zones with intention.", icon: Zap, color: "text-amber-500", bg: "bg-amber-50" }
];

const MATERIALS = [
  { name: "Wood", desc: "Flexible but sturdy protection.", icon: "🌳" },
  { name: "Stone", desc: "Heavy, ancient, rigid barrier.", icon: "🪨" },
  { name: "Metal", desc: "Cold, impenetrable shield.", icon: "🛡️" },
  { name: "Glass", desc: "Fragile, transparent, sharp.", icon: "💎" },
  { name: "Plastic", desc: "Artificial, synthetic, isolating.", icon: "📦" }
];

const HeartWallProtocol = () => {
  const [selectedCell, setSelectedCell] = useState<{ row: number, col: 'A' | 'B' } | null>(null);
  const [showChart, setShowChart] = useState(true);
  const [activeFlow, setActiveFlow] = useState<'assessment' | 'correction'>('assessment');

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-full mx-auto pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
        <div className="space-y-1">
          <h1 className="text-4xl font-serif font-bold text-slate-900">Heart Wall Protocol</h1>
          <p className="text-lg text-slate-500 font-medium">Subconscious Barrier Release & Neural Integration</p>
        </div>
        <div className="flex gap-3">
          <Badge className="bg-rose-600 text-white border-none font-black text-[10px] uppercase tracking-[0.3em] px-4 py-2 rounded-full shadow-lg shadow-rose-200">
            Clinical Standard
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* Left Column: Clinical Pathway & Reference */}
        <div className="xl:col-span-4 space-y-10">
          {/* Pathway Card */}
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-black flex items-center gap-3 text-slate-900">
                  <Workflow size={24} className="text-indigo-600" /> Clinical Pathway
                </CardTitle>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button 
                    onClick={() => setActiveFlow('assessment')}
                    className={cn("px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all", activeFlow === 'assessment' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400")}
                  >
                    Assess
                  </button>
                  <button 
                    onClick={() => setActiveFlow('correction')}
                    className={cn("px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all", activeFlow === 'correction' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400")}
                  >
                    Correct
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="relative space-y-4">
                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-100" />
                {(activeFlow === 'assessment' ? ASSESSMENT_STEPS : CORRECTION_STEPS).map((step) => (
                  <div key={step.id} className="relative flex items-start gap-6 group">
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-black text-[10px] shadow-sm z-10 transition-transform group-hover:scale-110",
                      step.bg, step.color
                    )}>
                      {step.id}
                    </div>
                    <div className="space-y-1 pt-1">
                      <h4 className="font-bold text-sm text-slate-900 leading-none">{step.title}</h4>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Visceral Referral Zone */}
          <Card className="border-none shadow-lg rounded-[2.5rem] bg-rose-50 border-2 border-rose-100 overflow-hidden">
            <CardHeader className="bg-rose-600 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shadow-inner">
                  <Activity size={20} />
                </div>
                <div>
                  <CardTitle className="text-lg font-black">Referral Zone (Step 7)</CardTitle>
                  <p className="text-rose-200 text-[10px] font-bold uppercase tracking-widest">Heart Somatic Mapping</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="aspect-[4/5] rounded-[2rem] overflow-hidden bg-white border border-rose-100 shadow-inner flex items-center justify-center p-4">
                <img 
                  src="/images/heart-referral.png" 
                  alt="Heart Visceral Referral Zones" 
                  className="max-w-full h-auto rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const placeholder = document.createElement('div');
                      placeholder.className = "flex flex-col items-center text-rose-200 gap-2";
                      placeholder.innerHTML = '<Heart size={48} className="fill-current" /><p class="text-[10px] font-black uppercase tracking-widest">Referral Diagram</p>';
                      parent.appendChild(placeholder);
                    }
                  }}
                />
              </div>
              <div className="p-4 bg-white rounded-2xl border border-rose-100">
                <ul className="space-y-2 text-[11px] text-slate-700 font-bold">
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Left Chest / Precordium</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Left Shoulder & Upper Back</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Medial aspect of Left Arm</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Symbolic Materials */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-2">
              <Layers size={16} className="text-indigo-600" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Symbolic Materials (Step 2)</h3>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {MATERIALS.map((m) => (
                <div key={m.name} className="flex items-center gap-4 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-200 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-xl group-hover:scale-110 transition-transform shadow-inner">
                    {m.icon}
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900">{m.name}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Emotion Chart & Findings */}
        <div className="xl:col-span-8 space-y-8">
          {/* Emotion Chart Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-xl">
                  <Heart size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Emotion Chart (Step 2)</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Identify the priority "brick"</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowChart(!showChart)}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                >
                  {showChart ? <ChevronUp size={16} className="mr-1" /> : <ChevronDown size={16} className="mr-1" />}
                  {showChart ? "Hide Chart" : "Show Chart"}
                </Button>
              </div>
            </div>

            {showChart && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-500">
                {/* Diagnostic Flow Guide */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: "1. Column", desc: "Ask: 'Is it in Column A?' (Yes/No)", icon: ArrowRightLeft, color: "text-indigo-600" },
                    { label: "2. Row", desc: "Ask: 'Is it in an Odd Row?' (1, 3, 5)", icon: LayoutGrid, color: "text-amber-600" },
                    { label: "3. Emotion", desc: "Identify specific emotion (1-6) in cell.", icon: Target, color: "text-rose-600" }
                  ].map((step, i) => (
                    <div key={i} className="p-5 bg-white rounded-[1.5rem] border-2 border-slate-100 shadow-sm flex items-start gap-4">
                      <div className={cn("w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0", step.color)}>
                        <step.icon size={20} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{step.label}</p>
                        <p className="text-xs font-bold text-slate-700 leading-tight">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* The Chart Grid */}
                <div className="overflow-hidden rounded-[2.5rem] border-2 border-slate-100 shadow-2xl bg-white">
                  <table className="w-full border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-900 text-white">
                        <th className="p-4 border-r border-white/10 w-16 font-black uppercase tracking-widest text-[10px]">Row</th>
                        <th className="p-4 border-r border-white/10 font-black uppercase tracking-widest text-[10px]">Column A</th>
                        <th className="p-4 font-black uppercase tracking-widest text-[10px]">Column B</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[1, 2, 3, 4, 5, 6].map((rowNum) => (
                        <tr key={rowNum} className="group">
                          <td className="p-4 bg-slate-50 border-r border-slate-100 text-center font-black text-slate-400 text-lg">
                            {rowNum}
                          </td>
                          <td 
                            className={cn(
                              "p-4 border-r border-slate-100 transition-all cursor-pointer hover:bg-rose-50/50",
                              selectedCell?.row === rowNum && selectedCell?.col === 'A' ? "bg-rose-100 ring-2 ring-inset ring-rose-500" : ""
                            )}
                            onClick={() => setSelectedCell({ row: rowNum, col: 'A' })}
                          >
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                              {EMOTION_CODE_CHART[rowNum].columnA.map(e => (
                                <div key={e} className="font-bold text-slate-700 hover:text-rose-600 transition-colors">{e}</div>
                              ))}
                            </div>
                          </td>
                          <td 
                            className={cn(
                              "p-4 transition-all cursor-pointer hover:bg-indigo-50/50",
                              selectedCell?.row === rowNum && selectedCell?.col === 'B' ? "bg-indigo-100 ring-2 ring-inset ring-indigo-500" : ""
                            )}
                            onClick={() => setSelectedCell({ row: rowNum, col: 'B' })}
                          >
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                              {EMOTION_CODE_CHART[rowNum].columnB.map(e => (
                                <div key={e} className="font-bold text-slate-700 hover:text-indigo-600 transition-colors">{e}</div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Selection Detail / Clinical Finding */}
          <AnimatePresence mode="wait">
            {selectedCell ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-2 px-2">
                  <Sparkles size={16} className="text-amber-500" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Clinical Finding</h3>
                </div>

                <Card className="border-none shadow-2xl bg-slate-900 text-white rounded-[3rem] overflow-hidden relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent" />
                  <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-700"><Sparkles size={150} /></div>
                  
                  <CardContent className="p-10 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-10">
                      <div className="space-y-8 flex-1">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <Badge className="bg-indigo-500 text-white border-none font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">
                              Row {selectedCell.row} • Column {selectedCell.col}
                            </Badge>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedCell(null)} className="h-7 text-[8px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 rounded-lg">
                              <RefreshCw size={12} className="mr-1.5" /> Reset Selection
                            </Button>
                          </div>
                          <h4 className="text-4xl font-black tracking-tight">
                            {selectedCell.col === 'A' ? 'Column A' : 'Column B'} Emotions
                          </h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                                <Activity size={20} />
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Associated Organs</p>
                                <p className="text-lg font-bold text-white leading-tight">{ROW_DATA[selectedCell.row].organ}</p>
                              </div>
                            </div>
                            <div className="pt-4 border-t border-white/5">
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Dumbbell size={12} /> Associated Muscles (Step 3)
                              </p>
                              <p className="text-xs font-medium text-indigo-100 leading-relaxed">
                                {ROW_DATA[selectedCell.row].muscles}
                              </p>
                            </div>
                          </div>

                          <div className="p-6 bg-white rounded-[2rem] text-slate-900 shadow-xl space-y-4">
                            <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                              <Heart size={12} className="fill-current" /> Potential Bricks
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {(selectedCell.col === 'A' ? EMOTION_CODE_CHART[selectedCell.row].columnA : EMOTION_CODE_CHART[selectedCell.row].columnB).map(e => (
                                <Badge key={e} className="bg-indigo-50 text-indigo-700 border-none font-bold text-xs px-3 py-1 rounded-lg">
                                  {e}
                                </Badge>
                              ))}
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium italic pt-2">
                              "Challenge each emotion while testing the indicator muscle to find the priority."
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <div className="p-16 border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-center text-slate-400 bg-slate-50/30">
                <div className="w-20 h-20 rounded-3xl bg-white shadow-sm flex items-center justify-center mb-6 opacity-50">
                  <MousePointer2 size={40} />
                </div>
                <h4 className="text-xl font-black text-slate-900 opacity-40">Select a cell to begin</h4>
                <p className="text-sm font-medium max-w-xs mx-auto mt-2">
                  Click a cell in the Emotion Chart to see associated organs, muscles, and diagnostic details.
                </p>
              </div>
            )}
          </AnimatePresence>

          {/* Pulse Points Reference */}
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden border-2 border-indigo-100">
            <CardHeader className="bg-indigo-600 p-8 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
                    <Hand size={24} />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-black">Organ Pulse Points</CardTitle>
                    <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest">TCM Diagnostic Reference</p>
                  </div>
                </div>
                <Badge variant="outline" className="border-white/30 text-white font-black text-[8px] uppercase tracking-widest px-3 py-1">Step 2 Verification</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div className="aspect-square rounded-[2rem] overflow-hidden bg-slate-50 border border-slate-100 shadow-inner flex items-center justify-center p-8">
                  <img 
                    src="/images/pulse-points.png" 
                    alt="Organ Pulse Points Reference" 
                    className="max-w-full h-auto rounded-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        const placeholder = document.createElement('div');
                        placeholder.className = "flex flex-col items-center text-slate-300 gap-4";
                        placeholder.innerHTML = '<Hand size={64} /><p class="text-[10px] font-black uppercase tracking-widest">Pulse Points Diagram</p>';
                        parent.appendChild(placeholder);
                      }
                    }}
                  />
                </div>
                <div className="space-y-6">
                  <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Info size={18} className="text-indigo-600" />
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Clinical Tip</span>
                    </div>
                    <p className="text-sm text-indigo-900 font-medium leading-relaxed">
                      Use these points to verify the organ association for each row. Hold the point while testing the indicator muscle to confirm the priority "emotional brick".
                    </p>
                  </div>
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Pressure Logic</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-indigo-600 uppercase mb-1">Yin Organs</p>
                        <p className="text-xs font-bold text-slate-700">Deep Pressure</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-rose-600 uppercase mb-1">Yang Organs</p>
                        <p className="text-xs font-bold text-slate-700">Light Pressure</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client Education Card */}
          <Card className="border-none shadow-lg rounded-[2.5rem] bg-slate-900 text-white overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shadow-inner">
                  <BookOpen size={24} className="text-indigo-300" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black">Client Education</CardTitle>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Read to client if necessary</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <p className="text-base font-medium text-slate-300 leading-relaxed italic">
                "A Heart-Wall is a protective barrier created by the subconscious mind using the energy of trapped emotions. While it provides safety during trauma, it can also block connection and joy."
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  "Usually consists of 5-25 emotions.",
                  "Can be from any time in life or inherited.",
                  "May cause feelings of isolation or numbness.",
                  "Often correlates with neck/shoulder tension."
                ].map((point, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    <span className="text-xs font-bold text-slate-200">{point}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HeartWallProtocol;