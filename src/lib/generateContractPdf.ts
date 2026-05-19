import jsPDF from "jspdf";
import { format } from "date-fns";
import { da } from "date-fns/locale";
import hommiesLogo from "@/assets/hommies-logo.png";

interface ContractData {
  landlord_name: string;
  landlord_address: string;
  landlord_email: string;
  landlord_phone: string;
  landlord_cvr: string;
  tenant_name: string;
  tenant_address: string;
  tenant_email: string;
  tenant_phone: string;
  property_address: string;
  property_postal_code: string;
  property_city: string;
  property_type: string;
  property_size_sqm: number | null;
  property_room_count: number | null;
  is_furnished: boolean;
  inventory_list: string;
  start_date: Date | null;
  is_time_limited: boolean;
  end_date: Date | null;
  notice_period_months: number;
  monthly_rent: number | null;
  aconto: number;
  deposit: number | null;
  prepaid_rent: number;
  payment_day: number;
  payment_account: string;
  pets_allowed: boolean;
  pets_description: string;
  smoking_allowed: boolean;
  subletting_allowed: boolean;
  maintenance_responsibility: string;
  house_rules: string;
}

const propertyTypeLabels: Record<string, string> = {
  apartment: "Lejlighed",
  room: "Værelse",
  house: "Hus",
  studio: "Studio",
};

// Soft, elegant color palette
const COLORS = {
  primary: { r: 3, g: 42, b: 59 },
  primaryLight: { r: 45, g: 80, b: 100 },
  rose: { r: 255, g: 210, b: 205 },
  roseLight: { r: 255, g: 235, b: 232 },
  text: { r: 50, g: 50, b: 55 },
  muted: { r: 130, g: 130, b: 135 },
  light: { r: 250, g: 250, b: 252 },
  border: { r: 230, g: 230, b: 235 },
};

// Convert image to base64
const getBase64FromUrl = async (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } else {
        reject(new Error("Could not get canvas context"));
      }
    };
    img.onerror = reject;
    img.src = url;
  });
};

export async function generateContractPdf(data: ContractData): Promise<jsPDF> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 25;
  const contentWidth = pageWidth - 2 * margin;
  let y = 0;

  // Load logo
  let logoBase64: string | null = null;
  try {
    logoBase64 = await getBase64FromUrl(hommiesLogo);
  } catch (e) {
    console.warn("Could not load logo for PDF:", e);
  }

  // Helper functions
  const setColor = (color: { r: number; g: number; b: number }) => {
    doc.setTextColor(color.r, color.g, color.b);
  };

  const setDrawColor = (color: { r: number; g: number; b: number }) => {
    doc.setDrawColor(color.r, color.g, color.b);
  };

  const setFillColor = (color: { r: number; g: number; b: number }) => {
    doc.setFillColor(color.r, color.g, color.b);
  };

  const checkPageBreak = (needed: number = 30) => {
    if (y > pageHeight - needed) {
      doc.addPage();
      y = margin + 5;
    }
  };

  const addPageFooter = () => {
    const footerY = pageHeight - 12;
    
    setDrawColor(COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
    
    doc.setFontSize(8);
    setColor(COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.text("Hommies · Din roomie platform", margin, footerY);
    doc.text(`Side ${doc.getNumberOfPages()}`, pageWidth - margin, footerY, { align: "right" });
  };

  // ========== ELEGANT HEADER WITH LOGO ==========
  y = 20;
  
  // Add logo if loaded
  if (logoBase64) {
    const logoHeight = 18;
    const logoWidth = logoHeight * 3.5; // Approximate aspect ratio
    doc.addImage(logoBase64, "PNG", margin, y - 5, logoWidth, logoHeight);
    y += 8;
  } else {
    // Fallback text logo
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    setColor(COLORS.primary);
    doc.text("Hommies", margin, y + 8);
  }
  
  // Document date aligned right
  doc.setFontSize(9);
  setColor(COLORS.muted);
  doc.setFont("helvetica", "normal");
  doc.text(format(new Date(), "d. MMMM yyyy", { locale: da }), pageWidth - margin, y + 5, { align: "right" });

  y += 25;

  // Soft divider line
  setDrawColor(COLORS.rose);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);

  y += 20;

  // ========== DOCUMENT TITLE ==========
  doc.setFontSize(20);
  doc.setFont("helvetica", "normal");
  setColor(COLORS.primary);
  doc.text("Lejekontrakt", pageWidth / 2, y, { align: "center" });

  y += 25;

  // ========== SECTION HELPERS ==========
  const addSectionTitle = (text: string) => {
    checkPageBreak(35);
    y += 12;
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    setColor(COLORS.primary);
    doc.text(text, margin, y);
    
    y += 3;
    setDrawColor(COLORS.rose);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + 40, y);
    y += 10;
  };

  const addFieldRow = (label: string, value: string, bold: boolean = false) => {
    checkPageBreak(10);
    doc.setFontSize(9);
    
    setColor(COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.text(label, margin, y);
    
    if (bold) {
      setColor(COLORS.primary);
      doc.setFont("helvetica", "bold");
    } else {
      setColor(COLORS.text);
      doc.setFont("helvetica", "normal");
    }
    doc.text(value || "–", margin + 55, y);
    y += 7;
  };

  const addParagraph = (text: string) => {
    if (!text) return;
    checkPageBreak(20);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    setColor(COLORS.text);
    const lines = doc.splitTextToSize(text, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 4.5 + 6;
  };

  // ========== § 1 - PARTERNE ==========
  addSectionTitle("Parterne");

  const colWidth = (contentWidth - 15) / 2;
  const partyStartY = y;

  // Udlejer column
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  setColor(COLORS.muted);
  doc.text("UDLEJER", margin, y);
  y += 6;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  setColor(COLORS.primary);
  doc.text(data.landlord_name || "–", margin, y);
  y += 6;
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  setColor(COLORS.text);
  if (data.landlord_address) { doc.text(data.landlord_address, margin, y); y += 5; }
  setColor(COLORS.muted);
  if (data.landlord_email) { doc.text(data.landlord_email, margin, y); y += 5; }
  if (data.landlord_phone) { doc.text(data.landlord_phone, margin, y); y += 5; }
  if (data.landlord_cvr) { doc.text(`CVR: ${data.landlord_cvr}`, margin, y); y += 5; }
  
  const landlordEndY = y;

  // Lejer column
  y = partyStartY;
  const rightColX = margin + colWidth + 15;
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  setColor(COLORS.muted);
  doc.text("LEJER", rightColX, y);
  y += 6;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  setColor(COLORS.primary);
  doc.text(data.tenant_name || "–", rightColX, y);
  y += 6;
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  setColor(COLORS.text);
  if (data.tenant_address) { doc.text(data.tenant_address, rightColX, y); y += 5; }
  setColor(COLORS.muted);
  if (data.tenant_email) { doc.text(data.tenant_email, rightColX, y); y += 5; }
  if (data.tenant_phone) { doc.text(data.tenant_phone, rightColX, y); y += 5; }

  y = Math.max(landlordEndY, y) + 8;

  // ========== § 2 - LEJEMÅLET ==========
  addSectionTitle("Lejemålet");

  addFieldRow("Adresse", `${data.property_address}, ${data.property_postal_code} ${data.property_city}`, true);
  addFieldRow("Type", propertyTypeLabels[data.property_type] || data.property_type || "–");
  if (data.property_size_sqm) addFieldRow("Størrelse", `${data.property_size_sqm} m²`);
  if (data.property_room_count) addFieldRow("Værelser", data.property_room_count.toString());
  addFieldRow("Møbleret", data.is_furnished ? "Ja" : "Nej");

  if (data.is_furnished && data.inventory_list) {
    y += 4;
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    setColor(COLORS.muted);
    doc.text("Inventar:", margin, y);
    y += 6;
    addParagraph(data.inventory_list);
  }

  // ========== § 3 - LEJEPERIODE ==========
  addSectionTitle("Lejeperiode");

  if (data.start_date) {
    addFieldRow("Indflytning", format(data.start_date, "d. MMMM yyyy", { locale: da }), true);
  }
  
  if (data.is_time_limited && data.end_date) {
    addFieldRow("Slutdato", format(data.end_date, "d. MMMM yyyy", { locale: da }));
    addFieldRow("Lejeperiode", "Tidsbegrænset");
  } else {
    addFieldRow("Lejeperiode", "Tidsubegrænset");
  }
  
  addFieldRow("Opsigelsesvarsel", `${data.notice_period_months} måned${data.notice_period_months > 1 ? "er" : ""}`);

  // ========== § 4 - ØKONOMI ==========
  addSectionTitle("Leje og betaling");

  const monthlyRent = data.monthly_rent || 0;
  const aconto = data.aconto || 0;
  const deposit = data.deposit || 0;
  const prepaidRent = data.prepaid_rent || 0;
  const totalMoveIn = monthlyRent + deposit + prepaidRent;

  checkPageBreak(50);
  y += 2;
  
  setFillColor(COLORS.roseLight);
  doc.roundedRect(margin, y, contentWidth, 20, 6, 6, "F");
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  setColor(COLORS.text);
  doc.text("Månedlig husleje", margin + 12, y + 12);
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  setColor(COLORS.primary);
  doc.text(`${monthlyRent.toLocaleString("da-DK")} kr.`, pageWidth - margin - 12, y + 13, { align: "right" });
  
  y += 28;

  addFieldRow("Aconto/forbrug", `${aconto.toLocaleString("da-DK")} kr.`);
  addFieldRow("Depositum", `${deposit.toLocaleString("da-DK")} kr.`);
  if (prepaidRent > 0) addFieldRow("Forudbetalt leje", `${prepaidRent.toLocaleString("da-DK")} kr.`);
  addFieldRow("Betalingsdag", `Den ${data.payment_day}. i måneden`);
  if (data.payment_account) addFieldRow("Betalingskonto", data.payment_account);

  y += 4;
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  setColor(COLORS.primary);
  doc.text("Samlet ved indflytning:", margin, y);
  doc.text(`${totalMoveIn.toLocaleString("da-DK")} kr.`, margin + 55, y);
  y += 10;

  // ========== § 5 - VILKÅR ==========
  addSectionTitle("Ordensregler");

  const rules = [
    { label: "Husdyr", value: data.pets_allowed ? (data.pets_description || "Tilladt") : "Ikke tilladt" },
    { label: "Rygning", value: data.smoking_allowed ? "Tilladt" : "Ikke tilladt" },
    { label: "Fremleje", value: data.subletting_allowed ? "Tilladt" : "Ikke tilladt" },
  ];

  rules.forEach(rule => {
    addFieldRow(rule.label, rule.value);
  });

  if (data.maintenance_responsibility) {
    y += 4;
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    setColor(COLORS.muted);
    doc.text("Vedligeholdelse:", margin, y);
    y += 6;
    addParagraph(data.maintenance_responsibility);
  }

  if (data.house_rules) {
    y += 2;
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    setColor(COLORS.muted);
    doc.text("Husorden:", margin, y);
    y += 6;
    addParagraph(data.house_rules);
  }

  // ========== § 6 - UNDERSKRIFTER ==========
  checkPageBreak(75);
  addSectionTitle("Underskrifter");

  y += 2;
  doc.setFontSize(9);
  setColor(COLORS.muted);
  doc.setFont("helvetica", "normal");
  doc.text("Begge parter bekræfter ved underskrift at have læst og accepteret denne kontrakt.", margin, y);
  y += 18;

  const sigBoxWidth = (contentWidth - 20) / 2;

  // Udlejer signature
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  setColor(COLORS.muted);
  doc.text("UDLEJER", margin, y);
  y += 5;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  setColor(COLORS.text);
  doc.text(data.landlord_name, margin, y);
  y += 18;
  
  setDrawColor(COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + sigBoxWidth, y);
  y += 5;
  
  doc.setFontSize(8);
  setColor(COLORS.muted);
  doc.text("Underskrift", margin, y);
  doc.text("Dato", margin + sigBoxWidth - 30, y);

  // Lejer signature
  const tenantSigX = margin + sigBoxWidth + 20;
  y -= 28;
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  setColor(COLORS.muted);
  doc.text("LEJER", tenantSigX, y);
  y += 5;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  setColor(COLORS.text);
  doc.text(data.tenant_name, tenantSigX, y);
  y += 18;
  
  setDrawColor(COLORS.border);
  doc.line(tenantSigX, y, tenantSigX + sigBoxWidth, y);
  y += 5;
  
  doc.setFontSize(8);
  setColor(COLORS.muted);
  doc.text("Underskrift", tenantSigX, y);
  doc.text("Dato", tenantSigX + sigBoxWidth - 30, y);

  // Add footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPageFooter();
  }

  return doc;
}

export async function downloadContractPdf(data: ContractData, filename?: string): Promise<void> {
  const doc = await generateContractPdf(data);
  const pdfFilename = filename || `lejekontrakt-${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(pdfFilename);
}
