"use client";

import { useEffect, useState } from "react";
import { apiFetch, unwrap } from "@/lib/api";
import EmptyState from "@/components/EmptyState";

export default function AddressesPage() {
  const [addresses, setAddresses] = useState([]);

  useEffect(() => {
    apiFetch("/Addresses").then(unwrap).then((list) => {
      setAddresses(Array.isArray(list) ? list : []);
    }).catch(() => setAddresses([]));
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold">Addresses</h1>
      {addresses.length === 0 ? (
        <EmptyState compact text="No saved addresses. Add one at checkout." />
      ) : (
        <ul className="mt-6 space-y-4">
          {addresses.map((a) => (
            <li key={a.address_id} className="border border-neutral-200 p-4 text-sm">
              <p className="font-medium">{a.full_name || a.address_type}</p>
              <p className="mt-1 text-neutral-600">{a.address_line1} {a.address_line2}</p>
              <p className="text-neutral-600">{a.city} {a.pincode}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
