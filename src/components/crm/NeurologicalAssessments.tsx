
import { Footprints, Scale, Brain, Hand, RefreshCw } from "lucide-react";
import FakudaStepTest from "./FakudaStepTest";
import SharpenedRhombergsTest from "./SharpenedRhombergsTest";
import FrontalLobeAssessment from "./FrontalLobeAssessment";
import RightingReflexesAssessment from "./RightingReflexesAssessment";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

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
              <TabsList className="grid w-full sm:w-auto sm:inline-grid grid-cols-4 h-9 bg-muted/50 p-1 rounded-md">
                <TabsTrigger value="fakuda" className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:text-success data-[state=active]:shadow-sm rounded-md h-8 font-medium text-[13px] relative">
                  <Footprints size={16} /> <span className="hidden sm:inline">Fakuda</span>
                  {hasFakudaNotes && <span className="absolute top-2 right-2 w-2 h-2 bg-success/50 rounded-full" />}
                </TabsTrigger>
                <TabsTrigger value="rhombergs" className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md h-8 font-medium text-[13px] relative">
                  <Scale size={16} /> <span className="hidden sm:inline">Rhombergs</span>
                  {hasRhombergsNotes && <span className="absolute top-2 right-2 w-2 h-2 bg-success rounded-full" />}
                </TabsTrigger>
                <TabsTrigger value="frontal-lobe" className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md h-8 font-medium text-[13px] relative">
                  <Hand size={16} /> <span className="hidden sm:inline">Frontal</span>
                  {hasFrontalLobeNotes && <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />}
                </TabsTrigger>
                <TabsTrigger value="righting" className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md h-8 font-medium text-[13px] relative">
                  <RefreshCw size={16} /> <span className="hidden sm:inline">Righting</span>
                  {hasRightingNotes && <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="fakuda" className="mt-4 space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-foreground">Fakuda Step Test</h4>
                    <p className="text-[11px] text-muted-foreground">Assess midline/vestibule cerebellum imbalances</p>
                  </div>
                  {hasFakudaNotes && <Badge className="bg-success/10 text-success-strong border-success/20 font-semibold">Completed</Badge>}
                </div>
                <FakudaStepTest
                  appointmentId={appointmentId}
                  initialFakudaNotes={initialFakudaNotes}
                  onUpdate={onUpdate}
                />
              </TabsContent>
              
              <TabsContent value="rhombergs" className="mt-4 space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-foreground">Sharpened Rhombergs Test</h4>
                    <p className="text-[11px] text-muted-foreground">Assess midline cerebellum and proprioception</p>
                  </div>
                  {hasRhombergsNotes && <Badge className="bg-success/10 text-success-strong border-success/20 font-semibold">Completed</Badge>}
                </div>
                <SharpenedRhombergsTest
                  appointmentId={appointmentId}
                  initialNotes={initialRhombergsNotes}
                  onUpdate={onUpdate}
                />
              </TabsContent>

              <TabsContent value="frontal-lobe" className="mt-4 space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-foreground">Frontal Lobe Assessment</h4>
                    <p className="text-[11px] text-muted-foreground">Rapid hand drill for frontal cortex asymmetry</p>
                  </div>
                  {hasFrontalLobeNotes && <Badge className="bg-success/10 text-success-strong border-success/20 font-semibold">Completed</Badge>}
                </div>
                <FrontalLobeAssessment
                  appointmentId={appointmentId}
                  initialNotes={initialFrontalLobeNotes}
                  onUpdate={onUpdate}
                />
              </TabsContent>

              <TabsContent value="righting" className="mt-4 space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="space-y-1">
                    <h4 className="text-lg font-semibold text-foreground">Righting Reflexes</h4>
                    <p className="text-xs text-muted-foreground font-medium">Ocular & Labyrinthine postural organization</p>
                  </div>
                  {hasRightingNotes && <Badge className="bg-primary/10 text-primary-strong dark:text-primary-strong border-primary/20 font-semibold">Completed</Badge>}
                </div>
                <RightingReflexesAssessment
                  appointmentId={appointmentId}
                  initialNotes={initialRightingReflexNotes}
                  onUpdate={onUpdate}
                />
              </TabsContent>
            </Tabs>

            <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-4">
              <span className="font-semibold text-foreground">Clinical note:</span> Global assessments provide a baseline for the client's nervous system stability. If significant imbalances are found, prioritize SNS down-regulation before proceeding with deep emotional or structural work.
            </p>
          </div>
      </div>
  );
};

export default NeurologicalAssessments;