import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { lessons } from "@/data/mechano-lessons-data";
import { CRANIAL_NERVES } from "@/data/cranial-nerve-data";
import { PEACE_PHASES } from "@/components/crm/v2/PeaceWizard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Search, BookOpen, Brain, Activity, X } from "lucide-react";

interface HowToItem {
  id: string;
  title: string;
  subtitle: string;
  kind: "lesson" | "nerve" | "peace";
  path: string;
  icon: any;
}

const HowToSearch = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      // Cmd/Ctrl + Shift + K  OR  "?"  opens the how-to search
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === "?" && !(e.metaKey || e.ctrlKey || e.altKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const items: HowToItem[] = useMemo(() => {
    const out: HowToItem[] = [];
    for (const l of lessons) {
      out.push({
        id: `lesson-${l.id}`,
        title: l.title,
        subtitle: l.description,
        kind: "lesson",
        path: `/library?tab=mechano`,
        icon: BookOpen,
      });
    }
    for (const n of CRANIAL_NERVES) {
      out.push({
        id: `nerve-${n.name}`,
        title: `${n.name}: ${n.latinName}`,
        subtitle: n.reflexPoint,
        kind: "nerve",
        path: `/library?tab=cranial`,
        icon: Brain,
      });
    }
    for (const p of PEACE_PHASES) {
      out.push({
        id: `peace-${p.id}`,
        title: `PEACE · ${p.fullLabel}`,
        subtitle: p.hint,
        kind: "peace",
        path: `/library?tab=peace`,
        icon: Activity,
      });
    }
    return out;
  }, []);

  const [selected, setSelected] = useState<HowToItem | null>(null);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="rounded-xl text-muted-foreground shrink-0 h-8 px-2.5 gap-1.5"
        title="How-to search (⌘⇧K or ?)"
      >
        <Search size={14} /> <span className="hidden md:inline text-xs">How-to</span>
      </Button>

      <CommandDialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSelected(null); }}>
        <CommandInput placeholder="Search mechano, cranial nerves, PEACE steps…" />
        <CommandList className="max-h-[60vh]">
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Mechano lessons">
            {items.filter((i) => i.kind === "lesson").map((i) => (
              <CommandItem
                key={i.id}
                value={i.title + " " + i.subtitle}
                onSelect={() => setSelected(i)}
                className="flex items-center gap-2"
              >
                <i.icon size={14} className="text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{i.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{i.subtitle}</div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Cranial nerves">
            {items.filter((i) => i.kind === "nerve").map((i) => (
              <CommandItem
                key={i.id}
                value={i.title + " " + i.subtitle}
                onSelect={() => setSelected(i)}
                className="flex items-center gap-2"
              >
                <i.icon size={14} className="text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{i.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{i.subtitle}</div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="PEACE phases">
            {items.filter((i) => i.kind === "peace").map((i) => (
              <CommandItem
                key={i.id}
                value={i.title + " " + i.subtitle}
                onSelect={() => setSelected(i)}
                className="flex items-center gap-2"
              >
                <i.icon size={14} className="text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{i.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{i.subtitle}</div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>

        {selected && (
          <div className="border-t border-border p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">{selected.title}</div>
                <div className="text-xs text-muted-foreground">{selected.subtitle}</div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 h-8 text-xs"
                onClick={() => { window.open(selected.path, "_blank"); setOpen(false); setSelected(null); }}
              >
                Open in Library
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Opens the full reference in a new tab so you stay on this page.
            </p>
          </div>
        )}
      </CommandDialog>
    </>
  );
};

export default HowToSearch;