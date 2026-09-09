import { apiGet, unwrap } from "@/lib/api";

export const revalidate = 120;

// Announcement ticker above the header, driven by the Running-Bar API.
export default async function RunningBar() {
  let items = [];
  try {
    const [bars, barItems] = await Promise.all([
      apiGet("/Running-Bar").then(unwrap),
      apiGet("/Running-Bar-Items").then(unwrap),
    ]);
    const active = bars.find((b) => b.isactive !== false) || bars[0];
    if (active) {
      items = barItems.filter(
        (i) => i.running_bar_id === active.running_bar_id && i.isactive !== false
      );
    }
  } catch {
    items = [];
  }
  if (items.length === 0) return null;
  const words = items.map((i) => i.item_text || i.title).filter(Boolean);
  const line = words.join("  •  ");

  return (
    <div className="overflow-hidden bg-neutral-950 py-1.5 text-center text-xs font-medium uppercase tracking-widest text-white">
      <div className="animate-marquee whitespace-nowrap">{line}</div>
    </div>
  );
}
