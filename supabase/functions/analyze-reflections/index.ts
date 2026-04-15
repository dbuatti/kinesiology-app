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
    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    
    if (!geminiKey) {
      throw new Error('Missing GEMINI_API_KEY in Supabase Secrets.');
    }

    const prompt = `Act as a clinical supervisor and linguistic analyst for a Kinesiology practitioner. 
    Analyze the following reflection text and extract potential "Limiting Beliefs" or "Stuck Identities" that the practitioner or their client might be experiencing.
    
    RULES:
    1. Limiting Beliefs must start with "I am..." (e.g., "I am not good enough").
    2. Identities should be labels (e.g., "The Perfectionist", "The Invisible One").
    3. Only extract items that are clearly implied or stated in the text.
    4. Return ONLY a JSON array of objects with "content" and "type" (either 'belief' or 'identity').
    
    TEXT TO ANALYZE:
    "${content}"`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          temperature: 0.4,
          response_mime_type: "application/json"
        }
      }),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Gemini API Error');
    }

    const resultText = data.candidates[0].content.parts[0].text.trim();
    const extractions = JSON.parse(resultText);

    return new Response(JSON.stringify({ extractions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})