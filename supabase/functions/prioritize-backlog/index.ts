// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
}

serve(async (req) => {
  const functionName = "prioritize-backlog";
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

    const { data: backlog } = await supabase
      .from('identity_backlog')
      .select('id, content, type')
      .eq('user_id', userId)
      .eq('status', 'pending');

    const { data: journal } = await supabase
      .from('practitioner_reflections')
      .select('content')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    const backlogText = backlog?.map(b => `ID: ${b.id} | ${b.content}`).join('\n') || "None";
    const journalText = journal?.map(j => j.content).join('\n\n') || "None";

    const prompt = `Act as a master clinical supervisor. Analyze the practitioner's journal and identity backlog to prioritize the map.
    
    Return a JSON object with:
    1. "rankings": Array of { "id": "uuid", "score": 1-100, "reasoning": "1-sentence" }
    2. "new_suggestions": Array of { "content": "text", "type": "identity/belief/goal", "reasoning": "1-sentence" }
    
    BACKLOG:
    ${backlogText}
    
    RECENT JOURNAL:
    ${journalText}`;

    let resultText = "";

    if (openRouterKey) {
      console.log(`[${functionName}] Using OpenRouter...`);
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
      throw new Error("No AI API keys configured.");
    }

    if (resultText.includes('```')) {
      resultText = resultText.replace(/```json\n?/, '').replace(/```\n?/, '').trim();
    }

    const parsed = JSON.parse(resultText);

    if (parsed.rankings) {
      for (const rank of parsed.rankings) {
        await supabase.from('identity_backlog').update({ priority_score: rank.score, priority_reasoning: rank.reasoning }).eq('id', rank.id);
      }
    }

    if (parsed.new_suggestions) {
      const inserts = parsed.new_suggestions.map(s => ({
        user_id: userId,
        content: s.content,
        type: s.type === 'goal' ? 'alignment' : s.type === 'identity' ? 'shifting' : 'belief',
        status: 'suggested',
        priority_reasoning: s.reasoning
      }));
      await supabase.from('identity_backlog').insert(inserts);
    }

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