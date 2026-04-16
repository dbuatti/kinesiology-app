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
    const { type, data } = await req.json();
    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    
    if (!geminiKey) throw new Error("GEMINI_API_KEY is missing.");

    let contextDescription = "";
    if (type === 'shifting') {
      contextDescription = `IDENTITY SHIFTING SESSION:
      Problem: ${data.problem}
      Identity: ${data.identity}
      Loop Responses: ${data.loopResponses?.join(' -> ')}
      Final Awareness: ${data.feelingsNow}`;
    } else if (type === 'alignment') {
      contextDescription = `IDENTITY ALIGNMENT SESSION:
      Goal: ${data.goal}
      Target Identity: ${data.targetIdentity}
      Reconsolidation Data: ${JSON.stringify(data.reconsolidationData)}`;
    } else {
      contextDescription = `LIMITING BELIEF SESSION:
      Problem: ${data.problem}
      Limiting Belief: I am ${data.limitingBelief}
      Positive Belief: I am ${data.positiveBelief}
      Dissolve Log: ${JSON.stringify(data.dissolveLog)}`;
    }

    const prompt = `Act as a master clinical supervisor. Analyze this identity session data to find DEEPER, hidden patterns that the practitioner might have missed.
    
    YOUR TASK:
    1. Identify "The Shadow behind the Shadow" — what is the even deeper identity or belief driving this whole pattern?
    2. Suggest 2-3 NEW items for the practitioner's Identity Map.
    
    LOGIC:
    - "identity" -> A current problematic version of self (e.g., "The Invisible Child").
    - "belief" -> A core "I am..." statement (e.g., "I am only safe when I am small").
    - "goal" -> A future target identity (e.g., "The Unapologetic Leader").
    
    SESSION CONTEXT:
    ${contextDescription}
    
    Return the result as a JSON object with a key "suggestions" containing an array of objects:
    - "content": The text of the insight.
    - "type": "identity", "belief", or "goal".
    - "reasoning": A 1-sentence explanation of why you extracted this from the session data.
    
    Return ONLY the JSON.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
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

    const resData = await response.json()
    if (!response.ok) throw new Error(resData.error?.message || 'Gemini Error');

    const resultText = resData.candidates[0].content.parts[0].text.trim();
    const parsed = JSON.parse(resultText);

    return new Response(JSON.stringify({ suggestions: parsed.suggestions || [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})