
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, PlayCircle, Info, Target } from "lucide-react";
import IdentityAlignmentBackground from '@/components/crm/IdentityAlignmentBackground';
import IdentityAlignmentTool from '@/components/crm/IdentityAlignmentTool';
import AppLayout from '@/components/crm/AppLayout';
import PageTransition from '@/components/shared/PageTransition';
import Breadcrumbs from '@/components/shared/Breadcrumbs';

const IdentityAlignmentPage = () => {
 return (
 <AppLayout>
 <PageTransition>
 <div className="container mx-auto p-4 lg:p-8 max-w-5xl space-y-12">
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
 <div>
 <Breadcrumbs
 items={[
 { label: "Sandbox", path: "/sandbox/identity-alignment" },
 { label: "Identity Alignment" }
 ]}
 />
 <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight mt-4 flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm ">
 <Target size={28} />
 </div>
 Identity Alignment
 </h1>
 <p className="text-lg text-muted-foreground mt-2 font-medium">Neural Reconsolidation & Autonomic Safety Protocol.</p>
 </div>
 </div>

 <Tabs defaultValue="practice" className="w-full">
 <div className="flex justify-center mb-12">
 <TabsList className="bg-muted p-1 rounded-xl h-14 border border-border ">
 <TabsTrigger 
 value="learn" 
 className="rounded-xl px-8 h-12 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all font-medium text-xs uppercase tracking-wider"
 >
 <BookOpen className="mr-2" size={16} />
 Learn
 </TabsTrigger>
 <TabsTrigger 
 value="practice" 
 className="rounded-xl px-8 h-12 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all font-medium text-xs uppercase tracking-wider"
 >
 <PlayCircle className="mr-2" size={16} />
 Practice
 </TabsTrigger>
 </TabsList>
 </div>

 <TabsContent value="learn" className="mt-0 focus-visible:ring-0 animate-in fade-in duration-500">
 <div className="max-w-5xl mx-auto">
 <IdentityAlignmentBackground />
 </div>
 </TabsContent>

 <TabsContent value="practice" className="mt-0 focus-visible:ring-0 animate-in fade-in duration-700">
 <div className="max-w-4xl mx-auto">
 <IdentityAlignmentTool />
 </div>
 </TabsContent>
 </Tabs>

 {/* Clinical Notes Footer */}
 <div className="max-w-3xl mx-auto bg-chart-primary/5 border border-blue-500/10 rounded-xl p-8 flex gap-6 items-start">
 <div className="w-12 h-12 bg-chart-primary/10 rounded-xl flex items-center justify-center shrink-0 text-chart-primary">
 <Info size={24} />
 </div>
 <div className="space-y-2">
 <h4 className="font-semibold text-blue-900 text-sm uppercase tracking-wider">Practitioner's Playbook</h4>
 <p className="text-sm text-blue-800/70 leading-relaxed font-medium">
 The Identity Alignment Protocol is most effective when the client is in a state of autonomic safety. If you detect high sympathetic arousal, pause and use a down-regulation technique.
 </p>
 </div>
 </div>
 </div>
 </PageTransition>
 </AppLayout>
 );
};

export default IdentityAlignmentPage;