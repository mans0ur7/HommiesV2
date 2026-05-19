import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import AppLayout from "@/components/navigation/AppLayout";
import { useIsMobile } from "@/hooks/use-mobile";

const Privacy = () => {
  const isMobile = useIsMobile();
  
  return (
    <AppLayout>
    <div className="min-h-screen bg-background">
      {!isMobile && <Navbar />}
      
      <main className="py-16 lg:py-24 px-6 lg:px-24">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Privatlivspolitik</h1>
            <p className="text-muted-foreground">Sidst opdateret: Januar 2025</p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">1. Introduktion</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Hos Hommies tager vi dit privatliv alvorligt. Denne privatlivspolitik forklarer, 
                hvordan vi indsamler, bruger og beskytter dine personlige oplysninger, når du bruger 
                vores platform.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Ved at bruge Hommies accepterer du vilkårene i denne privatlivspolitik. Hvis du ikke 
                er enig i politikken, bedes du undlade at bruge vores tjenester.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">2. Hvilke data indsamler vi?</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Vi indsamler forskellige typer oplysninger for at kunne levere vores tjenester:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong className="text-foreground">Kontooplysninger:</strong> Navn, email, telefonnummer og profilbillede.</li>
                <li><strong className="text-foreground">Profildata:</strong> Alder, køn, studie/arbejde, nationalitet, personlighed og livsstilspræferencer.</li>
                <li><strong className="text-foreground">Værelsesoplysninger:</strong> Hvis du er udlejer, indsamler vi information om dine værelser.</li>
                <li><strong className="text-foreground">Brugsdata:</strong> Information om, hvordan du bruger platformen, herunder søgninger og interaktioner.</li>
                <li><strong className="text-foreground">Tekniske data:</strong> IP-adresse, browsertype, enhedsoplysninger og cookies.</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">3. Hvordan bruger vi dine data?</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Vi bruger dine oplysninger til følgende formål:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>At levere og forbedre vores tjenester</li>
                <li>At matche dig med relevante værelser og roomies</li>
                <li>At kommunikere med dig om din konto og vores tjenester</li>
                <li>At sikre platformens sikkerhed og forebygge svindel</li>
                <li>At overholde juridiske forpligtelser</li>
                <li>At analysere brugen af platformen og forbedre brugeroplevelsen</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">4. Deling af data</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Vi deler kun dine oplysninger i følgende tilfælde:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong className="text-foreground">Med andre brugere:</strong> Din offentlige profil og kontaktoplysninger deles med brugere, du matcher med.</li>
                <li><strong className="text-foreground">Med serviceudbydere:</strong> Vi bruger tredjeparter til hosting, analyse og kundesupport.</li>
                <li><strong className="text-foreground">Juridiske årsager:</strong> Hvis det kræves af loven eller for at beskytte vores rettigheder.</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Vi sælger aldrig dine personlige oplysninger til tredjeparter.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">5. Datasikkerhed</h2>
              <p className="text-muted-foreground leading-relaxed">
                Vi bruger branchestandard sikkerhedsforanstaltninger til at beskytte dine data, 
                herunder kryptering, sikre servere og regelmæssige sikkerhedsaudits. Dog kan ingen 
                metode til overførsel over internettet eller elektronisk lagring garanteres 100% sikker.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">6. Dine rettigheder</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                I henhold til GDPR har du følgende rettigheder:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong className="text-foreground">Ret til indsigt:</strong> Du kan anmode om en kopi af dine personlige data.</li>
                <li><strong className="text-foreground">Ret til berigtigelse:</strong> Du kan anmode om rettelse af unøjagtige oplysninger.</li>
                <li><strong className="text-foreground">Ret til sletning:</strong> Du kan anmode om sletning af dine data.</li>
                <li><strong className="text-foreground">Ret til dataportabilitet:</strong> Du kan anmode om at få dine data i et maskinlæsbart format.</li>
                <li><strong className="text-foreground">Ret til at gøre indsigelse:</strong> Du kan gøre indsigelse mod visse former for databehandling.</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                For at udøve disse rettigheder, kontakt os på kontakt@hommies.dk.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">7. Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                Vi bruger cookies til at forbedre din oplevelse på platformen. Cookies hjælper os 
                med at huske dine præferencer, analysere brugen af siden og levere personaliseret 
                indhold. Du kan administrere dine cookie-præferencer i din browsers indstillinger.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">8. Opbevaring af data</h2>
              <p className="text-muted-foreground leading-relaxed">
                Vi opbevarer dine personlige data så længe, det er nødvendigt for at opfylde de 
                formål, der er beskrevet i denne politik, eller så længe det kræves af loven. 
                Når dine data ikke længere er nødvendige, sletter eller anonymiserer vi dem sikkert.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">9. Ændringer til denne politik</h2>
              <p className="text-muted-foreground leading-relaxed">
                Vi kan opdatere denne privatlivspolitik fra tid til anden. Væsentlige ændringer 
                vil blive kommunikeret via email eller en fremtrædende meddelelse på platformen. 
                Vi opfordrer dig til at gennemgå denne politik regelmæssigt.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">10. Kontakt</h2>
              <p className="text-muted-foreground leading-relaxed">
                Har du spørgsmål til denne privatlivspolitik eller vores behandling af dine data, 
                er du velkommen til at kontakte os:
              </p>
              <div className="bg-accent rounded-xl p-6 mt-4">
                <p className="text-foreground font-medium">Hommies ApS</p>
                <p className="text-muted-foreground">Vestergade 42, 3. sal</p>
                <p className="text-muted-foreground">1456 København K</p>
                <p className="text-muted-foreground mt-2">Email: kontakt@hommies.dk</p>
                <p className="text-muted-foreground">Telefon: +45 12 34 56 78</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      {!isMobile && <Footer />}
    </div>
    </AppLayout>
  );
};

export default Privacy;
