"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Footprints, Info, Zap, Eye, Move, CheckCircle2, XCircle, MousePointer2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import EditableField from "./EditableField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface GaitReflexAssessmentProps {
  appointmentId: string;
  initialNotes: string | null | undefined;
  onSaveField: (field: string, value: string | null) => Promise<void>;
}

type TestStatus = 'normal' | 'abnormal' | null;

const GaitReflexAssessment = ({ 
  appointmentId, 
  initialNotes, 
  onSaveField 
}: GaitReflexAssessmentProps) => {
  const [results, setResults] = useState<Record<string, TestStatus>>({});
  const [eyePriority, setEyePriority] = useState<string | null>(null);

  const GAIT_TESTS = {
    leftForward: [
      { id: 'lf_rf', label: 'R Arm Flexors', expected: 'Lock' },
      { id: 'lf_le', label: 'L Arm Extensors', expected: 'Lock' },
      { id: 'lf_lf', label: 'L Arm Flexors', expected: 'Unlock' },
      { id: 'lf_re', label: 'R Arm Extensors', expected: 'Unlock' },
    ],
    rightForward: [
      { id: 'rf_lf', label: 'L Arm Flexors', expected: 'Lock' },
      { id: 'rf_re', label: 'R Arm Extensors', expected: 'Lock' },
      { id: 'rf_rf', label: 'R Arm Flexors', expected: 'Unlock' },
      { id: 'rf_le', label: 'L Arm Extensors', expected: 'Unlock' },
    ]
  };

  const CORRECTIONS: Record<string, { fix: string, detail: string }> = {
    "UP": { fix: "Head DOWN", detail: "Close eyes, chin to chest, nasal breathing for 30s." },
    "DOWN": { fix: "Head UP/BACK", detail: "Close eyes, tilt head back, nasal breathing for 30s." },
    "RIGHT": { fix: "Rotate LEFT + Tilt RIGHT", detail: "Rotate head left, then lateral tilt right. Nasal breathing for 30s." },
    "LEFT": { fix: "Rotate RIGHT + Tilt LEFT", detail: "Rotate head right, then lateral tilt left. Nasal breathing for 30s." },
  };

  const toggleResult = (id: string) => {
    setResults(prev => ({
      ...prev,
      [id]: prev[id] === 'normal' ? 'abnormal' : prev[id] === 'abnormal' ? null : 'normal'
    }));
  };

  const hasAbnormal = useMemo(() => 
    Object.values(results).some(status => status === 'abnormal'), 
  [results]);

  const generateSummary = () => {
    const abnormalTests: string[] = [];
    Object.entries(results).forEach(([id, status]) => {
      if (status === 'abnormal') {
        const leg = id.startsWith('lf') ? 'Left Foot Forward' : 'Right Foot Forward';
        const test = [...GAIT_TESTS.leftForward, ...GAIT_TESTS.rightForward].find(t => t.id === id);
        abnormalTests.push(`${leg}: ${test?.label} failed to ${test?.expected}`);
      }
    });

    let summary = "GAIT INTEGRATION ASSESSMENT:\n";
    if (abnormalTests.length === 0) {
      summary += "- All gait patterns tested normal/integrated.";
    } else {
      summary += "- Abnormal Patterns Found:\n  " + abnormalTests.join("\n  ");
      if (eyePriority) {
        summary += `\n- Priority Correction: Eyes ${eyePriority} -> ${CORRECTIONS[eyePriority].fix}`;
      }
      summary += "\n- Integrated with 30s Cross Crawls.";
    }

    onSaveField('gait_notes', (initialNotes ? initialNotes + "\n\n" : "") + summary);
  };

  const TestButton = ({ id, label, expected }: { id: string, label: string, expected: string }) => {
    const status = results[id];
    return (
      <button
        onClick={() => toggleResult(id)}
        className={cn(
          "flex flex-col items-start p-3 rounded-xl border-2 transition-all text-left group",
          status === 'normal' ? "bg-emerald-50 border-emerald-200" :
          status === 'abnormal' ? "bg-rose-50 border-rose-200" :
          "bg-white border-slate-100 hover:border-slate-200"
        )}
      >
        <div className="flex items-center justify-between w-full mb-1">
          <span className={cn(
            "text-[10px] font-black uppercase tracking-widest",
            status === 'normal' ? "text-emerald-600" :
            status === 'abnormal' ? "text-rose-600" :
            "text-slate-400"
          )}>
            Should {expected}
          </span>
          {status === 'normal' && <CheckCircle2 size={14} className="text-emerald-500" />}
          {status === 'abnormal' && <XCircle size={14} className="text-rose-500" />}
        </div>
        <span className={cn(
          "text-xs font-bold",
          status ? "text-slate-900" : "text-slate-600"
        )}>
          {label}
        </span>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-lg rounded-2xl bg-white overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                <Footprints size={24} className="text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">Gait Reflex Integration</CardTitle>
                <CardDescription className="text-slate-600">Interactive Locomotion Calibration</CardDescription>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              onClick={generateSummary}
            >
              <FileText size={16} className="mr-2" />
              Generate Summary
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-8">
          {/* 1. Testing Patterns */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Eye size={20} className="text-emerald-600" />
                1. Diagnosis (Reciprocal Inhibition)
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <MousePointer2 size={10} /> Click to log result
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Foot Forward */}
              <div className="space-y-3">
                <p className="text-xs font-black text-indigo-600 uppercase tracking-widest px-1">Left Foot Forward</p>
                <div className="grid grid-cols-2 gap-3">
                  {GAIT_TESTS.leftForward.map(test => (
                    <TestButton key={test.id} {...test} />
                  ))}
                </div>
              </div>

              {/* Right Foot Forward */}
              <div className="space-y-3">
                <p className="text-xs font-black text-indigo-600 uppercase tracking-widest px-1">Right Foot Forward</p>
                <div className="grid grid-cols-2 gap-3">
                  {GAIT_TESTS.rightForward.map(test => (
                    <TestButton key={test.id} {...test} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Eye Priority & Correction */}
          {hasAbnormal && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Zap size={20} className="text-amber-500" />
                2. Eye Position Priority
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Eye Selectors */}
                <div className="lg:col-span-1 grid grid-cols-2 gap-2">
                  {Object.keys(CORRECTIONS).map(pos => (
                    <Button
                      key={pos}
                      variant={eyePriority === pos ? "default" : "outline"}
                      onClick={() => setEyePriority(pos)}
                      className={cn(
                        "h-12 font-bold rounded-xl",
                        eyePriority === pos ? "bg-amber-500 hover:bg-amber-600" : "border-slate-200"
                      )}
                    >
                      Eyes {pos}
                    </Button>
                  ))}
                </div>

                {/* Dynamic Fix Display */}
                <div className="lg:col-span-2">
                  {eyePriority ? (
                    <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 flex items-start gap-4 h-full">
                      <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-200">
                        <Move size={24} className="text-white" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-black text-amber-600 uppercase tracking-widest">The Fix</p>
                        <p className="text-xl font-black text-amber-900">{CORRECTIONS[eyePriority].fix}</p>
                        <p className="text-sm text-amber-800 leading-relaxed">{CORRECTIONS[eyePriority].detail}</p>
                        <div className="pt-3 flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase">
                          <CheckCircle2 size={12} /> Finish with 30s Cross Crawls
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-center text-center h-full text-slate-400">
                      <Eye size={32} className="mb-2 opacity-20" />
                      <p className="text-sm font-medium">Select the eye position that <br/>brings up the priority response</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100">
            <EditableField
              field="gait_notes"
              label="Gait Integration Notes"
              value={initialNotes}
              multiline
              placeholder="Findings will appear here when you click 'Generate Summary'..."
              onSave={onSaveField}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GaitReflexAssessment;