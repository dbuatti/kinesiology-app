"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Loader2, Zap, Users, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";

const StripeSettings = () => {
  const [initializingStripe, setInitializingStripe] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);

  const handleInitializeStripe = async () => {
    setInitializingStripe(true);
    try {
      const { error } = await supabase.functions.invoke('stripe-manager', {
        body: { action: 'setup-product' }
      });
      if (error) throw error;
      showSuccess("Stripe Product initialized!");
    } catch (err: any) {
      showError(err.message);
    } finally {
      setInitializingStripe(false);
    }
  };

  const handleSyncAllToStripe = async () => {
    setSyncingAll(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-manager', {
        body: { action: 'sync-all' }
      });
      if (error) throw error;
      showSuccess(`Successfully synced ${data.syncedCount} clients to Stripe!`);
    } catch (err: any) {
      showError(err.message);
    } finally {
      setSyncingAll(false);
    }
  };

  return (
    <Card className="border-none shadow-xl rounded-[2.5rem] bg-white dark:bg-slate-950 overflow-hidden border-2 border-indigo-100">
      <CardHeader className="p-8 pb-4 bg-indigo-50/50">
        <CardTitle className="text-xl font-black flex items-center gap-3 text-indigo-900">
          <CreditCard size={24} /> Stripe Clinical Payments
        </CardTitle>
        <CardDescription className="text-indigo-700 font-medium">Link your CRM clients to Stripe for seamless Tap-to-Pay and invoicing.</CardDescription>
      </CardHeader>
      <CardContent className="p-8 pt-0 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-indigo-100 dark:border-indigo-900/30 space-y-4">
            <div className="space-y-1">
              <h4 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">1. Initialize FNH Product</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Creates the '$50 FNH Clinical Assessment' product in Stripe.</p>
            </div>
            <Button 
              onClick={handleInitializeStripe} 
              disabled={initializingStripe}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 font-black text-[10px] uppercase tracking-widest shadow-lg"
            >
              {initializingStripe ? <Loader2 className="mr-2 animate-spin" /> : <Zap size={16} className="mr-2" />}
              Initialize
            </Button>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-indigo-100 dark:border-indigo-900/30 space-y-4">
            <div className="space-y-1">
              <h4 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">2. Bulk Sync Clients</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Push all existing CRM clients into your Stripe customer list.</p>
            </div>
            <Button 
              onClick={handleSyncAllToStripe} 
              disabled={syncingAll}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 font-black text-[10px] uppercase tracking-widest shadow-lg"
            >
              {syncingAll ? <Loader2 className="mr-2 animate-spin" /> : <Users size={16} className="mr-2" />}
              Sync All to Stripe
            </Button>
          </div>
        </div>

        <div className="p-6 bg-amber-50 dark:bg-amber-950/20 rounded-3xl border border-amber-100 dark:border-amber-900/30 space-y-3">
          <div className="flex items-center gap-2">
            <Info size={16} className="text-amber-600" />
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Automation Active</p>
          </div>
          <p className="text-xs text-amber-800 dark:text-amber-200 font-medium">
            New bookings from Cal.com will now automatically create Stripe customers. Use the button above to sync your current database.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default StripeSettings;