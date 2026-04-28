import { supabase } from "@/integrations/supabase/client";

const { data: response } = await supabase
  .from('identity_alignment_sessions')
  .select('*');

console.log('API Response:', response);