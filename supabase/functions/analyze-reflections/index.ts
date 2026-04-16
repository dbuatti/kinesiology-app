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
      return new Response(JSON.stringify({ error: 'Journal text is too short to analyze.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY is missing.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = `Act as a clinical supervisor for a Kinesiology practitioner. 
    Analyze the following journal entry and extract specific items for the practitioner's "Identity Sandbox".
    
    CRITICAL LOGIC:
    1. "identity" -> Maps to IDENTITY SHIFTING. These are labels for a CURRENT problematic state or a version of self the practitioner wants to LET GO of (e.g., "The Perfectionist", "The Martyr", "The Fixer").
    2. "goal" -> Maps to IDENTITY ALIGNMENT. These are DESIRED future states or target identities the practitioner wants to MOVE INTO to achieve a goal (e.g., "The Sovereign Creator", "The Vital Leader", "The Confident Speaker"). Look for phrases like "I want to be", "I am becoming", or "My goal is".
    3. "belief" -> Maps to LIMITING BELIEFS. Core "I am..." statements representing a struggle or rule (e.g., "I am not good enough", "I am a burden").
    
    Also extract:
    4. "felt_sense" -> Physical sensations or somatic markers mentioned.
    5. "question" -> Specific technical or clinical questions for a meetup.
    
    Return the result as a JSON object with a key "extractions" containing an array of objects with:
    - "content": The text of the insight.
    - "type": Exactly one of: "belief", "identity", "goal", "felt_sense", or "question".
    - "status": "pending"
    
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