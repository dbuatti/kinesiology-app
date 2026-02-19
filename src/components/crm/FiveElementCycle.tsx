"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Zap, Heart, Shield, ArrowRight, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const ELEMENTS = [
  { 
    name: "Wood", 
    color: "bg-emerald-500", 
    textColor: "text-emerald-700",
    meridians: ["Liver", "Gall Bladder"],
    sheng: "Fire", 
    ko: "Earth",
    description: "Growth, vision, and decision making. The 'General' of the body."
  },
  { 
    name: "Fire", 
    color: "bg-red-500", 
    textColor: "text-red-700",
    meridians: ["Heart", "Small Intestine", "Pericardium", "San Jiao"],
    sheng: "Earth", 
    ko: "Metal",
    description: "Joy, connection, and transformation. The 'Monarch' of the body."
  },
  { 
    name: "Earth", 
    color: "bg-yellow-500", 
    textColor: "text-yellow-700",
    meridians: ["Spleen", "Stomach"],
    sheng: "Metal", 
    ko: "Water",
    description: "Stability, nourishment, and centering. The 'Mother' of the body."
  },
  { 
    name: "Metal", 
    color: "bg-slate-400", 
    textColor: "text-slate-700",
    meridians: ["Lung", "Large Intestine"],
    sheng: "Water", 
    ko: "Wood",
    description: "Value, letting go, and inspiration. The 'Prime Minister' of the body."
  },
  { 
    name: "Water", 
    color: "bg-blue-500", 
    textColor: "text-blue-700",
    meridians: ["Kidney", "Bladder"],
    sheng: "Wood", 
    ko: "Fire",
    description: "Willpower, essence, and survival. The 'Root' of the body."
  }
];

const FiveElementCycle = () => {
  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-none shadow-lg rounded-[2.5rem] bg-indigo-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10"><RefreshCw size={120} /></div>
          <CardHeader className="p-8">
            <CardTitle className="text-2xl font-black flex items-center gap-3">
              <RefreshCw size={24} className="text-teal-400" /> Sheng Cycle (Generating)
            </CardTitle>
            <CardDescription className="text-indigo-200">The 'Mother-Child' relationship. One element feeds the next.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-4">
            <div className="flex flex-wrap gap-3">
              {ELEMENTS.map((el, i) => (
                <React.Fragment key={el.name}>
                  <div className={cn("px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg", el.color)}>
                    {el.name}
                  </div>
                  {i < ELEMENTS.length - 1 && <ArrowRight size={16} className="mt-2 text-indigo-400" />}
                </React.Fragment>
              ))}
              <ArrowRight size={16} className="mt-2 text-indigo-400" />
              <div className="px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg bg-emerald-500">Wood</div>
            </div>
            <p className="text-sm text-indigo-100 leading-relaxed italic pt-4">
              "Wood feeds Fire, Fire creates Earth (ash), Earth bears Metal, Metal carries Water (minerals), Water nourishes Wood."
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg rounded-[2.5rem] bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10"><Shield size={120} /></div>
          <CardHeader className="p-8">
            <CardTitle className="text-2xl font-black flex items-center gap-3">
              <Shield size={24} className="text-rose-400" /> Ko Cycle (Controlling)
            </CardTitle>
            <CardDescription className="text-slate-400">The 'Grandmother-Grandchild' relationship. One element restrains another.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {ELEMENTS.map(el => (
                <div key={el.name} className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/10">
                  <span className={cn("w-3 h-3 rounded-full", el.color)} />
                  <span className="font-bold text-sm w-16">{el.name}</span>
                  <ArrowRight size={14} className="text-slate-600" />
                  <span className="text-xs font-medium text-slate-400">Controls</span>
                  <Badge variant="outline" className="border-white/20 text-white font-bold">{el.ko}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {ELEMENTS.map(el => (
          <Card key={el.name} className="border-none shadow-md rounded-[2rem] bg-white hover:shadow-xl transition-all group">
            <CardHeader className="pb-3">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-3 shadow-lg", el.color)}>
                <Zap size={24} />
              </div>
              <CardTitle className="text-xl font-black">{el.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-slate-500 font-medium leading-relaxed">{el.description}</p>
              <div className="space-y-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Meridians</p>
                <div className="flex flex-wrap gap-1">
                  {el.meridians.map(m => (
                    <Badge key={m} variant="secondary" className="bg-slate-100 text-slate-600 border-none text-[8px] font-bold">
                      {m}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Alert className="bg-blue-50 border-blue-100 rounded-[2rem] p-6">
        <Info className="h-5 w-5 text-blue-600" />
        <AlertDescription className="text-sm text-blue-900 font-medium leading-relaxed">
          <strong>Clinical Application:</strong> If an element is deficient, you can strengthen its "Mother" (Sheng Cycle). If an element is overactive, you can strengthen the element that "Controls" it (Ko Cycle).
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default FiveElementCycle;