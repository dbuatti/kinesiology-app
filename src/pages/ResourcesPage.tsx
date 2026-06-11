
import React, { useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { 
 BookOpen, 
 Activity, 
 Zap, 
 Move, 
 Target, 
 Heart, 
 Layers, 
 Clock, 
 RefreshCw, 
 Youtube, 
 GraduationCap, 
 Workflow, 
 ImageIcon, 
 Trophy,
 LayoutGrid,
 Baby,
 Calculator,
 Wind,
 Dumbbell,
 Brain,
 Shield,
 Printer,
 Lightbulb,
 Droplets
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppLayout from "@/components/crm/AppLayout";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/shared/PageHeader";

// Component Imports
import AcupointReference from "@/components/crm/AcupointReference";
import SpinalSegmentReference from "@/components/crm/SpinalSegmentReference";
import TcmChannelReference from "@/components/crm/TcmChannelReference";
import MeridianClock from "@/components/crm/MeridianClock";
import FiveElementCycle from "@/components/crm/FiveElementCycle";
import ClinicalCheatSheet from "@/components/crm/ClinicalCheatSheet";
import VideoLibrary from "@/components/crm/VideoLibrary";
import BrainReflexReference from "@/components/crm/BrainReflexReference";
import FnTheory from "@/components/crm/FnTheory";
import LigamentReference from "@/components/crm/LigamentReference";
import MechanoMasteryModule from "@/components/crm/MechanoMasteryModule";
import MechanoBible from "@/components/crm/MechanoBible";
import CranialNerveReference from "@/components/crm/CranialNerveReference";
import PrimitiveReflexReference from "@/components/crm/PrimitiveReflexReference";
import CranialNerveHomeworkTool from "@/components/crm/CranialNerveHomeworkTool";
import BrainstemBreathingReference from "@/components/crm/BrainstemBreathingReference";
import MuscleReference from "@/components/crm/MuscleReference";
import BaGuaReference from "@/components/crm/BaGuaReference";
import HeartWallBible from "@/components/crm/HeartWallBible";
import EmotionsProtocolReference from "@/components/crm/EmotionsProtocolReference";
import ResourceHub from "@/components/crm/ResourceHub";

const CATEGORIES = [
 {
 id: "foundations",
 label: "Foundations",
 icon: GraduationCap,
 color: "text-chart-primary",
 bgColor: "bg-chart-primary/10 ",
 borderColor: "border-border ",
 items: [
 { id: "mechano-academy", label: "Mechano Academy", icon: Trophy, desc: "Daily clinical drills and mastery tools." },
 { id: "bible", label: "Mechano Bible", icon: BookOpen, desc: "Definitive guide to joints and movement geometry." },
 { id: "heart-wall-bible", label: "Heart Wall Bible", icon: Shield, desc: "Understanding the subconscious shield." },
 { id: "theory", label: "FN Theory", icon: Workflow, desc: "Functional Neurology approach and principles." },
 ]
 },
 {
 id: "clinical",
 label: "Clinical Reference",
 icon: Activity,
 color: "text-chart-destructive",
 bgColor: "bg-chart-destructive/10 ",
 borderColor: "border-border ",
 items: [
 { id: "muscles", label: "Muscle Reference", icon: Dumbbell, desc: "Manage reference images and clinical details for all muscles." },
 { id: "primitive", label: "Primitive Reflexes", icon: Baby, desc: "Foundational OS of the nervous system." },
 { id: "cranial", label: "Cranial Nerves", icon: Zap, desc: "12 nerves, nuclei, and assessment protocols." },
 { id: "brain", label: "Brain Reflexes", icon: Brain, desc: "Challenge specific cortical and subcortical regions." },
 { id: "ligaments", label: "Ligaments", icon: ImageIcon, desc: "Custom reference images for mechanoreceptive work." },
 { id: "cheatsheet", label: "Cheat Sheets", icon: Zap, desc: "Rapid clinical insights for common complaints." },
 { id: "video", label: "Video Library", icon: Youtube, desc: "Curated collection of technique demonstrations." },
 ]
 },
 {
 id: "tcm",
 label: "TCM & Meridians",
 icon: Layers,
 color: "text-chart-emerald",
 bgColor: "bg-chart-emerald/10 ",
 borderColor: "border-border ",
 items: [
 { id: "clock", label: "Meridian Clock", icon: Clock, desc: "Interactive TCM peak activity reference." },
 { id: "elements", label: "5 Elements", icon: RefreshCw, desc: "Sheng and Ko cycle relationships." },
 { id: "bagua", label: "Ba Gua", icon: Zap, desc: "Constitutional emotional motivators and meridians." },
 { id: "channels", label: "Channels", icon: Layers, desc: "Detailed meridian and emotion mapping." },
 { id: "acupoints", label: "Acupoints", icon: Target, desc: "Primary point locations and clinical functions." },
 ]
 },
 {
 id: "tools",
 label: "Practice Tools",
 icon: Zap,
 color: "text-muted-foreground",
 bgColor: "bg-muted ",
 borderColor: "border-border ",
 items: [
 { id: "emotional-theory", label: "Emotional Theory", icon: Heart, desc: "The 9-step Neuro-Emotional hierarchy." },
 { id: "rehab-calc", label: "Rehab Calc", icon: Calculator, desc: "Calculate 70% threshold for nerve homework." },
 { id: "brainstem-breath", label: "Brainstem Breath", icon: Wind, desc: "Breathing patterns for Midbrain, Pons, Medulla." },
 { id: "logic", label: "Clinical Logic", icon: Lightbulb, desc: "The hierarchy of neurological correction." },
 { id: "spinal", label: "Spinal", icon: Move, desc: "Spinal segment and Lovett-Brother associations." },
 { id: "lymphatic", label: "Lymphatic", icon: Droplets, desc: "Drainage protocols and counterstrain points." },
 { id: "postural", label: "Postural Reflexes", icon: RefreshCw, desc: "Ocular and Labyrinthine righting reflexes." },
 ]
 }
];

const ResourcesPage = () => {
 const [searchParams, setSearchParams] = useSearchParams();
 const activeTab = searchParams.get("tab") || "hub";

 const activeCategory = useMemo(() => {
 if (activeTab === "hub") return null;
 return CATEGORIES.find(cat => cat.items.some(item => item.id === activeTab));
 }, [activeTab]);

 const handleTabChange = (value: string) => {
 setSearchParams({ tab: value });
 };

 return (
 <AppLayout variant="workspace">
 <div className="p-4 md:p-8 max-w-full mx-auto space-y-8">
 <PageHeader 
  title="Clinical Reference"
 subtitle="The definitive knowledge base for FNH protocols, anatomy, and TCM references."
  icon={BookOpen}
  actions={
 <div className="flex items-center gap-3">
 <Button asChild variant="outline" className="rounded-xl h-12 px-6 font-medium text-xs uppercase tracking-wider border-border text-chart-primary hover:bg-muted">
 <Link to="/resources/print">
 <Printer size={18} className="mr-2" /> Print Hub
 </Link>
 </Button>
 {activeTab !== "hub" && (
 <Button variant="outline" onClick={() => handleTabChange("hub")} className="rounded-xl border-border bg-card hover:bg-muted font-medium text-xs uppercase tracking-wider h-12 px-6">
 <LayoutGrid size={18} className="mr-2" /> Back to Hub
 </Button>
 )}
 </div>
 }
 />

 {activeTab === "hub" ? (
 <ResourceHub categories={CATEGORIES} />
 ) : (
 <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
 <div className="overflow-x-auto pb-4 no-scrollbar">
 <TabsList className={cn("flex w-max h-auto p-1.5 rounded-xl gap-1", activeCategory?.bgColor || "bg-muted")}>
 {activeCategory?.items.map((item) => (
 <TabsTrigger key={item.id} value={item.id} className="rounded-xl py-2.5 px-6 data-[state=active]:bg-card data-[state=active]:text-chart-primary data-[state=active]:shadow-sm font-medium text-xs uppercase tracking-wider">
 <item.icon size={16} className="mr-2" /> {item.label}
 </TabsTrigger>
 ))}
 </TabsList>
 </div>

 <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
 <TabsContent value="mechano-academy"><MechanoMasteryModule /></TabsContent>
 <TabsContent value="bible"><MechanoBible /></TabsContent>
 <TabsContent value="heart-wall-bible"><HeartWallBible /></TabsContent>
 <TabsContent value="theory"><FnTheory /></TabsContent>
 <TabsContent value="muscles"><MuscleReference /></TabsContent>
 <TabsContent value="primitive"><PrimitiveReflexReference /></TabsContent>
 <TabsContent value="cranial"><CranialNerveReference /></TabsContent>
 <TabsContent value="brain"><BrainReflexReference /></TabsContent>
 <TabsContent value="ligaments"><LigamentReference /></TabsContent>
 <TabsContent value="cheatsheet"><ClinicalCheatSheet /></TabsContent>
 <TabsContent value="video"><VideoLibrary /></TabsContent>
 <TabsContent value="clock"><MeridianClock /></TabsContent>
 <TabsContent value="elements"><FiveElementCycle /></TabsContent>
 <TabsContent value="bagua"><BaGuaReference /></TabsContent>
 <TabsContent value="channels"><TcmChannelReference /></TabsContent>
 <TabsContent value="acupoints"><AcupointReference /></TabsContent>
 <TabsContent value="emotional-theory"><EmotionsProtocolReference /></TabsContent>
 <TabsContent value="rehab-calc"><CranialNerveHomeworkTool /></TabsContent>
 <TabsContent value="brainstem-breath"><BrainstemBreathingReference /></TabsContent>
 <TabsContent value="logic"><FnTheory /></TabsContent>
 <TabsContent value="spinal"><SpinalSegmentReference /></TabsContent>
 <TabsContent value="lymphatic"><LigamentReference /></TabsContent>
 <TabsContent value="postural"><FnTheory /></TabsContent>
 </div>
 </Tabs>
 )}
 </div>
 </AppLayout>
 );
};

export default ResourcesPage;