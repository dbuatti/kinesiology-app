"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calculator, Clock, Zap, Info, RefreshCw, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const CranialNerveHomeworkTool = () => {
  const [threshold, setThreshold] = useState<string>("");
  const [unit, setUnit] = useState<'reps' | 'seconds'>('seconds');

  const thresholdNum = parseInt(threshold) || 0;
  const homeworkValue = Math.floor(thresholdNum * 0.7) || 0;

  return (
    <Card className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden">
      <CardHeader className="bg-indigo-600 text-white p-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
            <Calculator size={24} />
          </div>
          <div>
            <CardTitle className="text-2xl font-black">Rehab Calculator</CardTitle>
            <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest">The 70% Threshold Rule</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
          <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-900 font-medium leading-relaxed">
            Identify the point where the stimulus causes the IM to inhibit (the threshold). Prescribe 70% of that value to avoid overstimulation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">1. Set Measurement Unit</label>
            <div className="flex gap-2">
              <Button 
                variant={unit === 'seconds' ? 'default' : 'outline'}
                onClick={() => setUnit('seconds')}
                className="flex-1 rounded-xl h-12 font-bold"
              >
                <Clock size={16} className="mr-2" /> Seconds
              </Button>
              <Button 
                variant={unit === 'reps' ? 'default' : 'outline'}
                onClick={() => setUnit('reps')}
                className="flex-1 rounded-xl h-12 font-bold"
              >
                <RefreshCw size={16} className="mr-2" /> Reps
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">2. Enter Max Threshold</label>
              <Input 
                type="number" 
                placeholder={`e.g. 10 ${unit}`}
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="h-14 rounded-2xl border-2 border-slate-100 text-xl font-black text-center focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <div className="p-8 bg-indigo-50 rounded-[2.5rem] border-2 border-indigo-100 text-center space-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5"><Zap size={80} className="text-indigo-600" /></div>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Prescribed Homework</p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-6xl font-black text-indigo-600 tabular-nums">{homeworkValue}</span>
                <span className="text-xl font-bold text-indigo-400 uppercase">{unit}</span>
              </div>
              <p className="text-xs font-bold text-indigo-900 mt-4">Minimum Effective Dose</p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-500" /> Recommended Schedule
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-sm font-bold text-slate-900">Frequency</p>
              <p className="text-xs text-slate-500 mt-1">Every hour on the hour (or 10x daily).</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-sm font-bold text-slate-900">Progression</p>
              <p className="text-xs text-slate-500 mt-1">Double the value every 7 days if clear.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CranialNerveHomeworkTool;