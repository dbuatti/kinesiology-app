// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    const { category } = await req.json();

    const prompt = `
      You are an expert in Functional Neurological Health (FNH), Applied Kinesiology, and Traditional Chinese Medicine (TCM).
      Generate a complex clinical scenario question for a practitioner.
      
      Category: ${category || 'General Clinical Reasoning'}
      
      The question should be in JSON format with the following structure:
      {
        "question": "The clinical scenario and question...",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "The correct option",
        "explanation": "A detailed explanation of the neurological or clinical reasoning behind the answer."
      }
      
      Focus on:
      - Muscle testing relationships
      - Cranial nerve interactions
      - Primitive reflex integration
      - TCM meridian and emotion connections
      - Brainstem nuclei and motor tone
      
      Make it challenging and clinically relevant.
    `;

    console.log("[generate-quiz-question] Calling Gemini 2.5 Flash...");
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, response_mime_type: "application/json" }
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Gemini Error');

    let resultText = data.candidates[0].content.parts[0].text.trim();
    if (resultText.includes('```')) {
      resultText = resultText.replace(/```json\n?/, '').replace(/```\n?/, '').trim();
    }

    return new Response(resultText, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("[generate-quiz-question] Error", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})