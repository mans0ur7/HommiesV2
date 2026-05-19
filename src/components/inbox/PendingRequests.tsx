import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Users, UsersRound, X, User, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import RequestProfileModal from "./RequestProfileModal";
import { GroupRequest } from "@/hooks/useGroupRequests";

interface MatchRequest {
  id: string;
  sender_id: string;
  status: string;
  type: "landlord" | "roomie";
  created_at: string;
  sender: {
    id: string;
    name: string;
    avatar_url: string | null;
    age: number | null;
    study: string | null;
  };
}

// Unified request type for display
interface UnifiedRequest {
  id: string;
  type: "landlord" | "roomie" | "group";
  name: string;
  avatar_url: string | null;
  age: number | null;
  study: string | null;
  // Original data for modals
  originalMatch?: MatchRequest;
  originalGroup?: GroupRequest;
  // Group-specific
  memberAvatars?: (string | null)[];
}

interface PendingRequestsProps {
  roomieRequests: MatchRequest[];
  landlordRequests: MatchRequest[];
  groupRequests?: GroupRequest[];
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
  onAcceptGroup?: (requestId: string) => void;
  onRejectGroup?: (requestId: string) => void;
  isLandlord?: boolean;
}

const MOBILE_MAX_VISIBLE = 6;
const DESKTOP_MAX_VISIBLE = 8;

const PendingRequests = ({ 
  roomieRequests, 
  landlordRequests, 
  groupRequests = [],
  onAccept, 
  onReject,
  onAcceptGroup,
  onRejectGroup,
  isLandlord = false,
}: PendingRequestsProps) => {
  const navigate = useNavigate();
  const [selectedRequest, setSelectedRequest] = useState<MatchRequest | null>(null);
  const [selectedGroupRequest, setSelectedGroupRequest] = useState<GroupRequest | null>(null);
  const [showAllModal, setShowAllModal] = useState(false);

  const handleViewProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  // Create unified list of all requests
  const unifiedRequests: UnifiedRequest[] = [
    ...landlordRequests.map(req => ({
      id: req.id,
      type: "landlord" as const,
      name: req.sender.name,
      avatar_url: req.sender.avatar_url,
      age: req.sender.age,
      study: req.sender.study,
      originalMatch: req,
    })),
    ...roomieRequests.map(req => ({
      id: req.id,
      type: "roomie" as const,
      name: req.sender.name,
      avatar_url: req.sender.avatar_url,
      age: req.sender.age,
      study: req.sender.study,
      originalMatch: req,
    })),
    // Only show group requests to landlords
    ...(isLandlord ? groupRequests.map(req => ({
      id: req.id,
      type: "group" as const,
      name: req.group?.name || "Gruppe",
      avatar_url: null,
      age: null,
      study: null,
      originalGroup: req,
      memberAvatars: req.group?.members.map(m => m.profile?.avatar_url || null) || [],
    })) : []),
  ];

  const totalRequests = unifiedRequests.length;

  const handleRequestClick = (request: UnifiedRequest) => {
    if (request.type === "group" && request.originalGroup) {
      setSelectedGroupRequest(request.originalGroup);
    } else if (request.originalMatch) {
      setSelectedRequest(request.originalMatch);
    }
  };

  const getTypeBadge = (type: "landlord" | "roomie" | "group") => {
    switch (type) {
      case "landlord":
        return (
          <Badge variant="secondary" className="absolute -top-0.5 left-1/2 -translate-x-1/2 h-4 px-1.5 text-[8px] font-semibold bg-primary text-primary-foreground border-0 shadow-md whitespace-nowrap">
            <Home className="w-2 h-2 mr-0.5" />
            Udlejer
          </Badge>
        );
      case "roomie":
        return (
          <Badge variant="secondary" className="absolute -top-0.5 left-1/2 -translate-x-1/2 h-4 px-1.5 text-[8px] font-semibold bg-secondary text-secondary-foreground border-0 shadow-md whitespace-nowrap">
            <Users className="w-2 h-2 mr-0.5" />
            Roomie
          </Badge>
        );
      case "group":
        return (
          <Badge variant="secondary" className="absolute -top-0.5 left-1/2 -translate-x-1/2 h-4 px-1.5 text-[8px] font-semibold bg-gradient-to-r from-primary to-secondary text-white border-0 shadow-md whitespace-nowrap">
            <UsersRound className="w-2 h-2 mr-0.5" />
            Gruppe
          </Badge>
        );
    }
  };

  const RequestCard = ({ request }: { request: UnifiedRequest }) => (
    <div
      onClick={() => handleRequestClick(request)}
      className="relative flex-shrink-0 cursor-pointer group pt-3"
    >
      <div className="relative w-14 h-16 md:w-16 md:h-20 rounded-xl md:rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105">
        {request.type === "group" ? (
          // Group avatar with stacked members
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <div className="relative w-8 h-8">
              {request.memberAvatars?.slice(0, 2).map((avatar, idx) => (
                <img
                  key={idx}
                  src={avatar || "/placeholder.svg"}
                  alt="Gruppemedlem"
                  className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-background object-cover absolute ${
                    idx === 0 ? "top-0 left-0 z-20" : "top-2 left-3 z-10"
                  }`}
                />
              ))}
              {(!request.memberAvatars || request.memberAvatars.length === 0) && (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <UsersRound className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>
        ) : request.avatar_url ? (
          <img
            src={request.avatar_url}
            alt={request.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
            <User className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-0 rounded-xl md:rounded-2xl ring-2 ring-secondary/60 ring-offset-1 md:ring-offset-2 ring-offset-background animate-pulse" />
        <div className="absolute bottom-1 left-1 right-1 md:bottom-1.5 md:left-1.5 md:right-1.5">
          <p className="text-white font-semibold text-[9px] md:text-[11px] truncate drop-shadow-lg">
            {request.name.split(' ')[0]}
          </p>
        </div>
      </div>
      {/* Type badge */}
      {getTypeBadge(request.type)}
    </div>
  );

  if (totalRequests === 0) {
    return (
      <div className="mb-3 md:mb-5">
        <div className="flex items-center gap-1.5 md:gap-2 mb-2">
          <h2 className="text-xs md:text-sm font-semibold text-foreground">Anmodninger</h2>
        </div>
        <p className="text-xs text-muted-foreground">Ingen nye anmodninger</p>
      </div>
    );
  }

  return (
    <div className="mb-3 md:mb-5">
      <div className="flex items-center justify-between mb-2 md:mb-3">
        <h2 className="text-xs md:text-sm font-semibold text-foreground flex items-center gap-1.5 md:gap-2">
          <span className="relative flex h-2 w-2 md:h-2.5 md:w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 md:h-2.5 md:w-2.5 bg-secondary"></span>
          </span>
          Anmodninger
          <span className="text-[10px] md:text-xs font-normal text-muted-foreground">
            ({totalRequests})
          </span>
        </h2>
        {totalRequests > MOBILE_MAX_VISIBLE && (
          <button
            onClick={() => setShowAllModal(true)}
            className="text-[10px] md:text-xs text-primary hover:text-primary/80 transition-colors font-medium"
          >
            Se alle
          </button>
        )}
      </div>
      
      {/* Unified horizontal scroll - Mobile */}
      <div className="md:hidden overflow-visible">
        <div className="flex items-start gap-2 overflow-x-auto pb-2 pt-1 scrollbar-hide -mx-1 px-1">
          {unifiedRequests.slice(0, MOBILE_MAX_VISIBLE).map((request) => (
            <RequestCard key={`${request.type}-${request.id}`} request={request} />
          ))}
          {totalRequests > MOBILE_MAX_VISIBLE && (
            <button
              onClick={() => setShowAllModal(true)}
              className="w-14 h-16 flex-shrink-0 rounded-xl bg-muted/50 flex items-center justify-center text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              +{totalRequests - MOBILE_MAX_VISIBLE}
            </button>
          )}
        </div>
      </div>

      {/* Unified horizontal scroll - Desktop */}
      <div className="hidden md:block overflow-visible">
        <div className="flex items-start gap-3 overflow-x-auto pb-2 pt-1 scrollbar-hide -mx-1 px-1">
          {unifiedRequests.slice(0, DESKTOP_MAX_VISIBLE).map((request) => (
            <RequestCard key={`${request.type}-${request.id}`} request={request} />
          ))}
          {totalRequests > DESKTOP_MAX_VISIBLE && (
            <button
              onClick={() => setShowAllModal(true)}
              className="w-16 h-20 flex-shrink-0 rounded-2xl bg-muted/50 flex items-center justify-center text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              +{totalRequests - DESKTOP_MAX_VISIBLE}
            </button>
          )}
        </div>
      </div>

      {/* "Show All" Modal */}
      {showAllModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-background rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[80vh] overflow-hidden flex flex-col animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Alle anmodninger ({totalRequests})</h3>
              <button
                onClick={() => setShowAllModal(false)}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-wrap gap-3">
                {unifiedRequests.map((request) => (
                  <RequestCard key={`${request.type}-${request.id}`} request={request} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal for Match Requests */}
      <RequestProfileModal
        request={selectedRequest}
        open={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onAccept={() => {
          if (selectedRequest) {
            onAccept(selectedRequest.id);
            setSelectedRequest(null);
          }
        }}
        onReject={() => {
          if (selectedRequest) {
            onReject(selectedRequest.id);
            setSelectedRequest(null);
          }
        }}
      />

      {/* Group Request Modal with Profile Details */}
      {selectedGroupRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-background rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-scale-in max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <UsersRound className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedGroupRequest.group?.name || "Gruppe"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedGroupRequest.group?.members?.length || 0} {(selectedGroupRequest.group?.members?.length || 0) === 1 ? "medlem" : "medlemmer"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedGroupRequest(null)}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Group members with detailed profiles */}
            <div className="flex-1 overflow-y-auto mb-4">
              {selectedGroupRequest.group?.members && selectedGroupRequest.group.members.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">Medlemmer i gruppen:</p>
                  {selectedGroupRequest.group.members.map((member) => (
                    <div 
                      key={member.user_id} 
                      onClick={() => handleViewProfile(member.user_id)}
                      className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group"
                    >
                      <img
                        src={member.profile?.avatar_url || "/placeholder.svg"}
                        alt={member.profile?.name || "Medlem"}
                        className="w-14 h-14 rounded-xl object-cover flex-shrink-0 group-hover:ring-2 group-hover:ring-primary/50 transition-all"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm group-hover:text-primary transition-colors">
                            {member.profile?.name || "Ukendt"}
                          </p>
                          {member.profile?.age && (
                            <span className="text-xs text-muted-foreground">{member.profile.age} år</span>
                          )}
                          <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        {member.profile?.study && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            📚 {member.profile.study}
                          </p>
                        )}
                        {member.profile?.bio && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {member.profile.bio}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Ingen medlemsoplysninger tilgængelige</p>
                </div>
              )}
            </div>

            {/* Message */}
            {selectedGroupRequest.message && (
              <div className="mb-4 p-3 bg-muted/30 rounded-xl">
                <p className="text-xs font-medium text-muted-foreground mb-1">Besked fra gruppen:</p>
                <p className="text-sm italic">"{selectedGroupRequest.message}"</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  onRejectGroup?.(selectedGroupRequest.id);
                  setSelectedGroupRequest(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                Afvis
              </button>
              <button
                onClick={() => {
                  onAcceptGroup?.(selectedGroupRequest.id);
                  setSelectedGroupRequest(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Accepter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingRequests;
