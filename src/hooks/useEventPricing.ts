import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EventPricing {
  calcom_event_type_id: number;
  slug: string | null;
  label: string;
  duration_minutes: number | null;
  price: number;
  currency: string;
  send_payment_link: boolean;
  active: boolean;
}

/**
 * Reads editable appointment prices from the `event_pricing` table.
 * Returns the rows plus a `priceFor(eventTypeId)` helper for the booking dialogs.
 */
export const useEventPricing = () => {
  const query = useQuery({
    queryKey: ["event-pricing"],
    queryFn: async (): Promise<EventPricing[]> => {
      const { data, error } = await supabase
        .from("event_pricing")
        .select("*")
        .order("label", { ascending: true });
      if (error) throw error;
      return (data || []) as EventPricing[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const priceFor = (eventTypeId: string | number): number | undefined => {
    const id = typeof eventTypeId === "string" ? parseInt(eventTypeId, 10) : eventTypeId;
    return query.data?.find((r) => r.calcom_event_type_id === id)?.price;
  };

  return { ...query, pricing: query.data ?? [], priceFor };
};
