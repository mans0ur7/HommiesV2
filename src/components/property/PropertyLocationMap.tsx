import { useMemo } from "react";
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap } from "@vis.gl/react-google-maps";
import { useState, useEffect } from "react";

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

// Danish city coordinates [lat, lng] — fallback when no precise lat/lon is stored.
const danishCityCoords: Record<string, [number, number]> = {
  "københavn": [55.6761, 12.5683], "copenhagen": [55.6761, 12.5683],
  "aarhus": [56.1629, 10.2039], "odense": [55.4038, 10.4024],
  "aalborg": [57.0488, 9.9217], "frederiksberg": [55.6786, 12.5304],
  "esbjerg": [55.4761, 8.4594], "randers": [56.4607, 10.0364],
  "kolding": [55.4904, 9.4729], "horsens": [55.8606, 9.8503],
  "roskilde": [55.6426, 12.0878], "vejle": [55.7093, 9.5357],
  "herning": [56.1393, 8.9764], "silkeborg": [56.1720, 9.5454],
  "næstved": [55.2298, 11.7600], "nørrebro": [55.6969, 12.5505],
  "vesterbro": [55.6645, 12.5456], "østerbro": [55.7062, 12.5758],
  "amager": [55.6380, 12.6102], "hellerup": [55.7325, 12.5696],
  "valby": [55.6601, 12.5020], "lyngby": [55.7688, 12.5036],
  "glostrup": [55.6624, 12.4015], "ballerup": [55.7318, 12.3632],
  "hvidovre": [55.6296, 12.4735], "søborg": [55.7303, 12.5182],
  "kastrup": [55.6180, 12.6396], "herlev": [55.7278, 12.4382],
  "brønshøj": [55.7091, 12.4995], "vanløse": [55.6869, 12.4834],
  "gentofte": [55.7524, 12.5487], "charlottenlund": [55.7537, 12.5781],
  "klampenborg": [55.7684, 12.5823], "birkerød": [55.8467, 12.4333],
  "hørsholm": [55.8826, 12.5028], "hillerød": [55.9280, 12.3030],
  "allerød": [55.8732, 12.3549], "farum": [55.8095, 12.3589],
  "virum": [55.7894, 12.4725], "holte": [55.8140, 12.4654],
  "taastrup": [55.6500, 12.2936], "albertslund": [55.6570, 12.3562],
  "ishøj": [55.6161, 12.3519], "brøndby": [55.6426, 12.4185],
  "rødovre": [55.6797, 12.4534], "greve": [55.5838, 12.3015],
  "solrød": [55.5335, 12.2228], "køge": [55.4579, 12.1821],
};

const DENMARK_CENTER: [number, number] = [55.8, 10.5];
const CITY_ZOOM = 14;
const PRECISE_ZOOM = 16;
const DENMARK_ZOOM = 7;

interface PropertyLocationMapProps {
  city: string;
  address: string;
  title: string;
  /** Optional precise coordinates from DAWA */
  latitude?: number | null;
  longitude?: number | null;
}

export default function PropertyLocationMap({ city, address, title, latitude, longitude }: PropertyLocationMapProps) {
  const { center, zoom, foundCity, isPrecise } = useMemo(() => {
    if (latitude != null && longitude != null) {
      return { center: [latitude, longitude] as [number, number], zoom: PRECISE_ZOOM, foundCity: true, isPrecise: true };
    }
    const cityLower = (city || "").toLowerCase().trim();
    if (danishCityCoords[cityLower]) {
      return { center: danishCityCoords[cityLower], zoom: CITY_ZOOM, foundCity: true, isPrecise: false };
    }
    for (const [key, coords] of Object.entries(danishCityCoords)) {
      if (cityLower.includes(key) || key.includes(cityLower)) {
        return { center: coords, zoom: CITY_ZOOM, foundCity: true, isPrecise: false };
      }
    }
    return { center: DENMARK_CENTER, zoom: DENMARK_ZOOM, foundCity: false, isPrecise: false };
  }, [city, latitude, longitude]);

  const [showInfo, setShowInfo] = useState(false);

  if (!API_KEY) {
    return (
      <div className="h-full w-full rounded-2xl border border-border bg-muted/40 text-xs text-muted-foreground p-4 flex items-center justify-center">
        Google Maps API key mangler i VITE_GOOGLE_MAPS_API_KEY.
      </div>
    );
  }

  const position = { lat: center[0], lng: center[1] };

  return (
    <div className="relative h-full w-full rounded-2xl overflow-hidden">
      <APIProvider apiKey={API_KEY}>
        <Map
          defaultCenter={position}
          defaultZoom={zoom}
          mapId="hommies-property-location-map"
          gestureHandling="cooperative"
          disableDefaultUI
          zoomControl
          style={{ width: "100%", height: "100%" }}
        >
          <AdvancedMarker position={position} onClick={() => setShowInfo(true)}>
            <Pin background="#dc6455" borderColor="#ffffff" glyphColor="#ffffff" scale={1.2} />
          </AdvancedMarker>
          {showInfo && (
            <InfoWindow position={position} onCloseClick={() => setShowInfo(false)}>
              <div style={{ minWidth: 180, padding: 4 }}>
                <h3 style={{ fontWeight: 600, fontSize: 14, margin: "0 0 4px" }}>{title}</h3>
                <p style={{ fontSize: 12, color: "#666", margin: 0 }}>📍 {address}, {city}</p>
                {!isPrecise && (
                  <p style={{ fontSize: 11, color: "#999", margin: "4px 0 0", fontStyle: "italic" }}>
                    Omtrentlig placering
                  </p>
                )}
              </div>
            </InfoWindow>
          )}
          <Recenter position={position} zoom={zoom} />
        </Map>
      </APIProvider>

      {!foundCity && (
        <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs shadow-lg z-10">
          <span className="text-muted-foreground">📍 Omtrentlig placering</span>
        </div>
      )}
    </div>
  );
}

function Recenter({ position, zoom }: { position: { lat: number; lng: number }; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    map.panTo(position);
    map.setZoom(zoom);
  }, [map, position.lat, position.lng, zoom]);
  return null;
}
