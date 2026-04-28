"use client";

import React, { useState } from 'react';
import { 
  Heart, 
  Shield, 
  Zap, 
  CheckCircle2, 
  Info, 
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
  BookOpen,
  FileText,
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from "@/components/ui/card";
import { EMOTION_CODE_CHART, ROW_DATA } from '@/data/emotion-code-data';
import { Button } from '@/components/ui/button';

const ASSESSMENT_STEPS = [
  { id: 1, title: "Permission to Assess", desc: "Ask the body: 'Do we have permission to assess the Heart Wall?'" },
  { id: 2, title: "Find Emotion", desc: "Use the Emotion Chart and Pulse Points (PP) to identify the specific trapped emotion." },
  { id: 3, title: "Assess Related Muscles", desc: "Verify the finding by testing the muscles associated with the identified organ/row." },
  { id: 4, title: "Find Efferent Coordinates", desc: "Identify the specific brain zones (Cortical or Subcortical) associated with this pattern." },
  { id: 5, title: "Gather Context (CH)", desc: "Identify the Age it happened, the associated Event, and if it is Inherited." }
];

const CORRECTION_STEPS = [
  { id: 1, title: "Permission to Correct", desc: "Confirm the system is ready to release this specific layer." },
  { id: 2, title: "Stim Heart Referral Zone", desc: "Stimulate the Heart Visceral Referral Zone (Chest, Shoulder, or Medial Arm)." },
  { id: 3, title: "Hold Organ Point/Muscle", desc: "Simultaneously hold the Organ Pulse Point or the associated muscle." },
  { id: 4, title: "Tap Efferent Zones", desc: "Tap the identified brain zones while intending the release. (3 swipes, or 10 if inherited)." }
];

const HeartWallProtocol = () => {
  const [selectedCell, setSelectedCell] = useState<{ row: number, col: 'A' | 'B' } | null>(null);
  const [showChart, setShowChart] = useState(true);

  const SectionTitle = ({ children, icon: Icon, color }: any) => (
    <div className="flex items-center gap-4 border-b-2 border-slate-100 pb-4 mb-8 mt-16 first:mt-0">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm", color)}>
        <Icon size={20} />
      </div>
      <h2 className="text-3xl font-serif font-bold text-slate-900">{children}</h2>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 animate-in fade-in duration-700 pb-32 font-serif">
      {/* Header */}
      <div className="text-center space-y-4 mb-20">
        <Badge className="bg-rose-100 text-rose-700 border-none font-black text-[10px] uppercase tracking-[0.4em] px-6 py-2 rounded-full">
          Clinical Reference
        </Badge>
        <h1 className="text-5xl font-serif font-bold text-slate-900 tracking-tight">Heart Wall Protocol</h1>
        <p className="text-xl text-slate-500 italic">Subconscious Barrier Release Process</p>
      </div>

      {/* 1. Assessment Flow */}
      <section>
        <SectionTitle icon={Search} color="bg-indigo-600">Assessment Summary</SectionTitle>
        <div className="space-y-8">
          {ASSESSMENT_STEPS.map((step) => (
            <div key={step.id} className="flex gap-6 group">
              <span className="text-2xl font-black text-indigo-200 group-hover:text-indigo-600 transition-colors tabular-nums">
                0{step.id}
              </span>
              <div className="space-y-1">
                <h4 className="text-xl font-bold text-slate-900">{step.title}</h4>
                <p className="text-lg text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Emotion Chart */}
      <section className="mt-24">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-lg">
              <Heart size={20} />
            </div>
            <h3 className="text-3xl font-serif font-bold text-slate-900">The Emotion Chart</h3>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowChart(!showChart)}
            className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans"
          >
            {showChart ? "Hide Chart" : "Show Chart"}
          </Button>
        </div>

        {showChart && (
          <div className="space-y-10 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="overflow-hidden rounded-[2rem] border-2 border-slate-100 shadow-2xl bg-white">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-900 text-white font-sans">
                    <th className="p-4 border-r border-white/10 w-16 text-center">Row</th>
                    <th className="p-4 border-r border-white/10 text-left uppercase tracking-widest text-[10px]">Column A</th>
                    <th className="p-4 text-left uppercase tracking-widest text-[10px]">Column B</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[1, 2, 3, 4, 5, 6].map((rowNum) => (
                    <tr key={rowNum}>
                      <td className="p-4 bg-slate-50 border-r border-slate-100 text-center font-black text-slate-400 font-sans">
                        {rowNum}
                      </td>
                      <td 
                        className={cn(
                          "p-6 border-r border-slate-100 transition-all cursor-pointer hover:bg-rose-50",
                          selectedCell?.row === rowNum && selectedCell?.col === 'A' ? "bg-rose-100 ring-2 ring-inset ring-rose-500" : ""
                        )}
                        onClick={() => setSelectedCell({ row: rowNum, col: 'A' })}
                      >
                        <div className="space-y-2">
                          {EMOTION_CODE_CHART[rowNum].columnA.map(e => (
                            <div key={e} className="font-bold text-slate-800 text-base">{e}</div>
                          ))}
                        </div>
                      </td>
                      <td 
                        className={cn(
                          "p-6 transition-all cursor-pointer hover:bg-indigo-50",
                          selectedCell?.row === rowNum && selectedCell?.col === 'B' ? "bg-indigo-100 ring-2 ring-inset ring-indigo-500" : ""
                        )}
                        onClick={() => setSelectedCell({ row: rowNum, col: 'B' })}
                      >
                        <div className="space-y-2">
                          {EMOTION_CODE_CHART[rowNum].columnB.map(e => (
                            <div key={e} className="font-bold text-slate-800 text-base">{e}</div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedCell && (
              <div className="p-10 bg-slate-900 text-white rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10"><Sparkles size={120} /></div>
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] font-sans">Active Selection</p>
                    <h4 className="text-3xl font-bold">Row {selectedCell.row}, Column {selectedCell.col}</h4>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCell(null)} className="text-indigo-300 hover:text-white font-sans">
                    <RefreshCw size={16} className="mr-2" /> Reset
                  </Button>
                </div>
                <div className="space-y-8 relative z-10">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest font-sans">Associated Organs</p>
                    <p className="text-2xl font-bold text-white">{ROW_DATA[selectedCell.row].organ}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest font-sans flex items-center gap-2">
                      <Dumbbell size={14} /> Associated Muscles (Step 3)
                    </p>
                    <p className="text-lg font-medium text-indigo-100 leading-relaxed italic">
                      {ROW_DATA[selectedCell.row].muscles}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 3. Correction Flow */}
      <section className="mt-24">
        <SectionTitle icon={Zap} color="bg-emerald-600">Correction Summary</SectionTitle>
        <div className="space-y-10">
          {CORRECTION_STEPS.map((step) => (
            <div key={step.id} className="flex gap-6 group">
              <span className="text-2xl font-black text-emerald-200 group-hover:text-emerald-600 transition-colors tabular-nums">
                0{step.id}
              </span>
              <div className="space-y-1">
                <h4 className="text-xl font-bold text-slate-900">{step.title}</h4>
                <p className="text-lg text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Visceral Referral */}
      <section className="mt-24">
        <SectionTitle icon={Activity} color="bg-rose-600">Visceral Referral Zone</SectionTitle>
        <div className="space-y-10">
          <div className="aspect-[4/3] rounded-[3rem] overflow-hidden bg-slate-50 border-2 border-slate-100 shadow-inner flex items-center justify-center p-8">
            <img 
              src="/images/heart-referral.png" 
              alt="Heart Visceral Referral Zones" 
              className="max-w-full h-auto rounded-2xl"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
          <div className="p-10 bg-rose-50 rounded-[3rem] border-2 border-rose-100 space-y-6">
            <h4 className="text-xs font-black text-rose-600 uppercase tracking-[0.3em] font-sans">Primary Referral Areas</h4>
            <ul className="space-y-4 text-lg font-medium text-slate-800">
              <li className="flex items-center gap-4"><div className="w-2 h-2 rounded-full bg-rose-500" /> Left Chest / Precordium</li>
              <li className="flex items-center gap-4"><div className="w-2 h-2 rounded-full bg-rose-500" /> Left Shoulder & Upper Back</li>
              <li className="flex items-center gap-4"><div className="w-2 h-2 rounded-full bg-rose-500" /> Medial aspect of Left Arm</li>
              <li className="flex items-center gap-4"><div className="w-2 h-2 rounded-full bg-rose-500" /> Jaw / Neck (occasionally)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. Client Education */}
      <section className="mt-24">
        <SectionTitle icon={BookOpen} color="bg-indigo-900">Client Education</SectionTitle>
        <div className="p-10 bg-indigo-50 rounded-[3rem] border-2 border-indigo-100 space-y-8">
          <p className="text-xl font-bold text-indigo-900 leading-relaxed italic">
            "A Heart-Wall is made of one or more trapped emotions that the subconscious mind uses to surround the heart as a protective barrier against emotional pain."
          </p>
          <div className="space-y-6">
            {[
              "Each trapped emotion in the Heart-Wall is known as a Heart-Wall emotion.",
              "A Heart-Wall emotion is one layer in the collective Heart-Wall. When all Heart-Wall emotions have been removed, the Heart-Wall is gone.",
              "The Heart-Wall is usually created in response to emotional distress. The subconscious mind then uses pre-existing trapped emotions to form the wall.",
              "Heart-Wall emotions may be from any time in your own life and they can also be inherited.",
              "Most individuals have a Heart-Wall consisting of between five and 25 Heart-Wall emotions.",
              "A Heart-Wall may cause you to feel disconnected from others, lonely, sad, anxious, and unmotivated.",
              "Physical symptoms such as neck and shoulder discomfort may be present."
            ].map((point, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2.5 shrink-0" />
                <p className="text-base text-indigo-800 font-medium leading-relaxed">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Clinical Note */}
      <div className="mt-24 p-10 bg-slate-900 text-white rounded-[3rem] flex items-start gap-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10"><Info size={120} /></div>
        <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shrink-0 relative z-10">
          <Lightbulb size={32} />
        </div>
        <div className="space-y-3 relative z-10">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] font-sans">Clinical Mastery Note</p>
          <p className="text-lg text-slate-300 font-medium leading-relaxed italic">
            "The shift occurs when the client can distinguish between the 'me' (the observer) and the 'not-me' (the identity/emotion). Dismantle the wall with respect—it was built for a reason."
          </p>
        </div>
      </div>
    </div>
  );
};

export default HeartWallProtocol;