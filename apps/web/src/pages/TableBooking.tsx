import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock,
  Users,
  Check,
  AlertCircle,
  Coffee,
  ChevronLeft,
  ChevronRight,
  X,
  Sofa,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import LoadingOverlay from "@/components/LoadingOverlay";
import CafeFloorPlan, { FloorPlanTable, convertApiTable } from "@/components/CafeFloorPlan";
import { cafeApi, reservationsApi, CafeTable } from "@/lib/api";

// Time slots for the cafe
const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30",
];

// Slot duration in minutes
const SLOT_DURATION = 90;

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const calculateEndTime = (startTime: string): string => {
  const [hours, minutes] = startTime.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + SLOT_DURATION;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;
};

type Step = "date" | "time" | "table" | "details" | "confirmation";

const steps: { key: Step; label: string }[] = [
  { key: "date", label: "Date" },
  { key: "time", label: "Time" },
  { key: "table", label: "Table" },
  { key: "details", label: "Details" },
];

export default function TableBooking() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>("date");

  // Step 1: Date selection
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [closedDates, setClosedDates] = useState<Set<string>>(new Set());
  const [loadingClosedDates, setLoadingClosedDates] = useState(false);
  const [dateCheckError, setDateCheckError] = useState("");

  // Step 2: Time selection
  const [selectedTime, setSelectedTime] = useState("");

  // Step 3: Table selection
  const [tables, setTables] = useState<CafeTable[]>([]);
  const [availableTables, setAvailableTables] = useState<CafeTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<FloorPlanTable | null>(null);
  const [loadingTables, setLoadingTables] = useState(false);

  // Step 4: Booking details
  const [guests, setGuests] = useState("2");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  // Form state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Fetch closed dates when month changes
  useEffect(() => {
    const fetchClosedDates = async () => {
      setLoadingClosedDates(true);
      const monthStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`;
      const { data, error } = await cafeApi.getClosedDates(monthStr);
      if (data) {
        setClosedDates(new Set(data));
      }
      if (error) {
        console.error("Failed to fetch closed dates:", error);
      }
      setLoadingClosedDates(false);
    };
    fetchClosedDates();
  }, [currentMonth]);

  // Fetch all tables on mount
  useEffect(() => {
    const fetchTables = async () => {
      const { data } = await cafeApi.getTables();
      if (data) {
        setTables(data);
      }
    };
    fetchTables();
  }, []);

  // Fetch available tables when date and time are selected
  useEffect(() => {
    const fetchAvailableTables = async () => {
      if (!selectedDate || !selectedTime) return;

      setLoadingTables(true);
      const dateStr = selectedDate.toISOString().split("T")[0];
      const endTime = calculateEndTime(selectedTime);
      const partySize = guests === "6+" ? 6 : parseInt(guests);

      const { data, error } = await cafeApi.getAvailableTables(
        dateStr,
        selectedTime,
        endTime,
        partySize
      );

      if (data) {
        setAvailableTables(data);
      }
      if (error) {
        console.error("Failed to fetch available tables:", error);
      }
      setLoadingTables(false);
    };
    fetchAvailableTables();
  }, [selectedDate, selectedTime, guests]);

  // Convert tables for floor plan display
  const floorPlanTables = useMemo(() => {
    if (tables.length === 0) return undefined;

    const availableIds = new Set(availableTables.map(t => t.id));
    return tables.map(table => convertApiTable(table, !availableIds.has(table.id)));
  }, [tables, availableTables]);

  const reservedTableIds = useMemo(() => {
    const availableIds = new Set(availableTables.map(t => t.id));
    return tables.filter(t => !availableIds.has(t.id)).map(t => t.id);
  }, [tables, availableTables]);

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const isDateClosed = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return closedDates.has(dateStr);
  };

  const isDatePast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleDateSelect = async (date: Date) => {
    if (isDatePast(date) || isDateClosed(date)) return;

    setSelectedDate(date);
    setDateCheckError("");

    // Verify with API
    const dateStr = date.toISOString().split("T")[0];
    const { data, error } = await cafeApi.checkDate(dateStr);

    if (error) {
      setDateCheckError("Failed to check date availability");
      return;
    }

    if (data && !data.open) {
      setDateCheckError(data.closedReason || "The cafe is closed on this date");
      setSelectedDate(null);
      return;
    }

    // Move to next step
    setCurrentStep("time");
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setCurrentStep("table");
  };

  const handleTableSelect = (table: FloorPlanTable) => {
    if (table.status === "reserved") return;
    setSelectedTable(table);
    // Pre-fill guest count based on table capacity
    if (table.seats <= 6) {
      setGuests(String(table.seats));
    }
    setCurrentStep("details");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !selectedTable) return;

    setLoading(true);
    setError("");

    const partySize = guests === "6+" ? 6 : parseInt(guests);
    const dateStr = selectedDate.toISOString().split("T")[0];

    const endTime = calculateEndTime(selectedTime);

    const { data, error: apiError } = await reservationsApi.createReservation({
      tableId: selectedTable.id,
      reservationDate: dateStr,
      startTime: selectedTime,
      endTime: endTime,
      partySize,
      contactPhone: phone || undefined,
      specialRequests: specialRequests || undefined,
    });

    setLoading(false);

    if (apiError) {
      setError(apiError);
      return;
    }

    if (data) {
      setSubmitted(true);
      setCurrentStep("confirmation");
    }
  };

  const goBack = () => {
    switch (currentStep) {
      case "time":
        setCurrentStep("date");
        setSelectedTime("");
        break;
      case "table":
        setCurrentStep("time");
        setSelectedTable(null);
        break;
      case "details":
        setCurrentStep("table");
        break;
    }
  };

  const getStepIndex = (step: Step) => steps.findIndex(s => s.key === step);

  // Confirmation view
  if (submitted) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center text-primary-foreground">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-foreground/10">
            <Check className="h-8 w-8" />
          </div>
          <h2 className="text-2xl mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Booking Confirmed
          </h2>
          <p className="text-sm opacity-80 mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
            Thank you, {name}.
          </p>
          <p className="text-sm opacity-80 mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
            Table {selectedTable?.name} for {guests} guests
          </p>
          <p className="text-sm opacity-80 mb-6" style={{ fontFamily: "'Space Mono', monospace" }}>
            {selectedDate?.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} at {formatTime(selectedTime)}
          </p>
          <Link to="/">
            <Button variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Menu
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {loading && <LoadingOverlay message="Booking your table..." />}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 md:px-10">
          {currentStep === "date" ? (
            <Link to="/" className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] sm:tracking-[0.2em] hover:opacity-70 transition-opacity">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Link>
          ) : (
            <button
              onClick={goBack}
              className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] sm:tracking-[0.2em] hover:opacity-70 transition-opacity"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}
          <Link to="/" className="absolute left-1/2 -translate-x-1/2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-normal" style={{ fontFamily: "'DM Serif Display', serif" }}>
              APlus
            </h1>
          </Link>
          <div className="w-12 sm:w-16" />
        </div>
      </header>

      {/* Progress Steps */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isActive = currentStep === step.key;
              const isComplete = getStepIndex(currentStep) > index;

              return (
                <div key={step.key} className="flex items-center">
                  <div className="flex items-center gap-2">
                    <div className={`
                      flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium
                      ${isComplete ? "bg-primary text-primary-foreground" : ""}
                      ${isActive ? "bg-primary text-primary-foreground" : ""}
                      ${!isActive && !isComplete ? "bg-muted text-muted-foreground" : ""}
                    `}>
                      {isComplete ? <Check className="h-4 w-4" /> : index + 1}
                    </div>
                    <span className={`hidden sm:inline text-sm ${isActive ? "font-medium" : "text-muted-foreground"}`}>
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`
                      mx-2 sm:mx-4 h-px w-8 sm:w-16
                      ${isComplete ? "bg-primary" : "bg-border"}
                    `} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Step 1: Date Selection */}
        {currentStep === "date" && (
          <div>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center gap-2 mb-2">
                <CalendarDays className="h-6 w-6 text-primary" />
                <h2 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: "'DM Serif Display', serif" }}>
                  Select a Date
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Choose when you'd like to visit us
              </p>
            </div>

            {/* Calendar */}
            <div className="max-w-md mx-auto bg-card rounded-xl border border-border p-4 sm:p-6">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h3 className="font-medium" style={{ fontFamily: "'DM Serif Display', serif" }}>
                  {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </h3>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                  <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {loadingClosedDates ? (
                  <div className="col-span-7 text-center py-8 text-muted-foreground">
                    Loading...
                  </div>
                ) : (
                  getDaysInMonth(currentMonth).map((date, index) => {
                    if (!date) {
                      return <div key={`empty-${index}`} className="p-2" />;
                    }

                    const isPast = isDatePast(date);
                    const isClosed = isDateClosed(date);
                    const isSelected = selectedDate?.toDateString() === date.toDateString();
                    const isToday = date.toDateString() === new Date().toDateString();
                    const isDisabled = isPast || isClosed;

                    return (
                      <button
                        key={date.toISOString()}
                        onClick={() => handleDateSelect(date)}
                        disabled={isDisabled}
                        className={`
                          p-2 sm:p-3 text-sm rounded-lg transition-all
                          ${isSelected ? "bg-primary text-primary-foreground" : ""}
                          ${isToday && !isSelected ? "ring-2 ring-primary ring-inset" : ""}
                          ${isClosed ? "bg-red-100 text-red-400 dark:bg-red-900/30 dark:text-red-500 cursor-not-allowed" : ""}
                          ${isPast && !isClosed ? "text-muted-foreground/50 cursor-not-allowed" : ""}
                          ${!isDisabled && !isSelected ? "hover:bg-muted" : ""}
                        `}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Legend */}
              <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-red-100 dark:bg-red-900/30" />
                  <span className="text-muted-foreground">Closed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded ring-2 ring-primary ring-inset" />
                  <span className="text-muted-foreground">Today</span>
                </div>
              </div>

              {dateCheckError && (
                <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{dateCheckError}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Time Selection */}
        {currentStep === "time" && (
          <div>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center gap-2 mb-2">
                <Clock className="h-6 w-6 text-primary" />
                <h2 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: "'DM Serif Display', serif" }}>
                  Select a Time
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedDate?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
            </div>

            <div className="max-w-lg mx-auto">
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => handleTimeSelect(slot)}
                    className={`
                      rounded-lg border px-3 py-3 text-sm transition-all
                      ${selectedTime === slot
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground hover:border-primary/50"
                      }
                    `}
                    style={{ fontFamily: "'Space Mono', monospace" }}
                  >
                    {formatTime(slot)}
                  </button>
                ))}
              </div>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                Each booking is for {SLOT_DURATION} minutes
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Table Selection */}
        {currentStep === "table" && (
          <div>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center gap-2 mb-2">
                <Coffee className="h-6 w-6 text-primary" />
                <h2 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: "'DM Serif Display', serif" }}>
                  Select a Table
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedDate?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} at {formatTime(selectedTime)}
              </p>
            </div>

            {/* Guest count selector */}
            <div className="max-w-lg mx-auto mb-6">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-foreground mb-3">
                <Users className="h-4 w-4 text-primary" />
                Number of Guests
              </label>
              <div className="flex gap-2">
                {["1", "2", "3", "4", "5", "6+"].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGuests(g)}
                    className={`flex-1 rounded border px-3 py-2.5 text-sm font-medium transition-all ${
                      guests === g
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {loadingTables ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center gap-2 text-muted-foreground">
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Loading available tables...</span>
                </div>
              </div>
            ) : (
              <>
                <CafeFloorPlan
                  tables={floorPlanTables}
                  reservedTableIds={reservedTableIds}
                  onTableSelect={handleTableSelect}
                  showModal={false}
                  selectedTableId={selectedTable?.id}
                />

                {/* Selected Table Info */}
                {selectedTable && (
                  <div className="mt-6 max-w-md mx-auto p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Coffee className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold">Table {selectedTable.name}</p>
                          <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace" }}>
                            {selectedTable.seats} seats • {selectedTable.section} section
                          </p>
                        </div>
                      </div>
                      <Button onClick={() => setCurrentStep("details")}>
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 4: Booking Details */}
        {currentStep === "details" && (
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
                Complete Your Booking
              </h2>
              <p className="text-sm text-muted-foreground">
                Just a few more details
              </p>
            </div>

            {/* Booking Summary */}
            <div className="mb-6 p-4 rounded-xl bg-muted/50 border border-border">
              <h3 className="font-medium mb-3">Booking Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <span>{selectedDate?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{formatTime(selectedTime)} - {formatTime(calculateEndTime(selectedTime))}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Coffee className="h-4 w-4 text-primary" />
                  <span>Table {selectedTable?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sofa className="h-4 w-4 text-primary" />
                  <span className="capitalize">{selectedTable?.section} section</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span>{guests} guests</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.1em] text-foreground">Your Name</label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name"
                  required
                  maxLength={255}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.1em] text-foreground">Phone Number</label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="012-345 6789"
                  required
                  maxLength={20}
                  pattern="[0-9+\-\s]*"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.1em] text-foreground">Special Requests (Optional)</label>
                <Textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Any special requests or dietary requirements..."
                  rows={3}
                  maxLength={500}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full text-xs font-bold uppercase tracking-[0.15em]"
                size="lg"
                disabled={!name || !phone || loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Booking...
                  </span>
                ) : (
                  "Confirm Booking"
                )}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
