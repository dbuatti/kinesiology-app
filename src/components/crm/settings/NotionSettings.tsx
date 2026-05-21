"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layers, Loader2, Sparkles, Users, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";

const NotionSettings = () => {
  const [configuringNotion, setConfiguringNotion] = useState(false);
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
    <Card className="border-none shadow-xl rounded-[2.5rem] bg-white dark:bg-slate-950 overflow-hidden border-2 border-purple-100">
      <CardHeader className="p-8 pb-4 bg-purple-50/50">
        <CardTitle className="text-xl font-black flex items-center gap-3 text-purple-900">
          <Layers size={24} /> Notion Database Sync
        </CardTitle>
        <CardDescription className="text-purple-700 font-medium">Bulk sync your clients and appointments to Notion.</CardDescription>
      </CardHeader>
      <CardContent className="p-8 pt-0 space-y-6">
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-purple-100 dark:border-purple-900/30 space-y-4">
          <div className="space-y-1">
            <h4 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">Notion Schema Auto-Configurator</h4>
            <p className="text-xs text-slate-500 leading-relaxed">Automatically create all required properties and establish two-way relations in your Notion databases.</p>
          </div>
          <Button 
            onClick={handleConfigureNotionSchema} 
            disabled={configuringNotion}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-12 font-black text-[10px] uppercase tracking-widest shadow-lg"
          >
            {configuringNotion ? <Loader2 className="mr-2 animate-spin" /> : <Sparkles size={16} className="mr-2" />}
            Configure Notion Schema
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-purple-100 dark:border-purple-900/30 space-y-4">
            <div className="space-y-1">
              <h4 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">Bulk Sync Clients</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Push all existing CRM clients into your Notion Client Database.</p>
            </div>
            <Button 
              onClick={handleSyncAllToNotion} 
              disabled={syncingNotionAll}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 font-black text-[10px] uppercase tracking-widest shadow-lg"
            >
              {syncingNotionAll ? <Loader2 className="mr-2 animate-spin" /> : <Users size={16} className="mr-2" />}
              Sync All to Notion
            </Button>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-purple-100 dark:border-purple-900/30 space-y-4">
            <div className="space-y-1">
              <h4 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">Bulk Sync Appointments</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Push all existing appointments to Notion and link them to clients.</p>
            </div>
            <Button 
              onClick={handleSyncAllAppointmentsToNotion} 
              disabled={syncingAppointmentsAll}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 font-black text-[10px] uppercase tracking-widest shadow-lg"
            >
              {syncingAppointmentsAll ? <Loader2 className="mr-2 animate-spin" /> : <Calendar size={16} className="mr-2" />}
              Sync All Appointments
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotionSettings;