
import { useState } from "react";
import { useTheme } from "next-themes";
import { START_PAGES, getStartPage, setStartPage, type StartPage } from "@/lib/start-page";
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
  const [startPage, setStartPageState] = useState<StartPage>(getStartPage);
  const chooseStartPage = (path: StartPage) => {
    setStartPage(path);
    setStartPageState(path);
  };

  return (
    <Card className="border border-border shadow-sm rounded-2xl bg-card overflow-hidden">
      <CardHeader className="p-8 pb-4">
        <CardTitle className="text-xl font-semibold flex items-center gap-3">
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
                  "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all font-bold text-xs",
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

        {/* Where the app opens */}
        <div className="pt-4 space-y-2">
          <p className="text-sm font-medium text-foreground">Open the app on</p>
          <p className="text-xs text-muted-foreground">The page you land on when you first open the app on this device.</p>
          <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
            {START_PAGES.map((p) => (
              <button
                key={p.path}
                onClick={() => chooseStartPage(p.path)}
                className={cn(
                  "h-8 rounded-md px-3 text-[13px] font-medium transition-colors",
                  startPage === p.path ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
                aria-pressed={startPage === p.path}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preview swatch */}
        <div className="mt-2 p-4 rounded-2xl bg-muted/30 border border-border flex items-center gap-4">
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-lg bg-background border border-border shadow-sm" />
            <div className="w-6 h-6 rounded-lg bg-card border border-border" />
            <div className="w-6 h-6 rounded-lg bg-muted" />
            <div className="w-6 h-6 rounded-lg bg-primary" />
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            Current theme preview
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppearanceSettings;
