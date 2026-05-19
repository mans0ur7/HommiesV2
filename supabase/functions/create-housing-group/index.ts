// Supabase Edge Function: create-housing-group
// Creates a housing group using service role, while validating the caller is authenticated.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type CreateHousingGroupBody = {
  name: string;
  city?: string | null;
  area?: string | null;
  budget_per_person?: number | null;
  budget_total?: number | null;
  desired_rooms?: number | null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    const authedClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const { data: userData, error: userError } = await authedClient.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerUserId = userData.user.id;
    const body = (await req.json()) as CreateHousingGroupBody;

    if (!body?.name || typeof body.name !== "string" || !body.name.trim()) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: group, error: insertError } = await supabaseAdmin
      .from("housing_groups")
      .insert({
        name: body.name.trim(),
        city: body.city ?? null,
        area: body.area ?? null,
        budget_per_person: body.budget_per_person ?? null,
        budget_total: body.budget_total ?? null,
        desired_rooms: body.desired_rooms ?? null,
        created_by: callerUserId,
      })
      .select("*")
      .single();

    if (insertError) {
      console.error("create-housing-group: insert failed", insertError);
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ group }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-housing-group: unexpected error", e);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
