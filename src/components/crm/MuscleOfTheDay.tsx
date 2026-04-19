"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dumbbell, 
  Sparkles, 
  ArrowRight, 
  Target, 
  Brain,
  Activity,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { MUSCLE_GROUPS } from '@/data/muscle-data';
import { getMuscleInfo } from '@/data/muscle-info-data';

const STORAGE_KEY = "antigravity_muscle_of_the_day";

interface MuscleOfTheDayProps {
  onViewDetails: (name: string) => void;
}

const MuscleOfTheDay = ({ onViewDetails }: MuscleOfTheDayProps) => {
  const [muscleName, setMuscleName] = useState<string | null>(null);

  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.date === today) {
          setMuscleName(parsed.name);
          return;
        }
      } catch (e) {
        console.error("Failed to parse stored muscle", e);
      }
    }

    // Pick a random muscle
    const allMuscles: string[] = [];
    Object.values(MUSCLE_GROUPS).forEach(group => allMuscles.push(...group));
    const randomMuscle = allMuscles[Math.floor(Math.random() * allMuscles.length)];
    
    setMuscleName(randomMuscle);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      date: today,
      name: randomMuscle
    }));
  }, []);

  if (!muscleName) return null;

  const info = getMuscleInfo(muscleName);

  return (
    <Card className="border-none shadow-2xl rounded-[3rem] bg-slate-900 text-white overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-transparent to-rose-600/10" />
      <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
        <Dumbbell size={180} />
      </div>
      
      <CardContent className="p-10 md:p-14 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-6 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="bg-amber-400 text-slate-900 border-none font-black text-[10px] uppercase tracking-[0.3em] px-4 py-1.5 shadow-lg">
                <Sparkles size={12} className="mr-2 fill-current" /> Featured Muscle
              </Badge>
              <Badge className="bg-white/10 text-white border-white/20 font-black text-[10px] uppercase tracking-[0.3em] px-4 py-1.5 backdrop-blur-sm">
                Daily Rotation
              </Badge>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-5xl md:text-6xl font-black tracking-tighter leading-none">
                {muscleName}
              </h2>
              <p className="text-xl font-medium text-indigo-300 uppercase tracking-widest">
                {info.meridian} Meridian • {info.brainstemControl || 'General Control'}
              </p>
            </div>

            <div className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm max-w-2xl">
              <p className="text-lg font-medium text-slate-300 leading-relaxed">
                "{info.description || 'Master the clinical details and testing position for this muscle.'}"
              </p>
            </div>

            <div className="flex flex-wrap gap-6 pt-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                  <Target size={20} className="text-indigo-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Primary Goal</p>
                  <p className="text-sm font-bold text-slate-200">Clinical Mastery</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
                  <Activity size={20} className="text-rose-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</p>
                  <p className="text-sm font-bold text-slate-200">Reference Ready</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 md:items-end">
            <Button 
              onClick={() => onViewDetails(muscleName)}
              className="w-24 h-24 rounded-[2rem] bg-white text-slate-900 hover:bg-indigo-50 shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 flex flex-col items-center justify-center gap-1"
            >
              <ArrowRight size={32} />
              <span className="text-[8px] font-black uppercase tracking-widest">Details</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MuscleOfTheDay;