// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
}

// Helper to ensure AI types match DB constraints
const normalizeType = (type: string): 'alignment' | 'shifting' | 'belief' => {
  const t = String(type).toLowerCase().trim();
  if (t === 'goal' || t === 'alignment') return 'alignment';
  if (t === 'identity' || t === 'shifting') return 'shifting';
  return 'belief';
};

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
    
    if (!geminiKey) throw new Error("GEMINI_API_KEY is missing.");

    const supabase = createClient(supabaseUrl, supabaseKey)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error("No authorization header provided.");
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) throw new Error("Invalid or expired user session.");
    
    const userId = user.id;

    const { data: reflections } = await supabase
      .from('practitioner_reflections')
      .select('content, category, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    const { data: backlog } = await supabase
      .from('identity_backlog')
      .select('id, content, type, status')
      .eq('user_id', userId);

    if (!backlog || backlog.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No items to prioritize." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const journalContext = reflections?.map(r => `[${r.category}]: ${r.content}`).join('\n\n');
    const backlogList = backlog?.map(b => `[${b.status}] ID: ${b.id} | Type: ${b.type} | Content: ${b.content}`).join('\n');

    const prompt = `Act as a master clinical supervisor and pattern recognition expert.
    Analyze my journal entries and my current "Identity Map" to perform a DEEP DISCOVERY.
    
    PRIMARY TASK: TOOL REASSESSMENT
    For every item in the "CURRENT MAP", re-evaluate if it is assigned to the correct clinical tool.
    
    LOGIC FOR CATEGORIZATION:
    1. "alignment" -> IDENTITY ALIGNMENT. Use this for any DESIRED FUTURE STATE, specific outcome, income target, or version of self you are moving TOWARDS (e.g., "Making $1500/week", "The Sovereign Creator").
    2. "shifting" -> IDENTITY SHIFTING. Use this for any CURRENT PROBLEMATIC version of self, "stuck" role, or construct you are letting go of (e.g., "The Procrastinator", "The Invisible One").
    3. "belief" -> LIMITING BELIEFS. Use this for core "I am..." struggle statements or rules that hold a pattern in place (e.g., "I am a burden", "I am not safe to be seen").
    
    SECONDARY TASKS:
    1. RE-PRIORITIZE: Rank existing items (1-100) based on their "Keystone" potential.
    2. DISCOVER: Identify 3-5 NEW items missing from the map but clearly recurring in the journal.
    
    JOURNAL CONTEXT:
    ${journalContext}
    
    CURRENT MAP:
    ${backlogList}
    
    Return ONLY a JSON object.
    Structure:
    {
      "rankings": [
        { "id": "uuid", "type": "alignment|shifting|belief", "score": 85, "reasoning": "...", "polarity_insight": "..." }
      ],
      "new_suggestions": [
        { "content": "...", "type": "alignment|shifting|belief", "reasoning": "...", "polarity_insight": "..." }
      ]
    }`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, response_mime_type: "application/json" }
      }),
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || 'Gemini Error');

    let resultText = data.candidates[0].content.parts[0].text.trim();
    if (resultText.includes('```')) {
      resultText = resultText.replace(/```json\n?/, '').replace(/```\n?/, '').trim();
    }

    const parsed = JSON.parse(resultText);

    // 3. Update existing items with normalization
    if (parsed.rankings && parsed.rankings.length > 0) {
      const updatePromises = parsed.rankings.map(rank => {
        const originalItem = backlog.find(b => b.id === rank.id);
        // CRITICAL FIX: Apply normalizeType here!
        const finalType = normalizeType(rank.type);

        if (originalItem && originalItem.type !== finalType) {
          console.log(`[${functionName}] Re-assigning tool for "${originalItem.content}": ${originalItem.type} -> ${finalType}`);
        }

        return supabase
          .from('identity_backlog')
          .update({
            type: finalType,
            priority_score: rank.score,
            priority_reasoning: rank.reasoning,
            polarity_insight: rank.polarity_insight
          })
          .eq('id', rank.id)
          .eq('user_id', userId);
      });
      await Promise.all(updatePromises);
    }

    // 4. Insert new suggestions with normalization
    if (parsed.new_suggestions && parsed.new_suggestions.length > 0) {
      const inserts = parsed.new_suggestions.map(s => ({
        user_id: userId,
        content: s.content,
        type: normalizeType(s.type),
        status: 'suggested',
        priority_reasoning: s.reasoning,
        polarity_insight: s.polarity_insight
      }));

      await supabase.from('identity_backlog').insert(inserts);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      updated: parsed.rankings?.length || 0,
      new: parsed.new_suggestions?.length || 0 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error(`[${functionName}] Error:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})