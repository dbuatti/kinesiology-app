
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, PlayCircle, Info, Target } from "lucide-react";
import IdentityAlignmentBackground from '@/components/crm/IdentityAlignmentBackground';
import IdentityAlignmentTool from '@/components/crm/IdentityAlignmentTool';
import AppLayout from '@/components/crm/AppLayout';
import PageHeader from "@/components/shared/PageHeader";


const IdentityAlignmentPage = () => {
 return (
 <AppLayout>
  <div className="max-w-5xl mx-auto space-y-4">
  <PageHeader 
    title="Identity Alignment"
    subtitle="Neural Reconsolidation & Autonomic Safety Protocol."
    icon={Target}
  />

 <Tabs defaultValue="practice" className="w-full">
  <div className="flex justify-center mb-3">
  <TabsList className="bg-muted p-0.5 rounded-lg h-8">
  <TabsTrigger 
  value="learn" 
  className="rounded-md px-3 h-7 data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all font-medium text-[10px] uppercase tracking-wider"
  >
  <BookOpen className="mr-1.5" size={11} />
  Learn
  </TabsTrigger>
  <TabsTrigger 
  value="practice" 
  className="rounded-md px-3 h-7 data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all font-medium text-[10px] uppercase tracking-wider"
  >
  <PlayCircle className="mr-1.5" size={11} />
  Practice
  </TabsTrigger>
  </TabsList>
  </div>

  <TabsContent value="learn" className="mt-0 focus-visible:ring-0">
  <div className="max-w-5xl mx-auto">
  <IdentityAlignmentBackground />
  </div>
  </TabsContent>

  <TabsContent value="practice" className="mt-0 focus-visible:ring-0">
  <div className="max-w-4xl mx-auto">
  <IdentityAlignmentTool singlePage />
  </div>
  </TabsContent>
 </Tabs>

 <div className="max-w-3xl mx-auto bg-chart-primary/5 border border-primary/10 rounded-xl p-4 flex gap-3 items-start">
  <div className="w-6 h-6 bg-chart-primary/10 rounded-lg flex items-center justify-center shrink-0 text-chart-primary">
  <Info size={14} />
  </div>
  <div className="space-y-1">
  <h4 className="font-semibold text-chart-primary text-[10px] uppercase tracking-wider">Practitioner's Playbook</h4>
  <p className="text-xs text-chart-primary/70 leading-relaxed font-medium">
  The Identity Alignment Protocol is most effective when the client is in a state of autonomic safety. If you detect high sympathetic arousal, pause and use a down-regulation technique.
  </p>
  </div>
 </div>
 </div>
 </AppLayout>
 );
};

export default IdentityAlignmentPage;
