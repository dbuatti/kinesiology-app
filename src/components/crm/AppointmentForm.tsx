
import { useState, useEffect, useMemo } from "react";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Mail, Clock, CheckCircle2, AlertCircle, Unlock, Save, Sparkles, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { APPOINTMENT_TAGS, APPOINTMENT_STATUSES } from "@/data/appointment-data";
import SearchableClientSelect from "./SearchableClientSelect";
import { CALCOM_CONFIG } from "@/config/integrations";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  send_onboarding: z.boolean().default(true),
});

interface AppointmentFormProps {
  onSuccess: () => void;
  initialClientId?: string;
  initialDate?: Date;
  initialTime?: string;
  slotTime?: string; 
  eventTypeId?: string; 
  existingAppointment?: any; 
}

const PRICES = Array.from(new Set(CALCOM_CONFIG.EVENT_TYPES.map((t: { price: number }) => t.price))).sort((a: number, b: number) => a - b);

interface SessionOption {
  key: string;
  label: string;
  price: number;
  eventTypeId: string;
}

const SESSION_OPTIONS: SessionOption[] = CALCOM_CONFIG.EVENT_TYPES.map((t: { id: string; name: string; price: number }) => ({
  key: t.id,
  label: t.name,
  price: t.price,
  eventTypeId: t.id,
}));

const AppointmentForm = ({ 
  onSuccess, 
  initialClientId, 
  initialDate, 
  initialTime, 
  slotTime: initialSlotTime, 
  eventTypeId: propEventTypeId,
  existingAppointment
}: AppointmentFormProps) => {
  const { session } = useAuth();
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'calcom' | 'email'>('idle');
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [isTimeLocked, setIsTimeLocked] = useState(!!initialSlotTime);
  const [currentSlotTime] = useState(initialSlotTime);
  const [clientRate, setClientRate] = useState<number | null>(null);

  const isEditMode = !!existingAppointment;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: existingAppointment?.client_id || initialClientId || "",
      date: existingAppointment?.date ? new Date(existingAppointment.date) : (initialDate || new Date()),
      time: existingAppointment?.date ? format(new Date(existingAppointment.date), "HH:mm") : (initialTime || "10:00"),
      name: existingAppointment?.name || "",
      tag: existingAppointment?.tag || "Kinesiology",
      status: existingAppointment?.status || "Scheduled",
      is_paid: existingAppointment?.is_paid || false,
      send_onboarding: false, 
      goal: existingAppointment?.goal || "",
      issue: existingAppointment?.issue || "",
    },
  });

  const selectedClientId = form.watch("clientId");

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

  useEffect(() => {
    if (!selectedClientId) return;
    supabase
      .from("clients")
      .select("standard_rate")
      .eq("id", selectedClientId)
      .single()
      .then(({ data }) => {
        const rate = data?.standard_rate ?? null;
        setClientRate(rate);
        if (!existingAppointment && rate !== null) {
          setSelectedPrice(rate);
          form.setValue('is_paid', rate > 0);
          form.setValue('send_onboarding', rate > 0);
        }
      });
  }, [selectedClientId, existingAppointment, form]);

  const currentEventTypeId = propEventTypeId || localStorage.getItem('calcom_preferred_event_id') || CALCOM_CONFIG.DEFAULT_EVENT_TYPE_ID;

  const [selectedPrice, setSelectedPrice] = useState<number>(() => {
    if (existingAppointment) return existingAppointment.price_amount || 0;
    if (initialTime || currentSlotTime) {
      const type = CALCOM_CONFIG.EVENT_TYPES.find((t: { id: string }) => t.id === currentEventTypeId);
      return type?.price || 70;
    }
    return 0; 
  });

  const [selectedSessionKey, setSelectedSessionKey] = useState<string | null>(() => {
    if (existingAppointment) {
      const t = CALCOM_CONFIG.EVENT_TYPES.find((e: { price: number }) => e.price === existingAppointment.price_amount);
      return t?.id || null;
    }
    return null;
  });

  const currentEventType = CALCOM_CONFIG.EVENT_TYPES.find((t: { price: number }) => t.price === selectedPrice) || CALCOM_CONFIG.EVENT_TYPES[0];

  const priceOptions = useMemo(() => {
    const options: { price: number; label: string; sublabel: string }[] = [];
    if (clientRate !== null) {
      options.push({
        price: clientRate,
        label: clientRate === 0 ? "Free" : `$${clientRate}`,
        sublabel: clientRate === 0 ? "No Charge" : "Current rate",
      });
    }
    PRICES.forEach((p: number) => {
      if (p === clientRate) return;
      options.push({
        price: p,
        label: p === 0 ? "Free" : `$${p}`,
        sublabel: p === 0 ? "No Charge" : "Paid Session",
      });
    });
    return options;
  }, [clientRate]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!session?.user?.id) {
      showError("You must be logged in to schedule appointments.");
      return;
    }
    
    setSubmitting(true);
    setConflictError(null);

    try {
      let isoDate = "";
      if (currentSlotTime && isTimeLocked) {
        isoDate = currentSlotTime;
      } else {
        const [hours, minutes] = values.time.split(":");
        const appointmentDate = new Date(values.date);
        appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        isoDate = appointmentDate.toISOString();
      }

      let calcomId = existingAppointment?.calcom_booking_id || null;

      if ((!isEditMode && (initialTime || currentSlotTime)) || (isEditMode && calcomId)) {
        setSyncStatus('calcom');
        try {
          const { data: calcomData, error: invokeError } = await supabase.functions.invoke('create-calcom-booking', {
            body: {
              clientId: values.clientId,
              startTime: isoDate,
              eventTypeId: currentEventType.id,
              title: values.name || values.tag || "Kinesiology Session",
              notes: values.goal || values.issue || "",
              is_paid: values.is_paid,
              bookingUid: calcomId ? String(calcomId) : null
            }
          });

          if (invokeError) throw invokeError;
          if (!isEditMode) calcomId = calcomData?.uid || calcomData?.bookingId;
        } catch (err: any) {
          const msg = err.message || "";
          if (msg.includes("Conflict") || msg.includes("available") || msg.includes("booking")) {
            setConflictError(msg);
            setSubmitting(false);
            return; 
          }
          throw err;
        }
      }

      let appointmentName = values.name?.trim() || '';
      if (!appointmentName) {
          const client = clients.find(c => c.id === values.clientId);
          const clientName = client?.name || "Unknown Client";
          const formattedDate = format(new Date(isoDate), "MMM d, yyyy");
          appointmentName = `${clientName} - ${values.tag || 'Session'} (${formattedDate})`;
      }

      const payload = {
        user_id: session.user.id,
        client_id: values.clientId,
        name: appointmentName,
        date: isoDate,
        tag: values.tag,
        status: values.status,
        goal: values.goal,
        issue: values.issue,
        is_paid: values.is_paid,
        calcom_booking_id: calcomId ? String(calcomId) : null,
        price_amount: currentEventType.price,
        price_currency: currentEventType.currency
      };

      if (isEditMode) {
        const { error: dbError } = await supabase.from("appointments").update(payload).eq('id', existingAppointment.id);
        if (dbError) throw dbError;
        showSuccess("Session updated.");
      } else {
        const { data: newApp, error: dbError } = await supabase.from("appointments").upsert({
          ...payload,
          send_onboarding: values.send_onboarding
        }, { onConflict: calcomId ? 'calcom_booking_id' : 'id' }).select('id').single();

        if (dbError) throw dbError;

        if (values.send_onboarding) {
          setSyncStatus('email');
          try {
            await supabase.functions.invoke('send-manual-onboarding', {
              body: { clientId: values.clientId, appointmentId: newApp?.id }
            });
          } catch (err) {
            console.error("Onboarding Email Failed:", err);
          }
        }
        showSuccess(values.send_onboarding ? "Session booked and onboarding email sent!" : "Appointment scheduled.");
      }

      onSuccess();
    } catch (error: any) {
      showError(error.message || "Failed to save appointment");
    } finally {
      setSubmitting(false);
      setSyncStatus('idle');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {conflictError && (
          <Alert variant="destructive" className="bg-chart-destructive/10 border-chart-destructive/20 rounded-2xl">
            <AlertCircle className="h-5 w-5 text-chart-destructive" />
            <AlertDescription className="text-sm text-chart-destructive font-bold">{conflictError}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="clientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-black text-foreground uppercase tracking-widest">Client</FormLabel>
              <FormControl>
                <SearchableClientSelect
                  clients={clients}
                  value={field.value}
                  onSelect={field.onChange}
                  disabled={loadingClients || isEditMode}
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
              <FormLabel className="text-xs font-black text-foreground uppercase tracking-widest">Appointment Title (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Initial Session" {...field} className="h-12 rounded-xl border-2 border-border/50 focus:border-chart-primary transition-all" />
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
              <FormItem>
                <FormLabel className="text-xs font-black text-foreground uppercase tracking-widest">Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal h-12 rounded-xl border-2 border-border/50",
                          !field.value && "text-muted-foreground"
                        )}
                        disabled={isTimeLocked}
                      >
                        {field.value ? format(field.value, "MMMM do, yyyy") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
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
                <div className="flex items-center justify-between">
                  <FormLabel className="text-xs font-black text-foreground uppercase tracking-widest">Time</FormLabel>
                  {isTimeLocked && (
                    <button type="button" onClick={() => setIsTimeLocked(false)} className="text-[8px] font-black text-chart-primary uppercase tracking-widest flex items-center gap-1 hover:underline">
                      <Unlock size={10} /> Override Slot
                    </button>
                  )}
                </div>
                <FormControl>
                  <div className="relative">
                    <Input type="time" {...field} className="h-12 rounded-xl border-2 border-border/50 pr-10" disabled={isTimeLocked} />
                    <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
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
                <FormLabel className="text-xs font-black text-foreground uppercase tracking-widest">Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 rounded-xl border-2 border-border/50">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-xl border-none shadow-2xl bg-card dark:bg-foreground">
                    {APPOINTMENT_TAGS.map(tag => (
                      <SelectItem key={tag} value={tag} className="rounded-lg">{tag}</SelectItem>
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
                <FormLabel className="text-xs font-black text-foreground uppercase tracking-widest">Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 rounded-xl border-2 border-border/50">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-xl border-none shadow-2xl bg-card dark:bg-foreground">
                    {APPOINTMENT_STATUSES.map(status => (
                      <SelectItem key={status} value={status} className="rounded-lg">{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Session Picker */}
        <div className="space-y-3">
          <FormLabel className="text-xs font-black text-foreground uppercase tracking-widest">Session</FormLabel>
          <div className="grid grid-cols-3 gap-2">
            {SESSION_OPTIONS.map((s) => {
              const isSelected = selectedSessionKey === s.key;
              const isClientRate = clientRate !== null && s.price === clientRate;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => {
                    setSelectedSessionKey(s.key);
                    setSelectedPrice(s.price);
                    form.setValue('is_paid', s.price > 0);
                    form.setValue('send_onboarding', s.price > 0);
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all relative",
                    isSelected
                      ? "bg-chart-primary border-chart-primary text-primary-foreground shadow-lg shadow-chart-primary/20"
                      : "bg-card border-border/50 text-muted-foreground hover:border-chart-primary/20"
                  )}
                >
                  {isClientRate && !isSelected && (
                    <span className="absolute -top-2 right-2 bg-chart-emerald text-primary-foreground text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full z-10">
                      Rate
                    </span>
                  )}
                  {isClientRate && isSelected && (
                    <Sparkles size={12} className="absolute top-2 right-2 opacity-70" />
                  )}
                  <Package size={16} className="mb-1 opacity-60" />
                  <span className="text-[9px] font-black leading-tight text-center">{s.label}</span>
                  <span className="text-[10px] font-bold mt-0.5">{s.price === 0 ? "Free" : `$${s.price}`}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <FormLabel className="text-xs font-black text-foreground uppercase tracking-widest">Session Price</FormLabel>
          <div className="grid grid-cols-3 gap-3">
            {priceOptions.map((opt) => {
              const isCurrentRate = opt.sublabel === "Current rate";
              const isSelected = selectedPrice === opt.price;
              return (
                <button
                  key={opt.price}
                  type="button"
                  onClick={() => {
                    setSelectedPrice(opt.price);
                    const matched = SESSION_OPTIONS.find((s: SessionOption) => s.price === opt.price);
                    if (matched) setSelectedSessionKey(matched.key);
                    form.setValue('is_paid', opt.price > 0);
                    form.setValue('send_onboarding', opt.price > 0);
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all relative",
                    isSelected
                      ? "bg-chart-primary border-chart-primary text-primary-foreground shadow-lg shadow-chart-primary/20"
                      : "bg-card border-border/50 text-muted-foreground hover:border-chart-primary/20"
                  )}
                >
                  {isCurrentRate && !isSelected && (
                    <span className="absolute -top-2 right-2 bg-chart-emerald text-primary-foreground text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full z-10">
                      Rate
                    </span>
                  )}
                  {isCurrentRate && isSelected && (
                    <Sparkles size={12} className="absolute top-2 right-2 opacity-70" />
                  )}
                  <span className="text-lg font-black">{opt.label}</span>
                  <span className="text-[8px] font-bold uppercase tracking-widest opacity-70">{opt.sublabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {!isEditMode && (
          <FormField
            control={form.control}
            name="send_onboarding"
            render={({ field }) => (
              <FormItem 
                className={cn(
                  "flex flex-row items-center justify-between rounded-[1.5rem] border-2 p-5 transition-all cursor-pointer",
                  field.value ? "bg-chart-emerald/10 border-chart-emerald/20" : "bg-card border-border/50 hover:border-chart-emerald/10"
                )}
                onClick={() => field.onChange(!field.value)}
              >
                <div className="flex items-center gap-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", field.value ? "bg-chart-emerald text-primary-foreground" : "bg-muted text-chart-emerald")}>
                    <Mail size={20} />
                  </div>
                  <div className="space-y-0.5">
                    <FormLabel className="text-base font-black text-foreground cursor-pointer">Send Onboarding Email</FormLabel>
                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Automatically email the intake form</p>
                  </div>
                </div>
                <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all", field.value ? "bg-chart-emerald border-chart-emerald" : "border-border")}>
                  {field.value && <CheckCircle2 size={16} className="text-primary-foreground" />}
                </div>
              </FormItem>
            )}
          />
        )}

        <Button type="submit" className="w-full bg-chart-primary hover:bg-chart-primary/80 h-14 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-chart-primary/20" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {syncStatus === 'calcom' ? 'Syncing Cal.com...' : syncStatus === 'email' ? 'Sending Onboarding...' : 'Saving...'}
            </>
          ) : (
            <>{isEditMode ? <Save size={18} className="mr-2" /> : null}{isEditMode ? 'Update Session' : 'Schedule Appointment'}</>
          )}
        </Button>
      </form>
    </Form>
  );
};

export default AppointmentForm;