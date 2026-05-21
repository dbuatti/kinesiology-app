"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, UserCheck, Loader2, Merge } from "lucide-react";
import { cn } from "@/lib/utils";

interface DuplicateGroup {
  name: string;
  primary: any;
  duplicates: any[];
  matchReason: string;
  confidence: number;
}

interface DetectedDuplicatesListProps {
  detectedDuplicates: DuplicateGroup[];
  isDetecting: boolean;
  merging: boolean;
  onReviewMerge: (primary: any, duplicate: any) => void;
  onAutoMerge: (group: DuplicateGroup) => void;
}

const DetectedDuplicatesList = ({
  detectedDuplicates,
  isDetecting,
  merging,
  onReviewMerge,
  onAutoMerge
}: DetectedDuplicatesListProps) => {
  if (isDetecting) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-amber-500" size={32} />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Scanning Database for Duplicates...</p>
      </div>
    );
  }

  if (detectedDuplicates.length === 0) {
    return (
      <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
          <UserCheck size={20} />
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-black text-emerald-900">No Duplicates Detected</p>
          <p className="text-xs text-emerald-700 font-medium">Your client database is clean and fully consolidated.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-2 px-1">
        <Sparkles size={16} className="text-amber-500" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Smart Duplicate Detector</p>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {detectedDuplicates.map((group, idx) => (
          <div key={idx} className="p-5 bg-amber-50/50 rounded-3xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="font-black text-base text-amber-900">"{group.name}"</h4>
                <Badge className="bg-amber-500 text-white border-none font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full">
                  {group.confidence}% Match Confidence
                </Badge>
              </div>
              <p className="text-xs text-amber-800 font-medium">
                <strong>Reason:</strong> {group.matchReason}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-amber-800">
                <span className="font-bold">Keep:</span>
                <code className="bg-white px-2 py-0.5 rounded border border-amber-100 text-[10px] font-mono">
                  {group.primary.email || 'No Email'}
                </code>
                <span className="opacity-40">|</span>
                <span className="font-bold">Merge:</span>
                {group.duplicates.map(d => (
                  <code key={d.id} className="bg-white px-2 py-0.5 rounded border border-amber-100 text-[10px] font-mono">
                    {d.email || 'No Email'}
                  </code>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => onReviewMerge(group.primary, group.duplicates[0])}
                disabled={merging}
                variant="outline"
                className="border-amber-200 text-amber-700 hover:bg-amber-50 rounded-xl h-9 px-4 font-black text-[10px] uppercase tracking-widest"
              >
                Review & Merge
              </Button>
              <Button 
                onClick={() => onAutoMerge(group)}
                disabled={merging}
                className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl h-9 px-4 font-black text-[10px] uppercase tracking-widest shadow-md"
              >
                {merging ? <Loader2 className="mr-1.5" /> : <Merge size={12} className="mr-1.5" />}
                Auto-Merge
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DetectedDuplicatesList;