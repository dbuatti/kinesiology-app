
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Layers, Sparkles, Users, Calendar, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import SettingsActionCard from "./SettingsActionCard";

const NotionSettings = () => {
  const [configuringNotion, setConfiguringNotion] = useState(false);
  const [configuringFnh, setConfiguringFnh] = useState(false);
  const [syncingNotionAll, setSyncingNotionAll] = useState(false);
  const [syncingAppointmentsAll, setSyncingAppointmentsAll] = useState(false);

  const handleConfigureNotionSchema = async () => {
    setConfiguringNotion(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-to-notion', {
        body: { 
          action: 'configure-schema',
          origin: window.location.origin
        }
      });
      if (error) throw error;
      showSuccess(data.message || "Notion databases successfully configured!");
    } catch (err: any) {
      showError(err.message || "Failed to configure Notion databases. Ensure your Notion integration has edit access.");
    } finally {
      setConfiguringNotion(false);
    }
  };

  const handleConfigureFnhSchema = async () => {
    setConfiguringFnh(true);
    try {
      const { data, error } = await supabase.functions.invoke('configure-fnh-schema', {
        body: { step: 'all' }
      });
      if (error) throw error;
      const results = data.results || {};
      const summary = Object.entries(results)
        .map(([k, v]: [string, any]) => `${k}: ${v.success ? '✓' : '✗'}`)
        .join(', ');
      showSuccess(`FNH Schema configured! ${summary}`);
    } catch (err: any) {
      showError(err.message || "Failed to configure FNH schema.");
    } finally {
      setConfiguringFnh(false);
    }
  };

  const handleSyncAllToNotion = async () => {
    setSyncingNotionAll(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-to-notion', {
        body: { 
          action: 'sync-all-clients',
          origin: window.location.origin
        }
      });
      if (error) throw error;
      showSuccess(`Successfully synced ${data.syncedCount} clients to Notion!`);
    } catch (err: any) {
      showError(err.message);
    } finally {
      setSyncingNotionAll(false);
    }
  };

  const handleSyncAllAppointmentsToNotion = async () => {
    setSyncingAppointmentsAll(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-to-notion', {
        body: { 
          action: 'sync-all-appointments',
          origin: window.location.origin
        }
      });
      if (error) throw error;
      showSuccess(`Successfully synced ${data.syncedCount} appointments to Notion!`);
    } catch (err: any) {
      showError(err.message);
    } finally {
      setSyncingAppointmentsAll(false);
    }
  };

  return (
    <Card className="border-none shadow-xl rounded-[2.5rem] bg-card overflow-hidden border-2 border-purple-100 dark:border-purple-900/30">
      <CardHeader className="p-8 pb-4 bg-purple-50/50">
        <CardTitle className="text-xl font-black flex items-center gap-3 text-purple-900">
          <Layers size={24} /> Notion Database Sync
        </CardTitle>
        <CardDescription className="text-purple-700 font-medium">Bulk sync your clients and appointments to Notion.</CardDescription>
      </CardHeader>
      <CardContent className="p-8 pt-0 space-y-6">
        <div className="w-full">
          <SettingsActionCard
            title="Notion Schema Auto-Configurator"
            description="Automatically create all required properties and establish two-way relations in your Notion databases."
            buttonText="Configure Notion Schema"
            buttonIcon={Sparkles}
            onClick={handleConfigureNotionSchema}
            loading={configuringNotion}
            themeColor="purple"
          />
        </div>

        <div className="w-full">
          <SettingsActionCard
            title="FNH Client Database Schema"
            description="Create the Session Notes database, add clinical tracking fields (Status, Programme, Sessions), and set up the full FNH schema in Notion."
            buttonText="Configure FNH Schema"
            buttonIcon={Database}
            onClick={handleConfigureFnhSchema}
            loading={configuringFnh}
            themeColor="purple"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingsActionCard
            title="Bulk Sync Clients"
            description="Push all existing CRM clients into your Notion Client Database."
            buttonText="Sync All to Notion"
            buttonIcon={Users}
            onClick={handleSyncAllToNotion}
            loading={syncingNotionAll}
            themeColor="indigo"
          />

          <SettingsActionCard
            title="Bulk Sync Appointments"
            description="Push all existing appointments to Notion and link them to clients."
            buttonText="Sync All Appointments"
            buttonIcon={Calendar}
            onClick={handleSyncAllAppointmentsToNotion}
            loading={syncingAppointmentsAll}
            themeColor="indigo"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default NotionSettings;