
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, PlayCircle, Fingerprint, Info } from "lucide-react";
import IdentityShiftingBackground from "@/components/crm/IdentityShiftingBackground";
import IdentityShiftingTool from "@/components/crm/IdentityShiftingTool";
import PageTransition from "@/components/shared/PageTransition";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import AppLayout from '@/components/crm/AppLayout';

const IdentityShiftingPage = () => {
  return (
    <AppLayout>
      <PageTransition>
        <div className="container mx-auto p-4 lg:p-8 max-w-5xl space-y-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <Breadcrumbs
                items={[
                  { label: "Sandbox", path: "/sandbox/identity-shifting" },
                  { label: "Identity Shifting" }
                ]}
              />
              <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight mt-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-200 dark:shadow-none">
                  <Fingerprint size={28} />
                </div>
                Identity Shifting
              </h1>
              <p className="text-lg text-muted-foreground mt-2 font-medium">Explore the nature of the self and dissolve problematic identities.</p>
            </div>
          </div>

          <Tabs defaultValue="practice" className="w-full">
            <div className="flex justify-center mb-12">
              <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl h-14 border border-slate-200 dark:border-slate-800">
                <TabsTrigger 
                  value="learn" 
                  className="rounded-xl px-8 h-12 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-lg transition-all font-bold text-xs uppercase tracking-widest"
                >
                  <BookOpen className="mr-2" size={16} />
                  Learn
                </TabsTrigger>
                <TabsTrigger 
                  value="practice" 
                  className="rounded-xl px-8 h-12 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-lg transition-all font-bold text-xs uppercase tracking-widest"
                >
                  <PlayCircle className="mr-2" size={16} />
                  Practice
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="learn" className="mt-0 focus-visible:ring-0 animate-in fade-in duration-500">
              <div className="max-w-5xl mx-auto">
                <IdentityShiftingBackground />
              </div>
            </TabsContent>

            <TabsContent value="practice" className="mt-0 focus-visible:ring-0 animate-in fade-in duration-700">
              <div className="max-w-4xl mx-auto">
                <IdentityShiftingTool />
              </div>
            </TabsContent>
          </Tabs>

          {/* Pro Tip / Footer Note */}
          <div className="max-w-3xl mx-auto bg-indigo-500/5 border border-indigo-500/10 rounded-[2.5rem] p-8 flex gap-6 items-start">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center shrink-0">
              <Info className="text-indigo-500" size={24} />
            </div>
            <div className="space-y-2">
              <h4 className="font-black text-indigo-900 dark:text-indigo-300 text-sm uppercase tracking-widest">Practitioner Note</h4>
              <p className="text-sm text-indigo-700/70 dark:text-indigo-400/70 leading-relaxed font-medium">
                Identity shifting is a powerful tool for deep transformation. It is most effective when the practitioner is in a grounded, neutral state. If you feel overwhelmed during the process, take a break and return to the "Learn" section to ground yourself in the philosophical foundations.
              </p>
            </div>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  );
};

export default IdentityShiftingPage;