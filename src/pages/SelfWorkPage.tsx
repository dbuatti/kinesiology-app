import { useState } from "react";
import { Heart, Info, Zap, ChevronRight, Sparkles, Brain } from "lucide-react";
import AppLayout from "@/components/crm/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EmotionalIntegrationProcess from "@/components/crm/EmotionalIntegrationProcess";
import { cn } from "@/lib/utils";

export default function SelfWorkPage() {
  const [showInfo, setShowInfo] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  return (
    <AppLayout variant="workspace">
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-28 sm:pb-6 max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-xl font-semibold tracking-tight text-foreground">Self Work</h1>
            <p className="text-xs text-muted-foreground">Personal emotional-integration practice.</p>
          </div>
          <button
            onClick={() => setShowInfo((s) => !s)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-card border border-border shadow-sm text-muted-foreground hover:text-primary transition-colors"
            aria-label="Info / Knowledge"
            title="How this process works"
          >
            <Info size={16} />
          </button>
        </div>

        {/* Knowledge / Insights panel (i button toggle) */}
        {showInfo && (
          <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <h2 className="font-medium text-sm flex items-center gap-2 text-foreground">
              <Sparkles size={14} className="text-amber-500" /> How this works
            </h2>
            <ul className="space-y-2 text-[11px] leading-relaxed text-muted-foreground">
              <li><strong>ESR Indicator Check</strong> — Hold GB14 (forehead). A weak or inhibited muscle = emotional work indicated.</li>
              <li><strong>Permission</strong> — Always ask permission for deep emotional layers.</li>
              <li><strong>Timeline</strong> — Current (known stress) or Historic (past event / trauma with age regression).</li>
              <li><strong>Emotion → Organ → Muscle</strong> — Select primary emotion, then linked organ, then eye position.</li>
              <li><strong>Correction</strong> — Re-challenge with ESR after correction; re-check eye position.</li>
            </ul>
            <div className="flex gap-2 pt-1">
              <Badge variant="outline" className="text-[10px] bg-card">ESR</Badge>
              <Badge variant="outline" className="text-[10px] bg-card">Eye Position</Badge>
              <Badge variant="outline" className="text-[10px] bg-card">Timeline</Badge>
            </div>
          </div>
        )}

        {/* Process */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
            <Heart size={16} className="text-rose-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Emotions</span>
            <Badge className="ml-auto text-[9px] bg-primary/10 text-primary-strong border-none">Self Practice</Badge>
          </div>
          <div className="p-3">
            <EmotionalIntegrationProcess
              onSave={(summary) => { setResult(summary); }}
              onInhibited={() => { setResult("Still inhibited — down-regulate first (Harmonic Rocking / Vagus)."); }}
              onCancel={() => { setResult(null); }}
            />
          </div>
        </div>

        {/* Result / log */}
        {result && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-2 animate-in fade-in duration-300">
            <h3 className="font-medium text-sm text-emerald-800 flex items-center gap-2">
              <Zap size={16} /> Saved to session log
            </h3>
            <p className="text-xs text-emerald-700 leading-relaxed">{result}</p>
            <Button size="sm" variant="outline" className="rounded-lg text-xs h-8" onClick={() => setResult(null)}>
              Clear log
            </Button>
          </div>
        )}

        {/* Footer/mobile nav hint */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground/60 pt-2">
          <span>Self Work — mobile-friendly emotional process</span>
          <a href="/settings" className="underline hover:text-foreground transition-colors">Back to settings →</a>
        </div>
      </div>
    </AppLayout>
  );
}
