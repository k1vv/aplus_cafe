import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MenuItem } from "@/data/menuData";

interface Props {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
  index?: number;
}

export default function MenuCard({ item, onSelect }: Props) {
  const navigate = useNavigate();

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Redirect to Order page with item ID to auto-add
    navigate(`/order?add=${item.id}`);
  };

  return (
    <div
      className="group flex items-center justify-between border-b border-primary/20 py-3 sm:py-5 cursor-pointer hover:bg-primary/[0.03] transition-all px-2 -mx-2 rounded"
      onClick={() => onSelect(item)}
    >
      <div className="flex-1 min-w-0 pr-3 sm:pr-4">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-[0.08em] sm:tracking-[0.1em] text-primary">
            {item.name}
          </h3>
          {item.popular && (
            <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground">★</span>
          )}
        </div>
        {item.description && (
          <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-muted-foreground line-clamp-2" style={{ fontFamily: "'Space Mono', monospace" }}>
            {item.description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <span className="text-xs sm:text-sm font-bold text-primary tabular-nums">
          {item.price.toFixed(1)}
        </span>
        <button
          onClick={handleAddClick}
          className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full border border-primary/30 text-primary opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-primary-foreground active:scale-95"
        >
          <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        </button>
      </div>
    </div>
  );
}
