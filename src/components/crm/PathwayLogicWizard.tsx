"use client";

import React, { useState } from 'react';
import { AFFERENT_PATHWAYS, EFFERENT_PATHWAYS, PathwayOption, DirectionType } from '@/data/pathway-logic-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight, ChevronLeft, GitBranch, Sparkles, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const PathwayLogicWizard = () => {
  const [direction, setDirection] = useState<DirectionType | null>(null);
  const [specific, setSpecific] = useState<PathwayOption | null>(null);

  const reset = () => {
    setDirection(null);
    setSpecific(null);
  };

  if (!direction) {
    return (
      <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => setDirection('Afferent (Bottom-Up)')}
            className="p-8 rounded-3xl border-2 border-blue-100 bg-blue-50/50 hover:border-blue-300 hover:bg-blue-50 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-black text-blue-900">Afferent</h3>
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <GitBranch size={24} className="text-blue-600" />
              </div>
            </div>
            <p className="text-sm font-bold text-blue-700">Bottom-Up Processing</p>
            <p className="text-xs text-blue-600 mt-1">Sensory input from body to brain.</p>
          </button>
          <button
            onClick={() => setDirection('Efferent (Top-Down)')}
            className="p-8 rounded-3xl border-2 border-purple-100 bg-purple-50/50 hover:border-purple-300 hover:bg-purple-50 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-black text-purple-900">Efferent</h3>
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles size={24} className="text-purple-600" />
              </div>
            </div>
            <p className="text-sm font-bold text-purple-700">Top-Down Processing</p>
            <p className="text-xs text-purple-600 mt-1">Motor commands from brain to body.</p>
          </button>
        </div>
      </div>
    );
  }

  if (!specific) {
    const options = direction === 'Afferent (Bottom-Up)' ? AFFERENT_PATHWAYS : EFFERENT_PATHWAYS;
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-900">Select Specific Pathway</h3>
          <Button variant="ghost" onClick={() => setDirection(null)} className="rounded-xl">
            <ChevronLeft size={16} className="mr-2" /> Back
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {options.map(opt => (
            <button
              key={opt.id}
              onClick={() => setSpecific(opt)}
              className="p-6 rounded-2xl border-2 border-slate-100 bg-white hover:border-indigo-200 hover:bg-indigo-50/30 transition-all text-left group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-white transition-colors">
                    <opt.icon size={20} className={opt.color} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{opt.label}</p>
                    <p className="text-xs text-slate-500">{opt.direction}</p>
                  </div>
                </div>
                <ArrowRight size={20} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
            <specific.icon size={24} className={specific.color} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900">{specific.label}</h3>
            <p className="text-sm font-medium text-slate-500">{specific.direction}</p>
          </div>
        </div>
        <Button variant="ghost" onClick={() => setSpecific(null)} className="rounded-xl">
          <ChevronLeft size={16} className="mr-2" /> Back to Pathways
        </Button>
      </div>
      <Card className="border-none shadow-sm bg-white rounded-2xl">
        <CardContent className="p-6 space-y-6">
          <div>
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Description</h4>
            <p className="text-sm text-slate-600 leading-relaxed">{specific.description}</p>
          </div>
          {specific.confirmationTest && (
            <div>
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Confirmation Test</h4>
              <p className="text-sm font-bold text-indigo-600 bg-indigo-50 p-3 rounded-xl border border-indigo-100">{specific.confirmationTest}</p>
            </div>
          )}
          <div>
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Protocols</h4>
            <ul className="space-y-3">
              {specific.protocols.map((proto, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700 font-medium">{proto}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
      <Button onClick={reset} className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 font-bold">
        Start Over
      </Button>
    </div>
  );
};

export default PathwayLogicWizard;