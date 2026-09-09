import AdminModulePage from "../AdminModule";
import { adminModule, adminModuleSlugs } from "@/lib/admin";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return adminModuleSlugs().map((module) => ({ module }));
}

export async function generateMetadata({ params }) {
  const { module } = await params;
  const mod = adminModule(module);
  return { title: mod ? `${mod.title} | Admin` : "Admin" };
}

export default async function Page({ params }) {
  const { module } = await params;
  if (!adminModule(module)) notFound();
  return <AdminModulePage key={module} module={module} />;
}
