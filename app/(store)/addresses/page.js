"use client";

import { useEffect, useState } from "react";
import { apiFetch, unwrap } from "@/lib/api";

const emptyAddress = {
  full_name: "",
  mobile_number: "",
  emailid: "",
  house_street: "",
  city: "",
  state: "",
  pincode: "",
  landmark: "",
  isdefault: false,
};

// Addresses: same structure/texts/flows as the previous UI —
// add/edit form + cards with Edit/Delete, default badge, confirms.
export default function AddressesPage() {
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState(emptyAddress);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", isError: false });

  const load = async (uid) => {
    try {
      const all = unwrap(await apiFetch("/Addresses"));
      setAddresses((Array.isArray(all) ? all : []).filter((a) => a.user_id === uid));
    } catch {
      setMessage({ text: "Failed to load addresses", isError: true });
    } finally {
      setLoading(false);
    }
  };

  // Mount hydration reads client-only localStorage after paint — intentional.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    let uid = null;
    try {
      const parsed = JSON.parse(localStorage.getItem("hc_user") || "null");
      uid = parsed?.user_id || parsed?.id || null;
    } catch {
      uid = null;
    }
    if (uid) load(uid);
    else setLoading(false);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const currentUid = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem("hc_user") || "null");
      return parsed?.user_id || parsed?.id || null;
    } catch {
      return null;
    }
  };

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const resetForm = () => {
    setForm(emptyAddress);
    setEditingId(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", isError: false });
    try {
      const uid = currentUid();
      if (editingId) {
        await apiFetch("/Addresses", {
          method: "PUT",
          body: { address_id: editingId, ...form, user_id: uid, isdefault: form.isdefault ? 1 : 0, luu: "website" },
        });
        setMessage({ text: "Address updated", isError: false });
      } else {
        await apiFetch("/Addresses", {
          method: "POST",
          body: { ...form, user_id: uid, isdefault: form.isdefault ? 1 : 0, rcu: "website" },
        });
        setMessage({ text: "Address added", isError: false });
      }
      resetForm();
      if (uid) await load(uid);
    } catch {
      setMessage({ text: "Failed to save address", isError: true });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (a) => {
    setForm({
      full_name: a.full_name || "",
      mobile_number: a.mobile_number || "",
      emailid: a.emailid || "",
      house_street: a.house_street || "",
      city: a.city || "",
      state: a.state || "",
      pincode: a.pincode || "",
      landmark: a.landmark || "",
      isdefault: a.isdefault === 1 || a.isdefault === true,
    });
    setEditingId(a.address_id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      await apiFetch("/Addresses", { method: "DELETE", body: { address_id: id, luu: "website" } });
      const uid = currentUid();
      if (uid) await load(uid);
    } catch {
      setMessage({ text: "Failed to delete address", isError: true });
    }
  };

  const inputCls = "w-full border border-neutral-300 px-3 py-2 text-sm focus:border-gold focus:outline-none";

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading addresses...</span>
        </div>
        <SpinnerStyle />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h2 className="mb-4 font-display text-4xl font-bold">My Addresses</h2>
      {message.text && (
        <div className={`mb-4 p-3 text-sm ${message.isError ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {message.text}
        </div>
      )}
      <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
        <div className="h-fit border border-neutral-200 bg-white p-5 shadow-sm">
          <h5 className="font-semibold">{editingId ? "Edit Address" : "Add Address"}</h5>
          <form onSubmit={submit} className="mt-4 space-y-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Full Name</span>
              <input type="text" value={form.full_name} onChange={set("full_name")} required className={inputCls} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Mobile</span>
                <input type="tel" value={form.mobile_number} onChange={set("mobile_number")} required className={inputCls} />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Email</span>
                <input type="email" value={form.emailid} onChange={set("emailid")} className={inputCls} />
              </label>
            </div>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">House / Street</span>
              <input type="text" value={form.house_street} onChange={set("house_street")} required className={inputCls} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">City</span>
                <input type="text" value={form.city} onChange={set("city")} required className={inputCls} />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">State</span>
                <input type="text" value={form.state} onChange={set("state")} required className={inputCls} />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Pincode</span>
                <input type="text" value={form.pincode} onChange={set("pincode")} required className={inputCls} />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Landmark</span>
                <input type="text" value={form.landmark} onChange={set("landmark")} className={inputCls} />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isdefault} onChange={set("isdefault")} />
              Set as default address
            </label>
            <div className="flex gap-2">
              <button disabled={saving} className="bg-neutral-950 px-6 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {saving ? "Saving..." : editingId ? "Update Address" : "Add Address"}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="border border-neutral-400 px-4 py-2 text-sm">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
        <div>
          {addresses.length === 0 ? (
            <p className="text-neutral-500">No saved addresses.</p>
          ) : (
            <div className="space-y-4">
              {addresses.map((a) => (
                <div key={a.address_id} className="border border-neutral-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h5 className="font-semibold">
                        {a.full_name}
                        {(a.isdefault === 1 || a.isdefault === true) && (
                          <span className="ml-2 bg-neutral-200 px-2 py-0.5 text-xs font-semibold">Default</span>
                        )}
                      </h5>
                      <p className="mt-1 text-sm">{a.house_street}</p>
                      <p className="text-sm">{a.city}, {a.state} {a.pincode}</p>
                      <p className="text-sm">{a.mobile_number}</p>
                      {a.emailid && <p className="text-sm">{a.emailid}</p>}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button onClick={() => handleEdit(a)} className="border border-neutral-900 px-3 py-1 text-xs font-semibold">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(a.address_id)} className="border border-red-600 px-3 py-1 text-xs font-semibold text-red-600">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
