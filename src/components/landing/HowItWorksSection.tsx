import { useNavigate } from "react-router-dom";
import { UserCircle2, Sparkles, MessageSquare, ArrowRight, Check } from "lucide-react";

const HowItWorksSection = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-background py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-2xl mb-10 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
            Sådan virker Hommies
          </h2>
          <p className="mt-3 text-muted-foreground text-base sm:text-lg">
            Tre trin fra profil til indflytning. Helt gratis at komme i gang.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
          {/* Step 1 — wide */}
          <div className="lg:col-span-3 lg:row-span-2 rounded-3xl bg-card border border-border p-6 sm:p-8 flex flex-col justify-between min-h-[320px] overflow-hidden">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-muted-foreground tracking-wider">01</span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <div className="mt-6 mb-8">
              <h3 className="text-xl sm:text-2xl font-semibold text-foreground">
                Opret en profil — på 2 minutter
              </h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-md">
                Fortæl lidt om dig selv, dine interesser og hvad du leder efter. Det hjælper med at finde de rigtige matches.
              </p>
            </div>
            {/* Mock profile card */}
            <div className="bg-background border border-border rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                <UserCircle2 className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground">Mia, 24</div>
                <div className="text-xs text-muted-foreground">Studerende · København</div>
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-600">
                <Check className="w-3.5 h-3.5" />
                Verificeret
              </div>
            </div>
          </div>

          {/* Step 2 — tall */}
          <div className="lg:col-span-3 rounded-3xl bg-primary text-primary-foreground p-6 sm:p-8 flex flex-col justify-between min-h-[200px] overflow-hidden">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-primary-foreground/60 tracking-wider">02</span>
              <span className="h-px flex-1 bg-primary-foreground/20" />
            </div>
            <div className="mt-4">
              <h3 className="text-xl sm:text-2xl font-semibold">
                Match med roomies eller værelser
              </h3>
              <p className="mt-2 text-sm text-primary-foreground/70 max-w-md">
                Swipe, like og find folk og boliger der passer dig. Vi viser kun det relevante.
              </p>
            </div>
            <div className="mt-5 flex -space-x-2">
              {["bg-secondary", "bg-secondary/70", "bg-secondary/50"].map((bg, i) => (
                <div
                  key={i}
                  className={`w-10 h-10 rounded-full ${bg} border-2 border-primary flex items-center justify-center`}
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
              ))}
              <div className="w-10 h-10 rounded-full bg-primary-foreground/10 border-2 border-primary flex items-center justify-center text-xs font-medium">
                +12
              </div>
            </div>
          </div>

          {/* Step 3 — square with CTA */}
          <div className="lg:col-span-3 rounded-3xl bg-secondary/40 border border-border p-6 sm:p-8 flex flex-col justify-between min-h-[200px]">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-muted-foreground tracking-wider">03</span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <div className="mt-4">
              <h3 className="text-xl sm:text-2xl font-semibold text-foreground">
                Skriv & flyt ind
              </h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-md">
                Tag kontakt direkte i appen, aftal visning og få styr på kontrakten. Helt trygt.
              </p>
            </div>

            <div className="mt-5 bg-card border border-border rounded-2xl p-3 flex items-center gap-3 shadow-sm">
              <MessageSquare className="w-4 h-4 text-primary shrink-0" />
              <div className="flex-1 text-xs text-muted-foreground truncate">
                "Hej! Værelset er stadig ledigt — kan vi se det på lørdag?"
              </div>
            </div>

            <button
              onClick={() => navigate("/auth?mode=signup")}
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors w-fit"
            >
              Kom i gang gratis
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
