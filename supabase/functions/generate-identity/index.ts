// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
}

serve(async (req) => {
  const functionName = "generate-identity";
  console.log(`[${functionName}] Request received`);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json();
    const { problem, feltSense, goal, type = 'identity' } = body;

    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) {
      console.error(`[${functionName}] Error: GEMINI_API_KEY is missing.`);
      throw new Error('Missing API Key');
    }

    let prompt = "";
    if (type === 'target') {
      prompt = `Suggest 4 "Target Identities" for someone with this goal: "${goal}". Return ONLY a JSON array of strings.`;
    } else if (type === 'limiting_belief') {
      prompt = `Suggest 4 "Limiting Beliefs" (starting with "I am...") for someone with this problem: "${problem}". Return ONLY a JSON array of strings.`;
    } else if (type === 'positive_belief') {
      prompt = `Suggest 4 "Positive Beliefs" (starting with "I am...") that are the antidote to this problem: "${problem}". Return ONLY a JSON array of strings.`;
    } else if (type === 'felt_sense') {
      prompt = `Suggest 4 "Felt Senses" (physical locations/sensations) for someone with this problem: "${problem}". Return ONLY a JSON array of strings.`;
    } else {
      prompt = `Suggest 4 "Stuck Identities" for someone with this problem: "${problem}" and felt sense: "${feltSense}". Return ONLY a JSON array of strings.`;
    }

    console.log(`[${functionName}] Calling Gemini API (2.5-flash)...`);
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          response_mime_type: "application/json"
        }
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      console.error(`[${functionName}] Gemini API Error:`, data);
      throw new Error('AI Error');
    }

    let content = data.candidates[0].content.parts[0].text.trim();
    if (content.includes('```')) {
      content = content.replace(/```json\n?/, '').replace(/```\n?/, '').trim();
    }

    const suggestions = JSON.parse(content);
    console.log(`[${functionName}] Suggestions generated: ${suggestions?.length || 0}`);

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error(`[${functionName}] Critical Error:`, error.message);
    return new Response(JSON.stringify({ suggestions: [], error: error.message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})