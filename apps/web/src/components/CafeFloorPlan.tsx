import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Coffee, UtensilsCrossed, CalendarDays, ShoppingBag, X, DoorOpen, Sofa } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Table {
  id: number;
  name: string;
  seats: number;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: "rect" | "circle" | "oval";
  status: "available" | "occupied" | "reserved";
  section: "window" | "center" | "corner" | "outdoor";
}

// Cafe layout configuration
const tables: Table[] = [
  // Window Section (left side) - cozy 2-seater tables
  { id: 1, name: "W1", seats: 2, x: 40, y: 80, width: 60, height: 60, shape: "circle", status: "available", section: "window" },
  { id: 2, name: "W2", seats: 2, x: 40, y: 180, width: 60, height: 60, shape: "circle", status: "occupied", section: "window" },
  { id: 3, name: "W3", seats: 2, x: 40, y: 280, width: 60, height: 60, shape: "circle", status: "available", section: "window" },
  { id: 4, name: "W4", seats: 2, x: 40, y: 380, width: 60, height: 60, shape: "circle", status: "reserved", section: "window" },

  // Center Section - 4-seater rectangular tables
  { id: 5, name: "C1", seats: 4, x: 180, y: 100, width: 100, height: 70, shape: "rect", status: "available", section: "center" },
  { id: 6, name: "C2", seats: 4, x: 180, y: 220, width: 100, height: 70, shape: "rect", status: "available", section: "center" },
  { id: 7, name: "C3", seats: 4, x: 180, y: 340, width: 100, height: 70, shape: "rect", status: "occupied", section: "center" },

  // Center Section - 4-seater tables (right of center)
  { id: 8, name: "C4", seats: 4, x: 340, y: 100, width: 100, height: 70, shape: "rect", status: "available", section: "center" },
  { id: 9, name: "C5", seats: 4, x: 340, y: 220, width: 100, height: 70, shape: "reserved", section: "center" },
  { id: 10, name: "C6", seats: 4, x: 340, y: 340, width: 100, height: 70, shape: "rect", status: "available", section: "center" },

  // Corner Section (right side) - larger 6-seater tables
  { id: 11, name: "L1", seats: 6, x: 500, y: 80, width: 120, height: 80, shape: "oval", status: "available", section: "corner" },
  { id: 12, name: "L2", seats: 6, x: 500, y: 220, width: 120, height: 80, shape: "oval", status: "available", section: "corner" },
  { id: 13, name: "L3", seats: 8, x: 500, y: 360, width: 130, height: 90, shape: "oval", status: "occupied", section: "corner" },

  // Outdoor Section (bottom)
  { id: 14, name: "O1", seats: 4, x: 120, y: 500, width: 80, height: 60, shape: "rect", status: "available", section: "outdoor" },
  { id: 15, name: "O2", seats: 4, x: 250, y: 500, width: 80, height: 60, shape: "rect", status: "available", section: "outdoor" },
  { id: 16, name: "O3", seats: 4, x: 380, y: 500, width: 80, height: 60, shape: "rect", status: "reserved", section: "outdoor" },
];

interface CafeFloorPlanProps {
  onTableSelect?: (table: Table, action: "order" | "book") => void;
}

export default function CafeFloorPlan({ onTableSelect }: CafeFloorPlanProps) {
  const navigate = useNavigate();
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [hoveredTable, setHoveredTable] = useState<number | null>(null);

  const getStatusColor = (status: Table["status"], isHovered: boolean) => {
    const colors = {
      available: isHovered ? "#16a34a" : "#22c55e",
      occupied: "#ef4444",
      reserved: "#f59e0b",
    };
    return colors[status];
  };

  const getStatusBg = (status: Table["status"], isHovered: boolean) => {
    const colors = {
      available: isHovered ? "rgba(22, 163, 74, 0.3)" : "rgba(34, 197, 94, 0.2)",
      occupied: "rgba(239, 68, 68, 0.2)",
      reserved: "rgba(245, 158, 11, 0.2)",
    };
    return colors[status];
  };

  const handleTableClick = (table: Table) => {
    if (table.status === "occupied") return;
    setSelectedTable(table);
  };

  const handleAction = (action: "order" | "book") => {
    if (!selectedTable) return;

    if (onTableSelect) {
      onTableSelect(selectedTable, action);
    } else {
      if (action === "order") {
        // Store table info and navigate to order page
        sessionStorage.setItem("selectedTable", JSON.stringify(selectedTable));
        sessionStorage.setItem("orderType", "DINE_IN");
        navigate("/order");
      } else {
        // Navigate to booking page with table pre-selected
        sessionStorage.setItem("selectedTable", JSON.stringify(selectedTable));
        navigate("/book");
      }
    }
    setSelectedTable(null);
  };

  const renderTable = (table: Table) => {
    const isHovered = hoveredTable === table.id;
    const isSelected = selectedTable?.id === table.id;
    const isClickable = table.status !== "occupied";

    const commonProps = {
      className: `transition-all duration-200 ${isClickable ? "cursor-pointer" : "cursor-not-allowed"}`,
      style: {
        filter: isSelected ? "drop-shadow(0 0 8px rgba(var(--primary), 0.5))" : undefined,
        transform: isHovered && isClickable ? "scale(1.05)" : undefined,
        transformOrigin: "center",
      },
      onClick: () => handleTableClick(table),
      onMouseEnter: () => setHoveredTable(table.id),
      onMouseLeave: () => setHoveredTable(null),
    };

    const fill = getStatusBg(table.status, isHovered && isClickable);
    const stroke = getStatusColor(table.status, isHovered && isClickable);
    const strokeWidth = isSelected ? 3 : 2;

    if (table.shape === "circle") {
      return (
        <g key={table.id} {...commonProps}>
          <circle
            cx={table.x + table.width / 2}
            cy={table.y + table.height / 2}
            r={table.width / 2}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          {/* Table number */}
          <text
            x={table.x + table.width / 2}
            y={table.y + table.height / 2 - 5}
            textAnchor="middle"
            className="text-xs font-bold fill-foreground"
          >
            {table.name}
          </text>
          {/* Seats indicator */}
          <text
            x={table.x + table.width / 2}
            y={table.y + table.height / 2 + 12}
            textAnchor="middle"
            className="text-[10px] fill-muted-foreground"
          >
            {table.seats}p
          </text>
        </g>
      );
    }

    if (table.shape === "oval") {
      return (
        <g key={table.id} {...commonProps}>
          <ellipse
            cx={table.x + table.width / 2}
            cy={table.y + table.height / 2}
            rx={table.width / 2}
            ry={table.height / 2}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          <text
            x={table.x + table.width / 2}
            y={table.y + table.height / 2 - 5}
            textAnchor="middle"
            className="text-xs font-bold fill-foreground"
          >
            {table.name}
          </text>
          <text
            x={table.x + table.width / 2}
            y={table.y + table.height / 2 + 12}
            textAnchor="middle"
            className="text-[10px] fill-muted-foreground"
          >
            {table.seats}p
          </text>
        </g>
      );
    }

    // Rectangle
    return (
      <g key={table.id} {...commonProps}>
        <rect
          x={table.x}
          y={table.y}
          width={table.width}
          height={table.height}
          rx={8}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
        <text
          x={table.x + table.width / 2}
          y={table.y + table.height / 2 - 5}
          textAnchor="middle"
          className="text-xs font-bold fill-foreground"
        >
          {table.name}
        </text>
        <text
          x={table.x + table.width / 2}
          y={table.y + table.height / 2 + 12}
          textAnchor="middle"
          className="text-[10px] fill-muted-foreground"
        >
          {table.seats}p
        </text>
      </g>
    );
  };

  return (
    <div className="relative">
      {/* Floor Plan */}
      <div className="bg-card rounded-2xl border border-border p-4 overflow-auto">
        <svg
          viewBox="0 0 680 600"
          className="w-full max-w-3xl mx-auto"
          style={{ minHeight: "400px" }}
        >
          {/* Background */}
          <rect x="0" y="0" width="680" height="600" fill="transparent" />

          {/* Floor areas */}
          {/* Main indoor area */}
          <rect
            x="10"
            y="10"
            width="650"
            height="440"
            rx="16"
            className="fill-muted/30 stroke-border"
            strokeWidth="2"
          />

          {/* Outdoor patio area */}
          <rect
            x="80"
            y="470"
            width="420"
            height="120"
            rx="12"
            className="fill-green-500/10 stroke-green-500/30"
            strokeWidth="2"
            strokeDasharray="8 4"
          />
          <text x="290" y="575" textAnchor="middle" className="text-xs fill-green-600 font-medium">
            Outdoor Patio
          </text>

          {/* Counter/Bar area */}
          <rect
            x="520"
            y="440"
            width="140"
            height="10"
            rx="2"
            className="fill-primary/20 stroke-primary/40"
            strokeWidth="1"
          />

          {/* Coffee counter */}
          <g>
            <rect
              x="560"
              y="10"
              width="100"
              height="50"
              rx="8"
              className="fill-amber-500/20 stroke-amber-500/50"
              strokeWidth="2"
            />
            <Coffee className="text-amber-600" x="595" y="20" width="30" height="30" />
            <text x="610" y="50" textAnchor="middle" className="text-[10px] fill-amber-700 font-medium">
              Counter
            </text>
          </g>

          {/* Entrance */}
          <g>
            <rect
              x="10"
              y="430"
              width="60"
              height="20"
              rx="4"
              className="fill-blue-500/20 stroke-blue-500/50"
              strokeWidth="2"
            />
            <text x="40" y="445" textAnchor="middle" className="text-[10px] fill-blue-600 font-medium">
              Entry
            </text>
          </g>

          {/* Window indication (left wall) */}
          <line x1="10" y1="60" x2="10" y2="420" className="stroke-sky-400" strokeWidth="4" />
          <text x="20" y="240" className="text-[10px] fill-sky-500 font-medium" transform="rotate(-90, 20, 240)">
            Window View
          </text>

          {/* Section labels */}
          <text x="70" y="55" className="text-[11px] fill-muted-foreground font-medium">
            Window Section
          </text>
          <text x="260" y="55" className="text-[11px] fill-muted-foreground font-medium">
            Main Dining
          </text>
          <text x="530" y="55" className="text-[11px] fill-muted-foreground font-medium">
            Group Area
          </text>

          {/* Render all tables */}
          {tables.map(renderTable)}

          {/* Decorative elements */}
          {/* Plants */}
          <circle cx="130" y="430" r="15" className="fill-green-500/30 stroke-green-600/50" strokeWidth="1" />
          <circle cx="480" y="430" r="15" className="fill-green-500/30 stroke-green-600/50" strokeWidth="1" />
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-green-500/20 border-2 border-green-500" />
          <span className="text-muted-foreground">Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-red-500/20 border-2 border-red-500" />
          <span className="text-muted-foreground">Occupied</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-amber-500/20 border-2 border-amber-500" />
          <span className="text-muted-foreground">Reserved</span>
        </div>
      </div>

      {/* Table Action Modal */}
      {selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl border border-border shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ fontFamily: "'DM Serif Display', serif" }}>
                Table {selectedTable.name}
              </h3>
              <button
                onClick={() => setSelectedTable(null)}
                className="p-1 rounded-full hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-primary" />
                <span>{selectedTable.seats} seats</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Sofa className="h-4 w-4 text-primary" />
                <span className="capitalize">{selectedTable.section} section</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div
                  className={`w-3 h-3 rounded-full ${
                    selectedTable.status === "available" ? "bg-green-500" : "bg-amber-500"
                  }`}
                />
                <span className="capitalize">{selectedTable.status}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleAction("order")}
                className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider"
                disabled={selectedTable.status === "reserved"}
              >
                <ShoppingBag className="h-4 w-4" />
                Order Now
              </Button>
              <Button
                onClick={() => handleAction("book")}
                variant="outline"
                className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider"
              >
                <CalendarDays className="h-4 w-4" />
                Book Table
              </Button>
            </div>

            {selectedTable.status === "reserved" && (
              <p className="text-xs text-amber-600 text-center mt-3">
                This table is reserved. You can still book it for another time.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
