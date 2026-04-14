// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
}

const FALLBACK_PROBLEM_SUGGESTIONS = [
  "The Perfectionist",
  "The Invisible One",
  "The Fixer",
  "The Martyr",
  "The Imposter",
  "The Caretaker"
];

const FALLBACK_TARGET_SUGGESTIONS = [
  "The Grounded Healer",
  "The Sovereign Creator",
  "The Intuitive Guide",
  "The Vital Leader",
  "The Present Observer",
  "The Empowered Self"
];

const FALLBACK_LIMITING_BELIEFS = [
  "I am not good enough",
  "I am a failure",
  "I am unlovable",
  "I am a burden",
  "I am powerless",
  "I am invisible"
];

const FALLBACK_POSITIVE_BELIEFS = [
  "I am capable and worthy",
  "I am enough exactly as I am",
  "I am safe and supported",
  "I am powerful and creative",
  "I am seen and valued",
  "I am resilient and strong"
];

const FALLBACK_SENSE_SUGGESTIONS = [
  "Tightness in the chest",
  "Knot in the stomach",
  "Lump in the throat",
  "Pressure behind the eyes",
  "Heaviness in the shoulders",
  "Coldness in the hands"
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json();
    const { problem, emotion, feltSense, goal, type = 'problem' } = body;

    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) {
      throw new Error('Missing API Key');
    }

    let prompt = "";
    let fallback = FALLBACK_PROBLEM_SUGGESTIONS;

    if (type === 'target') {
      prompt = `Suggest 3-4 "Target Identities" for the goal: ${goal || problem}. Return ONLY a JSON array of strings.`;
      fallback = FALLBACK_TARGET_SUGGESTIONS;
    } else if (type === 'limiting_belief') {
      prompt = `Analyze the following problem and physical sensation to extract the underlying "Limiting Identity" or "Limiting Belief". The belief should start with "I am..." and represent the version of self that is struggling.
      Problem: "${problem}"
      Physical Sensation (Felt Sense): "${feltSense}"
      Return ONLY a JSON array of 3-4 strings.`;
      fallback = FALLBACK_LIMITING_BELIEFS;
    } else if (type === 'positive_belief') {
      prompt = `Suggest 3-4 "Positive Beliefs" (starting with "I am...") that would represent a shifted, empowered identity in response to this problem: "${problem}". Return ONLY a JSON array of strings.`;
      fallback = FALLBACK_POSITIVE_BELIEFS;
    } else if (type === 'felt_sense') {
      prompt = `Suggest 3-4 common physical sensations (felt senses) that someone might experience when facing this problem: "${problem}". Return ONLY a JSON array of strings.`;
      fallback = FALLBACK_SENSE_SUGGESTIONS;
    } else {
      prompt = `Suggest 3-4 "Problem Identities" for: Problem: ${problem}, Emotion: ${emotion}, Sense: ${feltSense}. Return ONLY a JSON array of strings.`;
      fallback = FALLBACK_PROBLEM_SUGGESTIONS;
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7 }
      }),
    })

    const data = await response.json()
    
    if (!response.ok) {
      console.warn("[generate-identity] API Error or Quota Exceeded. Using fallbacks.", data.error?.message);
      return new Response(JSON.stringify({ 
        suggestions: fallback,
        isFallback: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const content = data.candidates[0].content.parts[0].text.trim()
    let suggestions = []
    try {
      const jsonMatch = content.match(/\[.*\]/s);
      suggestions = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch (e) {
      suggestions = fallback;
    }

    return new Response(JSON.stringify({ suggestions, isFallback: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ 
      suggestions: FALLBACK_PROBLEM_SUGGESTIONS,
      error: error.message 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})