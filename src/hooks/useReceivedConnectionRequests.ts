import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ReceivedConnectionRequest {
  id: string;
  sender_id: string;
  status: string;
  type: string;
  created_at: string;
  sender: {
    id: string; // profile.id
    user_id: string; // auth user id of sender
    name: string;
    avatar_url: string | null;
    age: number | null;
    study: string | null;
  };
}

/**
 * Inbound connection requests = pending rows in "match_requests" where the
 * current user is the receiver. We then hydrate each request with the sender's
 * public profile, mirroring how Inbox.tsx does it.
 */
export const useReceivedConnectionRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ReceivedConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    if (!user) {
      setRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("match_requests")
      .select("id, sender_id, status, type, created_at")
      .eq("receiver_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error || !data?.length) {
      setRequests([]);
      setLoading(false);
      return;
    }

    const withProfiles = await Promise.all(
      data.map(async (req) => {
        const { data: senderProfile } = await supabase
          .from("profiles")
          .select("id, user_id, name, avatar_url, age, study")
          .eq("user_id", req.sender_id)
          .maybeSingle();

        return {
          ...req,
          sender: {
            id: senderProfile?.id || req.sender_id,
            user_id: senderProfile?.user_id || req.sender_id,
            name: senderProfile?.name || "Ukendt",
            avatar_url: senderProfile?.avatar_url ?? null,
            age: senderProfile?.age ?? null,
            study: senderProfile?.study ?? null,
          },
        };
      })
    );

    setRequests(withProfiles);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchRequests();

    if (!user) return;

    const channel = supabase
      .channel(`received-connection-requests-${user.id}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "match_requests" },
        () => fetchRequests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchRequests]);

  return { requests, loading, refetch: fetchRequests };
};
