"use client";

import { Fragment, useEffect, useState } from "react";
import { apiFetch, unwrap, revalidateSite } from "@/lib/api";
import ActiveToggle from "@/components/ActiveToggle";
import { useConfirm } from "../ConfirmProvider";

// Users manager: same as the previous UI —
// search, count, expand with role management, activate toggle.
export default function AdminUsersPage() {
  const confirm = useConfirm();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [assign, setAssign] = useState({});
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      const [u, r, ur] = await Promise.all([
        apiFetch("/Users").then(unwrap),
        apiFetch("/Roles").then(unwrap).catch(() => []),
        apiFetch("/User-Roles").then(unwrap).catch(() => []),
      ]);
      setUsers(Array.isArray(u) ? u : []);
      setRoles(Array.isArray(r) ? r : []);
      setUserRoles(Array.isArray(ur) ? ur : []);
    } catch {
      setUsers([]);
    }
  };

  // Mount fetch (also reused after mutations) — intentional.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    load();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const rolesOf = (uid) => {
    const ids = userRoles.filter((x) => x.user_id === uid).map((x) => x.role_id);
    return roles.filter((r) => ids.includes(r.role_id));
  };

  const needle = search.trim().toLowerCase();
  const visible = users.filter(
    (u) =>
      !needle ||
      (u.full_name || "").toLowerCase().includes(needle) ||
      (u.email || "").toLowerCase().includes(needle) ||
      (u.phone_number || "").toLowerCase().includes(needle)
  );

  const toggleActive = async (u, next) => {
    await apiFetch("/Users", {
      method: "PUT",
      body: { user_id: u.user_id, isactive: next ? 1 : 0, luu: "ADMIN_PORTAL" },
    }).catch(() => null);
    load();
    revalidateSite();
  };

  const assignRole = async (u) => {
    const roleId = assign[u.user_id];
    if (!roleId) return;
    const role = roles.find((r) => r.role_id === roleId);
    await apiFetch("/User-Roles/add", {
      method: "POST",
      body: {
        user_id: u.user_id,
        role_id: roleId,
        role_name: role?.role_name || "",
        role_code: role?.role_code || "",
        rcu: "ADMIN_PORTAL",
      },
    }).catch(() => null);
    setAssign((m) => ({ ...m, [u.user_id]: "" }));
    load();
    revalidateSite();
  };

  const removeRole = async (ur, label) => {
    const ok = await confirm({
      title: "Remove this role?",
      message: `${label || "This role"} will be unassigned.`,
      confirmLabel: "Remove",
      danger: true,
    });
    if (!ok) return;
    await apiFetch("/User-Roles/remove", {
      method: "DELETE",
      body: { user_role_id: ur.user_role_id, luu: "ADMIN_PORTAL" },
    }).catch(() => null);
    load();
    revalidateSite();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow text-gold-deep">Harry Clinton</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-neutral-900">Users</h1>
        </div>
        <span className="rounded-full bg-neutral-950 px-3 py-1 text-xs font-semibold text-white">{visible.length} users</span>
      </div>
      {msg && (
        <p className="mt-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm shadow-sm text-neutral-700">
          {msg}
        </p>
      )}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search name, email, phone..."
        className="mt-4 w-full max-w-md rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition-shadow placeholder:text-neutral-400 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
      />
      <div className="mt-4 overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-[#17161a] text-[11px] font-bold uppercase tracking-wider text-white">
              <th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Mobile</th>
              <th className="px-4 py-3">Roles</th><th className="px-4 py-3">Active</th><th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-5 text-center text-neutral-500">No records found.</td>
              </tr>
            ) : (
            visible.map((u) => {
              const open = expanded === u.user_id;
              const mine = rolesOf(u.user_id);
              const available = roles.filter((r) => !mine.some((m) => m.role_id === r.role_id));
              return (
                <Fragment key={u.user_id}>
                  <tr className="border-b transition-colors last:border-0 hover:bg-[#faf8f4]">
                    <td className="px-4 py-3 font-medium">{u.full_name}</td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">{u.phone_number}</td>
                    <td className="px-4 py-3">
                      <span className="flex flex-wrap gap-1">
                        {mine.map((r) => (
                          <span key={r.role_id} className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs">
                            {r.role_name || r.role_code}
                          </span>
                        ))}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ActiveToggle active={u.isactive} onToggle={(next) => toggleActive(u, next)} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setExpanded(open ? null : u.user_id)}
                        className="font-semibold text-neutral-700 underline underline-offset-2 transition-colors hover:text-gold-deep"
                      >
                        {open ? "Hide" : "Manage"}
                      </button>
                    </td>
                  </tr>
                  {open && (
                    <tr key={`${u.user_id}-roles`} className="border-b bg-neutral-50">
                      <td colSpan={6} className="p-4 text-sm">
                        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Role Management</p>
                        <p className="mt-1 text-xs text-neutral-500">
                          Joined: {u.rcm ? new Date(u.rcm).toLocaleDateString("en-IN") : "—"}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {mine.map((r) => {
                            const ur = userRoles.find((x) => x.user_id === u.user_id && x.role_id === r.role_id);
                            return (
                              <span key={r.role_id} className="flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-2 py-1 text-xs">
                                {r.role_name || r.role_code}
                                <button
                                  type="button"
                                  onClick={() => ur && removeRole(ur, r.role_name || r.role_code)}
                                  className="text-red-600 transition-colors hover:text-red-700"
                                  aria-label="Remove role">×</button>
                              </span>
                            );
                          })}
                        </div>
                        {available.length > 0 && (
                          <div className="mt-3 flex gap-2">
                            <select
                              value={assign[u.user_id] || ""}
                              onChange={(e) => setAssign((m) => ({ ...m, [u.user_id]: e.target.value }))}
                              className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900 shadow-sm transition-shadow focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
                            >
                              <option value="">Select role</option>
                              {available.map((r) => (
                                <option key={r.role_id} value={r.role_id}>
                                  {r.role_name || r.role_code}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => assignRole(u)}
                              className="inline-flex items-center justify-center rounded-md bg-neutral-950 px-3 py-1 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-gold hover:text-neutral-950 focus:outline-none focus:ring-2 focus:ring-gold/40"
                            >
                              Assign
                            </button>
                          </div>
                        )}
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
