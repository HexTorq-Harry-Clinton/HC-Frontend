/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    qualities: [50, 75, 100],
    remotePatterns: [
      { protocol: "https", hostname: "git-pipeline.metatronhost.in", pathname: "/**" },
      { protocol: "https", hostname: "dev.dine360.ca", pathname: "/**" },
      { protocol: "https", hostname: "harryclinton.in", pathname: "/**" },
      { protocol: "https", hostname: "www.harryclinton.in", pathname: "/**" },
      // Placeholder seed imagery used by existing product media; without this
      // the optimizer rejects these URLs (400 INVALID_IMAGE_OPTIMIZE_REQUEST)
      // and the photos never appear.
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; " +
              "script-src 'self' 'unsafe-inline'; " +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' https: data: blob:; " +
              "media-src 'self' https: blob:; " +
              "font-src 'self' data:; " +
              "connect-src 'self' https:; " +
              "object-src 'none'; " +
              "frame-ancestors 'none';",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
