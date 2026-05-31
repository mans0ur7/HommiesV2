import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Search, Heart, FileSignature, ArrowRight } from "lucide-react";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Button } from "@/components/ui/button";
import { isNativeApp } from "@/lib/native";

export const ONBOARDING_SEEN_KEY = "hommies_onboarding_seen";

const slides = [
  {
    icon: Search,
    title: "Find dit næste hjem",
    description:
      "Værelser, lejligheder og bofællesskaber over hele Danmark – samlet ét sted.",
  },
  {
    icon: Heart,
    title: "Match med de rette roomies",
    description:
      "Swipe dig frem til folk, der passer til din hverdag, din økonomi og din stil.",
  },
  {
    icon: FileSignature,
    title: "Chat & underskriv digitalt",
    description:
      "Skriv sammen, søg bolig i grupper og underskriv lejekontrakten direkte i appen.",
  },
];

const Onboarding = ({ onDone }: { onDone: () => void }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selected, setSelected] = useState(0);

  // Light status-bar icons while the dark onboarding background is shown
  useEffect(() => {
    if (!isNativeApp()) return;
    StatusBar.setStyle({ style: Style.Dark });
    return () => {
      StatusBar.setStyle({ style: Style.Light });
    };
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  const isLast = selected === slides.length - 1;

  const handleNext = useCallback(() => {
    if (isLast) {
      onDone();
    } else {
      emblaApi?.scrollNext();
    }
  }, [isLast, emblaApi, onDone]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-primary text-primary-foreground">
      {/* Top bar: logo + skip */}
      <div className="safe-area-top flex items-center justify-between px-6 pt-4">
        <div className="flex items-center gap-2">
          <img src="/hommies-icon.png" alt="" className="h-7 w-7 rounded-lg" />
          <span className="text-lg font-bold tracking-tight text-primary-foreground">Hommies</span>
        </div>
        <button
          onClick={onDone}
          className="text-sm font-medium text-primary-foreground/60 hover:text-primary-foreground"
        >
          Spring over
        </button>
      </div>

      {/* Slides */}
      <div className="flex-1 overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map(({ icon: Icon, title, description }, i) => (
            <div
              key={i}
              className="flex-[0_0_100%] min-w-0 h-full flex flex-col items-center justify-center px-10 text-center"
            >
              <div className="w-24 h-24 rounded-3xl bg-accent flex items-center justify-center mb-10">
                <Icon className="w-11 h-11 text-accent-foreground" strokeWidth={1.75} />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight mb-4 max-w-xs">
                {title}
              </h1>
              <p className="text-primary-foreground/70 text-base leading-relaxed max-w-xs">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer: dots + next */}
      <div
        className="px-8 pt-4"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 2.5rem)" }}
      >
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              aria-label={`Gå til slide ${i + 1}`}
              className={`h-2 rounded-full transition-all ${
                i === selected ? "w-7 bg-accent" : "w-2 bg-primary-foreground/30"
              }`}
            />
          ))}
        </div>
        <Button
          onClick={handleNext}
          className="w-full h-12 rounded-full bg-background text-foreground hover:bg-background/90 text-base font-medium"
        >
          {isLast ? "Kom i gang" : "Næste"}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
