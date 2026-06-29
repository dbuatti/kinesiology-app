// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
}

serve(async (req) => {
  const functionName = "analyze-belief-transcript";
  console.log(`[${functionName}] Request received`);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { transcript } = await req.json();
    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    
    if (!geminiKey) {
      console.error(`[${functionName}] Error: GEMINI_API_KEY is missing.`);
      throw new Error("GEMINI_API_KEY is missing.");
    }

    const prompt = `You are a master clinical supervisor analyzing a limiting belief session transcript.

Session transcript:
${transcript}

Analyze this session and return a JSON object with these three keys:
1. "tools" — an array of objects with "name" and "reasoning" fields. Suggest other identity work tools from the PEACE framework (Preliminary, Ease, Align, Correct, Embed) that would complement this work, such as: identity shifting, identity alignment, affirmations, visualization, inner child work, timeline therapy, parts work, emotional freedom technique (tapping), somatic experiencing, NLP pattern interrupt, cognitive reframing, belief chaining, or other relevant approaches. Explain briefly why each tool would help.
2. "identities" — an array of objects with "name" and "reasoning" fields. Suggest 3-5 positive new identities the client could shift toward as an antidote to the limiting beliefs shown in this transcript (e.g., "I am worthy", "I am capable", "I am enough").
3. "patterns" — an array of objects with "name" and "evidence" fields. Identify 2-4 recurring limiting belief patterns or themes visible in this transcript beyond the primary belief being worked on.

Return ONLY the JSON object with these three keys. Each value must be an array.`;

    console.log(`[${functionName}] Calling Gemini API (2.5-flash)...`);
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

    const data = await response.json()
    if (!response.ok) {
      console.error(`[${functionName}] Gemini API Error:`, data);
      throw new Error(data.error?.message || 'Gemini Error');
    }

    let resultText = data.candidates[0].content.parts[0].text.trim();
    if (resultText.includes('```')) {
      resultText = resultText.replace(/```json\n?/, '').replace(/```\n?/, '').trim();
    }

    const parsed = JSON.parse(resultText);
    console.log(`[${functionName}] Analysis complete: ${parsed.tools?.length || 0} tools, ${parsed.identities?.length || 0} identities, ${parsed.patterns?.length || 0} patterns`);

    return new Response(JSON.stringify({ 
      tools: parsed.tools || [], 
      identities: parsed.identities || [], 
      patterns: parsed.patterns || [] 
    }), {
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
