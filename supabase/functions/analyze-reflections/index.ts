// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
}

const normalizeType = (type: string): string => {
  const t = String(type).toLowerCase().trim();
  if (t === 'goal' || t === 'alignment') return 'alignment';
  if (t === 'identity' || t === 'shifting') return 'shifting';
  if (t === 'belief') return 'belief';
  return t; 
};

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
    if (!geminiKey) throw new Error("GEMINI_API_KEY is missing.");

    const prompt = `Act as a clinical supervisor for a Kinesiology practitioner. 
    Analyze the following journal entry and extract specific items for the practitioner's "Identity Sandbox".
    
    Return the result as a JSON object with a key "extractions" containing an array of objects with:
    - "content": The text of the insight.
    - "type": Exactly one of: "belief", "shifting", "alignment", "felt_sense", or "question".
    - "status": "pending"
    
    TEXT TO ANALYZE:
    "${content}"`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, response_mime_type: "application/json" }
      }),
    })

    const data = await response.json()
    if (!response.ok) throw new Error('AI Service Error');

    let resultText = data.candidates[0].content.parts[0].text.trim();
    if (resultText.includes('```')) {
      resultText = resultText.replace(/```json\n?/, '').replace(/```\n?/, '').trim();
    }

    const parsed = JSON.parse(resultText);
    if (parsed.extractions) {
      parsed.extractions = parsed.extractions.map(e => ({
        ...e,
        type: normalizeType(e.type)
      }));
    }

    return new Response(JSON.stringify({ extractions: parsed.extractions || [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})