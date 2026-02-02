"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronDown, Palette, Info, RotateCcw, Flower, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LUSCHER_COLORS, LUSCHER_COMBINATIONS, LuscherCombinationResult } from "@/data/luscher-data";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";

interface LuscherColourAssessmentProps {
  appointmentId: string;
  initialColor1: string | null | undefined;
  initialColor2: string | null | undefined;
  onSaveColors: (color1: string | null, color2: string | null) => Promise<void>;
}

const LuscherColourAssessment = ({ 
  appointmentId, 
  initialColor1, 
  initialColor2, 
  onSaveColors 
}: LuscherColourAssessmentProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [color1, setColor1] = useState<string>(initialColor1 || '');
  const [color2, setColor2] = useState<string>(initialColor2 || '');
  const [isSaving, setIsSaving] = useState(false);

  // Sync internal state when external props change
  useEffect(() => {
    setColor1(initialColor1 || '');
    setColor2(initialColor2 || '');
  }, [initialColor1, initialColor2]);

  const colorOptions = useMemo(() => Object.entries(LUSCHER_COLORS).map(([key, value]) => ({
    code: key,
    name: value.name,
    hex: value.hex,
  })), []);

  const selectedPairKey = useMemo(() => {
    if (color1 && color2) {
      return color1 + color2;
    }
    return null;
  }, [color1, color2]);

  const result: LuscherCombinationResult | undefined = useMemo(() => {
    if (selectedPairKey) {
      return LUSCHER_COMBINATIONS[selectedPairKey];
    }
    return undefined;
  }, [selectedPairKey]);

  const handleSave = async (c1: string, c2: string) => {
    setIsSaving(true);
    try {
      // Use the passed silent save function
      await onSaveColors(c1 || null, c2 || null);

      showSuccess("Luscher Colour selection saved.");
    } catch (error: any) {
      console.error("[LuscherColourAssessment] Error saving colors:", error);
      showError(error.message || "Failed to save Luscher Colour selection.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleColorSelect = (colorCode: string, selectionIndex: 1 | 2) => {
    let newC1 = color1;
    let newC2 = color2;

    if (selectionIndex === 1) {
      newC1 = colorCode;
      // If C1 is set to C2's value, clear C2
      if (newC1 === newC2) newC2 = '';
    } else {
      newC2 = colorCode;
      // If C2 is set to C1's value, clear C1
      if (newC2 === newC1) newC1 = '';
    }

    // Update local state immediately
    setColor1(newC1);
    setColor2(newC2);
    
    // Only save if both colors are selected
    if (newC1 && newC2) {
      handleSave(newC1, newC2);
    }
  };

  const handleReset = () => {
    if (!color1 && !color2) return;
    if (!confirm("Are you sure you want to reset the Luscher Colour selection?")) return;
    
    setColor1('');
    setColor2('');
    handleSave('', '');
  };

  const hasSelection = color1 || color2;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-none shadow-lg rounded-2xl bg-white overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100 cursor-pointer hover:from-violet-100 hover:to-purple-100 transition-colors">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-200">
                  <Palette size={24} className="text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">Luscher Colour (Ps14)</CardTitle>
                  <CardDescription className="text-slate-600">Bach Flower essence reference via colour pairs</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {hasSelection && (
                  <Button 
                    variant="outline" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReset();
                    }}
                    disabled={isSaving}
                    className="border-red-200 text-red-600 hover:bg-red-50 h-8 px-3"
                  >
                    <RotateCcw size={16} className="mr-1" />
                    Reset
                  </Button>
                )}
                {result && (
                  <Badge className="px-4 py-2 text-sm font-bold shadow-sm bg-violet-600 text-white hover:bg-violet-700">
                    {result.bachFlower}
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
                <strong>Protocol:</strong> Use P/L mode to identify the two colours in order (Color 1 then Color 2). The combination determines the required Bach Flower essence.
              </AlertDescription>
            </Alert>

            {/* Color Selection */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Color 1 Selection */}
              <div className="lg:col-span-1 space-y-3 p-4 border border-slate-200 rounded-xl bg-slate-50">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  1. Color 1 (Primary)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map(color => (
                    <Button
                      key={color.code}
                      onClick={() => handleColorSelect(color.code, 1)}
                      disabled={isSaving || color.code === color2}
                      className={cn(
                        "h-10 text-xs font-semibold border-2 transition-all",
                        color1 === color.code 
                          ? "ring-2 ring-offset-2 ring-violet-500" 
                          : "hover:ring-1 hover:ring-violet-300",
                        color.code === color2 && "opacity-50 cursor-not-allowed"
                      )}
                      style={{ backgroundColor: color.hex, color: color.code === '7' || color.code === '1' ? 'white' : 'black', borderColor: color.hex }}
                    >
                      {color.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Color 2 Selection */}
              <div className="lg:col-span-1 space-y-3 p-4 border border-slate-200 rounded-xl bg-slate-50">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  2. Color 2 (Secondary)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map(color => (
                    <Button
                      key={color.code}
                      onClick={() => handleColorSelect(color.code, 2)}
                      disabled={isSaving || color.code === color1}
                      className={cn(
                        "h-10 text-xs font-semibold border-2 transition-all",
                        color2 === color.code 
                          ? "ring-2 ring-offset-2 ring-violet-500" 
                          : "hover:ring-1 hover:ring-violet-300",
                        color.code === color1 && "opacity-50 cursor-not-allowed"
                      )}
                      style={{ backgroundColor: color.hex, color: color.code === '7' || color.code === '1' ? 'white' : 'black', borderColor: color.hex }}
                    >
                      {color.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Current Selection Display */}
              <div className="lg:col-span-1 space-y-3 p-4 border-2 border-violet-200 rounded-xl bg-violet-50">
                <h3 className="text-base font-bold text-violet-900 flex items-center gap-2">
                  Current Selection
                </h3>
                <div className="flex gap-3">
                  <div className="flex-1 p-3 rounded-lg border border-violet-300 bg-white text-center">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Color 1</p>
                    <div className="h-8 w-full rounded-md mx-auto border" style={{ backgroundColor: LUSCHER_COLORS[color1]?.hex || '#e2e8f0' }} />
                    <p className="text-sm font-semibold mt-1 text-slate-800">{LUSCHER_COLORS[color1]?.name || 'None'}</p>
                  </div>
                  <div className="flex-1 p-3 rounded-lg border border-violet-300 bg-white text-center">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Color 2</p>
                    <div className="h-8 w-full rounded-md mx-auto border" style={{ backgroundColor: LUSCHER_COLORS[color2]?.hex || '#e2e8f0' }} />
                    <p className="text-sm font-semibold mt-1 text-slate-800">{LUSCHER_COLORS[color2]?.name || 'None'}</p>
                  </div>
                </div>
                {selectedPairKey && (
                  <p className="text-xs text-violet-700 font-bold text-center pt-2">Pair Code: {selectedPairKey}</p>
                )}
              </div>
            </div>

            {/* Results Display */}
            {result && (
              <Card className="border-2 border-violet-500 shadow-lg rounded-2xl bg-white">
                <CardHeader className="bg-violet-600 rounded-t-2xl p-4">
                  <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                    <Flower size={24} /> {result.bachFlower}
                  </CardTitle>
                  <CardDescription className="text-violet-200">Recommended Bach Flower Essence</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Zap size={16} className="text-violet-500" /> Qualities
                    </h4>
                    <p className="text-lg font-semibold text-slate-800 leading-relaxed">{result.qualities}</p>
                  </div>
                  <div className="space-y-2 pt-4 border-t border-slate-100">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Palette size={16} className="text-violet-500" /> Pattern
                    </h4>
                    <p className="text-sm text-slate-700 leading-relaxed">{result.pattern}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {!result && color1 && color2 && (
              <Alert variant="destructive" className="bg-red-50 border-red-200">
                <AlertDescription className="text-sm text-red-900">
                  Combination {selectedPairKey} not found in the Luscher data. Please check the selected colors.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default LuscherColourAssessment;