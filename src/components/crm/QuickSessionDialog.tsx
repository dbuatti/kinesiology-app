
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import {
  CalendarIcon, Loader2, Search, Plus, Zap, Check, ChevronsUpDown, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { APPOINTMENT_TAGS } from "@/data/appointment-data";

const formSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  clientId: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  date: z.date({ required_error: "Date is required" }),
  time: z.string().min(1, "Time is required"),
  tag: z.string().optional(),
  goal: z.string().optional(),
  issue: z.string().optional(),
});

interface QuickSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getCurrentTimeRounded(): string {
  const now = new Date();
  const minutes = Math.ceil(now.getMinutes() / 15) * 15;
  if (minutes >= 60) {
    now.setHours(now.getHours() + 1, 0, 0, 0);
  } else {
    now.setMinutes(minutes, 0, 0);
  }
  return format(now, "HH:mm");
}

export function QuickSessionDialog({ open, onOpenChange }: QuickSessionDialogProps) {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [selectedClientName, setSelectedClientName] = useState("");
  const [searchValue, setSearchValue] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: "",
      clientId: "",
      email: "",
      phone: "",
      date: new Date(),
      time: getCurrentTimeRounded(),
      tag: "Kinesiology",
      goal: "",
      issue: "",
    },
  });

  useEffect(() => {
    if (open) {
      setLoading(true);
      supabase
        .from("clients")
        .select("id, name")
        .or('is_practitioner.eq.false,is_practitioner.is.null')
        .order("name")
        .then(({ data, error }) => {
          if (!error && data) setClients(data);
          setLoading(false);
        });

      form.reset({
        clientName: "",
        clientId: "",
        email: "",
        phone: "",
        date: new Date(),
        time: getCurrentTimeRounded(),
        tag: "Kinesiology",
        goal: "",
        issue: "",
      });
      setIsCreatingNew(false);
      setSelectedClientName("");
      setSearchValue("");
    }
  }, [open, form]);

  const watchClientId = form.watch("clientId");

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleClientSelect = (clientId: string, clientName: string) => {
    form.setValue("clientId", clientId);
    form.setValue("clientName", clientName);
    setIsCreatingNew(false);
    setSelectedClientName(clientName);
    setClientSearchOpen(false);
  };

  const handleCreateNew = (name: string) => {
    form.setValue("clientId", "");
    form.setValue("clientName", name);
    setIsCreatingNew(true);
    setSelectedClientName(name);
    setClientSearchOpen(false);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!session?.user?.id) {
      showError("You must be logged in.");
      return;
    }
    setSubmitting(true);

    try {
      let clientId = values.clientId;

      if (!clientId && values.clientName) {
        const { data: newClient, error: clientError } = await supabase
          .from("clients")
          .insert({
            user_id: session.user.id,
            name: values.clientName.trim(),
            email: (values.email || '').toLowerCase().trim() || null,
            phone: values.phone || null,
          })
          .select("id")
          .single();

        if (clientError) throw clientError;
        clientId = newClient.id;
      }

      if (!clientId) throw new Error("Could not determine client");

      const [hours, minutes] = values.time.split(":");
      const appointmentDate = new Date(values.date);
      appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      const isoDate = appointmentDate.toISOString();

      const appointmentName = `${values.clientName} - ${values.tag || 'Quick Session'} (${format(values.date, "MMM d, yyyy")})`;

      const { data: newApp, error: appError } = await supabase
        .from("appointments")
        .insert({
          user_id: session.user.id,
          client_id: clientId,
          name: appointmentName,
          date: isoDate,
          tag: values.tag || "Quick Session",
          status: "Completed",
          goal: values.goal || null,
          issue: values.issue || null,
          is_paid: false,
        })
        .select("id")
        .single();

      if (appError) throw appError;

      showSuccess(`Session created for ${values.clientName}`);
      onOpenChange(false);
      navigate(`/appointments/${newApp.id}`);
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to create session");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[520px] max-h-[90vh] overflow-y-auto rounded-xl p-0 border-none shadow-3xl">
        <div className="p-6 sm:p-8">
          <DialogHeader className="mb-6 text-left">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Zap size={19} />
              </div>
              <div>
                <DialogTitle className="text-xl font-serif font-medium tracking-tight">Quick session</DialogTitle>
                <DialogDescription className="text-sm">Start a session instantly — no booking or slot needed.</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <FormLabel className="text-[13px] font-medium text-foreground">
                  Client
                </FormLabel>
                <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={clientSearchOpen}
                      className="w-full justify-between h-12 rounded-xl border-2 border-border mt-2"
                    >
                      {selectedClientName ? (
                        <span className="font-medium text-foreground truncate">{selectedClientName}</span>
                      ) : (
                        <span className="text-muted-foreground">Search clients or type new name...</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0 border-none shadow-2xl z-[120]">
                    <Command className="rounded-xl">
                      <CommandInput
                        placeholder="Search clients..."
                        value={searchValue}
                        onValueChange={setSearchValue}
                        className="h-11"
                      />
                      <CommandList className="max-h-[240px] overflow-y-auto">
                        <CommandEmpty className="py-4 text-center text-sm text-muted-foreground/80">
                          <div className="flex flex-col items-center gap-2">
                            <Search size={20} className="text-muted-foreground/60" />
                            <p className="text-xs">No clients found</p>
                          </div>
                        </CommandEmpty>
                        <CommandGroup>
                          {filteredClients.map((client) => (
                            <CommandItem
                              key={client.id}
                              value={client.name}
                              onSelect={() => handleClientSelect(client.id, client.name)}
                              className="flex items-center justify-between py-3 px-4 cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-700 text-white flex items-center justify-center text-[11px] font-semibold">
                                  {client.name.charAt(0)}
                                </div>
                                <span className="font-medium">{client.name}</span>
                              </div>
                              <Check
                                className={cn(
                                  "h-4 w-4 text-chart-primary",
                                  watchClientId === client.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                        {searchValue.trim().length > 0 && !clients.some(c => c.name.toLowerCase() === searchValue.trim().toLowerCase()) && (
                          <>
                            <div className="border-t border-border" />
                            <CommandGroup>
                              <CommandItem
                                value={searchValue}
                                onSelect={() => handleCreateNew(searchValue.trim())}
                                className="flex items-center gap-3 py-3 px-4 cursor-pointer text-primary"
                              >
                                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Plus size={14} />
                                </div>
                                <div>
                                  <span className="font-medium">Create "</span>
                                  <span className="font-bold">{searchValue.trim()}</span>
                                  <span className="font-medium">" as new client</span>
                                </div>
                              </CommandItem>
                            </CommandGroup>
                          </>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {form.formState.errors.clientName && (
                  <p className="text-xs font-medium text-rose-500 mt-1.5">{form.formState.errors.clientName.message}</p>
                )}
              </div>

              {isCreatingNew && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-muted/40 border border-border">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-muted-foreground">Email</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Email (optional)" className="h-10 rounded-xl border-2 border-border text-sm" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-muted-foreground">Phone</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Phone (optional)" className="h-10 rounded-xl border-2 border-border text-sm" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] font-medium text-foreground">Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className="w-full pl-3 text-left font-normal h-12 rounded-xl border-2 border-border mt-2"
                            >
                              {field.value ? format(field.value, "MMM d, yyyy") : <span className="text-muted-foreground">Pick date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
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
                      <FormLabel className="text-[13px] font-medium text-foreground">Time</FormLabel>
                      <FormControl>
                        <div className="relative mt-2">
                          <Input type="time" {...field} className="h-12 rounded-xl border-2 border-border" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="tag"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-medium text-foreground">Session type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 rounded-xl border-2 border-border mt-2">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl border-none shadow-2xl">
                        {APPOINTMENT_TAGS.map(tag => (
                          <SelectItem key={tag} value={tag} className="rounded-lg">{tag}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <details className="group">
                <summary className="text-xs font-medium text-muted-foreground/80 cursor-pointer hover:text-foreground/80 transition-colors select-none list-none flex items-center gap-2">
                  <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
                  Add notes (optional)
                </summary>
                <div className="mt-4 space-y-4">
                  <FormField
                    control={form.control}
                    name="goal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[13px] font-medium text-foreground">Goal</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="What did you want to achieve?" className="h-12 rounded-xl border-2 border-border mt-2" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="issue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[13px] font-medium text-foreground">Issue</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="What was the presenting concern?" className="h-12 rounded-xl border-2 border-border mt-2" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </details>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl font-medium text-sm mt-6"
                disabled={submitting}
              >
                {submitting ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Starting…</>
                ) : (
                  <><Zap size={18} className="mr-2" /> Start session</>
                )}
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
