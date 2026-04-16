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

    // 2. Fetch targets: All backlog items (pending, suggested, and integrated)
    const { data: backlog } = await supabase
      .from('identity_backlog')
      .select('id, content, type, status');

    const journalContext = reflections?.map(r => `[${r.category}]: ${r.content}`).join('\n\n');
    const backlogList = backlog?.map(b => `[${b.status}] ${b.type}: ${b.content}`).join('\n');

    const prompt = `Act as a master clinical supervisor and pattern recognition expert. 
    Analyze my journal entries and my current "Identity Map" to perform a DEEP DISCOVERY.
    
    YOUR TASKS:
    1. RE-PRIORITIZE: Rank existing "pending" items (1-100) based on their "Keystone" potential.
    2. RE-CATEGORIZE: Ensure every item is in the correct tool (goal, identity, or belief).
    3. DISCOVER: Identify 3-5 NEW items that are missing from the map but are clearly recurring "Shadow" themes or "Target" identities in the journal.
    
    LOGIC:
    - "goal" -> IDENTITY ALIGNMENT (Future state)
    - "identity" -> IDENTITY SHIFTING (Current block)
    - "belief" -> LIMITING BELIEFS (Core "I am..." story)
    
    JOURNAL CONTEXT:
    ${journalContext}
    
    CURRENT MAP:
    ${backlogList}
    
    Return ONLY a JSON object with this structure:
    {
      "rankings": [
        { "id": "uuid", "type": "goal|identity|belief", "score": 85, "reasoning": "...", "polarity_insight": "..." }
      ],
      "new_suggestions": [
        { "content": "...", "type": "goal|identity|belief", "reasoning": "Why this is a pattern", "polarity_insight": "The shadow/target" }
      ]
    }`;

    console.log(`[${functionName}] Calling Gemini for Deep Discovery...`);
    
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
    if (!response.ok) throw new Error(`Gemini API Error: ${data.error?.message || 'Unknown'}`);

    const resultText = data.candidates[0].content.parts[0].text.trim();
    let parsed = JSON.parse(resultText);

    // 3. Update existing items
    if (parsed.rankings) {
      for (const rank of parsed.rankings) {
        await supabase
          .from('identity_backlog')
          .update({ 
            type: rank.type,
            priority_score: rank.score,
            priority_reasoning: rank.reasoning,
            polarity_insight: rank.polarity_insight
          })
          .eq('id', rank.id);
      }
    }

    // 4. Insert new suggestions
    if (parsed.new_suggestions) {
      const { data: { user } } = await supabase.auth.getUser();
      const inserts = parsed.new_suggestions.map(s => ({
        user_id: user.id,
        content: s.content,
        type: s.type,
        status: 'suggested',
        priority_reasoning: s.reasoning,
        polarity_insight: s.polarity_insight
      }));

      if (inserts.length > 0) {
        await supabase.from('identity_backlog').insert(inserts);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      updated: parsed.rankings?.length || 0,
      new: parsed.new_suggestions?.length || 0 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error(`[${functionName}] Error:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})