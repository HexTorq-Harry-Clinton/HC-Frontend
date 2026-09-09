// Single local placeholder used across the storefront wherever product/media
// images are missing. Data-URI SVG — no external dependency, works offline.
// (Replaces the old https://via.placeholder.com/* URLs, that service is deprecated.)
export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500"><rect width="400" height="500" fill="#e9ecef"/><text x="200" y="250" font-family="Arial,sans-serif" font-size="20" fill="#6c757d" text-anchor="middle">Harry Clinton</text></svg>`
  );

export default PLACEHOLDER_IMAGE;
