import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { Icon, LatLng } from "leaflet";
import { MapPin, Navigation, AlertCircle, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon in React-Leaflet
const customIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Shop location (APlus Cafe) - Update this to your actual shop coordinates
const SHOP_LOCATION = {
  lat: 3.1390, // Kuala Lumpur coordinates as example
  lng: 101.6869,
};

const MAX_DELIVERY_RADIUS_KM = 20;

interface LocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string; isWithinRange: boolean }) => void;
  initialLocation?: { lat: number; lng: number; address: string } | null;
  className?: string;
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Reverse geocoding to get address from coordinates
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          "User-Agent": "APlus Cafe App",
        },
      }
    );
    const data = await response.json();
    return data.display_name || "Address not found";
  } catch {
    return "Unable to fetch address";
  }
}

// Component to handle map clicks
function MapClickHandler({ onLocationClick }: { onLocationClick: (latlng: LatLng) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationClick(e.latlng);
    },
  });
  return null;
}

// Component to recenter map
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

export default function LocationPicker({ onLocationSelect, initialLocation, className = "" }: LocationPickerProps) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    initialLocation ? { lat: initialLocation.lat, lng: initialLocation.lng } : null
  );
  const [address, setAddress] = useState(initialLocation?.address || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [isWithinRange, setIsWithinRange] = useState(true);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(
    initialLocation || SHOP_LOCATION
  );

  const handleLocationSelect = useCallback(
    async (lat: number, lng: number) => {
      setPosition({ lat, lng });
      setIsLoading(true);

      // Calculate distance from shop
      const dist = calculateDistance(SHOP_LOCATION.lat, SHOP_LOCATION.lng, lat, lng);
      setDistance(dist);
      const withinRange = dist <= MAX_DELIVERY_RADIUS_KM;
      setIsWithinRange(withinRange);

      // Get address
      const addr = await reverseGeocode(lat, lng);
      setAddress(addr);
      setIsLoading(false);

      onLocationSelect({ lat, lng, address: addr, isWithinRange: withinRange });
    },
    [onLocationSelect]
  );

  const handleMapClick = (latlng: LatLng) => {
    handleLocationSelect(latlng.lat, latlng.lng);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setMapCenter({ lat: latitude, lng: longitude });
        handleLocationSelect(latitude, longitude);
        setIsLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Unable to get your location. Please select manually on the map.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Map Container */}
      <div className="relative rounded-xl overflow-hidden border border-border" style={{ height: "300px" }}>
        <MapContainer
          center={[mapCenter.lat, mapCenter.lng]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onLocationClick={handleMapClick} />
          <RecenterMap lat={mapCenter.lat} lng={mapCenter.lng} />
          {position && <Marker position={[position.lat, position.lng]} icon={customIcon} />}
        </MapContainer>

        {/* Overlay instructions */}
        {!position && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
            <div className="bg-white/95 rounded-lg px-4 py-2 text-sm font-medium text-foreground shadow-lg">
              <MapPin className="inline-block h-4 w-4 mr-2 text-primary" />
              Click on the map to select your location
            </div>
          </div>
        )}
      </div>

      {/* Use Current Location Button */}
      <Button
        type="button"
        variant="outline"
        onClick={handleUseCurrentLocation}
        disabled={isLocating}
        className="w-full text-xs font-bold uppercase tracking-[0.1em]"
      >
        {isLocating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Getting location...
          </>
        ) : (
          <>
            <Navigation className="h-4 w-4 mr-2" />
            Use My Current Location
          </>
        )}
      </Button>

      {/* Selected Address Display */}
      {position && (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Selected Location
            </label>
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Fetching address...
                </div>
              ) : (
                <p className="text-sm text-foreground">{address}</p>
              )}
            </div>
          </div>

          {/* Distance & Delivery Range Check */}
          {distance !== null && (
            <div
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                isWithinRange
                  ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800"
                  : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"
              }`}
            >
              {isWithinRange ? (
                <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              )}
              <div>
                <p
                  className={`text-sm font-medium ${
                    isWithinRange ? "text-green-800 dark:text-green-300" : "text-red-800 dark:text-red-300"
                  }`}
                >
                  {isWithinRange ? "Within delivery range" : "Outside delivery area"}
                </p>
                <p
                  className={`text-xs mt-0.5 ${
                    isWithinRange ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  }`}
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  Distance: {distance.toFixed(1)} km
                  {!isWithinRange && ` (max ${MAX_DELIVERY_RADIUS_KM} km)`}
                </p>
              </div>
            </div>
          )}

          {/* Address Input for manual editing */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Delivery Instructions / Unit No.
            </label>
            <Input
              placeholder="Add unit number, building name, or delivery instructions..."
              className="text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}
