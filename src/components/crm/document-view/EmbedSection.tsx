
import { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { safeParse } from "@/utils/safe-json";
import { PRIMITIVE_REFLEXES } from "@/data/primitive-reflex-data";
import { BRAIN_REFLEX_POINTS } from "@/data/brain-reflex-data";
import {
  CheckCircle2,
  Loader2,
  Baby,
  Zap,
  Dumbbell,
  Brain,
  Activity,
  Heart,
  ShieldAlert,
  Printer,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { showSuccess, showError } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import DocInput from './DocInput';

interface EmbedSectionProps {
  appointment: any;
  saveField: (field: string, value: any) => Promise<void>;
  updatePriorityPattern: (category: string, itemName: string, status: string | null, side?: 'L' | 'R') => Promise<void>;
  onTogglePatternItem: (category: string, name: string, nextStatus: string, side?: 'L' | 'R') => void;
  onUpdate?: () => void;
  /** Live unified pattern from useSessionDocumentState — updates in real-time without refresh */
  liveUnifiedPattern?: Record<string, Record<string, string>>;
  /** Live muscle tests from useSessionDocumentState — provides record IDs for updates */
  liveMuscleTests?: any[];
}

interface RecheckItem {
  id: string;
  name: string;
  category: string;
  type: 'pattern' | 'muscle';
  status: string;
  side?: 'L' | 'R';
  isCleared: boolean;
}

const getCanonicalName = (name: string): string => {
  const cleanName = name.replace(/ \([LR]\)$/, '').trim();
  const lowerClean = cleanName.toLowerCase();
  const reflex = PRIMITIVE_REFLEXES.find(r =>
    r.id.toLowerCase() === lowerClean ||
    r.name.toLowerCase() === lowerClean ||
    r.name.toLowerCase().includes(lowerClean)
  );
  if (reflex) return reflex.name;
  const point = BRAIN_REFLEX_POINTS.find(p =>
    p.id.toLowerCase() === lowerClean ||
    p.name.toLowerCase() === lowerClean ||
    p.name.toLowerCase().split(':')[0].trim() === lowerClean
  );
  if (point) return point.name.split(':')[0].trim();
  return cleanName;
};

const DYSFUNCTIONAL_STATUSES = new Set([
  'Inhibited', 'Inhibition', 'Hypertonic', 'Switching', 'Dysfunctional',
  'Inhibited_Cleared', 'Inhibition_Cleared', 'Hypertonic_Cleared',
  'Switching_Cleared', 'Dysfunctional_Cleared', 'Normotonic_Cleared',
]);

const ACTIVE_INHIBITED = new Set(['Inhibited', 'Inhibition', 'Hypertonic', 'Switching', 'Dysfunctional']);

const EmbedSection = ({
  appointment,
  saveField,
  updatePriorityPattern,
  onTogglePatternItem,
  onUpdate,
  liveUnifiedPattern,
  liveMuscleTests,
}: EmbedSectionProps) => {
  // Fallback-only fetch — only used when liveUnifiedPattern is not provided
  const [ownMuscleTests, setOwnMuscleTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(!liveUnifiedPattern);
  const [clearingId, setClearingId] = useState<string | null>(null);

  const fetchOwnMuscleTests = async () => {
    if (!appointment.id || appointment.id.includes('00000000')) { setLoading(false); return; }
    try {
      const { data, error } = await supabase.from('muscle_tests').select('*').eq('appointment_id', appointment.id);
      if (!error) setOwnMuscleTests(data || []);
    } catch (err) {
      console.error("EmbedSection fallback muscle fetch:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only do the independent fetch when the live data isn't being passed from the hook
    if (!liveUnifiedPattern) {
      fetchOwnMuscleTests();
    } else {
      setLoading(false);
    }
  }, [appointment.id, liveUnifiedPattern]);

  // Resolve which sources to use: live (from hook) vs own fetch (fallback)
  const muscleTests = liveMuscleTests ?? ownMuscleTests;

  // When liveUnifiedPattern is available, derive everything from it.
  // Otherwise, fall back to computing from appointment.priority_pattern + muscleTests.
  const sourcePattern = useMemo((): Record<string, Record<string, string>> => {
    if (liveUnifiedPattern) return liveUnifiedPattern;
    const base = safeParse(appointment.priority_pattern, {} as any);
    if (!base.muscles) base.muscles = {};
    ownMuscleTests.forEach(t => { base.muscles[t.muscle_name] = t.status; });
    return base;
  }, [liveUnifiedPattern, appointment.priority_pattern, ownMuscleTests]);

  // Re-challenge list: all inhibited/hypertonic findings (cleared or not)
  const inhibitedItems = useMemo((): RecheckItem[] => {
    const items: RecheckItem[] = [];

    Object.entries(sourcePattern).forEach(([catKey, categoryItems]) => {
      if (!categoryItems || typeof categoryItems !== 'object') return;

      const isMuscleCategory = catKey === 'muscles';

      Object.entries(categoryItems).forEach(([name, status]) => {
        const strStatus = status as string;
        if (!DYSFUNCTIONAL_STATUSES.has(strStatus)) return;

        const isCleared = strStatus.endsWith('_Cleared') || strStatus === 'Normotonic_Cleared';
        const baseStatus = strStatus.replace('_Cleared', '');
        if (!ACTIVE_INHIBITED.has(baseStatus)) return;

        const sideMatch = name.match(/\(([LR])\)$/);
        const side = sideMatch ? sideMatch[1] as 'L' | 'R' : undefined;
        const baseName = name.replace(/ \([LR]\)$/, '').trim();

        if (isMuscleCategory) {
          // Find the actual DB record for this muscle so we have its ID
          const testRecord = muscleTests.find(t => t.muscle_name === name);
          items.push({
            id: testRecord?.id ?? `muscle-${name}`,
            name: baseName,
            category: 'Muscles',
            type: 'muscle',
            status: baseStatus,
            side,
            isCleared,
          });
        } else {
          items.push({
            id: `${catKey}-${name}`,
            name: getCanonicalName(baseName),
            category: catKey,
            type: 'pattern',
            status: baseStatus,
            side,
            isCleared,
          });
        }
      });
    });

    return items.sort((a, b) => {
      // Cleared items sink to the bottom
      if (a.isCleared !== b.isCleared) return a.isCleared ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
  }, [sourcePattern, muscleTests]);

  // Pathway findings: everything that was ever dysfunctional (for the full review list)
  const allFindings = useMemo(() => {
    const items: { name: string; status: string; category: string }[] = [];

    Object.entries(sourcePattern).forEach(([catKey, categoryItems]) => {
      if (!categoryItems || typeof categoryItems !== 'object') return;
      Object.entries(categoryItems).forEach(([name, status]) => {
        const strStatus = status as string;
        const baseStatus = strStatus.replace('_Cleared', '');
        // Skip completely clear items that were never dysfunctional
        if ((baseStatus === 'Clear' || baseStatus === 'Normotonic') && !strStatus.endsWith('_Cleared')) return;
        const sideMatch = name.match(/\(([LR])\)$/);
        const side = sideMatch ? ` (${sideMatch[1]})` : '';
        const displayName = getCanonicalName(name.replace(/ \([LR]\)$/, '').trim()) + side;
        items.push({ name: displayName, status: strStatus, category: catKey });
      });
    });

    return items.sort((a, b) => a.name.localeCompare(b.name));
  }, [sourcePattern]);

  const clearedCount = inhibitedItems.filter(i => i.isCleared).length;
  const totalCount = inhibitedItems.length;

  const handleClearItem = async (item: RecheckItem) => {
    setClearingId(item.id);
    try {
      if (item.type === 'pattern') {
        const nextStatus = item.isCleared ? 'Inhibited' : 'Inhibited_Cleared';
        await updatePriorityPattern(item.category, item.name, nextStatus === 'Inhibited' ? 'Inhibited' : 'Inhibited', item.side);
        // Use onTogglePatternItem so the hook's local state updates immediately
        onTogglePatternItem(item.category, item.name, item.isCleared ? 'Inhibited' : 'Inhibited_Cleared', item.side);
      } else {
        const nextStatus = item.isCleared ? 'Inhibition' : 'Inhibition_Cleared';
        const { error } = await supabase.from('muscle_tests').update({ status: nextStatus }).eq('id', item.id);
        if (error) throw error;
        onUpdate?.();
      }
      showSuccess(`${item.name} ${item.isCleared ? 'unmarked' : 'marked as cleared'}.`);
    } catch (err) {
      showError("Failed to update finding status.");
    } finally {
      setClearingId(null);
    }
  };

  const getIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('reflex')) return Baby;
    if (cat.includes('nerve')) return Zap;
    if (cat.includes('muscle')) return Dumbbell;
    if (cat.includes('brain') || cat.includes('zone')) return Brain;
    if (cat.includes('heart')) return Heart;
    return Activity;
  };

  const handleFieldChange = (field: string, value: string) => { saveField(field, value); };

  const printHomework = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const clientName = appointment.clients?.name || 'Client';
    const dateStr = appointment.date
      ? new Date(appointment.date).toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : new Date().toLocaleDateString('en-AU');
    const findingsHtml = inhibitedItems.map(item => `
      <tr>
        <td>${item.name}${item.side ? ` (${item.side})` : ''}</td>
        <td>${item.isCleared ? '✓ Cleared' : item.status}</td>
        <td>${item.category.replace(/([A-Z])/g, ' $1').trim()}</td>
      </tr>
    `).join('');
    const homework = appointment.session_north_star || 'No homework prescribed.';
    printWindow.document.write(`
      <html>
        <head><title>Session Summary — ${clientName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: system-ui, -apple-system, sans-serif; padding: 2rem 2.5rem; max-width: 700px; margin: 0 auto; color: #1a1a1a; }
            h1 { font-size: 1.15rem; font-weight: 700; letter-spacing: -0.01em; margin-bottom: 0.2rem; }
            .meta { font-size: 0.7rem; color: #888; margin-bottom: 2rem; border-bottom: 1px solid #eee; padding-bottom: 1rem; }
            table { width: 100%; border-collapse: collapse; font-size: 0.75rem; margin-bottom: 2rem; }
            th { text-align: left; padding: 0.4rem 0.5rem; font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.1em; color: #888; border-bottom: 1px solid #ddd; font-weight: 600; }
            td { padding: 0.4rem 0.5rem; border-bottom: 1px solid #f0f0f0; }
            .homework { margin-top: 2rem; padding-top: 1.5rem; border-top: 2px solid #000; }
            .homework h2 { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.75rem; }
            .homework p { font-size: 0.8rem; line-height: 1.6; white-space: pre-wrap; color: #333; }
            .footer { margin-top: 3rem; font-size: 0.6rem; color: #bbb; text-align: center; text-transform: uppercase; letter-spacing: 0.1em; border-top: 1px solid #f0f0f0; padding-top: 1rem; }
            .cleared { color: #888; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>Session Summary — ${clientName}</h1>
          <p class="meta">${dateStr} · Resonance Kinesiology</p>
          ${inhibitedItems.length > 0 ? `
          <table>
            <thead><tr><th>Finding</th><th>Status</th><th>Category</th></tr></thead>
            <tbody>${findingsHtml}</tbody>
          </table>` : '<p style="font-size:0.75rem;color:#888;margin-bottom:2rem">No findings recorded this session.</p>'}
          <div class="homework">
            <h2>Prescribed Homework</h2>
            <p>${homework}</p>
          </div>
          <p class="footer">${new Date().toLocaleDateString('en-AU')}</p>
          <script>window.print();<\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-12">

      {/* Print Homework — opens a clean print window with findings + homework for client handouts */}
      <div className="flex justify-end -mb-4 print:hidden">
        <button
          onClick={printHomework}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider border border-foreground/20 hover:bg-foreground hover:text-primary-foreground transition-colors"
        >
          <Printer size={12} /> Print Homework
        </button>
      </div>

      {/* 1. Clinical Verification */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-l-4 border-border pl-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Clinical Verification
          </h3>
          {totalCount > 0 && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {clearedCount}/{totalCount} cleared
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground font-medium leading-relaxed">
          Re-challenge all inhibited findings to confirm integration.
        </p>

        {loading ? (
          <div className="py-6 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" size={20} /></div>
        ) : inhibitedItems.length > 0 ? (
          <div className="space-y-2">
            {inhibitedItems.map((item) => {
              const Icon = getIcon(item.category);
              const isClearing = clearingId === item.id;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center justify-between gap-3 p-3 border transition-all",
                    item.isCleared
                      ? "border-emerald-200 bg-emerald-50/20 opacity-70"
                      : "border-rose-200 bg-rose-50/10"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      "w-7 h-7 rounded-md flex items-center justify-center shrink-0",
                      item.isCleared ? "bg-emerald-50 text-chart-emerald" : "bg-rose-50 text-chart-destructive"
                    )}>
                      <Icon size={14} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn(
                          "font-medium text-xs",
                          item.isCleared ? "text-muted-foreground line-through" : "text-foreground"
                        )}>
                          {item.name}
                        </span>
                        {item.side && (
                          <span className="text-[10px] font-semibold uppercase px-1.5 py-0 border border-border text-muted-foreground">
                            {item.side}
                          </span>
                        )}
                        <span className={cn(
                          "text-[10px] font-semibold uppercase tracking-wider",
                          item.isCleared ? "text-chart-emerald" : "text-rose-500"
                        )}>
                          {item.isCleared ? "✓ Cleared" : item.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-medium mt-0.5 capitalize">
                        {item.category.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleClearItem(item)}
                    disabled={isClearing}
                    className={cn(
                      "h-8 px-3 rounded-none border text-[10px] font-semibold uppercase tracking-wider transition-all shrink-0",
                      item.isCleared
                        ? "border-border hover:bg-muted text-muted-foreground"
                        : "border-emerald-500 hover:bg-emerald-600 hover:text-primary-foreground text-emerald-700"
                    )}
                  >
                    {isClearing
                      ? <Loader2 size={12} className="animate-spin" />
                      : item.isCleared ? "Undo" : "Mark Clear"}
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 border border-dashed border-border text-center bg-muted/50">
            <CheckCircle2 className="mx-auto text-emerald-500 mb-2" size={24} />
            <p className="text-xs font-medium text-emerald-800">All Findings Integrated</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">No active inhibitions detected. The system is balanced.</p>
          </div>
        )}
      </div>

      {/* 2. Pathway Findings Review */}
      {allFindings.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground border-l-4 border-border pl-3">
            Pathway Findings
          </h3>
          <p className="text-xs text-muted-foreground font-medium leading-relaxed">
            All findings recorded and their final status.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {allFindings.map((finding) => {
              const isClear = finding.status === 'Clear' || finding.status === 'Normotonic' || finding.status.endsWith('_Cleared');
              return (
                <div
                  key={`${finding.category}-${finding.name}`}
                  className={cn(
                    "p-2.5 border text-[10px] font-medium flex items-center justify-between gap-1",
                    isClear ? "bg-emerald-50/30 border-emerald-100 text-emerald-800" : "bg-rose-50/30 border-rose-100 text-rose-800"
                  )}
                >
                  <span className="truncate">{finding.name}</span>
                  <span className={cn(
                    "text-[7px] font-semibold uppercase tracking-wider px-1.5 py-0.5 shrink-0",
                    isClear ? "bg-emerald-500 text-primary-foreground" : "bg-rose-500 text-primary-foreground"
                  )}>
                    {finding.status.replace('_Cleared', '✓')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Corrections & Logic */}
      <div className="space-y-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground border-l-4 border-border pl-3">
          Corrections & Logic
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Balances Applied</label>
            <div className="p-4 bg-muted/50 border border-border min-h-[90px] text-xs font-mono leading-relaxed text-foreground/80 whitespace-pre-wrap">
              {appointment.modes_balances || <span className="italic text-muted-foreground/50">No corrections logged.</span>}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Acupoints</label>
            <div className="p-4 bg-muted/50 border border-border min-h-[90px] text-xs font-medium text-indigo-700">
              {appointment.acupoints || <span className="italic font-normal text-muted-foreground/50">No acupoints recorded.</span>}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Documentation */}
      <div className="space-y-10 pt-6 border-t border-border">
        <DocInput
          label="Final Re-Assessment & Prescribed Homework"
          value={appointment.session_north_star}
          field="session_north_star"
          placeholder="Verify integration and define the client's daily practice..."
          multiline
          onChange={handleFieldChange}
        />
        <DocInput
          label="General Session Notes"
          value={appointment.notes}
          field="notes"
          placeholder="Any additional observations or context..."
          multiline
          onChange={handleFieldChange}
        />
        <DocInput
          label="Practitioner Reflection (Private)"
          value={appointment.journal}
          field="journal"
          placeholder="Personal insights for Identity Work..."
          multiline
          onChange={handleFieldChange}
        />
      </div>
    </div>
  );
};

export default EmbedSection;
