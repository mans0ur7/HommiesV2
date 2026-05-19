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
};

const DENMARK_CENTER: [number, number] = [55.8, 10.5];
const CITY_ZOOM = 12;
const AREA_ZOOM = 14;
const DENMARK_ZOOM = 7;

// Area coordinates within cities
const areaCoords: Record<string, [number, number]> = {
  // Copenhagen areas
  "nørrebro": [55.6969, 12.5505],
  "østerbro": [55.7062, 12.5758],
  "vesterbro": [55.6645, 12.5456],
  "amager": [55.6380, 12.6102],
  "frederiksberg": [55.6786, 12.5304],
  "indre by": [55.6786, 12.5783],
  "indreby": [55.6786, 12.5783],
  "valby": [55.6601, 12.5020],
  "ørestad": [55.6280, 12.5793],
  "orestad": [55.6280, 12.5793],
  // Aarhus areas
  "midtbyen": [56.1560, 10.2089],
  "risskov": [56.1885, 10.2214],
  "katrinebjerg": [56.1712, 10.1915],
  "skejby": [56.1939, 10.1872],
  "universitetsparken": [56.1685, 10.1992],
  // Odense areas
  "bolbro": [55.3939, 10.3619],
  "cortex park": [55.3689, 10.4287],
  "sdu campus": [55.3689, 10.4287],
  // Aalborg areas
  "aalborg midtbyen": [57.0480, 9.9170],
  "vestbyen": [57.0488, 9.8950],
  "aau campus": [57.0155, 9.9857],
  // Roskilde areas
  "roskilde c": [55.6426, 12.0878],
  "trekroner": [55.6510, 12.1350],
  "musicon": [55.6320, 12.0850],
  "sankt jørgenbjerg": [55.6480, 12.0750],
  "ogadekvarteret": [55.6380, 12.0920],
};

interface Property {
  id: string;
  title: string;
  city: string;
  address: string;
  monthly_rent: number;
  images?: string[];
  size_sqm?: number;
  room_count?: number;
}

interface PropertyMapProps {
  properties: Property[];
  selectedCity?: string | null;
  panToArea?: string | null;
}

export default function PropertyMap({ properties, selectedCity, panToArea }: PropertyMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Group properties by city
  const groupedProperties = useMemo(() => {
    const groups: Record<string, { coords: [number, number]; properties: Property[] }> = {};

    properties.forEach((property) => {
      const cityLower = (property.city || "").toLowerCase();
      const coords = danishCityCoords[cityLower];

      if (coords) {
        const key = `${coords[0]},${coords[1]}`;
        if (!groups[key]) {
          groups[key] = { coords, properties: [] };
        }
        groups[key].properties.push(property);
      }
    });

    return Object.values(groups);
  }, [properties]);

  // Calculate initial center
  const initialCenter = useMemo((): [number, number] => {
    if (selectedCity) {
      const cityLower = selectedCity.toLowerCase();
      const coords = danishCityCoords[cityLower];
      if (coords) return coords;
    }
    if (groupedProperties.length > 0) {
      return groupedProperties[0].coords;
    }
    return DENMARK_CENTER;
  }, [selectedCity, groupedProperties]);

  const initialZoom = selectedCity || groupedProperties.length === 1 ? CITY_ZOOM : DENMARK_ZOOM;

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create map
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      scrollWheelZoom: true,
    });

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when properties change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing layers (except tile layer)
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.LayerGroup) {
        map.removeLayer(layer);
      }
    });

    // Create custom icon
    const createPropertyIcon = (count?: number) => {
      const html = count
        ? `<div style="background: hsl(var(--primary)); color: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 2px solid white;">${count}</div>`
        : `<div style="background: hsl(var(--primary)); color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 2px solid white;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            </svg>
          </div>`;

      return L.divIcon({
        html,
        className: "custom-property-marker",
        iconSize: count ? [36, 36] : [32, 32],
        iconAnchor: count ? [18, 18] : [16, 32],
        popupAnchor: [0, count ? -18 : -32],
      });
    };

    // Add markers for each property group
    groupedProperties.forEach((group) => {
      const { coords, properties: groupProps } = group;

      const icon = groupProps.length > 1 ? createPropertyIcon(groupProps.length) : createPropertyIcon();
      const marker = L.marker(coords, { icon }).addTo(map);

      // Create popup content
      const popupContent = createPopupContent(groupProps);
      marker.bindPopup(popupContent, { maxWidth: 300, className: "property-popup" });
    });

    // Adjust view
    if (groupedProperties.length === 0) {
      map.setView(selectedCity ? danishCityCoords[selectedCity.toLowerCase()] || DENMARK_CENTER : DENMARK_CENTER, selectedCity ? CITY_ZOOM : DENMARK_ZOOM);
    } else if (selectedCity) {
      const coords = danishCityCoords[selectedCity.toLowerCase()];
      if (coords) map.setView(coords, CITY_ZOOM);
    } else if (groupedProperties.length === 1) {
      map.setView(groupedProperties[0].coords, CITY_ZOOM);
    } else {
      const bounds = L.latLngBounds(groupedProperties.map((g) => g.coords));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [groupedProperties, selectedCity]);

  // Pan to area when panToArea changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !panToArea) return;

    const areaLower = panToArea.toLowerCase();
    
    // First check area-specific coordinates
    const areaCoord = areaCoords[areaLower];
    if (areaCoord) {
      map.flyTo(areaCoord, AREA_ZOOM, { duration: 0.8 });
      return;
    }
    
    // Then check city coordinates
    const cityCoord = danishCityCoords[areaLower];
    if (cityCoord) {
      map.flyTo(cityCoord, CITY_ZOOM, { duration: 0.8 });
      return;
    }
  }, [panToArea]);

  return (
    <div className="bg-muted rounded-2xl h-[500px] overflow-hidden relative">
      <div ref={mapContainerRef} className="h-full w-full z-0" />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs shadow-lg z-[1000]">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-primary rounded-full"></div>
          <span>{properties.length} boliger</span>
        </div>
      </div>
    </div>
  );
}

function createPopupContent(properties: Property[]): string {
  if (properties.length === 1) {
    const property = properties[0];
    return `
      <div style="min-width: 200px; max-width: 250px;">
        ${property.images?.[0] ? `<img src="${property.images[0]}" alt="${property.title}" style="width: calc(100% + 40px); height: 96px; object-fit: cover; margin: -14px -20px 8px -20px; border-radius: 8px 8px 0 0;" />` : ""}
        <h3 style="font-weight: 600; font-size: 14px; margin: 0 0 4px 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${property.title}</h3>
        <p style="font-size: 12px; color: #666; margin: 0 0 8px 0;">📍 ${property.city}</p>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-size: 14px; font-weight: bold; color: hsl(142 76% 36%);">${property.monthly_rent.toLocaleString("da-DK")} kr/md</span>
          ${property.size_sqm ? `<span style="font-size: 12px; color: #666;">${property.size_sqm} m²</span>` : ""}
        </div>
        <a href="/property/${property.id}" style="display: block; text-align: center; font-size: 12px; background: hsl(142 76% 36%); color: white; padding: 6px 12px; border-radius: 6px; text-decoration: none;">Se bolig</a>
      </div>
    `;
  }

  const propertyList = properties
    .slice(0, 5)
    .map(
      (property) => `
      <a href="/property/${property.id}" style="display: flex; align-items: center; gap: 8px; padding: 8px; background: #f5f5f5; border-radius: 8px; text-decoration: none; color: inherit; margin-bottom: 8px;">
        ${property.images?.[0] ? `<img src="${property.images[0]}" alt="${property.title}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 6px; flex-shrink: 0;" />` : `<div style="width: 48px; height: 48px; background: #ddd; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">🏠</div>`}
        <div style="flex: 1; min-width: 0;">
          <p style="font-size: 12px; font-weight: 500; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${property.title}</p>
          <p style="font-size: 12px; color: hsl(142 76% 36%); font-weight: 600; margin: 0;">${property.monthly_rent.toLocaleString("da-DK")} kr/md</p>
        </div>
      </a>
    `
    )
    .join("");

  return `
    <div style="min-width: 200px; max-width: 280px;">
      <h3 style="font-weight: 600; font-size: 14px; margin: 0 0 12px 0;">${properties.length} boliger i ${properties[0].city}</h3>
      <div style="max-height: 200px; overflow-y: auto;">${propertyList}${properties.length > 5 ? `<p style="font-size: 12px; color: #666; text-align: center; margin: 4px 0 0 0;">+ ${properties.length - 5} flere boliger</p>` : ""}</div>
    </div>
  `;
}
