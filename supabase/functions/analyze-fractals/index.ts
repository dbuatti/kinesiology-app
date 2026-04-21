// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
}

serve(async (req) => {
  const functionName = "analyze-fractals";
  console.log(`[${functionName}] Request received`);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    
    if (!geminiKey) {
      console.error(`[${functionName}] Error: GEMINI_API_KEY is missing.`);
      throw new Error("GEMINI_API_KEY is missing.");
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error(`[${functionName}] Error: No authorization header provided.`);
      throw new Error("No authorization header provided.");
    }
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      console.error(`[${functionName}] Error: Invalid or expired user session.`, { userError });
      throw new Error("Invalid or expired user session.");
    }
    
    const userId = user.id;
    console.log(`[${functionName}] Authenticated user: ${userId}`);

    const { data: backlog, error: fetchError } = await supabase
      .from('identity_backlog')
      .select('id, content, type, parent_id')
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (fetchError) {
      console.error(`[${functionName}] Error fetching backlog:`, fetchError);
      throw fetchError;
    }

    if (!backlog || backlog.length < 2) {
      console.log(`[${functionName}] Not enough items to analyze. Count: ${backlog?.length || 0}`);
      return new Response(JSON.stringify({ success: true, suggestions: [], message: "Not enough items to analyze." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const backlogList = backlog.map(b => `ID: ${b.id} | Content: ${b.content} | Current Parent: ${b.parent_id || 'None'}`).join('\n');
    console.log(`[${functionName}] Analyzing ${backlog.length} items`);

    const prompt = `Act as a master clinical supervisor and pattern recognition expert in Kinesiology.
    Analyze the following list of limiting beliefs and identities. 
    
    YOUR TASK:
    1. Identify "Fractal Relationships". Look for 3-tier hierarchies:
       - Tier 3 (Grandparent): Core Existential Drivers (e.g., "The Unworthy Soul").
       - Tier 2 (Parent): Behavioral Identities (e.g., "The People Pleaser").
       - Tier 1 (Child): Specific Limiting Beliefs (e.g., "I am a burden").
    2. Identify the "Primary Primary" — the single most overarching root pattern (Grandparent) that drives everything else in this list.
    
    LIST TO ANALYZE:
    ${backlogList}
    
    Return a JSON object:
    {
      "suggestions": [
        { 
          "child_id": "uuid", 
          "parent_id": "uuid", 
          "reasoning": "1-sentence explanation of the fractal link" 
        }
      ],
      "primary_primary": {
        "id": "uuid",
        "reasoning": "Why this is the ultimate root pattern (Grandparent) of the entire system"
      }
    }
    
    Return ONLY the JSON.`;

    console.log(`[${functionName}] Calling Gemini API...`);
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, response_mime_type: "application/json" }
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      console.error(`[${functionName}] Gemini API Error:`, data);
      throw new Error(data.error?.message || 'Gemini Error');
    }

    let resultText = data.candidates[0].content.parts[0].text.trim();
    if (resultText.includes('```')) {
      resultText = resultText.replace(/```json\n?/, '').replace(/```\n?/, '').trim();
    }

    console.log(`[${functionName}] Analysis complete. Suggestions found: ${JSON.parse(resultText).suggestions?.length || 0}`);

    return new Response(resultText, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error(`[${functionName}] Critical Error:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})