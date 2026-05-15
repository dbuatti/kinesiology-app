"use client";

import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Loader2, Edit3, CheckCircle2, AlertCircle, Sparkles, Copy, Check, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { showSuccess } from "@/utils/toast";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";

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
  const { isPrivate } = usePrivacyMode();
  
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
    }, 1200);
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

  const isSensitive = ['goal', 'issue', 'journal', 'notes', 'additional_notes', 'session_north_star'].includes(field.toLowerCase());
  const shouldBlur = isPrivate && isSensitive && !isFocused;

  const isNoBorder = className.includes('border-none');

  return (
    <div 
      className={cn(
        "group relative p-6 transition-all duration-500",
        !isNoBorder && "border border-border rounded-[2rem]",
        isFocused 
          ? (isNoBorder ? "" : "bg-card border-indigo-500 shadow-premium ring-4 ring-indigo-500/5") 
          : hasError 
            ? (isNoBorder ? "" : "bg-rose-50 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/30")
            : (isNoBorder ? "" : "bg-muted/20 border-transparent hover:bg-card hover:border-border hover:shadow-sm"),
        isNoBorder && "p-0", 
        className
      )}
      onClick={() => {
        if (!isFocused) {
          setIsFocused(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }
      }}
    >
      <div className="flex items-center justify-between mb-4 h-5">
        <div className="flex items-center gap-3">
          <p className={cn(
            "font-black uppercase text-[9px] tracking-[0.25em] transition-colors",
            isFocused ? "text-indigo-600" : hasError ? "text-rose-600" : "text-muted-foreground/60"
          )}>
            {label}
          </p>
          {isPrivate && isSensitive && (
            <Badge variant="outline" className="h-4 px-1.5 text-[7px] font-black uppercase border-rose-200 text-rose-400 bg-rose-50/50">
              <EyeOff size={8} className="mr-1" /> Private
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 min-w-[60px] justify-end">
          {isSaving && (
            <div className="flex items-center gap-1.5 text-[9px] font-black text-indigo-600 animate-pulse">
              <Loader2 size={10} className="animate-spin" /> SYNCING
            </div>
          )}
          {showSaved && !isSaving && (
            <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 animate-in fade-in slide-in-from-right-2">
              <CheckCircle2 size={10} /> SAVED
            </div>
          )}
          {hasError && !isSaving && (
            <div className="flex items-center gap-1.5 text-[9px] font-black text-rose-600">
              <AlertCircle size={10} /> ERROR
            </div>
          )}
          {!isFocused && !isSaving && !showSaved && !hasError && (
            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300">
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50" onClick={handleCopy}>
                {isCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              </Button>
              <Edit3 size={14} className="text-muted-foreground/20" />
            </div>
          )}
        </div>
      </div>
      
      <div className={cn("relative", multiline && "h-full")}>
        {isFocused ? (
          <div className={cn("space-y-5", multiline && "h-full flex flex-col")}>
            <InputComponent
              ref={inputRef}
              value={localValue}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleFocus}
              placeholder={placeholder}
              className={cn(
                "transition-all duration-300 border-none focus-visible:ring-0 text-lg font-medium text-foreground placeholder:text-muted-foreground/10 bg-transparent w-full",
                isNoBorder ? "p-2" : "p-0",
                multiline ? "resize-none flex-1 min-h-[120px]" : ""
              )}
            />
            <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-500 shrink-0 pb-1">
              <div className="flex items-center gap-1.5 mr-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <Sparkles size={12} className="text-indigo-400" /> Quick Tags:
              </div>
              {SMART_CHIPS.map(chip => (
                <button
                  key={chip}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChipClick(chip);
                  }}
                  className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-[9px] font-black uppercase tracking-wider text-slate-500 transition-all hover:scale-105 active:scale-95"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className={cn(
            "text-lg leading-relaxed whitespace-pre-wrap transition-all duration-700",
            isNoBorder ? "p-2" : "p-0",
            isEmpty ? "text-muted-foreground/20 italic font-medium" : "text-foreground font-medium",
            shouldBlur && "blur-sensitive"
          )}>
            {isEmpty ? placeholder : localValue}
          </p>
        )}
      </div>
    </div>
  );
};

export default EditableField;