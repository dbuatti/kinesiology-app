
import React, { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, Move, Save, Loader2, RotateCcw, Zap, RefreshCw, Eye, ArrowUpDown, RotateCw, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";

interface CogsAssessmentProps {
  appointmentId: string;
  initialSagittalNotes: string | null | undefined;
  initialFrontalNotes: string | null | undefined;
  initialTransverseNotes: string | null | undefined;
  onUpdate: () => void;
}

const QUICK_TAGS: Record<string, string[]> = {
  sagittal: ["Pelvis AT", "Pelvis PT", "T-spine FX restricted", "T-spine EX restricted", "Neck disconnect", "Integrated"],
  frontal: ["L lateral FX", "R lateral FX", "L hip hike", "R hip hike", "Neck disconnect", "Integrated"],
  transverse: ["L rotation restricted", "R rotation restricted", "Pelvic rotation", "Rib torque", "Head dissociation", "Integrated"],
};

const PLANES = [
  {
    id: 'sagittal',
    title: 'Sagittal Plane',
    subtitle: 'Forward-backward movement · View from side',
    icon: ArrowUpDown,
    color: 'bg-chart-primary/5 border-chart-primary/20',
    accentText: 'text-chart-primary',
    prompt: 'Pelvis tilts forward (bum out), rib cage rounds back, chin tucks',
    lookFor: 'Do pelvis, rib cage, and neck sequence together? Does the neck automatically tuck when the pelvis tips forward? Is there a disconnect between segments?',
    movement: 'First: isolate each segment. Then: move all three together.',
    example: 'Prompt: "Round your shoulders forward." Watch: does the pelvis tuck and chin drop automatically? If not, there\'s a cog disconnect.',
    reference: 'Normal: pelvis tilts forward → rib cage rounds → chin tucks in sequence',
    tags: QUICK_TAGS.sagittal,
  },
  {
    id: 'frontal',
    title: 'Frontal Plane',
    subtitle: 'Side-to-side movement · View from front',
    icon: Move,
    color: 'bg-chart-emerald/5 border-chart-emerald/20',
    accentText: 'text-chart-emerald',
    prompt: 'Bend to the side — rib cage should tip, head tilts, pelvis shifts',
    lookFor: 'Is there lateral flexion through the neck? Does the pelvis shift or stay locked? Is most movement coming from the thoracic spine only?',
    movement: 'First: side-bend just the rib cage (head stays). Then: let the whole body follow.',
    example: 'Prompt: "Bend to your side." Watch: does the neck naturally tilt? Does the pelvis shift? If the neck stays straight or pelvis doesn\'t move, there\'s a frontal plane disconnect.',
    reference: 'Normal: side-bend → neck tilts → pelvis shifts laterally in the same direction',
    tags: QUICK_TAGS.frontal,
  },
  {
    id: 'transverse',
    title: 'Transverse Plane',
    subtitle: 'Rotational movement · View from above conceptually',
    icon: RotateCw,
    color: 'bg-chart-destructive/5 border-chart-destructive/20',
    accentText: 'text-chart-destructive',
    prompt: 'Rotate the rib cage while keeping pelvis and head still, then reverse',
    lookFor: 'Can the rib cage rotate independently of the pelvis? Does the head stay facing forward or follow? Is there overuse of upper traps?',
    movement: 'First: dissociate — rotate rib cage only. Then: integrate — rib cage right, pelvis left.',
    example: 'Prompt: "Keep your head facing this way, now rotate just your rib cage right." Watch: does the pelvis stay still? Then: "Now rotate pelvis left while rib cage goes right."',
    reference: 'Normal: rib cage rotates independently, pelvis counter-rotates, head stays facing forward',
    tags: QUICK_TAGS.transverse,
  },
];

const CogsAssessment = ({ 
  appointmentId, 
  initialSagittalNotes,
  initialFrontalNotes,
  initialTransverseNotes,
  onUpdate 
}: CogsAssessmentProps) => {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activePlane, setActivePlane] = useState<string | null>(null);
  
  const [sagittalNotes, setSagittalNotes] = useState(initialSagittalNotes || '');
  const [frontalNotes, setFrontalNotes] = useState(initialFrontalNotes || '');
  const [transverseNotes, setTransverseNotes] = useState(initialTransverseNotes || '');

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ 
          sagittal_plane_notes: sagittalNotes || null,
          frontal_plane_notes: frontalNotes || null,
          transverse_plane_notes: transverseNotes || null,
        })
        .eq("id", appointmentId);
      if (error) throw error;
      showSuccess("COGS assessment saved");
      onUpdate();
    } catch (error: any) {
      showError(error.message || "Failed to save.");
    } finally {
      setLoading(false);
    }
  };

  const addTag = (plane: string, tag: string) => {
    const setter = plane === 'sagittal' ? setSagittalNotes : plane === 'frontal' ? setFrontalNotes : setTransverseNotes;
    const current = plane === 'sagittal' ? sagittalNotes : plane === 'frontal' ? frontalNotes : transverseNotes;
    if (current.includes(tag)) return;
    setter(prev => prev ? `${prev}, ${tag}` : tag);
  };

  const handleReset = async () => {
    if (!confirm("Reset all COGS notes?")) return;
    setLoading(true);
    try {
      await supabase.from("appointments").update({ sagittal_plane_notes: null, frontal_plane_notes: null, transverse_plane_notes: null }).eq("id", appointmentId);
      setSagittalNotes(''); setFrontalNotes(''); setTransverseNotes('');
      showSuccess("Reset complete.");
      onUpdate();
    } catch (error: any) {
      showError(error.message || "Failed to reset.");
    } finally {
      setLoading(false);
    }
  };

  const getNotesFor = (plane: string) => plane === 'sagittal' ? sagittalNotes : plane === 'frontal' ? frontalNotes : transverseNotes;
  const setNotesFor = (plane: string, value: string) => {
    if (plane === 'sagittal') setSagittalNotes(value);
    else if (plane === 'frontal') setFrontalNotes(value);
    else setTransverseNotes(value);
  };

  const hasSavedNotes = !!(initialSagittalNotes || initialFrontalNotes || initialTransverseNotes);
  const anyNotes = !!(sagittalNotes || frontalNotes || transverseNotes);

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden transition-all">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className={cn(
            "p-4 flex items-center justify-between cursor-pointer transition-all",
            isOpen ? "bg-muted/50" : "hover:bg-muted/30",
            hasSavedNotes && !isOpen && "bg-chart-primary/5"
          )}>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center">
                <Move size={18} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">COGS — Visual Assessment</h3>
                <p className="text-sm text-muted-foreground">Anatomy in Motion · Pelvis, Rib Cage &amp; Cranium coordination</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {hasSavedNotes && <span className="text-xs font-medium text-muted-foreground">Recorded</span>}
              <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground">
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", isOpen && "rotate-180")} />
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-6 border-t border-border space-y-6 animate-in fade-in slide-in-from-top-1 duration-300">
            
            {/* Introduction */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye size={16} className="text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">COGS Principle</span>
                </div>
                <Button variant="ghost" size="sm" asChild className="h-7 text-xs rounded-lg">
                  <Link to="/resources/cogs" target="_blank">
                    <BookOpen size={13} className="mr-1" /> Learn COGS
                  </Link>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The pelvis and cranium move in <strong>the same direction</strong>, while the rib cage moves in <strong>the opposite direction</strong>. When these three cogs don't coordinate, movement becomes disintegrated — often due to stress, injury, or neurological locking. <strong>Watching someone move is the most accurate way to assess their nervous system.</strong>
              </p>
            </div>

            {/* Plane tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {PLANES.map(plane => (
                <button
                  key={plane.id}
                  onClick={() => setActivePlane(activePlane === plane.id ? null : plane.id)}
                  className={cn(
                    "shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
                    activePlane === plane.id 
                      ? plane.color + " " + plane.accentText + " border-current"
                      : "bg-muted/30 border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  <plane.icon size={15} />
                  {plane.title}
                </button>
              ))}
              {anyNotes && (
                <Button onClick={handleSave} disabled={loading} className="shrink-0 h-9 px-4 rounded-lg text-xs font-medium ml-auto">
                  {loading ? <Loader2 className="animate-spin mr-1" size={14} /> : <Save size={14} className="mr-1" />}
                  Save
                </Button>
              )}
            </div>

            {/* Active plane detail */}
            {activePlane && (
              <div className="animate-in slide-in-from-top-2 duration-300">
                {PLANES.filter(p => p.id === activePlane).map(plane => (
                  <div key={plane.id} className={cn("p-5 rounded-xl border space-y-4", plane.color)}>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <plane.icon size={18} className={plane.accentText} />
                        <h4 className="text-base font-semibold text-foreground">{plane.title}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground">{plane.subtitle}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">What to prompt</Label>
                          <p className="text-sm text-foreground">{plane.prompt}</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">What to look for</Label>
                          <p className="text-sm text-muted-foreground">{plane.lookFor}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">How to perform</Label>
                          <p className="text-sm text-muted-foreground">{plane.movement}</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Normal pattern</Label>
                          <p className="text-xs text-muted-foreground/70">{plane.reference}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-card border border-border">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">Example</Label>
                      <p className="text-sm text-muted-foreground italic">{plane.example}</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Quick tags</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {plane.tags.map(tag => (
                          <button
                            key={tag}
                            onClick={() => addTag(plane.id, tag)}
                            className={cn(
                              "px-2 py-1 rounded-md text-[10px] font-medium transition-colors border",
                              getNotesFor(plane.id).includes(tag)
                                ? "bg-card text-foreground border-border"
                                : "bg-muted/50 text-muted-foreground border-border hover:bg-card"
                            )}
                          >
                            {getNotesFor(plane.id).includes(tag) ? tag : `+ ${tag}`}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Textarea
                      value={getNotesFor(plane.id)}
                      onChange={(e) => setNotesFor(plane.id, e.target.value)}
                      placeholder={`Notes: ${plane.title} observations...`}
                      className="min-h-[60px] rounded-lg border-border bg-card text-sm p-3 resize-none"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* All three summary when no plane selected */}
            {!activePlane && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {PLANES.map(plane => {
                  const notes = getNotesFor(plane.id);
                  return (
                    <button
                      key={plane.id}
                      onClick={() => setActivePlane(plane.id)}
                      className={cn(
                        "p-4 rounded-xl border text-left transition-all hover:shadow-sm",
                        notes ? plane.color : "bg-muted/20 border-border hover:bg-muted/40"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <plane.icon size={15} className={plane.accentText} />
                        <span className="text-sm font-medium text-foreground">{plane.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{plane.subtitle}</p>
                      {notes ? (
                        <p className="text-xs text-muted-foreground line-clamp-2">{notes}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground/50">Tap to assess</p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Save / Reset bar */}
            {anyNotes && (
              <div className="flex gap-2 mt-2">
                <Button onClick={handleSave} disabled={loading} className="flex-1 h-10 rounded-xl text-xs font-medium">
                  {loading ? <Loader2 className="animate-spin mr-1" size={14} /> : <Save size={14} className="mr-1" />}
                  Save All Planes
                </Button>
                {hasSavedNotes && (
                  <Button variant="ghost" onClick={handleReset} className="h-10 px-3 rounded-xl text-xs text-muted-foreground hover:text-destructive">
                    <RotateCcw size={14} />
                  </Button>
                )}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default CogsAssessment;
