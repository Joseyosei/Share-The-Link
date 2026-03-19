import { useState, useEffect, useMemo } from "react";
import { Calendar, Clock, ArrowRight, ArrowLeft, Check, Loader2, Video, Phone, MapPin, User, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface BookingService {
  id: string;
  title: string;
  description: string;
  duration: number;
  price: number;
  currency: string;
  type: string;
}

interface AvailabilitySlot {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface BookingWidgetProps {
  creatorId: string;
  creatorName: string;
  themeTextColor?: string;
}

type Step = "services" | "date" | "time" | "details" | "confirm";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TYPE_ICONS: Record<string, typeof Video> = { video: Video, phone: Phone, "in-person": MapPin };

export const BookingWidget = ({ creatorId, creatorName, themeTextColor = "text-foreground" }: BookingWidgetProps) => {
  const [services, setServices] = useState<BookingService[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [existingBookings, setExistingBookings] = useState<{ booking_date: string; booking_time: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>("services");
  const [selectedService, setSelectedService] = useState<BookingService | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientNotes, setClientNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [calMonth, setCalMonth] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [svcRes, availRes, blockedRes, bookingsRes] = await Promise.all([
        supabase.from("booking_services").select("*").eq("creator_id", creatorId).eq("is_active", true).order("price"),
        supabase.from("creator_availability").select("*").eq("creator_id", creatorId).eq("is_active", true),
        supabase.from("creator_blocked_dates").select("blocked_date").eq("creator_id", creatorId),
        supabase.from("bookings").select("booking_date, booking_time").eq("creator_id", creatorId).in("status", ["pending", "confirmed"]),
      ]);
      setServices((svcRes.data as BookingService[]) || []);
      setAvailability((availRes.data as AvailabilitySlot[]) || []);
      setBlockedDates((blockedRes.data || []).map((d: { blocked_date: string }) => d.blocked_date));
      setExistingBookings((bookingsRes.data || []) as { booking_date: string; booking_time: string }[]);
      setLoading(false);
    };
    fetchData();
  }, [creatorId]);

  // Calendar generation
  const calendarDays = useMemo(() => {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: { date: Date; available: boolean; inMonth: boolean }[] = [];
    // Padding before
    for (let i = 0; i < firstDay; i++) {
      days.push({ date: new Date(year, month, -firstDay + i + 1), available: false, inMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dayOfWeek = date.getDay();
      const dateStr = date.toISOString().split("T")[0];
      const isBlocked = blockedDates.includes(dateStr);
      const hasAvailability = availability.some((a) => a.day_of_week === dayOfWeek);
      const isPast = date < today;
      days.push({ date, available: hasAvailability && !isBlocked && !isPast, inMonth: true });
    }
    return days;
  }, [calMonth, availability, blockedDates]);

  // Time slots for selected date
  const timeSlots = useMemo(() => {
    if (!selectedDate || !selectedService) return [];
    const dayOfWeek = selectedDate.getDay();
    const dayAvail = availability.filter((a) => a.day_of_week === dayOfWeek);
    const dateStr = selectedDate.toISOString().split("T")[0];
    const bookedTimes = existingBookings.filter((b) => b.booking_date === dateStr).map((b) => b.booking_time);

    const slots: string[] = [];
    for (const avail of dayAvail) {
      const [startH, startM] = avail.start_time.split(":").map(Number);
      const [endH, endM] = avail.end_time.split(":").map(Number);
      let current = startH * 60 + startM;
      const end = endH * 60 + endM;
      while (current + selectedService.duration <= end) {
        const h = Math.floor(current / 60);
        const m = current % 60;
        const timeStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
        if (!bookedTimes.includes(timeStr)) {
          slots.push(timeStr);
        }
        current += 30; // 30-min intervals
      }
    }
    return slots;
  }, [selectedDate, selectedService, availability, existingBookings]);

  const formatTime = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
  };

  const handleBook = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !clientName || !clientEmail) return;
    setSubmitting(true);
    setBookingError("");
    try {
      const dateStr = selectedDate.toISOString().split("T")[0];

      // Check for duplicate booking
      const { data: existing } = await supabase
        .from("bookings")
        .select("id")
        .eq("creator_id", creatorId)
        .eq("booking_date", dateStr)
        .eq("booking_time", selectedTime)
        .in("status", ["pending", "confirmed"])
        .maybeSingle();

      if (existing) {
        setBookingError("This time slot has already been booked. Please select a different time.");
        setSubmitting(false);
        return;
      }

      const { error } = await supabase.from("bookings").insert({
        creator_id: creatorId,
        service_id: selectedService.id,
        client_name: clientName,
        client_email: clientEmail,
        client_notes: clientNotes,
        booking_date: dateStr,
        booking_time: selectedTime,
        duration: selectedService.duration,
        amount: selectedService.price,
        currency: selectedService.currency,
        status: selectedService.price > 0 ? "pending" : "confirmed",
        payment_status: selectedService.price > 0 ? "pending" : "free",
      });
      if (error) throw error;
      setBooked(true);
    } catch (err: any) {
      console.error("Booking error:", err);
      setBookingError(err?.message || "Failed to create booking. Please try again.");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (services.length === 0) return null;

  if (booked) {
    return (
      <div className="text-center py-6 px-4">
        <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
          <Check className="w-7 h-7 text-green-500" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-1">Booking Confirmed!</h3>
        <p className="text-sm text-muted-foreground mb-1">
          {selectedService?.title} with {creatorName}
        </p>
        <p className="text-sm text-muted-foreground">
          {selectedDate?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} at {selectedTime && formatTime(selectedTime)}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          {"A confirmation will be sent to "}{clientEmail}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Step: Select Service */}
      {step === "services" && (
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Book a Session
          </h3>
          {services.map((svc) => {
            const Icon = TYPE_ICONS[svc.type] || Video;
            return (
              <button
                key={svc.id}
                onClick={() => { setSelectedService(svc); setStep("date"); }}
                className="w-full text-left p-3 rounded-xl border border-border bg-background hover:bg-muted/50 hover:border-primary/30 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-semibold text-sm text-foreground">{svc.title}</span>
                    </div>
                    {svc.description && <p className="text-xs text-muted-foreground line-clamp-1">{svc.description}</p>}
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{svc.duration} min</Badge>
                      <span className="text-xs font-bold text-foreground">
                        {svc.price > 0 ? `$${svc.price.toFixed(2)}` : "Free"}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Step: Select Date */}
      {step === "date" && (
        <div>
          <button onClick={() => setStep("services")} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3">
            <ArrowLeft className="w-3 h-3" /> Back
          </button>
          <h3 className="font-semibold text-foreground text-sm mb-3">Pick a date</h3>
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1))} className="p-1 rounded hover:bg-muted"><ArrowLeft className="w-4 h-4" /></button>
            <span className="text-sm font-medium text-foreground">
              {calMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </span>
            <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1))} className="p-1 rounded hover:bg-muted"><ArrowRight className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center">
            {DAY_NAMES.map((d) => <div key={d} className="text-[10px] text-muted-foreground font-medium py-1">{d}</div>)}
            {calendarDays.map((day, i) => {
              const isSelected = selectedDate && day.date.toDateString() === selectedDate.toDateString();
              return (
                <button
                  key={i}
                  disabled={!day.available || !day.inMonth}
                  onClick={() => { setSelectedDate(day.date); setStep("time"); setSelectedTime(null); }}
                  className={`py-1.5 rounded-lg text-xs transition-all ${
                    !day.inMonth ? "text-transparent cursor-default" :
                    !day.available ? "text-muted-foreground/30 cursor-default" :
                    isSelected ? "bg-primary text-primary-foreground font-bold" :
                    "text-foreground hover:bg-primary/10 font-medium"
                  }`}
                >
                  {day.date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step: Select Time */}
      {step === "time" && (
        <div>
          <button onClick={() => { setStep("date"); setSelectedTime(null); }} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3">
            <ArrowLeft className="w-3 h-3" /> Back
          </button>
          <h3 className="font-semibold text-foreground text-sm mb-1">
            {selectedDate?.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </h3>
          <p className="text-xs text-muted-foreground mb-3">Select a time slot</p>
          {timeSlots.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No available slots for this date.</p>
          ) : (
            <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto">
              {timeSlots.map((time) => (
                <button
                  key={time}
                  onClick={() => { setSelectedTime(time); setStep("details"); }}
                  className={`py-2 rounded-lg text-xs font-medium transition-all border ${
                    selectedTime === time
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-foreground hover:border-primary/50 hover:bg-primary/5"
                  }`}
                >
                  {formatTime(time)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step: Enter Details */}
      {step === "details" && (
        <div>
          <button onClick={() => setStep("time")} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3">
            <ArrowLeft className="w-3 h-3" /> Back
          </button>
          <h3 className="font-semibold text-foreground text-sm mb-3">Your details</h3>
          <div className="space-y-3">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Your name" className="pl-9 h-10 text-sm" required />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="Your email" className="pl-9 h-10 text-sm" required />
            </div>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Textarea value={clientNotes} onChange={(e) => setClientNotes(e.target.value)} placeholder="Notes (optional)" className="pl-9 text-sm min-h-[60px]" rows={2} />
            </div>
            <Button
              onClick={() => setStep("confirm")}
              disabled={!clientName || !clientEmail}
              className="w-full gradient-button text-primary-foreground"
              size="sm"
            >
              Review Booking <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step: Confirm */}
      {step === "confirm" && (
        <div>
          <button onClick={() => setStep("details")} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3">
            <ArrowLeft className="w-3 h-3" /> Back
          </button>
          <h3 className="font-semibold text-foreground text-sm mb-3">Confirm Booking</h3>
          <div className="bg-muted/50 rounded-xl p-3 space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service</span>
              <span className="font-medium text-foreground">{selectedService?.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium text-foreground">{selectedDate?.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time</span>
              <span className="font-medium text-foreground">{selectedTime && formatTime(selectedTime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-medium text-foreground">{selectedService?.duration} min</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="font-semibold text-foreground">Total</span>
              <span className="font-bold text-foreground">
                {selectedService && selectedService.price > 0 ? `$${selectedService.price.toFixed(2)}` : "Free"}
              </span>
            </div>
          </div>
          {bookingError && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3 mb-2">{bookingError}</div>
          )}
          <Button onClick={handleBook} disabled={submitting} className="w-full gradient-button text-primary-foreground" size="sm">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Booking"}
          </Button>
        </div>
      )}
    </div>
  );
};
