import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Loader2, User, Activity, ShieldAlert } from "lucide-react";
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
  chatgpt_url: z.string().url("Must be a valid URL").or(z.string().length(0)).optional(),
  journal: z.string().optional(),
  // New Fields
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  medications_supplements: z.string().optional(),
  current_stress_level: z.number().min(1).max(10).default(5),
  sleep_quality: z.string().optional(),
  digestive_health: z.string().optional(),
  medical_history: z.string().optional(),
  referral_source: z.string().optional(),
});

interface ClientFormProps {
  onSuccess: () => void;
  initialData?: Client;
}

const ClientForm = ({ onSuccess, initialData }: ClientFormProps) => {
  const { session } = useAuth();
  const [submitting, setSubmitting] = useState(false);

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
      chatgpt_url: initialData?.chatgpt_url || "",
      journal: initialData?.journal || "",
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
    if (!session?.user?.id) return;
    setSubmitting(true);

    try {
      const suburbsArray = values.suburbs 
        ? values.suburbs.split(",").map(s => s.trim()).filter(s => s.length > 0) 
        : [];

      const payload = {
        user_id: session.user.id,
        name: values.name,
        email: values.email || null,
        phone: values.phone || null,
        pronouns: values.pronouns || null,
        born: values.born ? new Date(values.born).toISOString() : null,
        suburbs: suburbsArray,
        occupation: values.occupation || null,
        marital_status: values.marital_status || null,
        children: values.children || null,
        chatgpt_url: values.chatgpt_url || null,
        journal: values.journal || null,
        emergency_contact_name: values.emergency_contact_name || null,
        emergency_contact_phone: values.emergency_contact_phone || null,
        medications_supplements: values.medications_supplements || null,
        current_stress_level: values.current_stress_level,
        sleep_quality: values.sleep_quality || null,
        digestive_health: values.digestive_health || null,
        medical_history: values.medical_history || null,
        referral_source: values.referral_source || null,
      };

      if (initialData?.id) {
        const { error } = await supabase
          .from("clients")
          .update(payload)
          .eq('id', initialData.id);
        if (error) throw error;
        showSuccess("Client updated successfully");
      } else {
        const { error } = await supabase.from("clients").insert(payload);
        if (error) throw error;
        showSuccess("Client added successfully");
      }

      onSuccess();
    } catch (error: any) {
      showError(error.message || "Failed to save client");
    } finally {
      setSubmitting(false);
    }
  };

  const SectionHeader = ({ icon: Icon, title, color }: { icon: any, title: string, color: string }) => (
    <div className="flex items-center gap-2 mb-4 pt-4 border-t border-slate-100 first:border-t-0 first:pt-0">
      <Icon size={16} className={color} />
      <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">{title}</h3>
    </div>
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-h-[70vh] overflow-y-auto px-1">
        {/* Personal Section */}
        <div className="space-y-4">
          <SectionHeader icon={User} title="Personal Details" color="text-indigo-600" />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Georg Gleeson" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="georg@example.com" {...field} />
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
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="0400 000 000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="pronouns"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pronouns</FormLabel>
                  <FormControl>
                    <Input placeholder="They/Them" {...field} />
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
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="suburbs"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Suburbs (comma separated)</FormLabel>
                <FormControl>
                  <Input placeholder="Brunswick, Fitzroy" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Clinical Section */}
        <div className="space-y-4">
          <SectionHeader icon={Activity} title="Clinical Context" color="text-rose-600" />
          <FormField
            control={form.control}
            name="medical_history"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Medical History & Past Injuries</FormLabel>
                <FormControl>
                  <Textarea placeholder="Past surgeries, chronic issues..." className="min-h-[80px] resize-none" {...field} />
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
                <FormLabel>Medications & Supplements</FormLabel>
                <FormControl>
                  <Textarea placeholder="Current intake..." className="min-h-[60px] resize-none" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="sleep_quality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sleep Quality</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 6hrs, wake often" {...field} />
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
                  <FormLabel>Digestive Health</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Regular, bloating" {...field} />
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
              <FormItem className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <FormLabel>Current Stress Level (1-10)</FormLabel>
                  <span className="font-black text-indigo-600">{field.value}</span>
                </div>
                <FormControl>
                  <Slider
                    min={1}
                    max={10}
                    step={1}
                    value={[field.value]}
                    onValueChange={(vals) => field.onChange(vals[0])}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Safety & Admin Section */}
        <div className="space-y-4">
          <SectionHeader icon={ShieldAlert} title="Safety & Admin" color="text-amber-500" />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="emergency_contact_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emergency Contact Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Name" {...field} />
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
                  <FormLabel>Emergency Contact Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Phone" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="referral_source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Referral Source</FormLabel>
                <FormControl>
                  <Input placeholder="How did they find you?" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="chatgpt_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ChatGPT URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://chat.openai.com/c/..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="journal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Practitioner Notes (Journal)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Long-term history, key notes, and personal reflections..." 
                    className="min-h-[100px] resize-none"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 rounded-xl font-bold" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData?.id ? "Update Client Profile" : "Add Client"}
        </Button>
      </form>
    </Form>
  );
};

export default ClientForm;