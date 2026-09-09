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
    { label: "Products", value: products.length, href: "/admin/products" },
    { label: "Orders", value: orders.length, href: "/admin/orders" },
    { label: "Users", value: users.length, href: "/admin/users" },
    { label: "Appointments", value: appointments.length, href: "/admin/appointments" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <a key={c.label} href={c.href} className="bg-white p-6 shadow-sm transition hover:shadow">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">{c.label}</p>
            <p className="mt-2 text-4xl font-bold">{c.value}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
