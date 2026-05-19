import { HousingGroup } from "@/hooks/useHousingGroups";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, MapPin, Wallet, Home, MoreVertical, Trash2, LogOut, Pencil } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

interface GroupCardProps {
  group: HousingGroup;
  onInvite: (group: HousingGroup) => void;
  onDelete: (groupId: string) => void;
  onLeave: (groupId: string) => void;
  onBrowseProperties: (group: HousingGroup) => void;
  onEdit: (group: HousingGroup) => void;
}

const GroupCard = ({
  group,
  onInvite,
  onDelete,
  onLeave,
  onBrowseProperties,
  onEdit,
}: GroupCardProps) => {
  const { user } = useAuth();
  const isCreator = group.created_by === user?.id;
  
  const acceptedMembers = group.members.filter(m => m.status === "accepted");
  const pendingMembers = group.members.filter(m => m.status === "pending");

  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{group.name}</h3>
            <p className="text-xs text-muted-foreground">
              {acceptedMembers.length} medlem{acceptedMembers.length !== 1 ? "mer" : ""}
              {pendingMembers.length > 0 && ` · ${pendingMembers.length} afventer`}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isCreator && (
              <DropdownMenuItem onClick={() => onEdit(group)}>
                <Pencil className="w-4 h-4 mr-2" />
                Rediger gruppe
              </DropdownMenuItem>
            )}
            {isCreator ? (
              <DropdownMenuItem
                onClick={() => onDelete(group.id)}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Slet gruppe
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onLeave(group.id)}>
                <LogOut className="w-4 h-4 mr-2" />
                Forlad gruppe
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Details */}
      <div className="flex flex-wrap gap-2 mb-4">
        {group.city && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {group.city}
          </Badge>
        )}
        {group.budget_per_person && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Wallet className="w-3 h-3" />
            {group.budget_per_person.toLocaleString()} kr/md pr. person
          </Badge>
        )}
        {group.desired_rooms && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Home className="w-3 h-3" />
            {group.desired_rooms} værelser
          </Badge>
        )}
      </div>

      {/* Members avatars */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex -space-x-2">
          {acceptedMembers.slice(0, 4).map((member) => (
            <div
              key={member.id}
              className="w-8 h-8 rounded-full border-2 border-background overflow-hidden"
              title={member.profile?.name}
            >
              {member.profile?.avatar_url ? (
                <img
                  src={member.profile.avatar_url}
                  alt={member.profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center text-xs font-medium">
                  {member.profile?.name?.charAt(0) || "?"}
                </div>
              )}
            </div>
          ))}
          {acceptedMembers.length > 4 && (
            <div className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium">
              +{acceptedMembers.length - 4}
            </div>
          )}
        </div>
        {pendingMembers.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {pendingMembers.length} afventer
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onInvite(group)}
        >
          <Users className="w-4 h-4 mr-2" />
          Inviter
        </Button>
        <Button
          size="sm"
          className="flex-1"
          onClick={() => onBrowseProperties(group)}
        >
          <Home className="w-4 h-4 mr-2" />
          Find bolig
        </Button>
      </div>
    </div>
  );
};

export default GroupCard;
