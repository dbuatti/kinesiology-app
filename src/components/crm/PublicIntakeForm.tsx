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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle2, Heart, ShieldAlert, Activity, Zap, User, Brain, Bed, AlertTriangle } from "lucide-react";
import { Client } from "@/types/crm";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  second_name: z.string().min(1, "Second name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  born: z.string().min(1, "Date of birth is required"),
  home_address: z.string().optional(),
  referral_source: z.string().min(1, "This field is required"),
  emergency_contact_name: z.string().min(1, "Emergency contact is required"),
  emergency_contact_phone: z.string().min(1, "Emergency contact phone is required"),
  emergency_contact_relationship: z.string().min(1, "Relationship is required"),
  occupation: z.string().optional(),
  children: z.string().optional(),
  change_one_thing: z.string().min(1, "This field is required"),
  never_been_same_since: z.string().min(1, "This field is required"),
  chief_complaint: z.string().min(1, "This field is required"),
  health_problem_severity: z.string().optional(),
  seen_medical_doctor: z.string().min(1, "This field is required"),
  symptoms_worse_stress: z.string().min(1, "This field is required"),
  symptoms_worse_fatigue: z.string().min(1, "This field is required"),
  pain_movement: z.string().optional(),
  current_stress_level: z.number().min(1).max(10).default(5),
  therapies_used: z.array(z.string()).optional(),
  therapies_other: z.string().optional(),
  therapies_success: z.string().optional(),
  specific_illnesses: z.string().optional(),
  covid_vaccinated: z.string().optional(),
  covid_shots: z.string().optional(),
  allergies_asthma: z.string().optional(),
  energy_worse_time: z.string().optional(),
  family_medical_history: z.array(z.string()).optional(),
  alcohol_frequency: z.string().optional(),
  sleep_schedule: z.string().optional(),
  sleep_quality_details: z.array(z.string()).optional(),
  concussion_history: z.string().min(1, "This field is required"),
  concussion_details: z.string().optional(),
  birthing_experience: z.string().min(1, "This field is required"),
  avoided_emotion: z.string().min(1, "This field is required"),
  craved_emotion: z.string().min(1, "This field is required"),
  stress_response: z.string().min(1, "This field is required"),
  most_craved_human_need: z.string().min(1, "This field is required"),
  startled_by_loud_noises: z.string().min(1, "This field is required"),
  emotional_regulation_time: z.string().optional(),
  goal_working: z.string().optional(),
  goal_12_sessions: z.string().optional(),
  goal_safe_feeling: z.string().optional(),
  additional_notes: z.string().optional(),
});

interface PublicIntakeFormProps {
  clientId: string;
  appointmentId?: string | null;
  initialData: Partial<Client>;
  onSuccess: () => void;
}

const THERAPY_OPTIONS = [
  "Massage", "Chiropractic", "Osteopathy", "Physiotherapy", "Kinesiology",
  "Psychology", "Occupational Therapy", "Energy Therapies", "Personal Training",
  "Pilates", "Yoga", "Naturopath", "Nutritionist", "Exercise Physiology",
  "Functional Medicine", "Mindset Coaching", "Somatic Therapies",
];

const FAMILY_HISTORY_OPTIONS = [
  "Cancer", "Diabetes", "Hypertension", "Heart Disease", "Epilepsy",
  "Stroke", "Migraines", "Auto-immune Conditions", "Neurological Conditions",
];

const SLEEP_QUALITY_OPTIONS = [
  "I Fall asleep easily",
  "I Find it hard to fall asleep (overthinking)",
  "Wake up during the night more than once",
  "I wake up to urinate",
  "I Wake feeling rested",
  "I Wake up feeling sluggish but get better as the day goes along",
  "I always feel tired",
];

const PublicIntakeForm = ({ clientId, appointmentId, initialData, onSuccess }: PublicIntakeFormProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'stripe' | 'done'>('idle');

  const nameParts = (initialData?.name || "").split(" ");
  const firstName = nameParts[0] || "";
  const secondName = nameParts.slice(1).join(" ") || "";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: firstName,
      second_name: secondName,
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      born: initialData?.born ? new Date(initialData.born).toISOString().split('T')[0] : "",
      home_address: (initialData as any)?.home_address || "",
      referral_source: initialData?.referral_source || "",
      emergency_contact_name: initialData?.emergency_contact_name || "",
      emergency_contact_phone: initialData?.emergency_contact_phone || "",
      emergency_contact_relationship: (initialData as any)?.emergency_contact_relationship || "",
      occupation: initialData?.occupation || "",
      children: initialData?.children || "",
      change_one_thing: (initialData as any)?.change_one_thing || "",
      never_been_same_since: (initialData as any)?.never_been_same_since || "",
      chief_complaint: (initialData as any)?.chief_complaint || "",
      health_problem_severity: (initialData as any)?.health_problem_severity || "",
      seen_medical_doctor: (initialData as any)?.seen_medical_doctor?.toString() || "",
      symptoms_worse_stress: (initialData as any)?.symptoms_worse_stress?.toString() || "",
      symptoms_worse_fatigue: (initialData as any)?.symptoms_worse_fatigue?.toString() || "",
      pain_movement: (initialData as any)?.pain_movement || "",
      current_stress_level: initialData?.current_stress_level || 5,
      therapies_used: (initialData as any)?.therapies_used || [],
      therapies_other: (initialData as any)?.therapies_other || "",
      therapies_success: (initialData as any)?.therapies_success || "",
      specific_illnesses: (initialData as any)?.specific_illnesses || "",
      covid_vaccinated: (initialData as any)?.covid_vaccinated?.toString() || "",
      covid_shots: (initialData as any)?.covid_shots?.toString() || "",
      allergies_asthma: (initialData as any)?.allergies_asthma || "",
      energy_worse_time: (initialData as any)?.energy_worse_time || "",
      family_medical_history: (initialData as any)?.family_medical_history || [],
      alcohol_frequency: (initialData as any)?.alcohol_frequency || "",
      sleep_schedule: (initialData as any)?.sleep_schedule || "",
      sleep_quality_details: (initialData as any)?.sleep_quality_details || [],
      concussion_history: (initialData as any)?.concussion_history?.toString() || "",
      concussion_details: (initialData as any)?.concussion_details || "",
      birthing_experience: (initialData as any)?.birthing_experience || "",
      avoided_emotion: (initialData as any)?.avoided_emotion || "",
      craved_emotion: (initialData as any)?.craved_emotion || "",
      stress_response: (initialData as any)?.stress_response || "",
      most_craved_human_need: (initialData as any)?.most_craved_human_need || "",
      startled_by_loud_noises: (initialData as any)?.startled_by_loud_noises || "",
      emotional_regulation_time: (initialData as any)?.emotional_regulation_time || "",
      goal_working: (initialData as any)?.goal_working || "",
      goal_12_sessions: (initialData as any)?.goal_12_sessions || "",
      goal_safe_feeling: (initialData as any)?.goal_safe_feeling || "",
      additional_notes: (initialData as any)?.additional_notes || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setSubmitting(true);
    try {
      const fullName = `${values.first_name} ${values.second_name}`.trim();

      const clientPayload: Record<string, any> = {
        name: fullName,
        email: values.email,
        phone: values.phone || null,
        born: values.born ? new Date(values.born).toISOString() : null,
        home_address: values.home_address || null,
        referral_source: values.referral_source,
        emergency_contact_name: values.emergency_contact_name,
        emergency_contact_phone: values.emergency_contact_phone,
        emergency_contact_relationship: values.emergency_contact_relationship,
        occupation: values.occupation || null,
        children: values.children || null,
        change_one_thing: values.change_one_thing,
        never_been_same_since: values.never_been_same_since,
        chief_complaint: values.chief_complaint,
        health_problem_severity: values.health_problem_severity || null,
        seen_medical_doctor: values.seen_medical_doctor === "true",
        symptoms_worse_stress: values.symptoms_worse_stress === "true",
        symptoms_worse_fatigue: values.symptoms_worse_fatigue === "true",
        pain_movement: values.pain_movement || null,
        current_stress_level: values.current_stress_level,
        therapies_used: values.therapies_used || [],
        therapies_other: values.therapies_other || null,
        therapies_success: values.therapies_success || null,
        specific_illnesses: values.specific_illnesses || null,
        covid_vaccinated: values.covid_vaccinated === "true" ? true : values.covid_vaccinated === "false" ? false : null,
        covid_shots: values.covid_shots ? parseInt(values.covid_shots) : null,
        allergies_asthma: values.allergies_asthma || null,
        energy_worse_time: values.energy_worse_time || null,
        family_medical_history: values.family_medical_history || [],
        alcohol_frequency: values.alcohol_frequency || null,
        sleep_schedule: values.sleep_schedule || null,
        sleep_quality_details: values.sleep_quality_details || [],
        concussion_history: values.concussion_history === "true",
        concussion_details: values.concussion_details || null,
        birthing_experience: values.birthing_experience,
        avoided_emotion: values.avoided_emotion,
        craved_emotion: values.craved_emotion,
        stress_response: values.stress_response,
        most_craved_human_need: values.most_craved_human_need,
        startled_by_loud_noises: values.startled_by_loud_noises,
        emotional_regulation_time: values.emotional_regulation_time || null,
        goal_working: values.goal_working || null,
        goal_12_sessions: values.goal_12_sessions || null,
        goal_safe_feeling: values.goal_safe_feeling || null,
        additional_notes: values.additional_notes || null,
        intake_submitted_at: new Date().toISOString(),
        status: 'Active',
      };

      const { error: clientError } = await supabase
        .from("clients")
        .update(clientPayload)
        .eq('id', clientId);

      if (clientError) throw clientError;

      setSyncStatus('syncing');
      try {
        await supabase.functions.invoke('sync-to-kit', {
          body: { record: { ...clientPayload, id: clientId } }
        });
      } catch (_) {}

      setSyncStatus('stripe');
      try {
        await supabase.functions.invoke('stripe-manager', {
          body: {
            action: 'sync-customer',
            clientId,
            clientData: { ...clientPayload, stripe_customer_id: (initialData as any)?.stripe_customer_id }
          }
        });
      } catch (_) {}

      setSyncStatus('done');
      onSuccess();
    } catch (error: any) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const SectionHeader = ({ icon: Icon, title, color }: { icon: any; title: string; color: string }) => (
    <div className="flex items-center gap-3 mb-6 pt-4 border-t border-border first:border-t-0 first:pt-0">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", color)}>
        <Icon size={20} className="text-primary-foreground" />
      </div>
      <h3 className="text-lg font-black text-foreground">{title}</h3>
    </div>
  );

  const CheckboxGroup = ({ field, options }: { field: any; options: string[] }) => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {options.map((opt) => (
        <label key={opt} className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/30 cursor-pointer text-sm">
          <Checkbox
            checked={field.value?.includes(opt)}
            onCheckedChange={(checked) => {
              const val = field.value || [];
              if (checked) field.onChange([...val, opt]);
              else field.onChange(val.filter((v: string) => v !== opt));
            }}
          />
          <span className="leading-tight">{opt}</span>
        </label>
      ))}
    </div>
  );

  const RadioGroupField = ({ field, options, label }: { field: any; options: string[]; label?: string }) => (
    <RadioGroup
      value={field.value}
      onValueChange={field.onChange}
      className="flex flex-wrap gap-2"
    >
      {options.map((opt) => (
        <div key={opt} className="flex items-center gap-2">
          <RadioGroupItem value={opt} id={`${field.name}-${opt}`} />
          <label htmlFor={`${field.name}-${opt}`} className="text-sm cursor-pointer">{label ? (opt === "true" ? "Yes" : opt === "false" ? "No" : opt) : opt}</label>
        </div>
      ))}
    </RadioGroup>
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
        {/* Opening Note */}
        <div className="p-6 bg-muted/30 rounded-xl border border-border">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Welcome — this form helps me understand what has been happening for you, what your nervous system may be responding to, and what you would most like to change. There are no right or wrong answers, just share what feels true for you right now.
          </p>
        </div>

        {/* Personal Information */}
        <div className="space-y-6">
          <SectionHeader icon={User} title="Personal Information" color="bg-primary" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            <FormField control={form.control} name="first_name" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">First Name <span className="text-destructive">*</span></FormLabel>
                <FormControl><Input placeholder="First Name" {...field} className="h-12 rounded-xl border-border text-base focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="second_name" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Second Name <span className="text-destructive">*</span></FormLabel>
                <FormControl><Input placeholder="Second Name" {...field} className="h-12 rounded-xl border-border text-base focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="born" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Date of Birth <span className="text-destructive">*</span></FormLabel>
                <FormControl><Input type="date" {...field} className="h-12 rounded-xl border-border text-base focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email Address <span className="text-destructive">*</span></FormLabel>
                <FormControl><Input type="email" placeholder="email@example.com" {...field} className="h-12 rounded-xl border-border text-base focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Mobile Number</FormLabel>
                <FormControl><Input placeholder="0400 000 000" {...field} className="h-12 rounded-xl border-border text-base focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="home_address" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Home Address</FormLabel>
                <FormControl><Input placeholder="Street, City, Postcode" {...field} className="h-12 rounded-xl border-border text-base focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>

        {/* Background */}
        <div className="space-y-6">
          <SectionHeader icon={Heart} title="Background" color="bg-rose-600" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            <FormField control={form.control} name="occupation" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">What is your occupation?</FormLabel>
                <FormControl><Input placeholder="Occupation" {...field} className="h-12 rounded-xl border-border text-base focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="children" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Do you have children?</FormLabel>
                <FormControl>
                  <RadioGroup value={field.value} onValueChange={field.onChange} className="flex gap-4">
                    <div className="flex items-center gap-2"><RadioGroupItem value="Yes" id="children-yes" /><label htmlFor="children-yes" className="text-sm cursor-pointer">Yes</label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="No" id="children-no" /><label htmlFor="children-no" className="text-sm cursor-pointer">No</label></div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="referral_source" render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">How did you find out about us? <span className="text-destructive">*</span></FormLabel>
                <FormControl><Input placeholder="e.g. Google, Instagram, Friend" {...field} className="h-12 rounded-xl border-border text-base focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="space-y-6">
          <SectionHeader icon={ShieldAlert} title="Emergency Contact" color="bg-amber-500" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
            <FormField control={form.control} name="emergency_contact_name" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Emergency Contact <span className="text-destructive">*</span></FormLabel>
                <FormControl><Input placeholder="Full Name" {...field} className="h-12 rounded-xl border-border text-base focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="emergency_contact_phone" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Phone <span className="text-destructive">*</span></FormLabel>
                <FormControl><Input placeholder="0400 000 000" {...field} className="h-12 rounded-xl border-border text-base focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="emergency_contact_relationship" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Relationship <span className="text-destructive">*</span></FormLabel>
                <FormControl><Input placeholder="e.g. Partner, Parent" {...field} className="h-12 rounded-xl border-border text-base focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>

        {/* Chief Complaint & Health History */}
        <div className="space-y-6">
          <SectionHeader icon={Activity} title="Chief Complaint & Health History" color="bg-rose-600" />
          <div className="space-y-5">
            <FormField control={form.control} name="change_one_thing" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">If you could change just one thing in your life, what would it be and why? <span className="text-destructive">*</span></FormLabel>
                <FormControl><Textarea placeholder="Your answer..." className="min-h-[80px] rounded-xl border-border text-base resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="never_been_same_since" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Finish this statement: "I have never been the same since..." <span className="text-destructive">*</span></FormLabel>
                <FormControl><Textarea placeholder="Your answer..." className="min-h-[80px] rounded-xl border-border text-base resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="chief_complaint" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">What is the main thing you would like help with? How long has this been going on? <span className="text-destructive">*</span></FormLabel>
                <FormControl><Textarea placeholder="Describe your main concern and duration..." className="min-h-[80px] rounded-xl border-border text-base resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="health_problem_severity" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">How intense or disruptive does this feel right now?</FormLabel>
                <FormControl>
                  <RadioGroup value={field.value} onValueChange={field.onChange} className="flex flex-wrap gap-3">
                    {["Mild", "Moderate", "Severe", "Extreme"].map((opt) => (
                      <div key={opt} className="flex items-center gap-2">
                        <RadioGroupItem value={opt} id={`severity-${opt}`} />
                        <label htmlFor={`severity-${opt}`} className="text-sm cursor-pointer">{opt}</label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="seen_medical_doctor" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Have you seen a medical doctor or specialist for this? <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <RadioGroup value={field.value} onValueChange={field.onChange} className="flex gap-4">
                    <div className="flex items-center gap-2"><RadioGroupItem value="true" id="doctor-yes" /><label htmlFor="doctor-yes" className="text-sm cursor-pointer">Yes</label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="false" id="doctor-no" /><label htmlFor="doctor-no" className="text-sm cursor-pointer">No</label></div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>

        {/* Symptoms */}
        <div className="space-y-6">
          <SectionHeader icon={Zap} title="Symptoms" color="bg-purple-600" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField control={form.control} name="symptoms_worse_stress" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Do symptoms get worse when stressed? <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <RadioGroup value={field.value} onValueChange={field.onChange} className="flex gap-4">
                    <div className="flex items-center gap-2"><RadioGroupItem value="true" id="stress-yes" /><label htmlFor="stress-yes" className="text-sm cursor-pointer">Yes</label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="false" id="stress-no" /><label htmlFor="stress-no" className="text-sm cursor-pointer">No</label></div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="symptoms_worse_fatigue" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Do symptoms get worse when tired or run down? <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <RadioGroup value={field.value} onValueChange={field.onChange} className="flex gap-4">
                    <div className="flex items-center gap-2"><RadioGroupItem value="true" id="fatigue-yes" /><label htmlFor="fatigue-yes" className="text-sm cursor-pointer">Yes</label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="false" id="fatigue-no" /><label htmlFor="fatigue-no" className="text-sm cursor-pointer">No</label></div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <FormField control={form.control} name="pain_movement" render={({ field }) => (
            <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">How does movement affect your symptoms?</FormLabel>
              <FormControl>
                <RadioGroup value={field.value} onValueChange={field.onChange} className="flex flex-wrap gap-3">
                  {["Better", "Worse", "Both", "Other"].map((opt) => (
                    <div key={opt} className="flex items-center gap-2">
                      <RadioGroupItem value={opt} id={`movement-${opt}`} />
                      <label htmlFor={`movement-${opt}`} className="text-sm cursor-pointer">{opt}</label>
                    </div>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="current_stress_level" render={({ field }) => (
            <FormItem className="space-y-4 p-6 bg-muted/30 rounded-xl border border-border">
              <div className="flex items-center justify-between">
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Current stress level out of 10 <span className="text-destructive">*</span></FormLabel>
                <span className="text-2xl font-black text-primary">{field.value}</span>
              </div>
              <FormControl>
                <Slider min={1} max={10} step={1} value={[field.value]} onValueChange={(vals) => field.onChange(vals[0])} className="[&_[role=slider]]:h-6 [&_[role=slider]]:w-6" />
              </FormControl>
              <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                <span>Very Low</span>
                <span>Extreme</span>
              </div>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* Previous Therapies */}
        <div className="space-y-6">
          <SectionHeader icon={Activity} title="Previous Therapies" color="bg-teal-600" />
          <FormField control={form.control} name="therapies_used" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">What other forms of therapy have you used to resolve your health problems?</FormLabel>
              <FormControl><CheckboxGroup field={field} options={THERAPY_OPTIONS} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField control={form.control} name="therapies_other" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">If other, please specify</FormLabel>
                <FormControl><Input placeholder="Other therapies..." {...field} className="h-12 rounded-xl border-border text-base focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="therapies_success" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">What helped, what didn't, and did anything make you feel worse?</FormLabel>
                <FormControl><Textarea placeholder="Your answer..." className="min-h-[80px] rounded-xl border-border text-base resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>

        {/* Health History */}
        <div className="space-y-6">
          <SectionHeader icon={AlertTriangle} title="Health History" color="bg-orange-600" />
          <div className="space-y-5">
            <FormField control={form.control} name="specific_illnesses" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Do you experience illnesses, infections, or flare-ups that come and go? Describe.</FormLabel>
                <FormControl><Input placeholder="e.g. Migraines, sinus infections, etc." {...field} className="h-12 rounded-xl border-border text-base focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="allergies_asthma" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Do you experience allergies, asthma, anaphylaxis, or immune-type reactions?</FormLabel>
                <FormControl><Input placeholder="Describe..." {...field} className="h-12 rounded-xl border-border text-base focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField control={form.control} name="covid_vaccinated" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Have you been vaccinated against COVID-19?</FormLabel>
                  <FormControl>
                    <RadioGroup value={field.value} onValueChange={field.onChange} className="flex gap-4">
                      <div className="flex items-center gap-2"><RadioGroupItem value="true" id="covid-yes" /><label htmlFor="covid-yes" className="text-sm cursor-pointer">Yes</label></div>
                      <div className="flex items-center gap-2"><RadioGroupItem value="false" id="covid-no" /><label htmlFor="covid-no" className="text-sm cursor-pointer">No</label></div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="covid_shots" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">If yes, how many shots</FormLabel>
                  <FormControl><Input type="number" min="1" placeholder="2" {...field} className="h-12 rounded-xl border-border text-base focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="energy_worse_time" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">When does your energy tend to dip or crash?</FormLabel>
                <FormControl>
                  <RadioGroup value={field.value} onValueChange={field.onChange} className="flex flex-wrap gap-3">
                    {["Morning", "Afternoon", "Unsure", "N/A"].map((opt) => (
                      <div key={opt} className="flex items-center gap-2">
                        <RadioGroupItem value={opt} id={`energy-${opt}`} />
                        <label htmlFor={`energy-${opt}`} className="text-sm cursor-pointer">{opt}</label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="family_medical_history" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Family Medical History</FormLabel>
                <FormControl><CheckboxGroup field={field} options={FAMILY_HISTORY_OPTIONS} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="alcohol_frequency" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">How often do you consume alcohol?</FormLabel>
                <FormControl><Input placeholder="e.g. Rarely, Weekly, Daily" {...field} className="h-12 rounded-xl border-border text-base focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>

        {/* Sleep & Concussion */}
        <div className="space-y-6">
          <SectionHeader icon={Bed} title="Sleep & Concussion History" color="bg-primary" />
          <div className="space-y-5">
            <FormField control={form.control} name="sleep_schedule" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Usual sleep/wake times</FormLabel>
                <FormControl><Input placeholder="e.g. 10:30pm – 6:30am" {...field} className="h-12 rounded-xl border-border text-base focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="sleep_quality_details" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">What is your sleep quality like?</FormLabel>
                <FormControl><CheckboxGroup field={field} options={SLEEP_QUALITY_OPTIONS} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="concussion_history" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Have you ever had a concussion, head injury, whiplash, or significant knock to the head? <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <RadioGroup value={field.value} onValueChange={field.onChange} className="flex gap-4">
                    <div className="flex items-center gap-2"><RadioGroupItem value="true" id="concussion-yes" /><label htmlFor="concussion-yes" className="text-sm cursor-pointer">Yes</label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="false" id="concussion-no" /><label htmlFor="concussion-no" className="text-sm cursor-pointer">No</label></div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="concussion_details" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">If yes — what happened, how old were you, and where did you injure yourself?</FormLabel>
                <FormControl><Textarea placeholder="Details..." className="min-h-[80px] rounded-xl border-border text-base resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>

        {/* Birth */}
        <div className="space-y-6">
          <SectionHeader icon={Heart} title="Birth History" color="bg-pink-600" />
          <FormField control={form.control} name="birthing_experience" render={({ field }) => (
            <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Birth experience <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <RadioGroup value={field.value} onValueChange={field.onChange} className="flex flex-wrap gap-3">
                  {["Natural", "Cesarean", "Induced", "Premature", "Blood loss/early hospitalisation", "Unsure"].map((opt) => (
                    <div key={opt} className="flex items-center gap-2">
                      <RadioGroupItem value={opt} id={`birth-${opt}`} />
                      <label htmlFor={`birth-${opt}`} className="text-sm cursor-pointer">{opt}</label>
                    </div>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* Emotional & Stress Profile */}
        <div className="space-y-6">
          <SectionHeader icon={Brain} title="Emotional & Stress Profile" color="bg-violet-600" />
          <div className="space-y-5">
            <FormField control={form.control} name="avoided_emotion" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Which feeling do you tend to avoid most? <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <RadioGroup value={field.value} onValueChange={field.onChange} className="flex flex-wrap gap-3">
                    {["Fear", "Worry", "Anger", "Sadness", "Hurt"].map((opt) => (
                      <div key={opt} className="flex items-center gap-2">
                        <RadioGroupItem value={opt} id={`avoid-${opt}`} />
                        <label htmlFor={`avoid-${opt}`} className="text-sm cursor-pointer">{opt}</label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="craved_emotion" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Which feeling or experience do you most want more of? <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <RadioGroup value={field.value} onValueChange={field.onChange} className="flex flex-wrap gap-3">
                    {["Love", "Care", "Acceptance", "Safety", "Feeling Worthy"].map((opt) => (
                      <div key={opt} className="flex items-center gap-2">
                        <RadioGroupItem value={opt} id={`crave-${opt}`} />
                        <label htmlFor={`crave-${opt}`} className="text-sm cursor-pointer">{opt}</label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="stress_response" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">When life feels too much, your system usually: <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <RadioGroup value={field.value} onValueChange={field.onChange} className="flex flex-wrap gap-3">
                    {["Flight", "Fight", "Freeze", "Immobilisation", "Fawn/people-pleasing", "Stay calm"].map((opt) => (
                      <div key={opt} className="flex items-center gap-2">
                        <RadioGroupItem value={opt} id={`stress-resp-${opt}`} />
                        <label htmlFor={`stress-resp-${opt}`} className="text-sm cursor-pointer">{opt}</label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="most_craved_human_need" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">What are you craving most right now? <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <RadioGroup value={field.value} onValueChange={field.onChange} className="flex flex-wrap gap-3">
                    {["Certainty/Safety", "Uncertainty/Variety", "Significance", "Connection/Love", "Growth", "Contribution"].map((opt) => (
                      <div key={opt} className="flex items-center gap-2">
                        <RadioGroupItem value={opt} id={`need-${opt}`} />
                        <label htmlFor={`need-${opt}`} className="text-sm cursor-pointer">{opt}</label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="startled_by_loud_noises" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Do loud noises or sudden sounds startle you easily? <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <RadioGroup value={field.value} onValueChange={field.onChange} className="flex flex-wrap gap-3">
                    {["Yes", "No", "Sometimes"].map((opt) => (
                      <div key={opt} className="flex items-center gap-2">
                        <RadioGroupItem value={opt} id={`startle-${opt}`} />
                        <label htmlFor={`startle-${opt}`} className="text-sm cursor-pointer">{opt}</label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="emotional_regulation_time" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">When emotionally triggered, how long does it usually take to settle?</FormLabel>
                <FormControl><Input placeholder="e.g. Minutes, Hours, Days" {...field} className="h-12 rounded-xl border-border text-base focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>

        {/* Goals & Expectations */}
        <div className="space-y-6">
          <SectionHeader icon={Brain} title="Goals & Expectations" color="bg-indigo-600" />
          <div className="space-y-5">
            <FormField control={form.control} name="goal_working" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">What would "this is working" look like for you? How much better, and by when?</FormLabel>
                <FormControl><Textarea placeholder="Your answer..." className="min-h-[80px] rounded-xl border-border text-base resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="goal_12_sessions" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">If we work together for 12 sessions, what would you most want to be different?</FormLabel>
                <FormControl><Textarea placeholder="Your answer..." className="min-h-[80px] rounded-xl border-border text-base resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="goal_safe_feeling" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">What helps you feel safe, supported, calm, or more like yourself?</FormLabel>
                <FormControl><Textarea placeholder="Your answer..." className="min-h-[80px] rounded-xl border-border text-base resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>

        {/* Additional Notes */}
        <div className="space-y-6">
          <SectionHeader icon={Heart} title="Anything Else?" color="bg-emerald-600" />
          <FormField control={form.control} name="additional_notes" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Is there anything else that you want to mention to help us understand your case?</FormLabel>
              <FormControl><Textarea placeholder="Your additional notes..." className="min-h-[100px] rounded-xl border-border text-base resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90 h-16 rounded-xl font-black text-base uppercase tracking-widest shadow-xl shadow-primary/10"
          disabled={submitting}
        >
          {submitting ? (
            <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> {syncStatus === 'syncing' ? 'Syncing...' : 'Saving...'}</>
          ) : (
            <><CheckCircle2 className="mr-2 h-6 w-6" /> Submit Intake Form</>
          )}
        </Button>
        <p className="text-center text-[10px] text-muted-foreground mt-4 font-medium uppercase tracking-widest">
          Your data is stored securely and only visible to your practitioner.
        </p>
      </form>
    </Form>
  );
};

export default PublicIntakeForm;