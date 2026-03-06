"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowDown, 
  Brain, 
  Zap, 
  Activity, 
  Layers, 
  Move,
  ShieldAlert,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

const HIERARCHY_DATA = [
  {
    id: 'vestibular',
    title: 'Vestibular',
    target: 'Extensors',
    nerves: ['Cranial Nerve 8 (Pons)'],
    color: 'bg-emerald-500',
    lightColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
    targetColor: 'bg-rose-500',
    targetLight: 'bg-rose-50',
    targetBorder: 'border-rose-200',
    targetText: 'text-rose-700'
  },
  {
    id: 'medulla',
    title: 'Medulla',
    target: 'Flexors',
    nerves: ['Cranial Nerves 9, 10, 11, 12'],
    color: 'bg-purple-500',
    lightColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
    targetColor: 'bg-blue-400',
    targetLight: 'bg-blue-50',
    targetBorder: 'border-blue-200',
    targetText: 'text-blue-700'
  },
  {
    id: 'pons',
    title: 'Pons',
    target: 'Extensors',
    nerves: ['Cranial Nerves 5, 6, 7, 8'],
    color: 'bg-indigo-600',
    lightColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-700',
    targetColor: 'bg-rose-500',
    targetLight: 'bg-rose-50',
    targetBorder: 'border-rose-200',
    targetText: 'text-rose-700'
  },
  {
    id: 'midbrain',
    title: 'Midbrain',
    target: 'Flexors',
    nerves: ['Cranial Nerves 3 & 4'],
    color: 'bg-amber-500',
    lightColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    targetColor: 'bg-blue-400',
    targetLight: 'bg-blue-50',
    targetBorder: 'border-blue-200',
    targetText: 'text-blue-700'
  }
];

const MotorControlHierarchy = () => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
        {HIERARCHY_DATA.map((item) => (
          <div key={item.id} className="flex flex-col items-center space-y-6 group">
            {/* Brainstem Region */}
            <div className={cn(
              "w-full p-6 rounded-[2rem] border-2 text-center transition-all duration-500 group-hover:shadow-xl group-hover:-translate-y-1",
              item.lightColor, item.borderColor
            )}>
              <div className={cn(
                "w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center text-white shadow-lg",
                item.color
              )}>
                {item.id === 'midbrain' ? <Zap size={24} /> : 
                 item.id === 'pons' ? <Layers size={24} /> : 
                 item.id === 'medulla' ? <Activity size={24} /> : 
                 <Move size={24} />}
              </div>
              <h4 className={cn("text-xl font-black", item.textColor)}>{item.title}</h4>
            </div>

            {/* Connector Arrow */}
            <div className="flex flex-col items-center gap-1 animate-bounce">
              <ArrowDown className="text-slate-300" size={24} />
            </div>

            {/* Motor Output Target */}
            <div className={cn(
              "w-full p-6 rounded-[2rem] border-2 text-center transition-all duration-500 group-hover:shadow-xl",
              item.targetLight, item.targetBorder
            )}>
              <p className={cn("text-2xl font-black mb-1", item.targetText)}>{item.target}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Motor Control</p>
            </div>

            {/* Associated Nerves */}
            <div className="pt-4 flex flex-col items-center gap-2">
              <div className="w-0.5 h-8 bg-slate-100 rounded-full" />
              <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Associated Pathway</p>
                {item.nerves.map(nerve => (
                  <p key={nerve} className="text-xs font-bold text-slate-700">{nerve}</p>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Card className="border-none shadow-lg rounded-[2.5rem] bg-slate-900 text-white overflow-hidden">
        <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8">
          <div className="w-20 h-20 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center shrink-0 shadow-2xl shadow-indigo-500/20">
            <ShieldAlert size={40} className="text-white" />
          </div>
          <div className="space-y-2">
            <h4 className="text-xl font-black flex items-center gap-2">
              <Info size={20} className="text-indigo-400" /> Clinical Application
            </h4>
            <p className="text-slate-400 font-medium leading-relaxed">
              Use this hierarchy to isolate brainstem dysfunction. If a client presents with systemic <span className="text-rose-400 font-bold">Extensor inhibition</span>, prioritize screening the <span className="text-white font-bold">Pons</span> and <span className="text-white font-bold">Vestibular</span> pathways. If <span className="text-blue-400 font-bold">Flexors</span> are inhibited, look to the <span className="text-white font-bold">Midbrain</span> or <span className="text-white font-bold">Medulla</span>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MotorControlHierarchy;