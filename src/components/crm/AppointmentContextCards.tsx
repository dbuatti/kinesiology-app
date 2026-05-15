"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Zap, Clock, Target, Activity, Home, CreditCard, CheckCircle2, Loader2, QrCode, ChevronDown, DollarSign,
  MessageSquare, Lightbulb, Layers, Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import EditableField from "@/components/shared/EditableField";
import QuickAcupointSelector from "./QuickAcupointSelector";
import { AppointmentWithClient } from "@/types/crm";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface AppointmentContextCardsProps {
  appointment: AppointmentWithClient;
  currentPeakMeridian: any;
  onSaveField: (field: string, value: any) => Promise<void>;
}

const SESSION_STAGES = [
  { id: 'goal', name: "Goal", duration: 15, icon: Target },
  { id: 'activation', name: "Activation", duration: 15, icon: Zap },
  { id: 'correction', name: "Correction", duration: 20, icon: Activity },
  { id: 'challenge', name: "Challenge", duration: 5, icon: ShieldAlert },
  { id: 'home', name: "Home", duration: 5, icon: Home },
];

const AppointmentContextCards = ({ appointment, currentPeakMeridian, onSaveField }: AppointmentContextCardsProps) => {
  const [generatingLink, setGeneratingLink] = useState(false);
  const [completedStages, setCompletedStages] = useState<string[]>([]);

  const handleGeneratePaymentLink = async () => {
    setGeneratingLink(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-manager', {
        body: { action: 'create-checkout', clientId: appointment.clients.id, appointmentId: appointment.id, clientData: appointment.clients }
      });
      if (error) throw error;
      if (data.url) {
        await onSaveField('payment_link', data.url);
        window.open(data.url, '_blank');
        showSuccess("Link generated.");
      }
    } catch (err: any) {
      showError("Failed to generate link.");
    } finally {
      setGeneratingLink(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Session Strategy: Compact */}
      <div className="bg-slate-50 border border-slate-100">
        <div className="p-3 border-b border-slate-100 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Strategy</span>
          <span className="text-[9px] font-bold text-slate-400">{completedStages.length}/5</span>
        </div>
        <div className="grid grid-cols-5 gap-0">
          {SESSION_STAGES.map((stage) => {
            const isDone = completedStages.includes(stage.id);
            return (
              <button 
                key={stage.id} 
                onClick={() => setCompletedStages(prev => isDone ? prev.filter(s => s !== stage.id) : [...prev, stage.id])}
                className={cn(
                  "h-10 flex items-center justify-center border-r border-slate-100 last:border-r-0 transition-colors",
                  isDone ? "bg-emerald-500 text-white" : "bg-white text-slate-300 hover:bg-slate-50"
                )}
                title={stage.name}
              >
                {isDone ? <Check size={14} /> : <stage.icon size={14} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Billing: Compact */}
      <div className="p-4 bg-white border border-slate-100 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard size={14} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest">Billing</span>
          </div>
          <Switch 
            checked={appointment.is_paid || false} 
            onCheckedChange={(checked) => onSaveField('is_paid', checked)} 
            className="scale-75"
          />
        </div>
        {appointment.is_paid && !appointment.payment_received && (
          <Button 
            onClick={handleGeneratePaymentLink}
            disabled={generatingLink}
            className="w-full h-8 bg-primary text-white font-black text-[9px] uppercase tracking-widest"
          >
            {generatingLink ? <Loader2 className="animate-spin" size={12} /> : <QrCode size={12} className="mr-2" />}
            Stripe Link
          </Button>
        )}
      </div>

      {/* Acupoints: Compact */}
      <div className="p-4 bg-white border border-slate-100 space-y-3">
        <div className="flex items-center gap-2">
          <Target size={14} className="text-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest">Acupoints</span>
        </div>
        <QuickAcupointSelector 
          currentValue={appointment.acupoints} 
          onSelect={(val) => onSaveField('acupoints', val)} 
        />
      </div>
    </div>
  );
};

export default AppointmentContextCards;