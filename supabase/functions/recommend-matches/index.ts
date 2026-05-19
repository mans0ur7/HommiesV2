// AI-powered ranking of candidates (properties or roomies) for Matches page.
// Uses Lovable AI Gateway with tool calling for structured output.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type RankReq = {
  type: "properties" | "roomies";
  candidates: Array<Record<string, any>>; // minimal fields per candidate
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = (await req.json()) as RankReq;
    if (!body?.candidates || !Array.isArray(body.candidates) || body.candidates.length === 0) {
      return new Response(JSON.stringify({ ranked: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Gather behavioural signals in parallel
    const [profileRes, viewsRes, favRes, ignRes, agentsRes] = await Promise.all([
      supabase.from("profiles").select("name, age, gender, study, work, monthly_budget, rental_period, lifestyle, personality, languages, user_type").eq("user_id", userId).maybeSingle(),
      supabase.from("views").select("target_property_id, target_user_id, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(40),
      supabase.from("favorites").select("property_id").eq("user_id", userId).limit(30),
      supabase.from("ignored").select("target_property_id, target_user_id").eq("user_id", userId).limit(40),
      supabase.from("search_agents").select("city, area, min_rent, max_rent, min_rooms, max_rooms, property_type").eq("user_id", userId).eq("is_active", true).limit(5),
    ]);

    // Filter out ignored candidates before sending to AI
    const ignoredPropertyIds = new Set((ignRes.data ?? []).map((i: any) => i.target_property_id).filter(Boolean));
    const ignoredUserIds = new Set((ignRes.data ?? []).map((i: any) => i.target_user_id).filter(Boolean));
    
    const filteredCandidates = body.candidates.filter(c => {
      if (body.type === 'properties') return !ignoredPropertyIds.has(c.id);
      if (body.type === 'roomies') return !ignoredUserIds.has(c.id);
      return true;
    }).slice(0, 60);

    // Hydrate viewed/liked property snippets for context
    const viewedPropIds = (viewsRes.data ?? []).map((v: any) => v.target_property_id).filter(Boolean).slice(0, 20);
    const likedPropIds = (favRes.data ?? []).map((f: any) => f.property_id).filter(Boolean);
    const propIdsToFetch = Array.from(new Set([...viewedPropIds, ...likedPropIds]));
    let recentSignal: any[] = [];
    if (propIdsToFetch.length > 0) {
      const { data: props } = await supabase
        .from("properties")
        .select("id, city, monthly_rent, room_count, size_sqm, property_type, is_furnished")
        .in("id", propIdsToFetch);
      recentSignal = props ?? [];
    }

    const userContext = {
      profile: profileRes.data ?? null,
      activeSearchAgents: agentsRes.data ?? [],
      recentlyViewedOrLiked: recentSignal,
      ignoredCount: (ignRes.data ?? []).length,
    };

    const systemPrompt = `Du er en boligmatch-assistent. Du modtager en brugers profil, deres søgeagenter, og hvilke boliger/personer de har set eller liket. Du skal rangere kandidater efter relevans for brugeren (1.0 = perfekt match, 0.0 = irrelevant). Vægt: prisinterval, by/område, størrelse, livsstil, og lighed med tidligere viste/liked items. Returnér ALLE kandidater rangeret, højeste først.`;

    const userPrompt = `Brugerkontekst:\n${JSON.stringify(userContext)}\n\nKandidater (type=${body.type}):\n${JSON.stringify(filteredCandidates)}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "rank_candidates",
            description: "Returnér rangerede kandidater",
            parameters: {
              type: "object",
              properties: {
                ranked: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      score: { type: "number" },
                      reason: { type: "string" },
                    },
                    required: ["id", "score"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["ranked"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "rank_candidates" } },
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI gateway error", aiRes.status, t);
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "rate_limited", ranked: [] }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "credits_exhausted", ranked: [] }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "ai_error", ranked: [] }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    let ranked: Array<{ id: string; score: number; reason?: string }> = [];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        if (Array.isArray(parsed.ranked)) ranked = parsed.ranked;
      } catch (e) {
        console.error("Failed parsing tool args", e);
      }
    }

    return new Response(JSON.stringify({ ranked }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("recommend-matches error", e);
    return new Response(JSON.stringify({ error: String(e), ranked: [] }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
