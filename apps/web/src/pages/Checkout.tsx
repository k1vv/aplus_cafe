import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CreditCard, MapPin, Phone, User, Clock, Store, Truck, UtensilsCrossed } from "lucide-react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { getStripe } from "@/lib/stripe";
import { checkoutApi } from "@/lib/api";
import { toast } from "sonner";

type OrderType = 'DELIVERY' | 'PICKUP' | 'DINE_IN';

const orderTypeInfo = {
  DELIVERY: { label: 'Delivery', icon: Truck, description: 'Delivered to your address' },
  PICKUP: { label: 'Pickup', icon: Store, description: 'Pick up at our cafe' },
  DINE_IN: { label: 'Dine In', icon: UtensilsCrossed, description: 'Eat at our cafe' },
};

export default function Checkout() {
  const { items, totalPrice } = useCart();
  const { user } = useAuth();
  const [showPayment, setShowPayment] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>('DELIVERY');

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
    pickupTime: "",
    tableNumber: "",
    partySize: "1",
  });

  useEffect(() => {
    const savedOrderType = sessionStorage.getItem('orderType') as OrderType;
    if (savedOrderType) {
      setOrderType(savedOrderType);
    }
  }, []);

  const serviceCharge = totalPrice * 0.06;
  const deliveryFee = orderType === 'DELIVERY' && totalPrice > 0 ? 3.0 : 0;
  const grandTotal = totalPrice + serviceCharge + deliveryFee;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.phone) {
      toast.error("Please fill in name and phone number");
      return;
    }

    if (orderType === 'DELIVERY' && !form.address) {
      toast.error("Please fill in your delivery address");
      return;
    }

    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    setShowPayment(true);
  };

  const fetchClientSecret = async (): Promise<string> => {
    const { data, error } = await checkoutApi.createCheckoutSession({
      items: items.map((item) => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      customerEmail: user?.email,
      userId: user?.id,
      deliveryDetails: orderType === 'DELIVERY' ? {
        name: form.name,
        phone: form.phone,
        address: form.address,
        notes: form.notes,
      } : {
        name: form.name,
        phone: form.phone,
        address: orderType === 'PICKUP' ? 'PICKUP' : 'DINE_IN',
        notes: form.notes,
      },
      returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    });

    if (error || !data?.clientSecret) {
      throw new Error(error || "Failed to create checkout session");
    }
    return data.clientSecret;
  };

  if (items.length === 0 && !showPayment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl mb-3" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Your cart is empty
          </h1>
          <p className="text-sm text-muted-foreground mb-6" style={{ fontFamily: "'Space Mono', monospace" }}>
            Add some items to your cart first.
          </p>
          <Link to="/order">
            <Button className="text-xs font-bold uppercase tracking-[0.15em]">
              Browse Menu
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const OrderTypeIcon = orderTypeInfo[orderType].icon;

  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner />
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 md:px-10">
          <Link to="/order" className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] sm:tracking-[0.2em] hover:opacity-70 transition-opacity">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <h1 className="text-lg sm:text-xl md:text-2xl font-normal" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Checkout
          </h1>
          <div className="w-12 sm:w-16" />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {showPayment ? (
          <div>
            <h2 className="text-xl mb-4" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Complete Payment
            </h2>
            <div className="rounded-xl border border-border overflow-hidden">
              <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-5 lg:gap-10">
            <form onSubmit={handleProceedToPayment} className="lg:col-span-3 space-y-6 mb-8 lg:mb-0">
              {/* Order Type Badge */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 w-fit">
                <OrderTypeIcon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">{orderTypeInfo[orderType].label}</span>
                <span className="text-xs text-muted-foreground">— {orderTypeInfo[orderType].description}</span>
              </div>

              <div>
                <h2 className="text-xl mb-1" style={{ fontFamily: "'DM Serif Display', serif" }}>
                  {orderType === 'DELIVERY' ? 'Delivery Details' :
                   orderType === 'PICKUP' ? 'Pickup Details' : 'Dine-In Details'}
                </h2>
                <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace" }}>
                  {orderType === 'DELIVERY' ? 'Where should we deliver your order?' :
                   orderType === 'PICKUP' ? 'We\'ll have your order ready for pickup' : 'Your order will be served at your table'}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <User className="h-3.5 w-3.5" />Full Name *
                  </Label>
                  <Input id="name" name="name" value={form.name} onChange={handleChange} placeholder="Your full name" required className="text-sm" />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <Phone className="h-3.5 w-3.5" />Phone Number *
                  </Label>
                  <Input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="e.g. 012-345 6789" required className="text-sm" />
                </div>

                {orderType === 'DELIVERY' && (
                  <div>
                    <Label htmlFor="address" className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <MapPin className="h-3.5 w-3.5" />Delivery Address *
                    </Label>
                    <Textarea id="address" name="address" value={form.address} onChange={handleChange} placeholder="Full delivery address" required rows={3} className="text-sm resize-none" />
                  </div>
                )}

                {orderType === 'PICKUP' && (
                  <div>
                    <Label htmlFor="pickupTime" className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <Clock className="h-3.5 w-3.5" />Preferred Pickup Time
                    </Label>
                    <select
                      id="pickupTime"
                      name="pickupTime"
                      value={form.pickupTime}
                      onChange={handleChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">As soon as possible</option>
                      <option value="15">In 15 minutes</option>
                      <option value="30">In 30 minutes</option>
                      <option value="45">In 45 minutes</option>
                      <option value="60">In 1 hour</option>
                    </select>
                  </div>
                )}

                {orderType === 'DINE_IN' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tableNumber" className="text-xs font-bold uppercase tracking-wider mb-2 block">
                        Table Number
                      </Label>
                      <Input id="tableNumber" name="tableNumber" value={form.tableNumber} onChange={handleChange} placeholder="e.g. 5" className="text-sm" />
                    </div>
                    <div>
                      <Label htmlFor="partySize" className="text-xs font-bold uppercase tracking-wider mb-2 block">
                        Party Size
                      </Label>
                      <select
                        id="partySize"
                        name="partySize"
                        value={form.partySize}
                        onChange={handleChange}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                          <option key={n} value={n}>{n} {n === 1 ? 'person' : 'people'}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="notes" className="text-xs font-bold uppercase tracking-wider mb-2 block">Special Instructions</Label>
                  <Textarea id="notes" name="notes" value={form.notes} onChange={handleChange} placeholder="Any special requests? (optional)" rows={2} className="text-sm resize-none" />
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Secure Online Payment</p>
                    <p className="text-[11px] text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace" }}>
                      You'll be taken to a secure payment form next
                    </p>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full text-xs font-bold uppercase tracking-[0.15em]" size="lg">
                Proceed to Payment — RM {grandTotal.toFixed(2)}
              </Button>
            </form>

            <div className="lg:col-span-2">
              <div className="sticky top-20 rounded-xl border border-border bg-card p-4 sm:p-6">
                <h3 className="text-xs font-bold uppercase tracking-[0.15em] mb-4">Order Summary</h3>
                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-xs text-foreground">{item.quantity}× {item.name}</span>
                      <span className="text-xs font-bold text-primary">RM {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-3 space-y-1.5 text-xs" style={{ fontFamily: "'Space Mono', monospace" }}>
                  <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>RM {totalPrice.toFixed(2)}</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>SST (6%)</span><span>RM {serviceCharge.toFixed(2)}</span></div>
                  {orderType === 'DELIVERY' && (
                    <div className="flex justify-between text-muted-foreground"><span>Delivery Fee</span><span>RM {deliveryFee.toFixed(2)}</span></div>
                  )}
                  <div className="flex justify-between border-t border-border pt-2 text-sm font-bold text-foreground"><span>Total</span><span>RM {grandTotal.toFixed(2)}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
