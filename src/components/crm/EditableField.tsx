"use client";

import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Loader2, Edit3, CheckCircle2 } from "lucide-react";

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
    
    debounceTimer.current = setTimeout(async () => {
      const valueToSave = trimmed === '' ? null : trimmed;
      
      try {
        await onSave(field, valueToSave);
        lastCommittedRef.current = trimmed;
        setIsSaving(false);
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 2000);
      } catch (error) {
        console.error("Debounced save failed:", error);
        setIsSaving(false);
      }
    }, 1000);
  }, [field, onSave]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedSave(newValue);
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
        onSave(field, trimmed === '' ? null : trimmed)
          .then(() => {
            setIsSaving(false);
            setShowSaved(true);
            setTimeout(() => setShowSaved(false), 2000);
          })
          .catch(() => setIsSaving(false));
        lastCommittedRef.current = trimmed;
      }
    }
    setIsFocused(false);
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

  if (!isFocused) {
    return (
      <div 
        className={cn("group relative cursor-pointer", className)}
        onClick={() => {
          setIsFocused(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
      >
        <div className="flex items-center justify-between mb-1.5">
          <p className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">{label}</p>
          {showSaved && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 animate-in fade-in slide-in-from-right-1">
              <CheckCircle2 size={10} /> SAVED
            </div>
          )}
        </div>
        <div className="flex items-center justify-between min-h-[38px]">
          <p className={cn(
            "text-sm leading-relaxed whitespace-pre-wrap",
            isEmpty ? "text-slate-400 italic" : "text-slate-700"
          )}>
            {isEmpty ? placeholder : localValue}
          </p>
          <Edit3 size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("group relative", className)}>
      <div className="flex items-center justify-between mb-1.5">
        <p className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">{label}</p>
        {isSaving && (
          <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-500">
            <Loader2 size={10} className="animate-spin" /> SAVING...
          </div>
        )}
        {showSaved && !isSaving && (
          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500">
            <CheckCircle2 size={10} /> SAVED
          </div>
        )}
      </div>
      <div className="relative">
        <InputComponent
          ref={inputRef}
          value={localValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn(
            multiline ? "min-h-[100px] resize-none" : "",
            "transition-all duration-150 pr-10",
            isFocused && "ring-2 ring-indigo-500/70 border-indigo-400 shadow-sm"
          )}
        />
      </div>
    </div>
  );
};

export default EditableField;