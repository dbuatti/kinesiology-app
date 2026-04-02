"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Globe, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { APPOINTMENT_TAGS, APPOINTMENT_STATUSES } from "@/data/appointment-data";
import SearchableClientSelect from "./SearchableClientSelect";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  date: z.date({
    required_error: "Date is required",
  }),
  time: z.string().min(1, "Time is required"),
  name: z.string().optional(),
  tag: z.string().optional(),
  status: z.string().default("Scheduled"),
  goal: z.string().optional(),
  issue: z.string().optional(),
  is_paid: z.boolean().default(false),
});

interface AppointmentFormProps {
  onSuccess: () => void;
  initialClientId?: string;
  initialDate?: Date;
  initialTime?: string;
}

const AppointmentForm = ({ onSuccess, initialClientId, initialDate, initialTime }: AppointmentFormProps) => {
  const { session } = useAuth();
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'calcom'>('idle');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: initialClientId || "",
      name: "",
      tag: APPOINTMENT_TAGS[0],
      status: APPOINTMENT_STATUSES[0],
      time: initialTime || "10:00",
      date: initialDate || new Date(),
      is_paid: false,
    },
  });

  useEffect(() => {
    const fetchClients = async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .or('is_practitioner.eq.false,is_practitioner.is.null')
        .order("name");
      
      if (!error && data) {
        setClients(data);
      }
      setLoadingClients(false);
    };

    fetchClients();
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!session?.user?.id) {
      showError("You must be logged in to schedule appointments.");
      return;
    }
    
    setSubmitting(true);

    try {
      const [hours, minutes] = values.time.split(":");
      const appointmentDate = new Date(values.date);
      appointmentDate.setHours(parseInt(hours), parseInt(minutes));
      const isoDate = appointmentDate.toISOString();

      let calcomId = null;

      if (initialTime) {
        setSyncStatus('calcom');
        const eventTypeId = localStorage.getItem('calcom_preferred_event_id') || "4279898";

        const { data: calcomData, error: invokeError } = await supabase.functions.invoke('create-calcom-booking', {
          body: { 
            clientId: values.clientId, 
            startTime: isoDate,
            eventTypeId: eventTypeId,
            title: values.name || values.tag || "Kinesiology Session",
            notes: values.goal || values.issue || ""
          }
        });

        if (invokeError) throw new Error(`Sync Error: ${invokeError.message}`);
        calcomId = calcomData?.uid || calcomData?.bookingId;
      }

      let appointmentName = values.name?.trim() || '';
      if (!appointmentName) {
          const client = clients.find(c => c.id === values.clientId);
          const clientName = client?.name || "Unknown Client";
          const formattedDate = format(appointmentDate, "MMM d, yyyy");
          appointmentName = `${clientName} - ${values.tag || 'Session'} (${formattedDate})`;
      }

      const { error } = await supabase.from("appointments").insert({
        user_id: session.user.id,
        client_id: values.clientId,
        name: appointmentName,
        date: isoDate,
        tag: values.tag,
        status: values.status,
        goal: values.goal,
        issue: values.issue,
        is_paid: values.is_paid,
        calcom_booking_id: calcomId ? String(calcomId) : null
      });

      if (error) throw error;

      showSuccess(calcomId ? "Session booked in CRM and Cal.com!" : "Appointment scheduled in CRM.");
      onSuccess();
    } catch (error: any) {
      showError(error.message || "Failed to schedule appointment");
    } finally {
      setSubmitting(false);
      setSyncStatus('idle');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="clientId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Client</FormLabel>
              <FormControl>
                <SearchableClientSelect
                  clients={clients}
                  value={field.value}
                  onSelect={field.onChange}
                  disabled={loadingClients}
                  placeholder={loadingClients ? "Loading clients..." : "Search and select client"}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Appointment Title (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Initial Session" {...field} className="h-12 rounded-xl border-2 border-slate-100" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal h-12 rounded-xl border-2 border-slate-100",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} className="h-12 rounded-xl border-2 border-slate-100" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="tag"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 rounded-xl border-2 border-slate-100">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {APPOINTMENT_TAGS.map(tag => (
                      <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 rounded-xl border-2 border-slate-100">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {APPOINTMENT_STATUSES.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="is_paid"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-xl border-2 border-indigo-100 p-4 bg-indigo-50/30">
              <div className="space-y-0.5">
                <FormLabel className="text-base font-bold text-indigo-900 flex items-center gap-2">
                  <DollarSign size={18} className="text-indigo-600" />
                  Paid Session ($50)
                </FormLabel>
                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">
                  Include payment details in onboarding email
                </p>
              </div>
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="h-6 w-6 rounded-md border-indigo-300 data-[state=checked]:bg-indigo-600"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="goal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Goal</FormLabel>
              <FormControl>
                <Input placeholder="What is the goal for this session?" {...field} className="h-12 rounded-xl border-2 border-slate-100" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="issue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Main Issue</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe the main concern..." 
                  className="resize-none rounded-xl border-2 border-slate-100 min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 rounded-xl font-bold interactive-lift shadow-indigo-100" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {syncStatus === 'calcom' ? 'Syncing with Cal.com...' : 'Scheduling...'}
            </>
          ) : (
            'Schedule Appointment'
          )}
        </Button>
      </form>
    </Form>
  );
};

export default AppointmentForm;