import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Users, UsersRound, X, User, ExternalLink } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
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

const MAX_VISIBLE = 8;

const TYPE_META: Record<UnifiedRequest["type"], { label: string; icon: typeof Home; chip: string }> = {
  landlord: { label: "Udlejer", icon: Home, chip: "bg-foreground text-background" },
  roomie: { label: "Roomie", icon: Users, chip: "bg-secondary text-secondary-foreground" },
  group: { label: "Gruppe", icon: UsersRound, chip: "bg-muted text-foreground" },
};

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
  const isMobile = useIsMobile();
  const [selectedRequest, setSelectedRequest] = useState<MatchRequest | null>(null);
  const [selectedGroupRequest, setSelectedGroupRequest] = useState<GroupRequest | null>(null);
  const [showAllSheet, setShowAllSheet] = useState(false);

  const handleViewProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  // Create unified list of all requests
  const unifiedRequests: UnifiedRequest[] = [
    ...landlordRequests.map((req) => ({
      id: req.id,
      type: "landlord" as const,
      name: req.sender.name,
      avatar_url: req.sender.avatar_url,
      age: req.sender.age,
      study: req.sender.study,
      originalMatch: req,
    })),
    ...roomieRequests.map((req) => ({
      id: req.id,
      type: "roomie" as const,
      name: req.sender.name,
      avatar_url: req.sender.avatar_url,
      age: req.sender.age,
      study: req.sender.study,
      originalMatch: req,
    })),
    // Only show group requests to landlords
    ...(isLandlord
      ? groupRequests.map((req) => ({
          id: req.id,
          type: "group" as const,
          name: req.group?.name || "Gruppe",
          avatar_url: null,
          age: null,
          study: null,
          originalGroup: req,
          memberAvatars: req.group?.members.map((m) => m.profile?.avatar_url || null) || [],
        }))
      : []),
  ];

  const totalRequests = unifiedRequests.length;

  const handleRequestClick = (request: UnifiedRequest) => {
    setShowAllSheet(false);
    if (request.type === "group" && request.originalGroup) {
      setSelectedGroupRequest(request.originalGroup);
    } else if (request.originalMatch) {
      setSelectedRequest(request.originalMatch);
    }
  };

  // Circular avatar with a small type badge — used in the horizontal strip.
  const RequestAvatar = ({ request, size = "md" }: { request: UnifiedRequest; size?: "md" | "sm" }) => {
    const meta = TYPE_META[request.type];
    const Icon = meta.icon;
    const dim = size === "md" ? "w-14 h-14" : "w-11 h-11";
    return (
      <div className="relative">
        <div className={cn(dim, "rounded-full overflow-hidden bg-muted border border-border/60 group-hover:border-foreground/40 transition-colors")}>
          {request.type === "group" ? (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <UsersRound className="w-5 h-5 text-foreground/50" />
            </div>
          ) : request.avatar_url ? (
            <img src={request.avatar_url} alt={request.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-5 h-5 text-foreground/40" />
            </div>
          )}
        </div>
        <span className={cn("absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-background flex items-center justify-center", meta.chip)}>
          <Icon className="w-2 h-2" />
        </span>
      </div>
    );
  };

  if (totalRequests === 0) {
    return (
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-px w-8 bg-foreground/40" />
          <span className="text-[11px] uppercase tracking-[0.2em] text-foreground/60">Anmodninger</span>
        </div>
        <p className="text-xs text-foreground/50">Ingen nye anmodninger</p>
      </div>
    );
  }

  return (
    <div className="mb-5">
      {/* Editorial header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="h-px w-8 bg-foreground/40" />
          <span className="text-[11px] uppercase tracking-[0.2em] text-foreground/60">Anmodninger</span>
          <span className="text-[11px] text-foreground/40">{totalRequests}</span>
        </div>
        <button
          onClick={() => setShowAllSheet(true)}
          className="text-xs font-medium text-foreground/60 hover:text-foreground transition-colors"
        >
          Se alle anmodninger
        </button>
      </div>

      {/* Horizontal strip of circular avatars */}
      <div className="flex items-start gap-4 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
        {unifiedRequests.slice(0, MAX_VISIBLE).map((request) => (
          <button
            key={`${request.type}-${request.id}`}
            onClick={() => handleRequestClick(request)}
            className="flex flex-col items-center gap-1.5 w-14 shrink-0 group"
          >
            <RequestAvatar request={request} />
            <span className="text-[11px] text-foreground/70 truncate max-w-full">
              {request.name.split(" ")[0]}
            </span>
          </button>
        ))}
        {totalRequests > MAX_VISIBLE && (
          <button
            onClick={() => setShowAllSheet(true)}
            className="flex flex-col items-center gap-1.5 w-14 shrink-0"
          >
            <div className="w-14 h-14 rounded-full border border-dashed border-border/70 flex items-center justify-center text-xs font-medium text-foreground/60">
              +{totalRequests - MAX_VISIBLE}
            </div>
            <span className="text-[11px] text-foreground/50">Se alle</span>
          </button>
        )}
      </div>

      {/* "See all" — bottom sheet on mobile, side panel on desktop, as a clean list */}
      <Sheet open={showAllSheet} onOpenChange={setShowAllSheet}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={cn(
            "p-0 gap-0 bg-background flex flex-col",
            isMobile ? "h-[80vh] rounded-t-3xl" : "w-full sm:max-w-md border-l border-border/60"
          )}
        >
          <SheetHeader className="px-6 pt-6 pb-5 border-b border-border/60 text-left space-y-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-px w-8 bg-foreground/40" />
              <span className="text-[11px] uppercase tracking-[0.2em] text-foreground/60">Anmodninger</span>
            </div>
            <SheetTitle className="text-3xl font-medium tracking-tight text-foreground">
              Alle anmodninger.
            </SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto px-4 py-4 flex-1 space-y-6">
            {([
              { key: "roomie", label: "Roomies", items: unifiedRequests.filter((r) => r.type === "roomie") },
              { key: "landlord", label: "Udlejere", items: unifiedRequests.filter((r) => r.type === "landlord") },
              { key: "group", label: "Grupper", items: unifiedRequests.filter((r) => r.type === "group") },
            ] as const)
              .filter((section) => section.items.length > 0)
              .map((section) => (
                <div key={section.key}>
                  <div className="flex items-center gap-3 px-2 mb-2">
                    <div className="h-px w-8 bg-foreground/40" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-foreground/60">{section.label}</span>
                    <span className="text-[11px] text-foreground/40">{section.items.length}</span>
                  </div>
                  <div className="space-y-1">
                    {section.items.map((request) => {
                      const meta = TYPE_META[request.type];
                      return (
                        <button
                          key={`${request.type}-${request.id}`}
                          onClick={() => handleRequestClick(request)}
                          className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-muted/60 transition-colors text-left group"
                        >
                          <RequestAvatar request={request} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">{request.name}</p>
                            {request.study && (
                              <p className="text-xs text-foreground/50 truncate">{request.study}</p>
                            )}
                          </div>
                          <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0", meta.chip)}>
                            {meta.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        </SheetContent>
      </Sheet>

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

      {/* Group Request — bottom sheet on mobile, side panel on desktop */}
      <Sheet open={!!selectedGroupRequest} onOpenChange={(o) => !o && setSelectedGroupRequest(null)}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={cn(
            "p-0 gap-0 bg-background flex flex-col",
            isMobile ? "h-[85vh] rounded-t-3xl" : "w-full sm:max-w-md border-l border-border/60"
          )}
        >
          {selectedGroupRequest && (
            <>
              <SheetHeader className="px-6 pt-6 pb-5 border-b border-border/60 text-left space-y-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-px w-8 bg-foreground/40" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-foreground/60">Gruppeanmodning</span>
                </div>
                <SheetTitle className="text-2xl font-medium tracking-tight text-foreground">
                  {selectedGroupRequest.group?.name || "Gruppe"}
                </SheetTitle>
                <p className="text-sm text-foreground/60">
                  {selectedGroupRequest.group?.members?.length || 0}{" "}
                  {(selectedGroupRequest.group?.members?.length || 0) === 1 ? "medlem" : "medlemmer"}
                </p>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto px-6 py-5">
                {selectedGroupRequest.group?.members && selectedGroupRequest.group.members.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-foreground/60 mb-3">Medlemmer</p>
                    {selectedGroupRequest.group.members.map((member) => (
                      <div
                        key={member.user_id}
                        onClick={() => handleViewProfile(member.user_id)}
                        className="flex items-start gap-3 p-3 rounded-2xl border border-border/60 hover:border-foreground/30 transition-colors cursor-pointer group"
                      >
                        <img
                          src={member.profile?.avatar_url || "/placeholder.svg"}
                          alt={member.profile?.name || "Medlem"}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0 bg-muted"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm text-foreground">{member.profile?.name || "Ukendt"}</p>
                            {member.profile?.age && (
                              <span className="text-xs text-foreground/50">{member.profile.age} år</span>
                            )}
                            <ExternalLink className="w-3 h-3 text-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          {member.profile?.study && (
                            <p className="text-xs text-foreground/50 mt-0.5 truncate">{member.profile.study}</p>
                          )}
                          {member.profile?.bio && (
                            <p className="text-xs text-foreground/50 mt-1 line-clamp-2">{member.profile.bio}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-foreground/50">
                    <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Ingen medlemsoplysninger tilgængelige</p>
                  </div>
                )}

                {selectedGroupRequest.message && (
                  <div className="mt-5 p-4 rounded-2xl bg-muted/50">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-foreground/60 mb-1">Besked fra gruppen</p>
                    <p className="text-sm text-foreground/80">"{selectedGroupRequest.message}"</p>
                  </div>
                )}
              </div>

              <div className="border-t border-border/60 px-6 pt-4 pb-[calc(1rem+var(--safe-bottom))] flex gap-3 bg-background">
                <button
                  onClick={() => {
                    onRejectGroup?.(selectedGroupRequest.id);
                    setSelectedGroupRequest(null);
                  }}
                  className="flex-1 py-2.5 rounded-full border border-border/60 text-sm font-medium text-foreground/70 hover:bg-muted transition-colors"
                >
                  Afvis
                </button>
                <button
                  onClick={() => {
                    onAcceptGroup?.(selectedGroupRequest.id);
                    setSelectedGroupRequest(null);
                  }}
                  className="flex-1 py-2.5 rounded-full bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-colors"
                >
                  Accepter
                </button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default PendingRequests;
