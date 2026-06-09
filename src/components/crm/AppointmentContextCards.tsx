
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Zap, ExternalLink, Clock, Target, ShieldAlert, Activity, Brain, Heart, Home, Sparkles, CreditCard, CheckCircle2, Wallet, Smartphone, Loader2, QrCode, ChevronDown, DollarSign,
  MessageSquare, Info, AlertCircle, Lightbulb, Layers, Play, Check
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AppointmentContextCardsProps {
  appointment: AppointmentWithClient;
  currentPeakMeridian: any;
  onSaveField: (field: string, value: any) => Promise<void>;
}

const SESSION_STAGES = [
  { id: 'goal', name: "Goal Setting", duration: 15, icon: Target, color: "text-indigo-400", activeColor: "bg-primary" },
  { id: 'activation', name: "Activation", duration: 15, icon: Zap, color: "text-blue-400", activeColor: "bg-blue-600" },
  { id: 'correction', name: "Correction", duration: 20, icon: Activity, color: "text-emerald-400", activeColor: "bg-emerald-600" },
  { id: 'challenge', name: "Challenge", duration: 5, icon: ShieldAlert, color: "text-amber-400", activeColor: "bg-amber-600" },
  { id: 'home', name: "Home Reinforcement", duration: 5, icon: Home, color: "text-rose-400", activeColor: "bg-rose-600" },
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
    return `${mins}m`;
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
      <Card className="border-none shadow-sm shadow-slate-900/5 rounded-xl bg-slate-900 text-white overflow-hidden">
        <CardHeader className="p-8 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-3">
              <Clock size={16} /> Session Strategy (60m)
            </CardTitle>
            <Badge variant="outline" className="border-white/10 text-muted-foreground font-medium text-[10px] uppercase tracking-wider">
              {completedStages.length}/{SESSION_STAGES.length} Done
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-8 pt-0 space-y-4">
          <div className="grid grid-cols-1 gap-2">
            {SESSION_STAGES.map((stage) => {
              const isActive = activeStageId === stage.id;
              const isDone = completedStages.includes(stage.id);
              const elapsed = stageTimers[stage.id] || 0;

              return (
                <button 
                  key={stage.id} 
                  onClick={() => handleStageClick(stage.id)}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border transition-all duration-500 group text-left",
                    isActive ? cn("border-transparent shadow-lg scale-[1.02]", stage.activeColor) : 
                    isDone ? "bg-emerald-500/10 border-emerald-500/20" :
                    "bg-white/5 border-white/10 hover:bg-white/10"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500",
                      isActive ? "bg-white/20" : isDone ? "bg-emerald-500 text-white" : "bg-white/5",
                      !isActive && !isDone && stage.color
                    )}>
                      {isDone ? <Check size={16} /> : <stage.icon size={16} />}
                    </div>
                    <div className="flex flex-col">
                      <span className={cn(
                        "text-xs font-medium",
                        isActive ? "text-white" : isDone ? "text-emerald-400" : "text-slate-300"
                      )}>{stage.name}</span>
                      {isActive && (
                        <span className="text-[10px] font-medium uppercase tracking-wider text-white/60 animate-pulse">
                          Live: {formatStageTime(elapsed)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className={cn(
                    "font-medium text-[10px] uppercase tracking-wider px-3 py-1",
                    isActive ? "border-white/40 text-white" : "border-white/10 text-muted-foreground"
                  )}>
                    {stage.duration}M
                  </Badge>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Peak Meridian */}
      {currentPeakMeridian && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className={cn(
                "border-none shadow-sm shadow-indigo-500/10 rounded-xl text-white overflow-hidden relative group cursor-help",
                "bg-gradient-to-br from-rose-600 to-rose-800"
              )}>
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 group-hover:rotate-12 transition-all duration-1000">
                  <Zap size={120} />
                </div>
                <CardContent className="p-8 space-y-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <Activity size={20} />
                      </div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] opacity-80">Peak Meridian</p>
                    </div>
                    <Badge className="bg-white/20 text-white border-none font-medium text-[10px] uppercase tracking-wider px-3 py-1">TCM</Badge>
                  </div>
                  <div>
                    <h3 className="text-3xl font-semibold tracking-tight">{currentPeakMeridian.name}</h3>
                    <p className="text-sm font-medium opacity-90 mt-1">{currentPeakMeridian.peakTime}</p>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="top" className="rounded-xl p-3 bg-slate-900 text-white border-none shadow-sm max-w-[200px]">
              <p className="text-[10px] font-medium leading-relaxed">
                The active meridian influences session prioritisation. Organs are most accessible during their peak time.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Payment Management */}
      <Collapsible open={billingOpen} onOpenChange={setBillingOpen}>
        <Card className={cn(
          "border-none shadow-sm shadow-slate-200/50 dark:shadow-none rounded-xl overflow-hidden transition-all duration-500",
          appointment.is_paid ? "bg-white border-2 border-emerald-100" : "bg-muted border border-slate-200"
        )}>
          <CollapsibleTrigger asChild>
            <CardHeader className="p-8 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    appointment.is_paid ? "bg-muted text-muted-foreground" : "bg-muted text-muted-foreground/70"
                  )}>
                    <Wallet size={20} />
                  </div>
                  <CardTitle className={cn(
                    "text-[10px] font-semibold uppercase tracking-[0.3em]",
                    appointment.is_paid ? "text-chart-emerald" : "text-muted-foreground"
                  )}>
                    Clinical Billing
                  </CardTitle>
                </div>
                <ChevronDown className={cn("h-5 w-5 transition-transform duration-500", billingOpen && "rotate-180", appointment.is_paid ? "text-emerald-400" : "text-muted-foreground/70")} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="p-8 pt-0 space-y-8 animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 rounded-xl border border-border dark:border-slate-800 shadow-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="is-paid-toggle" className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Paid Session</Label>
                    <Badge variant="outline" className="h-4 px-1.5 text-[6px] font-medium uppercase border-slate-200 text-muted-foreground/70">
                      Default: {billingDefault}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground/70 font-medium uppercase tracking-wider">Enable billing for this session</p>
                </div>
                <Switch 
                  id="is-paid-toggle"
                  checked={appointment.is_paid || false}
                  onCheckedChange={(checked) => onSaveField('is_paid', checked)}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>

              {appointment.is_paid && (
                <div className="space-y-6 animate-in zoom-in-95 duration-500">
                  {!appointment.payment_received ? (
                    <div className="space-y-4">
                      <div className="p-6 bg-muted dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800 text-center relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 opacity-10">
                          <DollarSign size={80} className="text-muted-foreground" />
                        </div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.3em] mb-2 relative z-10">Amount Due</p>
                        <p className="text-4xl font-semibold text-amber-900 dark:text-amber-400 relative z-10">${appointment.price_amount || 50}</p>
                      </div>
                      <Button 
                        onClick={handleGeneratePaymentLink}
                        disabled={generatingLink}
                        className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold text-xs uppercase tracking-wider shadow-sm shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
                      >
                        {generatingLink ? <Loader2 className="animate-spin mr-3" /> : <QrCode size={18} className="mr-3" />}
                        Generate Stripe Link
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => onSaveField('payment_received', true)}
                        className="w-full h-14 border-emerald-200 text-chart-emerald hover:bg-emerald-50 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all"
                      >
                        <CheckCircle2 size={18} className="mr-3" /> Mark as Paid Manually
                      </Button>
                    </div>
                  ) : (
                    <div className="p-8 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800 flex flex-col items-center justify-center gap-4 text-emerald-700">
                      <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm shadow-emerald-500/30">
                        <CheckCircle2 size={32} />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-sm uppercase tracking-wider">Payment Received</p>
                        <p className="text-[10px] font-medium opacity-60 mt-1 uppercase tracking-wider">Method: {appointment.payment_method || 'Not specified'}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onSaveField('payment_received', false)}
                        className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 hover:text-chart-destructive mt-2"
                      >
                        Undo Payment
                      </Button>
                    </div>
                  )}

                  <div className="space-y-3">
                    <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider ml-2">Payment Method</p>
                    <ToggleGroup 
                      type="single" 
                      value={appointment.payment_method || ""} 
                      onValueChange={(v) => onSaveField('payment_method', v || null)}
                      className="flex flex-wrap justify-start gap-2"
                    >
                      {['Stripe', 'PayID', 'Cash', 'Transfer'].map(method => (
                        <ToggleGroupItem 
                          key={method}
                          value={method} 
                          className="rounded-xl px-4 h-10 text-[10px] font-semibold uppercase tracking-wider border-slate-200 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary transition-all"
                        >
                          {method}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Session Context */}
      <Collapsible open={contextOpen} onOpenChange={setContextOpen}>
        <Card className="border-none shadow-sm shadow-slate-900/5 rounded-xl bg-slate-900 text-white overflow-hidden">
          <CollapsibleTrigger asChild>
            <CardHeader className="p-8 cursor-pointer hover:bg-white/5 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Layers size={20} />
                  </div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.3em]">Session Context</p>
                </div>
                <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-500", contextOpen && "rotate-180")} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="p-8 pt-0 space-y-8 animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 px-2">
                    <CreditCard size={16} className="text-emerald-400" />
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Payment Link</span>
                  </div>
                  <EditableField 
                    key={`payment-link-${appointment.id}`} 
                    field="payment_link" 
                    label="Stripe / Cal.com Link" 
                    value={appointment.payment_link} 
                    placeholder="Paste URL..." 
                    onSave={onSaveField as any} 
                    className="bg-white/5 border-white/10 p-5 rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 px-2">
                    <Target size={16} className="text-indigo-400" />
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Acupoints</span>
                  </div>
                  <EditableField 
                    key={`acupoints-${appointment.id}`} 
                    field="acupoints" 
                    label="Acupoints" 
                    value={appointment.acupoints} 
                    placeholder="Points used..." 
                    onSave={onSaveField as any} 
                    className="bg-white/5 border-white/10 p-5 rounded-xl text-sm"
                  />
                  <QuickAcupointSelector 
                    currentValue={appointment.acupoints} 
                    onSelect={(val) => onSaveField('acupoints', val)} 
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                      <MessageSquare size={16} className="text-amber-400" />
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Practitioner Reflection</span>
                    </div>
                    <Button variant="ghost" size="sm" asChild className="h-8 px-3 text-[10px] font-semibold uppercase tracking-wider text-indigo-400 hover:text-white hover:bg-white/10 rounded-lg">
                      <Link to="/practice/journal" state={{ appointmentId: appointment.id }}>
                        Open Journal <ExternalLink size={10} className="ml-2" />
                      </Link>
                    </Button>
                  </div>
                  <EditableField 
                    key={`journal-${appointment.id}`} 
                    field="journal" 
                    label="" 
                    value={appointment.journal} 
                    multiline 
                    className="bg-amber-500/10 border-amber-500/20 p-5 rounded-xl text-sm italic text-slate-300" 
                    placeholder="Personal insights..." 
                    onSave={onSaveField as any} 
                  />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Quick Reference */}
      <Card className="border-none shadow-sm shadow-indigo-500/5 rounded-xl bg-muted dark:bg-indigo-900/20 border-2 border-indigo-100 dark:border-indigo-800 overflow-hidden group">
        <CardHeader className="p-8 pb-4">
          <CardTitle className="text-[10px] font-semibold uppercase tracking-[0.3em] text-chart-primary flex items-center gap-3">
            <Lightbulb size={16} className="group-hover:scale-110 transition-transform" /> Quick Reference
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-indigo-200 dark:border-indigo-800 shadow-sm">
            <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider mb-2">Instant Cramp Hack</p>
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
              Chop spindles <span className="text-chart-primary font-semibold">INWARDS</span>, then <span className="text-chart-primary font-semibold">OUTWARDS</span> (x2).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentContextCards;