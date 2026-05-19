import { Button } from "@/components/ui/button";
import { ArrowRight, Users } from "lucide-react";

interface FocusHeroBannerProps {
  onCreateGroup: () => void;
}

const FocusHeroBanner = ({ onCreateGroup }: FocusHeroBannerProps) => {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-background p-8 md:p-12 mb-10">
      <div className="grid md:grid-cols-2 gap-8 items-center relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-foreground/40" />
            <span className="text-xs uppercase tracking-[0.2em] text-foreground/60">Sammen er bedre</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight leading-[1.05] mb-4">
            Saml jeres gruppe.
          </h2>
          <p className="text-foreground/60 mb-6 max-w-md">
            Opret en fokusgruppe med matchende personligheder — eller invitér venner udefra og søg sammen.
          </p>
          <Button
            onClick={onCreateGroup}
            className="rounded-full bg-foreground text-background hover:bg-foreground/90 h-11 px-5"
          >
            Opret gruppe
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Editorial graphic */}
        <div className="hidden md:flex justify-end items-center pr-4">
          <div className="relative w-64 h-64">
            <div className="absolute inset-0 rounded-full border border-dashed border-foreground/15" />
            <div className="absolute inset-8 rounded-full border border-foreground/10" />
            <div className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              <Users className="w-8 h-8 text-foreground/70" />
            </div>
            <div className="absolute top-4 right-8 w-12 h-12 rounded-full bg-muted border border-border/60" />
            <div className="absolute bottom-6 left-4 w-10 h-10 rounded-full bg-muted border border-border/60" />
            <div className="absolute top-1/2 -right-2 w-9 h-9 rounded-full bg-muted border border-border/60" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FocusHeroBanner;
