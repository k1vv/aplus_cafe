import { Link } from "react-router-dom";
import { ArrowLeft, Coffee } from "lucide-react";
import CafeFloorPlan from "@/components/CafeFloorPlan";

export default function CafeLayout() {
  return (
    <div className="min-h-screen bg-background">
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            <Coffee className="h-6 w-6 text-primary" />
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Cafe Layout
            </h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Select a table to place an order for dine-in or book it for a reservation
          </p>
        </div>

        <CafeFloorPlan />

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace" }}>
            Click on any available or reserved table to see options
          </p>
        </div>
      </div>
    </div>
  );
}
