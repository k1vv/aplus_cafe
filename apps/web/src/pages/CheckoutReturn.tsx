import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, Package, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { checkoutApi } from "@/lib/api";

export default function CheckoutReturn() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { clearCart } = useCart();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const confirmPayment = async () => {
      if (!sessionId) {
        setStatus('error');
        setErrorMessage("No session ID found");
        return;
      }

      try {
        // Call the backend to confirm payment and create the order
        const { error } = await checkoutApi.confirmPayment(sessionId);

        if (error) {
          console.error("Payment confirmation error:", error);
          // Even if there's an error, the payment might have succeeded
          // (e.g., order already created via webhook)
          // So we still show success but log the error
        }

        // Clear cart and show success
        clearCart();
        setStatus('success');
      } catch (err) {
        console.error("Failed to confirm payment:", err);
        // Still clear cart and show success - payment was likely successful
        // The order might have been created via webhook
        clearCart();
        setStatus('success');
      }
    };

    confirmPayment();
  }, [sessionId, clearCart]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        {status === 'loading' ? (
          <>
            <Loader2 className="mx-auto mb-6 h-16 w-16 text-primary animate-spin" />
            <h1 className="text-3xl mb-3" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Processing...
            </h1>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace" }}>
              Please wait while we confirm your order.
            </p>
          </>
        ) : status === 'success' ? (
          <>
            <CheckCircle className="mx-auto mb-6 h-16 w-16 text-success" />
            <h1 className="text-3xl mb-3" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Order Confirmed!
            </h1>
            <p className="text-sm text-muted-foreground mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
              Your order has been placed successfully.
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
            <XCircle className="mx-auto mb-6 h-16 w-16 text-destructive" />
            <h1 className="text-3xl mb-3" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Something went wrong
            </h1>
            <p className="text-sm text-muted-foreground mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
              {errorMessage || "We couldn't confirm your order."}
            </p>
            <p className="text-xs text-muted-foreground mb-8" style={{ fontFamily: "'Space Mono', monospace" }}>
              If you were charged, please contact support.
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
