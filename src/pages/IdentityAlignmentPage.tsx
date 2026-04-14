import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, PlayCircle, Info } from "lucide-react";
import IdentityAlignmentBackground from '@/components/crm/IdentityAlignmentBackground';
import IdentityAlignmentTool from '@/components/crm/IdentityAlignmentTool';
import AppLayout from '@/components/crm/AppLayout';
import PageTransition from '@/components/shared/PageTransition';

const IdentityAlignmentPage = () => {
  return (
    <AppLayout>
      <PageTransition>
        <div className="container max-w-5xl py-8 space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-serif font-bold tracking-tight">Identity Alignment Protocol</h1>
              <p className="text-muted-foreground mt-1">Neural Reconsolidation & Autonomic Safety</p>
            </div>
          </div>

          <Tabs defaultValue="practice" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
              <TabsTrigger value="learn" className="gap-2">
                <BookOpen size={16} />
                Learn
              </TabsTrigger>
              <TabsTrigger value="practice" className="gap-2">
                <PlayCircle size={16} />
                Practice
              </TabsTrigger>
            </TabsList>

            <TabsContent value="learn" className="mt-0">
              <IdentityAlignmentBackground />
            </TabsContent>

            <TabsContent value="practice" className="mt-0">
              <IdentityAlignmentTool />
            </TabsContent>
          </Tabs>

          {/* Clinical Notes Footer */}
          <div className="mt-12 p-6 bg-blue-500/5 border border-blue-500/10 rounded-3xl flex gap-4 items-start">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center shrink-0 text-blue-600">
              <Info size={20} />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-blue-900 dark:text-blue-400">Practitioner's Playbook</h4>
              <p className="text-sm text-blue-800/70 dark:text-blue-400/70 leading-relaxed">
                The Identity Alignment Protocol is most effective when the client is in a state of autonomic safety. 
                If you detect high sympathetic arousal, pause the protocol and use a down-regulation technique 
                (like the T1 Reset or Diaphragm Reset) before proceeding to Phase 3.
              </p>
            </div>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  );
};

export default IdentityAlignmentPage;