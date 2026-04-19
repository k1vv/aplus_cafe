import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import { Icon, DivIcon } from "leaflet";
import {
  Bike, LogOut, MapPin, Package, Phone, Navigation, Clock,
  CheckCircle2, Truck, AlertCircle, User, Star, ToggleLeft, ToggleRight,
  Wifi, WifiOff, Battery, BatteryWarning, Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { riderApi, RiderProfile, RiderDelivery } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { SHOP_LOCATION } from "@/lib/constants";
import { toast } from "sonner";
import { format } from "date-fns";
import "leaflet/dist/leaflet.css";

// Wake Lock API types
interface WakeLockSentinel {
  released: boolean;
  release: () => Promise<void>;
  addEventListener: (type: string, listener: () => void) => void;
}

declare global {
  interface Navigator {
    wakeLock?: {
      request: (type: 'screen') => Promise<WakeLockSentinel>;
    };
  }
}

// Custom icons
const riderIcon = new DivIcon({
  html: `<div style="background: #3b82f6; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="18.5" cy="17.5" r="3.5"></circle>
      <circle cx="5.5" cy="17.5" r="3.5"></circle>
      <circle cx="15" cy="5" r="1"></circle>
      <path d="M12 17.5V14l-3-3 4-3 2 3h2"></path>
    </svg>
  </div>`,
  className: '',
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

const shopIcon = new DivIcon({
  html: `<div style="background: #22c55e; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <path d="M17 8h1a4 4 0 1 1 0 8h-1"></path>
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path>
    </svg>
  </div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Map component to fit bounds
function MapBoundsUpdater({ points }: { points: { lat: number; lng: number }[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length >= 2) {
      const bounds = points.map(p => [p.lat, p.lng] as [number, number]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    } else if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 15);
    }
  }, [points, map]);
  return null;
}

export default function RiderDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<RiderProfile | null>(null);
  const [activeDelivery, setActiveDelivery] = useState<RiderDelivery | null>(null);
  const [pastDeliveries, setPastDeliveries] = useState<RiderDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [lastLocationUpdate, setLastLocationUpdate] = useState<Date | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const locationIntervalRef = useRef<number | null>(null);

  // Fetch rider data
  const fetchData = useCallback(async () => {
    const [profileRes, activeRes, deliveriesRes] = await Promise.all([
      riderApi.getProfile(),
      riderApi.getActiveDelivery(),
      riderApi.getDeliveries(),
    ]);

    if (profileRes.data) setProfile(profileRes.data);
    if (activeRes.data !== undefined) setActiveDelivery(activeRes.data);
    if (deliveriesRes.data) {
      setPastDeliveries(deliveriesRes.data.filter(d => d.status === 'DELIVERED' || d.status === 'CANCELLED'));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ==================== WAKE LOCK (Keep Screen On) ====================
  const requestWakeLock = useCallback(async () => {
    if (!navigator.wakeLock) {
      console.log("Wake Lock API not supported");
      return;
    }

    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      setWakeLockActive(true);
      console.log("Wake Lock acquired");

      wakeLockRef.current.addEventListener('release', () => {
        setWakeLockActive(false);
        console.log("Wake Lock released");
      });
    } catch (err) {
      console.error("Failed to acquire Wake Lock:", err);
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current && !wakeLockRef.current.released) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
      setWakeLockActive(false);
    }
  }, []);

  // ==================== VISIBILITY CHANGE HANDLER ====================
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = document.visibilityState === 'visible';
      setIsPageVisible(visible);

      if (visible) {
        // Page became visible - re-acquire wake lock and restart tracking only if has active delivery
        if (activeDelivery) {
          requestWakeLock();
          if (!isTracking) {
            startTracking();
          }
        }
        // Refresh data when coming back
        fetchData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [activeDelivery, isTracking]);

  // ==================== GPS TRACKING ====================
  const sendLocationToServer = useCallback(async (latitude: number, longitude: number) => {
    const { error } = await riderApi.updateLocation(latitude, longitude);
    if (!error) {
      setLastLocationUpdate(new Date());
    } else {
      console.error("Failed to update location:", error);
    }
  }, []);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser");
      return;
    }

    setIsTracking(true);
    setGpsError(null);

    // Use watchPosition for continuous updates
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        await sendLocationToServer(latitude, longitude);
      },
      (error) => {
        console.error("GPS error:", error);
        setGpsError(
          error.code === 1 ? "Location access denied. Please enable GPS." :
          error.code === 2 ? "Location unavailable" :
          "GPS timeout. Retrying..."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000, // Allow cached position up to 5 seconds
      }
    );

    // Also set up interval as backup (in case watchPosition stops)
    locationIntervalRef.current = window.setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          await sendLocationToServer(latitude, longitude);
        },
        () => {}, // Silent fail for backup
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
      );
    }, 10000); // Every 10 seconds as backup
  }, [sendLocationToServer]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (locationIntervalRef.current !== null) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // ==================== AUTO-START TRACKING (Only when assigned an order) ====================
  useEffect(() => {
    // GPS tracking only activates when there's an active delivery
    const shouldTrack = !!activeDelivery;

    if (shouldTrack && !isTracking) {
      startTracking();
      requestWakeLock();
    } else if (!shouldTrack && isTracking) {
      stopTracking();
      releaseWakeLock();
    }

    return () => {
      stopTracking();
      releaseWakeLock();
    };
  }, [activeDelivery]);

  // Update delivery status
  const handleStatusUpdate = async (newStatus: string) => {
    if (!activeDelivery) return;

    setUpdatingStatus(true);
    const { data, error } = await riderApi.updateDeliveryStatus(activeDelivery.id, newStatus);
    setUpdatingStatus(false);

    if (error) {
      toast.error("Failed to update status", { description: error });
      return;
    }

    if (data) {
      if (newStatus === 'DELIVERED') {
        toast.success("Delivery completed!", { description: "Great job!" });
        setActiveDelivery(null);
        fetchData();
      } else {
        setActiveDelivery(data);
        toast.success(`Status updated to ${newStatus.replace(/_/g, ' ')}`);
      }
    }
  };

  // Toggle availability
  const handleToggleAvailability = async () => {
    if (!profile) return;

    const { data, error } = await riderApi.setAvailability(!profile.isAvailable);
    if (error) {
      toast.error("Failed to update availability");
      return;
    }

    if (data) {
      setProfile({ ...profile, isAvailable: data.isAvailable });
      toast.success(data.message);
    }
  };

  // Logout
  const handleLogout = () => {
    stopTracking();
    releaseWakeLock();
    logout(); // This clears auth state and localStorage
    navigate("/rider/login", { replace: true });
  };

  // Get next status button info
  const getNextStatusInfo = (currentStatus: string) => {
    switch (currentStatus) {
      case 'ASSIGNED':
        return { label: 'Pick Up Order', nextStatus: 'PICKED_UP', color: 'bg-blue-500 hover:bg-blue-600' };
      case 'PICKED_UP':
        return { label: 'Start Delivery', nextStatus: 'IN_TRANSIT', color: 'bg-orange-500 hover:bg-orange-600' };
      case 'IN_TRANSIT':
        return { label: 'Complete Delivery', nextStatus: 'DELIVERED', color: 'bg-green-500 hover:bg-green-600' };
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Map points
  const mapPoints: { lat: number; lng: number }[] = [];
  mapPoints.push(SHOP_LOCATION);
  if (currentLocation) mapPoints.push(currentLocation);
  if (activeDelivery?.deliveryLatitude && activeDelivery?.deliveryLongitude) {
    mapPoints.push({ lat: activeDelivery.deliveryLatitude, lng: activeDelivery.deliveryLongitude });
  }

  const statusInfo = activeDelivery ? getNextStatusInfo(activeDelivery.status) : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Bike className="h-6 w-6" />
            <div>
              <h1 className="text-lg font-bold">{profile?.name || 'Rider'}</h1>
              <p className="text-[10px] opacity-80" style={{ fontFamily: "'Space Mono', monospace" }}>
                {profile?.vehicleType} • {profile?.licensePlate}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Availability Toggle */}
            <button
              onClick={handleToggleAvailability}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                profile?.isAvailable
                  ? 'bg-green-500/20 text-green-100'
                  : 'bg-red-500/20 text-red-100'
              }`}
            >
              {profile?.isAvailable ? (
                <><ToggleRight className="h-4 w-4" /> Online</>
              ) : (
                <><ToggleLeft className="h-4 w-4" /> Offline</>
              )}
            </button>
            <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tracking Status Bar */}
        <div className="px-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* GPS Status */}
            <div className="flex items-center gap-1.5">
              <div className={`h-2 w-2 rounded-full ${isTracking ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-[10px] opacity-80">
                {isTracking ? 'GPS Active' : gpsError || (activeDelivery ? 'Starting GPS...' : 'GPS Off')}
              </span>
            </div>

            {/* Wake Lock Status */}
            <div className="flex items-center gap-1.5">
              {wakeLockActive ? (
                <Battery className="h-3 w-3 text-green-400" />
              ) : (
                <BatteryWarning className="h-3 w-3 text-yellow-400" />
              )}
              <span className="text-[10px] opacity-80">
                {wakeLockActive ? 'Screen Lock' : 'May Sleep'}
              </span>
            </div>
          </div>

          {/* Last Update */}
          {lastLocationUpdate && (
            <span className="text-[10px] opacity-60" style={{ fontFamily: "'Space Mono', monospace" }}>
              Updated: {format(lastLocationUpdate, 'HH:mm:ss')}
            </span>
          )}
        </div>

        {/* Background Warning Banner */}
        {!isPageVisible && (
          <div className="px-4 pb-2">
            <div className="bg-yellow-500/20 text-yellow-200 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Keep this page visible for best tracking accuracy
            </div>
          </div>
        )}
      </header>

      <div className="p-4 space-y-4">
        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <p className="text-2xl font-bold text-primary">{profile?.totalDeliveries || 0}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Deliveries</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <p className="text-2xl font-bold text-yellow-500 flex items-center justify-center gap-1">
              {profile?.rating?.toFixed(1) || '5.0'}
              <Star className="h-4 w-4 fill-yellow-500" />
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Rating</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <p className={`text-2xl font-bold ${profile?.isAvailable ? 'text-green-500' : 'text-muted-foreground'}`}>
              {profile?.isAvailable ? 'ON' : 'OFF'}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Status</p>
          </div>
        </div>

        {/* Active Delivery */}
        {activeDelivery ? (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="bg-primary/10 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <span className="font-bold text-sm">Active Delivery</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                activeDelivery.status === 'ASSIGNED' ? 'bg-blue-500/20 text-blue-600' :
                activeDelivery.status === 'PICKED_UP' ? 'bg-orange-500/20 text-orange-600' :
                activeDelivery.status === 'IN_TRANSIT' ? 'bg-green-500/20 text-green-600' :
                'bg-muted text-muted-foreground'
              }`}>
                {activeDelivery.status.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Map */}
            <div className="h-48 relative">
              <MapContainer
                center={[currentLocation?.lat || SHOP_LOCATION.lat, currentLocation?.lng || SHOP_LOCATION.lng]}
                zoom={14}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={false}
                zoomControl={false}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapBoundsUpdater points={mapPoints} />

                {/* Shop */}
                <Marker position={[SHOP_LOCATION.lat, SHOP_LOCATION.lng]} icon={shopIcon} />

                {/* Rider */}
                {currentLocation && (
                  <Marker position={[currentLocation.lat, currentLocation.lng]} icon={riderIcon} />
                )}

                {/* Destination */}
                {activeDelivery.deliveryLatitude && activeDelivery.deliveryLongitude && (
                  <Marker
                    position={[activeDelivery.deliveryLatitude, activeDelivery.deliveryLongitude]}
                    icon={destinationIcon}
                  />
                )}

                {/* Route line */}
                {currentLocation && activeDelivery.deliveryLatitude && activeDelivery.deliveryLongitude && (
                  <Polyline
                    positions={[
                      [currentLocation.lat, currentLocation.lng],
                      [activeDelivery.deliveryLatitude, activeDelivery.deliveryLongitude]
                    ]}
                    color="#F97316"
                    weight={4}
                    dashArray="10, 10"
                  />
                )}
              </MapContainer>
            </div>

            {/* Delivery Details */}
            <div className="p-4 space-y-3">
              {/* Customer */}
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-sm">{activeDelivery.customerName}</p>
                  {activeDelivery.customerPhone && (
                    <a
                      href={`tel:${activeDelivery.customerPhone}`}
                      className="text-xs text-primary flex items-center gap-1 mt-0.5"
                    >
                      <Phone className="h-3 w-3" /> {activeDelivery.customerPhone}
                    </a>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm">{activeDelivery.deliveryAddress}</p>
                  {activeDelivery.deliveryNotes && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      Note: {activeDelivery.deliveryNotes}
                    </p>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Order Items</p>
                  <div className="space-y-0.5">
                    {activeDelivery.orderItems.map((item, i) => (
                      <p key={i} className="text-sm">{item.quantity}× {item.name}</p>
                    ))}
                  </div>
                  <p className="text-sm font-bold text-primary mt-1">
                    Total: RM {activeDelivery.orderTotal.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              {statusInfo && (
                <Button
                  onClick={() => handleStatusUpdate(statusInfo.nextStatus)}
                  disabled={updatingStatus}
                  className={`w-full text-sm font-bold uppercase tracking-wider ${statusInfo.color} text-white`}
                  size="lg"
                >
                  {updatingStatus ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Updating...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {statusInfo.nextStatus === 'PICKED_UP' && <Package className="h-4 w-4" />}
                      {statusInfo.nextStatus === 'IN_TRANSIT' && <Truck className="h-4 w-4" />}
                      {statusInfo.nextStatus === 'DELIVERED' && <CheckCircle2 className="h-4 w-4" />}
                      {statusInfo.label}
                    </span>
                  )}
                </Button>
              )}

              {/* Navigate Button */}
              {activeDelivery.deliveryLatitude && activeDelivery.deliveryLongitude && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${activeDelivery.deliveryLatitude},${activeDelivery.deliveryLongitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button variant="outline" className="w-full text-sm" size="lg">
                    <Navigation className="h-4 w-4 mr-2" />
                    Open in Google Maps
                  </Button>
                </a>
              )}
            </div>
          </div>
        ) : (
          /* No Active Delivery */
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-lg mb-2">No Active Deliveries</h3>
            <p className="text-sm text-muted-foreground">
              {profile?.isAvailable
                ? "GPS tracking will start when a delivery is assigned."
                : "Go online to receive delivery assignments."}
            </p>
          </div>
        )}

        {/* Past Deliveries */}
        {pastDeliveries.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent Deliveries
            </h3>
            <div className="space-y-2">
              {pastDeliveries.slice(0, 5).map((delivery) => (
                <div
                  key={delivery.id}
                  className="bg-card rounded-lg border border-border p-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">Order #{delivery.orderId}</p>
                    <p className="text-xs text-muted-foreground">{delivery.deliveryAddress}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold ${
                      delivery.status === 'DELIVERED' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {delivery.status}
                    </span>
                    <p className="text-[10px] text-muted-foreground">
                      RM {delivery.orderTotal.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
