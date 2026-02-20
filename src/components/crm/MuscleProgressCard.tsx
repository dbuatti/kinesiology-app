"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface MuscleProgressCardProps {
  testedCount: number;
  totalCount: number;
}

const MuscleProgressCard = ({ testedCount, totalCount }: MuscleProgressCardProps) => {
  const progressPercent = totalCount > 0 ? (testedCount / totalCount) * 100 : 0;

  return (
    <Card className="border-none shadow-lg rounded-[2rem] bg-white overflow-hidden">
      <CardContent className="p-6 flex flex-col justify-center h-full space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Session Progress</p>
          <p className="text-sm font-black text-indigo-600">{testedCount} / {totalCount}</p>
        </div>
        <Progress value={progressPercent} className="h-2 bg-slate-100 [&>div]:bg-indigo-600" />
        <p className="text-[10px] text-slate-500 font-medium text-center">Muscles tested in this session</p>
      </CardContent>
    </Card>
  );
};

export default MuscleProgressCard;