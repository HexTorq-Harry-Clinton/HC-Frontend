"use client";

import { useEffect, useState } from "react";
import { apiFetch, unwrap } from "@/lib/api";

export default function AppointmentsPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    apiFetch("/Custom-Appointments").then(unwrap).then((list) => {
      setItems(Array.isArray(list) ? list : []);
    }).catch(() => setItems([]));
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold">Your Appointments</h1>
      {items.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-500">No appointments yet.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {items.map((a) => (
            <li key={a.custom_appointment_id} className="border border-neutral-200 p-4 text-sm">
              <p className="font-medium">{a.name} — {a.city}</p>
              <p className="mt-1 text-neutral-600">Status: {a.status}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
