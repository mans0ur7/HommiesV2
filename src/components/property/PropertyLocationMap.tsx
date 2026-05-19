import { useEffect, useRef, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Danish city coordinates [lat, lng]
const danishCityCoords: Record<string, [number, number]> = {
  "københavn": [55.6761, 12.5683],
  "copenhagen": [55.6761, 12.5683],
  "aarhus": [56.1629, 10.2039],
  "odense": [55.4038, 10.4024],
  "aalborg": [57.0488, 9.9217],
  "frederiksberg": [55.6786, 12.5304],
  "esbjerg": [55.4761, 8.4594],
  "randers": [56.4607, 10.0364],
  "kolding": [55.4904, 9.4729],
  "horsens": [55.8606, 9.8503],
  "roskilde": [55.6426, 12.0878],
  "vejle": [55.7093, 9.5357],
  "herning": [56.1393, 8.9764],
  "silkeborg": [56.1720, 9.5454],
  "næstved": [55.2298, 11.7600],
  "nørrebro": [55.6969, 12.5505],
  "vesterbro": [55.6645, 12.5456],
  "østerbro": [55.7062, 12.5758],
  "amager": [55.6380, 12.6102],
  "frederiksberg c": [55.6786, 12.5304],
  "hellerup": [55.7325, 12.5696],
  "valby": [55.6601, 12.5020],
  "lyngby": [55.7688, 12.5036],
  "glostrup": [55.6624, 12.4015],
  "ballerup": [55.7318, 12.3632],
  "hvidovre": [55.6296, 12.4735],
  "søborg": [55.7303, 12.5182],
  "kastrup": [55.6180, 12.6396],
  "herlev": [55.7278, 12.4382],
  "brønshøj": [55.7091, 12.4995],
  "vanløse": [55.6869, 12.4834],
  "gentofte": [55.7524, 12.5487],
  "charlottenlund": [55.7537, 12.5781],
  "klampenborg": [55.7684, 12.5823],
  "kongens lyngby": [55.7688, 12.5036],
  "birkerød": [55.8467, 12.4333],
  "hørsholm": [55.8826, 12.5028],
  "hillerød": [55.9280, 12.3030],
  "allerød": [55.8732, 12.3549],
  "farum": [55.8095, 12.3589],
  "virum": [55.7894, 12.4725],
  "holte": [55.8140, 12.4654],
  "nærum": [55.8087, 12.5152],
  "vedbæk": [55.8465, 12.5684],
  "skodsborg": [55.8258, 12.5547],
  "taastrup": [55.6500, 12.2936],
  "albertslund": [55.6570, 12.3562],
  "ishøj": [55.6161, 12.3519],
  "brøndby": [55.6426, 12.4185],
  "rødovre": [55.6797, 12.4534],
  "greve": [55.5838, 12.3015],
  "solrød": [55.5335, 12.2228],
  "køge": [55.4579, 12.1821],
};

const DENMARK_CENTER: [number, number] = [55.8, 10.5];
const CITY_ZOOM = 14;
const DENMARK_ZOOM = 7;

interface PropertyLocationMapProps {
  city: string;
  address: string;
  title: string;
}

export default function PropertyLocationMap({ city, address, title }: PropertyLocationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Calculate center based on city - always returns a valid coordinate
  const { center, zoom, foundCity } = useMemo(() => {
    const cityLower = (city || "").toLowerCase().trim();
    
    // Try exact match first
    if (danishCityCoords[cityLower]) {
      return { center: danishCityCoords[cityLower], zoom: CITY_ZOOM, foundCity: true };
    }
    
    // Try partial match
    for (const [key, coords] of Object.entries(danishCityCoords)) {
      if (cityLower.includes(key) || key.includes(cityLower)) {
        return { center: coords, zoom: CITY_ZOOM, foundCity: true };
      }
    }
    
    // Fallback to Denmark center
    return { center: DENMARK_CENTER, zoom: DENMARK_ZOOM, foundCity: false };
  }, [city]);

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create map
    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: zoom,
      scrollWheelZoom: false,
      dragging: true,
      zoomControl: true,
    });

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Create custom marker icon
    const customIcon = L.divIcon({
      html: `<div style="background: hsl(var(--primary)); color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 3px solid white;">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        </svg>
      </div>`,
      className: "custom-property-marker",
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
    });

    // Add marker at center
    const marker = L.marker(center, { icon: customIcon }).addTo(map);
    
    // Create popup content
    const popupContent = `
      <div style="min-width: 180px; padding: 4px;">
        <h3 style="font-weight: 600; font-size: 14px; margin: 0 0 4px 0;">${title}</h3>
        <p style="font-size: 12px; color: #666; margin: 0;">📍 ${address}, ${city}</p>
        ${!foundCity ? '<p style="font-size: 11px; color: #999; margin: 4px 0 0 0; font-style: italic;">Omtrentlig placering</p>' : ''}
      </div>
    `;
    marker.bindPopup(popupContent, { maxWidth: 250, className: "property-location-popup" });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [center, zoom, title, address, city, foundCity]);

  return (
    <div className="relative h-full w-full rounded-2xl overflow-hidden">
      <div ref={mapContainerRef} className="h-full w-full z-0" />
      
      {/* Approximate location indicator */}
      {!foundCity && (
        <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs shadow-lg z-[1000]">
          <span className="text-muted-foreground">📍 Omtrentlig placering</span>
        </div>
      )}
    </div>
  );
}
