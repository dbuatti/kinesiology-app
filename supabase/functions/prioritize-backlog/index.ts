// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
}

serve(async (req) => {
  const functionName = "prioritize-backlog";
  console.log(`[${functionName}] Request received`);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    
    if (!geminiKey) throw new Error("GEMINI_API_KEY is missing.");

    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Fetch context: Last 50 journal entries
    const { data: reflections } = await supabase
      .from('practitioner_reflections')
      .select('content, category, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    // 2. Fetch targets: All pending backlog items
    const { data: backlog } = await supabase
      .from('identity_backlog')
      .select('id, content, type')
      .eq('status', 'pending');

    if (!backlog || backlog.length === 0) {
      return new Response(JSON.stringify({ message: "No pending items to prioritize." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const journalContext = reflections?.map(r => `[${r.category} - ${r.created_at}]: ${r.content}`).join('\n\n');
    const backlogList = backlog.map(b => `ID: ${b.id} | Type: ${b.type} | Content: ${b.content}`).join('\n');

    const prompt = `Act as a high-level clinical supervisor and psychological strategist. 
    I am a Kinesiology practitioner working on my own identity shifts and blocks.
    
    YOUR TASK:
    Analyze my journal entries to understand my core personality, my larger goals, and the recurring patterns (blocks) I face.
    Then, look at my "Identity Backlog" and rank the items from most important to least important.
    
    PRIORITIZATION LOGIC:
    1. Keystone Blocks: Identify "small" blocks or identities that are actually the foundation for larger issues. Prioritize these highest (Score 90-100).
    2. Goal Alignment: Prioritize identities that directly bridge the gap between my current state and my stated long-term goals (Score 70-89).
    3. Symptomatic Items: Lower priority for items that are just surface-level expressions of deeper patterns (Score 1-69).
    
    JOURNAL CONTEXT:
    ${journalContext}
    
    BACKLOG ITEMS TO RANK:
    ${backlogList}
    
    Return the result as a JSON object with a key "rankings" containing an array of objects:
    - "id": The ID of the backlog item.
    - "score": A priority score from 1 to 100.
    - "reasoning": A brief (1 sentence) clinical explanation of why this item is ranked this way based on my journal history.
    
    Return ONLY the JSON.`;

    console.log(`[${functionName}] Calling Gemini 2.5 Flash...`);
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          temperature: 0.3,
          response_mime_type: "application/json"
        }
      }),
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || 'Gemini Error');

    const resultText = data.candidates[0].content.parts[0].text.trim();
    const parsed = JSON.parse(resultText);

    // 3. Update the database with new scores
    for (const rank of parsed.rankings) {
      await supabase
        .from('identity_backlog')
        .update({ 
          priority_score: rank.score,
          priority_reasoning: rank.reasoning
        })
        .eq('id', rank.id);
    }

    return new Response(JSON.stringify({ success: true, count: parsed.rankings.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error(`[prioritize-backlog] Error:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})