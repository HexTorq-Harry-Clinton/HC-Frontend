"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, unwrap, currentUser, currentUserId } from "@/lib/api";

const emptyForm = {
  name: "",
  mobile_number: "",
  emailid: "",
  city: "",
  occasion: "",
  preferred_delivery_date: "",
  appointment_notes: "",
  appointment_date_slot_id: "",
  appointment_time_slot_id: "",
};

const MIN_DELIVERY_DATE = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];

// Book Appointment: same structure/texts/flow as the previous UI.
export default function BookAppointmentPage() {
  const router = useRouter();
  const [dateSlots, setDateSlots] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", isError: false });

  useEffect(() => {
    const token = localStorage.getItem("hc_token");
    const session = localStorage.getItem("hc_session");
    if (!token && !session) {
      router.push("/login");
      return;
    }
    // User prefill reads client-only localStorage after mount — intentional.
    /* eslint-disable react-hooks/set-state-in-effect */
    const user = currentUser() || {};
    setForm((prev) => ({
      ...prev,
      name: user.full_name || "",
      emailid: user.email_id || "",
      mobile_number: user.mobile_number || "",
    }));
    /* eslint-enable react-hooks/set-state-in-effect */

    let live = true;
    const fetchSlots = async () => {
      try {
        const [dateRes, timeRes] = await Promise.all([
          apiFetch("/Appointment-Date-Slots").then(unwrap),
          apiFetch("/Appointment-Time-Slots").then(unwrap),
        ]);
        if (!live) return;
        const dates = Array.isArray(dateRes) ? dateRes : [];
        const times = Array.isArray(timeRes) ? timeRes : [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        setDateSlots(
          dates.filter((d) => {
            if (!d.isactive && d.isactive !== undefined) return false;
            if (d.slot_date) return new Date(d.slot_date) >= today;
            return true;
          })
        );
        setTimeSlots(times.filter((t) => t.isactive !== false && t.isactive !== 0));
      } catch {
        if (live) setMessage({ text: "Could not load appointment slots.", isError: true });
      } finally {
        if (live) setLoading(false);
      }
    };
    fetchSlots();
    return () => {
      live = false;
    };
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Times belong to a date: changing the date resets a stale time pick.
    setForm((prev) => (name === "appointment_date_slot_id" ? { ...prev, [name]: value, appointment_time_slot_id: "" } : { ...prev, [name]: value }));
  };

  // Only times scoped to the chosen date are bookable.
  const visibleTimes = form.appointment_date_slot_id
    ? timeSlots.filter((t) => String(t.appointment_date_slot_id) === String(form.appointment_date_slot_id))
    : timeSlots;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.appointment_date_slot_id || !form.appointment_time_slot_id) {
      setMessage({ text: "Please select a date and time slot.", isError: true });
      return;
    }
    setSubmitting(true);
    setMessage({ text: "", isError: false });
    try {
      const userId = currentUserId();
      await apiFetch("/Custom-Appointments", {
        method: "POST",
        body: { ...form, user_id: userId || null, appointment_status: "Pending", rcu: "website" },
      });
      setMessage({ text: "Appointment booked successfully! We'll confirm shortly.", isError: false });
      setForm(emptyForm);
      setTimeout(() => router.push("/appointments"), 2500);
    } catch (err) {
      setMessage({ text: err.message || "Failed to book appointment. Please try again.", isError: true });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <style jsx>{`
          .spinner-border { width: 2rem; height: 2rem; border: 0.25em solid #ddd; border-top-color: #111; border-radius: 50%; animation: sd-spin 0.75s linear infinite; display: inline-block; }
          @keyframes sd-spin { to { transform: rotate(360deg); } }
          .visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
        `}</style>
      </div>
    );
  }

  const inputCls = "w-full border border-neutral-300 px-3 py-2 text-sm focus:border-gold focus:outline-none";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10" style={{ maxWidth: 700 }}>
      <h2 className="mb-2 font-display text-4xl font-bold">Book an Appointment</h2>
      <p className="mb-4 text-neutral-500">Schedule a personal styling session with our expert tailors.</p>

      {message.text && (
        <div className={`mb-4 p-3 text-sm ${message.isError ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {message.text}
        </div>
      )}

      <div className="border border-neutral-200 bg-white shadow-sm">
        <div className="p-4">
          <form onSubmit={handleSubmit}>
            <h5 className="mb-3 font-semibold">Personal Details</h5>
            <div className="mb-4 grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Full Name *</label>
                <input name="name" value={form.name} onChange={handleChange} required placeholder="Your full name" className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Mobile Number *</label>
                <input name="mobile_number" value={form.mobile_number} onChange={handleChange} required placeholder="10-digit mobile" className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <input type="email" name="emailid" value={form.emailid} onChange={handleChange} placeholder="your@email.com" className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">City *</label>
                <input name="city" value={form.city} onChange={handleChange} required placeholder="e.g. Chennai" className={inputCls} />
              </div>
            </div>

            <h5 className="mb-3 font-semibold">Appointment Details</h5>
            <div className="mb-4 grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Occasion *</label>
                <select name="occasion" value={form.occasion} onChange={handleChange} required className={inputCls}>
                  <option value="">-- Select Occasion --</option>
                  <option value="Wedding">Wedding</option>
                  <option value="Business">Business</option>
                  <option value="Party">Party / Event</option>
                  <option value="Casual">Casual Styling</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Preferred Delivery Date</label>
                <input
                  type="date"
                  name="preferred_delivery_date"
                  value={form.preferred_delivery_date}
                  onChange={handleChange}
                  min={MIN_DELIVERY_DATE}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Appointment Date *</label>
                {dateSlots.length === 0 ? (
                  <div className="bg-yellow-50 p-2 text-sm text-yellow-800">No available dates. Please check back soon.</div>
                ) : (
                  <select name="appointment_date_slot_id" value={form.appointment_date_slot_id} onChange={handleChange} required className={inputCls}>
                    <option value="">-- Select Date --</option>
                    {dateSlots.map((d) => (
                      <option key={d.appointment_date_slot_id} value={d.appointment_date_slot_id}>
                        {d.slot_date
                          ? new Date(d.slot_date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
                          : d.slot_label || d.appointment_date_slot_id}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Appointment Time *</label>
                {visibleTimes.length === 0 ? (
                  <div className="bg-yellow-50 p-2 text-sm text-yellow-800">No time slots available for this date.</div>
                ) : (
                  <select name="appointment_time_slot_id" value={form.appointment_time_slot_id} onChange={handleChange} required className={inputCls}>
                    <option value="">-- Select Time --</option>
                    {visibleTimes.map((t) => (
                      <option key={t.appointment_time_slot_id} value={t.appointment_time_slot_id}>
                        {t.slot_start_time && t.slot_end_time
                          ? `${t.slot_start_time} – ${t.slot_end_time}`
                          : t.slot_label || t.appointment_time_slot_id}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">Notes / Requests</label>
                <textarea
                  name="appointment_notes"
                  value={form.appointment_notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Any specific requirements, measurements, style preferences..."
                  className={inputCls}
                />
              </div>
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
              {submitting ? "Booking..." : "Confirm Appointment"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
