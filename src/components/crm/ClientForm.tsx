import { useState, useMemo } from "react";
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
import { Loader2, User, Activity, ShieldAlert, CheckCircle2, CalendarPlus } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { Client } from "@/types/crm";
import { cn } from "@/lib/utils";
import { parseClientJournal, stringifyClientJournal } from "@/utils/journal-helper";

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
  onSuccess: (newClientId?: string) => void;
  initialData?: Client;
}

const ClientForm = ({ onSuccess, initialData }: ClientFormProps) => {
  const { session } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [createdClientId, setCreatedClientId] = useState<string | null>(null);
  const [createdClientName, setCreatedClientName] = useState<string>("");

  const journalData = useMemo(() => parseClientJournal(initialData?.journal), [initialData?.journal]);

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
      journal: journalData.notes || "",
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

      const updatedJournal = stringifyClientJournal({
        ...journalData,
        notes: values.journal || ""
      });

      const payload = {
        user_id: session.user.id,
        name: values.name,
        email: (values.email || '').toLowerCase().trim() || null,
        phone: values.phone || null,
        pronouns: values.pronouns || null,
        born: values.born ? new Date(values.born).toISOString() : null,
        suburbs: suburbsArray,
        occupation: values.occupation || null,
        marital_status: values.marital_status || null,
        children: values.children || null,
        chatgpt_url: values.chatgpt_url || null,
        journal: updatedJournal,
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
        onSuccess();
      } else {
        const { data: newClient, error } = await supabase
          .from("clients")
          .insert(payload)
          .select('id')
          .single();
        if (error) throw error;
        showSuccess("Client added successfully");
        setCreatedClientId(newClient.id);
        setCreatedClientName(values.name);
        return;
      }
    } catch (error: any) {
      showError(error.message || "Failed to save client");
    } finally {
      setSubmitting(false);
    }
  };

  const SectionHeader = ({ icon: Icon, title, color }: { icon: any, title: string, color: string }) => (
    <div className="flex items-center gap-2 mb-4 pt-6 border-t border-border/50 first:border-t-0 first:pt-0">
      <Icon size={16} className={color} />
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">{title}</h3>
    </div>
  );

  if (createdClientId) {
    return (
      <div className="flex flex-col items-center text-center space-y-8 py-8">
        <div className="w-20 h-20 rounded-3xl bg-chart-emerald/10 flex items-center justify-center">
          <CheckCircle2 size={40} className="text-chart-emerald" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-foreground dark:text-primary-foreground tracking-tight">
            {createdClientName} added!
          </h3>
          <p className="text-sm text-muted-foreground font-medium">
            The client profile has been saved. Would you like to book their first session now?
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button
            className="flex-1 bg-primary hover:bg-primary/90 h-12 rounded-2xl font-black text-xs uppercase tracking-widest gap-2"
            onClick={() => onSuccess(createdClientId)}
          >
            <CalendarPlus size={16} />
            Book First Session
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-12 rounded-2xl font-bold text-xs uppercase tracking-widest border-border"
            onClick={() => onSuccess()}
          >
            Done
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-6">
        {/* Personal Section */}
        <div className="space-y-4">
          <SectionHeader icon={User} title="Personal Details" color="text-primary" />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Georg Gleeson" {...field} className="h-12 rounded-xl border-border focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email</FormLabel>
                  <FormControl>
                    <Input placeholder="georg@example.com" {...field} className="h-12 rounded-xl border-border focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors" />
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
                  <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="0400 000 000" {...field} className="h-12 rounded-xl border-border focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="pronouns"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pronouns</FormLabel>
                  <FormControl>
                    <Input placeholder="They/Them" {...field} className="h-12 rounded-xl border-border focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors" />
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
                  <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Date of Birth</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} className="h-12 rounded-xl border-border focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors" />
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
                <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Suburbs (comma separated)</FormLabel>
                <FormControl>
                  <Input placeholder="Brunswick, Fitzroy" {...field} className="h-12 rounded-xl border-border focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Clinical Section */}
        <div className="space-y-4">
          <SectionHeader icon={Activity} title="Clinical Context" color="text-destructive" />
          <FormField
            control={form.control}
            name="medical_history"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Medical History & Past Injuries</FormLabel>
                <FormControl>
                  <Textarea placeholder="Past surgeries, chronic issues..." className="min-h-[100px] rounded-xl border-border resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors" {...field} />
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
                <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Medications & Supplements</FormLabel>
                <FormControl>
                  <Textarea placeholder="Current intake..." className="min-h-[80px] rounded-xl border-border resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="sleep_quality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sleep Quality</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 6hrs, wake often" {...field} className="h-12 rounded-xl border-border focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors" />
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
                  <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Digestive Health</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Regular, bloating" {...field} className="h-12 rounded-xl border-border focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors" />
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
              <FormItem className="space-y-4 p-6 bg-muted/50 rounded-2xl border border-border/50">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Current Stress Level</FormLabel>
                  <span className="text-2xl font-black text-primary">{field.value}</span>
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
                <div className="flex justify-between text-[8px] font-black text-muted-foreground uppercase tracking-widest">
                  <span>Low</span>
                  <span>High</span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Safety & Admin Section */}
        <div className="space-y-4">
          <SectionHeader icon={ShieldAlert} title="Safety & Admin" color="text-amber-500" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="emergency_contact_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Emergency Contact Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Name" {...field} className="h-12 rounded-xl border-border focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors" />
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
                  <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Emergency Contact Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Phone" {...field} className="h-12 rounded-xl border-border focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors" />
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
                <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Referral Source</FormLabel>
                <FormControl>
                  <Input placeholder="How did they find you?" {...field} className="h-12 rounded-xl border-border focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors" />
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
                <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">ChatGPT URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://chat.openai.com/c/..." {...field} className="h-12 rounded-xl border-border focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors" />
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
                <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Practitioner Notes (Journal)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Long-term history, key notes, and personal reflections..." 
                    className="min-h-[120px] rounded-xl border-border resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="sticky bottom-0 pt-4 bg-card/80 backdrop-blur-sm border-t border-border/50">
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/10" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              initialData?.id ? "Update Client Profile" : "Add Client"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ClientForm;