import { useState, useEffect } from "react";
import { HousingGroup } from "@/hooks/useHousingGroups";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Home, Star, Send, Check, Wallet, Sparkles, User, MapPin } from "lucide-react";
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

interface GroupPropertiesFeedProps {
  group: HousingGroup;
  groupId: string;
  onSendRequest: (data: {
    group_id: string;
    property_id: string;
    landlord_id: string;
    message?: string;
    desired_rooms?: number;
  }) => Promise<boolean>;
  sentRequestPropertyIds: string[];
}

const GroupPropertiesFeed = ({
  group,
  groupId,
  onSendRequest,
  sentRequestPropertyIds,
}: GroupPropertiesFeedProps) => {
  const navigate = useNavigate();
  const [matchingProperties, setMatchingProperties] = useState<Property[]>([]);
  const [recommendations, setRecommendations] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchAllProperties();
  }, [group]);

  const fetchAllProperties = async () => {
    setLoading(true);

    // Fetch matching properties
    let matchQuery = supabase
      .from("properties")
      .select("*")
      .eq("is_published", true);

    if (group.budget_per_person) {
      const maxBudget = group.budget_per_person * 1.2;
      matchQuery = matchQuery.lte("monthly_rent", maxBudget);
    }

    if (group.desired_rooms) {
      matchQuery = matchQuery.gte("available_rooms", group.desired_rooms);
    }

    if (group.city) {
      matchQuery = matchQuery.ilike("city", `%${group.city}%`);
    }

    const { data: matchData } = await matchQuery.order("created_at", { ascending: false }).limit(20);
    const matchingIds = new Set((matchData || []).map(p => p.id));
    setMatchingProperties(matchData || []);

    // Fetch recommendations (multi-room properties that don't match perfectly)
    const { data: allMultiRoom } = await supabase
      .from("properties")
      .select("*")
      .eq("is_published", true)
      .eq("is_multi_room", true)
      .order("rating_average", { ascending: false, nullsFirst: false })
      .limit(50);

    const recs = (allMultiRoom || []).filter(property => {
      // Exclude already matching properties
      if (matchingIds.has(property.id)) return false;

      const matchesBudget = !group.budget_per_person || property.monthly_rent <= group.budget_per_person * 1.2;
      const matchesRooms = !group.desired_rooms || (property.available_rooms || property.room_count) >= group.desired_rooms;
      const matchesCity = !group.city || property.city?.toLowerCase().includes(group.city.toLowerCase());
      
      const isPerfectMatch = matchesBudget && matchesRooms && matchesCity;
      return !isPerfectMatch || (property.rating_average && property.rating_average >= 4.5);
    });

    setRecommendations(recs.slice(0, 8));
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

  const getRecommendationReason = (property: Property) => {
    if (property.rating_average && property.rating_average >= 4.0) return "Højt vurderet";
    if (group.budget_per_person && property.monthly_rent > group.budget_per_person * 1.2) return "Over budget";
    if (group.city && !property.city?.toLowerCase().includes(group.city.toLowerCase())) return "Anden by";
    return "Forslag";
  };

  const PropertyCard = ({ property, isRecommendation = false }: { property: Property; isRecommendation?: boolean }) => {
    const alreadySent = sentRequestPropertyIds.includes(property.id);

    return (
      <div className="group relative aspect-[3/4] sm:aspect-[4/5] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl">
        {/* Full-bleed background image */}
        <div 
          className="absolute inset-0"
          onClick={() => navigate(`/property/${property.id}`)}
        >
          {property.images?.[0] ? (
            <img
              src={property.images[0]}
              alt={property.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <Home className="w-12 h-12 text-muted-foreground/50" />
            </div>
          )}
        </div>
        
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent pointer-events-none" />
        
        {/* Top badges */}
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between z-10">
          <div className="flex items-center gap-1.5">
            {isRecommendation ? (
              <Badge className="bg-secondary text-secondary-foreground gap-1 text-xs">
                <Sparkles className="w-3 h-3" />
                {getRecommendationReason(property)}
              </Badge>
            ) : (
              <div className="w-7 h-7 rounded-full bg-green-500/90 flex items-center justify-center shadow-lg">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          {property.rating_average && (
            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-semibold text-white">{property.rating_average.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Bottom content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
          <h3 
            className="font-bold text-base text-white truncate mb-0.5 cursor-pointer"
            onClick={() => navigate(`/property/${property.id}`)}
          >
            {property.title}
          </h3>

          <p className="text-xs text-white/80 flex items-center gap-1 mb-2">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{property.address}, {property.city}</span>
            <span className="text-white/50 mx-1">•</span>
            <span>{property.available_rooms || property.room_count} vær.</span>
          </p>

          <div className="flex items-center gap-2 mb-3">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg px-2 py-1 shadow-lg">
              <span className="font-bold text-sm text-foreground">{property.monthly_rent.toLocaleString()} kr</span>
              <span className="text-xs text-muted-foreground">/md</span>
            </div>
            {property.is_furnished && (
              <span className="text-xs text-white/70 bg-white/10 px-2 py-1 rounded-lg">Møbleret</span>
            )}
          </div>

          <Button
            className="w-full"
            size="sm"
            variant={isRecommendation ? "outline" : "default"}
            disabled={alreadySent}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedProperty(property);
            }}
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
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold">Boliger</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Boliger til jer</h3>
          <Badge variant="secondary">
            {matchingProperties.length + recommendations.length} boliger
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {group.budget_per_person && (
            <Badge variant="outline" className="gap-1">
              <Wallet className="w-3 h-3" />
              Max {group.budget_per_person.toLocaleString()} kr/md
            </Badge>
          )}
          {group.desired_rooms && (
            <Badge variant="outline" className="gap-1">
              <Home className="w-3 h-3" />
              Min {group.desired_rooms} værelser
            </Badge>
          )}
          {group.city && (
            <Badge variant="outline">{group.city}</Badge>
          )}
        </div>
      </div>

      {/* Matching properties */}
      {matchingProperties.length > 0 ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {matchingProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-muted/30 rounded-xl">
          <Home className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            Ingen boliger matcher jeres krav lige nu
          </p>
        </div>
      )}

      {/* Divider with recommendations intro */}
      {recommendations.length > 0 && (
        <>
          <div className="flex items-center gap-3 py-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-secondary" />
              Flere forslag
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((property) => (
              <PropertyCard key={property.id} property={property} isRecommendation />
            ))}
          </div>
        </>
      )}

      {matchingProperties.length === 0 && recommendations.length === 0 && (
        <div className="text-center py-12 bg-muted/30 rounded-xl">
          <Home className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Ingen boliger fundet</h3>
          <p className="text-muted-foreground text-sm">
            Prøv at justere gruppens krav
          </p>
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
                  {group.desired_rooms && ` · Søger ${group.desired_rooms} værelser`}
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

export default GroupPropertiesFeed;
