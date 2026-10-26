
import { useState } from "react";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

import { Button } from "@/components/ui/button";
import { Move, Save, Loader2, RotateCcw, Zap, RefreshCw, Eye, ArrowUpDown, RotateCw, BookOpen } from "lucide-react";
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
    color: 'bg-primary/5 border-primary/20',
    accentText: 'text-primary',
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
    color: 'bg-primary/5 border-primary/20',
    accentText: 'text-primary',
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
    color: 'bg-primary/5 border-primary/20',
    accentText: 'text-primary',
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
  const [activePlane, setActivePlane] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
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

  const executeReset = async () => {
    setShowResetConfirm(false);
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
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Move size={16} className="text-muted-foreground" />
        <div>
          <h3 className="text-sm font-semibold text-foreground">COGS · visual assessment</h3>
          <p className="text-[11px] text-muted-foreground">Anatomy in Motion · pelvis, rib cage and cranium coordination</p>
        </div>
        {hasSavedNotes && <span className="text-xs font-medium text-muted-foreground ml-auto">Recorded</span>}
      </div>

      <div className="space-y-6">
            
            {/* Introduction */}
            <div className="space-y-2 border-l-2 border-muted pl-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground uppercase tracking-wide">COGS Principle</span>
                <Button variant="ghost" size="sm" asChild className="h-7 text-xs rounded-md">
                  <Link to="/library?tab=cogs" target="_blank">
                    <BookOpen size={13} className="mr-1" /> Learn
                  </Link>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pelvis and cranium move <strong>together</strong>; rib cage moves <strong>opposite</strong>. When they don't coordinate, movement disintegrates. <strong>Watching someone move is the most accurate way to assess their nervous system.</strong>
              </p>
            </div>

            {/* Plane tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {PLANES.map(plane => (
                <button
                  key={plane.id}
                  onClick={() => setActivePlane(activePlane === plane.id ? null : plane.id)}
                  className={cn(
                    "shrink-0 flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors border",
                    activePlane === plane.id 
                      ? plane.color + " " + plane.accentText + " border-current"
                      : "bg-transparent border-border text-muted-foreground hover:bg-muted/40"
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
                  <div key={plane.id} className="pt-3 space-y-3 border-t border-border">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <plane.icon size={18} className={plane.accentText} />
                        <h4 className="text-[15px] font-semibold text-foreground">{plane.title}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground">{plane.subtitle}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-muted-foreground">What to prompt</Label>
                          <p className="text-sm text-foreground">{plane.prompt}</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-muted-foreground">What to look for</Label>
                          <p className="text-sm text-muted-foreground">{plane.lookFor}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-muted-foreground">How to perform</Label>
                          <p className="text-sm text-muted-foreground">{plane.movement}</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-muted-foreground">Normal pattern</Label>
                          <p className="text-xs text-muted-foreground/70">{plane.reference}</p>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground italic">
                      <span className="text-xs font-medium text-muted-foreground not-italic">Example: </span>{plane.example}
                    </p>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">Quick tags</Label>
                      <div className="flex flex-wrap gap-2">
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

            {/* Save / Reset bar */}
            {anyNotes && (
              <div className="flex gap-2 mt-2">
                <Button onClick={handleSave} disabled={loading} className="flex-1 h-10 rounded-xl text-xs font-medium">
                  {loading ? <Loader2 className="animate-spin mr-1" size={14} /> : <Save size={14} className="mr-1" />}
                  Save All Planes
                </Button>
                {hasSavedNotes && (
                  <Button variant="ghost" onClick={() => setShowResetConfirm(true)} className="h-10 px-3 rounded-xl text-xs text-muted-foreground hover:text-destructive">
                    <RotateCcw size={14} />
                  </Button>
                )}
              </div>
            )}
          </div>

      <ConfirmDialog
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        title="Reset all COGS notes?"
        description="This will clear all sagittal, frontal, and transverse plane notes."
        confirmLabel="Reset"
        onConfirm={executeReset}
      />
    </div>
  );
};

export default CogsAssessment;
