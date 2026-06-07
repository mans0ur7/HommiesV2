// Backend function: create-conversation
// Creates a conversation + participants atomically using service role.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type CreateConversationBody = {
  type: "landlord" | "roomie" | "group";
  participant_ids?: string[]; // required for landlord/roomie
  property_id?: string | null;
  group_id?: string | null; // required for group
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate JWT & get caller id
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await authClient.auth.getUser(token);
    if (userError || !userData?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = userData.user.id;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = (await req.json()) as CreateConversationBody;

    if (!body?.type) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.type === "group") {
      if (!body.group_id) {
        return new Response(JSON.stringify({ error: "group_id is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Caller must be group member (accepted) or creator
      const { data: isMember } = await supabase
        .rpc("is_group_member", { _group_id: body.group_id, _user_id: callerId });

      if (!isMember) {
        return new Response(JSON.stringify({ error: "Forbidden - must be group member" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Internal group chat: type "group", NO property_id
      // Look for existing internal group conversation (no property_id)
      const { data: existing } = await supabase
        .from("conversations")
        .select("id, type, group_id, updated_at")
        .eq("type", "group")
        .eq("group_id", body.group_id)
        .is("property_id", null)
        .maybeSingle();

      if (existing) {
        // Re-sync participants: ensure the creator + ALL accepted members are
        // participants, so members who accepted AFTER the chat was first created
        // still receive messages (RLS + realtime both require participation).
        const { data: groupRow } = await supabase
          .from("housing_groups")
          .select("created_by")
          .eq("id", body.group_id)
          .single();
        const { data: members } = await supabase
          .from("housing_group_members")
          .select("user_id")
          .eq("group_id", body.group_id)
          .eq("status", "accepted");

        const wanted = new Set<string>();
        if (groupRow?.created_by) wanted.add(groupRow.created_by);
        (members || []).forEach((m) => wanted.add(m.user_id));
        wanted.add(callerId);

        const { data: existingParts } = await supabase
          .from("conversation_participants")
          .select("user_id")
          .eq("conversation_id", existing.id);
        const have = new Set((existingParts || []).map((p) => p.user_id));

        const toAdd = Array.from(wanted).filter((id) => !have.has(id));
        if (toAdd.length > 0) {
          await supabase.from("conversation_participants").insert(
            toAdd.map((user_id) => ({ conversation_id: existing.id, user_id }))
          );
        }

        return new Response(JSON.stringify({ conversation: existing }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch all accepted members + creator
      const { data: groupRow, error: groupErr } = await supabase
        .from("housing_groups")
        .select("created_by")
        .eq("id", body.group_id)
        .single();

      if (groupErr || !groupRow) {
        return new Response(JSON.stringify({ error: "Group not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: members, error: memErr } = await supabase
        .from("housing_group_members")
        .select("user_id")
        .eq("group_id", body.group_id)
        .eq("status", "accepted");

      if (memErr) {
        return new Response(JSON.stringify({ error: "Could not fetch members" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const participantSet = new Set<string>();
      participantSet.add(groupRow.created_by);
      (members || []).forEach((m) => participantSet.add(m.user_id));
      participantSet.add(callerId);

      console.log("create-conversation: creating internal group chat", {
        group_id: body.group_id,
        participant_count: participantSet.size,
      });

      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert({ type: "group", group_id: body.group_id })
        .select("id, type, group_id, updated_at")
        .single();

      if (convError) {
        console.error("create-conversation: group conversation insert failed", convError);
        return new Response(JSON.stringify({ error: convError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const participantRows = Array.from(participantSet).map((user_id) => ({
        conversation_id: conversation.id,
        user_id,
      }));

      const { error: partError } = await supabase.from("conversation_participants").insert(participantRows);
      if (partError) {
        console.error("create-conversation: group participants insert failed", partError);
        await supabase.from("conversations").delete().eq("id", conversation.id);
        return new Response(JSON.stringify({ error: partError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ conversation }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Landlord-group conversation: type "landlord" with group_id and property_id
    if (body.type === "landlord" && body.group_id && body.property_id) {
      // Caller must be landlord who received a group request
      const { data: hasGroupRequest } = await supabase
        .rpc("landlord_has_group_request", { p_group_id: body.group_id, p_user_id: callerId });

      if (!hasGroupRequest) {
        return new Response(JSON.stringify({ error: "Forbidden - no group request found" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check for existing landlord-group conversation for this property
      const { data: existing } = await supabase
        .from("conversations")
        .select("id, type, group_id, property_id, updated_at")
        .eq("type", "landlord")
        .eq("group_id", body.group_id)
        .eq("property_id", body.property_id)
        .maybeSingle();

      if (existing) {
        // Ensure landlord is a participant
        const { data: isParticipant } = await supabase
          .from("conversation_participants")
          .select("id")
          .eq("conversation_id", existing.id)
          .eq("user_id", callerId)
          .maybeSingle();

        if (!isParticipant) {
          await supabase.from("conversation_participants").insert({
            conversation_id: existing.id,
            user_id: callerId,
          });
        }

        return new Response(JSON.stringify({ conversation: existing }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch group info
      const { data: groupRow, error: groupErr } = await supabase
        .from("housing_groups")
        .select("created_by")
        .eq("id", body.group_id)
        .single();

      if (groupErr || !groupRow) {
        return new Response(JSON.stringify({ error: "Group not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: members } = await supabase
        .from("housing_group_members")
        .select("user_id")
        .eq("group_id", body.group_id)
        .eq("status", "accepted");

      // Collect participants: landlord + group creator + all accepted members
      const participantSet = new Set<string>();
      participantSet.add(callerId); // landlord
      participantSet.add(groupRow.created_by);
      (members || []).forEach((m) => participantSet.add(m.user_id));

      console.log("create-conversation: creating landlord-group chat", {
        group_id: body.group_id,
        property_id: body.property_id,
        participant_count: participantSet.size,
      });

      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert({
          type: "landlord",
          group_id: body.group_id,
          property_id: body.property_id,
        })
        .select("id, type, group_id, property_id, updated_at")
        .single();

      if (convError) {
        console.error("create-conversation: landlord-group conversation insert failed", convError);
        return new Response(JSON.stringify({ error: convError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const participantRows = Array.from(participantSet).map((user_id) => ({
        conversation_id: conversation.id,
        user_id,
      }));

      const { error: partError } = await supabase.from("conversation_participants").insert(participantRows);
      if (partError) {
        console.error("create-conversation: landlord-group participants insert failed", partError);
        await supabase.from("conversations").delete().eq("id", conversation.id);
        return new Response(JSON.stringify({ error: partError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ conversation }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // landlord/roomie conversation requires 2 participants
    if (!Array.isArray(body.participant_ids) || body.participant_ids.length !== 2) {
      return new Response(JSON.stringify({ error: "participant_ids must contain 2 ids" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [userA, userB] = body.participant_ids;
    if (callerId !== userA && callerId !== userB) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("create-conversation: creating", {
      type: body.type,
      property_id: body.property_id ?? null,
      userA,
      userB,
    });

    // 1) Create conversation
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .insert({
        type: body.type,
        property_id: body.property_id ?? null,
      })
      .select("id, type, property_id, updated_at")
      .single();

    if (convError) {
      console.error("create-conversation: conversation insert failed", convError);
      return new Response(JSON.stringify({ error: convError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) Create participants
    const { error: partError } = await supabase.from("conversation_participants").insert([
      { conversation_id: conversation.id, user_id: userA },
      { conversation_id: conversation.id, user_id: userB },
    ]);

    if (partError) {
      console.error("create-conversation: participants insert failed", partError);
      // best-effort cleanup
      await supabase.from("conversations").delete().eq("id", conversation.id);
      return new Response(JSON.stringify({ error: partError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ conversation }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-conversation: unexpected error", e);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
