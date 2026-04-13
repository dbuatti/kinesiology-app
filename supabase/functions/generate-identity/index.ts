import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { problem, emotion, feltSense } = await req.json()

    const openAiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAiKey) {
      throw new Error('Missing OPENAI_API_KEY')
    }

    const prompt = `
      You are an expert in the "Identity Shifting" framework. 
      Based on the following user input, suggest 3-4 "Identities" (archetypes or personas) that the user might be inhabiting.
      These should be concise, evocative labels (e.g., "The Perfectionist", "The Invisible One", "The Fixer", "The Martyr").

      Problem: ${problem}
      Emotion: ${emotion || 'Not specified'}
      Physical Sensations (Felt Sense): ${feltSense || 'Not specified'}

      Return ONLY a JSON array of strings.
    `

    console.log("[generate-identity] Request received", { problem, emotion, feltSense });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that suggests identity labels based on psychological and emotional context.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[generate-identity] OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json()
    const content = data.choices[0].message.content.trim()
    
    console.log("[generate-identity] AI response content:", content);

    // Try to parse the JSON array from the response
    let suggestions = []
    try {
      // Remove markdown code blocks if present
      const jsonString = content.replace(/```json|```/g, '').trim()
      suggestions = JSON.parse(jsonString)
    } catch (e) {
      console.warn("[generate-identity] Failed to parse AI response as JSON, attempting fallback parsing");
      // Fallback: split by lines or commas if it's not valid JSON
      suggestions = content.split('\n')
        .map(s => s.replace(/^[0-9.-]+\s*/, '').trim())
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
