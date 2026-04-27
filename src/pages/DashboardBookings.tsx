import { useState, useEffect } from "react";
import { Calendar, Clock, Plus, Trash2, Video, Phone, MapPin, Loader2, Check, X, DollarSign, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BookingService {
  id: string;
  title: string;
  description: string;
  duration: number;
  price: number;
  currency: string;
  type: string;
  is_active: boolean;
}

interface Booking {
  id: string;
  client_name: string;
  client_email: string;
  client_notes: string;
  booking_date: string;
  booking_time: string;
  duration: number;
  amount: number;
  currency: string;
  status: string;
  payment_status: string;
  created_at: string;
  service_id: string;
}

interface Availability {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TYPE_OPTIONS = [
  { value: "video", label: "Video Call", icon: Video },
  { value: "phone", label: "Phone Call", icon: Phone },
  { value: "in-person", label: "In-Person", icon: MapPin },
];

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "GBP", symbol: "\u00a3", name: "British Pound" },
  { code: "EUR", symbol: "\u20ac", name: "Euro" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "JPY", symbol: "\u00a5", name: "Japanese Yen" },
  { code: "INR", symbol: "\u20b9", name: "Indian Rupee" },
  { code: "NGN", symbol: "\u20a6", name: "Nigerian Naira" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
  { code: "GHS", symbol: "GH\u20b5", name: "Ghanaian Cedi" },
];

const getCurrencySymbol = (code: string) => CURRENCIES.find((c) => c.code === code)?.symbol || code;

const DashboardBookings = () => {
  const { toast } = useToast();
  const [tab, setTab] = useState<"bookings" | "services" | "availability">("bookings");
  const [services, setServices] = useState<BookingService[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // New service form
  const [showNewService, setShowNewService] = useState(false);
  const [newService, setNewService] = useState({ title: "", description: "", duration: 30, price: 0, type: "video", currency: "USD" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      try {
        const [svcRes, bookRes, availRes] = await Promise.all([
          supabase.from("booking_services").select("*").eq("creator_id", user.id).order("created_at"),
          supabase.from("bookings").select("*").eq("creator_id", user.id).order("booking_date", { ascending: false }),
          supabase.from("creator_availability").select("*").eq("creator_id", user.id).order("day_of_week"),
        ]);

        if (svcRes.error) {
          toast({ title: "Error", description: svcRes.error.message, variant: "destructive" });
        } else {
          setServices((svcRes.data || []) as BookingService[]);
        }

        if (bookRes.error) {
          toast({ title: "Error", description: bookRes.error.message, variant: "destructive" });
        } else {
          setBookings((bookRes.data || []) as Booking[]);
        }

        if (availRes.error) {
          toast({ title: "Error", description: availRes.error.message, variant: "destructive" });
        } else {
          setAvailability((availRes.data || []) as Availability[]);
        }
      } catch (err) {
        toast({ title: "Error", description: "Failed to load booking data", variant: "destructive" });
      }
      setLoading(false);
    };
    fetchData();
  }, [toast]);

  // Real-time subscription for new bookings
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`bookings-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bookings",
          filter: `creator_id=eq.${userId}`,
        },
        (payload) => {
          const newBooking = payload.new as Booking;
          setBookings((prev) => [newBooking, ...prev]);
          toast({
            title: "New Booking!",
            description: `${newBooking.client_name} just booked a session for ${new Date(newBooking.booking_date).toLocaleDateString()}.`,
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bookings",
          filter: `creator_id=eq.${userId}`,
        },
        (payload) => {
          const updatedBooking = payload.new as Booking;
          setBookings((prev) =>
            prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, toast]);

  const handleCreateService = async () => {
    if (!userId || !newService.title.trim()) {
      toast({ title: "Error", description: "Please enter a service title", variant: "destructive" });
      return;
    }
    setSaving(true);
    
    try {
      const { data, error } = await supabase.from("booking_services").insert({
        creator_id: userId,
        title: newService.title.trim(),
        description: newService.description.trim(),
        duration: newService.duration || 30,
        price: newService.price || 0,
        type: newService.type || "video",
        currency: newService.currency || "USD",
        is_active: true,
      }).select().single();

      if (error) {
        throw error;
      }

      setServices((prev) => [...prev, data as BookingService]);
      setNewService({ title: "", description: "", duration: 30, price: 0, type: "video", currency: "USD" });
      setShowNewService(false);
      toast({ title: "Service created", description: `"${newService.title}" is now available for booking.` });
    } catch (err: any) {
      console.error("[v0] Create service error:", err);
      toast({ 
        title: "Error", 
        description: err?.message || "Failed to create service. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    const { error } = await supabase.from("booking_services").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message || "Failed to delete service", variant: "destructive" });
      return;
    }
    setServices((prev) => prev.filter((s) => s.id !== id));
    toast({ title: "Service deleted" });
  };

  const handleToggleService = async (id: string, isActive: boolean) => {
    const { error } = await supabase.from("booking_services").update({ is_active: !isActive }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message || "Failed to update service", variant: "destructive" });
      return;
    }
    setServices((prev) => prev.map((s) => s.id === id ? { ...s, is_active: !isActive } : s));
  };

  const handleUpdateBookingStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message || "Failed to update booking", variant: "destructive" });
      return;
    }
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
    toast({ title: `Booking ${status}` });
  };

  const handleToggleAvailability = async (dayOfWeek: number) => {
    if (!userId) return;
    
    try {
      const existing = availability.find((a) => a.day_of_week === dayOfWeek);
      if (existing) {
        const { error } = await supabase.from("creator_availability").update({ is_active: !existing.is_active }).eq("id", existing.id);
        if (error) throw error;
        setAvailability((prev) => prev.map((a) => a.id === existing.id ? { ...a, is_active: !a.is_active } : a));
      } else {
        const { data, error } = await supabase.from("creator_availability").insert({
          creator_id: userId,
          day_of_week: dayOfWeek,
          start_time: "09:00",
          end_time: "17:00",
          is_active: true,
        }).select().single();
        if (error) throw error;
        if (data) setAvailability((prev) => [...prev, data as Availability]);
      }
    } catch (err: any) {
      console.error("[v0] Availability toggle error:", err);
      toast({ title: "Error", description: err?.message || "Failed to update availability", variant: "destructive" });
    }
  };

  const handleUpdateTime = async (id: string, field: "start_time" | "end_time", value: string) => {
    await supabase.from("creator_availability").update({ [field]: value }).eq("id", id);
    setAvailability((prev) => prev.map((a) => a.id === id ? { ...a, [field]: value } : a));
  };

  const formatTime12 = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${ampm}`;
  };

  const upcomingBookings = bookings.filter((b) => b.status === "confirmed" || b.status === "pending");
  const pastBookings = bookings.filter((b) => b.status === "completed" || b.status === "cancelled");

  return (
    <div className="min-h-screen bg-background liquid-glass-muted flex">
      <Sidebar />
      <MobileSidebar />
      <main className="flex-1 p-4 md:p-8 md:ml-64">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Bookings</h1>
              <p className="text-muted-foreground mt-1">Manage your booking services and schedule</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-muted rounded-xl p-1 mb-6">
            {[
              { id: "bookings" as const, label: "Bookings", icon: Calendar },
              { id: "services" as const, label: "Services", icon: DollarSign },
              { id: "availability" as const, label: "Availability", icon: Clock },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                  tab === id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Bookings Tab */}
              {tab === "bookings" && (
                <div className="space-y-6">
                  {upcomingBookings.length === 0 && pastBookings.length === 0 ? (
                    <div className="text-center py-16 bg-card rounded-2xl border border-border">
                      <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">No bookings yet</h3>
                      <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                        Create a service and set your availability. Visitors will be able to book sessions from your profile page.
                      </p>
                      <Button onClick={() => setTab("services")} className="mt-4 gradient-button text-primary-foreground" size="sm">
                        <Plus className="w-4 h-4 mr-1" /> Create a Service
                      </Button>
                    </div>
                  ) : (
                    <>
                      {upcomingBookings.length > 0 && (
                        <div>
                          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Upcoming</h2>
                          <div className="space-y-3">
                            {upcomingBookings.map((b) => (
                              <div key={b.id} className="bg-card rounded-xl border border-border p-4">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="font-semibold text-foreground">{b.client_name}</p>
                                    <p className="text-sm text-muted-foreground">{b.client_email}</p>
                                    <div className="flex items-center gap-3 mt-2">
                                      <Badge variant={b.status === "confirmed" ? "default" : "secondary"}>
                                        {b.status}
                                      </Badge>
                                      <span className="text-sm text-muted-foreground">
                                        {new Date(b.booking_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at {formatTime12(b.booking_time)}
                                      </span>
                                      <span className="text-sm text-muted-foreground">{b.duration} min</span>
                                    </div>
                                    {b.client_notes && <p className="text-sm text-muted-foreground mt-2 italic">{b.client_notes}</p>}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {b.amount > 0 && <span className="text-sm font-bold text-foreground">{getCurrencySymbol(b.currency)}{b.amount.toFixed(2)}</span>}
                                    {b.status === "pending" && (
                                      <>
                                        <Button size="sm" variant="outline" onClick={() => handleUpdateBookingStatus(b.id, "confirmed")}>
                                          <Check className="w-3 h-3" />
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => handleUpdateBookingStatus(b.id, "cancelled")} className="text-destructive">
                                          <X className="w-3 h-3" />
                                        </Button>
                                      </>
                                    )}
                                    {b.status === "confirmed" && (
                                      <Button size="sm" variant="outline" onClick={() => handleUpdateBookingStatus(b.id, "completed")}>
                                        Complete
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {pastBookings.length > 0 && (
                        <div>
                          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Past</h2>
                          <div className="space-y-3">
                            {pastBookings.map((b) => (
                              <div key={b.id} className="bg-card rounded-xl border border-border p-3 opacity-70">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-foreground text-sm">{b.client_name}</p>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(b.booking_date).toLocaleDateString()} - {b.status}
                                    </span>
                                  </div>
                                  {b.amount > 0 && <span className="text-sm font-medium">{getCurrencySymbol(b.currency)}{b.amount.toFixed(2)}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Services Tab */}
              {tab === "services" && (
                <div className="space-y-4">
                  {services.map((svc) => {
                    const TypeIcon = TYPE_OPTIONS.find((t) => t.value === svc.type)?.icon || Video;
                    return (
                      <div key={svc.id} className={`bg-card rounded-xl border border-border p-4 ${!svc.is_active ? "opacity-50" : ""}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <TypeIcon className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{svc.title}</h3>
                              {svc.description && <p className="text-sm text-muted-foreground">{svc.description}</p>}
                              <div className="flex items-center gap-3 mt-1.5">
                                <Badge variant="secondary" className="text-xs">{svc.duration} min</Badge>
                                <span className="text-sm font-bold">{svc.price > 0 ? `${getCurrencySymbol(svc.currency)}${svc.price.toFixed(2)}` : "Free"}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" onClick={() => handleToggleService(svc.id, svc.is_active)}>
                              {svc.is_active ? "Disable" : "Enable"}
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteService(svc.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {showNewService ? (
                    <div className="bg-card rounded-xl border-2 border-primary/20 p-5 space-y-4">
                      <h3 className="font-semibold text-foreground">New Booking Service</h3>
                      <Input placeholder="Service title (e.g. 30-Min Consultation)" value={newService.title} onChange={(e) => setNewService((p) => ({ ...p, title: e.target.value }))} />
                      <Textarea placeholder="Description (optional)" value={newService.description} onChange={(e) => setNewService((p) => ({ ...p, description: e.target.value }))} rows={2} />
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Duration (min)</label>
                          <Input type="number" value={newService.duration} onChange={(e) => setNewService((p) => ({ ...p, duration: parseInt(e.target.value) || 30 }))} min={15} step={15} />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Price</label>
                          <Input type="number" value={newService.price} onChange={(e) => setNewService((p) => ({ ...p, price: parseFloat(e.target.value) || 0 }))} min={0} step={5} />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Currency</label>
                          <select
                            value={newService.currency}
                            onChange={(e) => setNewService((p) => ({ ...p, currency: e.target.value }))}
                            className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
                          >
                            {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Type</label>
                          <select
                            value={newService.type}
                            onChange={(e) => setNewService((p) => ({ ...p, type: e.target.value }))}
                            className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
                          >
                            {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleCreateService} disabled={saving || !newService.title} className="gradient-button text-primary-foreground" size="sm">
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Service"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setShowNewService(false)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <Button onClick={() => setShowNewService(true)} variant="outline" className="w-full py-6 border-dashed">
                      <Plus className="w-5 h-5 mr-2" /> Add Booking Service
                    </Button>
                  )}
                </div>
              )}

              {/* Availability Tab */}
              {tab === "availability" && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground mb-4">
                    Set which days and times you are available for bookings. Visitors will only see available time slots.
                  </p>
                  {DAY_NAMES.map((dayName, idx) => {
                    const dayAvail = availability.find((a) => a.day_of_week === idx);
                    const isActive = dayAvail?.is_active ?? false;
                    return (
                      <div key={idx} className={`bg-card rounded-xl border border-border p-4 flex items-center justify-between ${!isActive ? "opacity-60" : ""}`}>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleAvailability(idx)}
                            className={`w-10 h-6 rounded-full transition-colors relative ${isActive ? "bg-primary" : "bg-muted"}`}
                          >
                            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isActive ? "left-[18px]" : "left-0.5"}`} />
                          </button>
                          <span className="font-medium text-foreground text-sm">{dayName}</span>
                        </div>
                        {isActive && dayAvail && (
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={dayAvail.start_time}
                              onChange={(e) => handleUpdateTime(dayAvail.id, "start_time", e.target.value)}
                              className="h-9 rounded-md border border-border bg-background px-2 text-sm"
                            />
                            <span className="text-muted-foreground text-sm">to</span>
                            <input
                              type="time"
                              value={dayAvail.end_time}
                              onChange={(e) => handleUpdateTime(dayAvail.id, "end_time", e.target.value)}
                              className="h-9 rounded-md border border-border bg-background px-2 text-sm"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardBookings;
