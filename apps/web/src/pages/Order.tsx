import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingBag, Plus, Minus, Trash2, Truck, Store, UtensilsCrossed, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMenu } from "@/hooks/useMenu";
import { useCart } from "@/context/CartContext";
import MenuItemModal from "@/components/MenuItemModal";
import type { MenuItem } from "@/data/menuData";

type OrderType = 'DELIVERY' | 'PICKUP' | 'DINE_IN';

const orderTypeOptions = [
  { value: 'DELIVERY' as OrderType, label: 'Delivery', icon: Truck, description: 'Get it delivered to your door' },
  { value: 'PICKUP' as OrderType, label: 'Pickup', icon: Store, description: 'Pick up at our cafe' },
  { value: 'DINE_IN' as OrderType, label: 'Dine In', icon: UtensilsCrossed, description: 'Eat at our cafe' },
];

export default function Order() {
  const navigate = useNavigate();
  const [orderType, setOrderType] = useState<OrderType>('DELIVERY');
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { menuItems, categories } = useMenu();
  const { items, addItem, updateQuantity, removeItem, totalItems, totalPrice } = useCart();

  const filtered = menuItems.filter((item) => {
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    const matchesSearch = searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const serviceCharge = totalPrice * 0.06;
  const deliveryFee = orderType === 'DELIVERY' && totalPrice > 0 ? 3.0 : 0;
  const grandTotal = totalPrice + serviceCharge + deliveryFee;

  const handleProceedToCheckout = () => {
    // Store order type in session storage for checkout page
    sessionStorage.setItem('orderType', orderType);
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 md:px-10">
          <Link to="/" className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] sm:tracking-[0.2em] hover:opacity-70 transition-opacity">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <h1 className="text-lg sm:text-xl md:text-2xl font-normal" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Place Order
          </h1>
          <div className="w-12 sm:w-16" />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Order Type Selection */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl mb-3 sm:mb-4" style={{ fontFamily: "'DM Serif Display', serif" }}>
            How would you like your order?
          </h2>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {orderTypeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = orderType === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setOrderType(option.value)}
                  className={`flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-xs sm:text-sm font-bold ${isSelected ? "text-primary" : "text-foreground"}`}>
                    {option.label}
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground text-center hidden sm:block" style={{ fontFamily: "'Space Mono', monospace" }}>
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-3 lg:gap-10">
          {/* Menu Section */}
          <div className="lg:col-span-2">
            <div className="mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl mb-1" style={{ fontFamily: "'DM Serif Display', serif" }}>
                Choose Your Items
              </h2>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace" }}>
                Select items to add to your order
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-medium uppercase tracking-[0.1em] sm:tracking-[0.15em] rounded-full border transition-colors whitespace-nowrap shrink-0 ${
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-8 lg:mb-0">
              {filtered.map((item) => {
                const cartItem = items.find((i) => i.id === item.id);
                return (
                  <div
                    key={item.id}
                    className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-border hover:border-primary/30 transition-colors bg-card"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setSelectedItem(item)}
                    />
                    <div className="flex flex-1 flex-col justify-between min-w-0">
                      <div>
                        <h3 className="text-sm font-bold text-foreground truncate">{item.name}</h3>
                        <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 line-clamp-2" style={{ fontFamily: "'Space Mono', monospace" }}>
                          {item.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-bold text-primary">RM {item.price.toFixed(2)}</span>
                        {cartItem ? (
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, cartItem.quantity - 1)}
                              className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-xs font-bold min-w-[1rem] text-center">{cartItem.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, cartItem.quantity + 1)}
                              className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addItem(item)}
                            className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                          >
                            <Plus className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="col-span-2 py-12 text-center">
                  <p className="text-muted-foreground text-sm">No items found</p>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 rounded-xl border border-border bg-card p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingBag className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-[0.15em]">Order Summary</h3>
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold uppercase">
                  {orderType.replace('_', ' ')}
                </span>
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
                    {orderType === 'DELIVERY' && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Delivery Fee</span>
                        <span>RM {deliveryFee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-border pt-2 text-sm font-bold text-foreground">
                      <span>Total</span>
                      <span>RM {grandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleProceedToCheckout}
                    className="w-full mt-4 text-xs font-bold uppercase tracking-[0.15em]"
                    size="lg"
                  >
                    Proceed to Checkout — RM {grandTotal.toFixed(2)}
                  </Button>
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
