
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
 <Loader2 className="animate-spin text-muted-foreground" size={32} />
 <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Scanning Database for Duplicates...</p>
 </div>
 );
 }

 if (detectedDuplicates.length === 0) {
 return (
 <div className="p-6 bg-chart-emerald/10/50 rounded-3xl border border-border flex items-center gap-4">
 <div className="w-10 h-10 rounded-xl bg-chart-emerald text-white flex items-center justify-center shadow-sm">
 <UserCheck size={20} />
 </div>
 <div className="space-y-0.5">
 <p className="text-sm font-semibold text-emerald-900">No Duplicates Detected</p>
 <p className="text-xs text-chart-emerald font-medium">Your client database is clean and fully consolidated.</p>
 </div>
 </div>
 );
 }

 return (
 <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
 <div className="flex items-center gap-2 px-1">
 <Sparkles size={16} className="text-muted-foreground" />
 <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Smart Duplicate Detector</p>
 </div>
 <div className="grid grid-cols-1 gap-3">
 {detectedDuplicates.map((group, idx) => (
 <div key={idx} className="p-5 bg-muted/50 rounded-3xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div className="space-y-2">
 <div className="flex items-center gap-2">
 <h4 className="font-semibold text-base text-muted-foreground">"{group.name}"</h4>
 <Badge className="bg-muted text-white border-none font-semibold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full">
 {group.confidence}% Match Confidence
 </Badge>
 </div>
 <p className="text-xs text-muted-foreground font-medium">
 <strong>Reason:</strong> {group.matchReason}
 </p>
 <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
 <span className="font-medium">Keep:</span>
 <code className="bg-white px-2 py-0.5 rounded border border-border text-[10px] font-mono">
 {group.primary.name} {group.primary.email ? `(${group.primary.email})` : '(No Email)'}
 </code>
 <span className="opacity-40">|</span>
 <span className="font-medium">Merge:</span>
 {group.duplicates.map(d => (
 <code key={d.id} className="bg-white px-2 py-0.5 rounded border border-border text-[10px] font-mono">
 {d.name} {d.email ? `(${d.email})` : '(No Email)'}
 </code>
 ))}
 </div>
 </div>
 <div className="flex gap-2">
 <Button 
 onClick={() => onReviewMerge(group.primary, group.duplicates[0])}
 disabled={merging}
 variant="outline"
 className="border-border text-muted-foreground hover:bg-muted rounded-xl h-9 px-4 font-semibold text-[10px] uppercase tracking-wider"
 >
 Review & Merge
 </Button>
 <Button 
 onClick={() => onAutoMerge(group)}
 disabled={merging}
 className="bg-muted hover:bg-muted/90 text-white rounded-xl h-9 px-4 font-semibold text-[10px] uppercase tracking-wider shadow-md"
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