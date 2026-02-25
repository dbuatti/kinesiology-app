"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Textarea } from "@/components/ui/textarea";
import { 
  Info, Timer, Play, Pause, RotateCcw, 
  Droplets, ChevronDown, Zap, Search, 
  AlertCircle, HelpCircle, Brain, Move,
  CheckCircle2, ShieldCheck, RefreshCw, Image as ImageIcon,
  Thermometer, BookOpen, ClipboardCheck, Sparkles, X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";

interface LymphaticAssessmentProps {
  appointmentId: string;
  initialSutureSide: string | null;
  initialPriorityZone: string | null;
  initialNotes: string | null;
  onSaveField: (field: string, value: string | null) => Promise<void>;
}

const RELEASE_INSTRUCTIONS: Record<string, { position: string; pearl?: string; image?: string; category: 'Primary' | 'Secondary' }> = {
  'Cervical': { 
    category: 'Primary',
    position: "C4 level, slightly anterior. Feel for nodule. Move tissue towards spine or slightly up to find 'Position of Ease'.",
    pearl: "The 'Brain Drain' — essential for clearing neural inflammation and brain fog.",
    image: "/images/lymphatic/cervical.png"
  },
  'Thoracic (L)': { 
    category: 'Primary',
    position: "Shorten the Pec Minor. Bring the left arm into a position of ease (usually across the chest or slightly elevated) to soften the duct.",
    pearl: "The Left Thoracic Duct drains the entire left side of the body and the brain.",
    image: "/images/lymphatic/thoracic-l.png"
  },
  'Thoracic (R)': { 
    category: 'Primary',
    position: "Shorten the Pec Minor. Bring the right arm into a position of ease to soften the duct.",
    pearl: "Drains the right upper quadrant of the body.",
    image: "/images/lymphatic/thoracic-r.png"
  },
  'Cisterna Chyli': { 
    category: 'Primary',
    position: "Central abdominal release. Shorten the abdominals by bending the client's knees or gently moving tissue up towards the head.",
    pearl: "The central reservoir for all lymph from the lower body. Often pulses strongly.",
    image: "/images/lymphatic/cisterna-chyli.png"
  },
  'Inguinal': { 
    category: 'Secondary',
    position: "Find the ASIS (pelvic bone). Hold the position next to the bone where you feel the tissue soften.",
    pearl: "Key for lower extremity drainage and pelvic congestion.",
    image: "/images/lymphatic/inguinal.png"
  },
  'Popliteal': { 
    category: 'Secondary',
    position: "Shorten the muscle (top of calves or bottom of hamstrings). Wait for the tissue to soften.",
    pearl: "Releasing popliteal tension often resolves long-term chronic headaches.",
    image: "/images/lymphatic/popliteal.png"
  },
  'Maxillary': { 
    category: 'Secondary',
    position: "Gentle traction along the jawline and facial nodes to find the position of maximum softening.",
    pearl: "Often improves once the Cervical and Thoracic ducts are cleared.",
    image: "/images/lymphatic/maxillary.png"
  },
  'Axillary': { 
    category: 'Secondary',
    position: "Shorten the shoulder girdle. Usually self-corrects once Thoracic ducts are opened.",
    pearl: "Secondary to Thoracic duct clearance.",
    image: "/images/lymphatic/axillary.png"
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
  
  // Support multiple zones
  const [priorityZones, setPriorityZones] = useState<string[]>(
    initialPriorityZone ? initialPriorityZone.split(',').map(s => s.trim()).filter(Boolean) : []
  );
  
  // Track which zone is currently being viewed/focused for instructions
  const [focusedZone, setFocusedZone] = useState<string | null>(
    priorityZones.length > 0 ? priorityZones[0] : null
  );

  const [notes, setNotes] = useState<string | null>(initialNotes);
  const [tenderness, setTenderness] = useState([10]); // 0-10 scale
  const [prescribeHomework, setPrescribeHomework] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  
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

  const togglePriorityZone = (zone: string) => {
    setPriorityZones(prev => {
      const newZones = prev.includes(zone) 
        ? prev.filter(z => z !== zone)
        : [...prev, zone];
      
      // Update focused zone if needed
      if (newZones.length > 0 && (!focusedZone || !newZones.includes(focusedZone))) {
        setFocusedZone(newZones[newZones.length - 1]);
      } else if (newZones.length === 0) {
        setFocusedZone(null);
      }

      // Save to DB as comma-separated string
      onSaveField('lymphatic_priority_zone', newZones.length > 0 ? newZones.join(', ') : null);
      return newZones;
    });
    setTenderness([10]); // Reset tenderness when toggling
  };

  const handleAutoPopulate = async () => {
    if (priorityZones.length === 0) return;
    
    const reduction = 100 - (tenderness[0] * 10);
    const summaryHeader = `LYMPHATIC ASSESSMENT:`;
    
    if (notes?.includes(summaryHeader)) {
      if (!confirm("A lymphatic summary already exists in your notes. Append another one?")) return;
    }

    let summary = `${summaryHeader}\n- Suture Side: ${sutureSide || 'Not set'}\n- Priority Zones: ${priorityZones.join(', ')}\n- Tenderness Reduction: ${reduction}% (Level ${tenderness[0]}/10)`;
    
    if (prescribeHomework) {
      summary += `\n- HOMEWORK: Prescribed 5 mins/day of lymphatic movement for: ${priorityZones.join(', ')}.`;
    }
    
    const currentNotes = notes ? `${notes}\n\n${summary}` : summary;
    setNotes(currentNotes);
    await onSaveField('lymphatic_notes', currentNotes);
  };

  const zones = Object.keys(RELEASE_INSTRUCTIONS);
  const primaryZones = zones.filter(z => RELEASE_INSTRUCTIONS[z].category === 'Primary');
  const secondaryZones = zones.filter(z => RELEASE_INSTRUCTIONS[z].category === 'Secondary');

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full space-y-2">
      <Card className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardHeader className="p-8 cursor-pointer hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-100">
                  <Droplets size={28} />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Lymphatic System</CardTitle>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Drainage Precedes Supply</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isVerified && (
                  <Badge className="bg-emerald-500 text-white border-none font-black text-[10px] uppercase tracking-widest px-3 py-1">
                    Verified
                  </Badge>
                )}
                {priorityZones.length > 0 && !isVerified && (
                  <Badge className="bg-blue-600 text-white border-none font-black text-[10px] uppercase tracking-widest px-3 py-1">
                    {priorityZones.length} Zones Selected
                  </Badge>
                )}
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <ChevronDown className={cn("h-6 w-6 transition-transform duration-300", isOpen && "rotate-180")} />
                </div>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="p-8 pt-0 space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-8">
                {/* Step 1 & 2: Suture and Zone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                      <Search size={14} className="text-blue-500" /> 1. Suture Side (Hologram)
                    </label>
                    <ToggleGroup type="single" value={sutureSide || ""} onValueChange={handleSutureSideChange} className="justify-start gap-3">
                      <ToggleGroupItem value="Left" className="rounded-2xl px-8 py-3 h-12 font-black text-xs uppercase tracking-widest data-[state=on]:bg-blue-600 data-[state=on]:text-white border-2 border-slate-100">Left</ToggleGroupItem>
                      <ToggleGroupItem value="Right" className="rounded-2xl px-8 py-3 h-12 font-black text-xs uppercase tracking-widest data-[state=on]:bg-blue-600 data-[state=on]:text-white border-2 border-slate-100">Right</ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                      <Zap size={14} className="text-amber-500" /> 2. Priority Node Zones
                    </label>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[9px] font-black text-slate-300 uppercase mb-2">Primary (Drainage First)</p>
                        <div className="flex flex-wrap gap-2">
                          {primaryZones.map(zone => (
                            <Button 
                              key={zone}
                              variant={priorityZones.includes(zone) ? "default" : "outline"}
                              onClick={() => togglePriorityZone(zone)}
                              className={cn(
                                "rounded-xl px-3 py-1 h-8 text-[10px] font-black uppercase tracking-wider transition-all",
                                priorityZones.includes(zone) ? "bg-blue-600 text-white shadow-lg" : "border-slate-100 hover:bg-blue-50 text-slate-500"
                              )}
                            >
                              {zone}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-300 uppercase mb-2">Secondary</p>
                        <div className="flex flex-wrap gap-2">
                          {secondaryZones.map(zone => (
                            <Button 
                              key={zone}
                              variant={priorityZones.includes(zone) ? "default" : "outline"}
                              onClick={() => togglePriorityZone(zone)}
                              className={cn(
                                "rounded-xl px-3 py-1 h-8 text-[10px] font-black uppercase tracking-wider transition-all",
                                priorityZones.includes(zone) ? "bg-blue-600 text-white shadow-lg" : "border-slate-100 hover:bg-blue-50 text-slate-500"
                              )}
                            >
                              {zone}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {priorityZones.length > 0 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    {/* Zone Focus Switcher */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-2">Focus Instruction:</span>
                      {priorityZones.map(zone => (
                        <Badge 
                          key={zone}
                          onClick={() => setFocusedZone(zone)}
                          className={cn(
                            "cursor-pointer transition-all px-3 py-1 border-none font-black text-[9px] uppercase tracking-widest",
                            focusedZone === zone ? "bg-indigo-600 text-white shadow-md scale-105" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          )}
                        >
                          {zone}
                        </Badge>
                      ))}
                    </div>

                    {/* Tenderness Tracker */}
                    <div className="p-6 bg-indigo-50 rounded-[2rem] border-2 border-indigo-100 space-y-6">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] flex items-center gap-2">
                          <Thermometer size={14} /> 3. Tenderness Reduction (Counterstrain)
                        </label>
                        <Badge className={cn(
                          "font-black text-[10px] uppercase tracking-widest px-3 py-1",
                          tenderness[0] <= 3 ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                        )}>
                          {100 - (tenderness[0] * 10)}% Reduction
                        </Badge>
                      </div>
                      
                      <div className="px-4 py-2">
                        <Slider 
                          value={tenderness} 
                          onValueChange={setTenderness} 
                          min={0}
                          max={10} 
                          step={1} 
                          className="[&>span:first-child]:h-2 [&>span:first-child]:bg-indigo-200 [&_[role=slider]]:h-6 [&_[role=slider]]:w-6 [&_[role=slider]]:border-4 [&_[role=slider]]:border-white [&_[role=slider]]:bg-indigo-600 [&_[role=slider]]:shadow-lg"
                        />
                        <div className="flex justify-between mt-4 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                          <span>Position of Ease (0)</span>
                          <span>Initial Pain (10)</span>
                        </div>
                      </div>
                    </div>

                    {focusedZone && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
                        <div className="p-8 bg-blue-50 rounded-[2.5rem] border-2 border-blue-100 space-y-6 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none"><Move size={120} /></div>
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xl">
                              <Move size={24} />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Release Position</p>
                              <h4 className="text-xl font-black text-blue-900">{focusedZone}</h4>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-blue-900 leading-relaxed bg-white/40 p-4 rounded-2xl border border-blue-100">
                            {RELEASE_INSTRUCTIONS[focusedZone].position}
                          </p>
                          {RELEASE_INSTRUCTIONS[focusedZone].pearl && (
                            <div className="flex items-start gap-3 p-4 bg-indigo-600 text-white rounded-2xl shadow-lg">
                              <Brain size={20} className="shrink-0 mt-0.5" />
                              <div>
                                <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">Clinical Pearl</p>
                                <p className="text-xs font-bold leading-relaxed">
                                  {RELEASE_INSTRUCTIONS[focusedZone].pearl}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {RELEASE_INSTRUCTIONS[focusedZone].image && (
                          <div className="bg-white rounded-[2.5rem] border-2 border-blue-100 p-4 overflow-hidden flex flex-col shadow-sm">
                            <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-50 mb-4">
                              <ImageIcon size={16} className="text-blue-500" />
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visual Reference</span>
                            </div>
                            <div className="flex-1 flex items-center justify-center p-4 bg-slate-50 rounded-3xl">
                              <img 
                                src={RELEASE_INSTRUCTIONS[focusedZone].image} 
                                alt={`${focusedZone} Release Position`}
                                className="max-w-full h-auto rounded-xl"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Timer Section */}
                <div className="p-8 bg-slate-950 text-white rounded-[2.5rem] border border-slate-800 space-y-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Timer size={150} /></div>
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30">
                        <Timer size={24} />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Counterstrain Timer</span>
                        <p className="text-xs font-bold text-slate-400">Hold position for 45-90 seconds</p>
                      </div>
                    </div>
                    {timeLeft !== null && (
                      <div className="text-6xl font-black text-blue-400 tabular-nums tracking-tighter">
                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 relative z-10">
                    <Button variant="outline" onClick={() => startTimer(45)} className="rounded-2xl font-black text-xs uppercase tracking-widest border-white/10 bg-white/5 hover:bg-white/10 text-white h-12 px-8">45s</Button>
                    <Button variant="outline" onClick={() => startTimer(90)} className="rounded-2xl font-black text-xs uppercase tracking-widest border-white/10 bg-white/5 hover:bg-white/10 text-white h-12 px-8">90s</Button>
                    {timeLeft !== null && (
                      <div className="flex gap-2 ml-auto">
                        <Button variant="ghost" size="icon" onClick={toggleTimer} className="rounded-2xl h-12 w-12 text-white hover:bg-white/10">{isActive ? <Pause size={24} /> : <Play size={24} />}</Button>
                        <Button variant="ghost" size="icon" onClick={resetTimer} className="rounded-2xl h-12 w-12 text-white hover:bg-white/10"><RotateCcw size={24} /></Button>
                      </div>
                    )}
                  </div>
                </div>

                {priorityZones.length > 0 && (
                  <div className="p-6 bg-emerald-50 rounded-[2rem] border-2 border-emerald-100 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <RefreshCw size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Verification</p>
                        <span className="text-sm font-bold text-emerald-900">Re-test suture glide & tenderness</span>
                      </div>
                    </div>
                    <Button 
                      variant={isVerified ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsVerified(!isVerified)}
                      className={cn("rounded-xl h-10 px-6 font-black text-[10px] uppercase tracking-widest transition-all", isVerified ? "bg-emerald-600 shadow-lg" : "border-emerald-200 text-emerald-600 hover:bg-emerald-100")}
                    >
                      {isVerified ? <CheckCircle2 size={16} className="mr-2" /> : null}
                      {isVerified ? "Verified" : "Mark Verified"}
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-8">
                <Card className="border-none shadow-inner bg-slate-50 rounded-[2rem] overflow-hidden">
                  <CardHeader className="pb-4 p-6">
                    <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                      <HelpCircle size={16} className="text-blue-500" /> Priority Check
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 space-y-6">
                    <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <p className="text-sm font-bold text-slate-700 leading-relaxed">
                        Touch <span className="text-blue-600 font-black">Kidney 27</span> points while client touches the node.
                      </p>
                      <p className="text-[10px] text-slate-500 mt-3 font-medium italic">If the indicator muscle locks, you've found the priority.</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setShowGuide(!showGuide)} className="w-full h-10 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 border border-blue-100">
                      {showGuide ? "Hide Protocol" : "View Full Protocol"}
                    </Button>
                  </CardContent>
                </Card>

                {showGuide && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500 p-2">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Step-by-Step</h4>
                    <div className="space-y-3">
                      {[
                        "Palpate suture (glide/tenderness)",
                        "Client holds tender point",
                        "Test IM (should inhibit)",
                        "Work neck down to find priority",
                        "Confirm with K27 priority check",
                        "Ask permission to correct",
                        "Correct only the priority point",
                        "Re-test suture for restored glide"
                      ].map((step, i) => (
                        <div key={i} className="flex gap-4 items-start">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-black shrink-0">{i + 1}</span>
                          <p className="text-xs font-bold text-slate-600 leading-tight">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-6 bg-amber-50 rounded-[2rem] border-2 border-amber-100 space-y-4">
                  <div className="flex items-center gap-3">
                    <Sparkles size={20} className="text-amber-600" />
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Re-Training</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900">Prescribe Homework?</span>
                    <Button 
                      variant={prescribeHomework ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPrescribeHomework(!prescribeHomework)}
                      className={cn("rounded-xl h-8 px-4 font-black text-[10px] uppercase tracking-widest", prescribeHomework ? "bg-amber-600" : "border-amber-200 text-amber-600")}
                    >
                      {prescribeHomework ? "Yes" : "No"}
                    </Button>
                  </div>
                  <p className="text-[10px] text-amber-800 font-medium leading-relaxed italic">
                    If this keeps coming up, prescribe 5 mins/day of specific lymphatic movement.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-8 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Assessment Notes</label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleAutoPopulate}
                  className="h-8 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50"
                >
                  <ClipboardCheck size={14} className="mr-2" /> Auto-Populate Summary
                </Button>
              </div>
              <Textarea 
                value={notes || ""} 
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => onSaveField('lymphatic_notes', notes)}
                placeholder="Document specific findings, tenderness levels, or client feedback..."
                className="rounded-[2rem] border-slate-200 focus:ring-blue-500 min-h-[150px] p-8 text-base font-medium bg-slate-50/30 shadow-inner"
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default LymphaticAssessment;