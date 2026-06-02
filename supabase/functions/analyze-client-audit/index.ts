// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
}

serve(async (req) => {
  const functionName = "analyze-client-audit";
  console.log(`[${functionName}] Request received`);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { clients } = await req.json();
    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    
    if (!geminiKey) {
      console.error(`[${functionName}] Error: GEMINI_API_KEY is missing.`);
      throw new Error("GEMINI_API_KEY is missing.");
    }

    const clientSummary = clients.map(c => ({
      name: c.name,
      rate: c.standard_rate ?? 50,
      sessions: c.session_count ?? 0,
      lastSeen: c.lastSeenDate ? new Date(c.lastSeenDate).toLocaleDateString() : 'Never'
    }));

    const prompt = `Act as a master business consultant and clinical supervisor for a Functional Neurology and Kinesiology practice.
    Analyze the following client list (including their current standard rates, total session counts, and last seen dates) to generate a highly personalized, strategic pricing and transition roadmap.
    
    CLIENT DATA:
    ${JSON.stringify(clientSummary, null, 2)}
    
    Your goal is to help the practitioner transition their practice toward a standard rate of $150/session by the end of 2027, while maintaining high client retention and delivering exceptional value.
    
    Return the result as a JSON object with the following structure:
    {
      "summary": "A 2-3 sentence high-level strategic summary of their current practice health and the primary focus for rate transition.",
      "roadmap": [
        {
          "phase": "Phase 1: Q3 2026 (or appropriate timeline)",
          "title": "Action Title",
          "description": "Specific, actionable advice mentioning 1-2 real client names from the list who fit this phase (e.g., low-rate clients who are highly active)."
        },
        {
          "phase": "Phase 2: Q1 2027",
          "title": "Action Title",
          "description": "Specific advice mentioning real client names from the list who fit this phase (e.g., mid-rate clients ready for standardization)."
        },
        {
          "phase": "Phase 3: Q3 2027",
          "title": "Action Title",
          "description": "Specific advice mentioning real client names from the list who fit this phase (e.g., premium transition or package offers)."
        },
        {
          "phase": "Phase 4: Q4 2027",
          "title": "Target Goal Achieved",
          "description": "Final consolidation to the $150 standard rate for all remaining clients."
        }
      ],
      "strategies": [
        {
          "title": "Strategy Title",
          "description": "A highly specific value-add strategy tailored to their client base (e.g., packaging, support, or specialized protocols)."
        }
      ]
    }
    
    Ensure you mention actual client names from the provided list in the roadmap descriptions to make the advice feel incredibly personalized and real.
    Return ONLY the JSON.`;

    console.log(`[${functionName}] Calling Gemini API (2.5-flash)...`);
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          response_mime_type: "application/json"
        }
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