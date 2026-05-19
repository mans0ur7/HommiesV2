import { useNavigate } from "react-router-dom";

interface RoomieCardProps {
  id?: string;
  name: string;
  occupation: string;
  image: string;
  variant?: "dark" | "light";
}

const RoomieCard = ({ id, name, occupation, image, variant = "dark" }: RoomieCardProps) => {
  const navigate = useNavigate();
  const isDark = variant === "dark";
  
  const handleClick = () => {
    if (id) {
      navigate(`/roomie/${id}`);
    } else {
      // Navigate to explore page with roomies tab
      navigate("/explore?tab=roomies");
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
      <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden mb-3 ring-2 ring-transparent group-hover:ring-secondary group-focus-visible:ring-ring transition-all duration-200 group-hover:shadow-lg">
        <img 
          src={image} 
          alt={`Profilbillede af ${name}`}
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
        />
      </div>
      <h4 className={`font-medium text-sm ${isDark ? "text-white" : "text-foreground"}`}>{name}</h4>
      <p className={`text-xs ${isDark ? "text-white/60" : "text-muted-foreground"}`}>{occupation}</p>
    </div>
  );
};

export default RoomieCard;
