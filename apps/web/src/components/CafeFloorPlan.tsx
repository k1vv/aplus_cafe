import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  CalendarDays,
  ShoppingBag,
  X,
  Sofa,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CafeTable } from "@/lib/api";

export interface FloorPlanTable {
  id: number;
  name: string;
  seats: number;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: "rect" | "circle" | "oval";
  status: "available" | "occupied" | "reserved";
  section: string;
}

// Convert API CafeTable to FloorPlanTable format
export function convertApiTable(table: CafeTable, isReserved: boolean = false): FloorPlanTable {
  const shapeMap: Record<string, "rect" | "circle" | "oval"> = {
    'ROUND': 'circle',
    'SQUARE': 'rect',
    'RECTANGULAR': 'rect',
  };

  return {
    id: table.id,
    name: table.tableNumber,
    seats: table.capacity,
    x: table.positionX,
    y: table.positionY,
    width: table.width,
    height: table.height,
    shape: shapeMap[table.shape] || 'rect',
    status: isReserved ? 'reserved' : 'available',
    section: table.floorSection,
  };
}

// Default tables for backward compatibility (when no tables prop provided)
const defaultTables: FloorPlanTable[] = [
  // Window section
  { id: 1, name: "W1", seats: 2, x: 55, y: 90, width: 60, height: 60, shape: "circle", status: "available", section: "window" },
  { id: 2, name: "W2", seats: 2, x: 55, y: 190, width: 60, height: 60, shape: "circle", status: "available", section: "window" },
  { id: 3, name: "W3", seats: 2, x: 55, y: 290, width: 60, height: 60, shape: "circle", status: "available", section: "window" },
  { id: 4, name: "W4", seats: 2, x: 55, y: 390, width: 60, height: 60, shape: "circle", status: "available", section: "window" },
  // Main dining
  { id: 5, name: "C1", seats: 4, x: 190, y: 110, width: 100, height: 70, shape: "rect", status: "available", section: "center" },
  { id: 6, name: "C2", seats: 4, x: 190, y: 230, width: 100, height: 70, shape: "rect", status: "available", section: "center" },
  { id: 7, name: "C3", seats: 4, x: 190, y: 350, width: 100, height: 70, shape: "rect", status: "available", section: "center" },
  { id: 8, name: "C4", seats: 4, x: 350, y: 110, width: 100, height: 70, shape: "rect", status: "available", section: "center" },
  { id: 9, name: "C5", seats: 4, x: 350, y: 230, width: 100, height: 70, shape: "rect", status: "available", section: "center" },
  { id: 10, name: "C6", seats: 4, x: 350, y: 350, width: 100, height: 70, shape: "rect", status: "available", section: "center" },
  // Group area
  { id: 11, name: "L1", seats: 6, x: 510, y: 160, width: 120, height: 80, shape: "oval", status: "available", section: "corner" },
  { id: 12, name: "L2", seats: 6, x: 510, y: 270, width: 120, height: 80, shape: "oval", status: "available", section: "corner" },
  { id: 13, name: "L3", seats: 8, x: 510, y: 380, width: 120, height: 80, shape: "oval", status: "available", section: "corner" },
  // Outdoor patio
  { id: 14, name: "O1", seats: 4, x: 135, y: 520, width: 80, height: 60, shape: "rect", status: "available", section: "outdoor" },
  { id: 15, name: "O2", seats: 4, x: 255, y: 520, width: 80, height: 60, shape: "rect", status: "available", section: "outdoor" },
  { id: 16, name: "O3", seats: 4, x: 375, y: 520, width: 80, height: 60, shape: "rect", status: "available", section: "outdoor" },
];

interface CafeFloorPlanProps {
  tables?: FloorPlanTable[];
  reservedTableIds?: number[];
  onTableSelect?: (table: FloorPlanTable) => void;
  showModal?: boolean;
  selectedTableId?: number | null;
}

export default function CafeFloorPlan({
  tables,
  reservedTableIds = [],
  onTableSelect,
  showModal = true,
  selectedTableId
}: CafeFloorPlanProps) {
  const navigate = useNavigate();
  const [internalSelectedTable, setInternalSelectedTable] = useState<FloorPlanTable | null>(null);
  const [hoveredTable, setHoveredTable] = useState<number | null>(null);

  // Use provided tables or default
  const displayTables = tables || defaultTables;

  // Apply reservation status
  const tablesWithStatus = displayTables.map(table => ({
    ...table,
    status: reservedTableIds.includes(table.id) ? 'reserved' as const : table.status
  }));

  const selectedTable = selectedTableId
    ? tablesWithStatus.find(t => t.id === selectedTableId) || null
    : internalSelectedTable;

  const getStatusColor = (status: FloorPlanTable["status"], isHovered: boolean) => {
    if (status === "available") return isHovered ? "#16a34a" : "#22c55e";
    if (status === "occupied") return "#ef4444";
    return "#f59e0b";
  };

  const getStatusBg = (status: FloorPlanTable["status"], isHovered: boolean) => {
    if (status === "available") return isHovered ? "rgba(34,197,94,0.28)" : "rgba(34,197,94,0.16)";
    if (status === "occupied") return "rgba(239,68,68,0.15)";
    return "rgba(245,158,11,0.18)";
  };

  const handleTableClick = (table: FloorPlanTable) => {
    if (table.status === "occupied") return;

    if (onTableSelect) {
      onTableSelect(table);
    } else {
      setInternalSelectedTable(table);
    }
  };

  const handleAction = (action: "order" | "book") => {
    if (!selectedTable) return;

    sessionStorage.setItem("selectedTable", JSON.stringify(selectedTable));

    if (action === "order") {
      sessionStorage.setItem("orderType", "DINE_IN");
      navigate("/order");
    } else {
      navigate("/book");
    }

    setInternalSelectedTable(null);
  };

  const renderTable = (table: FloorPlanTable) => {
    const isHovered = hoveredTable === table.id;
    const isSelected = selectedTable?.id === table.id;
    const isClickable = table.status !== "occupied";

    const fill = getStatusBg(table.status, isHovered && isClickable);
    const stroke = getStatusColor(table.status, isHovered && isClickable);
    const strokeWidth = isSelected ? 3 : 2;

    const groupProps = {
      key: table.id,
      className: isClickable ? "cursor-pointer" : "cursor-not-allowed",
      onClick: () => handleTableClick(table),
      onMouseEnter: () => setHoveredTable(table.id),
      onMouseLeave: () => setHoveredTable(null),
      style: {
        transition: "all 0.2s ease",
        transform: isHovered && isClickable ? "scale(1.04)" : "scale(1)",
        transformOrigin: "center",
      } as React.CSSProperties,
    };

    if (table.shape === "circle") {
      return (
        <g {...groupProps}>
          <circle
            cx={table.x + table.width / 2}
            cy={table.y + table.height / 2}
            r={table.width / 2}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          <text
            x={table.x + table.width / 2}
            y={table.y + table.height / 2 - 4}
            textAnchor="middle"
            fontSize="16"
            fontWeight="700"
            fill="#1f2937"
          >
            {table.name}
          </text>
          <text
            x={table.x + table.width / 2}
            y={table.y + table.height / 2 + 16}
            textAnchor="middle"
            fontSize="12"
            fill="#6b7280"
          >
            {table.seats}p
          </text>
        </g>
      );
    }

    if (table.shape === "oval") {
      return (
        <g {...groupProps}>
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
            y={table.y + table.height / 2 - 4}
            textAnchor="middle"
            fontSize="16"
            fontWeight="700"
            fill="#1f2937"
          >
            {table.name}
          </text>
          <text
            x={table.x + table.width / 2}
            y={table.y + table.height / 2 + 16}
            textAnchor="middle"
            fontSize="12"
            fill="#6b7280"
          >
            {table.seats}p
          </text>
        </g>
      );
    }

    return (
      <g {...groupProps}>
        <rect
          x={table.x}
          y={table.y}
          width={table.width}
          height={table.height}
          rx={10}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
        <text
          x={table.x + table.width / 2}
          y={table.y + table.height / 2 - 4}
          textAnchor="middle"
          fontSize="16"
          fontWeight="700"
          fill="#1f2937"
        >
          {table.name}
        </text>
        <text
          x={table.x + table.width / 2}
          y={table.y + table.height / 2 + 16}
          textAnchor="middle"
          fontSize="12"
          fill="#6b7280"
        >
          {table.seats}p
        </text>
      </g>
    );
  };

  return (
    <div className="relative">
      <div className="rounded-2xl border border-border bg-card p-2 sm:p-4 overflow-x-auto">
        <svg
          viewBox="0 0 700 620"
          preserveAspectRatio="xMidYMid meet"
          className="mx-auto w-full h-auto"
          style={{ minHeight: "300px", maxHeight: "80vh" }}
        >
          {/* Main floor */}
          <rect
            x="18"
            y="18"
            width="664"
            height="582"
            rx="18"
            fill="#f8f6f2"
            stroke="#d8d1c7"
            strokeWidth="1.5"
          />

          {/* Indoor area */}
          <rect
            x="60"
            y="40"
            width="580"
            height="420"
            rx="16"
            fill="#f4f1eb"
            stroke="#cfc6b8"
            strokeWidth="2"
          />

          {/* Outdoor area */}
          <rect
            x="120"
            y="485"
            width="400"
            height="110"
            rx="14"
            fill="#ecfdf3"
            stroke="#86efac"
            strokeWidth="2"
            strokeDasharray="8 6"
          />

          {/* Counter */}
          <rect
            x="550"
            y="100"
            width="80"
            height="50"
            rx="8"
            fill="#fff3d6"
            stroke="#f59e0b"
            strokeWidth="2"
          />
          <text x="590" y="130" textAnchor="middle" fontSize="12" fontWeight="700" fill="#b45309">
            Counter
          </text>

          {/* Entrance */}
          <rect
            x="60"
            y="438"
            width="56"
            height="20"
            rx="4"
            fill="#dbeafe"
            stroke="#60a5fa"
            strokeWidth="1.5"
          />
          <text x="88" y="452" textAnchor="middle" fontSize="11" fontWeight="600" fill="#2563eb">
            Entry
          </text>

          {/* Window line */}
          <line x1="60" y1="85" x2="60" y2="428" stroke="#38bdf8" strokeWidth="4" />
          <text
            x="72"
            y="255"
            transform="rotate(-90, 72, 255)"
            fontSize="11"
            fontWeight="600"
            fill="#0ea5e9"
          >
            Window View
          </text>

          {/* Labels */}
          <text x="85" y="70" fontSize="12" fontWeight="500" fill="#8b6f47">
            Window
          </text>
          <text x="270" y="70" fontSize="12" fontWeight="500" fill="#8b6f47">
            Main Dining
          </text>
          <text x="540" y="70" fontSize="12" fontWeight="500" fill="#8b6f47">
            Group Area
          </text>
          <text x="320" y="580" textAnchor="middle" fontSize="14" fontWeight="500" fill="#16a34a">
            Outdoor Patio
          </text>

          {/* Decorative plants */}
          <circle cx="150" cy="445" r="12" fill="#bbf7d0" stroke="#86efac" />
          <circle cx="500" cy="445" r="12" fill="#bbf7d0" stroke="#86efac" />

          {/* Tables */}
          {tablesWithStatus.map(renderTable)}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-3 sm:mt-4 flex flex-wrap justify-center gap-3 sm:gap-5 text-[10px] sm:text-xs">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-full border-2 border-green-500 bg-green-500/20" />
          <span className="text-muted-foreground">Available</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-full border-2 border-red-500 bg-red-500/20" />
          <span className="text-muted-foreground">Occupied</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-full border-2 border-amber-500 bg-amber-500/20" />
          <span className="text-muted-foreground">Reserved</span>
        </div>
      </div>

      {/* Mobile hint */}
      <p className="mt-2 text-center text-[10px] sm:text-xs text-muted-foreground">
        Tap on any available table to select it
      </p>

      {/* Modal - only show if showModal is true and using internal selection */}
      {showModal && internalSelectedTable && !onTableSelect && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
          onClick={() => setInternalSelectedTable(null)}
        >
          <div
            className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle for mobile */}
            <div className="sm:hidden flex justify-center mb-3">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="mb-4 flex items-center justify-between">
              <h3
                className="text-lg font-bold"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                Table {internalSelectedTable.name}
              </h3>
              <button
                onClick={() => setInternalSelectedTable(null)}
                className="rounded-full p-2 hover:bg-muted active:bg-muted transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="mb-5 sm:mb-6 space-y-2.5 sm:space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-primary" />
                <span>{internalSelectedTable.seats} seats</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Sofa className="h-4 w-4 text-primary" />
                <span className="capitalize">{internalSelectedTable.section} section</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div
                  className={`h-3 w-3 rounded-full ${
                    internalSelectedTable.status === "available"
                      ? "bg-green-500"
                      : internalSelectedTable.status === "occupied"
                      ? "bg-red-500"
                      : "bg-amber-500"
                  }`}
                />
                <span className="capitalize">{internalSelectedTable.status}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleAction("order")}
                disabled={internalSelectedTable.status === "reserved"}
                className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider h-11 sm:h-10"
              >
                <ShoppingBag className="h-4 w-4" />
                Order Now
              </Button>
              <Button
                onClick={() => handleAction("book")}
                variant="outline"
                className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider h-11 sm:h-10"
              >
                <CalendarDays className="h-4 w-4" />
                Book Table
              </Button>
            </div>

            {internalSelectedTable.status === "reserved" && (
              <p className="mt-3 text-center text-xs text-amber-600">
                This table is reserved. You can still book it for another time.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
