
import React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Palette } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

const AppearanceSettings = () => {
  const { theme, setTheme } = useTheme();

  return (
    <Card className="border-none shadow-lg rounded-[2.5rem] bg-card overflow-hidden">
      <CardHeader className="p-8 pb-4">
        <CardTitle className="text-xl font-black flex items-center gap-3">
          <Palette size={22} className="text-primary" /> Appearance
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8 pt-0 space-y-4">
        <p className="text-xs text-muted-foreground font-medium">
          Choose how the app looks. System follows your device setting.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map(({ value, label, icon: Icon }) => {
            const isActive = theme === value;
            return (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all font-bold text-xs uppercase tracking-wider",
                  isActive
                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                    : "border-border bg-muted/30 text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-muted/60"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                  isActive ? "bg-primary/10" : "bg-muted/60"
                )}>
                  <Icon size={20} className={isActive ? "text-primary" : "text-muted-foreground"} />
                </div>
                {label}
              </button>
            );
          })}
        </div>

        {/* Preview swatch */}
        <div className="mt-2 p-4 rounded-2xl bg-muted/30 border border-border flex items-center gap-4">
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-lg bg-background border border-border shadow-sm" />
            <div className="w-6 h-6 rounded-lg bg-card border border-border" />
            <div className="w-6 h-6 rounded-lg bg-muted" />
            <div className="w-6 h-6 rounded-lg bg-primary" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Current theme preview
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppearanceSettings;
