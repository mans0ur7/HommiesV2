import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useTranslation } from "react-i18next";
import { User, Sparkles } from "lucide-react";

interface ExploreRoomieCardProps {
  id: string;
  name: string;
  occupation: string;
  image: string;
  age?: number | null;
  onClick?: () => void;
}

const ExploreRoomieCard = ({ id, name, occupation, image, age, onClick }: ExploreRoomieCardProps) => {
  const { t } = useTranslation();
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div 
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      role="button"
      tabIndex={0}
      aria-label={`Se profil for ${name}`}
      className="flex flex-col items-center cursor-pointer group focus-visible:outline-none"
    >
      <div className="relative">
        <Avatar className="w-20 h-20 md:w-28 md:h-28 mb-2 ring-2 md:ring-4 ring-secondary/30 group-hover:ring-secondary group-focus-visible:ring-ring transition-all duration-300">
          {image ? (
            <AvatarImage src={image} alt={`Profilbillede af ${name}`} className="object-cover transition-transform duration-300" />
          ) : null}
          <AvatarFallback className="bg-secondary/20">
            <User className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground" aria-hidden="true" />
          </AvatarFallback>
        </Avatar>
      </div>
      
      <div className="text-center mt-1">
        <h4 className="font-semibold text-xs md:text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
          {name}
          {age && <span className="font-normal text-muted-foreground">, {age}</span>}
        </h4>
        <p className="text-[11px] md:text-xs text-muted-foreground line-clamp-1 flex items-center justify-center gap-1">
          <Sparkles className="w-2.5 h-2.5 md:w-3 md:h-3 text-secondary" aria-hidden="true" />
          {occupation || t("explore.roomieOccupation")}
        </p>
      </div>
    </div>
  );
};

export default ExploreRoomieCard;
