// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
}

serve(async (req) => {
  const functionName = "analyze-single-identity";
  console.log(`[${functionName}] Request received`);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { content } = await req.json();
    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    
    if (!geminiKey) {
      console.error(`[${functionName}] Error: GEMINI_API_KEY is missing.`);
      throw new Error("GEMINI_API_KEY is missing.");
    }

    const prompt = `Act as a master clinical supervisor. Analyze this identity statement and categorize it.
    
    Return a JSON object:
    {
      "type": "shifting", "alignment", or "belief",
      "reasoning": "1-sentence explanation",
      "polarity_insight": "1-sentence on Energy IN vs OUT"
    }
    
    STATEMENT:
    "${content}"`;

    console.log(`[${functionName}] Calling Gemini API (2.5-flash)...`);
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, response_mime_type: "application/json" }
      }),
    })

    const resData = await response.json()
    if (!response.ok) {
      console.error(`[${functionName}] Gemini API Error:`, resData);
      throw new Error(resData.error?.message || 'Gemini Error');
    }

    let resultText = resData.candidates[0].content.parts[0].text.trim();
    if (resultText.includes('```')) {
      resultText = resultText.replace(/```json\n?/, '').replace(/```\n?/, '').trim();
    }

    console.log(`[${functionName}] Analysis complete.`);

    return new Response(resultText, {
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