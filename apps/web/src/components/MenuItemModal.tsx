import { X, Plus, Minus } from "lucide-react";
import { MenuItem } from "@/data/menuData";
import { useCart } from "@/context/CartContext";
import { useState } from "react";

interface Props {
  item: MenuItem;
  onClose: () => void;
}

export default function MenuItemModal({ item, onClose }: Props) {
  const { addItem, items, updateQuantity } = useCart();
  const cartItem = items.find((i) => i.id === item.id);
  const [quantity, setQuantity] = useState(cartItem?.quantity || 1);

  const handleAdd = () => {
    if (cartItem) {
      updateQuantity(item.id, quantity);
    } else {
      for (let i = 0; i < quantity; i++) {
        addItem(item);
      }
    }
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-md bg-background rounded-lg shadow-2xl overflow-hidden animate-scale-in">
          {/* Image */}
          <div className="relative aspect-[16/10] overflow-hidden">
            <img
              src={item.image}
              alt={item.name}
              className="h-full w-full object-cover"
            />
            <button
              onClick={onClose}
              className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-foreground/50 text-primary-foreground hover:bg-foreground/70 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            {item.popular && (
              <span className="absolute top-3 left-3 rounded bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                Popular
              </span>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <h3
              className="text-2xl text-foreground mb-1"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              {item.name}
            </h3>
            <p className="text-sm text-muted-foreground mb-4" style={{ fontFamily: "'Space Mono', monospace" }}>
              {item.description}
            </p>

            <div className="flex items-center justify-between mb-6">
              <span className="text-lg font-bold text-primary">
                RM {item.price.toFixed(2)}
              </span>
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                {item.category}
              </span>
            </div>

            {/* Quantity selector */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="min-w-[1.5rem] text-center text-sm font-bold text-foreground">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              <button
                onClick={handleAdd}
                className="rounded bg-primary px-6 py-2.5 text-xs font-bold uppercase tracking-[0.15em] text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Add — RM {(item.price * quantity).toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
