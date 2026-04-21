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

    // Fetch all pending items in the backlog
    const { data: backlog } = await supabase
      .from('identity_backlog')
      .select('id, content, type')
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (!backlog || backlog.length < 2) {
      return new Response(JSON.stringify({ success: true, suggestions: [], message: "Not enough items to analyze." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const backlogList = backlog.map(b => `ID: ${b.id} | Content: ${b.content}`).join('\n');

    const prompt = `Act as a master clinical supervisor and pattern recognition expert in Kinesiology.
    Analyze the following list of limiting beliefs and identities. 
    
    YOUR TASK:
    Identify "Fractal Relationships". A fractal relationship exists when a specific belief or identity is a subset or a manifestation of a larger, more overarching "Parent" pattern.
    
    Example:
    - Parent: "The Invisible One" (Overarching Identity)
    - Child: "I am a burden" (Specific Belief)
    - Child: "I should be more affordable" (Specific Rule)
    
    LIST TO ANALYZE:
    ${backlogList}
    
    Return a JSON object with a key "suggestions" containing an array of objects:
    {
      "suggestions": [
        { 
          "child_id": "uuid", 
          "parent_id": "uuid", 
          "reasoning": "1-sentence explanation of why the child belongs under this parent" 
        }
      ]
    }
    
    RULES:
    1. Only suggest relationships that are semantically strong.
    2. Do NOT create circular references (A cannot be a parent of B if B is already a parent of A).
    3. An item can only have ONE parent.
    
    Return ONLY the JSON.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
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

    const parsed = JSON.parse(resultText);

    return new Response(JSON.stringify({ suggestions: parsed.suggestions || [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})