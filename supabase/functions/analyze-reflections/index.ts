// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { content } = await req.json();
    
    if (!content || content.trim().length < 10) {
      return new Response(JSON.stringify({ error: 'Reflection text is too short to analyze. Please write a bit more.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) {
      return new Response(JSON.stringify({ 
        error: 'GEMINI_API_KEY is missing.', 
        details: 'Please add GEMINI_API_KEY to your Supabase Project Secrets.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = `Act as a clinical supervisor for a Kinesiology practitioner. 
    Analyze the following reflection text and extract:
    1. "Limiting Beliefs" (I am...)
    2. "Stuck Identities" (The ...)
    3. "Target Identities/Goals"
    4. "Meetup Questions" - Specific clinical, technical, or philosophical questions the practitioner should ask their teacher or mentor.
    
    RULES:
    - Limiting Beliefs must start with "I am..." and represent a struggle.
    - Stuck Identities should be labels for a current problematic state.
    - Meetup Questions should be clear, concise questions for a mentor.
    - Return the result as a JSON object with a key "extractions" containing an array of objects with "content", "type" (belief, identity, goal, or question), and "status" (default to 'pending').
    
    TEXT TO ANALYZE:
    "${content}"`;

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
    
    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'AI Service Error' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resultText = data.candidates[0].content.parts[0].text.trim();
    const parsed = JSON.parse(resultText);

    return new Response(JSON.stringify({ extractions: parsed.extractions || [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})