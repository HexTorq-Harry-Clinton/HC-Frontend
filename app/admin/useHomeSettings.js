"use client";

import { useCallback, useEffect, useState } from "react";
import { homeKV, upsertHomeKV } from "@/lib/api";

// Shared home-config driver for Home Screen Content pages.
// Reads/writes the generic key-value store (tbl_home_settings via
// /Home-Settings): custom rows with setting_key + setting_value, grouped.
// Same API as before: { settings, loading, saving, msg, setMsg, patch, save }.
// save(fields, okMsg) upserts each key idempotently.
export default function useHomeSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let live = true;
    homeKV()
      .then((map) => {
        if (live) setSettings(map);
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

  const save = useCallback(async (fields, okMsg, group) => {
    setSaving(true);
    try {
      await upsertHomeKV(fields, group);
      setMsg(okMsg || "Saved.");
      return true;
    } catch (err) {
      setMsg(err.message || "Save failed.");
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  return { settings, loading, saving, msg, setMsg, patch, save };
}
