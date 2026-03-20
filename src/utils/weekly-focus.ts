import { supabase } from "@/integrations/supabase/client";

export async function setWeeklyFocus(items: string[]) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('weekly_focus')
    .upsert({
      user_id: user.id,
      items: items,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

  if (error) throw error;
}

export async function getWeeklyFocus(): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('weekly_focus')
    .select('items')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !data) return [];
  return data.items as string[];
}