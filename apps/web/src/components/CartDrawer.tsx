import { X, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";

export default function CartDrawer() {
  const { items, totalPrice, isCartOpen, setIsCartOpen, updateQuantity, removeItem, clearCart } = useCart();

  if (!isCartOpen) return null;

  const serviceCharge = totalPrice * 0.06;
  const grandTotal = totalPrice + serviceCharge;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-background shadow-2xl animate-slide-in-right">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-foreground">Your Order</h2>
          </div>
          <button onClick={() => setIsCartOpen(false)} className="rounded-full p-1 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingBag className="mb-4 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Your cart is empty</p>
              <p className="mt-1 text-xs text-muted-foreground/60" style={{ fontFamily: "'Space Mono', monospace" }}>
                Browse our menu and add items.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 border-b border-border pb-3">
                  <img src={item.image} alt={item.name} className="h-14 w-14 rounded object-cover" />
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">{item.name}</h4>
                      <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="min-w-[1rem] text-center text-xs font-bold text-foreground">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-xs font-bold text-primary">RM {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-border px-6 py-4">
            <div className="mb-3 space-y-1.5 text-xs" style={{ fontFamily: "'Space Mono', monospace" }}>
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>RM {totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>SST (6%)</span>
                <span>RM {serviceCharge.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-sm font-bold text-foreground">
                <span>Total</span>
                <span>RM {grandTotal.toFixed(2)}</span>
              </div>
            </div>
            <Button className="w-full text-xs font-bold uppercase tracking-[0.15em]" size="lg">
              Place Order — RM {grandTotal.toFixed(2)}
            </Button>
            <button onClick={clearCart} className="mt-2 w-full text-center text-[10px] uppercase tracking-wider text-muted-foreground hover:text-destructive">
              Clear cart
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
