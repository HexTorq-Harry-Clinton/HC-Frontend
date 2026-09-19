"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  apiFetch, unwrap, revalidateSite, friendlyError,
  resolveUploadUrl, detectMediaType,
} from "@/lib/api";
import ActiveToggle from "@/components/ActiveToggle";
import FilePick from "../FilePick";
import UploadRing from "../UploadRing";
import useLockBody from "../useLockBody";
import useUploader from "../useUploader";
import { useToast } from "../ToastProvider";
import { useConfirm } from "../ConfirmProvider";

const panelCls = "rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm";
const tableWrapCls = "overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm";
const thCls = "px-4 py-3 whitespace-nowrap";
const tdCls = "px-4 py-3";
const inputCls =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition-shadow placeholder:text-neutral-400 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25";
const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 rounded-md bg-neutral-950 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gold hover:text-neutral-950 focus:outline-none focus:ring-2 focus:ring-gold/40 disabled:cursor-not-allowed disabled:opacity-50";
const btnOutline =
  "inline-flex items-center justify-center gap-1.5 rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition-colors hover:border-neutral-950 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900/10";
const iconBtn =
  "inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900";

// Videos: MP4 / WEBM / MOV, max 50 MB. Posters: JPG / PNG / WEBP, max 3 MB.
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const OK_VIDEO_EXT = ["mp4", "webm", "mov"];
const OK_IMAGE_EXT = ["jpg", "jpeg", "png", "webp"];

function checkVideo(file) {
  if (!file) return "Please pick a video file.";
  const ext = (file.name?.split(".").pop() || "").toLowerCase();
  if (detectMediaType(file) !== "video" || !OK_VIDEO_EXT.includes(ext))
    return "Only MP4, WEBM or MOV videos are allowed.";
  if (file.size > MAX_VIDEO_BYTES) return "Video must be 50 MB or smaller.";
  return null;
}

function checkPoster(file) {
  if (!file) return "Please pick a poster image.";
  const ext = (file.name?.split(".").pop() || "").toLowerCase();
  if (!OK_IMAGE_EXT.includes(ext)) return "Poster must be JPG, PNG or WEBP.";
  if (file.size > MAX_IMAGE_BYTES) return "Poster must be 3 MB or smaller.";
  return null;
}

// Home Video section (tbl_menu_videos): upload/replace with validation,
// autoplay-loop-mute toggles, poster with preview, activate toggle,
// drag-and-drop display_order with batch save.
export default function AdminMenuVideosPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [rows, setRows] = useState([]);
  const [refresh, setRefresh] = useState(0);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  // null | { id?, video_type, video_url, poster_image_url,
  //          autoplay, loop_video, mute_default, isactive }
  const [modal, setModal] = useState(null);
  const [stagedVideo, setStagedVideo] = useState(null);
  const [stagedPoster, setStagedPoster] = useState(null);
  // Open popup owns the scroll — page behind is frozen.
  useLockBody(!!modal || !!lightbox);
  // Uploads with live ring progress (%, MB, speed, ETA).
  const { upProg, upload } = useUploader();
  // false | array of ids in manual order — reorder mode.
  const [orderMode, setOrderMode] = useState(false);
  const [orderIds, setOrderIds] = useState([]);
  // null | { url, title } — fullscreen video viewer.
  const [lightbox, setLightbox] = useState(null);
  const dragId = useRef(null);

  useEffect(() => {
    let live = true;
    apiFetch("/Menu-Video", { params: { includeInactive: 1 } })
      .then(unwrap)
      .then((list) => {
        if (live) setRows(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (live) setRows([]);
      });
    return () => {
      live = false;
    };
  }, [refresh]);

  // Esc closes the fullscreen viewer.
  useEffect(() => {
    if (!lightbox) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setLightbox(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightbox]);

  const reload = () => {
    setRefresh((n) => n + 1);
    revalidateSite();
  };

  const live = useMemo(
    () =>
      rows
        .filter((r) => r.isdeleted !== 1 && r.isdeleted !== true)
        .sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0)),
    [rows]
  );

  const fail = (err, fallback) => {
    const m = friendlyError(err, fallback);
    setMsg(m);
    toast?.error(m);
  };

  const openCreate = () => {
    setStagedVideo(null);
    setStagedPoster(null);
    setModal({
      id: null, video_type: "brand", video_url: "", poster_image_url: "",
      autoplay: true, loop_video: true, mute_default: true, isactive: true,
    });
  };

  const openEdit = (r) => {
    setStagedVideo(null);
    setStagedPoster(null);
    setModal({
      id: r.menu_video_id,
      video_type: r.video_type || "brand",
      video_url: r.video_url || "",
      poster_image_url: r.poster_image_url || "",
      autoplay: r.autoplay === 0 || r.autoplay === false ? false : true,
      loop_video: r.loop_video === 0 || r.loop_video === false ? false : true,
      mute_default: r.mute_default === 0 || r.mute_default === false ? false : true,
      isactive: r.isactive === 1 || r.isactive === true,
    });
  };

  const stageVideo = (file) => {
    if (!file) return;
    const err = checkVideo(file);
    if (err) {
      setMsg(err);
      toast?.error(err);
      return;
    }
    setStagedVideo(file);
    setMsg(`Staged video: ${file.name} — click ${modal?.id ? "Update" : "Create"} to upload & save.`);
  };

  const stagePoster = (file) => {
    if (!file) return;
    const err = checkPoster(file);
    if (err) {
      setMsg(err);
      toast?.error(err);
      return;
    }
    setStagedPoster(file);
    setMsg(`Staged poster: ${file.name} — click ${modal?.id ? "Update" : "Create"} to upload & save.`);
  };

  const save = async (e) => {
    e?.preventDefault();
    if (!modal) return;
    setBusy(true);
    try {
      // Upload staged files FIRST — the row is never saved without them.
      let videoUrl = modal.video_url;
      let posterUrl = modal.poster_image_url;
      if (stagedVideo) {
        setMsg("Uploading video...");
        videoUrl = await upload(stagedVideo);
      }
      if (stagedPoster) {
        setMsg("Uploading poster...");
        posterUrl = await upload(stagedPoster);
      }
      if (!videoUrl) {
        setMsg("Please pick a video file.");
        setBusy(false);
        return;
      }
      const body = {
        video_type: (modal.video_type || "brand").trim(),
        video_url: videoUrl,
        poster_image_url: posterUrl || "",
        autoplay: modal.autoplay ? 1 : 0,
        loop_video: modal.loop_video ? 1 : 0,
        mute_default: modal.mute_default ? 1 : 0,
        isactive: modal.isactive ? 1 : 0,
        luu: "ADMIN_PORTAL",
      };
      if (modal.id) {
        await apiFetch("/Menu-Video", {
          method: "PUT",
          body: { menu_video_id: modal.id, ...body },
        });
        setMsg("Video updated.");
        toast?.success("Home video updated.");
      } else {
        const maxOrder = live.reduce((m, r) => Math.max(m, Number(r.display_order) || 0), 0);
        await apiFetch("/Menu-Video", {
          method: "POST",
          body: { ...body, display_order: maxOrder + 1, rcu: "ADMIN_PORTAL" },
        });
        setMsg("Video created.");
        toast?.success("Home video created.");
      }
      setModal(null);
      setStagedVideo(null);
      setStagedPoster(null);
      reload();
    } catch (err) {
      fail(err, "Could not save video.");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (r, next) => {
    await apiFetch("/Menu-Video", {
      method: "PUT",
      body: { menu_video_id: r.menu_video_id, isactive: next ? 1 : 0, luu: "ADMIN_PORTAL" },
    }).catch(() => null);
    toast?.success(next ? "Video section on." : "Video section off.");
    reload();
  };

  const remove = async (r) => {
    const ok = await confirm({
      title: "Delete this video?",
      message: "It will be hidden (soft delete). Order of the rest stays.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    await apiFetch("/Menu-Video", {
      method: "DELETE",
      body: { menu_video_id: r.menu_video_id, luu: "ADMIN_PORTAL" },
    }).catch(() => null);
    toast?.success("Video deleted.");
    reload();
  };

  // ---- drag-and-drop order (display_order) ----
  const startOrder = () => {
    setOrderIds(live.map((r) => r.menu_video_id));
    setOrderMode(true);
  };

  const dropOn = (e, targetId) => {
    e.preventDefault();
    const from = dragId.current;
    if (!from || from === targetId) return;
    setOrderIds((ids) => {
      const next = ids.filter((id) => String(id) !== String(from));
      const at = next.findIndex((id) => String(id) === String(targetId));
      next.splice(at < 0 ? next.length : at, 0, from);
      return next;
    });
  };

  const saveOrder = async () => {
    const byId = Object.fromEntries(live.map((r) => [String(r.menu_video_id), r]));
    const changed = orderIds
      .map((id, i) => ({ id, order: i + 1, prev: Number(byId[String(id)]?.display_order) || 0 }))
      .filter((r) => r.order !== r.prev);
    if (changed.length === 0) {
      setOrderMode(false);
      setMsg("Order already up to date.");
      return;
    }
    setBusy(true);
    try {
      await Promise.all(
        changed.map((r) =>
          apiFetch("/Menu-Video", {
            method: "PUT",
            body: { menu_video_id: r.id, display_order: r.order, luu: "ADMIN_PORTAL" },
          })
        )
      );
      setOrderMode(false);
      setMsg(`Order saved (${changed.length} video(s) updated).`);
      toast?.success("Video order saved.");
      reload();
    } catch (err) {
      fail(err, "Could not save order.");
    } finally {
      setBusy(false);
    }
  };

  const ordered = orderMode
    ? orderIds.map((id) => live.find((r) => String(r.menu_video_id) === String(id))).filter(Boolean)
    : live;

  const flag = (v) => (v === 1 || v === true ? "On" : "Off");

  return (
    <div>
      <p className="eyebrow text-gold-deep">Harry Clinton</p>
      <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-neutral-900">
        Home Video
      </h1>
      <p className="mt-1 text-xs text-neutral-500">
        Full-viewport section below the running bar • {live.length} video(s) • MP4/WEBM ≤ 50 MB
      </p>
      {msg && (
        <p className="mt-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 shadow-sm">
          {msg}
        </p>
      )}

      <div className="mt-4 flex justify-end gap-2">
        {!orderMode ? (
          <>
            <button type="button" onClick={openCreate} className={btnPrimary}>
              <i className="bi bi-plus-lg" /> New video
            </button>
            {live.length > 1 && (
              <button type="button" onClick={startOrder} className={btnOutline}>
                <i className="bi bi-grip-vertical" /> Edit order
              </button>
            )}
          </>
        ) : (
          <>
            <button type="button" onClick={saveOrder} disabled={busy} className={btnPrimary}>
              <i className="bi bi-check-lg" /> {busy ? "Saving..." : "Save order"}
            </button>
            <button type="button" onClick={() => setOrderMode(false)} className={btnOutline}>
              Cancel
            </button>
          </>
        )}
      </div>
      {orderMode && (
        <p className="mt-2 text-xs text-neutral-500">Drag rows by the grip to reorder, then Save order.</p>
      )}

      <div className={`mt-3 ${tableWrapCls}`}>
        <table className="w-full bg-white text-left text-sm">
          <thead>
            <tr className="bg-[#17161a] text-[11px] font-bold uppercase tracking-wider text-white">
              {orderMode && <th className="w-[44px] px-4 py-3" />}
              <th className={thCls}>#</th>
              <th className={thCls}>Preview</th>
              <th className={thCls}>Type</th>
              <th className={thCls}>Auto / Loop / Mute</th>
              <th className="w-[150px] px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ordered.length === 0 ? (
              <tr>
                <td colSpan={orderMode ? 6 : 5} className="p-5 text-center text-neutral-500">
                  No videos yet — add the first one.
                </td>
              </tr>
            ) : (
              ordered.map((r, i) => (
                <tr
                  key={r.menu_video_id}
                  draggable={orderMode}
                  onDragStart={orderMode ? (e) => { dragId.current = r.menu_video_id; e.dataTransfer.effectAllowed = "move"; } : undefined}
                  onDragOver={orderMode ? (e) => e.preventDefault() : undefined}
                  onDrop={orderMode ? (e) => dropOn(e, r.menu_video_id) : undefined}
                  className={`border-b last:border-0 ${orderMode ? "cursor-grab active:cursor-grabbing hover:bg-[#faf8f4]" : ""}`}
                >
                  {orderMode && (
                    <td className="px-4 py-3 text-neutral-400">
                      <i className="bi bi-grip-vertical" />
                    </td>
                  )}
                  <td className={`${tdCls} font-bold text-neutral-500`}>{i + 1}</td>
                  <td className={tdCls}>
                    <button
                      type="button"
                      title="Play fullscreen"
                      onClick={() => setLightbox({ url: resolveUploadUrl(r.video_url), poster: resolveUploadUrl(r.poster_image_url), title: r.video_type || "Home video" })}
                      className="block overflow-hidden rounded-md border border-neutral-200 transition hover:border-gold"
                    >
                      {r.poster_image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={resolveUploadUrl(r.poster_image_url)}
                          alt=""
                          className="h-12 w-24 object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="flex h-12 w-24 items-center justify-center gap-1 bg-neutral-950 text-[10px] font-bold uppercase tracking-wider text-gold">
                          <i className="bi bi-film" /> Video
                        </span>
                      )}
                    </button>
                  </td>
                  <td className={tdCls}>
                    <span className="font-semibold">{r.video_type || "brand"}</span>
                    {(r.isactive !== 1 && r.isactive !== true) && (
                      <span className="ml-2 rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                        Off
                      </span>
                    )}
                  </td>
                  <td className={`${tdCls} text-xs text-neutral-600`}>
                    {flag(r.autoplay)} / {flag(r.loop_video)} / {flag(r.mute_default)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {orderMode ? (
                      <span className="text-xs text-neutral-400">drag me</span>
                    ) : (
                      <>
                        <button type="button" onClick={() => openEdit(r)} title="Edit video" className={iconBtn}>
                          <i className="bi bi-pencil" />
                        </button>
                        <span className="mr-1 inline-block align-middle">
                          <ActiveToggle active={r.isactive} onToggle={(next) => toggle(r, next)} />
                        </span>
                        <button type="button" onClick={() => remove(r)} title="Delete video" className={iconBtn}>
                          <i className="bi bi-trash3" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ---- fullscreen video viewer ---- */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-neutral-950/90 p-6"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            aria-label="Close viewer"
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl text-white transition hover:bg-gold hover:text-neutral-950"
          >
            <i className="bi bi-x-lg" />
          </button>
          <figure className="max-h-full w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <video
              src={lightbox.url}
              poster={lightbox.poster || undefined}
              controls
              autoPlay
              playsInline
              className="max-h-[80vh] w-full rounded-lg bg-black"
            />
            <figcaption className="mt-3 text-center text-sm text-white/70">{lightbox.title}</figcaption>
          </figure>
        </div>
      )}

      {/* ---- create/edit popup ---- */}
      {modal && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-neutral-950/60 p-4"
          onClick={() => setModal(null)}
        >
          <form
            onSubmit={save}
            onClick={(e) => e.stopPropagation()}
            className={`max-h-[90vh] w-full max-w-lg overflow-y-auto ${panelCls}`}
          >
            <h3 className="font-display text-lg font-bold text-neutral-900">
              {modal.id ? "Edit video" : "New video"}
            </h3>
            {(stagedVideo || modal.video_url) && (
              <div className="mt-3">
                <video
                  src={stagedVideo ? URL.createObjectURL(stagedVideo) : resolveUploadUrl(modal.video_url)}
                  className="aspect-video w-full rounded-md border border-neutral-200 bg-neutral-950 object-cover"
                  muted
                  playsInline
                  preload="metadata"
                />
                <p className="mt-1 text-xs text-neutral-500">
                  Preview{stagedVideo ? " (staged file)" : " (current file)"} — poster below.
                </p>
              </div>
            )}
            {(stagedPoster || modal.poster_image_url) && (
              <div className="mt-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={stagedPoster ? URL.createObjectURL(stagedPoster) : resolveUploadUrl(modal.poster_image_url)}
                  alt="Poster preview"
                  className="aspect-video w-full rounded-md border border-neutral-200 object-cover"
                />
                <p className="mt-1 text-xs text-neutral-500">Poster preview.</p>
              </div>
            )}
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Type
                <input value={modal.video_type} onChange={(e) => setModal({ ...modal, video_type: e.target.value })} placeholder="brand" className={`${inputCls} mt-1 font-normal normal-case tracking-normal`} />
              </label>
              <div className="flex items-end gap-4 pb-1">
                {[
                  ["autoplay", "Auto-play"],
                  ["loop_video", "Loop"],
                  ["mute_default", "Mute"],
                ].map(([k, label]) => (
                  <label key={k} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    <ActiveToggle active={modal[k]} onToggle={async (next) => setModal({ ...modal, [k]: next })} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Video file{modal.id ? " — leave empty to keep current" : ""}
              </p>
              <div className="mt-1">
                <FilePick
                  accept=".mp4,.webm,.mov"
                  onPick={stageVideo}
                  fileName={stagedVideo?.name}
                  hint="MP4 / WEBM / MOV ≤ 50 MB"
                />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Poster image{modal.id ? " — leave empty to keep current" : ""}
              </p>
              <div className="mt-1">
                <FilePick
                  accept=".jpg,.jpeg,.png,.webp"
                  onPick={stagePoster}
                  fileName={stagedPoster?.name}
                  hint="JPG / PNG / WEBP ≤ 3 MB"
                />
              </div>
            </div>
            <label className="mt-4 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Section on
              <ActiveToggle active={modal.isactive} onToggle={async (next) => setModal({ ...modal, isactive: next })} />
            </label>
            {upProg && (
              <div className="mt-4">
                <UploadRing prog={upProg} />
              </div>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setModal(null)} className={btnOutline}>
                Cancel
              </button>
              <button type="submit" disabled={busy} className={btnPrimary}>
                {busy ? "Saving..." : modal.id ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
