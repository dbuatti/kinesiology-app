// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log("[generate-identity] Function invoked");

  try {
    const body = await req.json();
    const { problem, emotion, feltSense, goal, type = 'problem' } = body;

    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) {
      console.error("[generate-identity] Error: Missing GEMINI_API_KEY");
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

    console.log("[generate-identity] Sending request to Gemini API");

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
          // Note: responseMimeType is supported in newer models but we'll handle the parsing manually to be safe
        }
      }),
    })

    const data = await response.json()
    
    if (!response.ok) {
      console.error("[generate-identity] Gemini API Error:", JSON.stringify(data));
      throw new Error(data.error?.message || "Gemini API Error");
    }

    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      console.error("[generate-identity] Unexpected Gemini response structure:", JSON.stringify(data));
      throw new Error("Invalid response from AI provider");
    }

    const content = data.candidates[0].content.parts[0].text.trim()
    console.log("[generate-identity] Raw AI content:", content);

    let suggestions = []
    try {
      // Try to find a JSON array in the text if it's wrapped in markdown or other text
      const jsonMatch = content.match(/\[.*\]/s);
      const jsonString = jsonMatch ? jsonMatch[0] : content;
      suggestions = JSON.parse(jsonString);
    } catch (e) {
      console.warn("[generate-identity] JSON parse failed, falling back to regex split");
      suggestions = content.replace(/[\[\]"]/g, '').split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .slice(0, 4)
    }

    console.log("[generate-identity] Final suggestions:", suggestions);

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error("[generate-identity] Critical Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})