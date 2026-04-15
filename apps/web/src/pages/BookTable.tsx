import { useState } from "react";
import { CalendarDays, Clock, Users, ArrowLeft, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import { reservationsApi } from "@/lib/api";

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30",
];

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

export default function BookTable() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [guests, setGuests] = useState("2");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const partySize = guests === "6+" ? 6 : parseInt(guests);

    const { data, error: apiError } = await reservationsApi.createReservation({
      reservationDate: date,
      startTime: time,
      partySize,
      customerName: name,
      customerPhone: phone,
      specialRequests: specialRequests || undefined,
    });

    setLoading(false);

    if (apiError) {
      setError(apiError);
      return;
    }

    if (data) {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center text-primary-foreground">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-foreground/10">
            <Check className="h-8 w-8" />
          </div>
          <h2 className="text-2xl mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>Booking Confirmed</h2>
          <p className="text-sm opacity-80 mb-1" style={{ fontFamily: "'Space Mono', monospace" }}>
            Thank you, {name}.
          </p>
          <p className="text-sm opacity-80 mb-6" style={{ fontFamily: "'Space Mono', monospace" }}>
            Table for {guests} on {date} at {formatTime(time)}.
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
      <div className="bg-primary text-primary-foreground px-6 py-4">
        <Link to="/" className="text-xs uppercase tracking-[0.15em] hover:opacity-70 transition-opacity">
          ← Back
        </Link>
      </div>

      <div className="max-w-lg mx-auto px-6 py-12 sm:py-16">
        <h1 className="text-3xl text-foreground mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
          Book a Table
        </h1>
        <p className="text-sm text-muted-foreground mb-10" style={{ fontFamily: "'Space Mono', monospace" }}>
          Reserve your spot at APlus. Walk-ins are welcome too.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-foreground">
              <CalendarDays className="h-4 w-4 text-primary" />
              Date
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-foreground">
              <Clock className="h-4 w-4 text-primary" />
              Time
            </label>
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setTime(slot)}
                  className={`rounded border px-3 py-2 text-xs transition-all ${
                    time === slot
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/50"
                  }`}
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  {formatTime(slot)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-foreground">
              <Users className="h-4 w-4 text-primary" />
              Guests
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

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.1em] text-foreground">Your Name</label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              required
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
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.1em] text-foreground">Special Requests (Optional)</label>
            <Textarea
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              placeholder="Any special requests or dietary requirements..."
              rows={3}
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
            disabled={!date || !time || !name || !phone || loading}
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
    </div>
  );
}
