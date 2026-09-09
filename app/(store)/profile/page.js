"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, unwrap } from "@/lib/api";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    apiFetch("/Profiles").then(unwrap).then((list) => {
      const arr = Array.isArray(list) ? list : [list];
      setProfile(arr[0] || null);
    }).catch(() => setProfile(null));
  }, []);

  const logout = () => {
    localStorage.removeItem("hc_token");
    localStorage.removeItem("hc_user");
    localStorage.removeItem("hc_role");
    router.push("/login");
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold">Profile</h1>
      {profile ? (
        <div className="mt-6 border border-neutral-200 p-6 text-sm">
          <p><span className="text-neutral-500">Name:</span> {profile.full_name || profile.first_name}</p>
          <p className="mt-2"><span className="text-neutral-500">Email:</span> {profile.email_id || profile.email}</p>
          <p className="mt-2"><span className="text-neutral-500">Phone:</span> {profile.phone_number || profile.phone || "—"}</p>
        </div>
      ) : (
        <p className="mt-6 text-sm text-neutral-500">No profile details saved yet.</p>
      )}
      <button onClick={logout} className="mt-6 border border-neutral-900 px-6 py-2 text-sm font-semibold">
        Log Out
      </button>
    </div>
  );
}
