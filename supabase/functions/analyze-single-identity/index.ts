// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
}

const normalizeType = (type: string): 'alignment' | 'shifting' | 'belief' => {
  const t = String(type).toLowerCase().trim();
  if (t === 'goal' || t === 'alignment') return 'alignment';
  if (t === 'identity' || t === 'shifting') return 'shifting';
  return 'belief';
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { content } = await req.json();
    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    
    if (!geminiKey) throw new Error("GEMINI_API_KEY is missing.");

    const prompt = `Act as a master clinical supervisor. Analyze this specific identity statement and categorize it into the correct clinical tool.
    
    STATEMENT: "${content}"
    
    LOGIC:
    - "alignment" -> IDENTITY ALIGNMENT. Use this for specific outcomes, income targets, or desired future states (e.g., "Making $1500/week", "The Vital Leader").
    - "shifting" -> IDENTITY SHIFTING. Use this for CURRENT problematic versions of self or "stuck" roles (e.g., "The Procrastinator", "The Invisible One").
    - "belief" -> LIMITING BELIEFS. Core "I am..." statements representing a struggle or rule (e.g., "I am a burden").
    
    Return the result as a JSON object:
    {
      "type": "alignment|shifting|belief",
      "reasoning": "A 1-sentence clinical explanation",
      "polarity_insight": "A 1-sentence insight into the shadow or target of this pattern"
    }
    
    Return ONLY the JSON.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, response_mime_type: "application/json" }
      }),
    })

    const resData = await response.json()
    if (!response.ok) throw new Error(resData.error?.message || 'Gemini Error');

    let resultText = resData.candidates[0].content.parts[0].text.trim();
    if (resultText.includes('```')) {
      resultText = resultText.replace(/```json\n?/, '').replace(/```\n?/, '').trim();
    }

    const parsed = JSON.parse(resultText);
    parsed.type = normalizeType(parsed.type);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})