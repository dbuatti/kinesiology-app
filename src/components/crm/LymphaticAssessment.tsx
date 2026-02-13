import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Textarea } from "@/components/ui/textarea";
import { Info, Timer, Play, Pause, RotateCcw, Droplets, ChevronDown } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface LymphaticAssessmentProps {
  appointmentId: string;
  initialSutureSide: string | null;
  initialPriorityZone: string | null;
  initialNotes: string | null;
  onSaveField: (field: string, value: string | null) => Promise<void>;
}

const LymphaticAssessment = ({
  appointmentId,
  initialSutureSide,
  initialPriorityZone,
  initialNotes,
  onSaveField
}: LymphaticAssessmentProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [sutureSide, setSutureSide] = useState<string | null>(initialSutureSide);
  const [priorityZone, setPriorityZone] = useState<string | null>(initialPriorityZone);
  const [notes, setNotes] = useState<string | null>(initialNotes);
  
  // Timer state
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
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const startTimer = (seconds: number) => {
    setTimeLeft(seconds);
    setIsActive(true);
  };

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(null);
  };

  const handleSutureSideChange = (value: string) => {
    // ToggleGroup with type="single" returns empty string if deselected
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

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full space-y-2"
    >
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
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Assessment & Counterstrain</p>
                </div>
              </div>
              <ChevronDown className={cn("h-5 w-5 text-slate-400 transition-transform duration-200", isOpen && "rotate-180")} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="p-6 pt-0 space-y-6">
            <Alert className="bg-blue-50 border-blue-100 text-blue-800 rounded-xl">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-xs font-black uppercase tracking-wider mb-1">5-Step Protocol</AlertTitle>
              <AlertDescription className="text-sm font-medium leading-relaxed">
                1. Palpate Suture → 2. Test IM → 3. TL Zone → 4. Counterstrain (45-90s) → 5. Re-assess
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Suture Side</label>
                <ToggleGroup 
                  type="single" 
                  value={sutureSide || ""} 
                  onValueChange={handleSutureSideChange}
                  className="justify-start gap-2"
                >
                  <ToggleGroupItem value="Left" className="rounded-xl px-4 py-2 h-10 font-bold data-[state=on]:bg-blue-600 data-[state=on]:text-white">Left</ToggleGroupItem>
                  <ToggleGroupItem value="Right" className="rounded-xl px-4 py-2 h-10 font-bold data-[state=on]:bg-blue-600 data-[state=on]:text-white">Right</ToggleGroupItem>
                  <ToggleGroupItem value="None" className="rounded-xl px-4 py-2 h-10 font-bold data-[state=on]:bg-blue-600 data-[state=on]:text-white">None</ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Priority Zone</label>
                <ToggleGroup 
                  type="single" 
                  value={priorityZone || ""} 
                  onValueChange={handlePriorityZoneChange}
                  className="flex flex-wrap justify-start gap-2"
                >
                  {['Cervical', 'Thoracic', 'Cisterna Chyli', 'Inguinal', 'Popliteal'].map(zone => (
                    <ToggleGroupItem 
                      key={zone} 
                      value={zone} 
                      className="rounded-xl px-3 py-2 h-10 text-xs font-bold data-[state=on]:bg-blue-600 data-[state=on]:text-white"
                    >
                      {zone}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer size={18} className="text-blue-600" />
                  <span className="text-sm font-black text-slate-700 uppercase tracking-wider">Counterstrain Timer</span>
                </div>
                {timeLeft !== null && (
                  <div className="text-2xl font-black text-blue-600 tabular-nums">
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => startTimer(45)}
                  className="rounded-xl font-bold border-slate-200 hover:bg-blue-50 hover:text-blue-600"
                >
                  45s
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => startTimer(90)}
                  className="rounded-xl font-bold border-slate-200 hover:bg-blue-50 hover:text-blue-600"
                >
                  90s
                </Button>
                {timeLeft !== null && (
                  <>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={toggleTimer}
                      className="rounded-xl font-bold text-slate-600"
                    >
                      {isActive ? <Pause size={16} /> : <Play size={16} />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={resetTimer}
                      className="rounded-xl font-bold text-slate-600"
                    >
                      <RotateCcw size={16} />
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Assessment Notes</label>
              <Textarea 
                value={notes || ""} 
                onChange={(e) => setNotes(e.target.value)}
                onBlur={handleNotesBlur}
                placeholder="Specific observations, tenderness, or findings..."
                className="rounded-2xl border-slate-200 focus:ring-blue-500 min-h-[100px] text-sm font-medium"
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default LymphaticAssessment;
