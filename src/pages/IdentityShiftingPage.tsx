
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, PlayCircle, Fingerprint, Info } from "lucide-react";
import IdentityShiftingBackground from "@/components/crm/IdentityShiftingBackground";
import IdentityShiftingTool from "@/components/crm/IdentityShiftingTool";
import PageHeader from "@/components/shared/PageHeader";

import AppLayout from '@/components/crm/AppLayout';

const IdentityShiftingPage = () => {
 return (
 <AppLayout>
  <div className="max-w-5xl mx-auto space-y-4">
  <PageHeader 
    title="Identity Shifting"
    subtitle="Explore the nature of the self and dissolve problematic identities."
    icon={Fingerprint}
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
  <IdentityShiftingBackground />
  </div>
  </TabsContent>

  <TabsContent value="practice" className="mt-0 focus-visible:ring-0">
  <div className="max-w-4xl mx-auto">
  <IdentityShiftingTool singlePage />
  </div>
  </TabsContent>
 </Tabs>

 <div className="max-w-3xl mx-auto bg-primary/5 border border-indigo-500/10 rounded-xl p-4 flex gap-3 items-start">
  <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
  <Info className="text-primary" size={14} />
  </div>
  <div className="space-y-1">
  <h4 className="font-semibold text-primary text-[10px] uppercase tracking-wider">Practitioner Note</h4>
  <p className="text-xs text-chart-primary/70 leading-relaxed font-medium">
  Identity shifting is a powerful tool for deep transformation. It is most effective when the practitioner is in a grounded, neutral state. If you feel overwhelmed during the process, take a break and return to the "Learn" section to ground yourself in the philosophical foundations.
  </p>
  </div>
 </div>
 </div>
 </AppLayout>
 );
};

export default IdentityShiftingPage;
