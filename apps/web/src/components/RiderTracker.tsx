import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import { Icon, LatLng } from "leaflet";
import { Truck, MapPin, RefreshCw, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import "leaflet/dist/leaflet.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Custom icons
const riderIcon = new Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2830/2830305.png", // Motorcycle icon
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const destinationIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Shop location
const SHOP_LOCATION = {
  lat: 3.1390,
  lng: 101.6869,
};

interface RiderLocation {
  lat: number | null;
  lng: number | null;
  riderName: string;
  vehicleType: string;
  deliveryStatus: string;
}

interface RiderTrackerProps {
  orderId: string;
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  className?: string;
}

// Component to recenter map when rider moves
function MapUpdater({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

export default function RiderTracker({
  orderId,
  deliveryLat,
  deliveryLng,
  className = "",
}: RiderTrackerProps) {
  const [riderLocation, setRiderLocation] = useState<RiderLocation | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Parse delivery coordinates from address if available
  const destination = deliveryLat && deliveryLng
    ? { lat: deliveryLat, lng: deliveryLng }
    : SHOP_LOCATION;

  // SSE connection for real-time tracking
  const connectSSE = useCallback(() => {
    const token = localStorage.getItem('aplus_auth_token');
    if (!token) {
      setError('Please log in to track your delivery');
      return;
    }

    try {
      const eventSource = new EventSource(
        `${API_BASE_URL}/orders/${orderId}/rider-location?token=${encodeURIComponent(token)}`
      );

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
      };

      eventSource.addEventListener('rider-location', (event) => {
        try {
          const data = JSON.parse(event.data);
          setRiderLocation(data);
        } catch (e) {
          console.error('Failed to parse rider location:', e);
        }
      });

      eventSource.onerror = () => {
        setIsConnected(false);
        setError('Connection lost. Trying to reconnect...');
        eventSource.close();
        // Fallback to polling
        startPolling();
      };

      return () => {
        eventSource.close();
        setIsConnected(false);
      };
    } catch (e) {
      setError('Failed to connect. Using polling instead.');
      startPolling();
    }
  }, [orderId]);

  // Polling fallback
  const fetchRiderLocation = async () => {
    const token = localStorage.getItem('aplus_auth_token');
    if (!token) return;

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
        }
      }
    } catch (e) {
      console.error('Failed to fetch rider location:', e);
    }
  };

  const startPolling = useCallback(() => {
    if (isPolling) return;
    setIsPolling(true);
    fetchRiderLocation();
    const interval = setInterval(fetchRiderLocation, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [orderId, isPolling]);

  useEffect(() => {
    const cleanup = connectSSE();
    return cleanup;
  }, [connectSSE]);

  // Calculate route line between rider and destination
  const routeLine: [number, number][] = riderLocation?.lat && riderLocation?.lng
    ? [[riderLocation.lat, riderLocation.lng], [destination.lat, destination.lng]]
    : [];

  const mapCenter = riderLocation?.lat && riderLocation?.lng
    ? { lat: riderLocation.lat, lng: riderLocation.lng }
    : destination;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PICKED_UP':
      case 'IN_TRANSIT':
        return 'text-green-500';
      case 'ASSIGNED':
        return 'text-blue-500';
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

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Rider Info */}
      {riderLocation && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">{riderLocation.riderName || 'Your Rider'}</p>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace" }}>
                {riderLocation.vehicleType || 'Motorcycle'}
              </p>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 ${getStatusColor(riderLocation.deliveryStatus)}`}>
            <Truck className="h-4 w-4" />
            <span className="text-xs font-medium">{getStatusText(riderLocation.deliveryStatus)}</span>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="relative rounded-xl overflow-hidden border border-border" style={{ height: "300px" }}>
        {!riderLocation?.lat ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50">
            {error ? (
              <>
                <p className="text-sm text-muted-foreground mb-2">{error}</p>
                <Button variant="outline" size="sm" onClick={() => connectSSE()}>
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
            zoom={14}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapUpdater center={mapCenter} />

            {/* Rider marker */}
            <Marker
              position={[riderLocation.lat, riderLocation.lng]}
              icon={riderIcon}
            />

            {/* Destination marker */}
            <Marker
              position={[destination.lat, destination.lng]}
              icon={destinationIcon}
            />

            {/* Route line */}
            {routeLine.length > 0 && (
              <Polyline
                positions={routeLine}
                color="#F97316"
                weight={4}
                dashArray="10, 10"
              />
            )}
          </MapContainer>
        )}

        {/* Connection status indicator */}
        <div className="absolute top-2 right-2 z-[1000]">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium ${
            isConnected
              ? 'bg-green-500/10 text-green-600'
              : isPolling
                ? 'bg-yellow-500/10 text-yellow-600'
                : 'bg-muted text-muted-foreground'
          }`}>
            <div className={`h-1.5 w-1.5 rounded-full ${
              isConnected ? 'bg-green-500 animate-pulse' : isPolling ? 'bg-yellow-500' : 'bg-muted-foreground'
            }`} />
            {isConnected ? 'Live' : isPolling ? 'Polling' : 'Offline'}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-orange-500" />
          <span>Rider</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3 w-3 text-blue-500" />
          <span>Destination</span>
        </div>
      </div>
    </div>
  );
}
