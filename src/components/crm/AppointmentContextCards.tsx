"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, ExternalLink, Clock, Target, ShieldAlert, Activity, Brain, Heart, Home, Sparkles, CreditCard, CheckCircle2, Wallet, Smartphone, Loader2, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import EditableField from "@/components/shared/EditableField";
import QuickAcupointSelector from "./QuickAcupointSelector";
import { AppointmentWithClient } from "@/types/crm";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

interface AppointmentContextCardsProps {
  appointment: AppointmentWithClient;
  currentPeakMeridian: any;
  onSaveField: (field: string, value: any) => Promise<void>;
}

const SESSION_STAGES = [
  { name: "Goal Setting", duration: 15, icon: Target, color: "text-indigo-500" },
  { name: "Activation", duration: 15, icon: Zap, color: "text-blue-500" },
  { name: "Correction", duration: 20, icon: Activity, color: "text-emerald-500" },
  { name: "Challenge", duration: 5, icon: ShieldAlert, color: "text-amber-500" },
  { name: "Home Reinforcement", duration: 5, icon: Home, color: "text-rose-500" },
];

const AppointmentContextCards = ({ appointment, currentPeakMeridian, onSaveField }: AppointmentContextCardsProps) => {
  const [generatingLink, setGeneratingLink] = useState(false);

  const handleGeneratePaymentLink = async () => {
    setGeneratingLink(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-manager', {
        body: { 
          action: 'create-checkout', 
          clientId: appointment.clients.id,
          appointmentId: appointment.id,
          clientData: appointment.clients
        }
      });

      if (error) throw error;

      if (data.url) {
        await onSaveField('payment_link', data.url);
        window.open(data.url, '_blank');
        showSuccess("Payment link generated and opened!");
      }
    } catch (err: any) {
      showError(err.message || "Failed to generate link. Ensure client is synced to Stripe.");
    } finally {
      setGeneratingLink(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Session Strategy Card */}
      <Card className="border-none shadow-lg rounded-[2.5rem] bg-slate-900 text-white overflow-hidden">
        <CardHeader className="p-6 pb-2">
          <CardTitle className="text-sm font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2">
            <Clock size={16} /> Session Strategy (60m)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-4">
          <div className="grid grid-cols-1 gap-2">
            {SESSION_STAGES.map((stage) => (
              <div key={stage.name} className="flex items-center justify-between p-2.5 bg-white/5 rounded-xl border border-white/10 group hover:bg-white/10 transition-all">
                <div className="flex items-center gap-3">
                  <stage.icon size={14} className={stage.color} />
                  <span className="text-[11px] font-bold text-slate-300">{stage.name}</span>
                </div>
                <Badge variant="outline" className="border-white/20 text-white font-black text-[8px] uppercase tracking-widest">
                  {stage.duration}m
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Management */}
      {appointment.is_paid && (
        <Card className="border-none shadow-lg rounded-[2.5rem] bg-white border-2 border-emerald-100 overflow-hidden animate-in fade-in slide-in-from-right-2 duration-500">
          <CardHeader className="p-6 pb-2 bg-emerald-50/50 border-b border-emerald-100">
            <CardTitle className="text-sm font-black uppercase tracking-[0.3em] text-emerald-600 flex items-center gap-2">
              <Wallet size={16} /> Clinical Billing
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {!appointment.payment_received ? (
              <div className="space-y-3">
                <Button 
                  onClick={handleGeneratePaymentLink}
                  disabled={generatingLink}
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100"
                >
                  {generatingLink ? <Loader2 className="animate-spin mr-2" /> : <QrCode size={16} className="mr-2" />}
                  Generate Payment Link
                </Button>
                <p className="text-[9px] text-center text-slate-400 font-bold uppercase">Or log manual payment below</p>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-center gap-3 text-emerald-700">
                <CheckCircle2 size={20} />
                <span className="font-black text-xs uppercase tracking-widest">Payment Received</span>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manual Override</p>
              <ToggleGroup 
                type="single" 
                value={appointment.payment_method || ""} 
                onValueChange={(v) => onSaveField('payment_method', v || null)}
                className="flex flex-wrap justify-start gap-2"
              >
                <ToggleGroupItem value="Stripe App" className="rounded-xl px-3 h-9 text-[10px] font-black uppercase border-slate-200 data-[state=on]:bg-indigo-600 data-[state=on]:text-white">
                  <Smartphone size={12} className="mr-1.5" /> Stripe App
                </ToggleGroupItem>
                <ToggleGroupItem value="PayID" className="rounded-xl px-3 h-9 text-[10px] font-black uppercase border-slate-200 data-[state=on]:bg-emerald-600 data-[state=on]:text-white">PayID</ToggleGroupItem>
                <ToggleGroupItem value="Cash" className="rounded-xl px-3 h-9 text-[10px] font-black uppercase border-slate-200 data-[state=on]:bg-emerald-600 data-[state=on]:text-white">Cash</ToggleGroupItem>
              </ToggleGroup>
            </div>

            {!appointment.payment_received && (
              <Button 
                onClick={() => onSaveField('payment_received', true)}
                variant="outline"
                className="w-full h-10 rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-50 font-bold text-[10px] uppercase tracking-widest"
              >
                Mark as Paid ($50)
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Practitioner Quick Reference */}
      <Card className="border-none shadow-lg rounded-[2.5rem] bg-indigo-50 border-2 border-indigo-100 overflow-hidden">
        <CardHeader className="p-6 pb-2">
          <CardTitle className="text-sm font-black uppercase tracking-[0.3em] text-indigo-600 flex items-center gap-2">
            <Sparkles size={16} /> Quick Reference
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-4">
          <div className="space-y-3">
            <div className="p-3 bg-white rounded-2xl border border-indigo-200 shadow-sm">
              <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Instant Cramp Hack</p>
              <p className="text-[10px] font-bold text-slate-700 leading-relaxed">
                Chop muscle spindles <span className="text-indigo-600">Inwards</span>, then <span className="text-indigo-600">Outwards</span> (x2).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {currentPeakMeridian && (
        <Card className={cn(
          "border-none shadow-xl rounded-[2.5rem] text-white overflow-hidden relative group",
          currentPeakMeridian.color.split(' ')[0]
        )}>
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <Zap size={120} />
          </div>
          <CardContent className="p-8 space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Current Peak Meridian</p>
              <Badge className="bg-white/20 text-white border-none font-black text-[9px] uppercase tracking-widest">TCM Clock</Badge>
            </div>
            <div>
              <h3 className="text-3xl font-black tracking-tight">{currentPeakMeridian.name}</h3>
              <p className="text-xs font-bold opacity-90 mt-1">{currentPeakMeridian.peakTime}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-none shadow-lg rounded-[2.5rem] bg-slate-900 text-white overflow-hidden">
        <CardContent className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Session Context</p>
            <ExternalLink size={16} className="text-slate-700" />
          </div>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-2">
                <CreditCard size={14} className="text-emerald-400" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Payment Link</span>
              </div>
              <EditableField 
                key={`payment-link-${appointment.id}`} 
                field="payment_link" 
                label="Stripe / Cal.com Link" 
                value={appointment.payment_link} 
                placeholder="Paste payment URL here..." 
                onSave={onSaveField as any} 
                className="bg-white/5 border-white/10 p-4 rounded-2xl"
              />
            </div>

            <div className="space-y-4">
              <EditableField 
                key={`acupoints-${appointment.id}`} 
                field="acupoints" 
                label="Acupoints" 
                value={appointment.acupoints} 
                placeholder="Points used..." 
                onSave={onSaveField as any} 
                className="bg-white/5 border-white/10 p-4 rounded-2xl"
              />
              <QuickAcupointSelector 
                currentValue={appointment.acupoints} 
                onSelect={(val) => onSaveField('acupoints', val)} 
              />
            </div>

            <div className="space-y-4">
              <EditableField 
                key={`journal-${appointment.id}`} 
                field="journal" 
                label="Practitioner Reflection" 
                value={appointment.journal} 
                multiline 
                className="bg-amber-500/10 border-amber-500/20 p-4 rounded-2xl" 
                placeholder="Personal insights..." 
                onSave={onSaveField as any} 
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentContextCards;