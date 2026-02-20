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
import { Loader2 } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { Client } from "@/types/crm";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address").or(z.string().length(0)),
  phone: z.string().optional(),
  pronouns: z.string().optional(),
  born: z.string().optional(),
  suburb: z.string().optional(), // Handled as comma-separated string in form
  occupation: z.string().optional(),
  marital_status: z.string().optional(),
  children: z.string().optional(),
  chatgpt_url: z.string().url("Must be a valid URL").or(z.string().length(0)).optional(),
  journal: z.string().optional(),
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
      suburb: initialData?.suburbs?.join(", ") || "", // Fixed: changed suburb to suburbs
      occupation: initialData?.occupation || "",
      marital_status: initialData?.marital_status || "",
      children: initialData?.children || "",
      chatgpt_url: initialData?.chatgpt_url || "",
      journal: initialData?.journal || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!session?.user?.id) return;
    setSubmitting(true);

    try {
      // Convert comma-separated string back to array, filtering out empty strings
      const suburbsArray = values.suburb 
        ? values.suburb.split(",").map(s => s.trim()).filter(s => s.length > 0) 
        : [];

      const payload = {
        user_id: session.user.id,
        name: values.name,
        email: values.email || null,
        phone: values.phone || null,
        pronouns: values.pronouns || null,
        born: values.born ? new Date(values.born).toISOString() : null,
        suburbs: suburbsArray, // Use the correct column name and array format
        occupation: values.occupation || null,
        marital_status: values.marital_status || null,
        children: values.children || null,
        chatgpt_url: values.chatgpt_url || null,
        journal: values.journal || null,
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
          name="suburb"
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="occupation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Occupation</FormLabel>
                <FormControl>
                  <Input placeholder="Graphic Designer" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="marital_status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marital Status</FormLabel>
                <FormControl>
                  <Input placeholder="Single, Married, etc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="children"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Children</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 2 (ages 5, 8)" {...field} />
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
              <FormLabel>History & Notes (Journal)</FormLabel>
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

        <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData?.id ? "Update Client" : "Add Client"}
        </Button>
      </form>
    </Form>
  );
};

export default ClientForm;