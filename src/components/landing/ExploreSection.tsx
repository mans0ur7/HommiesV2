import { useNavigate } from "react-router-dom";
import copenhagenImg from "@/assets/cities/copenhagen.jpg";
import aarhusImg from "@/assets/cities/aarhus.jpg";
import odenseImg from "@/assets/cities/odense.jpg";
import aalborgImg from "@/assets/cities/aalborg.jpg";
import roskildeImg from "@/assets/cities/roskilde.jpg";
import amagerImg from "@/assets/cities/amager.jpg";
import lyngbyImg from "@/assets/cities/lyngby.jpg";

const cities = [
  { name: "København", image: copenhagenImg, count: 124 },
  { name: "Aarhus", image: aarhusImg, count: 89 },
  { name: "Odense", image: odenseImg, count: 67 },
  { name: "Aalborg", image: aalborgImg, count: 45 },
  { name: "Roskilde", image: roskildeImg, count: 32 },
  { name: "Amager", image: amagerImg, count: 28 },
  { name: "Lyngby", image: lyngbyImg, count: 41 },
];

const ExploreSection = () => {
  const navigate = useNavigate();
  const go = (city: string) =>
    navigate(`/explore?city=${encodeURIComponent(city)}`);

  // Layout: row 1 = København (large 2-col) + Aarhus + Odense
  //         row 2 = Aalborg + Roskilde + Amager + Lyngby (4 small)
  const [kbh, aar, ode, aal, ros] = cities;

  return (
    <section className="bg-secondary/30 py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 sm:mb-10 gap-4">
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
              Udforsk danske byer
            </h2>
            <p className="mt-2 text-muted-foreground text-sm sm:text-base">
              Vælg din by og se hvad der er ledigt lige nu.
            </p>
          </div>
        </div>

        {/* Mosaic */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <CityTile city={kbh} className="col-span-2 row-span-2 aspect-[4/5] lg:aspect-auto" onClick={go} />
          <CityTile city={aar} className="aspect-square" onClick={go} />
          <CityTile city={ode} className="aspect-square" onClick={go} />
          <CityTile city={aal} className="aspect-square" onClick={go} />
          <CityTile city={ros} className="aspect-square" onClick={go} />
        </div>
      </div>
    </section>
  );
};

const CityTile = ({
  city,
  className = "",
  onClick,
}: {
  city: { name: string; image: string; count: number };
  className?: string;
  onClick: (n: string) => void;
}) => (
  <button
    onClick={() => onClick(city.name)}
    className={`group relative overflow-hidden rounded-2xl bg-muted text-left ${className}`}
  >
    <img
      src={city.image}
      alt={city.name}
      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      loading="lazy"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
    <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2 text-background">
      <h3 className="text-xl sm:text-2xl font-semibold tracking-tight">{city.name}</h3>
      <span className="text-xs opacity-80 mb-1">{city.count} værelser</span>
    </div>
  </button>
);

export default ExploreSection;
