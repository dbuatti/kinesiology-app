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

    const prompt = `Act as a master clinical supervisor and psychological strategist. 
    I am a Kinesiology practitioner working on my own identity shifts and blocks.
    
    YOUR TASK:
    Analyze my journal entries to understand my core personality, my larger goals, and the recurring patterns (blocks) I face.
    Then, look at my "Identity Backlog" and perform a DEEP POLARITY ANALYSIS.
    
    POLARITY LOGIC:
    Every "Goal" has a "Shadow" (the identity that fears the goal).
    Every "Problem Identity" has a "Target" (the version of self that is free).
    
    FOR EACH BACKLOG ITEM:
    1. Rank it (1-100) based on its "Keystone" potential.
    2. Identify its "Polarity Insight":
       - If it's a GOAL: What is the likely "Shadow Identity" or "Limiting Belief" blocking it?
       - If it's an IDENTITY/BELIEF: What is the "Target Identity" waiting on the other side?
    
    JOURNAL CONTEXT:
    ${journalContext}
    
    BACKLOG ITEMS TO ANALYZE:
    ${backlogList}
    
    Return the result as a JSON object with a key "rankings" containing an array of objects:
    - "id": The ID of the backlog item.
    - "score": A priority score from 1 to 100.
    - "reasoning": A brief (1 sentence) clinical explanation.
    - "polarity_insight": A 1-sentence insight about the "Shadow" or "Target" of this item.
    
    Return ONLY the JSON.`;

    console.log(`[${functionName}] Calling Gemini 2.5 Flash for Polarity Analysis...`);
    
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

    // 3. Update the database with new scores and polarity insights
    for (const rank of parsed.rankings) {
      await supabase
        .from('identity_backlog')
        .update({ 
          priority_score: rank.score,
          priority_reasoning: rank.reasoning,
          polarity_insight: rank.polarity_insight
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