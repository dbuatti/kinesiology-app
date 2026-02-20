"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { MUSCLE_TEST_ASSISTANCE } from "@/data/muscle-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MuscleTestAssistanceCard = () => {
  return (
    <Card className="border-none shadow-xl rounded-[2.5rem] bg-indigo-900 text-white overflow-hidden">
      <CardHeader className="p-8 pb-4">
        <CardTitle className="text-2xl font-black flex items-center gap-3">
          <AlertTriangle size={28} className="text-amber-400" />
          {MUSCLE_TEST_ASSISTANCE.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8 pt-0 space-y-6">
        <div className="grid grid-cols-1 gap-3">
          {MUSCLE_TEST_ASSISTANCE.steps.map((step, index) => (
            <div key={index} className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
              <h4 className="font-black text-xs text-indigo-300 mb-1 uppercase tracking-wider">{step.title}</h4>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">{step.details}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MuscleTestAssistanceCard;