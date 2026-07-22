
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BrainReflexPoint } from "@/data/brain-reflex-data";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface BrainReflexModalProps {
  point: BrainReflexPoint | null;
  primaryUrl: string | null;
  secondaryUrl: string | null;
  tertiaryUrl?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BrainReflexModal = ({ 
  point, 
  primaryUrl, 
  secondaryUrl, 
  tertiaryUrl,
  open, 
  onOpenChange 
}: BrainReflexModalProps) => {
  if (!point) return null;

  const categoryAccent = point.category === 'Cortical' 
    ? 'text-violet-600 bg-violet-50 border-violet-200' 
    : point.category === 'Subcortical'
    ? 'text-indigo-600 bg-indigo-50 border-indigo-200'
    : 'text-emerald-600 bg-emerald-50 border-emerald-200';

  const showImages = primaryUrl || secondaryUrl || tertiaryUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[85vh] rounded-xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1.5">
              <div className="flex items-center gap-2">
                <Badge className={cn("text-[10px] font-semibold px-2 py-0 border", categoryAccent)}>
                  {point.category}
                </Badge>
                <Badge variant="outline" className="text-[10px] font-medium text-muted-foreground px-2 py-0 border-border">
                  {point.lateralization}
                </Badge>
              </div>
              <DialogTitle className="text-lg font-semibold tracking-tight">{point.name}</DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto flex-1">
          <div className="divide-y divide-border">
            {/* Location & Stimulus */}
            <div className="grid grid-cols-2 divide-x divide-border">
              <div className="px-5 py-3.5 space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Location</p>
                <p className="text-xs text-foreground leading-relaxed">{point.location}</p>
              </div>
              <div className="px-5 py-3.5 space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Stimulus</p>
                <p className="text-xs text-foreground leading-relaxed">{point.stimulus || point.technique || '—'}</p>
              </div>
            </div>

            {/* Assessment Protocol */}
            {point.assessmentProtocol && (
              <div className="px-5 py-3.5 space-y-1 bg-muted/30">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Assessment</p>
                <p className="text-xs text-foreground leading-relaxed">{point.assessmentProtocol}</p>
              </div>
            )}

            {/* Functions & Dysfunction */}
            <div className="grid grid-cols-2 divide-x divide-border">
              {point.functions && (
                <div className="px-5 py-3.5 space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">Functions</p>
                  <ul className="space-y-1">
                    {point.functions.map((f, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {point.dysfunctionSigns && (
                <div className="px-5 py-3.5 space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-600">Dysfunction</p>
                  <ul className="space-y-1">
                    {point.dysfunctionSigns.map((s, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <span className="w-1 h-1 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Clinical Note */}
            {point.clinicalNote && (
              <div className="px-5 py-3.5 space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Note</p>
                <p className="text-xs text-muted-foreground italic leading-relaxed">{point.clinicalNote}</p>
              </div>
            )}

            {/* Images */}
            {showImages && (
              <div className="px-5 py-3.5 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">References</p>
                <div className="flex gap-2">
                  {primaryUrl && (
                    <img src={primaryUrl} alt="Primary" className="w-20 h-14 rounded object-cover border border-border" />
                  )}
                  {secondaryUrl && (
                    <img src={secondaryUrl} alt="Secondary" className="w-20 h-14 rounded object-cover border border-border" />
                  )}
                  {tertiaryUrl && (
                    <img src={tertiaryUrl} alt="Tertiary" className="w-20 h-14 rounded object-cover border border-border" />
                  )}
                </div>
              </div>
            )}

            {/* Pearl */}
            {point.pearl && (
              <div className="px-5 py-3.5 bg-amber-50/50 space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">Pearl</p>
                <p className="text-xs text-amber-900 leading-relaxed">{point.pearl}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BrainReflexModal;
