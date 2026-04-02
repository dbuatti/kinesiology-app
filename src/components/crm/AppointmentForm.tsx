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
import { CalendarIcon, Loader2, Globe, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { APPOINTMENT_TAGS, APPOINTMENT_STATUSES } from "@/data/appointment-data";
import SearchableClientSelect from "./SearchableClientSelect";

const formSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  date: z.date({ required_error: "Date is required" }),
  time: z.string().min(1, "Time is required"),
  name: z.string().optional(),
  tag: z.string().optional(),
  status: z.string().default("Scheduled"),
  goal: z.string().optional(),
  issue: z.string().optional(),
});

interface AppointmentFormProps {
  onSuccess: () => void;
  initialClientId?: string;
  initialDate?: Date;
  initialTime?: string;
}

const AppointmentForm = ({
  onSuccess,
  initialClientId,
  initialDate,
  initialTime,
}: AppointmentFormProps) => {
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
    },
  });

  useEffect(() => {
    const fetchClients = async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .or('is_practitioner.eq.false,is_practitioner.is.null')
        .order("name");

      if (!error && data) setClients(data);
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
    setSyncStatus('idle');

    try {
      const [hours, minutes] = values.time.split(":");
      const appointmentDate = new Date(values.date);
      appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      const isoDate = appointmentDate.toISOString();

      let calcomId: string | null = null;

      if (initialTime) {
        console.log("[AppointmentForm] Triggering Cal.com sync...");
        setSyncStatus('calcom');

        const eventTypeId = localStorage.getItem('calcom_preferred_event_id') || "4279898";

        const { data: calcomData, error: invokeError } = await supabase.functions.invoke(
          'create-calcom-booking',
          {
            body: {
              clientId: values.clientId,
              startTime: isoDate,
              eventTypeId,
            },
          }
        );

        if (invokeError) {
          console.error("[AppointmentForm] Invoke Error:", invokeError);
          // Better error message for common 401 cases
          const msg = invokeError.message?.includes("401") || invokeError.status === 401
            ? "Authentication failed when calling Supabase Edge Function. Try logging out and back in."
            : invokeError.message || "Edge Function Error";
          throw new Error(`Cal.com sync failed: ${msg}`);
        }

        if (!calcomData?.success) {
          throw new Error(calcomData?.error || "Cal.com booking creation failed");
        }

        calcomId = calcomData.uid || calcomData.bookingId;
        console.log("✅ Cal.com booking created:", calcomId);
      }

      // Create appointment in CRM
      let appointmentName = values.name?.trim() || '';
      if (!appointmentName) {
        const client = clients.find(c => c.id === values.clientId);
        const clientName = client?.name || "Unknown Client";
        const formattedDate = format(appointmentDate, "MMM d, yyyy");
        appointmentName = `${clientName} - ${values.tag || 'Session'} (${formattedDate})`;
      }

      const { error: insertError } = await supabase.from("appointments").insert({
        user_id: session.user.id,
        client_id: values.clientId,
        name: appointmentName,
        date: isoDate,
        tag: values.tag,
        status: values.status,
        goal: values.goal,
        issue: values.issue,
        calcom_booking_id: calcomId ? String(calcomId) : null,
      });

      if (insertError) throw insertError;

      showSuccess(calcomId ? "Appointment booked in CRM + Cal.com!" : "Appointment scheduled in CRM.");
      onSuccess();
    } catch (error: any) {
      console.error("[AppointmentForm] Submit Error:", error);
      showError(error.message || "Failed to schedule appointment");
    } finally {
      setSubmitting(false);
      setSyncStatus('idle');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* ... all your FormFields remain exactly the same ... */}
        {/* (clientId, name, date/time, tag, status, goal, issue) */}

        <Button 
          type="submit" 
          className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 rounded-xl font-bold shadow-indigo-100" 
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {syncStatus === 'calcom' ? 'Creating Cal.com booking...' : 'Scheduling...'}
            </>
          ) : (
            'Schedule Appointment'
          )}
        </Button>

        {initialTime && (
          <div className="flex items-center justify-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest pt-2">
            <Globe size={12} /> This will create a live booking on Cal.com
          </div>
        )}
      </form>
    </Form>
  );
};

export default AppointmentForm;