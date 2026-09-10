import DOMPurify from "isomorphic-dompurify";

// Sanitize API-supplied HTML before dangerouslySetInnerHTML.
// Whitelist: basic text formatting + links + lists. Strips scripts,
// event handlers (onclick=...), javascript: URLs, iframes/objects.
export function sanitizeHtml(dirty) {
  if (!dirty || typeof dirty !== "string") return "";
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "b", "em", "i", "u", "s",
      "ul", "ol", "li", "a",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "blockquote", "span", "div",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "title"],
    ALLOW_DATA_ATTR: false,
  });
}
