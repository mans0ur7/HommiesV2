import { Truck, Package, MapPin, Shield, Clock, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const MovingService = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main>
        {/* Hero Section */}
        <section className="bg-primary py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-secondary/20 px-4 py-2 rounded-full mb-6">
                <Truck className="w-5 h-5 text-secondary" />
                <span className="text-secondary font-medium">Flytteservice</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-6">
                Flyt nemt og billigt med Hommies
              </h1>
              <p className="text-lg md:text-xl text-primary-foreground/80 mb-8">
                Vi hjælper dig med at bære dine ting, så du kan fokusere på det vigtige - dit nye hjem.
              </p>
              <Button 
                size="lg" 
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                onClick={() => window.open("mailto:kontakt@hommies.dk?subject=Flytteservice forespørgsel", "_blank")}
              >
                <Phone className="w-5 h-5 mr-2" />
                Kontakt os for tilbud
              </Button>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
              Sådan fungerer det
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">1. Pak dine ting</h3>
                <p className="text-muted-foreground text-sm">
                  Du pakker dine ejendele i kasser og fortæller os hvilke møbler der skal flyttes.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">2. Angiv destination</h3>
                <p className="text-muted-foreground text-sm">
                  Fortæl os hvor du flytter fra og til, så giver vi dig en fast pris.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">3. Vi klarer resten</h3>
                <p className="text-muted-foreground text-sm">
                  Vores team kommer og bærer alt for dig - sikkert og hurtigt.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 md:py-24 bg-warm">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
              Hvorfor vælge Hommies Flytteservice?
            </h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <div className="flex gap-4 bg-background p-6 rounded-2xl">
                <Shield className="w-8 h-8 text-secondary flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Sikker håndtering</h3>
                  <p className="text-muted-foreground text-sm">
                    Dine ejendele er forsikret under hele flytningen.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 bg-background p-6 rounded-2xl">
                <Clock className="w-8 h-8 text-secondary flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Fleksible tider</h3>
                  <p className="text-muted-foreground text-sm">
                    Vi tilpasser os din tidsplan - også i weekender.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 bg-background p-6 rounded-2xl">
                <Package className="w-8 h-8 text-secondary flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Alt bærearbejde</h3>
                  <p className="text-muted-foreground text-sm">
                    Vi tager os af alle tunge løft, så du slipper.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 bg-background p-6 rounded-2xl">
                <Truck className="w-8 h-8 text-secondary flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Fast pris</h3>
                  <p className="text-muted-foreground text-sm">
                    Ingen overraskelser - du kender prisen på forhånd.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Klar til at flytte?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Kontakt os i dag og få et uforpligtende tilbud på din flytning.
            </p>
            <Button 
              size="lg" 
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
              onClick={() => window.open("mailto:kontakt@hommies.dk?subject=Flytteservice forespørgsel", "_blank")}
            >
              Få et tilbud
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default MovingService;
