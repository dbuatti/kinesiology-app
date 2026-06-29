
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, PlayCircle, Sparkles, ShieldAlert, Info } from "lucide-react";
import LimitingBeliefsBackground from "@/components/crm/LimitingBeliefsBackground";
import LimitingBeliefsTool from "@/components/crm/LimitingBeliefsTool";
import LimitingBeliefsAnalysis from "@/components/crm/LimitingBeliefsAnalysis";

import AppLayout from '@/components/crm/AppLayout';

const LimitingBeliefsPage = () => {
 return (
 <AppLayout>
  <div className="max-w-5xl mx-auto space-y-4">
 <div className="flex items-center gap-3">
  <div className="w-8 h-8 rounded-lg bg-destructive text-white flex items-center justify-center">
    <ShieldAlert size={16} />
  </div>
  <div>
    <h1 className="text-xl font-serif font-semibold tracking-tight">Limiting Beliefs</h1>
    <p className="text-sm text-muted-foreground">Dissolve limiting beliefs and integrate positive ones through identity shifting.</p>
  </div>
 </div>

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
  <TabsTrigger 
  value="analysis" 
  className="rounded-md px-3 h-7 data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all font-medium text-[10px] uppercase tracking-wider"
  >
  <Sparkles className="mr-1.5" size={11} />
  Review
  </TabsTrigger>
  </TabsList>
  </div>

  <TabsContent value="learn" className="mt-0 focus-visible:ring-0">
  <div className="max-w-5xl mx-auto">
  <LimitingBeliefsBackground />
  </div>
  </TabsContent>

  <TabsContent value="practice" className="mt-0 focus-visible:ring-0">
  <div className="max-w-4xl mx-auto">
  <LimitingBeliefsTool />
  </div>
  </TabsContent>

  <TabsContent value="analysis" className="mt-0 focus-visible:ring-0">
  <div className="max-w-3xl mx-auto">
  <LimitingBeliefsAnalysis />
  </div>
  </TabsContent>
 </Tabs>

 <div className="max-w-3xl mx-auto bg-destructive/5 border border-rose-500/10 rounded-xl p-4 flex gap-3 items-start">
  <div className="w-6 h-6 bg-destructive/10 rounded-lg flex items-center justify-center shrink-0">
  <Info className="text-destructive" size={14} />
  </div>
  <div className="space-y-1">
  <h4 className="font-semibold text-rose-900 text-[10px] uppercase tracking-wider">Practitioner Note</h4>
  <p className="text-xs text-chart-destructive/70 leading-relaxed font-medium">
  This protocol is based on the "Psychology of Suffering and Limiting Beliefs" framework. It works by creating cognitive and emotional flexibility between the limiting identity and the desired positive identity.
  </p>
  </div>
 </div>
 </div>
 </AppLayout>
 );
};

export default LimitingBeliefsPage;
