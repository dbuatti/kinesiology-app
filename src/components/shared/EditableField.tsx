"use client";

import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Loader2, Edit3, CheckCircle2, AlertCircle, Sparkles, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showSuccess } from "@/utils/toast";

type InputElement = HTMLInputElement | HTMLTextAreaElement;

interface EditableFieldProps {
  field: string;
  label: string;
  value: string | null | undefined;
  multiline?: boolean;
  className?: string;
  placeholder?: string;
  onSave: (field: string, value: string | null) => Promise<void>;
}

const SMART_CHIPS = [
  "Inhibited", "Hypertonic", "Cleared", "Balanced", "Priority", "Switching", "ESR", "K27", "TL"
];

const EditableField = ({ 
  field, 
  label, 
  value: propValue, 
  multiline = false,
  className = "",
  placeholder = "Click to add...",
  onSave
}: EditableFieldProps) => {
  const normalizedProp = propValue ?? '';
  const [localValue, setLocalValue] = useState(normalizedProp);
  const [isFocused, setIsFocused] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  const inputRef = useRef<InputElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastCommittedRef = useRef(normalizedProp);

  useEffect(() => {
    if (!isFocused && normalizedProp !== lastCommittedRef.current) {
      setLocalValue(normalizedProp);
      lastCommittedRef.current = normalizedProp;
    }
  }, [normalizedProp, isFocused]);

  const debouncedSave = useCallback((newValue: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    const trimmed = newValue.trim();
    if (trimmed === lastCommittedRef.current) return;

    setIsSaving(true);
    setShowSaved(false);
    setHasError(false);
    
    debounceTimer.current = setTimeout(async () => {
      const valueToSave = trimmed === '' ? null : trimmed;
      
      try {
        await onSave(field, valueToSave);
        lastCommittedRef.current = trimmed;
        setIsSaving(false);
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 3000);
      } catch (error) {
        console.error("Debounced save failed:", error);
        setIsSaving(false);
        setHasError(true);
      }
    }, 1000);
  }, [field, onSave]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedSave(newValue);
  };

  const handleChipClick = (chip: string) => {
    const newValue = localValue ? `${localValue.trim()} ${chip}` : chip;
    setLocalValue(newValue);
    debouncedSave(newValue);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!localValue) return;
    navigator.clipboard.writeText(localValue);
    setIsCopied(true);
    showSuccess("Copied to clipboard");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
  };

  const handleBlur = () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      const trimmed = localValue.trim();
      if (trimmed !== lastCommittedRef.current) {
        setIsSaving(true);
        setHasError(false);
        onSave(field, trimmed === '' ? null : trimmed)
          .then(() => {
            setIsSaving(false);
            setShowSaved(true);
            setTimeout(() => setShowSaved(false), 3000);
          })
          .catch(() => {
            setIsSaving(false);
            setHasError(true);
          });
        lastCommittedRef.current = trimmed;
      }
    }
    setTimeout(() => setIsFocused(false), 200);
  };

  useLayoutEffect(() => {
    if (isFocused && inputRef.current && document.activeElement !== inputRef.current) {
      const pos = localValue.length;
      inputRef.current.focus();
      inputRef.current.setSelectionRange(pos, pos);
    }
  }, [isFocused, localValue]);

  const isEmpty = !localValue && !isFocused;
  const InputComponent = multiline ? Textarea : Input as React.ElementType<any>;

  return (
    <div 
      className={cn(
        "group relative p-4 rounded-2xl transition-all duration-500 border-2",
        isFocused 
          ? "bg-card border-indigo-500 shadow-xl shadow-indigo-100/50 dark:shadow-indigo-900/20 scale-[1.01]" 
          : hasError 
            ? "bg-rose-50 dark:bg-rose-950/10 border-rose-300 dark:border-rose-900/30"
            : "bg-muted/50 border-transparent hover:bg-card hover:border-border hover:shadow-lg",
        className
      )}
      onClick={() => {
        if (!isFocused) {
          setIsFocused(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }
      }}
    >
      <div className="flex items-center justify-between mb-2 h-4">
        <p className={cn(
          "font-black uppercase text-[8px] tracking-[0.2em] transition-colors",
          isFocused ? "text-indigo-600" : hasError ? "text-rose-600" : "text-muted-foreground"
        )}>
          {label}
        </p>
        <div className="flex items-center gap-1.5 min-w-[50px] justify-end">
          {isSaving && (
            <div className="flex items-center gap-1 text-[8px] font-black text-indigo-600 animate-pulse">
              <Loader2 size={8} className="animate-spin" /> SAVING
            </div>
          )}
          {showSaved && !isSaving && (
            <div className="flex items-center gap-1 text-[8px] font-black text-emerald-600 animate-in fade-in slide-in-from-right-1">
              <CheckCircle2 size={8} /> SAVED
            </div>
          )}
          {hasError && !isSaving && (
            <div className="flex items-center gap-1 text-[8px] font-black text-rose-600">
              <AlertCircle size={8} /> ERROR
            </div>
          )}
          {!isFocused && !isSaving && !showSaved && !hasError && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg text-muted-foreground hover:text-indigo-600 hover:bg-accent" onClick={handleCopy}>
                {isCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              </Button>
              <Edit3 size={12} className="text-muted-foreground/50" />
            </div>
          )}
        </div>
      </div>
      
      <div className="relative">
        {isFocused ? (
          <div className="space-y-3">
            <InputComponent
              ref={inputRef}
              value={localValue}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={placeholder}
              className={cn(
                multiline ? "min-h-[100px] resize-none" : "h-8",
                "transition-all duration-300 border-none focus-visible:ring-0 p-0 text-sm font-bold text-foreground placeholder:text-muted-foreground/30 bg-transparent",
              )}
            />
            <div className="flex flex-wrap gap-1 pt-1.5 border-t border-border animate-in fade-in slide-in-from-bottom-1 duration-300">
              <div className="flex items-center gap-1 mr-1.5 text-[7px] font-black text-muted-foreground uppercase tracking-widest">
                <Sparkles size={8} className="text-indigo-400" /> Tags:
              </div>
              {SMART_CHIPS.map(chip => (
                <button
                  key={chip}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChipClick(chip);
                  }}
                  className="px-1.5 py-0.5 rounded-md bg-muted hover:bg-indigo-600 hover:text-white text-[7px] font-black uppercase tracking-wider text-muted-foreground transition-all"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className={cn(
            "text-sm leading-relaxed whitespace-pre-wrap min-h-[20px]",
            isEmpty ? "text-muted-foreground/50 italic font-medium" : "text-foreground font-bold"
          )}>
            {isEmpty ? placeholder : localValue}
          </p>
        )}
      </div>
    </div>
  );
};

export default EditableField;