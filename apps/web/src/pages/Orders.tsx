import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Package, Clock, ChefHat, Truck, CheckCircle2, Circle, XCircle, RefreshCw, RotateCcw, Star, Download, MapPin } from "lucide-react";
import { ordersApi, Order, reviewsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";
import RiderTracker from "@/components/RiderTracker";
import LoadingOverlay from "@/components/LoadingOverlay";

const STATUS_STEPS = [
  { key: "confirmed", label: "Order Confirmed", icon: Package },
  { key: "preparing", label: "Preparing", icon: ChefHat },
  { key: "ready_for_pickup", label: "Ready", icon: CheckCircle2 },
  { key: "out_for_delivery", label: "Out for Delivery", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

function normalizeStatus(status: string): string {
  return status?.toLowerCase().replace(/ /g, "_") || "";
}

function getStatusIndex(status: string) {
  const normalized = normalizeStatus(status);
  const idx = STATUS_STEPS.findIndex((s) => s.key === normalized);
  return idx >= 0 ? idx : 0;
}

function OrderTimeline({ order }: { order: Order }) {
  const currentIdx = getStatusIndex(order.status);

  const timestamps: Record<string, string | null> = {
    confirmed: order.confirmedAt,
    preparing: order.preparingAt,
    ready_for_pickup: order.readyAt,
    out_for_delivery: order.outForDeliveryAt,
    delivered: order.deliveredAt,
  };

  return (
    <div className="space-y-0">
      {STATUS_STEPS.map((step, i) => {
        const isComplete = i <= currentIdx;
        const isCurrent = i === currentIdx;
        const Icon = step.icon;
        const ts = timestamps[step.key];

        return (
          <div key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isComplete ? "bg-primary text-primary-foreground" : "border-2 border-border text-muted-foreground"} ${isCurrent ? "ring-2 ring-primary/30" : ""}`}>
                {isComplete ? <Icon className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div className={`w-0.5 h-8 ${i < currentIdx ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
            <div className="pt-1">
              <p className={`text-xs font-bold uppercase tracking-wider ${isComplete ? "text-foreground" : "text-muted-foreground"}`}>
                {step.label}
              </p>
              {ts && (
                <p className="text-[10px] text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace" }}>
                  {format(new Date(ts), "dd MMM yyyy, h:mm a")}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const POLLING_INTERVAL = 30000; // 30 seconds

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [reviewingOrderId, setReviewingOrderId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [downloadingReceiptId, setDownloadingReceiptId] = useState<string | null>(null);
  const { addItems } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();

    // Set up polling for real-time updates
    const interval = setInterval(() => {
      fetchOrders(true); // silent refresh
    }, POLLING_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    const { data, error } = await ordersApi.getOrders();
    if (!error && data) {
      setOrders(data);
      setLastUpdated(new Date());
    }
    if (!silent) setLoading(false);
  };

  const handleCancelOrder = async (orderId: string) => {
    setCancellingId(orderId);
    const { error } = await ordersApi.cancelOrder(orderId);
    setCancellingId(null);

    if (error) {
      toast.error("Failed to cancel order", { description: error });
      return;
    }

    toast.success("Order cancelled successfully");
    fetchOrders();
  };

  const canCancel = (status: string) => {
    const normalized = normalizeStatus(status);
    return normalized === "pending" || normalized === "confirmed";
  };

  const handleReorder = (order: Order) => {
    if (!order.orderItems || order.orderItems.length === 0) {
      toast.error("No items to reorder");
      return;
    }

    const itemsToAdd = order.orderItems.map((item) => ({
      id: item.id,
      name: item.itemName,
      price: item.itemPrice,
      quantity: item.quantity,
    }));

    addItems(itemsToAdd);
    toast.success("Items added to cart!", { description: `${itemsToAdd.length} item(s) from your previous order` });
    navigate("/delivery");
  };

  const handleSubmitReview = async (orderId: string) => {
    setSubmittingReview(true);
    const { error } = await reviewsApi.createReview(Number(orderId), rating, comment || undefined);
    setSubmittingReview(false);

    if (error) {
      toast.error("Failed to submit review", { description: error });
      return;
    }

    toast.success("Review submitted!", { description: "Thank you for your feedback" });
    setReviewingOrderId(null);
    setRating(5);
    setComment("");
  };

  const handleDownloadReceipt = async (orderId: string) => {
    setDownloadingReceiptId(orderId);
    const { error } = await ordersApi.downloadReceipt(orderId);
    setDownloadingReceiptId(null);

    if (error) {
      toast.error("Failed to download receipt", { description: error });
      return;
    }

    toast.success("Receipt downloaded!");
  };

  return (
    <div className="min-h-screen bg-background">
      {(cancellingId || submittingReview || downloadingReceiptId) && (
        <LoadingOverlay message={cancellingId ? "Cancelling order..." : submittingReview ? "Submitting review..." : "Downloading receipt..."} />
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
          <button
            onClick={() => fetchOrders()}
            className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider hover:opacity-70 transition-opacity"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        {lastUpdated && (
          <div className="px-4 sm:px-6 pb-2 md:px-10">
            <span className="text-[10px] opacity-70" style={{ fontFamily: "'Space Mono', monospace" }}>
              Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
            </span>
          </div>
        )}
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
            <h2 className="text-xl mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
              No orders yet
            </h2>
            <p className="text-xs text-muted-foreground mb-6" style={{ fontFamily: "'Space Mono', monospace" }}>
              Your delivery orders will appear here
            </p>
            <Link to="/delivery">
              <Button className="text-xs font-bold uppercase tracking-[0.15em]">Order Now</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isExpanded = expandedOrder === order.id;
              const estimatedTime = order.confirmedAt
                ? new Date(new Date(order.confirmedAt).getTime() + (order.estimatedDeliveryMinutes || 45) * 60000)
                : null;

              return (
                <div
                  key={order.id}
                  className="rounded-xl border border-border bg-card overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    className="w-full text-left p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider" style={{ fontFamily: "'Space Mono', monospace" }}>
                        {format(new Date(order.createdAt), "dd MMM yyyy, h:mm a")}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        normalizeStatus(order.status) === "delivered"
                          ? "bg-success/10 text-success"
                          : normalizeStatus(order.status) === "cancelled"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-primary/10 text-primary"
                      }`}>
                        {order.status?.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">
                        {order.orderItems?.length || 0} item{(order.orderItems?.length || 0) !== 1 ? "s" : ""}
                      </span>
                      <span className="text-sm font-bold text-primary">
                        RM {Number(order.grandTotal).toFixed(2)}
                      </span>
                    </div>
                    {normalizeStatus(order.status) !== "delivered" && normalizeStatus(order.status) !== "cancelled" && estimatedTime && (
                      <div className="flex items-center gap-1.5 mt-2 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span className="text-[10px]" style={{ fontFamily: "'Space Mono', monospace" }}>
                          Est. delivery by {format(estimatedTime, "h:mm a")}
                        </span>
                      </div>
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border p-4 space-y-4">
                      <OrderTimeline order={order} />

                      {/* Live Rider Tracking - Show when out for delivery */}
                      {order.orderType === 'DELIVERY' &&
                       (normalizeStatus(order.status) === 'out_for_delivery' ||
                        normalizeStatus(order.status) === 'ready_for_pickup') && (
                        <div className="border-t border-border pt-3">
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Live Rider Tracking
                          </h4>
                          <RiderTracker orderId={order.id} />
                        </div>
                      )}

                      <div className="border-t border-border pt-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Items</h4>
                        <div className="space-y-1">
                          {order.orderItems?.map((item) => (
                            <div key={item.id} className="flex justify-between text-xs">
                              <span>{item.quantity}× {item.itemName}</span>
                              <span className="font-bold text-primary">RM {(item.itemPrice * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="border-t border-border mt-2 pt-2 space-y-1 text-[11px] text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace" }}>
                          <div className="flex justify-between"><span>Subtotal</span><span>RM {Number(order.totalAmount).toFixed(2)}</span></div>
                          <div className="flex justify-between"><span>SST (6%)</span><span>RM {Number(order.serviceCharge).toFixed(2)}</span></div>
                          <div className="flex justify-between"><span>Delivery</span><span>RM {Number(order.deliveryFee).toFixed(2)}</span></div>
                          <div className="flex justify-between text-sm font-bold text-foreground border-t border-border pt-1">
                            <span>Total</span><span>RM {Number(order.grandTotal).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Delivery Instructions */}
                      {order.notes && (
                        <div className="border-t border-border pt-3">
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                            {order.orderType === 'DELIVERY' ? 'Delivery Instructions' : 'Special Instructions'}
                          </h4>
                          <p className="text-xs text-foreground bg-muted/30 p-2 rounded-lg" style={{ fontFamily: "'Space Mono', monospace" }}>
                            {order.notes}
                          </p>
                        </div>
                      )}

                      {/* Cancellation Reason */}
                      {normalizeStatus(order.status) === "cancelled" && order.cancellationReason && (
                        <div className="border-t border-border pt-3">
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-destructive mb-2">
                            Cancellation Reason
                          </h4>
                          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
                            <p className="text-xs text-destructive" style={{ fontFamily: "'Space Mono', monospace" }}>
                              {order.cancellationReason}
                            </p>
                          </div>
                        </div>
                      )}

                      {canCancel(order.status) && (
                        <div className="border-t border-border pt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive text-xs font-bold uppercase tracking-wider"
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={cancellingId === order.id}
                          >
                            {cancellingId === order.id ? (
                              <span className="flex items-center gap-2">
                                <span className="h-3 w-3 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
                                Cancelling...
                              </span>
                            ) : (
                              <span className="flex items-center gap-2">
                                <XCircle className="h-3.5 w-3.5" />
                                Cancel Order
                              </span>
                            )}
                          </Button>
                        </div>
                      )}

                      {/* Re-order and Download Receipt Buttons */}
                      {(normalizeStatus(order.status) === "delivered" || normalizeStatus(order.status) === "cancelled") && (
                        <div className="border-t border-border pt-3 space-y-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs font-bold uppercase tracking-wider"
                            onClick={() => handleReorder(order)}
                          >
                            <span className="flex items-center gap-2">
                              <RotateCcw className="h-3.5 w-3.5" />
                              Re-order
                            </span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs font-bold uppercase tracking-wider"
                            onClick={() => handleDownloadReceipt(order.id)}
                            disabled={downloadingReceiptId === order.id}
                          >
                            {downloadingReceiptId === order.id ? (
                              <span className="flex items-center gap-2">
                                <span className="h-3 w-3 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                                Downloading...
                              </span>
                            ) : (
                              <span className="flex items-center gap-2">
                                <Download className="h-3.5 w-3.5" />
                                Download Receipt
                              </span>
                            )}
                          </Button>
                        </div>
                      )}

                      {/* Review Button/Form */}
                      {normalizeStatus(order.status) === "delivered" && (
                        <div className="border-t border-border pt-3">
                          {reviewingOrderId === order.id ? (
                            <div className="space-y-3">
                              <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rate Your Order</h4>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className="p-0.5"
                                  >
                                    <Star
                                      className={`h-6 w-6 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
                                    />
                                  </button>
                                ))}
                              </div>
                              <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Share your experience (optional)"
                                className="w-full p-2 text-xs border border-border rounded-lg bg-background resize-none"
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 text-xs font-bold uppercase tracking-wider"
                                  onClick={() => {
                                    setReviewingOrderId(null);
                                    setRating(5);
                                    setComment("");
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  className="flex-1 text-xs font-bold uppercase tracking-wider"
                                  onClick={() => handleSubmitReview(order.id)}
                                  disabled={submittingReview}
                                >
                                  {submittingReview ? (
                                    <span className="flex items-center gap-2">
                                      <span className="h-3 w-3 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                                      Submitting...
                                    </span>
                                  ) : (
                                    "Submit Review"
                                  )}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-xs font-bold uppercase tracking-wider"
                              onClick={() => setReviewingOrderId(order.id)}
                            >
                              <span className="flex items-center gap-2">
                                <Star className="h-3.5 w-3.5" />
                                Leave a Review
                              </span>
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
