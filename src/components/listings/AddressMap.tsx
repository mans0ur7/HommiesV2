import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

interface Props {
  lat: number;
  lon: number;
}

export default function AddressMap({ lat, lon }: Props) {
  if (!API_KEY) {
    return (
      <div className="rounded-xl border border-border bg-muted/40 text-xs text-muted-foreground p-4" style={{ height: 220 }}>
        Google Maps API key mangler i VITE_GOOGLE_MAPS_API_KEY.
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-border" style={{ height: 220 }}>
      <APIProvider apiKey={API_KEY}>
        <Map
          key={`${lat},${lon}`}
          defaultCenter={{ lat, lng: lon }}
          defaultZoom={16}
          mapId="hommies-address-map"
          gestureHandling="cooperative"
          disableDefaultUI
          zoomControl
          style={{ width: "100%", height: "100%" }}
        >
          <AdvancedMarker position={{ lat, lng: lon }}>
            <Pin background="#0f283c" borderColor="#ffffff" glyphColor="#ffffff" />
          </AdvancedMarker>
        </Map>
      </APIProvider>
    </div>
  );
}
