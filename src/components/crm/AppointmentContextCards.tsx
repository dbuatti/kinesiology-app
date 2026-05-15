"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Zap, ExternalLink, Clock, Target, ShieldAlert, Activity, Home, CreditCard, CheckCircle2, Loader2, QrCode, ChevronDown, DollarSign,
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
import { Link } from "react-router-dom";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface AppointmentContextCardsProps {
  appointment: AppointmentWithClient;
  currentPeakMeridian: any;
  onSaveField: (field: string, value: any) => Promise<void>;
}

const SESSION_STAGES = [
  { id: 'goal', name: "Goal Setting", duration: 15, icon: Target },
  { id: 'activation', name: "Activation", duration: 15, icon: Zap },
  { id: 'correction', name: "Correction", duration: 20, icon: Activity },
  { id: 'challenge', name: "Challenge", duration: 5, icon: ShieldAlert },
  { id: 'home', name: "Home Reinforcement", duration: 5, icon: Home },
];

const AppointmentContextCards = ({ appointment, currentPeakMeridian, onSaveField }: AppointmentContextCardsProps) => {
  const [generatingLink, setGeneratingLink] = useState(false);
  const [billingOpen, setBillingOpen] = useState(true);
  const [contextOpen, setContextOpen] = useState(false);
  
  // Strategy State
  const [activeStageId, setActiveStageId] = useState<string | null>(null);
  const [completedStages, setCompletedStages] = useState<string[]>([]);
  const [stageTimers, setStageTimers] = useState<Record<string, number>>({});

  useEffect(() => {
    let interval: any = null;
    if (activeStageId) {
      interval = setInterval(() => {
        setStageTimers(prev => ({
          ...prev,
          [activeStageId]: (prev[activeStageId] || 0) + 1
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeStageId]);

  const handleStageClick = (id: string) => {
    if (completedStages.includes(id)) {
      setCompletedStages(prev => prev.filter(s => s !== id));
      return;
    }
    
    if (activeStageId === id) {
      setCompletedStages(prev => [...prev, id]);
      setActiveStageId(null);
    } else {
      setActiveStageId(id);
    }
  };

  const formatStageTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins}M`;
  };

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

  const billingDefault = (appointment.clients as any).billing_default || 'Paid';

  return (
    <div className="space-y-8">
      {/* Session Strategy Card */}
      <div className="border border-border bg-background">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3 text-primary">
            <Clock size={18} />
            <h3 className="text-sm font-bold uppercase tracking-widest">Session Strategy (60M)</h3>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {completedStages.length}/{SESSION_STAGES.length} DONE
          </span>
        </div>
        <div className="p-0">
          {SESSION_STAGES.map((stage) => {
            const isActive = activeStageId === stage.id;
            const isDone = completedStages.includes(stage.id);
            const elapsed = stageTimers[stage.id] || 0;

            return (
              <button 
                key={stage.id} 
                onClick={() => handleStageClick(stage.id)}
                className={cn(
                  "w-full flex items-center justify-between p-6 border-b border-border last:border-b-0 transition-colors text-left",
                  isActive ? "bg-primary text-primary-foreground" : 
                  isDone ? "bg-success/10" :
                  "hover:bg-muted"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-8 h-8 border border-border flex items-center justify-center",
                    isActive ? "border-primary-foreground" : isDone ? "bg-success text-success-foreground border-success" : "text-primary"
                  )}>
                    {isDone ? <Check size={16} /> : <stage.icon size={16} />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase tracking-tight">{stage.name}</span>
                    {isActive && (
                      <span className="text-[8px] font-bold uppercase tracking-widest opacity-80">
                        LIVE: {formatStageTime(elapsed)}
                      </span>
                    )}
                  </div>
                </div>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-widest",
                  isActive ? "opacity-80" : "text-muted-foreground"
                )}>
                  {stage.duration}M
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Peak Meridian */}
      {currentPeakMeridian && (
        <div className="border border-border bg-destructive text-destructive-foreground p-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity size={18} />
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Peak Meridian</p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest border border-destructive-foreground/20 px-2 py-1">TCM</span>
          </div>
          <div>
            <h3 className="text-3xl font-medium uppercase tracking-tight">{currentPeakMeridian.name}</h3>
            <p className="text-sm font-bold uppercase tracking-widest opacity-80 mt-1">{currentPeakMeridian.peakTime}</p>
          </div>
        </div>
      )}

      {/* Payment Management */}
      <div className="border border-border bg-background">
        <Collapsible open={billingOpen} onOpenChange={setBillingOpen}>
          <CollapsibleTrigger asChild>
            <div className="p-6 border-b border-border flex items-center justify-between cursor-pointer hover:bg-muted transition-colors">
              <div className="flex items-center gap-3 text-primary">
                <CreditCard size={18} />
                <h3 className="text-sm font-bold uppercase tracking-widest">Clinical Billing</h3>
              </div>
              <ChevronDown className={cn("h-5 w-5 transition-transform", billingOpen && "rotate-180")} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-8 space-y-8">
              <div className="flex items-center justify-between p-6 border border-border">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <Label htmlFor="is-paid-toggle" className="text-sm font-bold uppercase tracking-widest">Paid Session</Label>
                    <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
                      Default: {billingDefault}
                    </span>
                  </div>
                  <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Enable billing for this session</p>
                </div>
                <Switch 
                  id="is-paid-toggle"
                  checked={appointment.is_paid || false}
                  onCheckedChange={(checked) => onSaveField('is_paid', checked)}
                  className="data-[state=checked]:bg-success"
                />
              </div>

              {appointment.is_paid && (
                <div className="space-y-8">
                  {!appointment.payment_received ? (
                    <div className="space-y-4">
                      <div className="p-8 border border-destructive bg-destructive/5 text-center relative overflow-hidden">
                        <p className="text-[10px] font-bold text-destructive uppercase tracking-widest mb-2">Amount Due</p>
                        <p className="text-4xl font-bold text-destructive tracking-tight">${appointment.price_amount || 50}</p>
                      </div>
                      <Button 
                        onClick={handleGeneratePaymentLink}
                        disabled={generatingLink}
                        className="w-full h-14 bg-primary text-primary-foreground font-bold text-[10px] uppercase tracking-widest"
                      >
                        {generatingLink ? <Loader2 className="animate-spin mr-3" /> : <QrCode size={18} className="mr-3" />}
                        Generate Stripe Link
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => onSaveField('payment_received', true)}
                        className="w-full h-14 border-border font-bold text-[10px] uppercase tracking-widest hover:bg-muted"
                      >
                        <CheckCircle2 size={18} className="mr-3" /> Mark as Paid Manually
                      </Button>
                    </div>
                  ) : (
                    <div className="p-8 border border-success bg-success/5 flex flex-col items-center justify-center gap-4 text-success">
                      <div className="w-12 h-12 border border-success flex items-center justify-center">
                        <CheckCircle2 size={24} />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-sm uppercase tracking-widest">Payment Received</p>
                        <p className="text-[10px] font-bold opacity-60 mt-1 uppercase tracking-widest">Method: {appointment.payment_method || 'Not specified'}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onSaveField('payment_received', false)}
                        className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-destructive mt-2"
                      >
                        Undo Payment
                      </Button>
                    </div>
                  )}

                  <div className="space-y-4">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Payment Method</p>
                    <div className="grid grid-cols-2 gap-0 border border-border">
                      {['Stripe', 'PayID', 'Cash', 'Transfer'].map(method => (
                        <button 
                          key={method}
                          onClick={() => onSaveField('payment_method', method)}
                          className={cn(
                            "h-12 text-[10px] font-bold uppercase tracking-widest border-r border-b border-border last:border-r-0 transition-colors",
                            appointment.payment_method === method ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                          )}
                        >
                          {method}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Session Context */}
      <div className="border border-border bg-background">
        <Collapsible open={contextOpen} onOpenChange={setContextOpen}>
          <CollapsibleTrigger asChild>
            <div className="p-6 border-b border-border flex items-center justify-between cursor-pointer hover:bg-muted transition-colors">
              <div className="flex items-center gap-3 text-primary">
                <Layers size={18} />
                <h3 className="text-sm font-bold uppercase tracking-widest">Session Context</h3>
              </div>
              <ChevronDown className={cn("h-5 w-5 transition-transform", contextOpen && "rotate-180")} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-8 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CreditCard size={16} className="text-primary" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Payment Link</span>
                </div>
                <EditableField 
                  key={`payment-link-${appointment.id}`} 
                  field="payment_link" 
                  label="Stripe / Cal.com Link" 
                  value={appointment.payment_link} 
                  placeholder="Paste URL..." 
                  onSave={onSaveField as any} 
                  className="border border-border p-6 text-sm"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Target size={16} className="text-primary" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Acupoints</span>
                </div>
                <EditableField 
                  key={`acupoints-${appointment.id}`} 
                  field="acupoints" 
                  label="Acupoints" 
                  value={appointment.acupoints} 
                  placeholder="Points used..." 
                  onSave={onSaveField as any} 
                  className="border border-border p-6 text-sm"
                />
                <QuickAcupointSelector 
                  currentValue={appointment.acupoints} 
                  onSelect={(val) => onSaveField('acupoints', val)} 
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare size={16} className="text-primary" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Practitioner Reflection</span>
                  </div>
                  <Link to="/practice/journal" state={{ appointmentId: appointment.id }} className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">
                    Open Journal
                  </Link>
                </div>
                <EditableField 
                  key={`journal-${appointment.id}`} 
                  field="journal" 
                  label="" 
                  value={appointment.journal} 
                  multiline 
                  className="border border-border p-6 text-sm italic text-muted-foreground" 
                  placeholder="Personal insights..." 
                  onSave={onSaveField as any} 
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Quick Reference */}
      <div className="border border-border bg-primary/5 p-8 space-y-4">
        <div className="flex items-center gap-3 text-primary">
          <Lightbulb size={18} />
          <h3 className="text-sm font-bold uppercase tracking-widest">Quick Reference</h3>
        </div>
        <div className="p-6 border border-primary/20 bg-background">
          <p className="text-[8px] font-bold text-primary uppercase tracking-widest mb-2">Instant Cramp Hack</p>
          <p className="text-xs font-bold uppercase tracking-tight leading-relaxed">
            Chop spindles <span className="text-primary">INWARDS</span>, then <span className="text-primary">OUTWARDS</span> (X2).
          </p>
        </div>
      </div>
    </div>
  );
};

export default AppointmentContextCards;