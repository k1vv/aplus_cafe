import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, User, Mail, Phone, MapPin, Plus, Trash2, Edit2, Check, X, Star, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { userApi, Address, reservationsApi, Reservation, SavedDeliveryAddress } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import LoadingOverlay from "@/components/LoadingOverlay";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: "", street: "", city: "", postalCode: "" });
  const [savingAddress, setSavingAddress] = useState(false);

  // Delivery address (saved from checkout)
  const [deliveryAddress, setDeliveryAddress] = useState<SavedDeliveryAddress | null>(null);
  const [loadingDeliveryAddress, setLoadingDeliveryAddress] = useState(true);

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(true);

  useEffect(() => {
    fetchAddresses();
    fetchDeliveryAddress();
    fetchReservations();
  }, []);

  const fetchDeliveryAddress = async () => {
    setLoadingDeliveryAddress(true);
    try {
      const { data } = await userApi.getDeliveryAddress();
      if (data) setDeliveryAddress(data);
    } catch (error) {
      console.error("Failed to fetch delivery address:", error);
    }
    setLoadingDeliveryAddress(false);
  };

  const fetchAddresses = async () => {
    setLoadingAddresses(true);
    const { data } = await userApi.getAddresses();
    if (data) setAddresses(data);
    setLoadingAddresses(false);
  };

  const fetchReservations = async () => {
    setLoadingReservations(true);
    const { data } = await reservationsApi.getReservations();
    if (data) setReservations(data);
    setLoadingReservations(false);
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    const { error } = await userApi.updateProfile({ fullName, phone });
    setSavingProfile(false);

    if (error) {
      toast.error("Failed to update profile");
      return;
    }

    toast.success("Profile updated");
    setEditingProfile(false);
  };

  const handleAddAddress = async () => {
    if (!newAddress.label || !newAddress.street || !newAddress.city || !newAddress.postalCode) {
      toast.error("Please fill in all address fields");
      return;
    }

    setSavingAddress(true);
    const { error } = await userApi.addAddress(newAddress);
    setSavingAddress(false);

    if (error) {
      toast.error("Failed to add address");
      return;
    }

    toast.success("Address added");
    setNewAddress({ label: "", street: "", city: "", postalCode: "" });
    setShowAddAddress(false);
    fetchAddresses();
  };

  const handleDeleteAddress = async (id: string) => {
    const { error } = await userApi.deleteAddress(id);
    if (error) {
      toast.error("Failed to delete address");
      return;
    }
    toast.success("Address deleted");
    fetchAddresses();
  };

  const handleCancelReservation = async (id: string) => {
    const { error } = await reservationsApi.cancelReservation(id);
    if (error) {
      toast.error("Failed to cancel reservation");
      return;
    }
    toast.success("Reservation cancelled");
    fetchReservations();
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {(savingProfile || savingAddress) && (
        <LoadingOverlay message={savingProfile ? "Saving profile..." : "Saving address..."} />
      )}
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 md:px-10">
          <Link to="/" className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] sm:tracking-[0.2em] hover:opacity-70 transition-opacity">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <Link to="/" className="absolute left-1/2 -translate-x-1/2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-normal" style={{ fontFamily: "'DM Serif Display', serif" }}>
              APlus
            </h1>
          </Link>
          <div className="w-12 sm:w-16" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Profile Section */}
        <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
              <User className="h-5 w-5 text-primary" />
              Profile
            </h2>
            {!editingProfile ? (
              <Button variant="ghost" size="sm" onClick={() => setEditingProfile(true)}>
                <Edit2 className="h-4 w-4" />
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditingProfile(false)}>
                  <X className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleSaveProfile} disabled={savingProfile}>
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground">{user?.email}</span>
            </div>

            {editingProfile ? (
              <>
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full name"
                    className="flex-1"
                    maxLength={255}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone number"
                    className="flex-1"
                    maxLength={20}
                    pattern="[0-9+\-\s]*"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm">{user?.fullName || "Not set"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground">{phone || "Not set"}</span>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Delivery Address Section (saved from Checkout) */}
        <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4" style={{ fontFamily: "'DM Serif Display', serif" }}>
            <Truck className="h-5 w-5 text-primary" />
            Delivery Address
          </h2>

          {loadingDeliveryAddress ? (
            <div className="flex justify-center py-8">
              <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : deliveryAddress ? (
            <div className="p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">Saved Location</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-success/10 text-success font-bold">
                  Active
                </span>
              </div>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace" }}>
                {deliveryAddress.address}
              </p>
              <p className="text-[10px] text-muted-foreground/70 mt-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                Coordinates: {deliveryAddress.lat.toFixed(6)}, {deliveryAddress.lng.toFixed(6)}
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <Truck className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">No delivery address saved</p>
              <p className="text-[10px] text-muted-foreground/70 mt-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                Save your delivery location during checkout
              </p>
            </div>
          )}
        </section>

        {/* Addresses Section */}
        <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
              <MapPin className="h-5 w-5 text-primary" />
              Saved Addresses
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setShowAddAddress(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {loadingAddresses ? (
            <div className="flex justify-center py-8">
              <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : addresses.length === 0 && !showAddAddress ? (
            <div className="text-center py-8">
              <MapPin className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">No saved addresses</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowAddAddress(true)}>
                <Plus className="h-3 w-3 mr-1" />
                Add Address
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr) => (
                <div key={addr.id} className="flex items-start justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider">{addr.label}</span>
                      {addr.isDefault && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold flex items-center gap-0.5">
                          <Star className="h-2.5 w-2.5" /> Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                      {addr.street}, {addr.city} {addr.postalCode}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteAddress(addr.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {showAddAddress && (
            <div className="mt-4 p-4 rounded-lg border border-border space-y-3">
              <Input
                placeholder="Label (e.g., Home, Office)"
                value={newAddress.label}
                onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                maxLength={50}
              />
              <Input
                placeholder="Street address"
                value={newAddress.street}
                onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                maxLength={255}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="City"
                  value={newAddress.city}
                  onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                  maxLength={100}
                />
                <Input
                  placeholder="Postal code"
                  value={newAddress.postalCode}
                  onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                  maxLength={20}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowAddAddress(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAddAddress} disabled={savingAddress}>
                  {savingAddress ? "Saving..." : "Save Address"}
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* Reservations Section */}
        <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4" style={{ fontFamily: "'DM Serif Display', serif" }}>
            <Star className="h-5 w-5 text-primary" />
            My Reservations
          </h2>

          {loadingReservations ? (
            <div className="flex justify-center py-8">
              <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : reservations.length === 0 ? (
            <div className="text-center py-8">
              <Star className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">No reservations</p>
              <Link to="/book">
                <Button variant="outline" size="sm" className="mt-3">
                  Book a Table
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {reservations.map((res) => (
                <div key={res.id} className="flex items-start justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold">
                        {format(new Date(res.reservationDate), "dd MMM yyyy")}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        res.status === 'CONFIRMED' ? 'bg-success/10 text-success' :
                        res.status === 'PENDING' ? 'bg-primary/10 text-primary' :
                        res.status === 'CANCELLED' ? 'bg-destructive/10 text-destructive' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {res.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                      {formatTime(res.startTime)} • {res.partySize} guest{res.partySize !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {(res.status === 'PENDING' || res.status === 'CONFIRMED') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleCancelReservation(res.id)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
