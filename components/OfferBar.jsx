import Link from "next/link";
import { apiGet, unwrap } from "@/lib/api";
import Reveal from "./Reveal";

// Offer strip driven by live coupons/discounts — replaces the hardcoded OfferBar.
export default async function OfferBar() {
  let coupons = [];
  try {
    coupons = unwrap(await apiGet("/Coupons"));
  } catch {
    coupons = [];
  }
  const live = coupons.filter((c) => c.isactive !== false).slice(0, 3);
  if (live.length === 0) return null;

  return (
    <section className="border-y border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 py-3">
        {live.map((c) => (
          <Reveal key={c.coupon_id} y={10}>
            <p className="text-xs font-semibold uppercase tracking-widest">
              {c.coupon_name || c.coupon_code}
              <span className="ml-2 border border-dashed border-neutral-400 px-2 py-0.5">{c.coupon_code}</span>
            </p>
          </Reveal>
        ))}
        <Link href="/suits" className="text-xs font-bold underline">Shop now</Link>
      </div>
    </section>
  );
}
