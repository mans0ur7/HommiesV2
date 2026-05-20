import { Truck, ArrowUpRight, Tag } from "lucide-react";

export default function PartnerBanner() {
  return (
    <section className="px-4 md:px-6 lg:px-12 py-10 md:py-14">
      <div className="container mx-auto max-w-7xl">
        <a
          href="https://hejoscar.dk/"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex flex-col sm:flex-row items-start sm:items-center gap-5 rounded-3xl border border-border/60 bg-muted/30 hover:bg-muted/60 hover:border-foreground/20 transition-all p-6 md:p-8 overflow-hidden"
        >
          {/* Decorative background element */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none flex items-center justify-end pr-8">
            <Truck className="w-48 h-48 text-foreground" />
          </div>

          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-foreground text-background flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Truck className="w-6 h-6" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-foreground/50">
                <span className="w-4 h-px bg-foreground/30" />
                Partnerfordel
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-foreground text-background text-xs font-semibold px-2.5 py-0.5">
                <Tag className="w-3 h-3" />
                10% rabat
              </span>
            </div>
            <h3 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground leading-snug">
              Skal du flytte? Spar 10% på biludlejning.
            </h3>
            <p className="mt-1.5 text-sm text-foreground/60 max-w-lg">
              Som Hommies-bruger får du 10% rabat hos Oscars Biludlejning — uanset om du lejer
              ud eller lejer ind. Nemt, hurtigt og til en god pris.
            </p>
            <p className="mt-2 text-xs text-foreground/40">Via vores partner · oscarsbiludlejning.dk</p>
          </div>

          {/* Arrow */}
          <ArrowUpRight className="w-5 h-5 text-foreground/30 group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 self-start sm:self-center" />
        </a>
      </div>
    </section>
  );
}
