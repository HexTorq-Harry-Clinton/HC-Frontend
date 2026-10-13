"use client";

import { Agentation } from "agentation";

// Keep the toolbar off the public storefront. Enable it for local development
// or the protected VPS preview by setting NEXT_PUBLIC_AGENTATION_ENABLED=true.
// No endpoint is supplied yet: feedback stays in the reviewer’s browser until
// they copy/send it to the team, avoiding failed localhost MCP requests.
export default function AgentationToolbar() {
  const enabled =
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_AGENTATION_ENABLED === "true";

  if (!enabled) return null;

  return <Agentation />;
}
