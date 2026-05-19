import { useState, useEffect } from "react";
import { HousingGroup } from "@/hooks/useHousingGroups";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Home, Sparkles, Star, Send, Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  monthly_rent: number;
  available_rooms: number;
  is_multi_room: boolean;
  images: string[] | null;
  room_count: number;
  size_sqm: number | null;
  user_id: string;
  is_furnished: boolean | null;
  rating_average: number | null;
  rating_count: number | null;
}

interface GroupRecommendationsProps {
  group: HousingGroup;
  groupId: string; // Current group ID
  onSendRequest: (data: {
    group_id: string;
    property_id: string;
    landlord_id: string;
    message?: string;
    desired_rooms?: number;
  }) => Promise<boolean>;
  sentRequestPropertyIds: string[]; // Property IDs requested by THIS specific group
}

const GroupRecommendations = ({
  group,
  groupId,
  onSendRequest,
  sentRequestPropertyIds,
}: GroupRecommendationsProps) => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, [group]);

  const fetchRecommendations = async () => {
    setLoading(true);

    // Only fetch multi-room properties (shared living / kollektiv)
    const { data: allProperties, error } = await supabase
      .from("properties")
      .select("*")
      .eq("is_published", true)
      .eq("is_multi_room", true)
      .order("rating_average", { ascending: false, nullsFirst: false })
      .limit(50);

    if (error) {
      console.error("Error fetching recommendations:", error);
      setProperties([]);
      setLoading(false);
      return;
    }

    // Filter to show properties that DON'T perfectly match but could be interesting
    const recommendations = (allProperties || []).filter(property => {
      // Check if it matches the group's criteria
      const matchesBudget = !group.budget_per_person || property.monthly_rent <= group.budget_per_person * 1.2;
      const matchesRooms = !group.desired_rooms || (property.available_rooms || property.room_count) >= group.desired_rooms;
      const matchesCity = !group.city || property.city?.toLowerCase().includes(group.city.toLowerCase());
      
      // Include if it doesn't perfectly match ALL criteria
      // This shows properties that are slightly outside budget, in other cities, etc.
      const isPerfectMatch = matchesBudget && matchesRooms && matchesCity;
      
      // Show properties that are NOT a perfect match but could still be relevant
      // Also include highly rated properties regardless
      return !isPerfectMatch || property.rating_average >= 4.5;
    });

    // Sort by rating and relevance
    const sortedRecommendations = recommendations.sort((a, b) => {
      // Prioritize highly rated
      if (a.rating_average && b.rating_average) {
        return b.rating_average - a.rating_average;
      }
      return 0;
    });

    setProperties(sortedRecommendations.slice(0, 12));
    setLoading(false);
  };

  const handleSendRequest = async () => {
    if (!selectedProperty) return;

    setIsSending(true);
    const success = await onSendRequest({
      group_id: group.id,
      property_id: selectedProperty.id,
      landlord_id: selectedProperty.user_id,
      message: message || undefined,
      desired_rooms: group.desired_rooms || undefined,
    });

    setIsSending(false);

    if (success) {
      toast.success("Gruppe-anmodning sendt!");
      setSelectedProperty(null);
      setMessage("");
    } else {
      toast.error("Kunne ikke sende anmodning");
    }
  };

  const acceptedMembers = group.members?.filter(m => m.status === "accepted") || [];

  // Helper to show why a property is recommended
  const getRecommendationReason = (property: Property) => {
    const reasons = [];
    
    if (property.rating_average && property.rating_average >= 4.0) {
      reasons.push("Højt vurderet");
    }
    if (group.budget_per_person && property.monthly_rent > group.budget_per_person * 1.2) {
      reasons.push("Lidt over budget");
    }
    if (group.city && !property.city?.toLowerCase().includes(group.city.toLowerCase())) {
      reasons.push("Anden by");
    }
    
    return reasons.length > 0 ? reasons[0] : "Kunne være interessant";
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-secondary" />
          <h3 className="font-semibold">Anbefalinger</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-secondary" />
          <div>
            <h3 className="font-semibold">Anbefalinger</h3>
            <p className="text-sm text-muted-foreground">
              Andre spændende boliger der kunne passe
            </p>
          </div>
        </div>
        <Badge variant="secondary">
          {properties.length} forslag
        </Badge>
      </div>

      {/* Info box */}
      <div className="flex items-start gap-3 p-3 bg-secondary/10 rounded-lg border border-secondary/20">
        <Info className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          Disse boliger matcher ikke jeres specifikationer præcist, men kunne stadig være interessante 
          – f.eks. i andre byer, lidt over budget, eller med andre faciliteter.
        </p>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-xl">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-2">Ingen anbefalinger</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Vi finder løbende nye boliger, der kunne være interessante for jeres gruppe.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {properties.map((property) => {
            const alreadySent = sentRequestPropertyIds.includes(property.id);
            const reason = getRecommendationReason(property);

            return (
              <div
                key={property.id}
                className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Image */}
                <div 
                  className="h-40 bg-muted relative cursor-pointer"
                  onClick={() => navigate(`/property/${property.id}`)}
                >
                  {property.images?.[0] ? (
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Home className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  {/* Price badge */}
                  <Badge className="absolute top-3 left-3 bg-background/90 text-foreground">
                    {property.monthly_rent.toLocaleString()} kr/md
                  </Badge>
                  {/* Recommendation badge */}
                  <Badge className="absolute top-3 right-3 bg-secondary text-secondary-foreground gap-1">
                    <Sparkles className="w-3 h-3" />
                    {reason}
                  </Badge>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 
                      className="font-semibold cursor-pointer hover:text-primary transition-colors line-clamp-1"
                      onClick={() => navigate(`/property/${property.id}`)}
                    >
                      {property.title}
                    </h3>
                  </div>

                  <p className="text-sm text-muted-foreground mb-2">
                    {property.address}, {property.city}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Home className="w-3 h-3" />
                      {property.available_rooms || property.room_count} værelser
                    </span>
                    {property.rating_average && (
                      <span className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {property.rating_average}
                      </span>
                    )}
                    {property.is_furnished && <span>Møbleret</span>}
                  </div>

                  <Button
                    className="w-full"
                    size="sm"
                    variant="outline"
                    disabled={alreadySent}
                    onClick={() => setSelectedProperty(property)}
                  >
                    {alreadySent ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Anmodning sendt
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send anmodning
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Send request modal */}
      <Dialog open={!!selectedProperty} onOpenChange={() => setSelectedProperty(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send gruppe-anmodning</DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {selectedProperty && (
              <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                {selectedProperty.images?.[0] && (
                  <img
                    src={selectedProperty.images[0]}
                    alt={selectedProperty.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div>
                  <p className="font-medium">{selectedProperty.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedProperty.address}, {selectedProperty.city}
                  </p>
                  <Badge variant="secondary" className="mt-1">
                    {selectedProperty.available_rooms || selectedProperty.room_count} værelser
                  </Badge>
                </div>
              </div>
            )}

            <div className="flex gap-3 p-3 bg-primary/5 rounded-lg">
              <div className="flex -space-x-2">
                {acceptedMembers.slice(0, 3).map((member) => (
                  <div
                    key={member.id}
                    className="w-8 h-8 rounded-full border-2 border-background overflow-hidden"
                  >
                    {member.profile?.avatar_url ? (
                      <img
                        src={member.profile.avatar_url}
                        alt={member.profile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center text-xs">
                        {member.profile?.name?.charAt(0) || "?"}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div>
                <p className="font-medium text-sm">{group.name}</p>
                <p className="text-xs text-muted-foreground">
                  {acceptedMembers.length} {acceptedMembers.length === 1 ? "medlem" : "medlemmer"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Besked til udlejer (valgfri)
              </label>
              <Textarea
                placeholder="F.eks. Vi er 2 roomies og søger 2 værelser fra 1/9..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setSelectedProperty(null)}>
              Annuller
            </Button>
            <Button onClick={handleSendRequest} disabled={isSending}>
              {isSending ? "Sender..." : "Send anmodning"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupRecommendations;
