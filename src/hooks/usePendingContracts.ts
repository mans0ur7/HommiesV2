import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const usePendingContracts = () => {
  const { user, profile } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user || !profile) {
      setPendingCount(0);
      return;
    }

    const fetchPendingContracts = async () => {
      let query = supabase.from("contracts").select("*", { count: "exact", head: true });

      if (profile.user_type === "landlord") {
        // Landlord: contracts waiting for tenant confirmation or ready to sign
        query = query
          .eq("landlord_id", user.id)
          .in("status", ["tenant_confirmed", "partially_signed"]);
      } else {
        // Roomie/tenant: contracts ready for them to review or sign
        query = query
          .eq("tenant_id", user.id)
          .in("status", ["ready", "sent_to_penneo", "partially_signed"]);
      }

      const { count } = await query;
      setPendingCount(count || 0);
    };

    fetchPendingContracts();

    // Subscribe to contract changes for real-time updates
    const channel = supabase
      .channel(`pending-contracts-${user?.id ?? "anon"}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contracts",
        },
        () => {
          fetchPendingContracts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile]);

  return { pendingCount };
};
