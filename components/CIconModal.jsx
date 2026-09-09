"use client";

import { useEffect, useState } from "react";
import { apiFetch, unwrap } from "@/lib/api";

const initialFormData = {
  name: "",
  city: "",
  deliveryDate: "",
  occasion: "",
  dateSlotId: "",
  timeSlotId: "",
};

// Appointment modal: exact structure/texts/flow of the previous UI.
export default function CIconModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState(initialFormData);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [dateSlots, setDateSlots] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isSubmitting, onClose]);

  useEffect(() => {
    if (!isOpen) return;
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
        setDateSlots(dates.filter((d) => d.isavailable !== false && d.isactive !== false));
        setTimeSlots(times.filter((t) => t.isavailable !== false && t.isactive !== false));
      } catch (err) {
        if (live) setError(err.message || "Failed to load appointment slots.");
      }
    };
    fetchSlots();
    return () => {
      live = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!showSuccess) return undefined;
    const timer = window.setTimeout(() => setShowSuccess(false), 5000);
    return () => window.clearTimeout(timer);
  }, [showSuccess]);

  const handleChange = (e) => {
    setFormData((currentData) => ({
      ...currentData,
      [e.target.name]: e.target.value,
    }));
  };

  const handleClose = () => {
    setError("");
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      let user = null;
      try {
        user = JSON.parse(localStorage.getItem("hc_user") || "null");
      } catch {
        user = null;
      }
      await apiFetch("/Custom-Appointments", {
        method: "POST",
        body: {
          user_id: user?.user_id || user?.id || null,
          appointment_date_slot_id: formData.dateSlotId || null,
          appointment_time_slot_id: formData.timeSlotId || null,
          name: formData.name,
          city: formData.city,
          preferred_delivery_date: formData.deliveryDate,
          occasion: formData.occasion,
          appointment_status: "Pending",
          appointment_notes: `Requested date slot ${formData.dateSlotId}, time slot ${formData.timeSlotId}`,
          rcu: "customer",
        },
      });
      setFormData(initialFormData);
      handleClose();
      setShowSuccess(true);
    } catch (err) {
      setError(err.message || "Unable to send your details. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls = "w-full border border-neutral-300 px-3 py-2 text-sm focus:border-gold focus:outline-none";

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4"
          role="presentation"
          onMouseDown={() => !isSubmitting && handleClose()}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto bg-white"
            role="dialog"
            aria-modal="true"
            aria-labelledby="appointment-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-neutral-200 p-5">
              <div>
                <span className="eyebrow text-gold">Harry Clinton</span>
                <h5 className="mt-1 font-display text-2xl font-bold" id="appointment-modal-title">
                  Your Custom Design Appointment
                </h5>
                <p className="mt-1 text-sm text-neutral-500">
                  Share your occasion and preferred schedule with our design team.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={handleClose}
                disabled={isSubmitting}
                className="ml-4 text-2xl leading-none text-neutral-500 hover:text-black"
              >
                ×
              </button>
            </div>
            <div className="p-5">
              {error && (
                <div className="mb-4 bg-red-50 p-3 text-sm text-red-700" role="alert">
                  {error}
                </div>
              )}
              <form id="appointmentForm" onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="name" className="mb-1 block text-xs font-semibold uppercase tracking-widest text-neutral-500">
                    Name
                  </label>
                  <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Your full name" required className={inputCls} />
                </div>
                <div className="mb-3">
                  <label htmlFor="city" className="mb-1 block text-xs font-semibold uppercase tracking-widest text-neutral-500">
                    City
                  </label>
                  <input type="text" id="city" name="city" value={formData.city} onChange={handleChange} placeholder="Your city" required className={inputCls} />
                </div>
                <div className="mb-3">
                  <label htmlFor="deliveryDate" className="mb-1 block text-xs font-semibold uppercase tracking-widest text-neutral-500">
                    Preferred Delivery Date
                  </label>
                  <input type="date" id="deliveryDate" name="deliveryDate" value={formData.deliveryDate} onChange={handleChange} required className={inputCls} />
                </div>
                <div className="mb-3">
                  <label htmlFor="occasion" className="mb-1 block text-xs font-semibold uppercase tracking-widest text-neutral-500">
                    Occasion
                  </label>
                  <input type="text" id="occasion" name="occasion" value={formData.occasion} onChange={handleChange} placeholder="Wedding, reception..." required className={inputCls} />
                </div>
                <div className="mb-3">
                  <label htmlFor="dateSlotId" className="mb-1 block text-xs font-semibold uppercase tracking-widest text-neutral-500">
                    Appointment Date
                  </label>
                  <select id="dateSlotId" name="dateSlotId" value={formData.dateSlotId} onChange={handleChange} required className={inputCls}>
                    <option value="">Select a date</option>
                    {dateSlots.map((slot) => (
                      <option key={slot.appointment_date_slot_id} value={slot.appointment_date_slot_id}>
                        {slot.slot_date ? new Date(slot.slot_date).toLocaleDateString("en-IN", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }) : slot.appointment_date_slot_id}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label htmlFor="timeSlotId" className="mb-1 block text-xs font-semibold uppercase tracking-widest text-neutral-500">
                    Appointment Time
                  </label>
                  <select id="timeSlotId" name="timeSlotId" value={formData.timeSlotId} onChange={handleChange} required className={inputCls}>
                    <option value="">Select a time</option>
                    {timeSlots.map((slot) => (
                      <option key={slot.appointment_time_slot_id} value={slot.appointment_time_slot_id}>
                        {slot.slot_start_time || ""} - {slot.slot_end_time || ""}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" disabled={isSubmitting} className="btn-primary w-full disabled:opacity-50">
                  {isSubmitting ? "Sending..." : "Submit"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed bottom-6 left-1/2 z-[120] flex -translate-x-1/2 items-center gap-2 bg-neutral-950 px-5 py-3 text-sm text-white shadow-lg" role="status" aria-live="polite">
          <i className="bi bi-check-circle-fill text-gold" aria-hidden="true"></i>
          <span>
            Your details have been sent to the team. Our designer will contact you soon.
          </span>
        </div>
      )}
    </>
  );
}
