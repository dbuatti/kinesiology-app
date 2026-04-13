import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, PlayCircle, Fingerprint, Info } from "lucide-react";
import IdentityShiftingBackground from "@/components/crm/IdentityShiftingBackground";
import IdentityShiftingTool from "@/components/crm/IdentityShiftingTool";
import PageTransition from "@/components/shared/PageTransition";
import Breadcrumbs from "@/components/shared/Breadcrumbs";

const IdentityShiftingPage = () => {
  return (
    <PageTransition>
      <div className="container mx-auto p-4 lg:p-8 max-w-7xl space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Breadcrumbs
              items={[
                { label: "Sandbox", path: "/sandbox/identity-shifting" },
                { label: "Identity Shifting" }
              ]}
            />
            <h1 className="text-4xl font-serif font-bold tracking-tight mt-2 flex items-center gap-3">
              <Fingerprint className="text-primary" size={36} />
              Identity Shifting
            </h1>
            <p className="text-muted-foreground mt-1">Explore the nature of the self and dissolve problematic identities.</p>
          </div>
        </div>

        <Tabs defaultValue="practice" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="bg-secondary/50 p-1 rounded-2xl h-14">
              <TabsTrigger 
                value="learn" 
                className="rounded-xl px-8 h-12 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-lg transition-all"
              >
                <BookOpen className="mr-2" size={18} />
                <span className="font-bold text-sm">Learn</span>
              </TabsTrigger>
              <TabsTrigger 
                value="practice" 
                className="rounded-xl px-8 h-12 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-lg transition-all"
              >
                <PlayCircle className="mr-2" size={18} />
                <span className="font-bold text-sm">Practice</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="learn" className="mt-0 focus-visible:ring-0">
            <div className="max-w-5xl mx-auto">
              <IdentityShiftingBackground />
            </div>
          </TabsContent>

          <TabsContent value="practice" className="mt-0 focus-visible:ring-0">
            <div className="bg-white dark:bg-slate-950 rounded-[3rem] border border-secondary/30 shadow-2xl p-8 lg:p-12">
              <IdentityShiftingTool />
            </div>
          </TabsContent>
        </Tabs>

        {/* Pro Tip / Footer Note */}
        <div className="max-w-3xl mx-auto bg-indigo-500/5 border border-indigo-500/10 rounded-3xl p-6 flex gap-4 items-start">
          <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center shrink-0">
            <Info className="text-indigo-500" size={20} />
          </div>
          <div>
            <h4 className="font-bold text-indigo-900 dark:text-indigo-300 text-sm">Practitioner Note</h4>
            <p className="text-xs text-indigo-700/70 dark:text-indigo-400/70 leading-relaxed mt-1">
              Identity shifting is a powerful tool for deep transformation. It is most effective when the practitioner is in a grounded, neutral state. If you feel overwhelmed during the process, take a break and return to the "Learn" section to ground yourself in the philosophical foundations.
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default IdentityShiftingPage;