import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";

export default function CheckoutReturn() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { clearCart } = useCart();
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    if (sessionId && !cleared) {
      clearCart();
      setCleared(true);
    }
  }, [sessionId, cleared, clearCart]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        {sessionId ? (
          <>
            <CheckCircle className="mx-auto mb-6 h-16 w-16 text-success" />
            <h1 className="text-3xl mb-3" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Order Confirmed!
            </h1>
            <p className="text-sm text-muted-foreground mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
              Your delivery order has been placed successfully.
            </p>
            <p className="text-xs text-muted-foreground mb-8" style={{ fontFamily: "'Space Mono', monospace" }}>
              You can track your order status in real-time.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/orders">
                <Button className="text-xs font-bold uppercase tracking-[0.15em] gap-2" size="lg">
                  <Package className="h-4 w-4" />
                  Track My Order
                </Button>
              </Link>
              <Link to="/">
                <Button variant="outline" className="text-xs font-bold uppercase tracking-[0.15em]" size="lg">
                  Back to Home
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-3xl mb-3" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Something went wrong
            </h1>
            <p className="text-sm text-muted-foreground mb-8" style={{ fontFamily: "'Space Mono', monospace" }}>
              We couldn't confirm your order. Please try again.
            </p>
            <Link to="/">
              <Button className="text-xs font-bold uppercase tracking-[0.15em]" size="lg">
                Back to Home
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
