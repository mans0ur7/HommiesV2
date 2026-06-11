import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps";
import { Home } from "lucide-react";

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

// Fallback city-centre coordinates for properties without precise lat/lon
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
  "hvidovre": [55.6296, 12.4735],
};

const areaCoords: Record<string, [number, number]> = {
  "nørrebro": [55.6969, 12.5505], "østerbro": [55.7062, 12.5758],
  "vesterbro": [55.6645, 12.5456], "amager": [55.6380, 12.6102],
  "frederiksberg": [55.6786, 12.5304], "indre by": [55.6786, 12.5783],
  "indreby": [55.6786, 12.5783], "valby": [55.6601, 12.5020],
  "ørestad": [55.6280, 12.5793], "orestad": [55.6280, 12.5793],
  "midtbyen": [56.1560, 10.2089], "risskov": [56.1885, 10.2214],
  "katrinebjerg": [56.1712, 10.1915], "skejby": [56.1939, 10.1872],
  "universitetsparken": [56.1685, 10.1992],
  "bolbro": [55.3939, 10.3619], "cortex park": [55.3689, 10.4287],
  "sdu campus": [55.3689, 10.4287],
  "aalborg midtbyen": [57.0480, 9.9170], "vestbyen": [57.0488, 9.8950],
  "aau campus": [57.0155, 9.9857],
  "roskilde c": [55.6426, 12.0878], "trekroner": [55.6510, 12.1350],
  "musicon": [55.6320, 12.0850],
};

const DENMARK_CENTER = { lat: 55.8, lng: 10.5 };
const CITY_ZOOM = 12;
const AREA_ZOOM = 14;
const DENMARK_ZOOM = 7;

interface Property {
  id: string;
  title: string;
  city: string;
  address: string;
  monthly_rent: number;
  images?: string[];
  size_sqm?: number;
  room_count?: number;
  latitude?: number | null;
  longitude?: number | null;
}

interface PropertyMapProps {
  properties: Property[];
  selectedCity?: string | null;
  panToArea?: string | null;
}

interface MarkerGroup {
  key: string;
  coords: { lat: number; lng: number };
  properties: Property[];
}

export default function PropertyMap({ properties, selectedCity, panToArea }: PropertyMapProps) {
  // Group properties by their resolved coordinates
  const groups = useMemo<MarkerGroup[]>(() => {
    const map: Record<string, MarkerGroup> = {};
    properties.forEach((p) => {
      if (p.latitude != null && p.longitude != null) {
        const key = `${p.latitude.toFixed(4)},${p.longitude.toFixed(4)}`;
        if (!map[key]) map[key] = { key, coords: { lat: p.latitude, lng: p.longitude }, properties: [] };
        map[key].properties.push(p);
        return;
      }
      const cityKey = (p.city || "").toLowerCase().trim();
      const fallback = danishCityCoords[cityKey];
      if (fallback) {
        const key = `city:${cityKey}`;
        if (!map[key]) map[key] = { key, coords: { lat: fallback[0], lng: fallback[1] }, properties: [] };
        map[key].properties.push(p);
      }
    });
    return Object.values(map);
  }, [properties]);

  const initialCenter = useMemo(() => {
    if (selectedCity) {
      const c = danishCityCoords[selectedCity.toLowerCase()];
      if (c) return { lat: c[0], lng: c[1] };
    }
    if (groups.length > 0) return groups[0].coords;
    return DENMARK_CENTER;
  }, [selectedCity, groups]);

  const initialZoom = selectedCity || groups.length === 1 ? CITY_ZOOM : DENMARK_ZOOM;

  if (!API_KEY) {
    return (
      <div className="bg-muted rounded-2xl h-[500px] flex items-center justify-center">
        <p className="text-muted-foreground text-sm">
          Google Maps API key mangler i VITE_GOOGLE_MAPS_API_KEY.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-muted rounded-2xl h-[500px] overflow-hidden relative">
      <APIProvider apiKey={API_KEY}>
        <Map
          defaultCenter={initialCenter}
          defaultZoom={initialZoom}
          mapId="hommies-explore-map"
          gestureHandling="greedy"
          disableDefaultUI={false}
          zoomControl
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={false}
          style={{ width: "100%", height: "100%" }}
        >
          <MarkerLayer groups={groups} />
          <Pan selectedCity={selectedCity} panToArea={panToArea} groups={groups} />
        </Map>
      </APIProvider>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs shadow-lg z-10">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-primary" />
          <span>{properties.length} {properties.length === 1 ? "bolig" : "boliger"}</span>
        </div>
      </div>
    </div>
  );
}

/* ───────── Markers + popups ───────── */

function MarkerLayer({ groups }: { groups: MarkerGroup[] }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  return (
    <>
      {groups.map((g) => {
        const count = g.properties.length;
        return (
          <AdvancedMarker
            key={g.key}
            position={g.coords}
            onClick={() => setOpenKey(g.key)}
          >
            <div
              className="rounded-full flex items-center justify-center font-bold text-white shadow-lg border-2 border-white"
              style={{
                background: "#dc6455",
                width: count > 1 ? 38 : 32,
                height: count > 1 ? 38 : 32,
                fontSize: count > 1 ? 13 : 12,
              }}
            >
              {count > 1 ? count : <Home className="w-4 h-4" />}
            </div>
            {openKey === g.key && (
              <InfoWindow position={g.coords} onCloseClick={() => setOpenKey(null)} pixelOffset={[0, -16]}>
                <PopupContent properties={g.properties} />
              </InfoWindow>
            )}
          </AdvancedMarker>
        );
      })}
    </>
  );
}

function PopupContent({ properties }: { properties: Property[] }) {
  const navigate = useNavigate();
  // SPA-navigation i stedet for <a href> (som ellers giver fuld side-reload).
  const goTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/property/${id}`);
  };
  if (properties.length === 1) {
    const p = properties[0];
    return (
      <div style={{ minWidth: 200, maxWidth: 240 }}>
        {p.images?.[0] && (
          <img
            src={p.images[0]}
            alt={p.title}
            style={{ width: "100%", height: 96, objectFit: "cover", borderRadius: 6, marginBottom: 8 }}
          />
        )}
        <h3 style={{ fontWeight: 600, fontSize: 14, margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {p.title}
        </h3>
        <p style={{ fontSize: 12, color: "#666", margin: "0 0 8px" }}>📍 {p.city}</p>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#16a34a" }}>
            {p.monthly_rent.toLocaleString("da-DK")} kr/md
          </span>
          {p.size_sqm && <span style={{ fontSize: 12, color: "#666" }}>{p.size_sqm} m²</span>}
        </div>
        <a
          href={`/property/${p.id}`}
          onClick={goTo(p.id)}
          style={{
            display: "block", textAlign: "center", fontSize: 12, background: "#0f283c",
            color: "white", padding: "6px 12px", borderRadius: 6, textDecoration: "none",
          }}
        >
          Se bolig
        </a>
      </div>
    );
  }

  return (
    <div style={{ minWidth: 200, maxWidth: 280 }}>
      <h3 style={{ fontWeight: 600, fontSize: 14, margin: "0 0 12px" }}>
        {properties.length} boliger i {properties[0].city}
      </h3>
      <div style={{ maxHeight: 200, overflowY: "auto" }}>
        {properties.slice(0, 5).map((p) => (
          <a
            key={p.id}
            href={`/property/${p.id}`}
            onClick={goTo(p.id)}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: 8,
              background: "#f5f5f5", borderRadius: 8, textDecoration: "none",
              color: "inherit", marginBottom: 8,
            }}
          >
            {p.images?.[0] ? (
              <img
                src={p.images[0]}
                alt={p.title}
                style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6, flexShrink: 0 }}
              />
            ) : (
              <div style={{ width: 48, height: 48, background: "#ddd", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                🏠
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 500, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.title}
              </p>
              <p style={{ fontSize: 12, color: "#16a34a", fontWeight: 600, margin: 0 }}>
                {p.monthly_rent.toLocaleString("da-DK")} kr/md
              </p>
            </div>
          </a>
        ))}
        {properties.length > 5 && (
          <p style={{ fontSize: 12, color: "#666", textAlign: "center", margin: "4px 0 0" }}>
            + {properties.length - 5} flere boliger
          </p>
        )}
      </div>
    </div>
  );
}

/* ───────── Imperative pan/zoom ───────── */

function Pan({
  selectedCity, panToArea, groups,
}: { selectedCity?: string | null; panToArea?: string | null; groups: MarkerGroup[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (groups.length === 0) {
      if (selectedCity) {
        const c = danishCityCoords[selectedCity.toLowerCase()];
        if (c) {
          map.panTo({ lat: c[0], lng: c[1] });
          map.setZoom(CITY_ZOOM);
          return;
        }
      }
      map.panTo(DENMARK_CENTER);
      map.setZoom(DENMARK_ZOOM);
      return;
    }
    if (selectedCity) {
      const c = danishCityCoords[selectedCity.toLowerCase()];
      if (c) { map.panTo({ lat: c[0], lng: c[1] }); map.setZoom(CITY_ZOOM); return; }
    }
    if (groups.length === 1) {
      map.panTo(groups[0].coords);
      map.setZoom(CITY_ZOOM);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    groups.forEach((g) => bounds.extend(g.coords));
    map.fitBounds(bounds, 60);
  }, [map, selectedCity, groups]);

  useEffect(() => {
    if (!map || !panToArea) return;
    const areaLower = panToArea.toLowerCase();
    const area = areaCoords[areaLower];
    if (area) {
      map.panTo({ lat: area[0], lng: area[1] });
      map.setZoom(AREA_ZOOM);
      return;
    }
    const city = danishCityCoords[areaLower];
    if (city) {
      map.panTo({ lat: city[0], lng: city[1] });
      map.setZoom(CITY_ZOOM);
    }
  }, [map, panToArea]);

  return null;
}
