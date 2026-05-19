import { LucideIcon, MessageCircle, Home, Users, Search, Heart, Bell, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  variant?: "default" | "muted" | "card";
}

const EmptyState = ({
  icon: Icon = FolderOpen,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  variant = "default",
}: EmptyStateProps) => {
  const navigate = useNavigate();

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (actionHref) {
      navigate(actionHref);
    }
  };

  const containerClasses = {
    default: "py-12 px-6",
    muted: "py-8 px-4 bg-muted/30 rounded-xl",
    card: "py-10 px-6 bg-card border border-border/50 rounded-xl shadow-sm",
  };

  return (
    <div className={`flex flex-col items-center justify-center text-center ${containerClasses[variant]}`}>
      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4 animate-scale-in">
        <Icon className="w-8 h-8 text-muted-foreground/60" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2 animate-fade-in">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-4 animate-fade-in" style={{ animationDelay: "100ms" }}>
        {description}
      </p>
      {actionLabel && (
        <Button 
          onClick={handleAction}
          variant="outline"
          className="animate-fade-in-up"
          style={{ animationDelay: "200ms" }}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

// Pre-configured empty states for common scenarios
export const EmptyConversations = () => (
  <EmptyState
    icon={MessageCircle}
    title="Ingen samtaler endnu"
    description="Start en samtale ved at kontakte en bolig eller roomie"
    actionLabel="Udforsk boliger"
    actionHref="/explore"
  />
);

export const EmptyProperties = () => (
  <EmptyState
    icon={Home}
    title="Ingen boliger fundet"
    description="Prøv at ændre dine filtre eller søg i et andet område"
    actionLabel="Nulstil filtre"
  />
);

export const EmptyRoomies = () => (
  <EmptyState
    icon={Users}
    title="Ingen roomies fundet"
    description="Der er ingen roomies der matcher dine kriterier lige nu"
    actionLabel="Tilpas filtre"
  />
);

export const EmptyMatches = () => (
  <EmptyState
    icon={Heart}
    title="Ingen matches endnu"
    description="Swipe på roomies og boliger for at finde dit perfekte match"
    actionLabel="Find matches"
    actionHref="/matches"
  />
);

export const EmptyGroups = () => (
  <EmptyState
    icon={Users}
    title="Ingen grupper endnu"
    description="Opret en gruppe og inviter dine venner til at søge bolig sammen"
    actionLabel="Opret gruppe"
  />
);

export const EmptyNotifications = () => (
  <EmptyState
    icon={Bell}
    title="Ingen notifikationer"
    description="Du er helt opdateret! Vi giver dig besked når der sker noget nyt"
    variant="muted"
  />
);

export const EmptySearchResults = () => (
  <EmptyState
    icon={Search}
    title="Ingen resultater"
    description="Prøv at søge efter noget andet eller tjek dine filtre"
  />
);

export const EmptyFavorites = () => (
  <EmptyState
    icon={Heart}
    title="Ingen favoritter endnu"
    description="Gem de boliger du kan lide ved at trykke på hjertet"
    actionLabel="Udforsk boliger"
    actionHref="/explore"
  />
);

export default EmptyState;
