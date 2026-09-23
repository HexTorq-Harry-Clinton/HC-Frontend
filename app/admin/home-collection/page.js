"use client";

import { useEffect, useState } from "react";
import { resolveUploadUrl } from "@/lib/api";
import ActiveToggle from "@/components/ActiveToggle";
import FilePick from "../FilePick";
import UploadRing from "../UploadRing";
import useHomeSettings from "../useHomeSettings";
import useUploader from "../useUploader";
import { useToast } from "../ToastProvider";

const panelCls = " border border-neutral-200 bg-white p-6 shadow-sm";
const inputCls =
  "w-full  border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition-shadow placeholder:text-neutral-400 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25";
const btnPrimary =
  "inline-flex items-center justify-center gap-1.5  bg-neutral-950 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gold hover:text-neutral-950 focus:outline-none focus:ring-2 focus:ring-gold/40 disabled:cursor-not-allowed disabled:opacity-50";
const btnOutline =
  "inline-flex items-center justify-center gap-1.5  border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition-colors hover:border-neutral-950 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900/10";

const DEFAULT_TILES = [
  { name: "Suits", tagline: "For the Men Who Wear Royalty, Not Just Suits.", image_url: "", link: "/suits", order: 1, active: true },
  { name: "Shirts", tagline: "Sharp shirts for every hour of the day.", image_url: "", link: "/shirts", order: 2, active: true },
  { name: "Trousers", tagline: "Tailored trousers, cut to move with you.", image_url: "", link: "/trousers", order: 3, active: true },
  { name: "Indo-Western", tagline: "Heritage craft meets modern tailoring.", image_url: "", link: "/indowestern", order: 4, active: true },
  { name: "Baby Suits", tagline: "Tailored from day one.", image_url: "", link: "/babysuits", order: 5, active: true },
];

function parseTiles(json) {
  try {
    const arr = JSON.parse(json || "[]");
    if (Array.isArray(arr) && arr.length > 0) return arr;
  } catch {
    /* fall through to defaults */
  }
  return DEFAULT_TILES;
}

// Home Screen Content → The Collection: eyebrow + title + category tiles
// (name, tagline, image, link, order, on/off) with live preview.
// Stored on tbl_settings (home_collection_*).
export default function AdminHomeCollectionPage() {
  const toast = useToast();
  const { settings, loading, saving, msg, setMsg, patch, save } = useHomeSettings();
  const { upProg, upload } = useUploader();
  const [tiles, setTiles] = useState(DEFAULT_TILES);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (!loading && !seeded) {
      setTiles(parseTiles(settings.home_collection_json));
      setSeeded(true);
    }
  }, [loading, seeded, settings.home_collection_json]);

  const setTile = (i, fields) =>
    setTiles((t) => t.map((tile, idx) => (idx === i ? { ...tile, ...fields } : tile)));

  const move = (i, dir) => {
    setTiles((t) => {
      const next = [...t];
      const j = i + dir;
      if (j < 0 || j >= next.length) return t;
      [next[i], next[j]] = [next[j], next[i]];
      return next.map((tile, idx) => ({ ...tile, order: idx + 1 }));
    });
  };

  const addTile = () =>
    setTiles((t) => [...t, { name: "", tagline: "", image_url: "", link: "", order: t.length + 1, active: true }]);

  const removeTile = (i) =>
    setTiles((t) => t.filter((_, idx) => idx !== i).map((tile, idx) => ({ ...tile, order: idx + 1 })));

  const tileImg = (tile) =>
    tile.image_url instanceof File ? URL.createObjectURL(tile.image_url) : resolveUploadUrl(tile.image_url) || "";

  const saveAll = async () => {
    // Upload staged tile images FIRST, then save the row with URLs.
    const next = [...tiles];
    for (let i = 0; i < next.length; i++) {
      if (next[i].image_url instanceof File) {
        setMsg(`Uploading image ${i + 1}/${next.length}...`);
        try {
          next[i] = { ...next[i], image_url: await upload(next[i].image_url) };
        } catch (err) {
          setMsg(err.message || "Image upload failed.");
          return;
        }
      }
    }
    const clean = next.map(({ name, tagline, image_url, link, order, active }, i) => ({
      name: (name || "").trim(),
      tagline: (tagline || "").trim(),
      image_url: typeof image_url === "string" ? image_url : "",
      link: (link || "").trim(),
      order: Number(order) || i + 1,
      active: !!active,
    }));
    setTiles(next);
    const ok = await save(
      {
        home_collection_eyebrow: settings.home_collection_eyebrow || "",
        home_collection_title: settings.home_collection_title || "",
        home_collection_json: JSON.stringify(clean),
      },
      "Collection saved — homepage updated."
    );
    if (ok) toast?.success("Collection saved.");
  };

  if (loading) return <p className="p-10 text-sm text-neutral-500">Loading collection…</p>;

  const liveTiles = [...tiles].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

  return (
    <div>
      <p className="eyebrow text-gold-deep">Harry Clinton</p>
      <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-neutral-900">The Collection</h1>
      <p className="mt-1 text-xs text-neutral-500">
        THE COLLECTION tiles on the homepage • stored on tbl_settings • images upload on Save
      </p>
      {msg && (
        <p className="mt-3  border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 shadow-sm">
          {msg}
        </p>
      )}

      <div className={`mt-4 ${panelCls}`}>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Eyebrow
            <input
              value={settings.home_collection_eyebrow || ""}
              onChange={(e) => patch({ home_collection_eyebrow: e.target.value })}
              placeholder="THE COLLECTION"
              className={`${inputCls} mt-1`}
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Title
            <input
              value={settings.home_collection_title || ""}
              onChange={(e) => patch({ home_collection_title: e.target.value })}
              placeholder="Explore Our World"
              className={`${inputCls} mt-1`}
            />
          </label>
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        {tiles.map((tile, i) => (
          <div key={i} className={panelCls}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-neutral-900">
                #{i + 1} {tile.name || "Untitled tile"}
              </p>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => move(i, -1)} title="Move up" className=" px-2 py-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900">
                  <i className="bi bi-arrow-up" />
                </button>
                <button type="button" onClick={() => move(i, 1)} title="Move down" className=" px-2 py-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900">
                  <i className="bi bi-arrow-down" />
                </button>
                <ActiveToggle active={tile.active} onToggle={(next) => setTile(i, { active: next })} />
                <button type="button" onClick={() => removeTile(i)} title="Remove tile" className=" px-2 py-1 text-red-600 hover:bg-red-50">
                  <i className="bi bi-trash3" />
                </button>
              </div>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Name
                <input value={tile.name || ""} onChange={(e) => setTile(i, { name: e.target.value })} placeholder="Suits" className={`${inputCls} mt-1 font-normal normal-case tracking-normal`} />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Link
                <input value={tile.link || ""} onChange={(e) => setTile(i, { link: e.target.value })} placeholder="/suits" className={`${inputCls} mt-1 font-normal normal-case tracking-normal`} />
              </label>
            </div>
            <label className="mt-3 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Tagline
              <input value={tile.tagline || ""} onChange={(e) => setTile(i, { tagline: e.target.value })} placeholder="For the Men Who Wear Royalty…" className={`${inputCls} mt-1 font-normal normal-case tracking-normal`} />
            </label>
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Tile image</p>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-52">
                  <FilePick
                    small
                    accept="image/*"
                    onPick={(f) => setTile(i, { image_url: f })}
                    fileName={tile.image_url instanceof File ? tile.image_url.name : ""}
                    hint="Tile photo — click or drop"
                  />
                </div>
                {tileImg(tile) ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={tileImg(tile)} alt="" className="h-16 w-24  border border-neutral-200 object-cover" />
                ) : (
                  <span className="flex h-16 w-24 items-center justify-center  border border-dashed border-neutral-300 text-[10px] uppercase tracking-wider text-neutral-400">
                    No image
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={addTile} className={btnOutline}>
          <i className="bi bi-plus-lg" /> Add tile
        </button>
        <button type="button" onClick={saveAll} disabled={saving} className={btnPrimary}>
          {saving ? "Saving..." : "Save collection"}
        </button>
      </div>
      {upProg && (
        <div className="mt-3">
          <UploadRing prog={upProg} />
        </div>
      )}

      {/* ---- live preview ---- */}
      <div className={`mt-6 ${panelCls}`}>
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Homepage preview</p>
        <p className="mt-3 text-center text-[11px] font-bold uppercase tracking-[0.25em] text-gold-deep">
          {settings.home_collection_eyebrow || "THE COLLECTION"}
        </p>
        <p className="mt-1 text-center font-display text-2xl font-bold text-neutral-900">
          {settings.home_collection_title || "Explore Our World"}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {liveTiles.filter((t) => t.active).map((t, i) => (
            <div key={i} className="relative h-44 overflow-hidden  bg-neutral-900">
              {tileImg(t) ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={tileImg(t)} alt={t.name} className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-950" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 p-3">
                <p className="text-sm font-bold text-white">{t.name || "Untitled"}</p>
                <p className="mt-0.5 line-clamp-2 text-[11px] text-white/80">{t.tagline}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
