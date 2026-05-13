// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
}

const normalizeType = (type: string): string => {
  const t = String(type).toLowerCase().trim();
  if (t === 'goal' || t === 'alignment') return 'alignment';
  if (t === 'identity' || t === 'shifting') return 'shifting';
  if (t === 'belief') return 'belief';
  return t; 
};

serve(async (req) => {
  const functionName = "analyze-reflections";
  console.log(`[${functionName}] Request received`);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { content } = await req.json();
    
    if (!content || content.trim().length < 10) {
      console.warn(`[${functionName}] Warning: Content too short.`);
      return new Response(JSON.stringify({ error: 'Journal text is too short to analyze.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) {
      console.error(`[${functionName}] Error: GEMINI_API_KEY is missing.`);
      throw new Error("GEMINI_API_KEY is missing.");
    }

    const prompt = `Act as a master clinical supervisor for a Functional Neurology and Kinesiology practitioner. 
    Analyze the following raw journal entry and extract specific items for the practitioner's growth.
    
    CRITICAL EXTRACTION RULES:
    1. MEETUP QUESTIONS: Extract any technical, procedural, or theoretical questions that should be asked to a teacher (e.g., "How to check X?", "Why did Y happen?"). Type: "question".
    2. STUCK IDENTITIES: Identify the "version of self" the practitioner was being during the session (e.g., "The People Pleaser", "The Overwhelmed Student", "The Doubter"). Type: "shifting".
    3. LIMITING BELIEFS: Extract core assumptions or "must/should" statements (e.g., "I must make the client feel good", "I'm not ready for complex cases"). Type: "belief".
    4. CLINICAL DOUBTS: Identify specific technical gaps (e.g., "Unclear on TLR vs STNR"). Type: "question".
    
    Return the result as a JSON object with a key "extractions" containing an array of objects:
    {
      "content": "The specific insight or question text",
      "type": "shifting", "belief", "alignment", "felt_sense", or "question",
      "status": "pending"
    }
    
    TEXT TO ANALYZE:
    "${content}"`;

    console.log(`[${functionName}] Calling Gemini API (2.5-flash)...`);
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, response_mime_type: "application/json" }
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      console.error(`[${functionName}] Gemini API Error:`, data);
      throw new Error(data.error?.message || 'AI Service Error');
    }

    if (!data.candidates || !data.candidates[0]) {
      console.error(`[${functionName}] Unexpected Gemini Response:`, data);
      throw new Error('AI returned an empty or invalid response.');
    }

    let resultText = data.candidates[0].content.parts[0].text.trim();
    if (resultText.includes('```')) {
      resultText = resultText.replace(/```json\n?/, '').replace(/```\n?/, '').trim();
    }

    const parsed = JSON.parse(resultText);
    if (parsed.extractions) {
      parsed.extractions = parsed.extractions.map(e => ({
        ...e,
        type: normalizeType(e.type)
      }));
    }

    console.log(`[${functionName}] Analysis complete.`);

    return new Response(JSON.stringify({ extractions: parsed.extractions || [] }), {
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