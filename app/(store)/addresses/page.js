"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, unwrap, currentUserId } from "@/lib/api";
import "../account-pages.css";

const emptyAddress = {
  address_label: "Home",
  house_no_floor: "",
  building_block: "",
  street_area: "",
  area_name: "",
  full_name: "",
  mobile_number: "",
  alt_phone: "",
  emailid: "",
  city: "",
  state: "",
  pincode: "",
  house_street: "",
  landmark: "",
  isdefault: false,
};

// Addresses: same structure/texts/flows as the previous UI —
// add/edit form + cards with Edit/Delete, default badge, confirms.
export default function AddressesPage() {
  const router = useRouter();
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
    const uid = currentUserId();
    if (uid) load(uid);
    else router.replace("/login");
  }, [router]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const currentUid = () => currentUserId();

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
      const streetArea = form.street_area.trim();
      const landmarkBase = form.landmark.trim();
      const altPhone = form.alt_phone.trim();
      const payload = {
        ...form,
        // New frontend fields fold into legacy backend columns (no schema change).
        area_name: streetArea,
        landmark: altPhone ? `${landmarkBase} | Alternate phone: ${altPhone}` : landmarkBase,
        // Keep legacy columns populated for older order/admin records.
        house_street: `${form.house_no_floor}, ${form.building_block}, ${streetArea}`.trim(),
        emailid: form.emailid.trim(),
        user_id: uid,
        isdefault: form.isdefault ? 1 : 0,
      };
      delete payload.street_area;
      delete payload.alt_phone;
      if (editingId) {
        await apiFetch("/Addresses", {
          method: "PUT", body: { address_id: editingId, ...payload, luu: "website" },
        });
        setMessage({ text: "Address updated", isError: false });
      } else {
        await apiFetch("/Addresses", {
          method: "POST",
          body: { ...payload, rcu: "website" },
        });
        setMessage({ text: "Address added", isError: false });
      }
      resetForm();
      if (uid) await load(uid);
    } catch (error) {
      setMessage({ text: error.message || "Failed to save address", isError: true });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (a) => {
    const [savedLandmark, savedAlt] = String(a.landmark || "").split(" | Alternate phone: ");
    setForm({
      address_label: a.address_label || "Home",
      house_no_floor: a.house_no_floor || a.house_street || "",
      building_block: a.building_block || "",
      street_area: a.area_name || "",
      area_name: a.area_name || "",
      full_name: a.full_name || "",
      mobile_number: a.mobile_number || "",
      alt_phone: (savedAlt || "").trim(),
      emailid: a.emailid || a.email_id || a.email || "",
      house_street: a.house_street || "",
      city: a.city || "",
      state: a.state || "",
      pincode: a.pincode || "",
      landmark: (savedLandmark || "").trim(),
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
    <div className="account-page addresses-page">
      <h2>My Addresses</h2>
      {message.text && (
        <div className={`account-alert ${message.isError ? "account-alert-error" : "account-alert-success"}`}>
          {message.text}
        </div>
      )}
      <div className="account-grid">
        <div className="account-card account-card-body">
          <h5>{editingId ? "Edit Address" : "Add Address"}</h5>
          <form onSubmit={submit} className="account-form">
            <fieldset className="mb-4">
              <legend className="mb-2 text-sm font-semibold text-neutral-900">Address details</legend>
              <div className="mb-3 flex flex-wrap gap-2">
                {["Home", "Work", "Other"].map((label) => (
                  <label key={label} className={`cursor-pointer rounded-full border px-4 py-2 text-xs font-semibold transition ${form.address_label === label ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-300 text-neutral-600 hover:border-neutral-950"}`}>
                    <input type="radio" name="address_label" value={label} checked={form.address_label === label} onChange={set("address_label")} className="sr-only" />
                    {label}
                  </label>
                ))}
              </div>
              <label className="field">
                <span>House no. &amp; floor</span>
                <input type="text" value={form.house_no_floor} onChange={set("house_no_floor")} required className={inputCls} placeholder="Flat / house number, floor" />
              </label>
              <label className="field">
                <span>Building &amp; block no.</span>
                <input type="text" value={form.building_block} onChange={set("building_block")} required className={inputCls} placeholder="Building name, block or tower" />
              </label>
              <label className="field">
                <span>Street and area name</span>
                <input type="text" value={form.street_area} onChange={set("street_area")} required className={inputCls} placeholder="Street and area name" />
              </label>
              <label className="field">
                <span>Landmark</span>
                <input type="text" value={form.landmark} onChange={set("landmark")} required className={inputCls} placeholder="Nearby landmark and locality" />
              </label>
            </fieldset>
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-neutral-900">Receiver details</legend>
              <label className="field">
                <span>Name</span>
                <input type="text" value={form.full_name} onChange={set("full_name")} required className={inputCls} />
              </label>
              <div className="two-column">
                <label className="field">
                  <span>Phone number</span>
                  <input type="tel" value={form.mobile_number} onChange={set("mobile_number")} required className={inputCls} />
                </label>
                <label className="field">
                  <span>Email</span>
                  <input type="email" value={form.emailid} onChange={set("emailid")} required className={inputCls} />
                </label>
              </div>
            </fieldset>
            <div className="two-column">
              <label className="field">
                <span>City</span>
                <input type="text" value={form.city} onChange={set("city")} required className={inputCls} />
              </label>
              <label className="field">
                <span>State</span>
                <input type="text" value={form.state} onChange={set("state")} required className={inputCls} />
              </label>
            </div>
            <div className="two-column">
              <label className="field">
                <span>Pincode</span>
                <input type="text" value={form.pincode} onChange={set("pincode")} required className={inputCls} />
              </label>
              <label className="field">
                <span>Alternate phone number</span>
                <input type="tel" value={form.alt_phone} onChange={set("alt_phone")} className={inputCls} placeholder="Alternate phone number (optional)" />
              </label>
            </div>
            <div className="form-check mb-3">
              <input className="form-check-input" type="checkbox" checked={form.isdefault} onChange={set("isdefault")} id="defaultAddress" />
              <label className="form-check-label" htmlFor="defaultAddress">Set as default address</label>
            </div>
            <div className="account-list-actions">
              <button className="btn btn-dark" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update Address" : "Add Address"}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="btn btn-outline-secondary">
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
                <div key={a.address_id} className="account-list-card">
                  <div className="account-list-head">
                    <div>
                      <h5>
                        {a.full_name}
                        {(a.isdefault === 1 || a.isdefault === true) && (
                          <span className="default-badge">Default</span>
                        )}
                      </h5>
              <p className="font-semibold">{a.address_label || "Address"}</p>
              <p>{a.house_no_floor || a.house_street}</p>
              {a.building_block && <p>{a.building_block}</p>}
              {a.area_name && <p>{a.area_name}</p>}
              {a.landmark && a.landmark !== a.area_name && <p>{a.landmark}</p>}
              <p>{a.city}, {a.state} {a.pincode}</p>
                      <p>{a.mobile_number}</p>
                      {a.emailid && <p>{a.emailid}</p>}
                    </div>
                    <div className="account-list-actions">
                      <button onClick={() => handleEdit(a)} className="btn btn-sm btn-outline-dark">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(a.address_id)} className="btn btn-sm btn-outline-danger">
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
      .spinner-border { width: 2rem; height: 2rem; border: 0.25em solid #ddd; border-top-color: #111; border-radius:0; animation: sd-spin 0.75s linear infinite; display: inline-block; }
      @keyframes sd-spin { to { transform: rotate(360deg); } }
      .visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
    `}</style>
  );
}
