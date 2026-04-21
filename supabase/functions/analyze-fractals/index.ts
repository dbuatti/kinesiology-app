// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    
    if (!geminiKey) throw new Error("GEMINI_API_KEY is missing.");

    const supabase = createClient(supabaseUrl, supabaseKey)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error("No authorization header provided.");
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) throw new Error("Invalid or expired user session.");
    
    const userId = user.id;

    const { data: backlog } = await supabase
      .from('identity_backlog')
      .select('id, content, type, parent_id')
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (!backlog || backlog.length < 2) {
      return new Response(JSON.stringify({ success: true, suggestions: [], message: "Not enough items to analyze." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const backlogList = backlog.map(b => `ID: ${b.id} | Content: ${b.content} | Current Parent: ${b.parent_id || 'None'}`).join('\n');

    const prompt = `Act as a master clinical supervisor and pattern recognition expert in Kinesiology.
    Analyze the following list of limiting beliefs and identities. 
    
    YOUR TASK:
    1. Identify "Fractal Relationships". Look for multi-tier hierarchies (Child -> Parent -> Grandparent).
    2. Identify the "Primary Primary" — the single most overarching root pattern that drives everything else in this list.
    
    LIST TO ANALYZE:
    ${backlogList}
    
    Return a JSON object:
    {
      "suggestions": [
        { 
          "child_id": "uuid", 
          "parent_id": "uuid", 
          "reasoning": "1-sentence explanation" 
        }
      ],
      "primary_primary": {
        "id": "uuid",
        "reasoning": "Why this is the ultimate root pattern"
      }
    }
    
    Return ONLY the JSON.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, response_mime_type: "application/json" }
      }),
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || 'Gemini Error');

    let resultText = data.candidates[0].content.parts[0].text.trim();
    if (resultText.includes('```')) {
      resultText = resultText.replace(/```json\n?/, '').replace(/```\n?/, '').trim();
    }

    return new Response(resultText, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})