"use client";

import { Fragment, useEffect, useState } from "react";
import { apiFetch, unwrap } from "@/lib/api";

// Users manager: same as the previous UI —
// search, count, expand with role management, activate toggle.
export default function AdminUsersPage() {
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

  const toggleActive = async (u) => {
    const next = u.isactive === 1 || u.isactive === true ? 0 : 1;
    await apiFetch("/Users", {
      method: "PUT",
      body: { user_id: u.user_id, isactive: next, luu: "ADMIN_PORTAL" },
    }).catch(() => null);
    load();
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
  };

  const removeRole = async (ur) => {
    if (!window.confirm("Remove this role?")) return;
    await apiFetch("/User-Roles/remove", {
      method: "DELETE",
      body: { user_role_id: ur.user_role_id, luu: "ADMIN_PORTAL" },
    }).catch(() => null);
    load();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Users</h1>
        <span className="bg-neutral-950 px-3 py-1 text-xs font-semibold text-white">{visible.length} users</span>
      </div>
      {msg && <p className="mt-3 bg-white p-3 text-sm shadow-sm">{msg}</p>}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search name, email, phone..."
        className="mt-4 w-full max-w-md border border-neutral-300 bg-white px-3 py-2 text-sm"
      />
      <div className="mt-4 overflow-x-auto bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-xs uppercase text-neutral-500">
              <th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Mobile</th>
              <th className="p-3">Roles</th><th className="p-3">Active</th><th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((u) => {
              const open = expanded === u.user_id;
              const mine = rolesOf(u.user_id);
              const available = roles.filter((r) => !mine.some((m) => m.role_id === r.role_id));
              return (
                <Fragment key={u.user_id}>
                  <tr className="border-b">
                    <td className="p-3 font-medium">{u.full_name}</td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3">{u.phone_number}</td>
                    <td className="p-3">
                      <span className="flex flex-wrap gap-1">
                        {mine.map((r) => (
                          <span key={r.role_id} className="bg-neutral-100 px-2 py-0.5 text-xs">
                            {r.role_name || r.role_code}
                          </span>
                        ))}
                      </span>
                    </td>
                    <td className="p-3">
                      <button onClick={() => toggleActive(u)} className="underline">
                        {(u.isactive === 1 || u.isactive === true) ? "Yes" : "No"}
                      </button>
                    </td>
                    <td className="p-3">
                      <button onClick={() => setExpanded(open ? null : u.user_id)} className="underline">
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
                              <span key={r.role_id} className="flex items-center gap-2 border border-neutral-300 bg-white px-2 py-1 text-xs">
                                {r.role_name || r.role_code}
                                <button onClick={() => ur && removeRole(ur)} className="text-red-600" aria-label="Remove role">×</button>
                              </span>
                            );
                          })}
                        </div>
                        {available.length > 0 && (
                          <div className="mt-3 flex gap-2">
                            <select
                              value={assign[u.user_id] || ""}
                              onChange={(e) => setAssign((m) => ({ ...m, [u.user_id]: e.target.value }))}
                              className="border border-neutral-300 bg-white px-2 py-1 text-sm"
                            >
                              <option value="">Select role</option>
                              {available.map((r) => (
                                <option key={r.role_id} value={r.role_id}>
                                  {r.role_name || r.role_code}
                                </option>
                              ))}
                            </select>
                            <button onClick={() => assignRole(u)} className="bg-neutral-950 px-3 py-1 text-xs font-semibold text-white">
                              Assign
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
