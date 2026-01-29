import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Client, Appointment } from "@/types/crm";

// --- Type Definitions for Supabase Data ---

interface SupabaseClient {
  id: string;
  name: string;
  pronouns: string | null;
  born: string | null; // ISO string from DB
  suburbs: string[] | null; // Array from DB
  email: string | null;
  phone: string | null;
  occupation: string | null;
  marital_status: string | null;
  children: string | null;
  chatgpt_url: string | null;
  journal: string | null;
  created_at: string;
}

interface SupabaseAppointment {
  id: string;
  client_id: string;
  date: string; // ISO string from DB
  tag: string | null;
  status: string | null;
  notes: string | null;
  goal: string | null;
  issue: string | null;
  acupoints: string | null;
  name: string | null;
  additional_notes: string | null;
  priority_pattern: string | null;
  session_north_star: string | null;
  modes_balances: string | null;
  journal: string | null;
  notion_link: string | null;
  bolt_score: number | null;
  heart_rate: number | null;
  breath_rate: number | null;
  coherence_score: number | null;
  sagittal_plane_notes: string | null;
  frontal_plane_notes: string | null;
  transverse_plane_notes: string | null;
  hydrated: boolean | null;
  hydration_notes: string | null;
  emotion_mode: string | null;
  emotion_primary_selection: string | null;
  emotion_secondary_selection: string | null;
  emotion_notes: string | null;
  clients?: { id: string; name: string } | null;
}

interface Procedure {
  id: string;
  name: string;
  description: string;
  target_count: number;
  current_count: number;
  icon: string;
  enabled: boolean;
  created_at: string;
}

// --- Data Mapping Functions ---

const mapClientFromSupabase = (c: SupabaseClient): Client => ({
  id: c.id,
  name: c.name,
  pronouns: c.pronouns || '',
  born: c.born ? new Date(c.born) : (null as unknown as Date), // Handle null date of birth
  suburb: c.suburbs || [],
  email: c.email || '',
  phone: c.phone || '',
  occupation: c.occupation || undefined,
  marital_status: c.marital_status || undefined,
  children: c.children || undefined,
  chatgpt_url: c.chatgpt_url || undefined,
  journal: c.journal || undefined,
  created_at: c.created_at,
});

const mapAppointmentFromSupabase = (a: SupabaseAppointment): Appointment & { clients?: { id: string; name: string } } => ({
  id: a.id,
  display_id: a.display_id || undefined,
  clientId: a.client_id,
  date: new Date(a.date),
  tag: (a.tag || 'Kinesiology') as Appointment['tag'],
  status: (a.status || 'Scheduled') as Appointment['status'],
  notes: a.notes || '',
  goal: a.goal || '',
  issue: a.issue || '',
  acupoints: a.acupoints || '',
  name: a.name || undefined,
  additional_notes: a.additional_notes || undefined,
  priority_pattern: a.priority_pattern || undefined,
  session_north_star: a.session_north_star || undefined,
  modes_balances: a.modes_balances || undefined,
  journal: a.journal || undefined,
  notion_link: a.notion_link || undefined,
  bolt_score: a.bolt_score,
  heart_rate: a.heart_rate,
  breath_rate: a.breath_rate,
  coherence_score: a.coherence_score,
  sagittal_plane_notes: a.sagittal_plane_notes,
  frontal_plane_notes: a.frontal_plane_notes,
  transverse_plane_notes: a.transverse_plane_notes,
  hydrated: a.hydrated,
  hydration_notes: a.hydration_notes,
  emotion_mode: a.emotion_mode,
  emotion_primary_selection: a.emotion_primary_selection,
  emotion_secondary_selection: a.emotion_secondary_selection,
  emotion_notes: a.emotion_notes,
  clients: a.clients || undefined,
});

// --- React Query Hooks ---

// 1. Clients
export const useClients = () => {
  return useQuery<Client[], Error>({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return (data as SupabaseClient[]).map(mapClientFromSupabase);
    },
  });
};

export const useClient = (clientId: string | undefined) => {
  return useQuery<Client, Error>({
    queryKey: ['clients', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (error) throw error;
      return mapClientFromSupabase(data as SupabaseClient);
    },
    enabled: !!clientId,
  });
};

// 2. Appointments
export const useAppointments = () => {
  return useQuery<(Appointment & { clients: { id: string; name: string } })[], Error>({
    queryKey: ['appointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clients (
            id,
            name
          )
        `)
        .order('date', { ascending: false });

      if (error) throw error;
      return (data as SupabaseAppointment[]).map(mapAppointmentFromSupabase) as (Appointment & { clients: { id: string; name: string } })[];
    },
  });
};

export const useAppointment = (appointmentId: string | undefined) => {
  return useQuery<Appointment & { clients: { id: string; name: string } }, Error>({
    queryKey: ['appointments', appointmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clients (
            id,
            name
          )
        `)
        .eq('id', appointmentId)
        .single();

      if (error) throw error;
      return mapAppointmentFromSupabase(data as SupabaseAppointment) as Appointment & { clients: { id: string; name: string } };
    },
    enabled: !!appointmentId,
  });
};

// 3. Procedures
export const useProcedures = () => {
  return useQuery<Procedure[], Error>({
    queryKey: ['procedures'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('procedures')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Procedure[];
    },
  });
};

// 4. Mutations (Add/Update/Delete)

export const useClientMutation = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      if (payload.id) {
        // Update
        const { error } = await supabase
          .from("clients")
          .update(payload)
          .eq('id', payload.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase.from("clients").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingAppointments'] });
      onSuccessCallback?.();
    },
  });
};

export const useAppointmentMutation = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      if (payload.id) {
        // Update
        const { error } = await supabase
          .from("appointments")
          .update(payload)
          .eq('id', payload.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase.from("appointments").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingAppointments'] });
      if (variables.client_id) {
        queryClient.invalidateQueries({ queryKey: ['clients', variables.client_id] });
      }
      queryClient.invalidateQueries({ queryKey: ['procedures'] }); // Appointments trigger procedure updates
      onSuccessCallback?.();
    },
  });
};

export const useProcedureMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      if (payload.id) {
        // Update
        const { error } = await supabase
          .from("procedures")
          .update(payload)
          .eq('id', payload.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase.from("procedures").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedures'] });
    },
  });
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', clientId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingAppointments'] });
    },
  });
};

export const useDeleteAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (appointmentId: string) => {
      const { error } = await supabase.from('appointments').delete().eq('id', appointmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['procedures'] }); // Deleting an appointment might affect procedure counts
    },
  });
};

// 5. Dashboard Stats (Combined Query)
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const [
        { count: clientCount }, 
        { count: appCount }, 
        { data: recentClientsData }, 
        { data: allAppsData }
      ] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact', head: true }),
        supabase.from('appointments').select('*', { count: 'exact', head: true }),
        supabase.from('clients').select('*').order('created_at', { ascending: false }).limit(4),
        supabase.from('appointments').select('date').order('date', { ascending: true })
      ]);

      return {
        stats: { 
          clients: clientCount || 0, 
          appointments: appCount || 0 
        },
        recentClients: (recentClientsData as SupabaseClient[] || []).map(mapClientFromSupabase),
        allAppointmentsDates: (allAppsData || []).map(a => a.date),
      };
    },
  });
};

// 6. Upcoming Appointments
export const useUpcomingAppointments = () => {
  return useQuery<(Appointment & { clients: { id: string; name: string } })[], Error>({
    queryKey: ['upcomingAppointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          name,
          display_id,
          date,
          tag,
          clients (
            id,
            name
          )
        `)
        .gte("date", new Date().toISOString())
        .order("date", { ascending: true })
        .limit(5);

      if (error) throw error;

      return (data as SupabaseAppointment[]).map(mapAppointmentFromSupabase) as (Appointment & { clients: { id: string; name: string } })[];
    },
  });
};