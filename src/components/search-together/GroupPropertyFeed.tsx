import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, MapPin, Users, Wallet, BedDouble, ArrowLeft, Send, X } from "lucide-react";
import { HousingGroup } from "@/hooks/useHousingGroups";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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
}

interface GroupPropertyFeedProps {
  group: HousingGroup;
  onBack: () => void;
  onSendRequest: (data: {
    group_id: string;
    property_id: string;
    landlord_id: string;
    message?: string;
    desired_rooms?: number;
  }) => Promise<boolean>;
  sentRequestPropertyIds: string[];
}

const GroupPropertyFeed = ({
  group,
  onBack,
  onSendRequest,
  sentRequestPropertyIds,
}: GroupPropertyFeedProps) => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchMultiRoomProperties();
  }, [group]);

  const fetchMultiRoomProperties = async () => {
    setLoading(true);

    let query = supabase
      .from("properties")
      .select("*")
      .eq("is_published", true)
      .eq("is_multi_room", true)
      .gte("available_rooms", 2);

    // Filter by group's desired rooms (if specified)
    if (group.desired_rooms) {
      query = query.gte("available_rooms", group.desired_rooms);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching properties:", error);
      setProperties([]);
    } else {
      // If group has a city preference, sort matching cities first but show all
      let sortedProperties = data || [];
      if (group.city) {
        sortedProperties = sortedProperties.sort((a, b) => {
          const aMatchesCity = a.city?.toLowerCase() === group.city?.toLowerCase();
          const bMatchesCity = b.city?.toLowerCase() === group.city?.toLowerCase();
          if (aMatchesCity && !bMatchesCity) return -1;
          if (!aMatchesCity && bMatchesCity) return 1;
          return 0;
        });
      }
      setProperties(sortedProperties);
    }

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

  const acceptedMembers = group.members.filter(m => m.status === "accepted");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-lg font-semibold">Boliger til {group.name}</h2>
          <p className="text-sm text-muted-foreground">
            Boliger med flere ledige værelser
            {group.city && ` i ${group.city}`}
          </p>
        </div>
      </div>

      {/* Group info summary */}
      <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
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
          <span className="text-sm">
            {acceptedMembers.length} medlemmer søger sammen
          </span>
        </div>
        {group.desired_rooms && (
          <Badge variant="secondary">
            <BedDouble className="w-3 h-3 mr-1" />
            {group.desired_rooms} værelser
          </Badge>
        )}
      </div>

      {/* Properties grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
            <Home className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-2">Ingen boliger fundet</h3>
          <p className="text-muted-foreground text-sm">
            Der er ingen boliger med flere ledige værelser
            {group.city && ` i ${group.city}`} lige nu.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {properties.map((property) => {
            const alreadySent = sentRequestPropertyIds.includes(property.id);

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
                  <Badge className="absolute top-3 left-3 bg-secondary">
                    <Users className="w-3 h-3 mr-1" />
                    {property.available_rooms} ledige værelser
                  </Badge>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 
                    className="font-semibold mb-1 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => navigate(`/property/${property.id}`)}
                  >
                    {property.title}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                    <MapPin className="w-3.5 h-3.5" />
                    {property.address}, {property.city}
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1 text-primary font-semibold">
                      <Wallet className="w-4 h-4" />
                      {property.monthly_rent.toLocaleString()} kr/md
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BedDouble className="w-4 h-4" />
                      {property.room_count} værelser
                      {property.size_sqm && ` · ${property.size_sqm} m²`}
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    disabled={alreadySent}
                    onClick={() => setSelectedProperty(property)}
                  >
                    {alreadySent ? (
                      <>Anmodning sendt</>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send gruppe-anmodning
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
            {/* Property summary */}
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
                    {selectedProperty.available_rooms} ledige værelser
                  </Badge>
                </div>
              </div>
            )}

            {/* Group summary */}
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
                  {acceptedMembers.length} medlemmer
                  {group.desired_rooms && ` · Søger ${group.desired_rooms} værelser`}
                </p>
              </div>
            </div>

            {/* Message */}
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

export default GroupPropertyFeed;
