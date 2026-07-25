
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreditCard, Zap, Users, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import SettingsActionCard from "./SettingsActionCard";

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
    <Card className="border-none shadow-xl rounded-xl bg-card overflow-hidden border-2 border-indigo-100 dark:border-indigo-900/30">
      <CardHeader className="p-4 pb-4 bg-indigo-50/50">
        <CardTitle className="text-xl font-black flex items-center gap-3 text-indigo-900">
          <CreditCard size={24} /> Stripe Clinical Payments
        </CardTitle>
        <CardDescription className="text-indigo-700 font-medium">Link your CRM clients to Stripe for seamless Tap-to-Pay and invoicing.</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingsActionCard
            title="1. Initialize FNH Product"
            description="Creates the '$70 FNH Clinical Assessment' product in Stripe."
            buttonText="Initialize"
            buttonIcon={Zap}
            onClick={handleInitializeStripe}
            loading={initializingStripe}
            themeColor="indigo"
          />

          <SettingsActionCard
            title="2. Bulk Sync Clients"
            description="Push all existing CRM clients into your Stripe customer list."
            buttonText="Sync All to Stripe"
            buttonIcon={Users}
            onClick={handleSyncAllToStripe}
            loading={syncingAll}
            themeColor="emerald"
          />
        </div>

        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/30 space-y-3">
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