import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from "react-leaflet";
import { Icon, LatLng } from "leaflet";
import { MapPin, Navigation, AlertCircle, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SHOP_LOCATION, MAX_DELIVERY_RADIUS_KM } from "@/lib/constants";
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

// Custom cafe/shop icon (red marker)
const cafeIcon = new Icon({
  iconUrl: "data:image/svg+xml;base64," + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
      <path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 26 16 26s16-14 16-26C32 7.2 24.8 0 16 0z" fill="#dc2626"/>
      <circle cx="16" cy="14" r="8" fill="white"/>
      <text x="16" y="18" text-anchor="middle" font-size="10" font-weight="bold" fill="#dc2626">A+</text>
    </svg>
  `),
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -42],
});

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

          {/* Cafe/Shop Location Marker */}
          <Marker position={[SHOP_LOCATION.lat, SHOP_LOCATION.lng]} icon={cafeIcon}>
            <Popup>
              <div className="text-center">
                <p className="font-bold text-sm">{SHOP_LOCATION.name}</p>
                <p className="text-xs text-gray-600">{SHOP_LOCATION.address}</p>
              </div>
            </Popup>
          </Marker>

          {/* Delivery radius circle */}
          <Circle
            center={[SHOP_LOCATION.lat, SHOP_LOCATION.lng]}
            radius={MAX_DELIVERY_RADIUS_KM * 1000}
            pathOptions={{
              color: "#22c55e",
              fillColor: "#22c55e",
              fillOpacity: 0.1,
              weight: 2,
              dashArray: "5, 10",
            }}
          />

          {/* User's selected location marker */}
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

        {/* Map Legend */}
        <div className="absolute bottom-2 left-2 bg-white/95 dark:bg-gray-900/95 rounded-lg px-3 py-2 shadow-lg text-xs z-[1000]">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-red-600">📍</span>
            <span className="text-gray-700 dark:text-gray-300">APlus Cafe</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-600">📍</span>
            <span className="text-gray-700 dark:text-gray-300">Your location</span>
          </div>
          <div className="flex items-center gap-2 mt-1 pt-1 border-t border-gray-200 dark:border-gray-700">
            <span className="w-3 h-0.5 bg-green-500 border border-dashed border-green-600"></span>
            <span className="text-gray-600 dark:text-gray-400">Delivery area</span>
          </div>
        </div>
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
