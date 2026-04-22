// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function callAI(prompt: string, config: { openRouterKey?: string, geminiKey?: string }) {
  const providers = [];
  if (config.openRouterKey) {
    providers.push({
      name: 'OpenRouter (Qwen)',
      url: "https://openrouter.ai/api/v1/chat/completions",
      headers: { "Authorization": `Bearer ${config.openRouterKey}`, "Content-Type": "application/json" },
      body: { model: "qwen/qwen3-coder:free", messages: [{ role: "user", content: prompt }], response_format: { type: "json_object" } }
    });
    providers.push({
      name: 'OpenRouter (Gemini 2.0 Flash Lite)',
      url: "https://openrouter.ai/api/v1/chat/completions",
      headers: { "Authorization": `Bearer ${config.openRouterKey}`, "Content-Type": "application/json" },
      body: { model: "google/gemini-2.0-flash-lite-preview-02-05:free", messages: [{ role: "user", content: prompt }], response_format: { type: "json_object" } }
    });
  }
  if (config.geminiKey) {
    providers.push({
      name: 'Direct Gemini (1.5-Flash)',
      url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.geminiKey}`,
      headers: { 'Content-Type': 'application/json' },
      body: { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1, response_mime_type: "application/json" } }
    });
  }

  for (const provider of providers) {
    let retries = 2;
    let delay = 1000;
    while (retries > 0) {
      try {
        const response = await fetch(provider.url, { method: 'POST', headers: provider.headers, body: JSON.stringify(provider.body) });
        const data = await response.json();
        if (response.ok) return provider.name.includes('OpenRouter') ? data.choices[0].message.content : data.candidates[0].content.parts[0].text;
        if (response.status === 429 || response.status === 503) {
          await wait(delay);
          retries--;
          delay *= 2;
          continue;
        }
        break;
      } catch (e) { break; }
    }
  }
  throw new Error("AI services unavailable.");
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY')
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    const authHeader = req.headers.get('Authorization')
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    
    const { data: backlog } = await supabase.from('identity_backlog').select('id, content, type').eq('user_id', user.id).eq('status', 'pending');
    const { data: journal } = await supabase.from('practitioner_reflections').select('content').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10);

    const backlogText = backlog?.map(b => `ID: ${b.id} | ${b.content}`).join('\n') || "None";
    const journalText = journal?.map(j => j.content).join('\n\n') || "None";

    const prompt = `Act as a master clinical supervisor. Analyze the practitioner's journal and identity backlog to prioritize the map.
    Return a JSON object with "rankings" (Array of {id, score, reasoning}) and "new_suggestions" (Array of {content, type, reasoning}).
    BACKLOG: ${backlogText}
    JOURNAL: ${journalText}`;

    const resultText = await callAI(prompt, { openRouterKey, geminiKey });
    let cleanJson = resultText.trim();
    if (cleanJson.includes('```')) cleanJson = cleanJson.replace(/```json\n?/, '').replace(/```\n?/, '').trim();

    const parsed = JSON.parse(cleanJson);
    if (parsed.rankings) {
      for (const rank of parsed.rankings) {
        await supabase.from('identity_backlog').update({ priority_score: rank.score, priority_reasoning: rank.reasoning }).eq('id', rank.id);
      }
    }
    if (parsed.new_suggestions) {
      const inserts = parsed.new_suggestions.map(s => ({
        user_id: user.id,
        content: s.content,
        type: s.type === 'goal' ? 'alignment' : s.type === 'identity' ? 'shifting' : 'belief',
        status: 'suggested',
        priority_reasoning: s.reasoning
      }));
      await supabase.from('identity_backlog').insert(inserts);
    }

    return new Response(cleanJson, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
})