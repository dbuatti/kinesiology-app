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
  Activity,
  AlertCircle,
  Dumbbell,
  History,
  ShieldCheck,
  Brain,
  LayoutGrid,
  Workflow,
  ArrowRightLeft,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EMOTION_CODE_CHART, ROW_DATA } from '@/data/emotion-code-data';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const ASSESSMENT_STEPS = [
  { id: 1, title: "Permission", desc: "Assess Heart Wall presence & permission.", icon: ShieldCheck },
  { id: 2, title: "Find Emotion", desc: "Identify the specific trapped emotion.", icon: Search },
  { id: 3, title: "Verify Muscles", desc: "Test associated organ/row muscles.", icon: Dumbbell },
  { id: 4, title: "Brain Zones", desc: "Identify Efferent brain coordinates.", icon: Brain },
  { id: 5, title: "Context (CH)", desc: "Age, Event, or Inherited status.", icon: History }
];

const CORRECTION_STEPS = [
  { id: 6, title: "Permission", desc: "Confirm readiness to release layer.", icon: CheckCircle2 },
  { id: 7, title: "Stim Zone", desc: "Stimulate Heart Referral Zone.", icon: Activity },
  { id: 8, title: "Hold Point", desc: "Hold Organ Pulse Point or Muscle.", icon: Hand },
  { id: 9, title: "Tap & Release", desc: "Tap Efferent zones with intention.", icon: Zap }
];

const HeartWallProtocol = () => {
  const [selectedCell, setSelectedCell] = useState<{ row: number, col: 'A' | 'B' } | null>(null);
  const [showChart, setShowChart] = useState(true);
  const [activeFlow, setActiveFlow] = useState<'assessment' | 'correction'>('assessment');

  const StepList = ({ steps }: { steps: any[] }) => (
    <div className="relative space-y-1">
      {steps.map((step) => (
        <div key={step.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
          <div className={cn(
            "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-black border transition-all",
            activeFlow === 'assessment' ? "border-slate-200 text-slate-400 group-hover:border-indigo-300 group-hover:text-indigo-600" : "border-slate-200 text-slate-400 group-hover:border-emerald-300 group-hover:text-emerald-600"
          )}>
            {step.id}
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-slate-700">{step.title}</h4>
            <p className="text-[10px] text-slate-500 leading-relaxed">{step.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-1000 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-slate-400">
            <Heart size={14} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Clinical Protocol</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-slate-900">Heart Wall Release</h1>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button 
            onClick={() => setActiveFlow('assessment')}
            className={cn("px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", activeFlow === 'assessment' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
          >
            Assessment
          </button>
          <button 
            onClick={() => setActiveFlow('correction')}
            className={cn("px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", activeFlow === 'correction' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
          >
            Correction
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Clinical Pathway */}
        <div className="lg:col-span-4 space-y-10">
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-3">
              <Workflow size={14} className="text-slate-400" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Clinical Pathway</h3>
            </div>
            <Card className="border-slate-200 shadow-none rounded-[2rem] bg-white overflow-hidden">
              <CardContent className="p-4">
                <StepList steps={activeFlow === 'assessment' ? ASSESSMENT_STEPS : CORRECTION_STEPS} />
              </CardContent>
            </Card>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-2 px-3">
              <FileText size={14} className="text-slate-400" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Reference Guides</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <Card className="border-slate-100 shadow-none rounded-2xl bg-slate-50/50 overflow-hidden">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Activity size={12} /> Referral Zone
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="aspect-square rounded-xl overflow-hidden bg-white border border-slate-100 mb-3 flex items-center justify-center">
                    <Heart size={32} className="text-slate-100" />
                  </div>
                  <ul className="space-y-1.5 text-[10px] text-slate-600 font-medium">
                    <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-slate-300" /> Left Chest / Precordium</li>
                    <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-slate-300" /> Left Shoulder & Upper Back</li>
                    <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-slate-300" /> Medial aspect of Left Arm</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-slate-100 shadow-none rounded-2xl bg-slate-50/50 overflow-hidden">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Layers size={12} /> Materials
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex flex-wrap gap-1.5">
                    {["Wood", "Stone", "Metal", "Glass", "Plastic"].map(m => (
                      <Badge key={m} variant="outline" className="bg-white border-slate-200 text-slate-500 text-[9px] font-bold px-2 py-0">
                        {m}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>

        {/* Right: Interactive Workspace */}
        <div className="lg:col-span-8 space-y-8">
          {/* Emotion Chart */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-sm">
                  <LayoutGrid size={16} />
                </div>
                <h3 className="text-lg font-black text-slate-900">Emotion Chart</h3>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowChart(!showChart)}
                className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600"
              >
                {showChart ? "Hide Chart" : "Show Chart"}
              </Button>
            </div>

            {showChart && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                  <table className="w-full border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-[#1e293b] text-white">
                        <th className="p-4 border-r border-white/10 w-16 font-black uppercase tracking-widest text-[10px]">Row</th>
                        <th className="p-4 border-r border-white/10 font-black uppercase tracking-widest text-[10px]">Column A</th>
                        <th className="p-4 font-black uppercase tracking-widest text-[10px]">Column B</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[1, 2, 3, 4, 5, 6].map((rowNum) => (
                        <tr key={rowNum}>
                          <td className="p-4 bg-slate-50/50 border-r border-slate-200 text-center font-black text-slate-400 text-lg">
                            {rowNum}
                          </td>
                          <td 
                            className={cn(
                              "p-6 border-r border-slate-100 transition-all cursor-pointer hover:bg-slate-50",
                              selectedCell?.row === rowNum && selectedCell?.col === 'A' ? "bg-indigo-50/50" : ""
                            )}
                            onClick={() => setSelectedCell({ row: rowNum, col: 'A' })}
                          >
                            <div className="flex flex-col gap-1.5">
                              {EMOTION_CODE_CHART[rowNum].columnA.map(e => (
                                <div key={e} className={cn(
                                  "font-medium transition-colors",
                                  selectedCell?.row === rowNum && selectedCell?.col === 'A' ? "text-indigo-700 font-bold" : "text-slate-600"
                                )}>{e}</div>
                              ))}
                            </div>
                          </td>
                          <td 
                            className={cn(
                              "p-6 transition-all cursor-pointer hover:bg-slate-50",
                              selectedCell?.row === rowNum && selectedCell?.col === 'B' ? "bg-indigo-50/50" : ""
                            )}
                            onClick={() => setSelectedCell({ row: rowNum, col: 'B' })}
                          >
                            <div className="flex flex-col gap-1.5">
                              {EMOTION_CODE_CHART[rowNum].columnB.map(e => (
                                <div key={e} className={cn(
                                  "font-medium transition-colors",
                                  selectedCell?.row === rowNum && selectedCell?.col === 'B' ? "text-indigo-700 font-bold" : "text-slate-600"
                                )}>{e}</div>
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
          </section>

          {/* Selection Detail */}
          <AnimatePresence mode="wait">
            {selectedCell ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-indigo-400" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Clinical Finding</h3>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCell(null)} className="h-7 text-[8px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-600">
                    <RefreshCw size={12} className="mr-1.5" /> Clear Selection
                  </Button>
                </div>

                <Card className="border-indigo-100 shadow-lg rounded-[2.5rem] bg-white overflow-hidden">
                  <CardContent className="p-8 space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Badge className="bg-indigo-600 text-white border-none font-black text-[8px] uppercase tracking-widest px-3 py-1 rounded-full">
                          Row {selectedCell.row} • Column {selectedCell.col}
                        </Badge>
                        <h4 className="text-2xl font-black text-slate-900">
                          {selectedCell.col === 'A' ? 'Column A' : 'Column B'} Emotions
                        </h4>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-indigo-600 border border-slate-100">
                        <Target size={24} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Activity size={12} /> Associated Organs
                          </p>
                          <p className="text-sm font-bold text-slate-900 leading-tight">{ROW_DATA[selectedCell.row].organ}</p>
                        </div>
                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Dumbbell size={12} /> Associated Muscles
                          </p>
                          <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
                            {ROW_DATA[selectedCell.row].muscles}
                          </p>
                        </div>
                      </div>

                      <div className="p-6 bg-indigo-50/50 rounded-[2rem] border border-indigo-100 space-y-4">
                        <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                          <Heart size={12} className="fill-indigo-200" /> Potential Bricks
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {(selectedCell.col === 'A' ? EMOTION_CODE_CHART[selectedCell.row].columnA : EMOTION_CODE_CHART[selectedCell.row].columnB).map(e => (
                            <Badge key={e} className="bg-white text-indigo-700 border-indigo-100 font-bold text-[10px] px-3 py-1 rounded-lg shadow-sm">
                              {e}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-[10px] text-indigo-400 font-medium italic pt-2 leading-relaxed">
                          "Challenge each emotion while testing the indicator muscle to find the priority."
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <div className="p-16 border border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-center text-slate-300 bg-slate-50/30">
                <MousePointer2 size={32} className="mb-4 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">Select a cell to view clinical details</p>
              </div>
            )}
          </AnimatePresence>

          {/* Muted Clinical Note */}
          <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-start gap-6">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm shrink-0">
              <Info size={20} />
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Practitioner Note</p>
              <p className="text-xs text-slate-500 font-medium leading-relaxed italic">
                "The Heart Wall is a protective strategy. Approach each layer with respect for the system's need for safety. If the body denies permission, prioritize SNS down-regulation first."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeartWallProtocol;