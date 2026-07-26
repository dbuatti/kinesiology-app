
import React, { useState, useEffect, useRef } from 'react';

interface DocInputProps {
  label: string;
  value: string | null | undefined;
  field: string;
  placeholder?: string;
  multiline?: boolean;
  type?: string;
  onChange: (field: string, value: string) => void;
}

const DocInput = ({ label, value, field, placeholder, multiline = false, type = "text", onChange }: DocInputProps) => {
  const [localValue, setLocalValue] = useState(value || "");
  const [isFocused, setIsFocused] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isFocused) {
      setLocalValue(value || "");
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalValue(val);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      onChange(field, val);
    }, 1000);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    onChange(field, localValue);
  };

  return (
    <div className="space-y-1.5 group">
      <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-foreground transition-colors">{label}</label>
      {multiline ? (
        <textarea
          value={localValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="w-full min-h-[100px] bg-muted/30 border border-border rounded-none p-4 text-sm font-medium focus:border-foreground/20 focus:bg-card focus:ring-0 transition-all resize-none"
        />
      ) : (
        <input
          type={type}
          value={localValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="w-full bg-transparent border-b border-border py-2 text-sm font-bold focus:border-foreground/20 outline-none transition-all placeholder:text-muted-foreground/60"
        />
      )}
    </div>
  );
};

export default DocInput;