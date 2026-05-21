"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Settings,
  User,
  LogOut,
  Mail,
  Link as LinkIcon,
  Sparkles,
  Globe,
  FileText,
  LayoutGrid,
  ArrowRight,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess } from "@/utils/toast";
import { useNavigate, Link } from "react-router-dom";

// Imported modular components using relative paths
import IntegrationStatus from "../components/crm/settings/IntegrationStatus";
import StripeSettings from "../components/crm/settings/StripeSettings";
import NotionSettings from "../components/crm/settings/NotionSettings";
import CalcomSettings from "../components/crm/settings/CalcomSettings";
import DuplicateResolutionCenter from "../components/crm/settings/DuplicateResolutionCenter";

const SettingsPage = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      showSuccess("Signed out successfully");
      navigate('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

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

          <Card className="border-none shadow-lg rounded-[2.5rem] bg-white dark:bg-slate-950 overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-indigo-500 font-black flex items-center gap-3">
                <FileText size={24} className="text-indigo-500" /> Documentation & Audit
              </CardTitle>
              <CardDescription className="font-medium">Export site structure and content breakdowns.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-4">
              <Link to="/settings/audit">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:border-indigo-300 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                      <LayoutGrid size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white">Site Audit Tool</p>
                      <p className="text-[10px] text-slate-500 font-medium">Full text breakdown of all pages</p>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </CardContent>
          </Card>

          <CalcomSettings />
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-lg rounded-[2.5rem] bg-white dark:bg-slate-950 overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-black flex items-center gap-3">
                <User size={24} className="text-rose-500" /> Account
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-lg">
                  P
                </div>
                <div>
                  <p className="font-black text-slate-900 dark:text-white">Practitioner Account</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active Session</p>
                </div>
              </div>
              <Button 
                variant="destructive" 
                onClick={handleSignOut}
                className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-100 dark:shadow-none"
              >
                <LogOut size={18} className="mr-2" /> Sign Out of System
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;