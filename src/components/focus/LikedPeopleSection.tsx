import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LikedPerson {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  age: number | null;
  gender: string | null;
  study: string | null;
}

const LikedPeopleSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [likedPeople, setLikedPeople] = useState<LikedPerson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchLikedPeople();
    }
  }, [user]);

  const fetchLikedPeople = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Get accepted roomie connections
      const { data: matches } = await supabase
        .from("match_requests")
        .select("sender_id, receiver_id")
        .eq("type", "roomie")
        .eq("status", "accepted")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

      if (matches && matches.length > 0) {
        const partnerIds = matches.map((m) =>
          m.sender_id === user.id ? m.receiver_id : m.sender_id
        );
        const uniqueIds = [...new Set(partnerIds)];

        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, user_id, name, avatar_url, age, gender, study")
          .in("user_id", uniqueIds);

        if (profiles) {
          setLikedPeople(profiles);
        }
      }
    } catch (error) {
      console.error("Error fetching liked people:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px w-8 bg-foreground/40" />
          <h2 className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">Personer du matcher med</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-32">
              <div className="aspect-[3/4] rounded-2xl bg-muted" />
              <div className="h-4 bg-muted rounded mt-2 w-20" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (likedPeople.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px w-8 bg-foreground/40" />
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">Personer du matcher med</h2>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {likedPeople.map((person) => (
          <div
            key={person.id}
            className="flex-shrink-0 w-32 cursor-pointer group"
            onClick={() => navigate(`/user/${person.user_id}`)}
          >
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-muted border border-border/60">
              {person.avatar_url ? (
                <img
                  src={person.avatar_url}
                  alt={person.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <User className="w-12 h-12 text-muted-foreground/50" />
                </div>
              )}
            </div>
            
            <div className="mt-2">
              <p className="font-medium text-sm truncate">{person.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {person.age && `${person.age} år`}
                {person.age && person.gender && " • "}
                {person.gender === "male" ? "Mand" : person.gender === "female" ? "Kvinde" : person.gender}
                {(person.age || person.gender) && person.study && " • "}
                {person.study && "Studerende"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default LikedPeopleSection;
