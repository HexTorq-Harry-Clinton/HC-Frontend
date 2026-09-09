/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    qualities: [50, 75, 100],
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "15000", pathname: "/Uploads/**" },
      { protocol: "https", hostname: "dev.dine360.ca", pathname: "/**" },
      { protocol: "https", hostname: "harryclinton.in", pathname: "/**" },
      { protocol: "https", hostname: "www.harryclinton.in", pathname: "/**" },
    ],
  },
};

export default nextConfig;
