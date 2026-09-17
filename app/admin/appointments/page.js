"use client";

import { Fragment, useEffect, useState } from "react";
import { apiFetch, unwrap, revalidateSite } from "@/lib/api";
import { useConfirm } from "../ConfirmProvider";

// Appointments manager: same as the previous UI —
// customer/date/time/status table, expandable detail,
// status update with save, cancel with confirm.
const STATUSES = ["Pending", "Approved", "Completed", "Cancelled"];

export default function AdminAppointmentsManager() {
  const confirm = useConfirm();
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [dates, setDates] = useState([]);
  const [times, setTimes] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [edits, setEdits] = useState({});
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      const [appts, userList, dateList, timeList] = await Promise.all([
        apiFetch("/Custom-Appointments").then(unwrap),
        apiFetch("/Users").then(unwrap).catch(() => []),
        apiFetch("/Appointment-Date-Slots").then(unwrap).catch(() => []),
        apiFetch("/Appointment-Time-Slots").then(unwrap).catch(() => []),
      ]);
      const list = (Array.isArray(appts) ? appts : []).sort(
        (a, b) => new Date(b.requested_at || b.created_at || 0) - new Date(a.requested_at || a.created_at || 0)
      );
      setRows(list);
      setUsers(Array.isArray(userList) ? userList : []);
      setDates(Array.isArray(dateList) ? dateList : []);
      setTimes(Array.isArray(timeList) ? timeList : []);
    } catch {
      setRows([]);
    }
  };

  // Mount fetch (also reused after mutations) — intentional.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    load();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const userName = (id) => {
    const u = users.find((x) => x.user_id === id);
    return u ? u.full_name || u.email || id : id || "—";
  };
  const dateLabel = (id) => dates.find((d) => d.appointment_date_slot_id === id)?.slot_date || "—";
  const timeLabel = (id) => {
    const t = times.find((x) => x.appointment_time_slot_id === id);
    return t ? `${t.slot_start_time || ""} - ${t.slot_end_time || ""}` : "—";
  };
  const badge = (s) => {
    const v = (s || "").toLowerCase();
    if (v === "approved") return "bg-green-700 text-white";
    if (v === "cancelled") return "bg-red-700 text-white";
    if (v === "completed") return "bg-neutral-950 text-white";
    return "bg-yellow-200 text-yellow-900";
  };

  const saveStatus = async (r) => {
    const next = edits[r.appointment_id] || r.appointment_status;
    await apiFetch("/Custom-Appointments", {
      method: "PUT",
      body: {
        appointment_id: r.appointment_id,
        appointment_status: (next || "").toLowerCase(),
        approved_at: (next || "").toLowerCase() === "approved" ? new Date().toISOString() : null,
        luu: "ADMIN_PORTAL",
      },
    }).catch(() => null);
    setMsg("Status updated.");
    revalidateSite();
    load();
  };

  const cancel = async (r) => {
    const ok = await confirm({
      title: "Cancel this appointment?",
      message: `The appointment for ${userName(r.user_id)} will be cancelled.`,
      confirmLabel: "Cancel Appointment",
      danger: true,
    });
    if (!ok) return;
    await apiFetch("/Custom-Appointments", {
      method: "DELETE",
      body: { appointment_id: r.appointment_id, luu: "ADMIN_PORTAL" },
    }).catch(() => null);
    setMsg("Appointment cancelled.");
    revalidateSite();
    load();
  };

  return (
    <div>
      <div>
        <p className="eyebrow text-gold-deep">Harry Clinton</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-neutral-900">Appointments</h1>
      </div>
      <p className="mt-1 text-xs text-neutral-500">{rows.length} record(s)</p>
      {msg && (
        <p className="mt-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm shadow-sm text-neutral-700">
          {msg}
        </p>
      )}
      <div className="mt-4 overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-[#17161a] text-[11px] font-bold uppercase tracking-wider text-white">
              <th className="px-4 py-3">Customer</th><th className="px-4 py-3">Name</th><th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Time</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-5 text-center text-neutral-500">No records found.</td>
              </tr>
            ) : (
            rows.map((r) => {
              const open = expanded === r.appointment_id;
              return (
                <Fragment key={r.appointment_id}>
                  <tr key={r.appointment_id} className="cursor-pointer border-b transition-colors last:border-0 hover:bg-[#faf8f4]" onClick={() => setExpanded(open ? null : r.appointment_id)}>
                    <td className="px-4 py-3">{userName(r.user_id)}</td>
                    <td className="px-4 py-3">{r.name}</td>
                    <td className="px-4 py-3">{dateLabel(r.appointment_date_slot_id)}</td>
                    <td className="px-4 py-3">{timeLabel(r.appointment_time_slot_id)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge(r.appointment_status)}`}>
                        {r.appointment_status || "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <button type="button" onClick={() => cancel(r)} className="text-red-600 underline underline-offset-2 transition-colors hover:text-red-700">Cancel</button>
                    </td>
                  </tr>
                  {open && (
                    <tr key={`${r.appointment_id}-detail`} className="border-b bg-neutral-50">
                      <td colSpan={6} className="p-4 text-sm">
                        <p><strong>City:</strong> {r.city || "—"}</p>
                        <p><strong>Occasion:</strong> {r.occasion || "—"}</p>
                        <p><strong>Preferred Delivery:</strong> {r.preferred_delivery_date || "—"}</p>
                        <p><strong>Notes:</strong> {r.appointment_notes || "—"}</p>
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-xs font-semibold uppercase">Update Status</span>
                          <select
                            value={edits[r.appointment_id] || r.appointment_status || "Pending"}
                            onChange={(e) => setEdits((m) => ({ ...m, [r.appointment_id]: e.target.value }))}
                            className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900 shadow-sm transition-shadow focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => saveStatus(r)}
                            className="inline-flex items-center justify-center rounded-md bg-neutral-950 px-3 py-1 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-gold hover:text-neutral-950 focus:outline-none focus:ring-2 focus:ring-gold/40"
                          >
                            Save
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            }))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
