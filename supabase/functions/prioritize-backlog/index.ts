// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function callAI(prompt: string, config: { openRouterKey?: string, geminiKey?: string }) {
  const providers = [];
  
  if (config.openRouterKey) {
    // 1. OpenRouter Qwen 2.5 (High reasoning)
    providers.push({
      name: 'OpenRouter (Qwen 2.5)',
      url: "https://openrouter.ai/api/v1/chat/completions",
      headers: { "Authorization": `Bearer ${config.openRouterKey}`, "Content-Type": "application/json" },
      body: { 
        model: "qwen/qwen-2.5-72b-instruct", 
        messages: [{ role: "user", content: prompt }], 
        response_format: { type: "json_object" } 
      }
    });
    // 2. OpenRouter Gemini 2.0 Flash (Reliable fallback)
    providers.push({
      name: 'OpenRouter (Gemini 2.0 Flash)',
      url: "https://openrouter.ai/api/v1/chat/completions",
      headers: { "Authorization": `Bearer ${config.openRouterKey}`, "Content-Type": "application/json" },
      body: { 
        model: "google/gemini-2.0-flash-001", 
        messages: [{ role: "user", content: prompt }], 
        response_format: { type: "json_object" } 
      }
    });
  }

  if (config.geminiKey) {
    // 3. Direct Gemini 2.5 Flash (Stable)
    providers.push({
      name: 'Direct Gemini (2.5-Flash)',
      url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${config.geminiKey}`,
      headers: { 'Content-Type': 'application/json' },
      body: { 
        contents: [{ parts: [{ text: prompt }] }], 
        generationConfig: { temperature: 0.1, response_mime_type: "application/json" } 
      }
    });
  }

  for (const provider of providers) {
    let retries = 2;
    let delay = 1000;

    while (retries > 0) {
      try {
        console.log(`[prioritize-backlog] Attempting ${provider.name}...`);
        const response = await fetch(provider.url, {
          method: 'POST',
          headers: provider.headers,
          body: JSON.stringify(provider.body)
        });

        const data = await response.json();

        if (response.ok) {
          if (provider.name.includes('OpenRouter')) {
            return data.choices[0].message.content;
          } else {
            return data.candidates[0].content.parts[0].text;
          }
        }

        if (response.status === 429 || response.status === 503) {
          console.warn(`[prioritize-backlog] ${provider.name} busy (${response.status}). Retrying in ${delay}ms...`);
          await wait(delay);
          retries--;
          delay *= 2;
          continue;
        }

        console.error(`[prioritize-backlog] ${provider.name} failed with status ${response.status}:`, data);
        break;

      } catch (e) {
        console.error(`[prioritize-backlog] ${provider.name} exception:`, e.message);
        break;
      }
    }
  }

  throw new Error("All AI providers are currently unavailable or rate-limited.");
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
    if (!authHeader) throw new Error("No authorization header provided.");
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) throw new Error("Invalid session.");
    
    const { data: backlog, error: fetchError } = await supabase
      .from('identity_backlog')
      .select('id, content, type')
      .eq('user_id', user.id)
      .eq('status', 'pending');

    if (fetchError) throw fetchError;

    const { data: journal } = await supabase
      .from('practitioner_reflections')
      .select('content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const backlogText = backlog?.map(b => `ID: ${b.id} | ${b.content}`).join('\n') || "None";
    const journalText = journal?.map(j => j.content).join('\n\n') || "None";

    const prompt = `Act as a master clinical supervisor. Analyze the practitioner's journal and identity backlog to prioritize the map.
    Return a JSON object with "rankings" (Array of {id, score, reasoning}) and "new_suggestions" (Array of {content, type, reasoning}).
    BACKLOG:
    ${backlogText}
    JOURNAL:
    ${journalText}`;

    const resultText = await callAI(prompt, { openRouterKey, geminiKey });
    
    let cleanJson = resultText.trim();
    if (cleanJson.includes('```')) {
      cleanJson = cleanJson.replace(/```json\n?/, '').replace(/```\n?/, '').trim();
    }

    const parsed = JSON.parse(cleanJson);

    // Update rankings in background
    if (parsed.rankings) {
      for (const rank of parsed.rankings) {
        await supabase
          .from('identity_backlog')
          .update({ 
            priority_score: rank.score, 
            priority_reasoning: rank.reasoning 
          })
          .eq('id', rank.id);
      }
    }

    // Insert new suggestions
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

    return new Response(JSON.stringify(parsed), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error(`[prioritize-backlog] Critical Error:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})