import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const openAiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAiKey) {
      throw new Error('OPENAI_API_KEY is not set');
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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a clinical education assistant for functional neurology practitioners.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    const data = await response.json();
    const quizData = JSON.parse(data.choices[0].message.content);

    console.log("[generate-quiz-question] Generated question", { quizData });

    return new Response(JSON.stringify(quizData), {
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
