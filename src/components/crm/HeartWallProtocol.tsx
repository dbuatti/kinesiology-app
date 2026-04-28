"use client";

import React, { useState } from 'react';
import { 
  Heart, 
  Zap, 
  Search,
  Activity,
  Dumbbell,
  Sparkles,
  RefreshCw,
  ChevronDown,
  Info,
  BookOpen,
  FileText,
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EMOTION_CODE_CHART, ROW_DATA } from '@/data/emotion-code-data';
import PulsePointReference from './PulsePointReference';

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
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  const SectionTitle = ({ children, icon: Icon, color }: any) => (
    <div className="flex items-center gap-4 border-b border-slate-100 pb-2 mb-4 mt-8 first:mt-0">
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm", color)}>
        <Icon size={16} />
      </div>
      <h2 className="text-2xl font-bold text-slate-900">{children}</h2>
    </div>
  );

  return (
    <div 
      className="w-full py-2 px-2 animate-in fade-in duration-700 pb-20"
      style={{ fontFamily: 'Georgia, serif' }}
    >
      {/* Header */}
      <div className="text-center space-y-2 mb-8">
        <Badge className="bg-rose-100 text-rose-700 border-none font-black text-[9px] uppercase tracking-[0.4em] px-4 py-1 rounded-full font-sans">
          Clinical Reference
        </Badge>
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Heart Wall Protocol</h1>
        <p className="text-lg text-slate-500 italic">Subconscious Barrier Release Process</p>
      </div>

      {/* 1. Assessment Flow */}
      <section>
        <SectionTitle icon={Search} color="bg-indigo-600">Assessment Summary</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-4">
            {ASSESSMENT_STEPS.map((step) => (
              <div key={step.id} className="flex gap-4 group">
                <span className="text-xl font-black text-indigo-200 group-hover:text-indigo-600 transition-colors tabular-nums font-sans">
                  0{step.id}
                </span>
                <div className="space-y-0.5">
                  <h4 className="text-lg font-bold text-slate-900">{step.title}</h4>
                  <p className="text-base text-slate-600 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-5">
            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner">
              <PulsePointReference />
            </div>
          </div>
        </div>
      </section>

      {/* 2. The Master Chart */}
      <section className="mt-12">
        <SectionTitle icon={Heart} color="bg-rose-600">The Emotion & Muscle Chart</SectionTitle>
        
        <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-lg bg-white">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-900 text-white font-sans">
                <th className="p-4 text-left uppercase tracking-widest text-[9px] border-r border-white/10 w-1/4">Organ</th>
                <th className="p-4 text-left uppercase tracking-widest text-[9px] border-r border-white/10 w-1/2">Emotions</th>
                <th className="p-4 text-left uppercase tracking-widest text-[9px] w-1/4">Muscles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[1, 2, 3, 4, 5, 6].map((rowNum) => (
                <tr 
                  key={rowNum} 
                  className={cn(
                    "transition-all cursor-pointer hover:bg-slate-50",
                    selectedRow === rowNum ? "bg-indigo-50/50 ring-2 ring-inset ring-indigo-500" : ""
                  )}
                  onClick={() => setSelectedRow(selectedRow === rowNum ? null : rowNum)}
                >
                  <td className="p-4 border-r border-slate-100 align-top">
                    <p className="font-bold text-indigo-600 text-base leading-tight">
                      {ROW_DATA[rowNum].organ}
                    </p>
                  </td>
                  <td className="p-4 border-r border-slate-100 align-top">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                      {[...EMOTION_CODE_CHART[rowNum].columnA, ...EMOTION_CODE_CHART[rowNum].columnB].map(e => (
                        <div key={e} className="text-slate-700 font-medium text-sm">{e}</div>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 align-top">
                    <p className="text-xs font-bold text-slate-500 leading-relaxed italic">
                      {ROW_DATA[rowNum].muscles}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedRow && (
          <div className="mt-4 p-6 bg-slate-900 text-white rounded-2xl shadow-xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={80} /></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="space-y-0.5">
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em] font-sans">Active Focus</p>
                <h4 className="text-2xl font-bold">{ROW_DATA[selectedRow].organ}</h4>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedRow(null)} className="text-indigo-300 hover:text-white font-sans h-8">
                <RefreshCw size={14} className="mr-2" /> Clear
              </Button>
            </div>
            <div className="space-y-4 relative z-10">
              <div className="flex items-start gap-3">
                <Dumbbell size={16} className="text-indigo-400 shrink-0 mt-1" />
                <p className="text-base font-medium text-indigo-100 leading-relaxed">
                  Test these muscles to verify the finding: <span className="font-bold text-white">{ROW_DATA[selectedRow].muscles}</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 3. Correction Flow */}
      <section className="mt-12">
        <SectionTitle icon={Zap} color="bg-emerald-600">Correction Summary</SectionTitle>
        <div className="space-y-6">
          {CORRECTION_STEPS.map((step) => (
            <div key={step.id} className="flex gap-4 group">
              <span className="text-xl font-black text-emerald-200 group-hover:text-emerald-600 transition-colors tabular-nums font-sans">
                0{step.id}
              </span>
              <div className="space-y-0.5">
                <h4 className="text-lg font-bold text-slate-900">{step.title}</h4>
                <p className="text-base text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Visceral Referral */}
      <section className="mt-12">
        <SectionTitle icon={Activity} color="bg-rose-600">Visceral Referral Zone</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="aspect-video rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 shadow-inner flex items-center justify-center p-4">
            <img 
              src="/images/heart-referral.png" 
              alt="Heart Visceral Referral Zones" 
              className="max-w-full h-auto rounded-lg"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
          <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100 space-y-4">
            <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-[0.3em] font-sans">Primary Referral Areas</h4>
            <ul className="space-y-2 text-base font-medium text-slate-800">
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Left Chest / Precordium</li>
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Left Shoulder & Upper Back</li>
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Medial aspect of Left Arm</li>
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Jaw / Neck (occasionally)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. Client Education */}
      <section className="mt-12">
        <SectionTitle icon={BookOpen} color="bg-indigo-900">Client Education</SectionTitle>
        <div className="p-8 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-6">
          <p className="text-lg font-bold text-indigo-900 leading-relaxed italic">
            "A Heart-Wall is made of one or more trapped emotions that the subconscious mind uses to surround the heart as a protective barrier against emotional pain."
          </p>
          <div className="space-y-3">
            {[
              "Each trapped emotion in the Heart-Wall is known as a Heart-Wall emotion.",
              "A Heart-Wall emotion is one layer in the collective Heart-Wall. When all Heart-Wall emotions have been removed, the Heart-Wall is gone.",
              "The Heart-Wall is usually created in response to emotional distress. The subconscious mind then uses pre-existing trapped emotions to form the wall.",
              "Heart-Wall emotions may be from any time in your own life and they can also be inherited.",
              "Most individuals have a Heart-Wall consisting of between five and 25 Heart-Wall emotions.",
              "A Heart-Wall may cause you to feel disconnected from others, lonely, sad, anxious, and unmotivated.",
              "Physical symptoms such as neck and shoulder discomfort may be present."
            ].map((point, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-1 h-1 rounded-full bg-indigo-400 mt-2 shrink-0" />
                <p className="text-sm text-indigo-800 font-medium leading-relaxed">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Clinical Note */}
      <div className="mt-12 p-8 bg-slate-900 text-white rounded-2xl flex items-start gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10"><Info size={100} /></div>
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shrink-0 relative z-10">
          <Lightbulb size={24} />
        </div>
        <div className="space-y-1 relative z-10">
          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.4em] font-sans">Clinical Mastery Note</p>
          <p className="text-base text-slate-300 font-medium leading-relaxed italic">
            "The shift occurs when the client can distinguish between the 'me' (the observer) and the 'not-me' (the identity/emotion). Dismantle the wall with respect—it was built for a reason."
          </p>
        </div>
      </div>
    </div>
  );
};

export default HeartWallProtocol;