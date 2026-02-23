"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, PowerOff, Edit3, Trash2, ExternalLink,
  FlaskConical, Brain, Activity, Zap, Target, Footprints, 
  Scale, Hand, Heart, Move, Wind, Droplets 
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const ICON_OPTIONS = [
  { value: 'flask', icon: FlaskConical },
  { value: 'brain', icon: Brain },
  { value: 'activity', icon: Activity },
  { value: 'zap', icon: Zap },
  { value: 'target', icon: Target },
  { value: 'footprints', icon: Footprints },
  { value: 'scale', icon: Scale },
  { value: 'hand', icon: Hand },
  { value: 'heart', icon: Heart },
  { value: 'move', icon: Move },
  { value: 'wind', icon: Wind },
  { value: 'droplets', icon: Droplets },
];

interface ProcedureCardProps {
  procedure: any;
  latestScores: any;
  onEdit: (p: any) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
}

const ProcedureCard = ({ procedure, latestScores, onEdit, onDelete, onToggle }: ProcedureCardProps) => {
  const IconComponent = ICON_OPTIONS.find(opt => opt.value === procedure.icon)?.icon || Target;
  const progress = Math.min((procedure.current_count / procedure.target_count) * 100, 100);
  const isComplete = procedure.current_count >= procedure.target_count;
  
  let specificStatus = null;
  let statusColor = "text-slate-500";

  if (procedure.name.includes("BOLT Test")) {
    const score = latestScores.bolt_score;
    if (score !== null) {
      specificStatus = `Current: ${score}s`;
      statusColor = score >= 25 ? "text-emerald-600" : "text-amber-600";
    }
  } else if (procedure.name.includes("Coherence")) {
    const score = latestScores.coherence_score;
    if (score !== null) {
      specificStatus = `Score: ${score.toFixed(2)}`;
      statusColor = "text-indigo-600";
    }
  } else if (procedure.current_count > 0) {
    specificStatus = "Assessed";
    statusColor = "text-indigo-600";
  }

  return (
    <Card className={cn(
      "border-none shadow-md rounded-2xl overflow-hidden transition-all hover:shadow-lg",
      !procedure.enabled && "opacity-60",
      isComplete && procedure.enabled ? "bg-gradient-to-br from-emerald-50 to-emerald-100" : "bg-white"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm",
              !procedure.enabled ? "bg-slate-300" :
              isComplete ? "bg-emerald-500" : "bg-indigo-600"
            )}>
              <IconComponent size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg font-bold text-slate-900">{procedure.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {isComplete && procedure.enabled && (
                  <Badge className="bg-emerald-600 text-white border-none text-[10px] font-black uppercase tracking-widest">
                    <CheckCircle2 size={10} className="mr-1" /> Complete
                  </Badge>
                )}
                {!procedure.enabled && (
                  <Badge variant="outline" className="border-slate-300 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                    <PowerOff size={10} className="mr-1" /> Disabled
                  </Badge>
                )}
                {specificStatus && (
                  <span className={cn("text-[10px] font-black uppercase tracking-widest", statusColor)}>
                    {specificStatus}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(procedure)}>
              <Edit3 size={14} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => onDelete(procedure.id)}>
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {procedure.description && (
          <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">{procedure.description}</p>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">Track in appointments</span>
          <Switch
            checked={procedure.enabled}
            onCheckedChange={() => onToggle(procedure.id, procedure.enabled)}
          />
        </div>

        {procedure.enabled && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
              <span className="text-slate-400">Progress</span>
              <span className={cn(isComplete ? "text-emerald-600" : "text-indigo-600")}>
                {procedure.current_count} / {procedure.target_count}
              </span>
            </div>
            <Progress
              value={progress}
              className={cn("h-2", isComplete ? "[&>div]:bg-emerald-500" : "[&>div]:bg-indigo-600")}
            />
          </div>
        )}

        {procedure.name.includes("Lymphatic System") && (
          <Button variant="outline" size="sm" className="w-full rounded-xl border-blue-100 text-blue-600 hover:bg-blue-50 font-bold text-xs" asChild>
            <Link to="/resources?tab=lymphatic">
              <ExternalLink size={14} className="mr-2" /> View Protocol
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ProcedureCard;