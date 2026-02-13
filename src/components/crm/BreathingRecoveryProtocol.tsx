"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wind, Timer, Clock, AlertCircle, CheckCircle2, ArrowRight, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import BreathingRecoveryTimer from "./BreathingRecoveryTimer";
import { Button } from "@/components/ui/button";

interface BreathingRecoveryProtocolProps {
  currentScore?: number | null;
  className?: string;
}

const BreathingRecoveryProtocol = ({ currentScore, className }: BreathingRecoveryProtocolProps) => {
  const [showInteractive, setShowInteractive] = useState(false);
  const isImperative = currentScore !== null && currentScore !== undefined && currentScore < 25;

  return (
    <div className={cn("space-y-6", className)}>
      {isImperative && (
        <Alert className="bg-rose-50 border-rose-200 animate-pulse">
          <AlertCircle className="h-5 w-5 text-rose-600" />
          <AlertDescription className="text-sm text-rose-900 font-bold">
            IMPERATIVE: Based on the latest BOLT score ({currentScore}s), this exercise is critical for the client's recovery.
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-none shadow-lg rounded-3xl overflow-hidden bg-white">
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                <Wind size={28} />
              </div>
              <div>
                <CardTitle className="text-2xl font-black">Breathing Recovery Exercise</CardTitle>
                <p className="text-teal-50 text-sm font-medium">Protocol for increasing CO2 tolerance and BOLT scores</p>
              </div>
            </div>
            {!showInteractive && (
              <Button 
                onClick={() => setShowInteractive(true)}
                className="bg-white text-teal-700 hover:bg-teal-50 rounded-xl font-bold shadow-lg"
              >
                <PlayCircle size={18} className="mr-2" /> Start Interactive Session
              </Button>
            )}
          </div>
        </div>
        <CardContent className="p-8 space-y-8">
          {showInteractive ? (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Interactive Practice Mode</h4>
                <Button variant="ghost" size="sm" onClick={() => setShowInteractive(false)} className="text-slate-400 hover:text-slate-900">
                  Back to Instructions
                </Button>
              </div>
              <BreathingRecoveryTimer />
            </div>
          ) : (
            <>
              <div className="grid gap-6">
                {[
                  { 
                    step: 1, 
                    title: "The Hold", 
                    text: "Take a normal breath in and out through the nose. Plug the nose/nostrils for 5 seconds.",
                    icon: Timer,
                    color: "bg-teal-50 text-teal-700 border-teal-100"
                  },
                  { 
                    step: 2, 
                    title: "The Recovery", 
                    text: "Release the hold and resume normal, calm, nasal breathing for 10-15 seconds.",
                    icon: Wind,
                    color: "bg-emerald-50 text-emerald-700 border-emerald-100"
                  },
                  { 
                    step: 3, 
                    title: "The Cycle", 
                    text: "Continue this cycle for 5-15 minutes total.",
                    icon: Clock,
                    color: "bg-indigo-50 text-indigo-700 border-indigo-100"
                  }
                ].map((item) => (
                  <div key={item.step} className={cn("flex gap-5 p-5 rounded-2xl border-2 transition-all", item.color)}>
                    <div className="flex flex-col items-center gap-2">
                      <span className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center font-black text-lg shrink-0 border border-current/10">
                        {item.step}
                      </span>
                      <div className="h-full w-0.5 bg-current/10 rounded-full" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-black uppercase tracking-widest text-xs opacity-70">{item.title}</h4>
                      <p className="text-lg font-bold leading-tight">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-slate-900 text-white p-6 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Clock size={80} />
                </div>
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                  <Clock size={16} /> Recommended Schedule
                </h4>
                <p className="text-xl font-bold leading-snug relative z-10">
                  Do this <span className="text-teal-400">2-3 times a day</span>, everyday in sets of <span className="text-teal-400">10-20 minutes</span> to increase your BOLT score.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Minimum Target</p>
                  <p className="text-2xl font-black text-indigo-900">25 Seconds</p>
                  <p className="text-xs text-indigo-700 mt-1 font-medium">Essential for optimizing health</p>
                </div>
                <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Optimal Goal</p>
                  <p className="text-2xl font-black text-emerald-900">40+ Seconds</p>
                  <p className="text-xs text-emerald-700 mt-1 font-medium">Peak respiratory function</p>
                </div>
              </div>
            </>
          )}

          <Alert className="bg-amber-50 border-amber-200 rounded-2xl">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <AlertDescription className="text-xs text-amber-800 leading-relaxed">
              <strong>Note:</strong> If breathing exercises are triggering or stressful, use the <strong>Nociceptive Threat Assessment</strong> to clear the nervous system response before continuing.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default BreathingRecoveryProtocol;