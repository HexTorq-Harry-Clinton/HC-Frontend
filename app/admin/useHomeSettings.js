"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, unwrap, revalidateSite } from "@/lib/api";

// Shared singleton-settings driver for Home Screen Content pages.
// Loads the first /Settings row, exposes patch + save (PUT by setting_id).
// Returns { settings, settingId, loading, saving, msg, setMsg, patch, save }.
export default function useHomeSettings() {
  const [settings, setSettings] = useState({});
  const [settingId, setSettingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let live = true;
    apiFetch("/Settings")
      .then(unwrap)
      .then((list) => {
        if (!live) return;
        const row = (Array.isArray(list) ? list : [])[0] || {};
        if (row.setting_id) setSettingId(row.setting_id);
        setSettings(row);
      })
      .catch(() => {
        if (live) setMsg("Could not load settings.");
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);

  const patch = useCallback((fields) => {
    setSettings((s) => ({ ...s, ...fields }));
  }, []);

  const save = useCallback(
    async (fields, okMsg) => {
      if (!settingId) {
        setMsg("No settings row found — create one in Settings first.");
        return false;
      }
      setSaving(true);
      try {
        await apiFetch("/Settings", {
          method: "PUT",
          body: { setting_id: settingId, ...fields, luu: "ADMIN_PORTAL" },
        });
        setMsg(okMsg || "Saved.");
        revalidateSite();
        return true;
      } catch (err) {
        setMsg(err.message || "Save failed.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [settingId]
  );

  return { settings, settingId, loading, saving, msg, setMsg, patch, save };
}
