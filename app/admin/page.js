import Link from "next/link";
import { apiGet, unwrap } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [products, orders, users, appointments] = await Promise.all([
    apiGet("/Products").then(unwrap).catch(() => []),
    apiGet("/Orders").then(unwrap).catch(() => []),
    apiGet("/Users").then(unwrap).catch(() => []),
    apiGet("/Custom-Appointments").then(unwrap).catch(() => []),
  ]);

  const cards = [
    {
      label: "Products",
      value: products.length,
      href: "/admin/products",
      icon: "bi bi-bag-heart-fill",
      tint: "bg-gold/10",
      ring: "group-hover:ring-gold/30",
    },
    {
      label: "Orders",
      value: orders.length,
      href: "/admin/orders",
      icon: "bi bi-receipt-cutoff",
      tint: "bg-indigo-50",
      ring: "group-hover:ring-indigo-200",
    },
    {
      label: "Users",
      value: users.length,
      href: "/admin/users",
      icon: "bi bi-people-fill",
      tint: "bg-emerald-50",
      ring: "group-hover:ring-emerald-200",
    },
    {
      label: "Appointments",
      value: appointments.length,
      href: "/admin/appointments",
      icon: "bi bi-calendar2-check-fill",
      tint: "bg-rose-50",
      ring: "group-hover:ring-rose-200",
    },
  ];

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-gold-deep">Harry Clinton</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-neutral-900">Dashboard</h1>
        </div>
        <p className="hidden text-sm text-neutral-400 sm:block">Welcome back — here&rsquo;s your store at a glance.</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className={`group relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-6 shadow-sm ring-1 ring-transparent transition-all duration-200 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md ${c.ring}`}
          >
            <span className={`absolute right-0 top-0 h-20 w-20 -translate-y-6 translate-x-6 rounded-full ${c.tint} blur-2xl`} />
            <div className="relative flex items-center justify-between">
              <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${c.tint} text-neutral-700`}>
                <i className={`${c.icon} text-lg`} />
              </span>
              <i className="bi bi-arrow-up-right text-base text-neutral-300 transition-colors group-hover:text-gold" />
            </div>
            <p className="relative mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">{c.label}</p>
            <p className="relative mt-1 text-4xl font-bold tracking-tight text-neutral-900">{c.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
