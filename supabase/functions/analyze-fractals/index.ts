// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
}

serve(async (req) => {
  const functionName = "analyze-fractals";
  console.log(`[${functionName}] Request received`);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY')
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error("No authorization header provided.");
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) throw new Error("Invalid or expired user session.");
    
    const userId = user.id;

    const { data: backlog, error: fetchError } = await supabase
      .from('identity_backlog')
      .select('id, content, type, parent_id')
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (fetchError) throw fetchError;

    if (!backlog || backlog.length < 2) {
      return new Response(JSON.stringify({ success: true, suggestions: [], message: "Not enough items to analyze." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const backlogList = backlog.map(b => `ID: ${b.id} | Content: ${b.content} | Current Parent: ${b.parent_id || 'None'}`).join('\n');

    const prompt = `Act as a master clinical supervisor and pattern recognition expert in Kinesiology.
    Analyze the following list of limiting beliefs and identities. 
    
    YOUR TASK:
    1. Identify "Fractal Relationships". Look for 3-tier hierarchies:
       - Tier 3 (Grandparent): Core Existential Drivers (e.g., "The Unworthy Soul").
       - Tier 2 (Parent): Behavioral Identities (e.g., "The People Pleaser").
       - Tier 1 (Child): Specific Limiting Beliefs (e.g., "I am a burden").
    2. Identify the "Primary Primary" — the single most overarching root pattern (Grandparent) that drives everything else in this list.
    
    LIST TO ANALYZE:
    ${backlogList}
    
    Return a JSON object:
    {
      "suggestions": [
        { 
          "child_id": "uuid", 
          "parent_id": "uuid", 
          "reasoning": "1-sentence explanation of the fractal link" 
        }
      ],
      "primary_primary": {
        "id": "uuid",
        "reasoning": "Why this is the ultimate root pattern (Grandparent) of the entire system"
      }
    }
    
    Return ONLY the JSON.`;

    let resultText = "";

    if (openRouterKey) {
      console.log(`[${functionName}] Using OpenRouter (qwen3-coder)...`);
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "qwen/qwen3-coder:free",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" }
        })
      });
      
      const data = await response.json();
      if (!response.ok) {
        console.error(`[${functionName}] OpenRouter Error:`, data);
        throw new Error(data.error?.message || 'OpenRouter API Error');
      }
      
      if (!data.choices || !data.choices[0]) {
        console.error(`[${functionName}] Unexpected OpenRouter Response:`, data);
        throw new Error('AI returned an empty or invalid response.');
      }
      
      resultText = data.choices[0].message.content;
    } else if (geminiKey) {
      console.log(`[${functionName}] Using Gemini (2.5-flash)...`);
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, response_mime_type: "application/json" }
        }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        console.error(`[${functionName}] Gemini API Error:`, data);
        throw new Error(data.error?.message || 'Gemini API Error');
      }

      if (!data.candidates || !data.candidates[0]) {
        console.error(`[${functionName}] Unexpected Gemini Response:`, data);
        throw new Error('AI returned an empty or invalid response.');
      }

      resultText = data.candidates[0].content.parts[0].text;
    } else {
      throw new Error("No AI API keys configured. Please set OPENROUTER_API_KEY or GEMINI_API_KEY.");
    }

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