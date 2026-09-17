// Dependency-free HTML sanitizer for API-supplied rich text.
//
// Why no DOMPurify here: isomorphic-dompurify pulls jsdom into the server
// bundle, and jsdom's html-encoding-sniffer does require() on an ESM-only
// module (@exodus/bytes). That throws ERR_REQUIRE_ESM inside Vercel's
// serverless runtime at MODULE LOAD time, which 500s every SSR route that
// transitively imports this file (product pages, FAQs, legal, ticker).
// This implementation covers our actual threat model — admin-entered
// descriptions/answers rendered via dangerouslySetInnerHTML — with plain
// string rules and zero imports.

const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "s",
  "ul", "ol", "li", "a",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "blockquote", "span", "div",
]);

const ALLOWED_ATTRS = new Set(["href", "target", "rel", "title"]);

function cleanAnchorAttrs(attrString) {
  const out = [];
  const re = /([a-zA-Z-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let m;
  while ((m = re.exec(attrString)) !== null) {
    const name = m[1].toLowerCase();
    if (!ALLOWED_ATTRS.has(name)) continue;
    let value = m[2] ?? m[3] ?? m[4] ?? "";
    if (name === "href" && /^\s*(javascript|data|vbscript)\s*:/i.test(value)) continue;
    value = value.replace(/"/g, "&quot;");
    out.push(`${name}="${value}"`);
  }
  return out.length > 0 ? " " + out.join(" ") : "";
}

export function sanitizeHtml(dirty) {
  if (!dirty || typeof dirty !== "string") return "";
  let html = dirty;
  // 1. Drop whole dangerous blocks (scripts, styles, frames, forms, embeds).
  html = html.replace(/<(script|style|iframe|object|embed|link|meta|base|form|noscript|template)[\s\S]*?<\/\1\s*>/gi, "");
  html = html.replace(/<\/?(script|style|iframe|object|embed|link|meta|base|form|noscript|template)[^>]*>/gi, "");
  // 2. Strip event-handler attributes (onclick=, onerror=, ...).
  html = html.replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  // 3. Neutralize javascript:/data: URLs in any remaining attribute.
  html = html.replace(/(href|src|xlink:href)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi, (full, attr, _q, d, s, u) => {
    const value = d ?? s ?? u ?? "";
    if (/^\s*(javascript|data|vbscript)\s*:/i.test(value)) return `${attr}="#"`;
    return full;
  });
  // 4. Keep whitelisted tags (cleaning <a> attrs), drop all other tags but
  // keep their inner text.
  html = html.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (full, tag, attrs) => {
    const name = tag.toLowerCase();
    if (!ALLOWED_TAGS.has(name)) return "";
    const isClose = full.startsWith("</");
    if (isClose) return `</${name}>`;
    const selfClose = /\/\s*>$/.test(full);
    if (name === "a") return `<a${cleanAnchorAttrs(attrs)}${selfClose ? " /" : ""}>`;
    if (name === "br") return "<br>";
    return `<${name}>`;
  });
  return html;
}
