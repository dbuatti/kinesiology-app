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
import { Loader2, CheckCircle2, Sparkles, Heart } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { Client } from "@/types/crm";

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
});

interface PublicOnboardingFormProps {
  clientId: string;
  initialData: Partial<Client>;
  onSuccess: () => void;
}

const PublicOnboardingForm = ({ clientId, initialData, onSuccess }: PublicOnboardingFormProps) => {
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
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setSubmitting(true);

    try {
      const suburbsArray = values.suburbs 
        ? values.suburbs.split(",").map(s => s.trim()).filter(s => s.length > 0) 
        : [];

      const payload = {
        name: values.name,
        email: values.email || null,
        phone: values.phone || null,
        pronouns: values.pronouns || null,
        born: values.born ? new Date(values.born).toISOString() : null,
        suburbs: suburbsArray,
        occupation: values.occupation || null,
        marital_status: values.marital_status || null,
        children: values.children || null,
      };

      const { error } = await supabase
        .from("clients")
        .update(payload)
        .eq('id', clientId);

      if (error) throw error;

      showSuccess("Thank you! Your details have been updated.");
      onSuccess();
    } catch (error: any) {
      showError("Something went wrong. Please try again or contact your practitioner.");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-bold">Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your Name" {...field} className="h-12 rounded-xl border-slate-200" />
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
                <FormLabel className="text-sm font-bold">Pronouns</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. They/Them, She/Her" {...field} className="h-12 rounded-xl border-slate-200" />
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
                <FormLabel className="text-sm font-bold">Email Address</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="email@example.com" {...field} className="h-12 rounded-xl border-slate-200" />
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
                <FormLabel className="text-sm font-bold">Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="0400 000 000" {...field} className="h-12 rounded-xl border-slate-200" />
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
                <FormLabel className="text-sm font-bold">Date of Birth</FormLabel>
                <FormControl>
                  <Input type="date" {...field} className="h-12 rounded-xl border-slate-200" />
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
                <FormLabel className="text-sm font-bold">Suburb(s)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Brunswick, Fitzroy" {...field} className="h-12 rounded-xl border-slate-200" />
                </FormControl>
                <FormDescription className="text-[10px]">Comma separated if multiple</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="occupation"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-bold">Occupation</FormLabel>
                <FormControl>
                  <Input placeholder="What do you do?" {...field} className="h-12 rounded-xl border-slate-200" />
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
                <FormLabel className="text-sm font-bold">Marital Status</FormLabel>
                <FormControl>
                  <Input placeholder="Single, Married, etc." {...field} className="h-12 rounded-xl border-slate-200" />
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
              <FormLabel className="text-sm font-bold">Children</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 2 children (ages 4 and 7)" {...field} className="h-12 rounded-xl border-slate-200" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pt-6">
          <Button 
            type="submit" 
            className="w-full bg-indigo-600 hover:bg-indigo-700 h-14 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100" 
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Saving Details...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5" />
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