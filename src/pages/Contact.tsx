import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Phone, MapPin, Send, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const Contact = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1000));
    toast({
      title: "Besked sendt!",
      description: "Vi vender tilbage til dig hurtigst muligt.",
    });
    setFormData({ name: "", email: "", subject: "", message: "" });
    setIsSubmitting(false);
  };

  const channels = [
    {
      icon: Mail,
      title: "Email",
      value: "Info@hommies.dk",
      meta: "Svar inden for 24 timer",
      href: "mailto:Info@hommies.dk",
    },
    {
      icon: Phone,
      title: "Telefon",
      value: "+45 42 31 82 06",
      meta: "Man–fre · 09:00 – 17:00",
      href: "tel:+4542318206",
    },
    {
      icon: MapPin,
      title: "Adresse",
      value: "Vestergade 42, 3.",
      meta: "1456 København K",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="px-4 md:px-6 lg:px-12 pt-12 md:pt-20 pb-16 md:pb-24">
        <div className="container mx-auto max-w-7xl">
          {/* ───────── HEADER ───────── */}
          <div className="max-w-3xl mb-12 md:mb-16">
            <span className="inline-flex items-center gap-2 text-xs font-medium text-foreground/60 mb-6">
              <span className="w-6 h-px bg-foreground/30" />
              Kontakt
            </span>
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-foreground leading-[1.05] mb-5">
              Lad os snakke.
            </h1>
            <p className="text-base md:text-lg text-foreground/60 leading-relaxed max-w-xl">
              Spørgsmål, feedback eller bare en idé? Skriv til os — vi læser alt og svarer typisk
              inden for 24 timer på hverdage.
            </p>
          </div>

          {/* ───────── BENTO GRID ───────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4">
            {/* Form card */}
            <div className="lg:col-span-7 rounded-3xl border border-border/60 bg-background p-6 md:p-10">
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight mb-6">
                Send os en besked
              </h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs text-foreground/60">Navn</Label>
                    <Input
                      id="name"
                      placeholder="Dit fulde navn"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs text-foreground/60">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="din@email.dk"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="h-11 rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-xs text-foreground/60">Emne</Label>
                  <Input
                    id="subject"
                    placeholder="Hvad handler din henvendelse om?"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-xs text-foreground/60">Besked</Label>
                  <Textarea
                    id="message"
                    placeholder="Skriv din besked her…"
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    className="rounded-xl resize-none"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 rounded-full bg-foreground text-background hover:bg-foreground/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    "Sender…"
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send besked
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Right column */}
            <div className="lg:col-span-5 grid grid-cols-1 gap-3 md:gap-4">
              {channels.map(({ icon: Icon, title, value, meta, href }) => {
                const inner = (
                  <>
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-foreground group-hover:text-background transition-colors">
                      <Icon className="w-4.5 h-4.5" strokeWidth={1.75} />
                    </div>
                    <div className="mt-5">
                      <p className="text-xs text-foreground/50 mb-1">{title}</p>
                      <p className="text-base font-medium text-foreground">{value}</p>
                      <p className="text-xs text-foreground/50 mt-1">{meta}</p>
                    </div>
                    {href && (
                      <ArrowUpRight className="w-4 h-4 text-foreground/30 absolute top-5 right-5 group-hover:text-foreground transition-colors" />
                    )}
                  </>
                );
                const className =
                  "group relative rounded-3xl border border-border/60 bg-background p-5 md:p-6 hover:border-foreground/20 transition-colors";
                return href ? (
                  <a key={title} href={href} className={className}>
                    {inner}
                  </a>
                ) : (
                  <div key={title} className={className}>
                    {inner}
                  </div>
                );
              })}

              {/* FAQ card */}
              <button
                onClick={() => {
                  navigate("/#faq");
                  setTimeout(() => {
                    document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
                className="group relative rounded-3xl bg-foreground text-background p-5 md:p-6 text-left hover:bg-foreground/90 transition-colors"
              >
                <p className="text-xs text-background/60 mb-2">Hurtigt svar?</p>
                <h3 className="text-lg font-semibold mb-3 leading-snug">
                  Tjek vores FAQ — vi har sikkert svaret.
                </h3>
                <span className="inline-flex items-center gap-1.5 text-sm text-background/80 group-hover:text-background">
                  Se FAQ <ArrowUpRight className="w-4 h-4" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
