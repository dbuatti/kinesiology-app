"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Textarea } from "@/components/ui/textarea";
import { 
  Info, Timer, Play, Pause, RotateCcw, 
  Droplets, ChevronDown, Zap, Search, 
  AlertCircle, HelpCircle, Brain, Move
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface LymphaticAssessmentProps {
  appointmentId: string;
  initialSutureSide: string | null;
  initialPriorityZone: string | null;
  initialNotes: string | null;
  onSaveField: (field: string, value: string | null) => Promise<void>;
}

const RELEASE_INSTRUCTIONS: Record<string, { position: string; pearl?: string }> = {
  'Cervical': { 
    position: "C4 level, slightly anterior. Feel for nodule. Move tissue towards spine or slightly up to find 'Position of Ease'.",
    pearl: "The 'Brain Drain' — essential for clearing neural inflammation and brain fog."
  },
  'Thoracic (L)': { 
    position: "Shorten the Pec Minor. Bring the left arm into a position of ease (usually across the chest or slightly elevated) to soften the duct.",
    pearl: "The Left Thoracic Duct drains the entire left side of the body and the brain."
  },
  'Thoracic (R)': { 
    position: "Shorten the Pec Minor. Bring the right arm into a position of ease to soften the duct.",
    pearl: "Drains the right upper quadrant of the body."
  },
  'Inguinal': { 
    position: "Find the ASIS (pelvic bone). Hold the position next to the bone where you feel the tissue soften.",
    pearl: "Key for lower extremity drainage and pelvic congestion."
  },
  'Popliteal': { 
    position: "Shorten the muscle (top of calves or bottom of hamstrings). Wait for the tissue to soften.",
    pearl: "Clinical Pearl: Releasing popliteal tension often resolves long-term chronic headaches."
  },
  'Cisterna Chyli': { 
    position: "Central abdominal release. Use gentle pressure and find the angle of ease that softens the deep abdominal tension.",
    pearl: "The central reservoir for all lymph from the lower body."
  },
  'Maxillary': { 
    position: "Gentle traction along the jawline and facial nodes to find the position of maximum softening.",
    pearl: "Often improves once the Cervical and Thoracic ducts are cleared."
  },
  'Axillary': { 
    position: "Shorten the shoulder girdle. This zone usually self-corrects once the Thoracic ducts are opened.",
    pearl: "Secondary to Thoracic duct clearance."
  }
};

const LymphaticAssessment = ({
  appointmentId,
  initialSutureSide,
  initialPriorityZone,
  initialNotes,
  onSaveField
}: LymphaticAssessmentProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [sutureSide, setSutureSide] = useState<string | null>(initialSutureSide);
  const [priorityZone, setPriorityZone] = useState<string | null>(initialPriorityZone);
  const [notes, setNotes] = useState<string | null>(initialNotes);
  
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft !== null && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (interval) clearInterval(interval);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isActive, timeLeft]);

  const startTimer = (seconds: number) => {
    setTimeLeft(seconds);
    setIsActive(true);
  };

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => { setIsActive(false); setTimeLeft(null); };

  const handleSutureSideChange = (value: string) => {
    const newValue = value || null;
    setSutureSide(newValue);
    onSaveField('lymphatic_suture_side', newValue);
  };

  const handlePriorityZoneChange = (value: string) => {
    const newValue = value || null;
    setPriorityZone(newValue);
    onSaveField('lymphatic_priority_zone', newValue);
  };

  const handleNotesBlur = () => {
    if (notes !== initialNotes) {
      onSaveField('lymphatic_notes', notes);
    }
  };

  const zones = Object.keys(RELEASE_INSTRUCTIONS);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full space-y-2">
      <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardHeader className="p-6 cursor-pointer hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Droplets size={20} />
                </div>
                <div>
                  <CardTitle className="text-lg font-black text-slate-900">Lymphatic System</CardTitle>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Assessment & Release</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {priorityZone && (
                  <Badge className="bg-blue-600 text-white border-none font-bold text-[10px] uppercase tracking-widest">
                    Priority: {priorityZone}
                  </Badge>
                )}
                <ChevronDown className={cn("h-5 w-5 text-slate-400 transition-transform duration-200", isOpen && "rotate-180")} />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="p-6 pt-0 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Search size={12} /> 1. Suture Side (Hologram)
                    </label>
                    <ToggleGroup type="single" value={sutureSide || ""} onValueChange={handleSutureSideChange} className="justify-start gap-2">
                      <ToggleGroupItem value="Left" className="rounded-xl px-4 py-2 h-10 font-bold data-[state=on]:bg-blue-600 data-[state=on]:text-white border border-slate-100">Left</ToggleGroupItem>
                      <ToggleGroupItem value="Right" className="rounded-xl px-4 py-2 h-10 font-bold data-[state=on]:bg-blue-600 data-[state=on]:text-white border border-slate-100">Right</ToggleGroupItem>
                    </ToggleGroup>
                    <p className="text-[10px] text-slate-400 italic">Palpate Temporoparietal suture for restricted glide or tenderness.</p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Zap size={12} /> 2. Priority Node Zone
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {zones.map(zone => (
                        <Button 
                          key={zone}
                          variant={priorityZone === zone ? "default" : "outline"}
                          onClick={() => handlePriorityZoneChange(zone)}
                          className={cn(
                            "rounded-xl px-3 py-1 h-8 text-[10px] font-bold uppercase tracking-wider transition-all",
                            priorityZone === zone ? "bg-blue-600 text-white shadow-md" : "border-slate-100 hover:bg-blue-50"
                          )}
                        >
                          {zone}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {priorityZone && (
                  <div className="p-6 bg-blue-50 rounded-[2rem] border-2 border-blue-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg">
                        <Move size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Release Position: {priorityZone}</p>
                        <p className="text-sm font-bold text-blue-900 leading-relaxed">
                          {RELEASE_INSTRUCTIONS[priorityZone].position}
                        </p>
                      </div>
                    </div>
                    {RELEASE_INSTRUCTIONS[priorityZone].pearl && (
                      <div className="flex items-start gap-3 p-3 bg-white/60 rounded-xl border border-blue-200">
                        <Brain size={16} className="text-blue-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-blue-800 font-medium italic">
                          {RELEASE_INSTRUCTIONS[priorityZone].pearl}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-6 bg-slate-900 text-white rounded-[2rem] border border-slate-800 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                        <Timer size={20} />
                      </div>
                      <span className="text-xs font-black uppercase tracking-[0.2em]">Counterstrain Timer</span>
                    </div>
                    {timeLeft !== null && (
                      <div className="text-4xl font-black text-blue-400 tabular-nums tracking-tighter">
                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" onClick={() => startTimer(45)} className="rounded-xl font-black text-[10px] uppercase tracking-widest border-white/10 bg-white/5 hover:bg-white/10 text-white h-10 px-6">45s</Button>
                    <Button variant="outline" onClick={() => startTimer(90)} className="rounded-xl font-black text-[10px] uppercase tracking-widest border-white/10 bg-white/5 hover:bg-white/10 text-white h-10 px-6">90s</Button>
                    {timeLeft !== null && (
                      <div className="flex gap-2 ml-auto">
                        <Button variant="ghost" size="icon" onClick={toggleTimer} className="rounded-xl text-white hover:bg-white/10">{isActive ? <Pause size={20} /> : <Play size={20} />}</Button>
                        <Button variant="ghost" size="icon" onClick={resetTimer} className="rounded-xl text-white hover:bg-white/10"><RotateCcw size={20} /></Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <Card className="border-none shadow-inner bg-slate-50 rounded-2xl overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <HelpCircle size={14} className="text-blue-500" /> Priority Check
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <p className="text-xs font-bold text-slate-700 leading-relaxed">
                        Touch <span className="text-blue-600 font-black">Kidney 27</span> points while client touches the node.
                      </p>
                      <p className="text-[10px] text-slate-500 mt-2 font-medium">If the indicator muscle locks, you've found the priority.</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setShowGuide(!showGuide)} className="w-full text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50">
                      {showGuide ? "Hide Protocol" : "View Full Protocol"}
                    </Button>
                  </CardContent>
                </Card>

                {showGuide && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-right-2 duration-300">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step-by-Step</h4>
                    <ol className="space-y-2">
                      {["Palpate suture (glide/tenderness)", "Client holds tender point", "Test IM (should inhibit)", "Work neck down to find priority", "Confirm with K27 priority check", "Correct only the priority point"].map((step, i) => (
                        <li key={i} className="flex gap-3 text-[10px] font-bold text-slate-600"><span className="text-blue-500">{i + 1}.</span> {step}</li>
                      ))}
                    </ol>
                  </div>
                )}

                <Alert className="bg-amber-50 border-amber-100 rounded-2xl">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-[10px] text-amber-800 font-bold leading-relaxed">
                    RE-TRAINING: If this keeps coming up, prescribe 5 mins/day of specific lymphatic movement.
                  </AlertDescription>
                </Alert>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assessment Notes</label>
              <Textarea 
                value={notes || ""} 
                onChange={(e) => setNotes(e.target.value)}
                onBlur={handleNotesBlur}
                placeholder="Document specific findings, tenderness levels, or client feedback..."
                className="rounded-2xl border-slate-200 focus:ring-blue-500 min-h-[120px] text-sm font-medium bg-slate-50/30"
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default LymphaticAssessment;