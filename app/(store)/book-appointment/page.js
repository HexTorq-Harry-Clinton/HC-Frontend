"use client";

import { useEffect, useState } from "react";
import { apiFetch, unwrap } from "@/lib/api";

export default function BookAppointmentPage() {
  const [dates, setDates] = useState([]);
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState({ name: "", city: "", phone: "", date_slot_id: "", time_slot_id: "", occasion: "", notes: "" });
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/Appointment-Date-Slots").then(unwrap).then((l) => setDates(Array.isArray(l) ? l : [])).catch(() => {});
    apiFetch("/Appointment-Time-Slots").then(unwrap).then((l) => setSlots(Array.isArray(l) ? l : [])).catch(() => {});
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await apiFetch("/Custom-Appointments", {
        method: "POST",
        body: { ...form, status: "requested", rcu: "website" },
      });
      setDone(true);
    } catch (err) {
      setError(err.message || "Booking failed");
    }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-display text-4xl font-bold">Request received</h1>
        <p className="mt-3 text-neutral-500">Our stylist will confirm your appointment shortly.</p>
      </div>
    );
  }

  const input = "w-full border border-neutral-300 px-4 py-3 text-sm";

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold">Book Appointment</h1>
      {error && <p className="mt-4 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <form onSubmit={submit} className="mt-6 space-y-4">
        <input value={form.name} onChange={set("name")} required placeholder="Full name" className={input} />
        <input value={form.phone} onChange={set("phone")} required placeholder="Phone" className={input} />
        <input value={form.city} onChange={set("city")} required placeholder="City" className={input} />
        <select value={form.date_slot_id} onChange={set("date_slot_id")} className={input}>
          <option value="">Preferred date</option>
          {dates.map((d) => (
            <option key={d.appointment_date_slot_id} value={d.appointment_date_slot_id}>
              {d.slot_date || d.date_label || d.appointment_date_slot_id}
            </option>
          ))}
        </select>
        <select value={form.time_slot_id} onChange={set("time_slot_id")} className={input}>
          <option value="">Preferred time</option>
          {slots.map((s) => (
            <option key={s.appointment_time_slot_id} value={s.appointment_time_slot_id}>
              {s.slot_time || s.time_label || s.appointment_time_slot_id}
            </option>
          ))}
        </select>
        <input value={form.occasion} onChange={set("occasion")} placeholder="Occasion (wedding, festive…)" className={input} />
        <textarea value={form.notes} onChange={set("notes")} placeholder="Notes" rows={3} className={input} />
        <button className="w-full bg-neutral-950 py-3 text-sm font-semibold text-white">Request Appointment</button>
      </form>
    </div>
  );
}
