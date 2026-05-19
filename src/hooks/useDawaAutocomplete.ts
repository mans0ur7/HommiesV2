import { useEffect, useState } from "react";

export type DawaSuggestion = {
  tekst: string;
  forslagstekst: string;
  type: "vejnavn" | "adgangsadresse" | "adresse" | "postnummer" | string;
  caretpos: number;
  data: any;
};

export type DawaResult = {
  label: string;       // primary text shown in dropdown
  sublabel: string;    // secondary text (postnr/by/type)
  type: DawaSuggestion["type"];
  raw: DawaSuggestion;
  /** Best-effort city/area string for filtering existing properties */
  city?: string;
  lat?: number;
  lon?: number;
};

const ENDPOINT = "https://api.dataforsyningen.dk/autocomplete";

function mapSuggestion(s: DawaSuggestion): DawaResult {
  const d = s.data || {};
  let city: string | undefined;
  let lat: number | undefined;
  let lon: number | undefined;
  let sublabel = "";

  if (s.type === "postnummer") {
    city = d.navn;
    sublabel = `Postnummer ${d.nr ?? ""}`;
  } else if (s.type === "vejnavn") {
    city = d.postnummer?.navn || d.kommune?.navn;
    sublabel = [d.postnummer?.nr, d.postnummer?.navn].filter(Boolean).join(" ");
  } else if (s.type === "adgangsadresse" || s.type === "adresse") {
    city = d.postnrnavn || d.postnummer?.navn;
    sublabel = [d.postnr || d.postnummer?.nr, city].filter(Boolean).join(" ");
    if (Array.isArray(d.adgangspunkt?.koordinater)) {
      lon = d.adgangspunkt.koordinater[0];
      lat = d.adgangspunkt.koordinater[1];
    } else if (d.x && d.y) {
      lon = d.x;
      lat = d.y;
    }
  } else {
    sublabel = s.type;
  }

  return { label: s.tekst, sublabel, type: s.type, raw: s, city, lat, lon };
}

/**
 * Debounced autocomplete against DAWA (dataforsyningen.dk).
 * Free, official Danish address API. No API key required.
 */
export function useDawaAutocomplete(query: string, enabled = true) {
  const [results, setResults] = useState<DawaResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !query.trim() || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `${ENDPOINT}?q=${encodeURIComponent(query)}&fuzzy=&per_side=8`;
        const res = await fetch(url, { signal: ctrl.signal });
        if (!res.ok) throw new Error(`DAWA ${res.status}`);
        const data: DawaSuggestion[] = await res.json();
        setResults(data.map(mapSuggestion));
      } catch (e: any) {
        if (e.name !== "AbortError") {
          console.error("DAWA autocomplete error", e);
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [query, enabled]);

  return { results, loading };
}
