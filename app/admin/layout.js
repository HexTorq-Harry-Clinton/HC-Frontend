import AdminShell from "./AdminShell";

export const metadata = { title: "Admin" };

// Admin is always dynamic (JWT-guarded, live data).
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
