import { Heart, Receipt, ShieldCheck, Sparkles } from "lucide-react";

const features = [
  {
    icon: Heart,
    title: "De bedste værelser til roomies",
    description: "Find verificerede annoncer med rigtige billeder og detaljerede oplysninger om hvert værelse.",
  },
  {
    icon: Receipt,
    title: "Behagelige priser",
    description: "Gennemse værelser der passer til dit budget med gennemsigtige priser og ingen skjulte gebyrer.",
  },
  {
    icon: ShieldCheck,
    title: "Verificerede brugere og trygge samtaler",
    description: "Alle brugere verificeres, og du kan trygt kommunikere direkte med udlejere og roomies.",
  },
];

const AboutSection = () => {
  return (
    <section className="py-6 sm:py-8 px-4 sm:px-6 lg:px-24 bg-background">
      <div className="container mx-auto">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30 flex-1 w-full sm:w-auto"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-secondary to-secondary/80 rounded-lg flex items-center justify-center flex-shrink-0">
                <feature.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground truncate">
                  {feature.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
