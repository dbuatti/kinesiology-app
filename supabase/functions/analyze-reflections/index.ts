// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
}

serve(async (req) => {
  const functionName = "analyze-reflections";
  console.log(`[${functionName}] Request received`);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { content } = await req.json();
    
    if (!content || content.trim().length < 10) {
      console.error(`[${functionName}] Error: Content too short`);
      return new Response(JSON.stringify({ error: 'Journal text is too short to analyze.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) {
      console.error(`[${functionName}] Error: GEMINI_API_KEY is missing`);
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY is missing.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = `Act as a clinical supervisor for a Kinesiology practitioner. 
    Analyze the following journal entry and extract specific items for the practitioner's "Identity Sandbox".
    
    CATEGORIZATION RULES:
    1. "belief" -> Maps to LIMITING BELIEFS tool. Must start with "I am..." and represent a struggle or a core truth (e.g., "I am not good enough", "I am connected to gratitude").
    2. "identity" -> Maps to IDENTITY SHIFTING tool. Labels for a current problematic state or a metaphorical archetype (e.g., "The Perfectionist", "The Horse").
    3. "goal" -> Maps to IDENTITY ALIGNMENT tool. Desired future states or target identities (e.g., "The Grounded Healer", "The Sovereign Creator").
    4. "felt_sense" -> Maps to SOMATIC TRACKING. Physical sensations mentioned (e.g., "Tightness in stomach", "Skin pulling down").
    5. "question" -> Maps to MEETUP LOG. Specific clinical or technical questions for a mentor.
    
    Return the result as a JSON object with a key "extractions" containing an array of objects with:
    - "content": The text of the insight.
    - "type": Exactly one of: "belief", "identity", "goal", "felt_sense", or "question".
    - "status": "pending"
    
    TEXT TO ANALYZE:
    "${content}"`;

    console.log(`[${functionName}] Calling Gemini 2.5 Flash API...`);
    
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
      console.error(`[${functionName}] Gemini API Error:`, JSON.stringify(data));
      return new Response(JSON.stringify({ 
        error: 'AI Service Error', 
        details: data.error?.message || 'Unknown Gemini error' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resultText = data.candidates[0].content.parts[0].text.trim();
    console.log(`[${functionName}] Gemini Response:`, resultText);
    
    const parsed = JSON.parse(resultText);

    return new Response(JSON.stringify({ extractions: parsed.extractions || [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error(`[${functionName}] Critical Error:`, error.message);
    return new Response(JSON.stringify({ error: 'Internal Server Error', message: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})