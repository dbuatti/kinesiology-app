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
    const body = await req.json();
    const { problem, feltSense, goal, type = 'identity' } = body;

    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) throw new Error('Missing API Key');

    let prompt = "";
    
    if (type === 'target' || type === 'goal') {
      prompt = `Suggest 4 "Target Identities" for the goal or outcome: "${goal || problem}".
      These should be empowering, archetypal labels for the IDENTITY ALIGNMENT tool (e.g., "The Sovereign Creator", "The Vital Leader").
      Focus on who the person is BECOMING to achieve the goal.
      Return ONLY a JSON array of strings.`;
    } else if (type === 'limiting_belief' || type === 'belief') {
      prompt = `Suggest 4 "Limiting Beliefs" based on this problem: "${problem}" and sensation: "${feltSense}". 
      The beliefs MUST start with "I am..." and represent the core story holding the pattern in place (e.g., "I am a burden", "I am not safe to be seen"). 
      Return ONLY a JSON array of strings.`;
    } else {
      prompt = `Suggest 4 "Problem Identities" for the problem: "${problem}". 
      Use archetypal, descriptive labels for the IDENTITY SHIFTING tool (e.g., "The Perfectionist", "The Invisible One", "The Fixer"). 
      Focus on the version of self the person is LETTING GO of.
      Return ONLY a JSON array of strings.`;
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
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
    if (!response.ok) throw new Error('AI Error');

    let content = data.candidates[0].content.parts[0].text.trim();
    
    if (content.includes('```')) {
      content = content.replace(/```json\n?/, '').replace(/```\n?/, '').trim();
    }

    const suggestions = JSON.parse(content);

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ suggestions: ["The Perfectionist", "The Fixer", "The Observer"], error: error.message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})