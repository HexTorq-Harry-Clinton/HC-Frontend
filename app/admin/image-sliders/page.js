"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  apiFetch, unwrap, revalidateSite, friendlyError,
  resolveUploadUrl, detectMediaType,
} from "@/lib/api";
import ActiveToggle from "@/components/ActiveToggle";
import FilePick from "../FilePick";
import Pagination, { paginate } from "../Pagination";
import UploadRing from "../UploadRing";
import useLockBody from "../useLockBody";
import useUploader from "../useUploader";
import { useToast } from "../ToastProvider";
import { useConfirm } from "../ConfirmProvider";

const panelCls = " border border-neutral-200 bg-white p-6 shadow-sm";
const tableWrapCls = "overflow-x-auto  border border-neutral-200 bg-white shadow-sm";
const thCls = "px-4 py-3 whitespace-nowrap";
const tdCls = "px-4 py-3";
const inputCls =
  "w-full  border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition-shadow placeholder:text-neutral-400 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25";
const btnPrimary =
  "inline-flex items-center justify-center gap-1.5  bg-neutral-950 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gold hover:text-neutral-950 focus:outline-none focus:ring-2 focus:ring-gold/40 disabled:cursor-not-allowed disabled:opacity-50";
const btnOutline =
  "inline-flex items-center justify-center gap-1.5  border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition-colors hover:border-neutral-950 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900/10";
const iconBtn =
  "inline-flex h-8 w-8 items-center justify-center  text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900";

// Images: JPG / PNG / WEBP, max 3 MB. Videos: MP4 / WEBM / MOV, max 50 MB.
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const OK_IMAGE_EXT = ["jpg", "jpeg", "png", "webp"];
const OK_VIDEO_EXT = ["mp4", "webm", "mov"];

function checkFile(file) {
  if (!file) return "Please pick a file.";
  const ext = (file.name?.split(".").pop() || "").toLowerCase();
  const kind = detectMediaType(file);
  if (kind === "video") {
    if (!OK_VIDEO_EXT.includes(ext)) return "Only MP4, WEBM or MOV videos are allowed.";
    if (file.size > MAX_VIDEO_BYTES) return "Video must be 50 MB or smaller.";
    return null;
  }
  if (!OK_IMAGE_EXT.includes(ext)) return "Only JPG, PNG or WEBP images are allowed.";
  if (file.size > MAX_IMAGE_BYTES) return "Image must be 3 MB or smaller.";
  return null;
}

const isVideoUrl = (url) => /\.(mp4|webm|mov)(\?|#|$)/i.test(url || "");

// HC Hero Image Slider: thumbnail list with preview, upload/replace with
// validation + live preview before publishing, activate toggle, drag-and-drop
// display_order with batch save.
export default function AdminImageSlidersPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [rows, setRows] = useState([]);
  const [refresh, setRefresh] = useState(0);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  // null | { id?, title, subtitle, button_text, redirect_link,
  //          auto_slide_interval_seconds, image_url, isactive }
  const [modal, setModal] = useState(null);
  const [staged, setStaged] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  // false | array of ids in manual order — reorder mode.
  const [orderMode, setOrderMode] = useState(false);
  const [orderIds, setOrderIds] = useState([]);
  // null | { url, isVideo, title } — fullscreen file viewer.
  const [lightbox, setLightbox] = useState(null);
  const dragId = useRef(null);
  // Open popup owns the scroll — page behind is frozen.
  useLockBody(!!modal || !!lightbox);
  // Uploads with live ring progress (%, MB, speed, ETA).
  const { upProg, upload } = useUploader();

  useEffect(() => {
    let live = true;
    apiFetch("/Image-Sliders", { params: { includeInactive: 1 } })
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

  // Revoke staged object URLs on unmount/replace.
  useEffect(() => () => {
    if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

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
    setStaged(null);
    setPreviewUrl("");
    setModal({
      id: null, title: "", subtitle: "", button_text: "",
      redirect_link: "", auto_slide_interval_seconds: 5,
      image_url: "", isactive: true,
    });
  };

  const openEdit = (r) => {
    setStaged(null);
    setPreviewUrl(resolveUploadUrl(r.image_url) || "");
    setModal({
      id: r.image_slider_id,
      title: r.title || "", subtitle: r.subtitle || "",
      button_text: r.button_text || "", redirect_link: r.redirect_link || "",
      auto_slide_interval_seconds: r.auto_slide_interval_seconds ?? 5,
      image_url: r.image_url || "",
      media_type: r.media_type || "",
      isactive: r.isactive === 1 || r.isactive === true,
    });
  };

  const stage = (file) => {
    const err = checkFile(file);
    if (err) {
      setMsg(err);
      toast?.error(err);
      return;
    }
    if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setStaged(file);
    setPreviewUrl(URL.createObjectURL(file));
    setMsg(`Staged: ${file.name} — preview below. Click ${modal?.id ? "Update" : "Create"} to publish.`);
  };

  const save = async (e) => {
    e?.preventDefault();
    if (!modal) return;
    if (!modal.title.trim()) {
      setMsg("Please enter a title.");
      return;
    }
    const secs = Number(modal.auto_slide_interval_seconds);
    if (!Number.isFinite(secs) || secs < 2 || secs > 12) {
      setMsg("Slide interval must be 2–12 seconds.");
      return;
    }
    setBusy(true);
    try {
      // Upload first (validated above) — the row is never saved without its file.
      // media_type follows the staged file, else the kept row value, else URL sniffing.
      let imageUrl = modal.image_url;
      let mediaType = modal.media_type || "";
      if (staged) {
        setMsg("Uploading file...");
        imageUrl = await upload(staged);
        mediaType = detectMediaType(staged);
      }
      if (!mediaType) mediaType = isVideoUrl(imageUrl) ? "video" : "image";
      if (!imageUrl) {
        setMsg("Please pick an image file.");
        setBusy(false);
        return;
      }
      const body = {
        title: modal.title.trim(),
        subtitle: (modal.subtitle || "").trim(),
        button_text: (modal.button_text || "").trim(),
        redirect_link: (modal.redirect_link || "").trim(),
        auto_slide_interval_seconds: Math.round(secs),
        image_url: imageUrl,
        media_type: mediaType,
        isactive: modal.isactive ? 1 : 0,
        luu: "ADMIN_PORTAL",
      };
      if (modal.id) {
        await apiFetch("/Image-Sliders", {
          method: "PUT",
          body: { image_slider_id: modal.id, ...body },
        });
        setMsg("Slide updated.");
        toast?.success("Hero slide updated.");
      } else {
        const maxOrder = live.reduce((m, r) => Math.max(m, Number(r.display_order) || 0), 0);
        await apiFetch("/Image-Sliders", {
          method: "POST",
          body: { ...body, display_order: maxOrder + 1, rcu: "ADMIN_PORTAL" },
        });
        setMsg("Slide created.");
        toast?.success("Hero slide created.");
      }
      setModal(null);
      setStaged(null);
      setPreviewUrl("");
      reload();
    } catch (err) {
      fail(err, "Could not save slide.");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (r, next) => {
    await apiFetch("/Image-Sliders", {
      method: "PUT",
      body: { image_slider_id: r.image_slider_id, isactive: next ? 1 : 0, luu: "ADMIN_PORTAL" },
    }).catch(() => null);
    toast?.success(next ? "Slide activated." : "Slide deactivated.");
    reload();
  };

  const remove = async (r) => {
    const ok = await confirm({
      title: "Delete this slide?",
      message: `"${r.title || "Untitled"}" will be hidden (soft delete).`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    await apiFetch("/Image-Sliders", {
      method: "DELETE",
      body: { image_slider_id: r.image_slider_id, luu: "ADMIN_PORTAL" },
    }).catch(() => null);
    toast?.success("Slide deleted.");
    reload();
  };

  // ---- drag-and-drop order (display_order) ----
  const startOrder = () => {
    setOrderIds(live.map((r) => r.image_slider_id));
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
    const byId = Object.fromEntries(live.map((r) => [String(r.image_slider_id), r]));
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
          apiFetch("/Image-Sliders", {
            method: "PUT",
            body: { image_slider_id: r.id, display_order: r.order, luu: "ADMIN_PORTAL" },
          })
        )
      );
      setOrderMode(false);
      setMsg(`Order saved (${changed.length} slide(s) updated).`);
      toast?.success("Slide order saved.");
      reload();
    } catch (err) {
      fail(err, "Could not save order.");
    } finally {
      setBusy(false);
    }
  };

  const ordered = orderMode
    ? orderIds.map((id) => live.find((r) => String(r.image_slider_id) === String(id))).filter(Boolean)
    : live;
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  // Search + pagination (reorder mode shows everything for dragging).
  const needle = search.trim().toLowerCase();
  const filtered = needle
    ? ordered.filter((r) => `${r.title || ""} ${r.subtitle || ""}`.toLowerCase().includes(needle))
    : ordered;
  const shown = orderMode ? filtered : paginate(filtered, page, pageSize);

  return (
    <div>
      <p className="eyebrow text-gold-deep">Harry Clinton</p>
      <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-neutral-900">
        Home Slider
      </h1>
      <p className="mt-1 text-xs text-neutral-500">
        Hero slider — images + videos mixed • {live.length} slide(s) • IMG ≤ 3 MB / VID ≤ 50 MB
      </p>
      {msg && (
        <p className="mt-3  border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 shadow-sm">
          {msg}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search slides..."
          className=" border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition-shadow placeholder:text-neutral-400 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
          style={{ minWidth: 200 }}
        />
        {!orderMode ? (
          <>
            <button type="button" onClick={openCreate} className={btnPrimary}>
              <i className="bi bi-plus-lg" /> New slide
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
              <th className={thCls}>Title / Subtitle</th>
              <th className={thCls}>Button → Link</th>
              <th className={thCls}>Secs</th>
              <th className="w-[150px] px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr>
                <td colSpan={orderMode ? 7 : 6} className="p-5 text-center text-neutral-500">
                  No slides yet — add the first one.
                </td>
              </tr>
            ) : (
              shown.map((r, i) => (
                <tr
                  key={r.image_slider_id}
                  draggable={orderMode}
                  onDragStart={orderMode ? (e) => { dragId.current = r.image_slider_id; e.dataTransfer.effectAllowed = "move"; } : undefined}
                  onDragOver={orderMode ? (e) => e.preventDefault() : undefined}
                  onDrop={orderMode ? (e) => dropOn(e, r.image_slider_id) : undefined}
                  className={`border-b last:border-0 ${orderMode ? "cursor-grab active:cursor-grabbing hover:bg-[#faf8f4]" : ""}`}
                >
                  {orderMode && (
                    <td className="px-4 py-3 text-neutral-400">
                      <i className="bi bi-grip-vertical" />
                    </td>
                  )}
                  <td className={`${tdCls} font-bold text-neutral-500`}>{i + 1}</td>
                  <td className={tdCls}>
                    {(r.media_type === "video" || isVideoUrl(r.image_url)) ? (
                      <button
                        type="button"
                        title="View fullscreen"
                        onClick={() => setLightbox({ url: resolveUploadUrl(r.image_url), isVideo: true, title: r.title || "Slide video" })}
                        className="flex h-12 w-24 items-center justify-center gap-1  border border-neutral-200 bg-neutral-950 text-[10px] font-bold uppercase tracking-wider text-gold transition hover:border-gold"
                      >
                        <i className="bi bi-film" /> Video
                      </button>
                    ) : (
                      <button
                        type="button"
                        title="View fullscreen"
                        onClick={() => setLightbox({ url: resolveUploadUrl(r.image_url), isVideo: false, title: r.title || "Slide image" })}
                        className="block overflow-hidden  border border-neutral-200 transition hover:border-gold"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={resolveUploadUrl(r.image_url) || "/brand/logo-black.png"}
                          alt=""
                          className="h-12 w-24 object-cover"
                          loading="lazy"
                        />
                      </button>
                    )}
                  </td>
                  <td className={`${tdCls} max-w-xs`}>
                    <span className="block truncate font-semibold">{r.title || "—"}</span>
                    <span className="block truncate text-xs text-neutral-500">{r.subtitle || ""}</span>
                    {(r.isactive !== 1 && r.isactive !== true) && (
                      <span className="mt-1 inline-block  bg-neutral-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                        Off
                      </span>
                    )}
                  </td>
                  <td className={`${tdCls} max-w-[180px] truncate text-xs`}>
                    {r.button_text ? `${r.button_text} → ${r.redirect_link || "—"}` : "—"}
                  </td>
                  <td className={tdCls}>{Number(r.auto_slide_interval_seconds) || 4}s</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {orderMode ? (
                      <span className="text-xs text-neutral-400">drag me</span>
                    ) : (
                      <>
                        <button type="button" onClick={() => openEdit(r)} title="Edit slide" className={iconBtn}>
                          <i className="bi bi-pencil" />
                        </button>
                        <span className="mr-1 inline-block align-middle">
                          <ActiveToggle active={r.isactive} onToggle={(next) => toggle(r, next)} />
                        </span>
                        <button type="button" onClick={() => remove(r)} title="Delete slide" className={iconBtn}>
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
      {!orderMode && (
        <Pagination page={page} setPage={setPage} total={filtered.length} pageSize={pageSize} setPageSize={setPageSize} />
      )}

      {/* ---- fullscreen file viewer ---- */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-neutral-950/90 p-6"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            aria-label="Close viewer"
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center  bg-white/10 text-xl text-white transition hover:bg-gold hover:text-neutral-950"
          >
            <i className="bi bi-x-lg" />
          </button>
          <figure className="max-h-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            {lightbox.isVideo ? (
              <video src={lightbox.url} controls autoPlay muted playsInline className="max-h-[80vh] w-auto max-w-full " />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={lightbox.url} alt={lightbox.title} className="max-h-[80vh] w-auto max-w-full  object-contain" />
            )}
            <figcaption className="mt-3 text-center text-sm text-white/70">{lightbox.title}</figcaption>
          </figure>
        </div>
      )}

      {/* ---- create/edit popup with live preview ---- */}
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
              {modal.id ? "Edit slide" : "New slide"}
            </h3>
            {previewUrl ? (
              <div className="mt-3">
                {isVideoUrl(previewUrl) || (staged && detectMediaType(staged) === "video") ? (
                  <video src={previewUrl} className="aspect-[16/7] w-full  border border-neutral-200 bg-neutral-950 object-cover" muted playsInline preload="metadata" />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={previewUrl} alt="Slide preview" className="aspect-[16/7] w-full  border border-neutral-200 object-cover" />
                )}
                <p className="mt-1 text-xs text-neutral-500">Preview — how it looks in the hero.</p>
              </div>
            ) : (
              <p className="mt-3  bg-neutral-100 p-3 text-xs text-neutral-500">No file yet — pick one below to preview.</p>
            )}
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Hero file{modal.id ? " — leave empty to keep current" : ""}
              </p>
              <div className="mt-1">
                <FilePick
                  accept=".jpg,.jpeg,.png,.webp,.mp4,.webm,.mov"
                  onPick={stage}
                  fileName={staged?.name}
                  hint="Image JPG / PNG / WEBP ≤ 3 MB — or video MP4 / WEBM ≤ 50 MB"
                />
              </div>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Title
                <input value={modal.title} onChange={(e) => setModal({ ...modal, title: e.target.value })} placeholder="e.g. Wedding Edit" className={`${inputCls} mt-1 font-normal normal-case tracking-normal`} />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Button text
                <input value={modal.button_text} onChange={(e) => setModal({ ...modal, button_text: e.target.value })} placeholder="Shop now" className={`${inputCls} mt-1 font-normal normal-case tracking-normal`} />
              </label>
            </div>
            <label className="mt-3 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Subtitle / offer text
              <textarea value={modal.subtitle} onChange={(e) => setModal({ ...modal, subtitle: e.target.value })} rows={2} placeholder="e.g. Festive 50% privilege" className={`${inputCls} mt-1 font-normal normal-case tracking-normal`} />
            </label>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Redirect link
                <input value={modal.redirect_link} onChange={(e) => setModal({ ...modal, redirect_link: e.target.value })} placeholder="/suits" className={`${inputCls} mt-1 font-normal normal-case tracking-normal`} />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Slide secs (2–12)
                <input type="number" min={2} max={12} value={modal.auto_slide_interval_seconds} onChange={(e) => setModal({ ...modal, auto_slide_interval_seconds: e.target.value })} className={`${inputCls} mt-1 font-normal`} />
              </label>
            </div>
            <label className="mt-4 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Active
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
