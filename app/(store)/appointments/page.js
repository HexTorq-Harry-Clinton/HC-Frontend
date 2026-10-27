"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, unwrap, currentUserId } from "@/lib/api";
import "./appointments-page.css";

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
        const mine = uid ? all.filter((a) => String(a.user_id) === String(uid)) : all;
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
        method: "PUT",
        body: { appointment_id: a.appointment_id || a.custom_appointment_id, appointment_status: "cancelled", cancelled_at: new Date().toISOString(), luu: "website" },
      });
      setItems((prev) => prev.map((x) => (x.appointment_id || x.custom_appointment_id) === (a.appointment_id || a.custom_appointment_id) ? { ...x, appointment_status: "cancelled" } : x));
    } catch {
      setError("Failed to cancel appointment");
    }
  };

  if (loading) {
    return (
      <div className="appointments-page appointments-page--state">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading appointments...</span>
        </div>
        <SpinnerStyle />
      </div>
    );
  }

  if (error) {
    return (
      <div className="appointments-page appointments-page--state">
        <div className="bg-red-50 p-3 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="appointments-page appointments-page--state">
        <p className="appointments-page__eyebrow">HC Atelier</p>
        <h2>No appointments yet</h2>
        <p className="appointments-page__muted">Book a custom appointment to see it here.</p>
        <Link href="/book-appointment" className="appointments-page__button">
          Book Appointment
        </Link>
      </div>
    );
  }

  return (
    <main className="appointments-page">
      <div className="appointments-page__heading">
        <p className="appointments-page__eyebrow">HC Atelier</p>
        <h1>My Appointments</h1>
      </div>
      <div className="appointments-page__grid">
        {items.map((a) => {
          const status = a.appointment_status || "Pending";
          const approved = status.toLowerCase() === "approved";
          return (
            <article key={a.appointment_id || a.custom_appointment_id} className="appointment-card">
              <div className="appointment-card__heading">
                <h2>{a.name || "Appointment"}</h2>
                <span className={`appointment-card__status ${approved ? "is-approved" : ""}`}>
                  {status}
                </span>
              </div>
              <div className="appointment-card__details">
                <p><strong>Date:</strong> {a.slot_date || "N/A"}</p>
                <p><strong>Time:</strong> {a.slot_start_time && a.slot_end_time ? `${a.slot_start_time} - ${a.slot_end_time}` : "N/A"}</p>
                <p><strong>City:</strong> {a.city || "N/A"}</p>
                <p><strong>Occasion:</strong> {a.occasion || "N/A"}</p>
                <p><strong>Preferred Delivery:</strong> {a.preferred_delivery_date || "N/A"}</p>
              </div>
              {a.appointment_notes && (
                <p className="appointment-card__notes"><strong>Notes:</strong> {a.appointment_notes}</p>
              )}
              <button
                onClick={() => handleCancel(a)}
                className="appointment-card__cancel"
              >
                Cancel Appointment
              </button>
            </article>
          );
        })}
      </div>
      <SpinnerStyle />
    </main>
  );
}

function SpinnerStyle() {
  return (
    <style jsx>{`
      .spinner-border { width: 2rem; height: 2rem; border: 0.25em solid #ddd; border-top-color: #111; border-radius:0; animation: sd-spin 0.75s linear infinite; display: inline-block; }
      @keyframes sd-spin { to { transform: rotate(360deg); } }
      .visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
    `}</style>
  );
}
