"use client";

import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Loader2, Edit3, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

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
        "group relative p-6 rounded-[2.5rem] transition-all duration-500 border-2",
        isFocused 
          ? "bg-white border-indigo-500 shadow-2xl shadow-indigo-100/50 scale-[1.01]" 
          : hasError 
            ? "bg-rose-50 border-rose-300"
            : "bg-slate-50/50 border-transparent hover:bg-white hover:border-slate-200 hover:shadow-xl",
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
        <p className={cn(
          "font-black uppercase text-[10px] tracking-[0.25em] transition-colors",
          isFocused ? "text-indigo-600" : hasError ? "text-rose-600" : "text-slate-400"
        )}>
          {label}
        </p>
        <div className="flex items-center gap-2 min-w-[60px] justify-end">
          {isSaving && (
            <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 animate-pulse">
              <Loader2 size={12} className="animate-spin" /> SAVING
            </div>
          )}
          {showSaved && !isSaving && (
            <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 animate-in fade-in slide-in-from-right-2">
              <CheckCircle2 size={12} /> SAVED
            </div>
          )}
          {hasError && !isSaving && (
            <div className="flex items-center gap-1.5 text-[10px] font-black text-rose-600">
              <AlertCircle size={12} /> ERROR
            </div>
          )}
          {!isFocused && !isSaving && !showSaved && !hasError && (
            <Edit3 size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </div>
      
      <div className="relative">
        {isFocused ? (
          <div className="space-y-4">
            <InputComponent
              ref={inputRef}
              value={localValue}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={placeholder}
              className={cn(
                multiline ? "min-h-[140px] resize-none" : "h-10",
                "transition-all duration-300 border-none focus-visible:ring-0 p-0 text-base font-bold text-slate-900 placeholder:text-slate-300 bg-transparent",
              )}
            />
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-1 duration-300">
              <div className="flex items-center gap-1.5 mr-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <Sparkles size={10} className="text-indigo-400" /> Smart Chips:
              </div>
              {SMART_CHIPS.map(chip => (
                <button
                  key={chip}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChipClick(chip);
                  }}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-indigo-600 hover:text-white text-[9px] font-black uppercase tracking-wider text-slate-500 transition-all"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className={cn(
            "text-base leading-relaxed whitespace-pre-wrap min-h-[24px]",
            isEmpty ? "text-slate-400 italic font-medium" : "text-slate-700 font-bold"
          )}>
            {isEmpty ? placeholder : localValue}
          </p>
        )}
      </div>
    </div>
  );
};

export default EditableField;