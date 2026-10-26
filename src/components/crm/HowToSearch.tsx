import { useState, useEffect, useMemo } from "react";
import { lessons } from "@/data/mechano-lessons-data";
import { CRANIAL_NERVES } from "@/data/cranial-nerve-data";
import { PEACE_PHASES } from "@/components/crm/v2/PeaceWizard";
import { CORRECTION_PROCESSES } from "@/data/correction-processes";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Search, BookOpen, Brain, Activity, X, ChevronRight } from "lucide-react";

interface HowToItem {
  id: string;
  title: string;
  subtitle: string;
  kind: "lesson" | "nerve" | "peace" | "process";
  icon: any;
  steps?: string[];
  group?: string;
}

const HowToSearch = () => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<HowToItem | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
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
      out.push({ id: `lesson-${l.id}`, title: l.title, subtitle: l.description, kind: "lesson", icon: BookOpen });
    }
    for (const n of CRANIAL_NERVES) {
      out.push({ id: `nerve-${n.name}`, title: `${n.name}: ${n.latinName}`, subtitle: n.reflexPoint, kind: "nerve", icon: Brain });
    }
    for (const p of PEACE_PHASES) {
      out.push({ id: `peace-${p.id}`, title: `PEACE · ${p.fullLabel}`, subtitle: p.hint, kind: "peace", icon: Activity });
    }
    for (const c of CORRECTION_PROCESSES) {
      out.push({ id: `proc-${c.id}`, title: c.title, subtitle: c.subtitle, kind: "process", icon: ChevronRight, steps: c.steps, group: c.group });
    }
    return out;
  }, []);

  const handleClose = () => { setOpen(false); setSelected(null); };

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

      <CommandDialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(v); }}>
        <CommandInput placeholder="Search processes, mechano, cranial nerves, PEACE…" />
        <CommandList className="max-h-[45vh]">
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Correction processes (afferent / efferent)">
            {items.filter((i) => i.kind === "process").map((i) => (
              <CommandItem
                key={i.id}
                value={i.title + " " + i.subtitle + " " + (i.group || "")}
                onSelect={() => setSelected(i)}
                className="flex items-center gap-2"
              >
                <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{i.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{i.group} · {i.subtitle}</div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Mechano lessons">
            {items.filter((i) => i.kind === "lesson").map((i) => (
              <CommandItem key={i.id} value={i.title + " " + i.subtitle} onSelect={() => setSelected(i)} className="flex items-center gap-2">
                <BookOpen size={14} className="text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{i.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{i.subtitle}</div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Cranial nerves">
            {items.filter((i) => i.kind === "nerve").map((i) => (
              <CommandItem key={i.id} value={i.title + " " + i.subtitle} onSelect={() => setSelected(i)} className="flex items-center gap-2">
                <Brain size={14} className="text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{i.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{i.subtitle}</div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="PEACE phases">
            {items.filter((i) => i.kind === "peace").map((i) => (
              <CommandItem key={i.id} value={i.title + " " + i.subtitle} onSelect={() => setSelected(i)} className="flex items-center gap-2">
                <Activity size={14} className="text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{i.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{i.subtitle}</div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>

        {selected && (
          <div className="border-t border-border p-4 space-y-3 max-h-[40vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground">{selected.title}</div>
                <div className="text-xs text-muted-foreground">{selected.subtitle}</div>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setSelected(null)}>
                <X size={14} />
              </Button>
            </div>
            {selected.steps && selected.steps.length > 0 && (
              <ol className="space-y-1.5 list-decimal list-inside">
                {selected.steps.map((step, i) => (
                  <li key={i} className="text-xs text-foreground/90 leading-relaxed">{step}</li>
                ))}
              </ol>
            )}
          </div>
        )}
      </CommandDialog>
    </>
  );
};

export default HowToSearch;