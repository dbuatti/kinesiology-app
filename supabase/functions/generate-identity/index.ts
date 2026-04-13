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
    const { problem, emotion, feltSense } = await req.json()

    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) {
      throw new Error('Missing GEMINI_API_KEY')
    }

    const prompt = `
      You are an expert in the "Identity Shifting" framework. 
      Based on the following user input, suggest 3-4 "Identities" (archetypes or personas) that the user might be inhabiting.
      These should be concise, evocative labels (e.g., "The Perfectionist", "The Invisible One", "The Fixer", "The Martyr").

      Problem: ${problem}
      Emotion: ${emotion || 'Not specified'}
      Physical Sensations (Felt Sense): ${feltSense || 'Not specified'}

      Return ONLY a JSON array of strings. No other text.
    `

    console.log("[generate-identity] Request received for Gemini", { problem, emotion, feltSense });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
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
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
          responseMimeType: "application/json",
        }
      }),
    })

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[generate-identity] Gemini API error:", errorData);
      throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json()
    const content = data.candidates[0].content.parts[0].text.trim()
    
    console.log("[generate-identity] Gemini response content:", content);

    let suggestions = []
    try {
      suggestions = JSON.parse(content)
    } catch (e) {
      console.warn("[generate-identity] Failed to parse Gemini response as JSON, attempting fallback parsing");
      // Fallback: split by lines or commas if it's not valid JSON
      suggestions = content.replace(/[\[\]"]/g, '').split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0 && s.length < 50)
        .slice(0, 4)
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error("[generate-identity] Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
