"use client";

import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

// Define the union type for the ref element
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
  
  // Use the union type for the ref
  const inputRef = useRef<InputElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastCommittedRef = useRef(normalizedProp);

  // 1. Sync local state with external prop (Supabase subscription update)
  useEffect(() => {
    // Only sync if we are not focused AND the external value is different from the last committed value
    if (!isFocused && normalizedProp !== lastCommittedRef.current) {
      setLocalValue(normalizedProp);
      lastCommittedRef.current = normalizedProp;
    }
  }, [normalizedProp, isFocused]);

  // 2. Debounced Save Logic
  const debouncedSave = useCallback((newValue: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    const trimmed = newValue.trim();
    if (trimmed === lastCommittedRef.current) return;

    setIsSaving(true);
    
    debounceTimer.current = setTimeout(async () => {
      const valueToSave = trimmed === '' ? null : trimmed;
      
      try {
        await onSave(field, valueToSave);
        lastCommittedRef.current = trimmed;
      } catch (error) {
        console.error("Debounced save failed:", error);
      } finally {
        setIsSaving(false);
      }
    }, 1000); // Reduced debounce time to 1000ms for better responsiveness
  }, [field, onSave]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedSave(newValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Clear any pending debounce timer when focusing, as typing will restart it
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
  };

  const handleBlur = () => {
    // When blurring, immediately execute any pending save
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      // Manually trigger the save for the current local value
      const trimmed = localValue.trim();
      if (trimmed !== lastCommittedRef.current) {
        setIsSaving(true);
        onSave(field, trimmed === '' ? null : trimmed)
          .finally(() => setIsSaving(false));
        lastCommittedRef.current = trimmed;
      }
    }
    setIsFocused(false);
  };

  // Focus/cursor restoration (optional, but good for UX)
  useLayoutEffect(() => {
    if (isFocused && inputRef.current && document.activeElement !== inputRef.current) {
      const pos = localValue.length;
      inputRef.current.focus();
      inputRef.current.setSelectionRange(pos, pos);
    }
  }, [isFocused, localValue]);

  const isEmpty = !localValue && !isFocused;
  // Cast InputComponent to accept the generic InputElement ref
  const InputComponent = multiline ? Textarea : Input as React.ElementType<any>;

  return (
    <div className={cn("group relative", className)}>
      <p className="font-bold text-slate-400 uppercase text-[10px] tracking-widest mb-1.5">{label}</p>
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
            "transition-all duration-150 pr-10", // Added pr-10 for saving indicator
            isEmpty && !isFocused && "text-slate-400 italic",
            isFocused && "ring-2 ring-indigo-500/70 border-indigo-400 shadow-sm"
          )}
        />
        {isSaving && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 size={16} className="animate-spin text-indigo-500" />
          </div>
        )}
      </div>
    </div>
  );
};

export default EditableField;