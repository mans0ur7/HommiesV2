import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Hvordan virker det?",
    answer:
      "Opret en gratis profil, gennemse ledige værelser eller find roomies, og kom i kontakt med potentielle matches. Du kan sende anmodninger og starte samtaler direkte på platformen.",
  },
  {
    question: "Er Hommies gratis at bruge?",
    answer:
      "Ja. Det er gratis at oprette profil, gennemse annoncer, kontakte udlejere og finde roomies. Vi forbinder dig med de rette mennesker uden skjulte gebyrer.",
  },
  {
    question: "Hvordan finder jeg en roomie?",
    answer:
      "Gå til Matches og vælg 'Roomies' for at se profiler. Send en anmodning, og hvis de accepterer, kan I starte en samtale.",
  },
  {
    question: "Hvordan kontakter jeg en udlejer?",
    answer:
      "Når du finder et værelse du kan lide, kan du sende en anmodning. Hvis udlejer accepterer, åbnes en chat hvor I kan aftale visning og detaljer.",
  },
  {
    question: "Hvordan opretter jeg en værelsesannonce?",
    answer:
      "Klik på 'Opret annonce' i menuen og følg de enkle trin. Upload billeder, tilføj detaljer og pris. Din annonce bliver synlig med det samme.",
  },
  {
    question: "Er brugerne på Hommies verificerede?",
    answer:
      "Ja, vi gennemgår alle brugere før de kan kontakte andre, så du kan bruge platformen i tryghed.",
  },
];

const FAQSection = () => {
  const left = faqs.slice(0, Math.ceil(faqs.length / 2));
  const right = faqs.slice(Math.ceil(faqs.length / 2));

  return (
    <section id="faq" className="bg-background py-14 sm:py-20 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1fr_1.6fr] gap-10 lg:gap-16">
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
              Ofte stillede
              <br />
              spørgsmål
            </h2>
            <p className="mt-3 text-muted-foreground text-base">
              Mangler du svar? Skriv til os på{" "}
              <a href="mailto:hej@hommies.dk" className="underline underline-offset-4 text-foreground hover:text-primary">
                hej@hommies.dk
              </a>
              .
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2">
            {[left, right].map((col, idx) => (
              <Accordion key={idx} type="single" collapsible className="space-y-1">
                {col.map((faq, i) => (
                  <AccordionItem
                    key={i}
                    value={`item-${idx}-${i}`}
                    className="border-b border-border last:border-b-0"
                  >
                    <AccordionTrigger className="text-left text-base font-medium text-foreground hover:no-underline py-5">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-5">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
