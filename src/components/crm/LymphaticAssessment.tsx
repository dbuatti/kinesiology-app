
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
  Thermometer, BookOpen, ClipboardCheck, Sparkles, X, ChevronRight
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
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <Card className="border-none shadow-sm rounded-xl bg-card overflow-hidden">
        <CollapsibleTrigger asChild>
          <div className={cn(
            "p-4 flex items-center justify-between cursor-pointer transition-all duration-300",
            isOpen ? "bg-muted/50" : "hover:bg-muted/30",
            !isOpen && priorityZones.length > 0 && "bg-chart-primary/10"
          )}>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center">
                <Droplets size={18} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground tracking-tight">Lymphatic System</h3>
                <p className="text-sm text-muted-foreground">Drainage Precedes Supply</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isVerified ? (
                <span className="text-xs font-medium text-muted-foreground">Verified</span>
              ) : priorityZones.length > 0 ? (
                <span className="text-xs font-medium text-muted-foreground">{priorityZones.length} zones</span>
              ) : (
                <span className="text-xs text-muted-foreground/50 font-medium">Not yet recorded</span>
              )}
              <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground">
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", isOpen && "rotate-180")} />
              </div>
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="p-8 pt-0 space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-8">
                {/* Step 1 & 2: Suture and Zone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Search size={14} className="text-chart-primary" /> 1. Suture Side (Hologram)
                    </label>
                    <ToggleGroup type="single" value={sutureSide || ""} onValueChange={handleSutureSideChange} className="justify-start gap-3">
                      <ToggleGroupItem value="Left" className="rounded-xl px-8 py-3 h-12 font-medium text-xs uppercase tracking-wider data-[state=on]:bg-primary data-[state=on]:text-primary-foreground border-2 border-border">Left</ToggleGroupItem>
                      <ToggleGroupItem value="Right" className="rounded-xl px-8 py-3 h-12 font-medium text-xs uppercase tracking-wider data-[state=on]:bg-primary data-[state=on]:text-primary-foreground border-2 border-border">Right</ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Zap size={14} className="text-amber-500" /> 2. Priority Node Zones
                    </label>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground/50 uppercase mb-2">Primary (Drainage First)</p>
                        <div className="flex flex-wrap gap-2">
                          {primaryZones.map(zone => (
                            <Button 
                              key={zone}
                              variant={priorityZones.includes(zone) ? "default" : "outline"}
                              onClick={() => togglePriorityZone(zone)}
                              className={cn(
                                "rounded-xl px-3 py-1 h-8 text-[10px] font-medium uppercase tracking-wider transition-all",
                                priorityZones.includes(zone) ? "bg-primary text-primary-foreground shadow-sm" : "border-border hover:bg-muted text-muted-foreground"
                              )}
                            >
                              {zone}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground/50 uppercase mb-2">Secondary</p>
                        <div className="flex flex-wrap gap-2">
                          {secondaryZones.map(zone => (
                            <Button 
                              key={zone}
                              variant={priorityZones.includes(zone) ? "default" : "outline"}
                              onClick={() => togglePriorityZone(zone)}
                              className={cn(
                                "rounded-xl px-3 py-1 h-8 text-[10px] font-medium uppercase tracking-wider transition-all",
                                priorityZones.includes(zone) ? "bg-primary text-primary-foreground shadow-sm" : "border-border hover:bg-muted text-muted-foreground"
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
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mr-2">Focus Instruction:</span>
                      {priorityZones.map(zone => (
                        <Badge 
                          key={zone}
                          onClick={() => setFocusedZone(zone)}
                          className={cn(
                            "cursor-pointer transition-all px-3 py-1 border-none font-medium text-[10px] uppercase tracking-wider",
                            focusedZone === zone ? "bg-primary text-primary-foreground shadow-sm scale-105" : "bg-muted text-muted-foreground hover:bg-accent"
                          )}
                        >
                          {zone}
                        </Badge>
                      ))}
                    </div>

                    {/* Tenderness Tracker */}
                    <div className="p-6 bg-chart-primary/10 rounded-[2rem] border-2 border-chart-primary/20 space-y-6">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          <Thermometer size={14} /> 3. Tenderness Reduction (Counterstrain)
                        </label>
                        <Badge className={cn(
                          "font-medium text-[10px] uppercase tracking-wider px-3 py-1",
                          tenderness[0] <= 3 ? "bg-chart-emerald/10 text-chart-emerald" : "bg-muted text-muted-foreground"
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
                          className="[&>span:first-child]:h-2 [&>span:first-child]:bg-primary/20 dark:[&>span:first-child]:bg-primary/80 [&_[role=slider]]:h-6 [&_[role=slider]]:w-6 [&_[role=slider]]:border-4 [&_[role=slider]]:border-background [&_[role=slider]]:bg-primary [&_[role=slider]]:shadow-sm"
                        />
                        <div className="flex justify-between mt-4 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                          <span>Position of Ease (0)</span>
                          <span>Initial Pain (10)</span>
                        </div>
                      </div>
                    </div>

                    {focusedZone && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
                        <div className="p-8 bg-chart-primary/10 rounded-xl border-2 border-chart-primary/20 space-y-6 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none"><Move size={120} /></div>
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                              <Move size={24} />
                            </div>
                            <div>
                              <p className="text-[10px] font-medium text-chart-primary uppercase tracking-wider">Release Position</p>
                              <h4 className="text-xl font-semibold text-foreground">{focusedZone}</h4>
                            </div>
                          </div>
                          <p className="text-sm font-medium text-foreground leading-relaxed bg-card/40 p-4 rounded-xl border border-chart-primary/20">
                            {RELEASE_INSTRUCTIONS[focusedZone].position}
                          </p>
                          {RELEASE_INSTRUCTIONS[focusedZone].pearl && (
                            <div className="flex items-start gap-3 p-4 bg-primary text-primary-foreground rounded-xl shadow-sm">
                              <Brain size={20} className="shrink-0 mt-0.5" />
                              <div>
                                <p className="text-[10px] font-medium uppercase tracking-wider opacity-70 mb-1">Clinical Pearl</p>
                                <p className="text-xs font-medium leading-relaxed">
                                  {RELEASE_INSTRUCTIONS[focusedZone].pearl}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {RELEASE_INSTRUCTIONS[focusedZone].image && (
                          <div className="bg-card rounded-xl border-2 border-chart-primary/20 p-4 overflow-hidden flex flex-col shadow-sm">
                            <div className="flex items-center gap-2 px-4 py-2 border-b border-border mb-4">
                              <ImageIcon size={16} className="text-chart-primary" />
                              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Visual Reference</span>
                            </div>
                            <div className="flex-1 flex items-center justify-center p-4 bg-muted rounded-3xl">
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
                <div className="p-8 bg-card border border-border rounded-xl space-y-6 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Timer size={150} /></div>
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-chart-primary/20 flex items-center justify-center text-chart-primary border border-chart-primary/30">
                        <Timer size={24} />
                      </div>
                      <div>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Counterstrain Timer</span>
                        <p className="text-xs font-medium text-muted-foreground">Hold position for 45-90 seconds</p>
                      </div>
                    </div>
                    {timeLeft !== null && (
                      <div className="text-6xl font-semibold text-chart-primary tabular-nums tracking-tighter">
                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 relative z-10">
                    <Button variant="outline" onClick={() => startTimer(45)} className="rounded-xl font-medium text-xs uppercase tracking-wider border-border bg-muted text-muted-foreground hover:bg-muted/80 h-12 px-8">45s</Button>
                    <Button variant="outline" onClick={() => startTimer(90)} className="rounded-xl font-medium text-xs uppercase tracking-wider border-border bg-muted text-muted-foreground hover:bg-muted/80 h-12 px-8">90s</Button>
                    {timeLeft !== null && (
                      <div className="flex gap-2 ml-auto">
                        <Button variant="ghost" size="icon" onClick={toggleTimer} className="rounded-xl h-12 w-12 text-muted-foreground hover:bg-muted/80">{isActive ? <Pause size={24} /> : <Play size={24} />}</Button>
                        <Button variant="ghost" size="icon" onClick={resetTimer} className="rounded-xl h-12 w-12 text-muted-foreground hover:bg-muted/80"><RotateCcw size={24} /></Button>
                      </div>
                    )}
                  </div>
                </div>

                {priorityZones.length > 0 && (
                  <div className="p-6 bg-chart-emerald/10 rounded-[2rem] border-2 border-chart-emerald/20 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-chart-emerald/20 flex items-center justify-center text-chart-emerald">
                        <RefreshCw size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-chart-emerald uppercase tracking-wider">Verification</p>
                        <span className="text-sm font-medium text-foreground">Re-test suture glide & tenderness</span>
                      </div>
                    </div>
                    <Button 
                      variant={isVerified ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsVerified(!isVerified)}
                      className={cn("rounded-xl h-10 px-6 font-medium text-[10px] uppercase tracking-wider transition-all", isVerified ? "bg-chart-emerald shadow-sm" : "border-chart-emerald/20 text-chart-emerald hover:bg-chart-emerald/10")}
                    >
                      {isVerified ? <CheckCircle2 size={16} className="mr-2" /> : null}
                      {isVerified ? "Verified" : "Mark Verified"}
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-8">
                <Card className="border-none shadow-inner bg-muted/50 rounded-[2rem] overflow-hidden">
                  <CardHeader className="pb-4 p-6">
                    <CardTitle className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <HelpCircle size={16} className="text-chart-primary" /> Priority Check
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 space-y-6">
                    <div className="p-5 bg-card rounded-xl border border-border shadow-sm">
                      <p className="text-sm font-medium text-foreground leading-relaxed">
                        Touch <span className="text-chart-primary font-semibold">Kidney 27</span> points while client touches the node.
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-3 font-medium italic">If the indicator muscle locks, you've found the priority.</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setShowGuide(!showGuide)} className="w-full h-10 rounded-xl text-[10px] font-medium uppercase tracking-wider text-chart-primary hover:bg-muted border border-chart-primary/20">
                      {showGuide ? "Hide Protocol" : "View Full Protocol"}
                    </Button>
                  </CardContent>
                </Card>

                {showGuide && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500 p-2">
                    <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Step-by-Step</h4>
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
                          <span className="w-5 h-5 rounded-full bg-chart-primary/20 text-chart-primary flex items-center justify-center text-[10px] font-medium shrink-0">{i + 1}</span>
                          <p className="text-xs font-medium text-muted-foreground leading-tight">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-6 bg-amber-500/10 rounded-[2rem] border-2 border-amber-500/20 space-y-4">
                  <div className="flex items-center gap-3">
                    <Sparkles size={20} className="text-amber-600 dark:text-amber-400" />
                    <p className="text-[10px] font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">Re-Training</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">Prescribe Homework?</span>
                    <Button 
                      variant={prescribeHomework ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPrescribeHomework(!prescribeHomework)}
                      className={cn("rounded-xl h-8 px-4 font-medium text-[10px] uppercase tracking-wider", prescribeHomework ? "bg-amber-600" : "border-amber-500/20 text-amber-600 dark:text-amber-400")}
                    >
                      {prescribeHomework ? "Yes" : "No"}
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium leading-relaxed italic">
                    If this keeps coming up, prescribe 5 mins/day of specific lymphatic movement.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-8 border-t border-border">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Assessment Notes</label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleAutoPopulate}
                  className="h-8 rounded-xl text-[10px] font-medium uppercase tracking-wider text-chart-primary hover:bg-muted"
                >
                  <ClipboardCheck size={14} className="mr-2" /> Auto-Populate Summary
                </Button>
              </div>
              <Textarea
                value={notes || ""}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => onSaveField('lymphatic_notes', notes)}
                placeholder="Document specific findings, tenderness levels, or client feedback..."
                className="rounded-xl border-border focus:ring-chart-primary min-h-[150px] p-8 text-base font-medium bg-muted/30 shadow-inner"
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default LymphaticAssessment;