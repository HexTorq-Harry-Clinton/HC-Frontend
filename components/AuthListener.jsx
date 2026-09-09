"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

// Global 401 handler: apiFetch dispatches hc:unauthorized, this island navigates.
export default function AuthListener() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const onUnauthorized = () => {
      if (pathname !== "/login") router.push("/login");
    };
    window.addEventListener("hc:unauthorized", onUnauthorized);
    return () => window.removeEventListener("hc:unauthorized", onUnauthorized);
  }, [router, pathname]);

  return null;
}
