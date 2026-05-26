import type JsPDF from "jspdf";
import { format } from "date-fns";
import { da } from "date-fns/locale";
import hommiesLogo from "@/assets/hommies-logo.png";

export interface HusordensData {
  // Parter
  creator_name: string;
  creator_email: string;
  creator_phone: string;
  tenant_name: string;
  tenant_email: string;
  tenant_phone: string;
  // Bolig
  property_address: string;
  property_postal_code: string;
  property_city: string;
  // Gyldighedsdato
  effective_date: Date | null;
  // Stilletid & støj
  quiet_hours: string;
  noise_policy: string;
  // Rengøring & køkken
  maintenance_responsibility: string;
  kitchen_rules: string;
  // Gæster & husdyr
  guest_policy: string;
  pets_allowed: boolean;
  pets_description: string;
  smoking_allowed: boolean;
  // Yderligere
  house_rules: string;
  // Signing
  creator_signed_at?: string | null;
  tenant_signed_at?: string | null;
}

const C = {
  navy:       { r: 15,  g: 40,  b: 60  },
  navyLight:  { r: 45,  g: 80,  b: 110 },
  accent:     { r: 220, g: 100, b: 85  },
  accentBg:   { r: 255, g: 245, b: 243 },
  text:       { r: 40,  g: 40,  b: 45  },
  muted:      { r: 120, g: 120, b: 128 },
  border:     { r: 220, g: 220, b: 228 },
  bg:         { r: 248, g: 248, b: 252 },
  green:      { r: 34,  g: 140, b: 80  },
  greenBg:    { r: 240, g: 252, b: 245 },
};

const getBase64FromUrl = (url: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext("2d");
      if (ctx) { ctx.drawImage(img, 0, 0); resolve(c.toDataURL("image/png")); }
      else reject(new Error("canvas ctx"));
    };
    img.onerror = reject;
    img.src = url;
  });

export async function generateContractPdf(data: HusordensData): Promise<JsPDF> {
  // Loaded on demand so the ~400KB PDF libs (jspdf + html2canvas) stay out of
  // the page bundle until a contract PDF is actually generated.
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 22;
  const CW = W - 2 * M;
  let y = 0;

  let logo: string | null = null;
  try { logo = await getBase64FromUrl(hommiesLogo); } catch {}

  const rgb = (c: typeof C.navy) => doc.setTextColor(c.r, c.g, c.b);
  const fill = (c: typeof C.navy) => doc.setFillColor(c.r, c.g, c.b);
  const stroke = (c: typeof C.navy) => doc.setDrawColor(c.r, c.g, c.b);

  const pageBreak = (need = 35) => {
    if (y > H - need) { doc.addPage(); y = M + 5; }
  };

  const footer = () => {
    const fy = H - 11;
    stroke(C.border); doc.setLineWidth(0.3);
    doc.line(M, fy - 4, W - M, fy - 4);
    doc.setFontSize(7.5); rgb(C.muted); doc.setFont("helvetica", "normal");
    doc.text("Hommies · Husorden og Samboaftale", M, fy);
    doc.text(`Side ${doc.getNumberOfPages()}`, W - M, fy, { align: "right" });
  };

  // ── HEADER ────────────────────────────────────────────────
  y = 18;
  if (logo) {
    doc.addImage(logo, "PNG", M, y - 4, 52, 15);
  } else {
    doc.setFontSize(22); doc.setFont("helvetica", "bold"); rgb(C.navy);
    doc.text("Hommies", M, y + 6);
  }
  doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); rgb(C.muted);
  doc.text(format(new Date(), "d. MMMM yyyy", { locale: da }), W - M, y + 4, { align: "right" });

  y += 22;
  stroke(C.accent); doc.setLineWidth(1.2);
  doc.line(M, y, W - M, y);
  y += 16;

  // Title
  doc.setFontSize(22); doc.setFont("helvetica", "bold"); rgb(C.navy);
  doc.text("Husorden og Samboaftale", W / 2, y, { align: "center" });
  y += 7;
  doc.setFontSize(9.5); doc.setFont("helvetica", "normal"); rgb(C.muted);
  doc.text(`${data.property_address}, ${data.property_postal_code} ${data.property_city}`, W / 2, y, { align: "center" });
  y += 16;

  // ── SECTION HELPERS ──────────────────────────────────────
  const section = (title: string) => {
    pageBreak(40);
    y += 10;
    fill(C.bg); stroke(C.border); doc.setLineWidth(0.3);
    doc.roundedRect(M, y - 6, CW, 14, 3, 3, "FD");
    doc.setFontSize(10.5); doc.setFont("helvetica", "bold"); rgb(C.navyLight);
    doc.text(title, M + 8, y + 3);
    y += 16;
  };

  const row = (label: string, value: string) => {
    pageBreak(10);
    doc.setFontSize(8.5);
    rgb(C.muted); doc.setFont("helvetica", "normal");
    doc.text(label, M + 4, y);
    rgb(C.text); doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(value || "–", CW - 60);
    doc.text(lines, M + 58, y);
    y += Math.max(lines.length * 5, 7);
  };

  const block = (label: string, text: string) => {
    if (!text?.trim()) return;
    pageBreak(20);
    doc.setFontSize(8.5); rgb(C.muted); doc.setFont("helvetica", "normal");
    doc.text(label, M + 4, y); y += 6;
    rgb(C.text); doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(text, CW - 8);
    doc.text(lines, M + 4, y);
    y += lines.length * 5 + 6;
  };

  const pill = (text: string, ok: boolean) => {
    pageBreak(12);
    const col = ok ? C.green : C.accent;
    fill({ r: ok ? C.greenBg.r : C.accentBg.r, g: ok ? C.greenBg.g : C.accentBg.g, b: ok ? C.greenBg.b : C.accentBg.b });
    doc.roundedRect(M + 4, y - 5, 60, 9, 2, 2, "F");
    doc.setFontSize(8.5); doc.setFont("helvetica", "bold");
    doc.setTextColor(col.r, col.g, col.b);
    doc.text(text, M + 34, y, { align: "center" });
    y += 10;
  };

  // ── § 1 PARTERNE ─────────────────────────────────────────
  section("§ 1  Parterne");

  const half = (CW - 12) / 2;
  const py = y;

  // Venstre — ophavsmand
  doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); rgb(C.muted);
  doc.text("OPHAVSMAND / KONTAKTPERSON", M + 4, y); y += 7;
  doc.setFontSize(10); doc.setFont("helvetica", "bold"); rgb(C.navy);
  doc.text(data.creator_name || "–", M + 4, y); y += 6;
  doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); rgb(C.text);
  if (data.creator_email) { doc.text(data.creator_email, M + 4, y); y += 5; }
  if (data.creator_phone) { doc.text(data.creator_phone, M + 4, y); y += 5; }
  const leftEnd = y;

  // Højre — beboer
  y = py;
  const rx = M + half + 12;
  doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); rgb(C.muted);
  doc.text("BEBOER", rx, y); y += 7;
  doc.setFontSize(10); doc.setFont("helvetica", "bold"); rgb(C.navy);
  doc.text(data.tenant_name || "–", rx, y); y += 6;
  doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); rgb(C.text);
  if (data.tenant_email) { doc.text(data.tenant_email, rx, y); y += 5; }
  if (data.tenant_phone) { doc.text(data.tenant_phone, rx, y); y += 5; }

  y = Math.max(leftEnd, y) + 4;

  if (data.effective_date) {
    doc.setFontSize(8.5); rgb(C.muted); doc.setFont("helvetica", "normal");
    doc.text("Gyldig fra:", M + 4, y);
    doc.setFont("helvetica", "bold"); rgb(C.navy);
    doc.text(format(data.effective_date, "d. MMMM yyyy", { locale: da }), M + 36, y);
    y += 8;
  }

  // ── § 2 STILLETID & STØJ ─────────────────────────────────
  section("§ 2  Stilletid og støj");
  block("Stilletid:", data.quiet_hours);
  block("Støjregler:", data.noise_policy);

  // ── § 3 RENGØRING & KØKKEN ───────────────────────────────
  section("§ 3  Rengøring og køkken");
  block("Rengøringsansvar:", data.maintenance_responsibility);
  block("Køleregler:", data.kitchen_rules);

  // ── § 4 GÆSTER & HUSDYR ──────────────────────────────────
  section("§ 4  Gæster, husdyr og rygning");

  doc.setFontSize(8.5); rgb(C.muted); doc.setFont("helvetica", "normal");
  doc.text("Husdyr:", M + 4, y); y += 6;
  pill(data.pets_allowed ? "Tilladt" : "Ikke tilladt", data.pets_allowed);
  if (data.pets_allowed && data.pets_description) block("Beskrivelse:", data.pets_description);

  doc.setFontSize(8.5); rgb(C.muted); doc.setFont("helvetica", "normal");
  doc.text("Rygning:", M + 4, y); y += 6;
  pill(data.smoking_allowed ? "Tilladt" : "Ikke tilladt", data.smoking_allowed);

  block("Gæstepolitik:", data.guest_policy);

  // ── § 5 YDERLIGERE REGLER ────────────────────────────────
  if (data.house_rules?.trim()) {
    section("§ 5  Yderligere regler");
    block("", data.house_rules);
  }

  // ── § 6 UNDERSKRIFTER ────────────────────────────────────
  pageBreak(80);
  section("§ 6  Underskrifter");

  doc.setFontSize(8.5); rgb(C.muted); doc.setFont("helvetica", "normal");
  doc.text(
    "Begge parter bekræfter at have læst og accepteret denne husorden.",
    M + 4, y
  );
  y += 14;

  const sigW = (CW - 16) / 2;

  const drawSig = (name: string, role: string, signedAt: string | null | undefined, x: number) => {
    const sy = y;
    doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); rgb(C.muted);
    doc.text(role, x, sy);
    doc.setFontSize(9.5); doc.setFont("helvetica", "bold"); rgb(C.navy);
    doc.text(name || "–", x, sy + 7);

    if (signedAt) {
      // Signed — green confirmed box
      fill(C.greenBg); stroke(C.green); doc.setLineWidth(0.5);
      doc.roundedRect(x, sy + 12, sigW, 16, 3, 3, "FD");
      doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(C.green.r, C.green.g, C.green.b);
      doc.text("✓  Digitalt underskrevet", x + 6, sy + 21);
      doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); rgb(C.muted);
      doc.text(format(new Date(signedAt), "d. MMM yyyy · HH:mm", { locale: da }), x + 6, sy + 27);
    } else {
      // Not signed — blank line
      stroke(C.border); doc.setLineWidth(0.5);
      doc.line(x, sy + 28, x + sigW, sy + 28);
      doc.setFontSize(7.5); rgb(C.muted); doc.setFont("helvetica", "normal");
      doc.text("Underskrift", x, sy + 33);
      doc.text("Dato", x + sigW - 22, sy + 33);
    }
  };

  drawSig(data.creator_name, "OPHAVSMAND", data.creator_signed_at, M + 4);
  drawSig(data.tenant_name,  "BEBOER",    data.tenant_signed_at,  M + 4 + sigW + 16);
  y += 42;

  // Legal note
  pageBreak(20);
  y += 6;
  doc.setFontSize(7.5); rgb(C.muted); doc.setFont("helvetica", "italic");
  const note = doc.splitTextToSize(
    "Denne husorden er en samboaftale og er juridisk bindende under dansk aftaleloven (§1). Digital accept med tidsstempel og bruger-ID udgør gyldig underskrift.",
    CW
  );
  doc.text(note, M + 4, y);

  // Footers on all pages
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) { doc.setPage(i); footer(); }

  return doc;
}

export async function downloadContractPdf(data: HusordensData, filename?: string): Promise<void> {
  const doc = await generateContractPdf(data);
  doc.save(filename ?? `husorden-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}
