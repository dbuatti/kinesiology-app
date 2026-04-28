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
  Dumbbell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EMOTION_CODE_CHART, ROW_DATA } from '@/data/emotion-code-data';
import { Button } from '@/components/ui/button';

const STEPS = [
  { 
    id: 1, 
    title: "Discovery & Permission", 
    desc: "Ask the body: 'Do you have a Heart Wall?' If yes, ask: 'Can we release an emotion from the Heart Wall now?'",
    icon: Search,
    color: "text-rose-600",
    bg: "bg-rose-50"
  },
  { 
    id: 2, 
    title: "Material Identification", 
    desc: "Identify the symbolic material of the wall (e.g., Wood, Stone, Metal, Glass). This represents the subconscious 'protection' strategy.",
    icon: Layers,
    color: "text-indigo-600",
    bg: "bg-indigo-50"
  },
  { 
    id: 3, 
    title: "Thickness & Size", 
    desc: "Quantify the barrier. Ask for the thickness (e.g., miles, inches) or size. This helps the conscious mind grasp the scale of the protection.",
    icon: Target,
    color: "text-amber-600",
    bg: "bg-amber-50"
  },
  { 
    id: 4, 
    title: "Emotion Identification", 
    desc: "Use the Emotion Chart below to identify the specific trapped emotion currently acting as a 'brick' in the wall.",
    icon: Heart,
    color: "text-rose-500",
    bg: "bg-rose-50"
  },
  { 
    id: 5, 
    title: "The Release", 
    desc: "Swipe 3 times (or 10 for inherited) along the Governing Meridian (from forehead to base of neck) while intending to release the emotion.",
    icon: Zap,
    color: "text-emerald-600",
    bg: "bg-emerald-50"
  },
  { 
    id: 6, 
    title: "Verification", 
    desc: "Re-test the indicator muscle. Ask: 'Did we release that emotion?' and 'Is there another emotion we can release now?'",
    icon: CheckCircle2,
    color: "text-blue-600",
    bg: "bg-blue-50"
  }
];

const HeartWallProtocol = () => {
  const [selectedCell, setSelectedCell] = useState<{ row: number, col: 'A' | 'B' } | null>(null);
  const [showChart, setShowChart] = useState(true);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-20">
      <div className="border-b border-slate-100 pb-6 mb-8">
        <h1 className="text-3xl font-serif font-bold text-slate-900">Heart Wall Protocol</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Subconscious Barrier Release Process</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Steps & Visual References */}
        <div className="lg:col-span-5 space-y-6">
          {/* Client Education Card */}
          <Card className="border-none shadow-lg rounded-[2.5rem] bg-indigo-50 border-2 border-indigo-100 overflow-hidden">
            <CardHeader className="bg-indigo-600 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shadow-inner">
                  <BookOpen size={20} />
                </div>
                <div>
                  <CardTitle className="text-lg font-black">Client Education</CardTitle>
                  <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest">Read to client if necessary</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-sm font-bold text-indigo-900 leading-relaxed">
                A Heart-Wall is made of one or more trapped emotions that the subconscious mind uses to surround the heart as a protective barrier against emotional pain.
              </p>
              <ul className="space-y-3">
                {[
                  "Each trapped emotion in the Heart-Wall is known as a Heart-Wall emotion.",
                  "A Heart-Wall emotion is one layer in the collective Heart-Wall. When all Heart-Wall emotions have been removed, the Heart-Wall is gone.",
                  "The Heart-Wall is usually created in response to emotional distress. The subconscious mind then uses pre-existing trapped emotions to form the wall.",
                  "Heart-Wall emotions may be from any time in your own life and they can also be inherited.",
                  "Most individuals have a Heart-Wall consisting of between five and 25 Heart-Wall emotions.",
                  "A Heart-Wall may cause you to feel disconnected from others, lonely, sad, anxious, and unmotivated.",
                  "Physical symptoms such as neck and shoulder discomfort may be present.",
                  "It’s generally best to let the subconscious indicate what imbalances need to be released and in what order."
                ].map((point, i) => (
                  <li key={i} className="flex items-start gap-3 text-xs text-indigo-800 font-medium leading-relaxed">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Visceral Referral Zone Card */}
          <Card className="border-none shadow-lg rounded-[2.5rem] bg-rose-50 border-2 border-rose-100 overflow-hidden">
            <CardHeader className="bg-rose-600 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shadow-inner">
                  <Activity size={20} />
                </div>
                <div>
                  <CardTitle className="text-lg font-black">Visceral Referral Zone</CardTitle>
                  <p className="text-rose-200 text-[10px] font-bold uppercase tracking-widest">Heart Somatic Mapping</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-white border border-rose-100 shadow-inner flex items-center justify-center p-4">
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
                      placeholder.innerHTML = '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg><p class="text-[10px] font-black uppercase tracking-widest">Referral Zone Diagram</p>';
                      parent.appendChild(placeholder);
                    }
                  }}
                />
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-white rounded-2xl border border-rose-100">
                  <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2">Primary Referral Areas</h4>
                  <ul className="space-y-2 text-xs text-slate-700 font-medium">
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Left Chest / Precordium</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Left Shoulder & Upper Back</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Medial aspect of Left Arm</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Jaw / Neck (occasionally)</li>
                  </ul>
                </div>
                <Alert className="bg-amber-50 border-amber-200 rounded-xl">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-[10px] text-amber-900 font-medium leading-relaxed">
                    <strong>Clinical Note:</strong> Chronic tension in these zones often resolves once the Heart Wall emotions are cleared.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {STEPS.map((step) => (
              <div 
                key={step.id} 
                className={cn(
                  "p-5 rounded-2xl border transition-all group",
                  step.id === 4 ? "border-rose-200 bg-rose-50/30 shadow-sm" : "border-slate-100 bg-white"
                )}
              >
                <div className="flex items-start gap-6">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm shadow-sm transition-transform group-hover:scale-105",
                    step.bg, step.color
                  )}>
                    {step.id}
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-serif font-bold text-xl text-slate-900">
                        {step.title}
                      </h4>
                      <Badge variant="outline" className="border-slate-100 text-slate-400 font-black text-[7px] uppercase tracking-widest px-1.5 py-0 rounded-none">
                        Step {step.id}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pulse Points Reference Card */}
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden border-2 border-indigo-100">
            <CardHeader className="bg-indigo-600 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shadow-inner">
                  <Hand size={20} />
                </div>
                <div>
                  <CardTitle className="text-lg font-black">Organ Pulse Points</CardTitle>
                  <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest">TCM Diagnostic Reference</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-inner flex items-center justify-center p-4">
                <img 
                  src="/images/pulse-points.png" 
                  alt="Organ Pulse Points Reference" 
                  className="max-w-full h-auto rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const placeholder = document.createElement('div');
                      placeholder.className = "flex flex-col items-center text-slate-300 gap-2";
                      placeholder.innerHTML = '<ImageIcon size={48} /><p class="text-[10px] font-black uppercase tracking-widest">Pulse Points Diagram</p>';
                      parent.appendChild(placeholder);
                    }
                  }}
                />
              </div>
              <div className="mt-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <div className="flex items-center gap-2 mb-2">
                  <Info size={14} className="text-indigo-600" />
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Clinical Tip</span>
                </div>
                <p className="text-xs text-indigo-900 font-medium leading-relaxed">
                  Use these points to verify the organ association for each row. Hold the point while testing the indicator muscle to confirm the priority "emotional brick".
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Interactive Emotion Chart */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-lg">
                <Heart size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-900">Step 4: Emotion Chart</h3>
            </div>
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

          {showChart && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-500">
              {/* Diagnostic Flow Guide */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { label: "1. Column", desc: "Ask: 'Is it in Column A?' (Yes/No)" },
                  { label: "2. Row", desc: "Ask: 'Is it in an Odd Row?' (1, 3, 5)" },
                  { label: "3. Emotion", desc: "Identify specific emotion (1-5) in cell." }
                ].map((step, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[8px] font-black text-indigo-600 uppercase tracking-widest mb-1">{step.label}</p>
                    <p className="text-[10px] font-bold text-slate-700 leading-tight">{step.desc}</p>
                  </div>
                ))}
              </div>

              {/* The Chart Grid */}
              <div className="overflow-hidden rounded-[2rem] border-2 border-slate-100 shadow-2xl bg-white">
                <table className="w-full border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-slate-900 text-white">
                      <th className="p-3 border-r border-white/10 w-12">Row</th>
                      <th className="p-3 border-r border-white/10">Column A</th>
                      <th className="p-3">Column B</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[1, 2, 3, 4, 5, 6].map((rowNum) => (
                      <tr key={rowNum} className="group">
                        <td className="p-3 bg-slate-50 border-r border-slate-100 text-center font-black text-slate-400">
                          {rowNum}
                        </td>
                        <td 
                          className={cn(
                            "p-3 border-r border-slate-100 transition-all cursor-pointer hover:bg-rose-50",
                            selectedCell?.row === rowNum && selectedCell?.col === 'A' ? "bg-rose-100 ring-2 ring-inset ring-rose-500" : ""
                          )}
                          onClick={() => setSelectedCell({ row: rowNum, col: 'A' })}
                        >
                          <div className="space-y-1">
                            {EMOTION_CODE_CHART[rowNum].columnA.map(e => (
                              <div key={e} className="font-bold text-slate-700">{e}</div>
                            ))}
                          </div>
                        </td>
                        <td 
                          className={cn(
                            "p-3 transition-all cursor-pointer hover:bg-indigo-50",
                            selectedCell?.row === rowNum && selectedCell?.col === 'B' ? "bg-indigo-100 ring-2 ring-inset ring-indigo-500" : ""
                          )}
                          onClick={() => setSelectedCell({ row: rowNum, col: 'B' })}
                        >
                          <div className="space-y-1">
                            {EMOTION_CODE_CHART[rowNum].columnB.map(e => (
                              <div key={e} className="font-bold text-slate-700">{e}</div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Selection Detail */}
              {selectedCell ? (
                <div className="p-6 bg-indigo-900 text-white rounded-[2rem] shadow-xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10"><Sparkles size={80} /></div>
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Active Selection</p>
                      <h4 className="text-2xl font-black">Row {selectedCell.row}, Column {selectedCell.col}</h4>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedCell(null)} className="text-indigo-300 hover:text-white">
                      <RefreshCw size={14} className="mr-2" /> Reset
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-4 relative z-10">
                    <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                      <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-2">Associated Organs</p>
                      <p className="text-sm font-bold">{ROW_DATA[selectedCell.row].organ}</p>
                    </div>
                    <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                      <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Dumbbell size={12} /> Associated Muscles
                      </p>
                      <p className="text-xs font-medium text-indigo-100 leading-relaxed">
                        {ROW_DATA[selectedCell.row].muscles}
                      </p>
                    </div>
                    <div className="p-4 bg-white rounded-2xl text-indigo-900">
                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Emotions in this cell</p>
                      <div className="flex flex-wrap gap-2">
                        {(selectedCell.col === 'A' ? EMOTION_CODE_CHART[selectedCell.row].columnA : EMOTION_CODE_CHART[selectedCell.row].columnB).map(e => (
                          <Badge key={e} className="bg-indigo-600 text-white border-none font-bold">{e}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center text-center text-slate-400">
                  <MousePointer2 size={32} className="mb-2 opacity-20" />
                  <p className="text-sm font-medium">Click a cell in the chart to <br/>see associated organs and details.</p>
                </div>
              )}

              <div className="p-6 bg-amber-50 rounded-[2rem] border-2 border-amber-100 flex items-start gap-6">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-amber-500 shadow-sm shrink-0">
                  <Info size={24} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em]">Diagnostic Tip</p>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed italic">
                    "If the body indicates an emotion that doesn't seem to fit the current context, check if it is an **Inherited Trapped Emotion**. These are passed down from ancestors and require 10 swipes to release."
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeartWallProtocol;