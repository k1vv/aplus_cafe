import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingBag, Plus, Minus, Trash2, Truck, Store, UtensilsCrossed, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMenu } from "@/hooks/useMenu";
import { useCart } from "@/context/CartContext";
import MenuItemModal from "@/components/MenuItemModal";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import type { MenuItem } from "@/data/menuData";

type OrderType = 'DELIVERY' | 'PICKUP' | 'DINE_IN';

const orderTypeOptions = [
  { value: 'DELIVERY' as OrderType, label: 'Delivery', icon: Truck, description: 'Get it delivered to your door' },
  { value: 'PICKUP' as OrderType, label: 'Pickup', icon: Store, description: 'Pick up at our cafe' },
  { value: 'DINE_IN' as OrderType, label: 'Dine In', icon: UtensilsCrossed, description: 'Eat at our cafe' },
];

interface SelectedTable {
  id: number;
  name: string;
  seats: number;
  section: string;
}

export default function Order() {
  const navigate = useNavigate();
  const [orderType, setOrderType] = useState<OrderType>('DELIVERY');
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTable, setSelectedTable] = useState<SelectedTable | null>(null);
  const { menuItems, categories } = useMenu();
  const { items, addItem, updateQuantity, removeItem, totalItems, totalPrice } = useCart();

  // Check for table selection from Cafe Floor Plan
  useEffect(() => {
    const storedTable = sessionStorage.getItem("selectedTable");
    const storedOrderType = sessionStorage.getItem("orderType");

    if (storedTable) {
      try {
        const table = JSON.parse(storedTable) as SelectedTable;
        setSelectedTable(table);
        sessionStorage.removeItem("selectedTable");
      } catch (e) {
        console.error("Failed to parse selected table:", e);
      }
    }

    if (storedOrderType === "DINE_IN") {
      setOrderType("DINE_IN");
      sessionStorage.removeItem("orderType");
    }
  }, []);

  // Animation state tracking
  const [summaryAnimKey, setSummaryAnimKey] = useState(0);
  const [animatingItems, setAnimatingItems] = useState<Set<number>>(new Set());
  const prevTotalRef = useRef(totalPrice);
  const prevItemsRef = useRef<typeof items>([]);

  // Trigger animations when cart changes
  useEffect(() => {
    // Check for new items or quantity changes
    const newAnimating = new Set<number>();

    items.forEach(item => {
      const prevItem = prevItemsRef.current.find(p => p.id === item.id);
      if (!prevItem || prevItem.quantity !== item.quantity) {
        newAnimating.add(item.id);
      }
    });

    if (newAnimating.size > 0) {
      setAnimatingItems(newAnimating);
      // Clear animation after it completes
      setTimeout(() => setAnimatingItems(new Set()), 400);
    }

    // Trigger summary glow if total changed
    if (prevTotalRef.current !== totalPrice && items.length > 0) {
      setSummaryAnimKey(k => k + 1);
    }

    prevTotalRef.current = totalPrice;
    prevItemsRef.current = [...items];
  }, [items, totalPrice]);

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
    // Store selected table info for dine-in orders
    if (selectedTable && orderType === 'DINE_IN') {
      sessionStorage.setItem('selectedTable', JSON.stringify(selectedTable));
    }
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
          <Link to="/" className="absolute left-1/2 -translate-x-1/2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-normal" style={{ fontFamily: "'DM Serif Display', serif" }}>
              APlus
            </h1>
          </Link>
          <div className="w-12 sm:w-16" />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Order Type Selection */}
        <AnimateOnScroll animation="fade-in-up" duration={500}>
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl mb-3 sm:mb-4" style={{ fontFamily: "'DM Serif Display', serif" }}>
              How would you like your order?
            </h2>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {orderTypeOptions.map((option, index) => {
                const Icon = option.icon;
                const isSelected = orderType === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setOrderType(option.value)}
                    className={`flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all transform hover:scale-[1.02] ${
                      isSelected
                        ? "border-primary bg-primary/5 scale-[1.02]"
                        : "border-border hover:border-primary/50"
                    }`}
                    style={{
                      animation: `fadeInUp 0.4s ease-out ${index * 0.1}s both`,
                    }}
                  >
                    <Icon className={`h-5 w-5 sm:h-6 sm:w-6 transition-transform ${isSelected ? "text-primary scale-110" : "text-muted-foreground"}`} />
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
        </AnimateOnScroll>

        {/* Selected Table Banner (when coming from Cafe Floor Plan) */}
        {selectedTable && orderType === 'DINE_IN' && (
          <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <UtensilsCrossed className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold">Table {selectedTable.name}</p>
                <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace" }}>
                  {selectedTable.seats} seats • {selectedTable.section} section
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedTable(null)}
              className="p-1.5 rounded-full hover:bg-primary/10 transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        )}

        <div className="lg:grid lg:grid-cols-3 lg:gap-10">
          {/* Menu Section */}
          <div className="lg:col-span-2">
            <AnimateOnScroll animation="fade-in-up" delay={100}>
              <div className="mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl mb-1" style={{ fontFamily: "'DM Serif Display', serif" }}>
                  Choose Your Items
                </h2>
                <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace" }}>
                  Select items to add to your order
                </p>
              </div>
            </AnimateOnScroll>

            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                maxLength={100}
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
              {filtered.map((item, index) => {
                const cartItem = items.find((i) => i.id === item.id);
                return (
                  <div
                    key={item.id}
                    className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all duration-300 bg-card transform hover:-translate-y-0.5"
                    style={{
                      animation: `fadeInUp 0.4s ease-out ${Math.min(index * 0.05, 0.3)}s both`,
                    }}
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
            <AnimateOnScroll animation="slide-in-right" delay={200}>
              <div
                key={summaryAnimKey}
                className={`sticky top-20 rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm transition-shadow ${summaryAnimKey > 0 ? 'summary-glow' : ''}`}
              >
              <div className="flex items-center gap-2 mb-4">
                <ShoppingBag className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-[0.15em]">Order Summary</h3>
                <span
                  key={totalItems}
                  className={`ml-auto text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold uppercase ${totalItems > 0 ? 'cart-badge-bounce' : ''}`}
                >
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
                      <div
                        key={`${item.id}-${item.quantity}`}
                        className={`flex items-center justify-between text-sm rounded-lg px-2 py-1.5 -mx-2 transition-colors ${
                          animatingItems.has(item.id) ? 'cart-item-pulse' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span
                            className={`text-xs font-bold min-w-[1.5rem] text-center rounded-full px-1.5 py-0.5 ${
                              animatingItems.has(item.id) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                            } transition-colors`}
                          >
                            {item.quantity}×
                          </span>
                          <span className="text-xs font-medium truncate">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold whitespace-nowrap transition-transform ${
                              animatingItems.has(item.id) ? 'text-primary scale-110' : 'text-primary'
                            }`}
                          >
                            RM {(item.price * item.quantity).toFixed(2)}
                          </span>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors hover:scale-110"
                          >
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
                    <div
                      key={`total-${grandTotal}`}
                      className={`flex justify-between border-t border-border pt-2 text-sm font-bold text-foreground ${summaryAnimKey > 0 ? 'total-pop' : ''}`}
                    >
                      <span>Total</span>
                      <span className="text-primary">RM {grandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleProceedToCheckout}
                    className="w-full mt-4 text-xs font-bold uppercase tracking-[0.15em] transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    size="lg"
                  >
                    Proceed to Checkout — RM {grandTotal.toFixed(2)}
                  </Button>
                </>
              )}
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </div>

      {selectedItem && (
        <MenuItemModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
}
