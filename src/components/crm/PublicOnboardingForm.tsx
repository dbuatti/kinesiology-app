"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Loader2, CheckCircle2, Sparkles, Heart, ShieldAlert, Activity, Zap, User, Mail } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { Client } from "@/types/crm";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address").or(z.string().length(0)),
  phone: z.string().optional(),
  pronouns: z.string().optional(),
  born: z.string().optional(),
  suburbs: z.string().optional(),
  occupation: z.string().optional(),
  marital_status: z.string().optional(),
  children: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  medications_supplements: z.string().optional(),
  current_stress_level: z.number().min(1).max(10).default(5),
  sleep_quality: z.string().optional(),
  digestive_health: z.string().optional(),
  medical_history: z.string().optional(),
  referral_source: z.string().optional(),
});

interface PublicOnboardingFormProps {
  clientId: string;
  appointmentId?: string | null;
  initialData: Partial<Client>;
  onSuccess: () => void;
}

const PublicOnboardingForm = ({ clientId, appointmentId, initialData, onSuccess }: PublicOnboardingFormProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'stripe' | 'done'>('idle');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      pronouns: initialData?.pronouns || "",
      born: initialData?.born ? new Date(initialData.born).toISOString().split('T')[0] : "",
      suburbs: initialData?.suburbs?.join(", ") || "",
      occupation: initialData?.occupation || "",
      marital_status: initialData?.marital_status || "",
      children: initialData?.children || "",
      emergency_contact_name: initialData?.emergency_contact_name || "",
      emergency_contact_phone: initialData?.emergency_contact_phone || "",
      medications_supplements: initialData?.medications_supplements || "",
      current_stress_level: initialData?.current_stress_level || 5,
      sleep_quality: initialData?.sleep_quality || "",
      digestive_health: initialData?.digestive_health || "",
      medical_history: initialData?.medical_history || "",
      referral_source: initialData?.referral_source || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setSubmitting(true);

    try {
      const suburbsArray = values.suburbs 
        ? values.suburbs.split(",").map(s => s.trim()).filter(s => s.length > 0) 
        : [];

      // 1. Static Client Data
      const clientPayload = {
        name: values.name,
        email: values.email || null,
        phone: values.phone || null,
        pronouns: values.pronouns || null,
        born: values.born ? new Date(values.born).toISOString() : null,
        suburbs: suburbsArray,
        occupation: values.occupation || null,
        marital_status: values.marital_status || null,
        children: values.children || null,
        emergency_contact_name: values.emergency_contact_name || null,
        emergency_contact_phone: values.emergency_contact_phone || null,
        medical_history: values.medical_history || null,
        referral_source: values.referral_source || null,
        // Also update baseline on client for reference
        medications_supplements: values.medications_supplements || null,
        current_stress_level: values.current_stress_level,
        sleep_quality: values.sleep_quality || null,
        digestive_health: values.digestive_health || null,
      };

      // 2. Dynamic Appointment Data
      const appointmentPayload = {
        medications_supplements: values.medications_supplements || null,
        current_stress_level: values.current_stress_level,
        sleep_quality: values.sleep_quality || null,
        digestive_health: values.digestive_health || null,
      };

      // Update Client
      const { error: clientError } = await supabase
        .from("clients")
        .update(clientPayload)
        .eq('id', clientId);

      if (clientError) throw clientError;

      // Update Appointment if ID provided
      if (appointmentId) {
        const { error: appError } = await supabase
          .from("appointments")
          .update(appointmentPayload)
          .eq('id', appointmentId);
        
        if (appError) console.error("Failed to update specific appointment:", appError);
      }

      // 3. Trigger Kit Sync
      setSyncStatus('syncing');
      try {
        await supabase.functions.invoke('sync-to-kit', {
          body: { record: { ...clientPayload, id: clientId } }
        });
      } catch (syncErr) {
        console.error("Kit sync failed, but continuing...");
      }

      // 4. Trigger Stripe Sync
      setSyncStatus('stripe');
      try {
        await supabase.functions.invoke('stripe-manager', {
          body: { 
            action: 'sync-customer', 
            clientId: clientId,
            clientData: { 
              ...clientPayload, 
              stripe_customer_id: (initialData as any).stripe_customer_id 
            }
          }
        });
      } catch (stripeErr) {
        console.error("Stripe sync failed, but continuing...");
      }

      setSyncStatus('done');
      showSuccess("Thank you! Your details have been updated.");
      onSuccess();
    } catch (error: any) {
      showError("Something went wrong. Please try again or contact your practitioner.");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const SectionHeader = ({ icon: Icon, title, color }: { icon: any, title: string, color: string }) => (
    <div className="flex items-center gap-3 mb-6 pt-4 border-t border-slate-100 first:border-t-0 first:pt-0">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", color)}>
        <Icon size={20} className="text-white" />
      </div>
      <h3 className="text-lg font-black text-slate-900">{title}</h3>
    </div>
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
        {/* Personal Section */}
        <div className="space-y-6">
          <SectionHeader icon={User} title="Personal Information" color="bg-indigo-600" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-widest text-slate-500">Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Name" {...field} className="h-12 rounded-xl border-slate-200 text-base" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pronouns"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-widest text-slate-500">Pronouns</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. They/Them, She/Her" {...field} className="h-12 rounded-xl border-slate-200 text-base" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-widest text-slate-500">Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@example.com" {...field} className="h-12 rounded-xl border-slate-200 text-base" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-widest text-slate-500">Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="0400 000 000" {...field} className="h-12 rounded-xl border-slate-200 text-base" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="born"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-widest text-slate-500">Date of Birth</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} className="h-12 rounded-xl border-slate-200 text-base" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="suburbs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-widest text-slate-500">Suburb(s)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Brunswick, Fitzroy" {...field} className="h-12 rounded-xl border-slate-200 text-base" />
                  </FormControl>
                  <FormDescription className="text-[10px]">Comma separated if multiple</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Clinical Section */}
        <div className="space-y-6">
          <SectionHeader icon={Activity} title="Clinical Context" color="bg-rose-600" />
          <div className="space-y-8">
            <FormField
              control={form.control}
              name="medical_history"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-widest text-slate-500">Medical History & Past Injuries</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Please list any significant past injuries, surgeries, or chronic conditions..." 
                      className="min-h-[100px] rounded-xl border-slate-200 text-base resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="medications_supplements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-widest text-slate-500">Current Medications & Supplements</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="What are you currently taking?" 
                      className="min-h-[80px] rounded-xl border-slate-200 text-base resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="sleep_quality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-slate-500">Sleep Quality</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Poor, wake up often, 6 hours avg" {...field} className="h-12 rounded-xl border-slate-200 text-base" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="digestive_health"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-slate-500">Digestive Health</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Regular, bloating, IBS" {...field} className="h-12 rounded-xl border-slate-200 text-base" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="current_stress_level"
              render={({ field }) => (
                <FormItem className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-slate-500">Current Stress Level (1-10)</FormLabel>
                    <span className="text-2xl font-black text-indigo-600">{field.value}</span>
                  </div>
                  <FormControl>
                    <Slider
                      min={1}
                      max={10}
                      step={1}
                      value={[field.value]}
                      onValueChange={(vals) => field.onChange(vals[0])}
                      className="[&_[role=slider]]:h-6 [&_[role=slider]]:w-6"
                    />
                  </FormControl>
                  <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Very Low</span>
                    <span>Extreme</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Safety & Admin Section */}
        <div className="space-y-6">
          <SectionHeader icon={ShieldAlert} title="Safety & Referral" color="bg-amber-500" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="emergency_contact_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-widest text-slate-500">Emergency Contact Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Name" {...field} className="h-12 rounded-xl border-slate-200 text-base" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emergency_contact_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-widest text-slate-500">Emergency Contact Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Phone" {...field} className="h-12 rounded-xl border-slate-200 text-base" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="referral_source"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="text-xs font-bold uppercase tracking-widest text-slate-500">How did you hear about us?</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Google, Instagram, Friend (Name)" {...field} className="h-12 rounded-xl border-slate-200 text-base" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="pt-8">
          <Button 
            type="submit" 
            className="w-full bg-indigo-600 hover:bg-indigo-700 h-16 rounded-2xl font-black text-base uppercase tracking-widest shadow-xl shadow-indigo-100" 
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                {syncStatus === 'syncing' ? 'Syncing to Marketing...' : 
                 syncStatus === 'stripe' ? 'Syncing to Billing...' : 
                 'Saving Your Profile...'}
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-6 w-6" />
                Complete Onboarding
              </>
            )}
          </Button>
          <p className="text-center text-[10px] text-slate-400 mt-4 font-medium uppercase tracking-widest">
            Your data is stored securely and only visible to your practitioner.
          </p>
        </div>
      </form>
    </Form>
  );
};

export default PublicOnboardingForm;