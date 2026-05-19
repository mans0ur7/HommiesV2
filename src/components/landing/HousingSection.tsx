import { useNavigate } from "react-router-dom";
import { ShieldCheck, MapPin, MessageCircle, Star, ArrowUpRight } from "lucide-react";
import housing1 from "@/assets/housing/housing-1.png";
import housing3 from "@/assets/housing/housing-3.png";

const HousingSection = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-background py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 sm:mb-10 gap-4">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
              Bygget til mennesker, ikke annoncer
            </h2>
            <p className="mt-3 text-muted-foreground text-base sm:text-lg">
              Verificerede profiler, direkte kommunikation og fokus på at finde det rigtige match — ikke bare det første.
            </p>
          </div>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-4 auto-rows-[180px]">
          {/* Big photo tile */}
          <div className="sm:col-span-4 sm:row-span-2 relative overflow-hidden rounded-3xl bg-muted">
            <img src={housing1} alt="Hyggeligt værelse" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-background">
              <div className="text-xs uppercase tracking-wider opacity-80 mb-1">Værelser</div>
              <div className="text-2xl sm:text-3xl font-semibold tracking-tight">
                Fra hyggelige tagværelser til store delelejligheder
              </div>
            </div>
          </div>

          {/* Verified tile */}
          <div className="sm:col-span-2 rounded-3xl bg-card border border-border p-6 flex flex-col justify-between">
            <ShieldCheck className="w-7 h-7 text-primary" />
            <div>
              <div className="font-semibold text-foreground">Verificerede profiler</div>
              <p className="text-sm text-muted-foreground mt-1">
                Alle brugere godkendes før de kan kontakte andre.
              </p>
            </div>
          </div>

          {/* Map tile */}
          <div className="sm:col-span-2 rounded-3xl bg-secondary/40 border border-border p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage:
                "radial-gradient(circle at 30% 30%, hsl(var(--primary)/0.4) 0, transparent 40%), radial-gradient(circle at 70% 60%, hsl(var(--primary)/0.3) 0, transparent 35%)",
            }} />
            <MapPin className="w-7 h-7 text-primary relative" />
            <div className="relative">
              <div className="font-semibold text-foreground">Hele Danmark</div>
              <p className="text-sm text-muted-foreground mt-1">
                København, Aarhus, Odense, Aalborg og 50+ andre byer.
              </p>
            </div>
          </div>

          {/* Testimonial tile */}
          <div className="sm:col-span-3 rounded-3xl bg-primary text-primary-foreground p-6 flex flex-col justify-between">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-secondary text-secondary" />
              ))}
            </div>
            <p className="text-base sm:text-lg leading-relaxed">
              "Fandt min roomie på en uge. Vi flyttede sammen en måned senere — bedste beslutning."
            </p>
            <div className="text-sm text-primary-foreground/70">— Sofie, 26 · Aarhus</div>
          </div>

          {/* Photo + chat */}
          <div className="sm:col-span-3 grid grid-cols-2 gap-4">
            <div className="relative overflow-hidden rounded-3xl bg-muted">
              <img src={housing3} alt="Fælles stue" className="absolute inset-0 w-full h-full object-cover" />
            </div>
            <div className="rounded-3xl bg-card border border-border p-5 flex flex-col justify-between">
              <MessageCircle className="w-6 h-6 text-primary" />
              <div>
                <div className="font-semibold text-foreground text-sm">Direkte kontakt</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Skriv direkte til udlejere og roomies — ingen ventetid.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={() => navigate("/explore")}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-6 py-3 font-medium hover:bg-primary/90 transition-colors"
          >
            Udforsk værelser
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HousingSection;
