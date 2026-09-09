/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    qualities: [50, 75, 100],
    remotePatterns: [
      { protocol: "https", hostname: "git-pipeline.metatronhost.in", pathname: "/**" },
      { protocol: "https", hostname: "dev.dine360.ca", pathname: "/**" },
      { protocol: "https", hostname: "harryclinton.in", pathname: "/**" },
      { protocol: "https", hostname: "www.harryclinton.in", pathname: "/**" },
    ],
  },
};

export default nextConfig;
