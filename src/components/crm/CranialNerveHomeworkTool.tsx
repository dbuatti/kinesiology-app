
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, 
  Clock, 
  Zap, 
  Info, 
  RefreshCw, 
  CheckCircle2, 
  Calendar, 
  TrendingUp,
  Baby,
  Brain
} from "lucide-react";
import { cn } from "@/lib/utils";

const CranialNerveHomeworkTool = () => {
  const [threshold, setThreshold] = useState<string>("");
  const [unit, setUnit] = useState<'reps' | 'seconds'>('seconds');
  const [mode, setMode] = useState<'nerve' | 'reflex'>('nerve');

  const thresholdNum = parseInt(threshold) || 0;
  const week1Value = Math.floor(thresholdNum * 0.7) || 0;
  const week2Value = week1Value * 2;
  const week3Value = week2Value * 2;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Card className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden">
        <CardHeader className="bg-indigo-600 text-white p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
                <Calculator size={24} />
              </div>
              <div>
                <CardTitle className="text-2xl font-black">Neurological Rehab Planner</CardTitle>
                <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest">3-Week Integration Protocol</p>
              </div>
            </div>
            <div className="flex bg-white/10 p-1 rounded-xl border border-white/20">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setMode('nerve')}
                className={cn("rounded-lg h-8 text-[10px] font-black uppercase tracking-widest", mode === 'nerve' ? "bg-white text-indigo-600" : "text-white hover:bg-white/10")}
              >
                <Zap size={14} className="mr-1.5" /> Nerve
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setMode('reflex')}
                className={cn("rounded-lg h-8 text-[10px] font-black uppercase tracking-widest", mode === 'reflex' ? "bg-white text-indigo-600" : "text-white hover:bg-white/10")}
              >
                <Baby size={14} className="mr-1.5" /> Reflex
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
            <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-900 font-medium leading-relaxed">
              {mode === 'nerve' 
                ? "Identify the point where the stimulus causes the IM to inhibit (the threshold). Prescribe 70% of that value for Week 1."
                : "For reflexes, prescribe the specific integration movement. Use the same 3-week progression to ensure the pathway remains strong."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">1. Measurement Unit</label>
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
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">2. Max Threshold (Inhibition Point)</label>
                <Input 
                  type="number" 
                  placeholder={`e.g. 10 ${unit}`}
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  className="h-14 rounded-2xl border-2 border-slate-100 text-xl font-black text-center focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">3. 3-Week Progression Plan</label>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { week: 1, val: week1Value, label: "70% Threshold", color: "bg-indigo-50 border-indigo-100 text-indigo-700" },
                  { week: 2, val: week2Value, label: "Double Week 1", color: "bg-blue-50 border-blue-100 text-blue-700" },
                  { week: 3, val: week3Value, label: "Double Week 2", color: "bg-emerald-50 border-emerald-100 text-emerald-700" }
                ].map((w) => (
                  <div key={w.week} className={cn("p-4 rounded-2xl border-2 flex items-center justify-between", w.color)}>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Week {w.week}</p>
                      <p className="text-xs font-bold">{w.label}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black tabular-nums">{w.val}</span>
                      <span className="text-[10px] font-black uppercase ml-1 opacity-70">{unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 bg-slate-900 text-white rounded-[2rem] space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Clock size={40} /></div>
              <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                <Clock size={14} /> Frequency
              </h4>
              <p className="text-lg font-bold leading-tight">Every hour on the hour.</p>
              <p className="text-[10px] text-slate-400 font-medium">Or at least 10x daily to keep the drill top of mind.</p>
            </div>

            <div className="p-5 bg-slate-900 text-white rounded-[2rem] space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Calendar size={40} /></div>
              <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                <Calendar size={14} /> Duration
              </h4>
              <p className="text-lg font-bold leading-tight">3 Full Weeks.</p>
              <p className="text-[10px] text-slate-400 font-medium">The pathway typically requires 21 days of regular input to remain strong.</p>
            </div>

            <div className="p-5 bg-slate-900 text-white rounded-[2rem] space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp size={40} /></div>
              <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp size={14} /> Progression
              </h4>
              <p className="text-lg font-bold leading-tight">Double every 7 days.</p>
              <p className="text-[10px] text-slate-400 font-medium">If the pathway tests clear at the end of the week, proceed to double the reps/time.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="p-8 bg-amber-50 rounded-[2.5rem] border-2 border-amber-100 flex items-start gap-6">
        <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xl shrink-0">
          <Brain size={32} />
        </div>
        <div className="space-y-2">
          <h4 className="text-xl font-black text-amber-900">Clinical Insight</h4>
          <p className="text-amber-800 font-medium leading-relaxed italic">
            "Usually people forget to do it every hour, but at least it's top of mind for them. The pathway will generally be strong again after 3 weeks of regular drills. You can muscle test to confirm the exact number of hours or days required for each specific case."
          </p>
        </div>
      </div>
    </div>
  );
};

export default CranialNerveHomeworkTool;