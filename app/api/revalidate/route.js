import { revalidatePath } from "next/cache";

// On-demand revalidation: the admin calls this after any mutation so
// public pages refresh instantly instead of waiting out revalidate=300.
// Capability is cache-refresh only; guarded by a shared secret.
const REVALIDATE_SECRET = "hc-revalidate-2026";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (body.secret !== REVALIDATE_SECRET) {
      return Response.json({ success: false, message: "Forbidden" }, { status: 403 });
    }
    revalidatePath("/", "layout");
    return Response.json({ success: true, revalidated: true });
  } catch (err) {
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}
