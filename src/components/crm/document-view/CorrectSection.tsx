
import { useMemo, useState, useEffect, useRef } from 'react'; import type { ReactNode } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Zap, BookOpen, ExternalLink, Info, CheckCircle2, Sparkles, Brain, Activity, Heart, ShieldAlert, Wind, Droplets, ArrowDownCircle, ArrowUpCircle, Layers, Copy, Check, History, Trash2, ArrowLeftRight } from 'lucide-react';
import DocInput from './DocInput';
import { cn } from '@/lib/utils';
import { AFFERENT_PATHWAYS, EFFERENT_PATHWAYS } from '@/data/pathway-logic-data';
import { Button } from '@/components/ui/button';
import { showSuccess, showError } from '@/utils/toast';
import ConfirmDialog from "@/components/shared/ConfirmDialog";

interface CorrectSectionProps {
  metadata: any;
  acupoints: string | null | undefined;
  brainZoneOptions: { id: string; name: string; category: string }[];
  inhibitedFindings: string[];
  updateMetadataFields: (updates: Record<string, any>) => Promise<void>;
  saveField: (field: string, value: any) => Promise<void>;
  onTogglePatternItem: (category: string, name: string, nextStatus: string, side?: 'L' | 'R') => void;
  appointment: any;
}

const NOCICEPTIVE_PROTOCOL = {
  id: 'Nociceptive',
  label: 'Nociceptive Threat',
  direction: 'Afferent (Bottom-Up)',
  icon: ShieldAlert,
  color: 'text-orange-500',
  description: 'Clearing threat from scars, old injuries, or specific movements via the spinothalamic tract to the thalamus.',
  protocols: [
    'Identify the known site (scar, old injury, impact, or surgical site).',
    'Confirm nociception: compression over site down-regulates the signal momentarily (5-10s), muscle locks.',
    'Distinguish from mechano: stretch = mechanoreception, light/crude touch = nociception.',
    'Client holds thalamus point (Bl9/occipitalis) + practitioner re-applies the aggravating stimulus.',
    'Stack collateral inputs: look at the site + breathe fast (sympathetics) + think of the suffering.',
    'Tuning fork + rocking to integrate (piezoelectric reset).',
    'Reassess: site no longer inhibits, associated muscle restored.'
  ]
};

// Helper to parse a logged correction string back into wizard fields
const parseCorrectionString = (str: string) => {
  const cleanStr = str.replace(/^[-*\s]+/, '').trim();
  
  // Extract Direction
  let direction: string | null = null;
  if (cleanStr.startsWith('Afferent')) direction = 'Afferent';
  else if (cleanStr.startsWith('Efferent')) direction = 'Efferent';

  // Extract Finding and System
  // Format: "Direction Correction: Finding (System) ->"
  const mainRegex = /^(?:Afferent|Efferent)\s+Correction:\s*([^\(->]+)(?:\s*\(([^)]+)\))?\s*(?:->)?/i;
  const mainMatch = cleanStr.match(mainRegex);
  
  const finding = mainMatch ? mainMatch[1].trim() : "";
  const system = mainMatch && mainMatch[2] ? mainMatch[2].trim() : null;

  // Extract Coordinates
  // Format: "-> Coord1 + Coord2 via" or "-> Coord1 via"
  const coordRegex = /->\s*([^\[]+?)(?:\s*via|\s*\[|$)/i;
  const coordMatch = cleanStr.match(coordRegex);
  const coordsStr = coordMatch ? coordMatch[1].trim() : "";
  
  let coord1Name: string | null = null;
  let coord1Side: string | null = null;
  let coord2Name: string | null = null;
  let coord2Side: string | null = null;

  if (coordsStr) {
    const parts = coordsStr.split('+').map(p => p.trim());
    
    const parseCoord = (part: string) => {
      const sideMatch = part.match(/^(Left|Right|Bilateral)\s+(.+)$/i);
      if (sideMatch) {
        return { side: sideMatch[1], name: sideMatch[2] };
      }
      return { side: 'Bilateral', name: part };
    };

    if (parts[0]) {
      const c1 = parseCoord(parts[0]);
      coord1Side = c1.side;
      coord1Name = c1.name;
    }
    if (parts[1]) {
      const c2 = parseCoord(parts[1]);
      coord2Side = c2.side;
      coord2Name = c2.name;
    }
  }

  // Extract Method
  const methodRegex = /via\s+([^\[]+)/i;
  const methodMatch = cleanStr.match(methodRegex);
  const method = methodMatch ? methodMatch[1].trim() : null;

  // Extract Polarity
  const polarityRegex = /\[Polarity:\s*([^\]]+)\]/i;
  const polarityMatch = cleanStr.match(polarityRegex);
  const polarity = polarityMatch ? polarityMatch[1].trim() : null;

  return {
    wizard_direction: direction,
    wizard_finding: finding,
    wizard_system: system,
    wizard_coord1_name: coord1Name,
    wizard_coord1_side: coord1Side,
    wizard_coord2_name: coord2Name,
    wizard_coord2_side: coord2Side,
    wizard_polarity: polarity,
    wizard_method: method
  };
};

const CorrectSectionProtocolBlock = ({ title, icon: Icon, color, steps, desc, children }: { title: string, icon: any, color: string, steps: string[], desc?: string, children?: ReactNode }) => (
  <div className="p-5 bg-muted border border-border rounded-xl space-y-3">
    <div className="flex items-center gap-2">
      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-primary-foreground", color)}>
        <Icon size={14} />
      </div>
      <h5 className="text-xs font-semibold uppercase tracking-tight">{title}</h5>
    </div>
    {desc && <p className="text-[11px] text-muted-foreground italic leading-relaxed">"{desc}"</p>}
    <div className="space-y-1.5">
      {steps.map((step, idx) => (
        <div key={step} className="flex gap-2 items-start text-[11px] leading-relaxed text-foreground/80">
          <span className="font-semibold text-foreground shrink-0">{idx + 1}.</span>
          <p className="font-medium">{step}</p>
        </div>
      ))}
    </div>
    {children}
  </div>
);

const CorrectSection = ({ 
  metadata, 
  acupoints, 
  brainZoneOptions, 
  inhibitedFindings,
  updateMetadataFields, 
  saveField,
  onTogglePatternItem,
  appointment
}: CorrectSectionProps) => {
  const corticalOptions = useMemo(() => brainZoneOptions.filter(o => o.category === 'Cortical'), [brainZoneOptions]);
  const subcorticalOptions = useMemo(() => brainZoneOptions.filter(o => o.category === 'Subcortical'), [brainZoneOptions]);

  const [showCustomInput, setShowCustomInput] = useState(() => {
    if (!metadata.wizard_finding) return false;
    return !inhibitedFindings.includes(metadata.wizard_finding);
  });

  const [localFinding, setLocalFinding] = useState(metadata.wizard_finding || "");
  const [isFindingFocused, setIsFindingFocused] = useState(false);
  const findingDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  const [copied, setCopied] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{index: number} | null>(null);

  // Parse past corrections from modes_balances
  const pastCorrections = useMemo(() => {
    if (!appointment.modes_balances) return [];
    return appointment.modes_balances
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0);
  }, [appointment.modes_balances]);

  const handleCopyWizard = () => {
    const direction = metadata.wizard_direction || "Unknown Direction";
    const system = metadata.wizard_system || "Unknown System";
    const coord1 = metadata.wizard_coord1_name ? `${metadata.wizard_coord1_side || ""} ${metadata.wizard_coord1_name}`.trim() : "None";
    const coord2 = metadata.wizard_coord2_name ? `${metadata.wizard_coord2_side || ""} ${metadata.wizard_coord2_name}`.trim() : "None";
    const polarity = metadata.wizard_polarity ? `Polarity: ${metadata.wizard_polarity}` : "None";
    const method = metadata.wizard_method ? `Method: ${metadata.wizard_method}` : "None";
    const finding = metadata.wizard_finding || "None";

    const text = `LOFI CALIBRATION WIZARD REPORT
---------------------------------
Target Finding: ${finding}
Pathway Direction: ${direction}
Specific System: ${system}
Coordinate 1: ${coord1}
Coordinate 2: ${coord2}
Polarity: ${polarity}
Correction Method: ${method}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    showSuccess("Wizard configuration copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopySingleLog = (text: string, index: number) => {
    const cleanText = text.replace(/^[-*\s]+/, '').trim();
    navigator.clipboard.writeText(cleanText);
    setCopiedIndex(index);
    showSuccess("Correction copied to clipboard!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleLoadSingleLog = async (text: string) => {
    try {
      const parsedFields = parseCorrectionString(text);
      await updateMetadataFields(parsedFields);
      setShowLog(false);
      showSuccess("Correction loaded into Wizard!");
    } catch (err) {
      showError("Failed to parse and load correction.");
    }
  };

  const executeDeleteLog = async () => {
    if (deleteTarget === null) return;
    const indexToDelete = deleteTarget.index;
    setDeleteTarget(null);
    
    try {
      const updatedLogs = pastCorrections.filter((_, idx) => idx !== indexToDelete);
      const updatedText = updatedLogs.join('\n');
      await saveField('modes_balances', updatedText === "" ? null : updatedText);
      showSuccess("Correction removed from log.");
    } catch (err) {
      showError("Failed to delete correction.");
    }
  };

  useEffect(() => {
    if (metadata.wizard_finding && !inhibitedFindings.includes(metadata.wizard_finding)) {
      setShowCustomInput(true);
    } else {
      setShowCustomInput(false);
    }
  }, [metadata.wizard_finding, inhibitedFindings]);

  useEffect(() => {
    if (!isFindingFocused) {
      setLocalFinding(metadata.wizard_finding || "");
    }
  }, [metadata.wizard_finding, isFindingFocused]);

  const handleFindingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalFinding(val);
    
    if (findingDebounceTimer.current) clearTimeout(findingDebounceTimer.current);
    findingDebounceTimer.current = setTimeout(() => {
      updateMetadataFields({ wizard_finding: val });
    }, 1000);
  };

  const handleFindingBlur = () => {
    setIsFindingFocused(false);
    if (findingDebounceTimer.current) clearTimeout(findingDebounceTimer.current);
    updateMetadataFields({ wizard_finding: localFinding });
  };

  // Find active protocol based on selection
  const activeProtocol = useMemo(() => {
    if (!metadata.wizard_system) return null;
    
    if (metadata.wizard_system === 'Nociceptive') {
      return NOCICEPTIVE_PROTOCOL;
    }

    const allPathways = [...AFFERENT_PATHWAYS, ...EFFERENT_PATHWAYS];
    return allPathways.find(p => p.id.toLowerCase().includes(metadata.wizard_system.toLowerCase()) || metadata.wizard_system.toLowerCase().includes(p.id.toLowerCase()));
  }, [metadata.wizard_system]);

  const handleLogCorrection = async () => {
    if (!metadata.wizard_finding) {
      showError("Please select a target finding first.");
      return;
    }

    const direction = metadata.wizard_direction || "Unknown Direction";
    const system = metadata.wizard_system || "";
    const coord1 = metadata.wizard_coord1_name ? `${metadata.wizard_coord1_side || ""} ${metadata.wizard_coord1_name}`.trim() : "";
    const coord2 = metadata.wizard_coord2_name ? `${metadata.wizard_coord2_side || ""} ${metadata.wizard_coord2_name}`.trim() : "";
    const polarity = metadata.wizard_polarity ? `Polarity: ${metadata.wizard_polarity}` : "";
    const method = metadata.wizard_method ? `via ${metadata.wizard_method}` : "";
    
    let summary = `${direction} Correction: ${metadata.wizard_finding}`;
    if (system) summary += ` (${system})`;
    if (coord1 || coord2) {
      summary += ` -> ${[coord1, coord2].filter(Boolean).join(' + ')}`;
    }
    if (method) summary += ` ${method}`;
    if (polarity) summary += ` [${polarity}]`;

    // Append to existing modes_balances
    const currentBalances = appointment.modes_balances || "";
    const updatedBalances = currentBalances 
      ? `${currentBalances}\n- ${summary}`
      : `- ${summary}`;

    try {
      await saveField('modes_balances', updatedBalances);
      
      // Find category and clear the item
      let category = 'muscles';
      const sideMatch = metadata.wizard_finding.match(/\(([LR])\)$/);
      const side = sideMatch ? sideMatch[1] as 'L' | 'R' : undefined;
      const baseName = metadata.wizard_finding.replace(/ \([LR]\)$/, '').trim();

      if (appointment.priority_pattern) {
        try {
          const pattern = JSON.parse(appointment.priority_pattern);
          Object.keys(pattern).forEach(cat => {
            if (pattern[cat][metadata.wizard_finding]) {
              category = cat;
            }
          });
        } catch (e) {}
      }

      onTogglePatternItem(category, baseName, 'Clear', side);
      showSuccess(`Logged correction for "${metadata.wizard_finding}"!`);
    } catch (err) {
      showError("Failed to log correction.");
    }
  };

  return (
    <div className="space-y-12">
      {/* Interactive Wizard Card */}
      <div className="p-8 border-2 border-foreground/20 space-y-8 bg-card">
        <div className="flex items-center justify-between border-b border-foreground/20 pb-3">
          <div className="flex items-center gap-2">
            <Zap size={20} className="text-foreground" />
            <h3 className="text-sm font-semibold uppercase tracking-wider">
              {showLog ? "Calibration Log" : "Lofi Calibration Wizard"}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLog(!showLog)}
              className="h-8 px-3 rounded-md border border-foreground/20 hover:bg-foreground hover:text-primary-foreground transition-all text-[10px] font-semibold uppercase tracking-wider gap-1.5"
            >
              <History size={12} />
              {showLog ? "Show Wizard" : `View Log (${pastCorrections.length})`}
            </Button>
            {!showLog && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyWizard}
                className="h-8 w-8 rounded-md border border-foreground/20 hover:bg-foreground hover:text-primary-foreground transition-all"
                title="Copy wizard configuration to clipboard"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </Button>
            )}
          </div>
        </div>

        {showLog ? (
          /* FLIPPED LOG VIEW */
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
            {pastCorrections.length > 0 ? (
              <div className="divide-y divide-slate-100 border border-foreground/20">
                {pastCorrections.map((correction, idx) => (
                  <div key={`${idx}-${correction.slice(0, 40)}`} className="p-4 flex items-center justify-between gap-4 hover:bg-muted transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono font-medium text-foreground leading-relaxed break-words">
                        {correction.replace(/^[-*\s]+/, '')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLoadSingleLog(correction)}
                        className="h-8 px-3 rounded-md border border-foreground/20 hover:bg-foreground hover:text-primary-foreground text-[10px] font-semibold uppercase tracking-wider"
                      >
                        Load
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopySingleLog(correction, idx)}
                        className="h-8 w-8 rounded-md border border-border hover:bg-muted"
                        title="Copy this correction"
                      >
                        {copiedIndex === idx ? <Check size={12} className="text-chart-emerald" /> : <Copy size={12} />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget({index: idx})}
                        className="h-8 w-8 rounded-md border border-rose-100 text-chart-destructive hover:bg-rose-50"
                        title="Delete this correction"
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-border">
                <History className="mx-auto text-muted-foreground/50 mb-3" size={32} />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">No corrections logged yet</p>
                <p className="text-[10px] text-muted-foreground mt-1">Use the wizard to calibrate and log your first finding.</p>
              </div>
            )}
          </div>
        ) : (
          /* STANDARD WIZARD VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Target & Direction */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Target Finding</label>
                <select 
                  value={showCustomInput ? "CUSTOM_INPUT" : (metadata.wizard_finding || "")}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "CUSTOM_INPUT") {
                      setShowCustomInput(true);
                      setLocalFinding("");
                      updateMetadataFields({ wizard_finding: "" });
                    } else {
                      setShowCustomInput(false);
                      updateMetadataFields({ wizard_finding: val });
                    }
                  }}
                  className="w-full bg-transparent border-b border-border py-1.5 text-sm font-medium focus:border-foreground/20 outline-none transition-all"
                >
                  <option value="" className="text-muted-foreground">Select inhibited finding...</option>
                  {inhibitedFindings.map(finding => (
                    <option key={finding} value={finding} className="text-foreground font-medium">
                      {finding}
                    </option>
                  ))}
                  <option value="CUSTOM_INPUT" className="text-chart-primary font-medium">+ Custom Entry...</option>
                </select>

                {showCustomInput && (
                  <input 
                    type="text"
                    value={localFinding}
                    onChange={handleFindingChange}
                    onFocus={() => setIsFindingFocused(true)}
                    onBlur={handleFindingBlur}
                    className="w-full bg-transparent border-b border-border py-1.5 text-sm font-medium focus:border-foreground/20 outline-none transition-all mt-2 animate-in slide-in-from-top-1"
                    placeholder="Type custom finding..."
                  />
                )}
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pathway Direction</label>
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="dir-afferent"
                      checked={metadata.wizard_direction === 'Afferent'}
                      onCheckedChange={(checked) => {
                        updateMetadataFields({
                          wizard_direction: checked ? 'Afferent' : null,
                          wizard_system: null // Reset system on direction change
                        });
                      }}
                      className="h-4 w-4 border-foreground/20 rounded-none data-[state=checked]:bg-foreground"
                    />
                    <label htmlFor="dir-afferent" className="text-xs font-medium cursor-pointer">Afferent (Bottom-Up)</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="dir-efferent"
                      checked={metadata.wizard_direction === 'Efferent'}
                      onCheckedChange={(checked) => {
                        updateMetadataFields({
                          wizard_direction: checked ? 'Efferent' : null,
                          wizard_system: null // Reset system on direction change
                        });
                      }}
                      className="h-4 w-4 border-foreground/20 rounded-none data-[state=checked]:bg-foreground"
                    />
                    <label htmlFor="dir-efferent" className="text-xs font-medium cursor-pointer">Efferent (Top-Down)</label>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Specific System</label>
                {metadata.wizard_direction === 'Afferent' ? (
                  <div className="grid grid-cols-2 gap-2">
                    {['Mechanoreceptor', 'Nociceptive', 'Physiological'].map(sys => (
                      <div key={sys} className="flex items-center gap-2">
                        <Checkbox 
                          id={`sys-${sys}`}
                          checked={metadata.wizard_system === sys}
                          onCheckedChange={(checked) => updateMetadataFields({ wizard_system: checked ? sys : null })}
                          className="h-4 w-4 border-foreground/20 rounded-none data-[state=checked]:bg-foreground"
                        />
                        <label htmlFor={`sys-${sys}`} className="text-xs font-medium cursor-pointer">{sys}</label>
                      </div>
                    ))}
                  </div>
                ) : metadata.wizard_direction === 'Efferent' ? (
                  <div className="grid grid-cols-2 gap-2">
                    {['Cortical', 'Subcortical', 'Emotional'].map(sys => (
                      <div key={sys} className="flex items-center gap-2">
                        <Checkbox 
                          id={`sys-${sys}`}
                          checked={metadata.wizard_system === sys}
                          onCheckedChange={(checked) => updateMetadataFields({ wizard_system: checked ? sys : null })}
                          className="h-4 w-4 border-foreground/20 rounded-none data-[state=checked]:bg-foreground"
                        />
                        <label htmlFor={`sys-${sys}`} className="text-xs font-medium cursor-pointer">{sys}</label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Select a pathway direction first.</p>
                )}
              </div>
            </div>

            {/* Right Column: Coordinates & Polarity */}
            <div className="space-y-6">
              <div className="space-y-4 border-l-2 border-border/50 pl-4">
                <div className="flex items-center justify-between border-b border-border/50 pb-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Calibration Coordinates</p>
                  <a 
                    href="/resources/brain-zones/print" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] font-semibold text-chart-primary hover:text-indigo-800 hover:underline uppercase tracking-wider flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink size={10} /> View Brain Zone Map
                  </a>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase text-muted-foreground">Coordinate 1 (Zone Name)</label>
                  <select 
                    value={metadata.wizard_coord1_name || ""}
                    onChange={(e) => updateMetadataFields({ wizard_coord1_name: e.target.value })}
                    className="w-full bg-transparent border-b border-border py-1.5 text-xs font-medium focus:border-foreground/20 outline-none transition-all"
                  >
                    <option value="" className="text-muted-foreground">Select Zone...</option>
                    <optgroup label="Cortical Brain Zones">
                      {corticalOptions.map(option => (
                        <option key={`c1-${option.id}`} value={option.name} className="text-foreground font-medium">
                          {option.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Subcortical Brain Zones">
                      {subcorticalOptions.map(option => (
                        <option key={`c1-${option.id}`} value={option.name} className="text-foreground font-medium">
                          {option.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <div className="flex gap-4 pt-1">
                    {['Left', 'Right', 'Bilateral'].map(side => (
                      <div key={side} className="flex items-center gap-1.5">
                        <Checkbox 
                          id={`c1-side-${side}`}
                          checked={metadata.wizard_coord1_side === side}
                          onCheckedChange={(checked) => updateMetadataFields({ wizard_coord1_side: checked ? side : null })}
                          className="h-3.5 w-3.5 border-foreground/20 rounded-none data-[state=checked]:bg-foreground"
                        />
                        <label htmlFor={`c1-side-${side}`} className="text-[10px] font-medium cursor-pointer">{side}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-[10px] font-semibold uppercase text-muted-foreground">Coordinate 2 (Zone Name)</label>
                  <select 
                    value={metadata.wizard_coord2_name || ""}
                    onChange={(e) => updateMetadataFields({ wizard_coord2_name: e.target.value })}
                    className="w-full bg-transparent border-b border-border py-1.5 text-xs font-medium focus:border-foreground/20 outline-none transition-all"
                  >
                    <option value="" className="text-muted-foreground">Select Zone...</option>
                    <optgroup label="Cortical Brain Zones">
                      {corticalOptions.map(option => (
                        <option key={`c2-${option.id}`} value={option.name} className="text-foreground font-medium">
                          {option.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Subcortical Brain Zones">
                      {subcorticalOptions.map(option => (
                        <option key={`c2-${option.id}`} value={option.name} className="text-foreground font-medium">
                          {option.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <div className="flex gap-4 pt-1">
                    {['Left', 'Right', 'Bilateral'].map(side => (
                      <div key={side} className="flex items-center gap-1.5">
                        <Checkbox 
                          id={`c2-side-${side}`}
                          checked={metadata.wizard_coord2_side === side}
                          onCheckedChange={(checked) => updateMetadataFields({ wizard_coord2_side: checked ? side : null })}
                          className="h-3.5 w-3.5 border-foreground/20 rounded-none data-[state=checked]:bg-foreground"
                        />
                        <label htmlFor={`c2-side-${side}`} className="text-[10px] font-medium cursor-pointer">{side}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!showLog && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-border/50">
              <div className="space-y-3">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Polarity</label>
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="pol-in"
                      checked={metadata.wizard_polarity === 'IN'}
                      onCheckedChange={(checked) => updateMetadataFields({ wizard_polarity: checked ? 'IN' : null })}
                      className="h-4 w-4 border-foreground/20 rounded-none data-[state=checked]:bg-foreground"
                    />
                    <label htmlFor="pol-in" className="text-xs font-medium cursor-pointer">Energy IN (+)</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="pol-out"
                      checked={metadata.wizard_polarity === 'OUT'}
                      onCheckedChange={(checked) => updateMetadataFields({ wizard_polarity: checked ? 'OUT' : null })}
                      className="h-4 w-4 border-foreground/20 rounded-none data-[state=checked]:bg-foreground"
                    />
                    <label htmlFor="pol-out" className="text-xs font-medium cursor-pointer">Energy OUT (-)</label>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Correction Method</label>
                <div className="flex flex-wrap gap-4">
                  {['Tapping', 'Holding + Intention', 'Tuning Fork'].map(method => (
                    <div key={method} className="flex items-center gap-2">
                      <Checkbox 
                        id={`method-${method}`}
                        checked={metadata.wizard_method === method}
                        onCheckedChange={(checked) => updateMetadataFields({ wizard_method: checked ? method : null })}
                        className="h-4 w-4 border-foreground/20 rounded-none data-[state=checked]:bg-foreground"
                      />
                      <label htmlFor={`method-${method}`} className="text-xs font-medium cursor-pointer">{method}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Log Correction Button */}
            <div className="pt-6 border-t border-border/50 flex justify-between items-center">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Ready to log this correction?
              </p>
              <Button
                onClick={handleLogCorrection}
                disabled={!metadata.wizard_finding}
                className="bg-foreground text-background hover:bg-foreground/90 rounded-none h-10 px-6 font-semibold text-[10px] uppercase tracking-wider shadow-lg"
              >
                <CheckCircle2 size={14} className="mr-2" /> Log Correction
              </Button>
            </div>
          </>
        )}
      </div>

      {/* AFFERENT PROTOCOLS SECTION */}
      <div id="c-afferent" className="space-y-6 scroll-mt-24">
        <div className="flex items-center gap-2 border-b border-foreground/20 pb-2">
          <ArrowDownCircle size={16} className="text-primary" />
          <h4 className="text-sm font-semibold uppercase tracking-wider text-primary">Afferent (Bottom-Up) Protocols</h4>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div id="c-mechano">
            <CorrectSectionProtocolBlock 
              title="Mechanoreceptor (Unconscious)"
              icon={Activity}
              color="bg-primary"
              desc="Unconscious mechanoreception — Golgi receptors in ligaments, tendons and fascia report joint stretch to the cerebellum via the spinocerebellar tract (~85% of unconscious input)."
              steps={[
                "Confirm: inhibited DM → state afferent (facilitates) → X card 5-10s (facilitates) → GV16 TL confirms",
                "Localise: strong indicator + GV16 TL → bracket region → side → joint → touch ligament",
                "Find stretch direction: stretch ligament in different directions — the one that inhibits the indicator",
                "Correct: hold GV16 + stretch in direction + tuning fork on bone (+ rocking) — piezoelectric reset",
                "Re-test original muscle → facilitates ✓"
              ]}
            />
          </div>

          <div id="c-physiological">
            <CorrectSectionProtocolBlock 
              title="Physiological"
              icon={Droplets}
              color="bg-emerald-500"
              desc="Biochemical, nutritional, and organ-based signals. Addresses systemic imbalances."
              steps={[
                "Address biochemical or organ-specific reflexes",
                "Check for nutritional or hydration priorities",
                "Use specific neurolymphatic or neurovascular points",
                "Consider meridian-based corrections"
              ]}
            />
          </div>

          <div id="c-nociceptive">
            <CorrectSectionProtocolBlock 
              title="Nociceptive Threat"
              icon={ShieldAlert}
              color="bg-orange-500"
              desc="Threat detection via the spinothalamic tract (anterolateral system). Nociceptors are threat receptors in every tissue, terminating at the thalamus. A-delta (fast) and C-fibre (slow) pathways."
              steps={[
                "Identify the known site (scar, old injury, impact, or surgical site).",
                "Confirm nociception: compression over site down-regulates the signal momentarily (5-10s), muscle locks.",
                "Hold thalamus point (Bl9/occipitalis) + re-apply the aggravating stimulus (light crude touch, joint impact, or pinch).",
                "Stack collateral inputs: look at the site + breathe fast (sympathetics) + think of the suffering.",
                "Tuning fork + rocking to integrate (piezoelectric reset).",
                "Reassess: site no longer inhibits, associated muscle restored."
              ]}
            />
          </div>
        </div>
      </div>

      {/* EFFERENT PROTOCOLS SECTION */}
      <div id="c-efferent" className="space-y-6 scroll-mt-24">
        <div className="flex items-center gap-2 border-b border-foreground/20 pb-2">
          <ArrowUpCircle size={16} className="text-purple-600" />
          <h4 className="text-sm font-semibold uppercase tracking-wider text-purple-600">Efferent (Top-Down) Protocols</h4>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div id="c-cortical">
            <CorrectSectionProtocolBlock 
              title="Cortical (Top-Down)"
              icon={Brain}
              color="bg-purple-500"
              desc="Intentional, cognitive, and motor planning processes. Contralateral logic: right cortex controls left body."
              steps={[
                "Identify primary cortical zone (PFC, M1, S1, etc.) and lateralize",
                "Identify secondary zone (cortical or subcortical)",
                "Apply correction: Tapping (3-5s), Holding + Intention (until pulse), or Tuning Fork",
                "Include pathway name during intention: 'Left Psoas, Right PFC, Left Limbic'"
              ]}
            />
          </div>

          <div id="c-subcortical">
            <CorrectSectionProtocolBlock 
              title="Subcortical (Autonomic)"
              icon={Layers}
              color="bg-amber-500"
              desc="Automatic, reflexive, and autonomic regulation. Ipsilateral logic: left cerebellum controls left body."
              steps={[
                "Identify subcortical zone (Limbic, Cerebellum, Hypothalamus, etc.)",
                "Lateralize response (Left = historical trauma, Right = current processing)",
                "Use rhythmic movements or breathing patterns",
                "Apply correction method: Tapping, Holding + Intention, or Tuning Fork"
              ]}
            />
          </div>

          <div id="c-emotional">
            <CorrectSectionProtocolBlock 
              title="Emotional (Neuro-Emotional Integration)"
              icon={Heart}
              color="bg-rose-500"
              desc="Limbic system and emotional processing. Standard 9-Step Clinical Protocol to identify, process, and clear trapped emotional charges."
              steps={[
                "ESR Indicator Check: Hold Frontal Lobe (ESR) points (GB14) to see if the system is ready for emotional work.",
                "Permission Check: Always ask: 'Do we have permission to correct this?' If denied, perform Harmonic Rocking first.",
                "Timeline Selection: Determine if the stress is Current (happening now) or Historic (past event).",
                "Timeline Regression: If historic, narrow down the specific age and month of origin using the indicator muscle.",
                "Primary Emotion: Identify the core feeling: Hurt (Fire), Worry (Earth), Sadness (Metal), Fear (Water), or Anger (Wood).",
                "Priority Organ: Find the organ acting as a surrogate for the charge. This MUST be an organ related to the emotion's element from Step 5 (Wood: LV/GB, Fire: HT/SI, East: SP/ST, Metal: LU/LI, Water: KI/BL).",
                "Energy Polarity: Challenge for Energy IN (+) or Energy OUT (-). Usually OUT to release stress.",
                "Eye Position (NLP Logic): Identify the sensory access point for the stress (Up/Left: Visual Memory, Horiz/Left: Auditory Memory, Down/Left: Internal Monologue, Up/Right: Visual Constructed, Horiz/Right: Auditory Constructed, Down/Right: Kinesthetic/Felt Sense).",
                "Correction & Upload: Hold ESR + Pulse Point + Eye Position. Replay stress until shift (yawn, sigh, swallow, gurgle, deep breath), then upload positive state."
              ]}
            >
              <div className="p-4 bg-card rounded-xl border border-border space-y-2 text-[11px] leading-relaxed text-foreground/80">
                <div className="flex items-center gap-2 mb-1">
                  <Info size={14} className="text-chart-primary" />
                  <span className="font-semibold uppercase text-[10px] text-chart-primary">Clinical Mastery Note</span>
                </div>
                <p className="italic">
                  "The shift occurs when the client can distinguish between the 'me' (the observer) and the 'not-me' (the identity/emotion). Always wait for a clear parasympathetic response: Yawning, Sighing, Swallowing, Gurgling, or a spontaneous Deep Breath before proceeding to the Positive Upload."
                </p>
                <p className="mt-2">
                  <strong>Pulse Point Tip:</strong> Hold the pulse point corresponding to the priority organ identified in Step 6. Use light pressure for Yang organs and deep pressure for Yin organs.
                </p>
              </div>
            </CorrectSectionProtocolBlock>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete this logged correction?"
        description="Are you sure you want to delete this logged correction?"
        onConfirm={executeDeleteLog}
      />
    </div>
  );
};

export default CorrectSection;