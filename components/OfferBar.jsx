import Image from "next/image";
import { apiGet, unwrap } from "@/lib/api";

// Offer strip: same structure as the previous UI — scrolling offer text with
// logo marks, driven by settings (home_offer_bar_text → offer_bar_text).
const DEFAULT_TEXT = "Enjoy an Exclusive 50% Privilege on All Orders Today Only !";

function pickText(settings) {
  const get = (key) => {
    const m = (Array.isArray(settings) ? settings : []).find(
      (s) => s.setting_key?.toLowerCase() === key || s.key?.toLowerCase() === key
    );
    return m?.setting_value ?? m?.value ?? "";
  };
  const raw = get("home_offer_bar_text") || get("offer_bar_text");
  if (!raw) return [DEFAULT_TEXT];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    /* plain string below */
  }
  return [raw];
}

export default async function OfferBar() {
  let settings = [];
  try {
    settings = unwrap(await apiGet("/Settings"));
  } catch {
    settings = [];
  }
  const items = pickText(settings);

  return (
    <div className="overflow-hidden border-y border-neutral-200 bg-white py-2">
      <div className="animate-marquee items-center">
        {[0, 1, 2].map((dup) => (
          <div key={dup} className="flex shrink-0 items-center" aria-hidden={dup > 0}>
            {items.map((text, index) => (
              <span key={index} className="flex items-center whitespace-nowrap px-6 text-sm font-medium">
                {text}
                <Image src="/brand/logo-black.png" alt="Black" width={28} height={28} className="ml-6 inline-block" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
