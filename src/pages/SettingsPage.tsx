"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Settings,
  Mail,
  Link as LinkIcon,
  Sparkles,
  Globe,
  Calendar
} from "lucide-react";

// Imported modular components using relative paths
import IntegrationStatus from "../components/crm/settings/IntegrationStatus";
import StripeSettings from "../components/crm/settings/StripeSettings";
import NotionSettings from "../components/crm/settings/NotionSettings";
import CalcomSettings from "../components/crm/settings/CalcomSettings";
import DuplicateResolutionCenter from "../components/crm/settings/DuplicateResolutionCenter";
import AccountSettings from "../components/crm/settings/AccountSettings";
import DocumentationSettings from "../components/crm/settings/DocumentationSettings";

const SettingsPage = () => {
  return (
    <div className="p-4 md:p-8 max-w-full mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Settings size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">System Settings</h1>
            <p className="text-slate-500 font-medium">Manage your clinical infrastructure and automations.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white dark:bg-slate-950 overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-black flex items-center gap-3">
                <Globe size={24} className="text-indigo-500" /> Integration Ecosystem
              </CardTitle>
              <CardDescription className="font-medium">Status of your linked clinical and marketing tools.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <IntegrationStatus name="Kit (ConvertKit)" icon={Mail} description="Marketing & Newsletter Sync" />
                <IntegrationStatus name="Notion" icon={LinkIcon} description="Clinical Database & Planner" />
                <IntegrationStatus name="Gmail API" icon={Sparkles} description="Automated Onboarding Emails" />
                <IntegrationStatus name="Cal.com" icon={Calendar} description="Booking & Scheduling" />
              </div>
            </CardContent>
          </Card>

          <NotionSettings />

          <DuplicateResolutionCenter />

          <StripeSettings />

          <DocumentationSettings />

          <CalcomSettings />
        </div>

        <div className="space-y-6">
          <AccountSettings />
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;