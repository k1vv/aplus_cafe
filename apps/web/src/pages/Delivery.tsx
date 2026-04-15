import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ShoppingBag, Plus, Minus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { menuItems, categories } from "@/data/menuData";
import { useCart } from "@/context/CartContext";
import MenuItemModal from "@/components/MenuItemModal";
import type { MenuItem } from "@/data/menuData";

export default function Delivery() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const { items, addItem, updateQuantity, removeItem, totalItems, totalPrice } = useCart();

  const filtered = activeCategory === "All"
    ? menuItems
    : menuItems.filter((item) => item.category === activeCategory);

  const serviceCharge = totalPrice * 0.06;
  const deliveryFee = totalPrice > 0 ? 3.0 : 0;
  const grandTotal = totalPrice + serviceCharge + deliveryFee;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground">
        <div className="flex items-center justify-between px-6 py-4 sm:px-10">
          <Link to="/" className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] hover:opacity-70 transition-opacity">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <h1 className="text-xl sm:text-2xl font-normal" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Delivery Order
          </h1>
          <div className="w-16" />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-10">
          {/* Menu Section */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-2xl mb-1" style={{ fontFamily: "'DM Serif Display', serif" }}>
                Choose Your Items
              </h2>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace" }}>
                Select items to add to your delivery order
              </p>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 mb-6">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 text-xs font-medium uppercase tracking-[0.15em] rounded-full border transition-colors ${
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-transparent text-foreground border-border hover:border-primary"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 lg:mb-0">
              {filtered.map((item) => {
                const cartItem = items.find((i) => i.id === item.id);
                return (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 rounded-xl border border-border hover:border-primary/30 transition-colors bg-card"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-20 w-20 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setSelectedItem(item)}
                    />
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{item.name}</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2" style={{ fontFamily: "'Space Mono', monospace" }}>
                          {item.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-bold text-primary">RM {item.price.toFixed(2)}</span>
                        {cartItem ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, cartItem.quantity - 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-xs font-bold min-w-[1rem] text-center">{cartItem.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, cartItem.quantity + 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addItem(item)}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingBag className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-[0.15em]">Order Summary</h3>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">No items yet</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-xs text-muted-foreground">{item.quantity}×</span>
                          <span className="text-xs font-medium truncate">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-primary whitespace-nowrap">
                            RM {(item.price * item.quantity).toFixed(2)}
                          </span>
                          <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-border pt-3 space-y-1.5 text-xs" style={{ fontFamily: "'Space Mono', monospace" }}>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>RM {totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>SST (6%)</span>
                      <span>RM {serviceCharge.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Delivery Fee</span>
                      <span>RM {deliveryFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-2 text-sm font-bold text-foreground">
                      <span>Total</span>
                      <span>RM {grandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <Link to="/checkout">
                    <Button className="w-full mt-4 text-xs font-bold uppercase tracking-[0.15em]" size="lg">
                      Proceed to Checkout — RM {grandTotal.toFixed(2)}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedItem && (
        <MenuItemModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
}