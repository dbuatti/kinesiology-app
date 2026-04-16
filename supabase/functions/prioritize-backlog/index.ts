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

    // 0. Get User ID from Auth Header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error("No authorization header provided.");
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      console.error(`[${functionName}] Auth Error:`, userError);
      throw new Error("Invalid or expired user session.");
    }
    
    const userId = user.id;
    console.log(`[${functionName}] Processing for user: ${userId}`);

    // 1. Fetch context: Last 50 journal entries for THIS user
    const { data: reflections } = await supabase
      .from('practitioner_reflections')
      .select('content, category, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    // 2. Fetch targets: All pending backlog items for THIS user
    const { data: backlog } = await supabase
      .from('identity_backlog')
      .select('id, content, type, status')
      .eq('user_id', userId);

    if (!backlog || backlog.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No items to prioritize." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const journalContext = reflections?.map(r => `[${r.category}]: ${r.content}`).join('\n\n');
    const backlogList = backlog?.map(b => `[${b.status}] ID: ${b.id} | Type: ${b.type} | Content: ${b.content}`).join('\n');

    const prompt = `Act as a master clinical supervisor and pattern recognition expert.
    Analyze my journal entries and my current "Identity Map" to perform a DEEP DISCOVERY.
    
    YOUR TASKS:
    1. RE-PRIORITIZE: Rank existing "pending" items (1-100) based on their "Keystone" potential.
    2. RE-CATEGORIZE: Ensure every item is in the correct tool (goal, identity, or belief).
    3. DISCOVER: Identify 3-5 NEW items that are missing from the map but are clearly recurring "Shadow" themes or "Target" identities in the journal.
    4. DEDUPLICATE: If you see two items that are essentially the same, give the redundant one a score of 0 and set the reasoning to "Redundant duplicate".
    
    LOGIC:
    - "goal" -> IDENTITY ALIGNMENT. Use this for specific outcomes, income targets, or desired future states (e.g., "Making $1500/week", "The Vital Leader").
    - "identity" -> IDENTITY SHIFTING. Use this for CURRENT problematic versions of self or "stuck" roles (e.g., "The Procrastinator", "The Invisible One").
    - "belief" -> LIMITING BELIEFS. Core "I am..." statements representing a struggle or rule (e.g., "I am a burden").
    
    CRITICAL RULE:
    Any item that mentions money, income, revenue, or a specific numerical result (e.g., "$1000/week", "10 clients") MUST be categorized as a "goal". Even if phrased as "I am making...", it is a target outcome for Identity Alignment.
    
    JOURNAL CONTEXT:
    ${journalContext}
    
    CURRENT MAP:
    ${backlogList}
    
    Return ONLY a JSON object. Do not include any markdown formatting or explanation.
    Structure:
    {
      "rankings": [
        { "id": "uuid", "type": "goal|identity|belief", "score": 85, "reasoning": "...", "polarity_insight": "..." }
      ],
      "new_suggestions": [
        { "content": "...", "type": "goal|identity|belief", "reasoning": "Why this is a pattern", "polarity_insight": "The shadow/target" }
      ]
    }`;

    console.log(`[${functionName}] Calling Gemini 2.5 Flash...`);
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1, // Lower temperature for more consistent logic
          response_mime_type: "application/json"
        }
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      const errorMsg = data.error?.message || 'Unknown AI Error';
      throw new Error(`Gemini API Error: ${errorMsg}`);
    }

    let resultText = data.candidates[0].content.parts[0].text.trim();
    console.log(`[${functionName}] Raw AI Response:`, resultText);
    
    // Sanitize: Remove markdown code blocks if present
    if (resultText.includes('```')) {
      resultText = resultText.replace(/```json\n?/, '').replace(/```\n?/, '').trim();
    }

    const parsed = JSON.parse(resultText);

    // 3. Update existing items in parallel
    if (parsed.rankings && parsed.rankings.length > 0) {
      console.log(`[${functionName}] Updating ${parsed.rankings.length} items...`);
      const updatePromises = parsed.rankings.map(rank => {
        const originalItem = backlog.find(b => b.id === rank.id);
        let finalType = String(rank.type).toLowerCase().trim();

        return supabase
          .from('identity_backlog')
          .update({
            type: finalType,
            priority_score: rank.score,
            priority_reasoning: rank.reasoning,
            polarity_insight: rank.polarity_insight
          })
          .eq('id', rank.id)
          .eq('user_id', userId);
      });
      await Promise.all(updatePromises);
    }

    // 4. Insert new suggestions
    if (parsed.new_suggestions && parsed.new_suggestions.length > 0) {
      console.log(`[${functionName}] Inserting ${parsed.new_suggestions.length} new suggestions...`);
      const inserts = parsed.new_suggestions.map(s => ({
        user_id: userId,
        content: s.content,
        type: String(s.type).toLowerCase().trim(),
        status: 'suggested',
        priority_reasoning: s.reasoning,
        polarity_insight: s.polarity_insight
      }));

      await supabase.from('identity_backlog').insert(inserts);
    }

    console.log(`[${functionName}] Success.`);
    return new Response(JSON.stringify({ 
      success: true, 
      updated: parsed.rankings?.length || 0,
      new: parsed.new_suggestions?.length || 0 
    }), {
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