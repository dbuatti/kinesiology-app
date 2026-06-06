
import React from "react";
import { Settings, Mail, Link as LinkIcon, Sparkles, Globe, Calendar } from "lucide-react";
import AppLayout from "@/components/crm/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import IntegrationStatus from "../components/crm/settings/IntegrationStatus";
import StripeSettings from "../components/crm/settings/StripeSettings";
import NotionSettings from "../components/crm/settings/NotionSettings";
import CalcomSettings from "../components/crm/settings/CalcomSettings";
import DuplicateResolutionCenter from "../components/crm/settings/DuplicateResolutionCenter";
import AccountSettings from "../components/crm/settings/AccountSettings";
import DocumentationSettings from "../components/crm/settings/DocumentationSettings";
import AppearanceSettings from "../components/crm/settings/AppearanceSettings";

const SettingsPage = () => {
  return (
    <AppLayout variant="wide">
      <div className="space-y-8 animate-in fade-in duration-500 pb-20">
        <PageHeader
          title="Settings"
          subtitle="Manage your account, appearance, and integrations."
          icon={Settings}
          iconClassName="bg-slate-700"
          breadcrumbs={[{ label: "Settings" }]}
        />

        <Tabs defaultValue="account" className="space-y-8">
          <TabsList className="bg-muted/50 p-1 rounded-2xl border border-border/50 w-full max-w-lg grid grid-cols-3">
            <TabsTrigger value="account" className="rounded-xl font-bold text-xs py-2.5">
              Account
            </TabsTrigger>
            <TabsTrigger value="integrations" className="rounded-xl font-bold text-xs py-2.5">
              Integrations
            </TabsTrigger>
            <TabsTrigger value="data" className="rounded-xl font-bold text-xs py-2.5">
              Data & Tools
            </TabsTrigger>
          </TabsList>

          {/* ACCOUNT TAB */}
          <TabsContent value="account" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AppearanceSettings />
              <AccountSettings />
            </div>
          </TabsContent>

          {/* INTEGRATIONS TAB */}
          <TabsContent value="integrations" className="space-y-6">
            {/* Integration Status Overview */}
            <div className="bg-card rounded-[2rem] border border-border shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Globe size={16} />
                </div>
                <div>
                  <h3 className="font-black text-foreground text-sm">Integration Status</h3>
                  <p className="text-xs text-muted-foreground font-medium">Status of your linked clinical and marketing tools.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <IntegrationStatus name="Kit (ConvertKit)" icon={Mail} description="Marketing & Newsletter Sync" />
                <IntegrationStatus name="Notion" icon={LinkIcon} description="Clinical Database & Planner" />
                <IntegrationStatus name="Gmail API" icon={Sparkles} description="Automated Onboarding Emails" />
                <IntegrationStatus name="Cal.com" icon={Calendar} description="Booking & Scheduling" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CalcomSettings />
              <NotionSettings />
            </div>

            <StripeSettings />
          </TabsContent>

          {/* DATA & TOOLS TAB */}
          <TabsContent value="data" className="space-y-6">
            <DuplicateResolutionCenter />
            <DocumentationSettings />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
