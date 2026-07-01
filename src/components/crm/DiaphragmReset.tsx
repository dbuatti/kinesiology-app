
import { useState, useEffect, useRef } from "react";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronDown, Wind, Info, ListChecks, RotateCcw, Loader2, Timer, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import EditableField from "@/components/shared/EditableField";

interface DiaphragmResetProps {
  appointmentId: string;
  initialNotes: string | null | undefined;
  onSaveField: (field: string, value: string | null) => Promise<void>;
  onUpdate: () => void;
}

const DiaphragmReset = ({ 
  appointmentId, 
  initialNotes, 
  onSaveField,
  onUpdate
}: DiaphragmResetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Timer State
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && timeLeft !== null && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, timeLeft]);

  const startTimer = (seconds: number) => {
    setTimeLeft(seconds);
    setIsActive(true);
  };

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => { setIsActive(false); setTimeLeft(null); };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const executeReset = async () => {
    setShowResetConfirm(false);
    setLoading(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ diaphragm_reset_notes: null })
        .eq("id", appointmentId);

      if (error) throw error;
      showSuccess("Diaphragm Reset notes reset successfully.");
      onUpdate();
    } catch (error: any) {
      showError(error.message || "Failed to reset notes.");
    } finally {
      setLoading(false);
    }
  };

  const hasNotes = !!initialNotes;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-none shadow-sm rounded-2xl bg-card overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardHeader className="bg-muted/50 border-b border-border cursor-pointer hover:bg-muted transition-colors">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Wind size={20} className="text-chart-emerald" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">Manual Reset of the Diaphragm</CardTitle>
                  <CardDescription className="text-muted-foreground">Phrenic Nerve integration</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {hasNotes && (
                  <Button 
                    variant="outline" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowResetConfirm(true);
                    }}
                    disabled={loading}
                    className="border-border text-muted-foreground hover:bg-muted h-8 px-3"
                  >
                    <RotateCcw size={16} className="mr-1" />
                    Reset
                  </Button>
                )}
                {hasNotes ? (
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    Notes Recorded
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground/50">Not yet recorded</span>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ChevronDown className={cn("h-5 w-5 transition-transform text-muted-foreground", isOpen && "rotate-180")} />
                </Button>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="p-6 space-y-8">
            <Alert className="bg-muted border-border">
              <Info className="h-4 w-4 text-muted-foreground" />
              <AlertDescription className="text-sm text-foreground">
                <strong>Purpose:</strong> The Phrenic Nerve is the sole motor innervation to the diaphragm. This reset aims to clear neurological interference and restore optimal breathing mechanics.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <ListChecks size={16} className="text-muted-foreground" />
                    Protocol Steps:
                  </h4>
                  <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside ml-4">
                    <li className="font-semibold">Challenge Tender Points either side of sternum and test IM.</li>
                    <li>If indicated, palpate tender point each side. One side will be more tender.</li>
                    <li>Palpate the muscle in the neck at C4 level (usually opposite to the sternum tender point).</li>
                    <li>Treatment: Move the ribcage up towards the neck and hold for 45-90 secs. Release very slowly.</li>
                  </ol>
                </div>
              </div>

              <div className="space-y-6">
                {/* Timer Section */}
                <div className="p-6 bg-card border border-border rounded-2xl space-y-6 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                        <Timer size={20} />
                      </div>
                      <div>
                        <span className="text-xs font-medium text-muted-foreground/70">Hold Timer</span>
                        <p className="text-xs text-muted-foreground">45-90s duration</p>
                      </div>
                    </div>
                    {timeLeft !== null && (
                      <div className="text-5xl font-semibold text-foreground tabular-nums tracking-tighter">
                        {formatTime(timeLeft)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => startTimer(45)} className="rounded-xl text-xs font-medium text-muted-foreground h-10 px-6">45s</Button>
                    <Button variant="outline" onClick={() => startTimer(90)} className="rounded-xl text-xs font-medium text-muted-foreground h-10 px-6">90s</Button>
                    {timeLeft !== null && (
                      <div className="flex gap-2 ml-auto">
                        <Button variant="ghost" size="icon" onClick={toggleTimer} className="rounded-xl h-10 w-10 text-muted-foreground hover:bg-muted">{isActive ? <Pause size={20} /> : <Play size={20} />}</Button>
                        <Button variant="ghost" size="icon" onClick={resetTimer} className="rounded-xl h-10 w-10 text-muted-foreground hover:bg-muted"><RotateCcw size={20} /></Button>
                      </div>
                    )}
                  </div>
                </div>

                <EditableField
                  field="diaphragm_reset_notes"
                  label="Diaphragm Reset Notes"
                  value={initialNotes}
                  multiline
                  placeholder="Document tender points, side of restriction, and client's breathing response..."
                  onSave={onSaveField}
                />
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>

      <ConfirmDialog
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        title="Reset Diaphragm Reset notes?"
        description="This will clear all diaphragm reset notes for this session."
        confirmLabel="Reset"
        onConfirm={executeReset}
      />
    </Collapsible>
  );
};

export default DiaphragmReset;