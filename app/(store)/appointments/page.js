"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, unwrap, currentUserId } from "@/lib/api";

// Appointments: same structure/texts/flows as the previous UI —
// full cards with slot resolution + cancel with confirm.
export default function AppointmentsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    const fetchAll = async () => {
      try {
        const [apptsRes, datesRes, timesRes, profileRes] = await Promise.all([
          apiFetch("/Custom-Appointments").then(unwrap),
          apiFetch("/Appointment-Date-Slots").then(unwrap).catch(() => []),
          apiFetch("/Appointment-Time-Slots").then(unwrap).catch(() => []),
          apiFetch("/Profiles").then(unwrap).catch(() => []),
        ]);
        if (!live) return;
        const all = Array.isArray(apptsRes) ? apptsRes : [];
        const dates = Array.isArray(datesRes) ? datesRes : [];
        const times = Array.isArray(timesRes) ? timesRes : [];
        const profiles = Array.isArray(profileRes) ? profileRes : [];
        const uid = currentUserId();
        const mine = uid ? all.filter((a) => a.user_id === uid) : all;
        setItems(
          mine.map((a) => {
            const d = dates.find((x) => x.appointment_date_slot_id === a.appointment_date_slot_id);
            const t = times.find((x) => x.appointment_time_slot_id === a.appointment_time_slot_id);
            return {
              ...a,
              slot_date: d?.slot_date || null,
              slot_start_time: t?.slot_start_time || null,
              slot_end_time: t?.slot_end_time || null,
            };
          })
        );
        void profiles;
      } catch {
        if (live) setError("Failed to load appointments");
      } finally {
        if (live) setLoading(false);
      }
    };
    fetchAll();
    return () => {
      live = false;
    };
  }, []);

  const handleCancel = async (a) => {
    if (!window.confirm("Cancel this appointment?")) return;
    try {
      await apiFetch("/Custom-Appointments", {
        method: "DELETE",
        body: { appointment_id: a.appointment_id || a.custom_appointment_id, luu: "website" },
      });
      setItems((prev) =>
        prev.filter((x) => (x.appointment_id || x.custom_appointment_id) !== (a.appointment_id || a.custom_appointment_id))
      );
    } catch {
      setError("Failed to cancel appointment");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading appointments...</span>
        </div>
        <SpinnerStyle />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 text-center">
        <div className="bg-red-50 p-3 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-14 text-center">
        <h2 className="font-display text-4xl font-bold">No appointments yet</h2>
        <p className="mt-3 text-neutral-500">Book a custom appointment to see it here.</p>
        <Link href="/" className="mt-6 inline-block bg-neutral-950 px-8 py-3 text-sm font-semibold text-white">
          Book Appointment
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h2 className="mb-4 font-display text-4xl font-bold">My Appointments</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((a) => {
          const status = a.appointment_status || "Pending";
          const approved = status.toLowerCase() === "approved";
          return (
            <div key={a.appointment_id || a.custom_appointment_id} className="h-full border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <h5 className="font-semibold">{a.name || "Appointment"}</h5>
                <span className={`px-2 py-0.5 text-xs font-semibold text-white ${approved ? "bg-green-700" : "bg-neutral-500"}`}>
                  {status}
                </span>
              </div>
              <p className="mt-3 text-sm"><strong>Date:</strong> {a.slot_date || "N/A"}</p>
              <p className="text-sm"><strong>Time:</strong> {a.slot_start_time && a.slot_end_time ? `${a.slot_start_time} - ${a.slot_end_time}` : "N/A"}</p>
              <p className="text-sm"><strong>City:</strong> {a.city || "N/A"}</p>
              <p className="text-sm"><strong>Occasion:</strong> {a.occasion || "N/A"}</p>
              <p className="text-sm"><strong>Preferred Delivery:</strong> {a.preferred_delivery_date || "N/A"}</p>
              {a.appointment_notes && (
                <p className="text-sm"><strong>Notes:</strong> {a.appointment_notes}</p>
              )}
              <button
                onClick={() => handleCancel(a)}
                className="mt-3 border border-red-600 px-3 py-1 text-xs font-semibold text-red-600"
              >
                Cancel Appointment
              </button>
            </div>
          );
        })}
      </div>
      <SpinnerStyle />
    </div>
  );
}

function SpinnerStyle() {
  return (
    <style jsx>{`
      .spinner-border { width: 2rem; height: 2rem; border: 0.25em solid #ddd; border-top-color: #111; border-radius: 50%; animation: sd-spin 0.75s linear infinite; display: inline-block; }
      @keyframes sd-spin { to { transform: rotate(360deg); } }
      .visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
    `}</style>
  );
}
