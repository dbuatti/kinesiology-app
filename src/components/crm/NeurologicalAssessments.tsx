
import { Footprints, Scale, Brain, Hand, RefreshCw } from "lucide-react";
import FakudaStepTest from "./FakudaStepTest";
import SharpenedRhombergsTest from "./SharpenedRhombergsTest";
import FrontalLobeAssessment from "./FrontalLobeAssessment";
import RightingReflexesAssessment from "./RightingReflexesAssessment";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NeurologicalAssessmentsProps {
  appointmentId: string;
  initialFakudaNotes: string | null | undefined;
  initialRhombergsNotes: string | null | undefined;
  initialFrontalLobeNotes: string | null | undefined;
  initialRightingReflexNotes?: string | null | undefined;
  onUpdate: () => void;
}

const NeurologicalAssessments = ({
  appointmentId,
  initialFakudaNotes,
  initialRhombergsNotes,
  initialFrontalLobeNotes,
  initialRightingReflexNotes,
  onUpdate,
}: NeurologicalAssessmentsProps) => {
  const hasFakudaNotes = !!initialFakudaNotes;
  const hasRhombergsNotes = !!initialRhombergsNotes;
  const hasFrontalLobeNotes = !!initialFrontalLobeNotes;
  const hasRightingNotes = !!initialRightingReflexNotes;
  const hasAnyNotes = hasFakudaNotes || hasRhombergsNotes || hasFrontalLobeNotes || hasRightingNotes;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Brain size={16} className="text-muted-foreground" />
        <div>
          <h3 className="text-sm font-semibold text-foreground">Neurological global</h3>
          <p className="text-[11px] text-muted-foreground">Cerebellum and proprioception</p>
        </div>
        <span className="ml-auto text-xs font-medium text-muted-foreground">
          {hasAnyNotes ? "Recorded" : "Not yet recorded"}
        </span>
      </div>

      <div className="space-y-4">
            <Tabs defaultValue="fakuda" className="w-full">
              <TabsList className="inline-flex h-10 items-center gap-1 rounded-xl bg-muted/60 p-1">
                <TabsTrigger value="fakuda" className="relative flex h-8 items-center gap-2 rounded-lg px-3.5 font-medium text-[12.5px] text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs">
                  <Footprints size={14} /> <span className="hidden sm:inline">Fakuda</span>
                  {hasFakudaNotes && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />}
                </TabsTrigger>
                <TabsTrigger value="rhombergs" className="relative flex h-8 items-center gap-2 rounded-lg px-3.5 font-medium text-[12.5px] text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs">
                  <Scale size={14} /> <span className="hidden sm:inline">Rhombergs</span>
                  {hasRhombergsNotes && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />}
                </TabsTrigger>
                <TabsTrigger value="frontal-lobe" className="relative flex h-8 items-center gap-2 rounded-lg px-3.5 font-medium text-[12.5px] text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs">
                  <Hand size={14} /> <span className="hidden sm:inline">Frontal</span>
                  {hasFrontalLobeNotes && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />}
                </TabsTrigger>
                <TabsTrigger value="righting" className="relative flex h-8 items-center gap-2 rounded-lg px-3.5 font-medium text-[12.5px] text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs">
                  <RefreshCw size={14} /> <span className="hidden sm:inline">Righting</span>
                  {hasRightingNotes && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="fakuda" className="mt-5 space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
                      <Footprints size={15} />
                    </span>
                    <div>
                      <h4 className="text-[13px] font-semibold tracking-tight text-foreground">Fakuda Step Test</h4>
                      <p className="text-[11px] text-muted-foreground">Midline / vestibular cerebellar imbalance</p>
                    </div>
                  </div>
                  {hasFakudaNotes && <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary-strong">Completed</span>}
                </div>
                <FakudaStepTest
                  appointmentId={appointmentId}
                  initialFakudaNotes={initialFakudaNotes}
                  onUpdate={onUpdate}
                />
              </TabsContent>

              <TabsContent value="rhombergs" className="mt-5 space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
                      <Scale size={15} />
                    </span>
                    <div>
                      <h4 className="text-[13px] font-semibold tracking-tight text-foreground">Sharpened Rhombergs Test</h4>
                      <p className="text-[11px] text-muted-foreground">Midline cerebellum and proprioception</p>
                    </div>
                  </div>
                  {hasRhombergsNotes && <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary-strong">Completed</span>}
                </div>
                <SharpenedRhombergsTest
                  appointmentId={appointmentId}
                  initialNotes={initialRhombergsNotes}
                  onUpdate={onUpdate}
                />
              </TabsContent>

              <TabsContent value="frontal-lobe" className="mt-5 space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
                      <Hand size={15} />
                    </span>
                    <div>
                      <h4 className="text-[13px] font-semibold tracking-tight text-foreground">Frontal Lobe Assessment</h4>
                      <p className="text-[11px] text-muted-foreground">Rapid hand drill for frontal cortex asymmetry</p>
                    </div>
                  </div>
                  {hasFrontalLobeNotes && <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary-strong">Completed</span>}
                </div>
                <FrontalLobeAssessment
                  appointmentId={appointmentId}
                  initialNotes={initialFrontalLobeNotes}
                  onUpdate={onUpdate}
                />
              </TabsContent>

              <TabsContent value="righting" className="mt-5 space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
                      <RefreshCw size={15} />
                    </span>
                    <div>
                      <h4 className="text-[13px] font-semibold tracking-tight text-foreground">Righting Reflexes</h4>
                      <p className="text-[11px] text-muted-foreground">Ocular & labyrinthine postural organisation</p>
                    </div>
                  </div>
                  {hasRightingNotes && <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary-strong">Completed</span>}
                </div>
                <RightingReflexesAssessment
                  appointmentId={appointmentId}
                  initialNotes={initialRightingReflexNotes}
                  onUpdate={onUpdate}
                />
              </TabsContent>
            </Tabs>

            <div className="rounded-2xl bg-muted/40 px-4 py-3">
              <p className="text-[12px] leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">Clinical note — </span>
                Global assessments provide a baseline for the client's nervous system stability. If significant imbalances are found, prioritise SNS down-regulation before proceeding with deep emotional or structural work.
              </p>
            </div>
          </div>
      </div>
  );
};

export default NeurologicalAssessments;