import { useTranslation } from "react-i18next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQSection = () => {
  const { t } = useTranslation();
  const faqs = [
    { question: t("landing.faqQ1"), answer: t("landing.faqA1") },
    { question: t("landing.faqQ2"), answer: t("landing.faqA2") },
    { question: t("landing.faqQ3"), answer: t("landing.faqA3") },
    { question: t("landing.faqQ4"), answer: t("landing.faqA4") },
    { question: t("landing.faqQ5"), answer: t("landing.faqA5") },
    { question: t("landing.faqQ6"), answer: t("landing.faqA6") },
  ];
  const left = faqs.slice(0, Math.ceil(faqs.length / 2));
  const right = faqs.slice(Math.ceil(faqs.length / 2));

  return (
    <section id="faq" className="bg-background py-14 sm:py-20 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1fr_1.6fr] gap-10 lg:gap-16">
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
              {t("landing.faqHeader")}
            </h2>
            <p className="mt-3 text-muted-foreground text-base">
              {t("landing.faqBody")}{" "}
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
