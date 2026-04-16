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
      return new Response(JSON.stringify({ success: true, message: "No pending items to prioritize." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const journalContext = reflections?.map(r => `[${r.category}]: ${r.content}`).join('\n\n');
    const backlogList = backlog.map(b => `ID: ${b.id} | Current Type: ${b.type} | Content: ${b.content}`).join('\n');

    const prompt = `Act as a master clinical supervisor. Analyze my journal entries and my "Identity Backlog" to perform a DEEP POLARITY ANALYSIS and RE-CATEGORIZATION.
    
    CATEGORIZATION LOGIC:
    - "goal" -> IDENTITY ALIGNMENT: A desired future state or outcome (e.g., "Stable income", "Belief in Kinesiology").
    - "identity" -> IDENTITY SHIFTING: A current problematic version of self (e.g., "The Perfectionist", "The Skeptic").
    - "belief" -> LIMITING BELIEFS: A core "I am..." statement (e.g., "I am not good enough").
    
    FOR EACH BACKLOG ITEM:
    1. Re-evaluate the "type" based on the logic above.
    2. Rank it (1-100) based on its "Keystone" potential.
    3. Identify its "Polarity Insight" (1 sentence).
    
    JOURNAL CONTEXT:
    ${journalContext}
    
    BACKLOG ITEMS:
    ${backlogList}
    
    Return ONLY a JSON object with this structure:
    {
      "rankings": [
        { "id": "uuid", "type": "goal|identity|belief", "score": 85, "reasoning": "...", "polarity_insight": "..." }
      ]
    }`;

    console.log(`[${functionName}] Calling Gemini for analysis...`);
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          temperature: 0.2,
          response_mime_type: "application/json"
        }
      }),
    })

    const data = await response.json()
    if (!response.ok) throw new Error(`Gemini API Error: ${data.error?.message || 'Unknown'}`);

    const resultText = data.candidates[0].content.parts[0].text.trim();
    let parsed = JSON.parse(resultText);

    console.log(`[${functionName}] Updating ${parsed.rankings.length} items...`);

    // 3. Update the database
    const updates = parsed.rankings.map(rank => 
      supabase
        .from('identity_backlog')
        .update({ 
          type: rank.type,
          priority_score: rank.score,
          priority_reasoning: rank.reasoning,
          polarity_insight: rank.polarity_insight
        })
        .eq('id', rank.id)
    );

    await Promise.all(updates);

    return new Response(JSON.stringify({ success: true, count: parsed.rankings.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error(`[${functionName}] CRITICAL ERROR:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})