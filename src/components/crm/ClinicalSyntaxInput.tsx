"use client";

import React, { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { parseClinicalSyntax, getDirectionColor, getDirectionLabel } from "@/utils/syntax-parser";
import { cn } from "@/lib/utils";
import { Info, Zap, Sparkles, HelpCircle, ChevronRight, Table as TableIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ClinicalSyntaxInputProps {
  value: string | null | undefined;
  onSave: (value: string | null) => Promise<void>;
  label?: string;
}

const ClinicalSyntaxInput = ({ value, onSave, label = "Clinical Corrections (Shorthand)" }: ClinicalSyntaxInputProps) => {
  const [localValue, setLocalValue] = useState(value || "");
  const [isFocused, setIsFocused] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const parsed = parseClinicalSyntax(localValue);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalValue(val);
  };

  const handleBlur = () => {
    setIsFocused(false);
    onSave(localValue.trim() === "" ? null : localValue.trim());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
          <Zap size={14} className="text-amber-500" /> {label}
        </label>
        <button 
          onClick={() => setShowGuide(!showGuide)}
          className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline flex items-center gap-1"
        >
          <HelpCircle size={12} /> {showGuide ? "Hide Syntax Guide" : "Syntax Guide"}
        </button>
      </div>

      {showGuide && (
        <Card className="border-none shadow-inner bg-indigo-50/50 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
          <CardContent className="p-4 space-y-3">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Syntax Reference</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
              <div className="space-y-1">
                <p className="font-bold text-slate-700">Structure:</p>
                <code className="block bg-white p-2 rounded-lg border border-indigo-100 text-indigo-600">
                  : [Priority] - [Target] || [Dir], [Fix] >> [Note]
                </code>
              </div>
              <div className="space-y-1">
                <p className="font-bold text-slate-700">Directions:</p>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-[9px] border-purple-200 text-purple-600">E (Efferent)</Badge>
                  <Badge variant="outline" className="text-[9px] border-blue-200 text-blue-600">A (Afferent)</Badge>
                  <Badge variant="outline" className="text-[9px] border-emerald-200 text-emerald-600">EASE (Reset)</Badge>
                </div>
              </div>
            </div>
            <p className="text-[9px] text-slate-400 italic">Example: : 1 - Moro || E, Limbic.L, S1.R >> Integrated instantly.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Textarea
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={() => setIsFocused(true)}
            placeholder=": 1 - Babinski.L || E, Pons, Medulla.R >> Result..."
            className="min-h-[200px] rounded-[2rem] border-2 border-slate-100 focus:border-indigo-500 bg-white p-6 text-sm font-mono leading-relaxed shadow-inner resize-none transition-all"
          />
          <p className="text-[9px] text-slate-400 px-4">Start each line with a colon (:) to trigger the renderer.</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <TableIcon size={14} className="text-slate-400" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Rendered Preview</span>
          </div>
          
          <div className="bg-slate-900 rounded-[2rem] overflow-hidden shadow-xl border border-slate-800 min-h-[200px]">
            {parsed.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/50">
                      <th className="p-3 text-left font-black text-slate-500 uppercase tracking-widest w-12">PRI</th>
                      <th className="p-3 text-left font-black text-slate-500 uppercase tracking-widest">TARGET</th>
                      <th className="p-3 text-left font-black text-slate-500 uppercase tracking-widest">CORRECTIONS</th>
                      <th className="p-3 text-left font-black text-slate-500 uppercase tracking-widest">METADATA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.map((finding, i) => (
                      <tr key={i} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                        <td className="p-3 font-black text-slate-500">{finding.priority}</td>
                        <td className="p-3 font-black text-indigo-400">{finding.target}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={cn("font-black uppercase", getDirectionColor(finding.direction))}>
                              {finding.direction}
                            </span>
                            <span className="text-slate-600">:</span>
                            {finding.corrections.map((c, ci) => (
                              <span key={ci} className="text-slate-300 font-medium">
                                {c}{ci < finding.corrections.length - 1 ? "," : ""}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3 text-slate-400 italic font-medium">{finding.metadata}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-slate-600 space-y-2">
                <Sparkles size={24} className="opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest">Waiting for syntax...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicalSyntaxInput;