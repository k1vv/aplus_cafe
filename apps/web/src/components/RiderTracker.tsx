import { useState, useEffect, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import { Icon, DivIcon } from "leaflet";
import { Truck, MapPin, RefreshCw, Loader2, User, Store, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SHOP_LOCATION } from "@/lib/constants";
import "leaflet/dist/leaflet.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// OSRM API for real road routing
const OSRM_API = 'https://router.project-osrm.org/route/v1/driving';

// Custom icons
const riderIcon = new Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2830/2830305.png", // Motorcycle icon
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

// User location icon (blue house/pin)
const destinationIcon = new DivIcon({
  html: `<div style="background: #3b82f6; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); animation: pulse 2s infinite;">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  </div>
  <style>
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
  </style>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

// Shop icon (coffee shop)
const shopIcon = new DivIcon({
  html: `<div style="background: #22c55e; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17 8h1a4 4 0 1 1 0 8h-1"></path>
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path>
      <line x1="6" x2="6" y1="2" y2="4"></line>
      <line x1="10" x2="10" y1="2" y2="4"></line>
      <line x1="14" x2="14" y1="2" y2="4"></line>
    </svg>
  </div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

interface RiderLocation {
  lat: number | null;
  lng: number | null;
  riderName: string;
  vehicleType: string;
  deliveryStatus: string;
  shopLat?: number;
  shopLng?: number;
  destLat?: number;
  destLng?: number;
  progressPercent?: number;
  isSimulation?: boolean;
}

interface RiderTrackerProps {
  orderId: string;
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  className?: string;
}

// Fetch route from OSRM API
async function fetchRoute(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): Promise<[number, number][]> {
  try {
    const url = `${OSRM_API}/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Route fetch failed');

    const data = await response.json();
    if (data.routes && data.routes.length > 0) {
      // OSRM returns coordinates as [lng, lat], convert to [lat, lng] for Leaflet
      return data.routes[0].geometry.coordinates.map(
        (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
      );
    }
  } catch (error) {
    console.error('Failed to fetch route:', error);
  }
  // Fallback to straight line
  return [[start.lat, start.lng], [end.lat, end.lng]];
}

// Component to auto-recenter on rider every 7 seconds
function RecenterOnRider({ riderLat, riderLng }: { riderLat: number | null; riderLng: number | null }) {
  const map = useMap();
  const lastRecenterRef = useRef<number>(0);

  useEffect(() => {
    if (!riderLat || !riderLng) return;

    // Recenter every 7 seconds
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastRecenterRef.current >= 7000) {
        map.setView([riderLat, riderLng], map.getZoom(), { animate: true });
        lastRecenterRef.current = now;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [riderLat, riderLng, map]);

  // Initial center
  useEffect(() => {
    if (riderLat && riderLng) {
      map.setView([riderLat, riderLng], 15);
      lastRecenterRef.current = Date.now();
    }
  }, []);

  return null;
}

// Initial bounds setup - only runs once on mount
function InitialBounds({ points }: { points: { lat: number; lng: number }[] }) {
  const map = useMap();
  const hasSetBounds = useRef(false);

  useEffect(() => {
    if (hasSetBounds.current || points.length === 0) return;

    if (points.length >= 2) {
      const bounds = points.map(p => [p.lat, p.lng] as [number, number]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 14);
    }
    hasSetBounds.current = true;
  }, [points, map]);

  return null;
}

export default function RiderTracker({
  orderId,
  deliveryLat,
  deliveryLng,
  className = "",
}: RiderTrackerProps) {
  const [riderLocation, setRiderLocation] = useState<RiderLocation | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollIntervalRef = useRef<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Route state for real road paths
  const [routeToRider, setRouteToRider] = useState<[number, number][]>([]);
  const [routeToDestination, setRouteToDestination] = useState<[number, number][]>([]);
  const lastRouteKey = useRef<string>('');

  // Use destination from props or from API response
  const destination = riderLocation?.destLat && riderLocation?.destLng
    ? { lat: riderLocation.destLat, lng: riderLocation.destLng }
    : deliveryLat && deliveryLng
      ? { lat: deliveryLat, lng: deliveryLng }
      : null;

  // Shop location from API or constant
  const shopLocation = riderLocation?.shopLat && riderLocation?.shopLng
    ? { lat: riderLocation.shopLat, lng: riderLocation.shopLng }
    : SHOP_LOCATION;

  // Fetch routes when positions change
  useEffect(() => {
    if (!riderLocation?.lat || !riderLocation?.lng) return;

    const riderPos = { lat: riderLocation.lat, lng: riderLocation.lng };

    // Create a key to avoid redundant fetches
    const routeKey = `${shopLocation.lat},${shopLocation.lng}-${riderPos.lat.toFixed(4)},${riderPos.lng.toFixed(4)}-${destination?.lat ?? 0},${destination?.lng ?? 0}`;

    // Only fetch if destination has changed (rider moves too frequently for every update)
    const destKey = `${destination?.lat ?? 0},${destination?.lng ?? 0}`;
    const prevDestKey = lastRouteKey.current.split('-')[2] || '';

    if (destKey !== prevDestKey || routeToDestination.length === 0) {
      lastRouteKey.current = routeKey;

      // Fetch route from shop to rider (completed path)
      fetchRoute(shopLocation, riderPos).then(setRouteToRider);

      // Fetch route from rider to destination (remaining path)
      if (destination) {
        fetchRoute(riderPos, destination).then(setRouteToDestination);
      }
    }
  }, [riderLocation?.lat, riderLocation?.lng, destination?.lat, destination?.lng, shopLocation]);

  // Fetch rider location via polling
  const fetchRiderLocation = useCallback(async () => {
    const token = localStorage.getItem('aplus_auth_token');
    if (!token) {
      setError('Please log in to track your delivery');
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/orders/${orderId}/rider-location/current`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data) {
          setRiderLocation(data);
          setLastUpdate(new Date());
          setError(null);
        }
      } else if (response.status === 404) {
        setError('Rider not yet assigned');
      } else {
        setError('Failed to get rider location');
      }
    } catch (e) {
      console.error('Failed to fetch rider location:', e);
      setError('Connection error. Retrying...');
    }
  }, [orderId]);

  // Start polling
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) return;

    setIsPolling(true);
    fetchRiderLocation();

    // Poll every 2 seconds for SimBot simulation, 5 seconds otherwise
    const interval = riderLocation?.isSimulation ? 2000 : 5000;
    pollIntervalRef.current = window.setInterval(fetchRiderLocation, interval);
  }, [fetchRiderLocation, riderLocation?.isSimulation]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Start polling on mount
  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, []);

  // Adjust polling interval when we know it's SimBot
  useEffect(() => {
    if (riderLocation?.isSimulation && pollIntervalRef.current) {
      stopPolling();
      setIsPolling(true);
      fetchRiderLocation();
      pollIntervalRef.current = window.setInterval(fetchRiderLocation, 2000);
    }
  }, [riderLocation?.isSimulation]);

  // Stop polling if delivered
  useEffect(() => {
    if (riderLocation?.deliveryStatus === 'DELIVERED') {
      stopPolling();
    }
  }, [riderLocation?.deliveryStatus, stopPolling]);

  // Get all points for map bounds
  const allPoints: { lat: number; lng: number }[] = [];
  if (shopLocation) allPoints.push(shopLocation);
  if (riderLocation?.lat && riderLocation?.lng) {
    allPoints.push({ lat: riderLocation.lat, lng: riderLocation.lng });
  }
  if (destination) allPoints.push(destination);

  const mapCenter = riderLocation?.lat && riderLocation?.lng
    ? { lat: riderLocation.lat, lng: riderLocation.lng }
    : shopLocation;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PICKED_UP':
      case 'IN_TRANSIT':
        return 'text-green-500';
      case 'ASSIGNED':
        return 'text-blue-500';
      case 'DELIVERED':
        return 'text-primary';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ASSIGNED':
        return 'Rider assigned - preparing to pick up';
      case 'PICKED_UP':
        return 'Order picked up - on the way!';
      case 'IN_TRANSIT':
        return 'Almost there!';
      case 'DELIVERED':
        return 'Delivered!';
      default:
        return status.replace(/_/g, ' ');
    }
  };

  const progressPercent = riderLocation?.progressPercent ?? 0;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Rider Info */}
      {riderLocation && (
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{riderLocation.riderName || 'Your Rider'}</p>
                <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace" }}>
                  {riderLocation.vehicleType || 'Motorcycle'}
                  {riderLocation.isSimulation && (
                    <span className="ml-2 px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 text-[10px]">
                      SimBot
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 ${getStatusColor(riderLocation.deliveryStatus)}`}>
              <Truck className="h-4 w-4" />
              <span className="text-xs font-medium">{getStatusText(riderLocation.deliveryStatus)}</span>
            </div>
          </div>

          {/* Progress Bar */}
          {riderLocation.deliveryStatus !== 'DELIVERED' && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                <span className="flex items-center gap-1">
                  <Store className="h-3 w-3" />
                  Cafe
                </span>
                <span>{progressPercent}%</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  You
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 via-primary to-orange-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="relative h-4 mt-0.5">
                <div
                  className="absolute transition-all duration-500"
                  style={{ left: `${Math.max(0, Math.min(progressPercent - 2, 96))}%` }}
                >
                  <Navigation className="h-4 w-4 text-primary transform rotate-90" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Map - isolate creates new stacking context to prevent z-index leakage */}
      <div className="relative rounded-xl overflow-hidden border border-border isolate" style={{ height: "280px" }}>
        {!riderLocation?.lat ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50">
            {error ? (
              <>
                <p className="text-sm text-muted-foreground mb-2">{error}</p>
                <Button variant="outline" size="sm" onClick={() => fetchRiderLocation()}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Retry
                </Button>
              </>
            ) : (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Waiting for rider location...</p>
              </>
            )}
          </div>
        ) : (
          <MapContainer
            center={[mapCenter.lat, mapCenter.lng]}
            zoom={15}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
            dragging={true}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <InitialBounds points={allPoints} />
            <RecenterOnRider riderLat={riderLocation.lat} riderLng={riderLocation.lng} />

            {/* Shop marker */}
            {shopLocation && (
              <Marker
                position={[shopLocation.lat, shopLocation.lng]}
                icon={shopIcon}
              />
            )}

            {/* Rider marker */}
            <Marker
              position={[riderLocation.lat, riderLocation.lng]}
              icon={riderIcon}
            />

            {/* Destination marker */}
            {destination && (
              <Marker
                position={[destination.lat, destination.lng]}
                icon={destinationIcon}
              />
            )}

            {/* Route line from shop to rider (completed path - solid green) */}
            {routeToRider.length > 0 && (
              <Polyline
                positions={routeToRider}
                color="#22c55e"
                weight={5}
                opacity={0.8}
              />
            )}

            {/* Route line from rider to destination (remaining path - dashed blue) */}
            {routeToDestination.length > 0 && (
              <Polyline
                positions={routeToDestination}
                color="#3b82f6"
                weight={5}
                opacity={0.9}
                dashArray="12, 8"
              />
            )}
          </MapContainer>
        )}

        {/* Connection status indicator */}
        <div className="absolute top-2 right-2 z-[1000]">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium ${
            isPolling
              ? 'bg-green-500/10 text-green-600'
              : 'bg-muted text-muted-foreground'
          }`}>
            <div className={`h-1.5 w-1.5 rounded-full ${
              isPolling ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'
            }`} />
            {isPolling ? 'Live' : 'Offline'}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span>Cafe</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-orange-500" />
          <span>Rider</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3 w-3 text-blue-500" />
          <span>Your Location</span>
        </div>
      </div>

      {/* Last update */}
      {lastUpdate && (
        <p className="text-center text-[10px] text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace" }}>
          Last updated: {lastUpdate.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
