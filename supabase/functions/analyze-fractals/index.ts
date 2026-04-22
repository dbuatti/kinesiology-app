// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
      name: 'OpenRouter (Qwen 2.5)',
      url: "https://openrouter.ai/api/v1/chat/completions",
      headers: { "Authorization": `Bearer ${config.openRouterKey}`, "Content-Type": "application/json" },
      body: { 
        model: "qwen/qwen-2.5-72b-instruct", 
        messages: [{ role: "user", content: prompt }], 
        response_format: { type: "json_object" } 
      }
    });
  }

  if (config.geminiKey) {
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
        console.log(`[analyze-fractals] Attempting ${provider.name}...`);
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
          console.warn(`[analyze-fractals] ${provider.name} busy. Retrying...`);
          await wait(delay);
          retries--;
          delay *= 2;
          continue;
        }
        break;
      } catch (e) {
        break;
      }
    }
  }

  throw new Error("The AI service is currently overloaded. Please try again in a few minutes.");
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
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) throw new Error("Unauthorized");

    const { data: backlog } = await supabase
      .from('identity_backlog')
      .select('id, content, type, parent_id')
      .eq('user_id', user.id)
      .eq('status', 'pending');

    if (!backlog || backlog.length < 2) {
      return new Response(JSON.stringify({ success: true, suggestions: [], merges: [], last_scanned: new Date().toISOString() }), { headers: corsHeaders });
    }

    const backlogList = backlog.map(b => `ID: ${b.id} | Content: ${b.content}`).join('\n');
    
    const prompt = `Act as a master clinical supervisor specializing in fractal psychology. 
    Analyze the following list of identities and beliefs. 
    Your goal is to create a clean, hierarchical map where NO item is left as a "Grandparent" unless it is a truly foundational root.
    
    CRITICAL OBJECTIVES:
    1. AGGRESSIVE GROUPING: You MUST attempt to find a parent for EVERY item in the list. Do not leave items orphaned. If an item doesn't have a perfect parent, find the closest thematic match.
    2. SEMANTIC MERGING: Identify items that are essentially the same. List their IDs for merging.
    3. ROOT DISCOVERY: Identify the 3-5 most foundational "Root" patterns.
    4. PRIMARY PRIMARY: Identify the single most dominant root that drives the entire system.
    
    LIST OF ITEMS:
    ${backlogList}
    
    Return ONLY a JSON object:
    {
      "suggestions": [
        {"child_id": "uuid", "parent_id": "uuid", "reasoning": "string"}
      ],
      "merges": [
        {"ids": ["uuid", "uuid"], "suggested_content": "string", "reasoning": "string"}
      ],
      "primary_primary": {
        "id": "uuid",
        "reasoning": "string"
      },
      "last_scanned": "${new Date().toISOString()}"
    }`;

    const resultText = await callAI(prompt, { openRouterKey, geminiKey });
    
    let cleanJson = resultText.trim();
    if (cleanJson.includes('```')) {
      cleanJson = cleanJson.replace(/```json\n?/, '').replace(/```\n?/, '').trim();
    }

    return new Response(cleanJson, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error(`[analyze-fractals] Error:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})