"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, PlayCircle, Fingerprint, Info } from "lucide-react";
import IdentityShiftingBackground from "@/components/crm/IdentityShiftingBackground";
import IdentityShiftingTool from "@/components/crm/IdentityShiftingTool";
import PageTransition from "@/components/shared/PageTransition";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import AppLayout from '@/components/crm/AppLayout';
import PageHeader from '@/components/shared/PageHeader';

const IdentityShiftingPage = () => {
  return (
    <AppLayout variant="workspace">
      <div className="space-y-10 animate-in fade-in duration-700">
        <PageHeader 
          title="Identity Shifting"
          subtitle="Explore the nature of the self and dissolve problematic identities."
          icon={Fingerprint}
          breadcrumbs={[{ label: "Practice", path: "/lab" }, { label: "Identity Map", path: "/lab?tab=map" }, { label: "Identity Shifting" }]}
        />

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
    </AppLayout>
  );
};

export default IdentityShiftingPage;