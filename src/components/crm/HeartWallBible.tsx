"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Shield, 
  Layers, 
  Zap, 
  Info, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  Lightbulb,
  ShieldAlert,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

const HeartWallBible = () => {
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Hero Section */}
      <Card className="border-none shadow-2xl rounded-[3.5rem] bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-5"><Heart size={200} /></div>
        <CardHeader className="p-12 relative z-10">
          <div className="flex items-center gap-5 mb-4">
            <div className="w-16 h-16 bg-rose-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-rose-500/40">
              <Heart size={32} className="text-white" />
            </div>
            <div>
              <CardTitle className="text-4xl font-black tracking-tight">The Heart Wall Bible</CardTitle>
              <CardDescription className="text-slate-400 text-xl font-medium mt-2">
                Understanding the subconscious architecture of emotional protection.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Core Concept */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="bg-rose-50 p-8">
            <CardTitle className="text-xl font-black flex items-center gap-3 text-rose-900">
              <Shield size={24} /> What is a Heart Wall?
            </CardTitle>
            <CardDescription className="text-rose-700 font-medium">The subconscious shield.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              A Heart Wall is a metaphorical barrier created by the subconscious mind using the energy of trapped emotions. Its primary purpose is to protect the heart from emotional pain, grief, or perceived threat.
            </p>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <h4 className="font-black text-slate-900 uppercase tracking-widest text-[10px] mb-2">The Trade-off</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                While the wall provides safety during trauma, it also acts as a filter that numbs positive emotions, blocks connection with others, and creates a sense of isolation.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="bg-indigo-50 p-8">
            <CardTitle className="text-xl font-black flex items-center gap-3 text-indigo-900">
              <Layers size={24} /> Symbolic Materials
            </CardTitle>
            <CardDescription className="text-indigo-700 font-medium">The language of the subconscious.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              The subconscious often assigns a material to the wall. This material provides insight into the nature of the protection:
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { m: "Wood", d: "Flexible but sturdy." },
                { m: "Stone", d: "Heavy, ancient, rigid." },
                { m: "Metal", d: "Cold, impenetrable." },
                { m: "Glass", d: "Fragile, transparent." }
              ].map(item => (
                <div key={item.m} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">{item.m}</p>
                  <p className="text-xs font-medium text-slate-600">{item.d}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clinical Significance */}
      <div className="space-y-8">
        <h3 className="text-2xl font-black text-slate-900 px-2 flex items-center gap-3">
          <Activity size={28} className="text-rose-600" /> Clinical Significance
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              title: "Physical Impact", 
              icon: Zap, 
              color: "text-amber-500",
              desc: "Chronic neck and shoulder tension, chest tightness, and respiratory shallowing are common physical markers of a Heart Wall." 
            },
            { 
              title: "Emotional Impact", 
              icon: Heart, 
              color: "text-rose-500",
              desc: "Difficulty feeling joy, a sense of 'numbness', or repeating patterns of isolation in relationships." 
            },
            { 
              title: "Spiritual Impact", 
              icon: Sparkles, 
              color: "text-indigo-500",
              desc: "A block in the ability to give and receive love freely, and a disconnect from one's core purpose." 
            }
          ].map((item, i) => (
            <Card key={i} className="border-none shadow-md rounded-[2rem] bg-white overflow-hidden group hover:shadow-xl transition-all">
              <CardContent className="p-8 space-y-4">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform bg-slate-50", item.color)}>
                  <item.icon size={24} />
                </div>
                <h4 className="font-black text-slate-900 text-lg">{item.title}</h4>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Pro Tip */}
      <div className="p-8 bg-amber-50 rounded-[2.5rem] border-2 border-amber-100 flex items-start gap-6 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xl shrink-0">
          <Lightbulb size={32} />
        </div>
        <div className="space-y-2">
          <h4 className="text-xl font-black text-amber-900">Practitioner Pro-Tip</h4>
          <p className="text-amber-800 font-medium leading-relaxed">
            Clearing a Heart Wall is often a multi-session process. The subconscious will only allow the release of emotions that the system is ready to process. If the body says 'No' to releasing more, honor that boundary. The wall was built for a reason—it must be dismantled with respect.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HeartWallBible;