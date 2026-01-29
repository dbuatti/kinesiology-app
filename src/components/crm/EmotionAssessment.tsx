"use client";

import React, { useState, useEffect } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronDown, Heart, Zap, List, Layers, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import EditableField from "./EditableField";
import { CHANNEL_EMOTIONS, ELEMENT_EMOTIONS } from "@/data/emotion-data";

// --- Data Definitions are now imported ---

interface EmotionAssessmentProps {
  appointmentId: string;
  initialMode: string | null | undefined;
  initialPrimary: string | null | undefined;
  initialSecondary: string | null | undefined;
  initialNotes: string | null | undefined;
  onSaveField: (field: string, value: string | null) => Promise<void>;
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
  const [secondarySelection, setSecondarySelection] = useState<string>(initialSecondary || '');
  const [isSaving, setIsSaving] = useState(false);

  // Sync internal state when external props change (e.g., from real-time update)
  useEffect(() => {
    setMode(initialMode || 'channel');
    setPrimarySelection(initialPrimary || '');
    setSecondarySelection(initialSecondary || '');
  }, [initialMode, initialPrimary, initialSecondary]);

  const currentData = mode === 'channel' ? CHANNEL_EMOTIONS : ELEMENT_EMOTIONS;
  const primaryKeys = Object.keys(currentData);
  
  // Ensure secondaryOptions defaults to an empty array if primarySelection is invalid or missing
  const secondaryOptions = primarySelection ? currentData[primarySelection] || [] : [];

  const handleModeChange = (newMode: string) => {
    setMode(newMode);
    setPrimarySelection('');
    setSecondarySelection('');
    handleSave(newMode, '', '');
  };

  const handlePrimarySelect = (selection: string) => {
    setPrimarySelection(selection);
    setSecondarySelection('');
    handleSave(mode, selection, '');
  };

  const handleSecondarySelect = (selection: string) => {
    setSecondarySelection(selection);
    handleSave(mode, primarySelection, selection);
  };

  const handleSave = async (newMode: string, newPrimary: string, newSecondary: string) => {
    setIsSaving(true);
    try {
      await Promise.all([
        onSaveField('emotion_mode', newMode),
        onSaveField('emotion_primary_selection', newPrimary || null),
        onSaveField('emotion_secondary_selection', newSecondary || null),
      ]);
      // Removed onUpdate() call here to prevent full page refresh
    } catch (error) {
      console.error("Failed to save emotion assessment:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    setMode('channel');
    setPrimarySelection('');
    setSecondarySelection('');
    handleSave('channel', '', '');
  };

  const getPrimaryColor = (key: string) => {
    if (mode === 'element') {
      switch (key) {
        case 'FIRE': return 'bg-red-500 hover:bg-red-600';
        case 'EARTH': return 'bg-yellow-500 hover:bg-yellow-600';
        case 'METAL': return 'bg-gray-500 hover:bg-gray-600';
        case 'WATER': return 'bg-blue-500 hover:bg-blue-600';
        case 'WOOD': return 'bg-green-500 hover:bg-green-600';
        default: return 'bg-slate-500 hover:bg-slate-600';
      }
    }
    return 'bg-indigo-500 hover:bg-indigo-600';
  };

  const isComplete = primarySelection && secondarySelection;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-none shadow-lg rounded-2xl bg-white overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b border-red-100 cursor-pointer hover:from-red-100 hover:to-pink-100 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
                  <Heart size={24} className="text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">Emotional Assessment (PS12)</CardTitle>
                  <CardDescription className="text-slate-600">Identify and balance core emotional context</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isComplete && (
                  <Badge className="px-4 py-2 text-sm font-bold shadow-sm bg-emerald-500 text-white hover:bg-emerald-600">
                    Balanced
                  </Badge>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ChevronDown className={cn("h-5 w-5 transition-transform text-slate-600", isOpen && "rotate-180")} />
                </Button>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="p-6 space-y-6">
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-900">
                <strong>Protocol:</strong> Use PS12 mode (thumb to ring finger pad) to challenge the body for the relevant mode, primary selection (Channel/Element), and secondary selection (Specific Emotion).
              </AlertDescription>
            </Alert>

            {/* Step 1: Mode Selection */}
            <div className="space-y-3 p-4 border border-slate-200 rounded-xl bg-slate-50">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers size={16} className="text-red-600" /> 1. Select Assessment Mode
              </h3>
              <div className="flex gap-3">
                <Button
                  variant={mode === 'channel' ? 'default' : 'outline'}
                  onClick={() => handleModeChange('channel')}
                  className={cn("flex-1 h-10", mode === 'channel' ? "bg-red-600 hover:bg-red-700" : "border-slate-300 hover:bg-white")}
                  disabled={isSaving}
                >
                  By Channel
                </Button>
                <Button
                  variant={mode === 'element' ? 'default' : 'outline'}
                  onClick={() => handleModeChange('element')}
                  className={cn("flex-1 h-10", mode === 'element' ? "bg-red-600 hover:bg-red-700" : "border-slate-300 hover:bg-white")}
                  disabled={isSaving}
                >
                  By 5 Element
                </Button>
              </div>
            </div>

            {/* Step 2: Primary Selection (Channel/Element) */}
            <div className="space-y-3 p-4 border border-slate-200 rounded-xl bg-white">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <List size={16} className="text-indigo-600" /> 2. Select {mode === 'channel' ? 'Channel/Meridian' : 'Element'}
              </h3>
              <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-2 border border-slate-100 rounded-lg">
                {primaryKeys.map((key) => (
                  <Button
                    key={key}
                    variant={primarySelection === key ? 'default' : 'outline'}
                    onClick={() => handlePrimarySelect(key)}
                    className={cn(
                      "h-8 text-xs font-semibold",
                      primarySelection === key 
                        ? getPrimaryColor(key) + " text-white" 
                        : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                    )}
                    disabled={isSaving}
                  >
                    {key}
                  </Button>
                ))}
              </div>
            </div>

            {/* Step 3: Secondary Selection (Specific Emotion) */}
            <div className="space-y-3 p-4 border border-slate-200 rounded-xl bg-slate-50">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Zap size={16} className="text-emerald-600" /> 3. Select Specific Emotion/Feeling
              </h3>
              {primarySelection ? (
                <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-2 border border-slate-100 rounded-lg bg-white">
                  {secondaryOptions.map((emotion) => (
                    <Button
                      key={emotion}
                      variant={secondarySelection === emotion ? 'default' : 'outline'}
                      onClick={() => handleSecondarySelect(emotion)}
                      className={cn(
                        "h-8 text-xs font-semibold",
                        secondarySelection === emotion 
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                          : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
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

            {/* Summary and Notes */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <Card className="border-2 border-red-200 bg-red-50/50 shadow-none rounded-2xl">
                <CardContent className="pt-4 space-y-2">
                  <h4 className="text-sm font-bold text-red-900 uppercase tracking-widest">Current Emotional Focus</h4>
                  <p className="text-xl font-extrabold text-red-800">
                    {secondarySelection || 'No Emotion Selected'}
                  </p>
                  {primarySelection && (
                    <p className="text-sm text-red-700">
                      Mode: {mode === 'channel' ? 'Channel' : 'Element'} / Primary: {primarySelection}
                    </p>
                  )}
                </CardContent>
              </Card>

              <EditableField
                field="emotion_notes"
                label="Emotional Balancing Notes (ESR, Context, Discussion)"
                value={initialNotes}
                multiline
                placeholder="Document client discussion, ESR points held, and balancing techniques used..."
                onSave={onSaveField}
              />

              <Button 
                variant="outline" 
                onClick={handleClear}
                className="w-full border-slate-200 hover:bg-slate-100"
                disabled={isSaving}
              >
                Clear Assessment
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default EmotionAssessment;