// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const { problem, emotion, feltSense, goal, type = 'problem' } = body;

    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) {
      throw new Error('Missing GEMINI_API_KEY in Supabase Secrets');
    }

    let prompt = "";
    
    if (type === 'target') {
      prompt = `
        You are an expert in the "Identity Shifting" and "Identity Alignment" frameworks. 
        Based on the following user goal, suggest 3-4 "Target Identities" (empowered archetypes or personas) that would naturally and effortlessly achieve this goal.
        These should be concise, evocative, and empowering labels (e.g., "The Vital Leader", "The Grounded Healer", "The Sovereign Creator", "The Intuitive Guide").

        Goal: ${goal || problem}
        
        Return ONLY a JSON array of strings. No other text.
      `;
    } else {
      prompt = `
        You are an expert in the "Identity Shifting" framework. 
        Based on the following user input, suggest 3-4 "Problem Identities" (archetypes or personas) that the user might be inhabiting.
        These should be concise, evocative labels (e.g., "The Perfectionist", "The Invisible One", "The Fixer", "The Martyr").

        Problem: ${problem}
        Emotion: ${emotion || 'Not specified'}
        Physical Sensations (Felt Sense): ${feltSense || 'Not specified'}

        Return ONLY a JSON array of strings. No other text.
      `;
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json",
        }
      }),
    })

    const data = await response.json()
    const content = data.candidates[0].content.parts[0].text.trim()

    let suggestions = []
    try {
      suggestions = JSON.parse(content)
    } catch (e) {
      suggestions = content.replace(/[\[\]"]/g, '').split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .slice(0, 4)
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})