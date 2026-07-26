
import { useState, useEffect } from "react";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronDown, Heart, Zap, List, Layers, Info, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import EditableField from "@/components/shared/EditableField";
import { CHANNEL_EMOTIONS, ELEMENT_EMOTIONS } from "@/data/emotion-data";
import { showSuccess, showError } from "@/utils/toast";

interface EmotionAssessmentProps {
  appointmentId: string;
  initialMode: string | null | undefined;
  initialPrimary: string | null | undefined;
  initialSecondary: string[] | null | undefined;
  initialNotes: string | null | undefined;
  onSaveField: (field: string, value: string | string[] | null) => Promise<void>;
  onUpdate: () => void;
}

const EmotionAssessment = ({ 
  initialMode, 
  initialPrimary, 
  initialSecondary, 
  initialNotes, 
  onSaveField,
  onUpdate
}: EmotionAssessmentProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<string>(initialMode || 'channel');
  const [primarySelection, setPrimarySelection] = useState<string>(initialPrimary || '');
  const [secondarySelections, setSecondarySelections] = useState<string[]>(initialSecondary || []);
  const [isSaving, setIsSaving] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    setMode(initialMode || 'channel');
    setPrimarySelection(initialPrimary || '');
    setSecondarySelections(initialSecondary || []);
  }, [initialMode, initialPrimary, initialSecondary]);

  const currentData = mode === 'channel' ? CHANNEL_EMOTIONS : ELEMENT_EMOTIONS;
  const primaryKeys = Object.keys(currentData);
  const secondaryOptions = primarySelection ? currentData[primarySelection] || [] : [];

  const handleSave = async (newMode: string, newPrimary: string, newSecondaries: string[]) => {
    setIsSaving(true);
    try {
      await Promise.all([
        onSaveField('emotion_mode', newMode),
        onSaveField('emotion_primary_selection', newPrimary || null),
        onSaveField('emotion_secondary_selection', newSecondaries.length > 0 ? newSecondaries : null),
      ]);
    } catch (error) {
      console.error("Failed to save emotion assessment:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleModeChange = (newMode: string) => {
    setMode(newMode);
    setPrimarySelection('');
    setSecondarySelections([]);
    handleSave(newMode, '', []);
  };

  const handlePrimarySelect = (selection: string) => {
    setPrimarySelection(selection);
    setSecondarySelections([]);
    handleSave(mode, selection, []);
  };

  const handleSecondaryToggle = (emotion: string) => {
    const newSelections = secondarySelections.includes(emotion)
      ? secondarySelections.filter(s => s !== emotion)
      : [...secondarySelections, emotion];
      
    setSecondarySelections(newSelections);
    handleSave(mode, primarySelection, newSelections);
  };

  const executeReset = async () => {
    setShowResetConfirm(false);
    setIsSaving(true);
    try {
      await Promise.all([
        onSaveField('emotion_mode', null),
        onSaveField('emotion_primary_selection', null),
        onSaveField('emotion_secondary_selection', null),
        onSaveField('emotion_notes', null),
      ]);
      
      setMode('channel');
      setPrimarySelection('');
      setSecondarySelections([]);
      
      showSuccess("Emotional assessment reset successfully.");
      onUpdate();
    } catch (error: any) {
      showError(error.message || "Failed to reset emotional assessment.");
    } finally {
      setIsSaving(false);
    }
  };

  const getPrimaryColor = (key: string) => {
    if (mode === 'element') {
      switch (key) {
        case 'FIRE': return 'bg-destructive hover:bg-destructive/80';
        case 'EARTH': return 'bg-yellow-500 hover:bg-yellow-600';
        case 'METAL': return 'bg-muted-foreground hover:bg-muted-foreground/80';
        case 'WATER': return 'bg-primary hover:bg-primary';
        case 'WOOD': return 'bg-chart-emerald hover:bg-chart-emerald/80';
        default: return 'bg-muted-foreground hover:bg-muted-foreground/80';
      }
    }
    return 'bg-indigo-500 hover:bg-indigo-600';
  };

  const isComplete = secondarySelections.length > 0;
  const shouldShowReset = initialMode || initialPrimary || (initialSecondary && initialSecondary.length > 0) || initialNotes;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-none shadow-lg rounded-2xl bg-card overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b border-destructive/20 cursor-pointer hover:from-red-100 hover:to-pink-100 transition-colors">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-destructive rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
                  <Heart size={24} className="text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-foreground">Emotional Assessment (PS12)</CardTitle>
                  <CardDescription className="text-muted-foreground">Identify and balance core emotional context</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {shouldShowReset && (
                  <Button 
                    variant="outline" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowResetConfirm(true);
                    }}
                    disabled={isSaving}
                    className="border-destructive/20 text-destructive hover:bg-destructive/5 h-8 px-3"
                  >
                    <RotateCcw size={16} className="mr-1" />
                    Reset
                  </Button>
                )}
                {isComplete && (
                  <Badge className="px-4 py-2 text-sm font-bold shadow-sm bg-emerald-500 text-primary-foreground hover:bg-emerald-600">
                    Balanced
                  </Badge>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ChevronDown className={cn("h-5 w-5 transition-transform text-muted-foreground", isOpen && "rotate-180")} />
                </Button>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="p-6 space-y-6">
            <Alert className="bg-primary/5 border-primary/20">
              <Info className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm text-foreground/80">
                <strong>Protocol:</strong> Use PS12 mode to challenge the body for the relevant mode, primary selection, and secondary selection.
              </AlertDescription>
            </Alert>

            <div className="space-y-3 p-4 border border-border rounded-xl bg-muted/50">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Layers size={16} className="text-destructive" /> 1. Select Assessment Mode
              </h3>
              <div className="flex gap-3">
                <Button
                  variant={mode === 'channel' ? 'default' : 'outline'}
                  onClick={() => handleModeChange('channel')}
                  className={cn("flex-1 h-10", mode === 'channel' ? "bg-destructive hover:bg-destructive" : "border-border hover:bg-card")}
                  disabled={isSaving}
                >
                  By Channel
                </Button>
                <Button
                  variant={mode === 'element' ? 'default' : 'outline'}
                  onClick={() => handleModeChange('element')}
                  className={cn("flex-1 h-10", mode === 'element' ? "bg-destructive hover:bg-destructive" : "border-border hover:bg-card")}
                  disabled={isSaving}
                >
                  By 5 Element
                </Button>
              </div>
            </div>

            <div className="space-y-3 p-4 border border-border rounded-xl bg-card">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <List size={16} className="text-indigo-600" /> 2. Select {mode === 'channel' ? 'Channel/Meridian' : 'Element'}
              </h3>
              <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-2 border border-border/50 rounded-lg">
                {primaryKeys.map((key) => (
                  <Button
                    key={key}
                    variant={primarySelection === key ? 'default' : 'outline'}
                    onClick={() => handlePrimarySelect(key)}
                    className={cn(
                      "h-8 text-xs font-semibold",
                      primarySelection === key 
                        ? getPrimaryColor(key) + " text-primary-foreground" 
                        : "border-border bg-muted/50 hover:bg-muted text-foreground/80"
                    )}
                    disabled={isSaving}
                  >
                    {key}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3 p-4 border border-border rounded-xl bg-muted/50">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Zap size={16} className="text-emerald-600" /> 3. Select Specific Emotion/Feeling
              </h3>
              {primarySelection ? (
                <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-2 border border-border/50 rounded-lg bg-card">
                  {secondaryOptions.map((emotion) => (
                    <Button
                      key={emotion}
                      variant={secondarySelections.includes(emotion) ? 'default' : 'outline'}
                      onClick={() => handleSecondaryToggle(emotion)}
                      className={cn(
                        "h-8 text-xs font-semibold",
                        secondarySelections.includes(emotion)
                          ? "bg-chart-emerald hover:bg-chart-emerald/80 text-primary-foreground" 
                          : "border-border bg-muted/50 hover:bg-muted text-foreground/80"
                      )}
                      disabled={isSaving}
                    >
                      {emotion}
                    </Button>
                  ))}
                </div>
              ) : (
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertDescription className="text-sm text-amber-900">
                    Please select a Channel or Element first in Step 2.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t border-border/50">
              <Card className="border-2 border-destructive/20 bg-destructive/5 shadow-none rounded-2xl">
                <CardContent className="pt-4 space-y-2">
                  <h4 className="text-sm font-bold text-destructive uppercase tracking-widest">Current Emotional Focus</h4>
                  <div className="flex flex-wrap gap-2">
                    {secondarySelections.length > 0 ? (
                      secondarySelections.map(emotion => (
                        <Badge key={emotion} className="bg-destructive hover:bg-destructive text-primary-foreground text-base font-extrabold">
                          {emotion}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground italic text-sm">No emotions selected yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <EditableField
                field="emotion_notes"
                label="Emotional Context Notes"
                value={initialNotes}
                multiline
                placeholder="Document specific triggers, client insights, or related memories..."
                onSave={(f, v) => onSaveField(f, v)}
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>

      <ConfirmDialog
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        title="Reset Emotional Assessment?"
        description="This will clear all emotional assessment data for this session."
        confirmLabel="Reset"
        onConfirm={executeReset}
      />
    </Collapsible>
  );
};

export default EmotionAssessment;