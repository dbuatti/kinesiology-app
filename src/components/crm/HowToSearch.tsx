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
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { BookOpen, Brain, Activity, ChevronRight, Search, Check, type LucideIcon } from "lucide-react";

type HowToKind = "lesson" | "nerve" | "peace" | "process";

interface HowToItem {
  id: string;
  title: string;
  subtitle: string;
  kind: HowToKind;
  icon: LucideIcon;
  steps?: string[];
  details?: { label: string; value: string }[];
  bullets?: string[];
  note?: string;
  group?: string;
  keywords?: string;
}

const KIND_LABEL: Record<HowToKind, string> = {
  process: "Correction process",
  lesson: "Mechano lesson",
  nerve: "Cranial nerve",
  peace: "PEACE phase",
};

const ResultGroup = ({
  heading,
  items,
  selectedId,
  onSelect,
}: {
  heading: string;
  items: HowToItem[];
  selectedId: string | null;
  onSelect: (item: HowToItem) => void;
}) => {
  if (items.length === 0) return null;
  return (
    <CommandGroup heading={heading}>
      {items.map((item) => {
        const Icon = item.icon;
        const isSelected = selectedId === item.id;
        return (
          <CommandItem
            key={item.id}
            value={[item.title, item.subtitle, item.group, item.keywords].filter(Boolean).join(" ")}
            onSelect={() => onSelect(item)}
            aria-current={isSelected ? "true" : undefined}
            className={cn(
              "flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2",
              isSelected && "bg-muted/70"
            )}
          >
            <Icon size={14} className="shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-foreground">{item.title}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {item.group ? `${item.group} · ` : ""}
                {item.subtitle}
              </p>
            </div>
            {isSelected && <Check size={13} className="shrink-0 text-primary" />}
          </CommandItem>
        );
      })}
    </CommandGroup>
  );
};

const DetailPane = ({ item, onBack }: { item: HowToItem; onBack: () => void }) => {
  const hasBody =
    (item.steps?.length ?? 0) > 0 ||
    (item.details?.length ?? 0) > 0 ||
    (item.bullets?.length ?? 0) > 0;

  return (
    <>
      <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4 pr-14">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.11em] text-muted-foreground">
            <span>{KIND_LABEL[item.kind]}</span>
            {item.group && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span>{item.group}</span>
              </>
            )}
          </p>
          <h2 className="mt-1 text-lg font-semibold leading-snug text-foreground">{item.title}</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{item.subtitle}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-8 shrink-0 rounded-lg px-2.5 text-xs text-muted-foreground md:hidden"
        >
          Back
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {item.steps && item.steps.length > 0 && (
          <ol className="space-y-3">
            {item.steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold tabular-nums text-muted-foreground">
                  {i + 1}
                </span>
                <p className="text-[13px] leading-relaxed text-foreground/90">{step}</p>
              </li>
            ))}
          </ol>
        )}

        {item.details && item.details.length > 0 && (
          <dl className="space-y-2.5">
            {item.details.map((detail) => (
              <div key={detail.label} className="grid grid-cols-[92px_1fr] gap-3">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/80">
                  {detail.label}
                </dt>
                <dd className="text-xs leading-relaxed text-foreground/90">{detail.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {item.bullets && item.bullets.length > 0 && (
          <ul className={cn("space-y-1.5", (item.details?.length ?? 0) > 0 && "mt-4 border-t border-border/60 pt-4")}>
            {item.bullets.map((bullet, i) => (
              <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-foreground/90">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50" />
                {bullet}
              </li>
            ))}
          </ul>
        )}

        {item.note && (
          <div className="mt-5 rounded-xl border border-primary/15 bg-primary/[0.04] px-3.5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-primary/80">
              Clinical pearl
            </p>
            <p className="mt-1 text-xs leading-relaxed text-foreground/90">{item.note}</p>
          </div>
        )}

        {!hasBody && (
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Reference entry. Pick a correction process to see its step-by-step instructions here.
          </p>
        )}
      </div>
    </>
  );
};

const HowToSearch = () => {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
      out.push({
        id: `lesson-${l.id}`,
        title: l.title,
        subtitle: `${l.duration} · ${l.difficulty}`,
        kind: "lesson",
        icon: BookOpen,
        note: l.description,
      });
    }
    for (const n of CRANIAL_NERVES) {
      out.push({
        id: `nerve-${n.name}`,
        title: `${n.name}: ${n.latinName}`,
        subtitle: n.reflexPoint,
        kind: "nerve",
        icon: Brain,
        details: [
          { label: "Reflex point", value: n.reflexPoint },
          { label: "Nuclei", value: n.acupoint ? `${n.nuclei} · ${n.acupoint}` : n.nuclei },
          { label: "Tone", value: n.toneEffect },
          { label: "Stimulus", value: n.stimulus },
        ],
        bullets: n.functions,
        note: n.clinicalPearl,
        keywords: `${n.name} ${n.latinName} ${n.nuclei} ${n.acupoint ?? ""}`,
      });
    }
    for (const p of PEACE_PHASES) {
      out.push({
        id: `peace-${p.id}`,
        title: `PEACE · ${p.fullLabel}`,
        subtitle: p.hint,
        kind: "peace",
        icon: Activity,
        group: "PEACE framework",
      });
    }
    for (const c of CORRECTION_PROCESSES) {
      out.push({
        id: `proc-${c.id}`,
        title: c.title,
        subtitle: c.subtitle,
        kind: "process",
        icon: ChevronRight,
        steps: c.steps,
        group: c.group,
        keywords: c.keywords,
      });
    }
    return out;
  }, []);

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId]
  );

  const byKind = useMemo(
    () => ({
      process: items.filter((i) => i.kind === "process"),
      lesson: items.filter((i) => i.kind === "lesson"),
      nerve: items.filter((i) => i.kind === "nerve"),
      peace: items.filter((i) => i.kind === "peace"),
    }),
    [items]
  );

  const handleClose = () => {
    setOpen(false);
    setSelectedId(null);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="rounded-lg text-muted-foreground shrink-0 h-7 px-2.5 gap-1.5 text-[10.5px]"
        title="How-to search (⌘⇧K or ?)"
      >
        <Search size={14} /> <span className="hidden text-xs xl:inline">How-to</span>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={(v) => {
          if (!v) handleClose();
          else setOpen(v);
        }}
        contentClassName="howto-dialog max-w-[min(1300px,calc(100vw-1.5rem))] gap-0 p-0"
        commandClassName="h-[min(88vh,820px)]"
      >
        <DialogTitle className="sr-only">How-to search</DialogTitle>
        <DialogDescription className="sr-only">
          Search correction processes, mechano lessons, cranial nerves and PEACE phases. The selected
          entry opens on the right with its instructions.
        </DialogDescription>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* Results — left on desktop, full width until something is chosen on mobile. */}
          <div
            className={cn(
              "flex min-h-0 w-full flex-col border-border md:w-[420px] md:shrink-0 md:border-r",
              selected && "hidden md:flex"
            )}
          >
            <CommandInput
              placeholder="Search processes, mechano, cranial nerves, PEACE…"
              className="h-12 text-sm"
            />
            <CommandList className="max-h-none min-h-0 flex-1 overflow-y-auto p-1.5">
              <CommandEmpty>No results found.</CommandEmpty>
              <ResultGroup
                heading={`Correction processes (${byKind.process.length})`}
                items={byKind.process}
                selectedId={selectedId}
                onSelect={(item) => setSelectedId(item.id)}
              />
              <ResultGroup
                heading={`Mechano lessons (${byKind.lesson.length})`}
                items={byKind.lesson}
                selectedId={selectedId}
                onSelect={(item) => setSelectedId(item.id)}
              />
              <ResultGroup
                heading={`Cranial nerves (${byKind.nerve.length})`}
                items={byKind.nerve}
                selectedId={selectedId}
                onSelect={(item) => setSelectedId(item.id)}
              />
              <ResultGroup
                heading="PEACE phases"
                items={byKind.peace}
                selectedId={selectedId}
                onSelect={(item) => setSelectedId(item.id)}
              />
            </CommandList>
            <div className="flex items-center gap-3 border-t border-border bg-muted/30 px-3 py-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <kbd className="kbd">↑</kbd>
                <kbd className="kbd">↓</kbd> navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="kbd">↵</kbd> instructions
              </span>
              <span className="ml-auto flex items-center gap-1">
                <kbd className="kbd">esc</kbd>
              </span>
            </div>
          </div>

          {/* Instructions — right on desktop, a second view on mobile. */}
          <div className={cn("min-h-0 flex-1 flex-col", selected ? "flex" : "hidden md:flex")}>
            {selected ? (
              <DetailPane item={selected} onBack={() => setSelectedId(null)} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2.5 px-8 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <ChevronRight size={18} />
                </span>
                <p className="text-sm font-medium text-foreground">Pick a process</p>
                <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
                  Its instructions load here, next to the list, so you never have to scroll past the
                  results to read them.
                </p>
              </div>
            )}
          </div>
        </div>
      </CommandDialog>
    </>
  );
};

export default HowToSearch;
