const backend = process.env.BACKEND_URL || "http://127.0.0.1:8000";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath,
  allowedDevOrigins: [
    "172.18.0.1",
    "172.18.0.1:3000",
    "localhost",
    "localhost:3000",
    "127.0.0.1",
    "127.0.0.1:3000",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.arvanstorage.ir",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.arvanstorage.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
      { source: "/static/:path*", destination: `${backend}/static/:path*` },
    ];
  },
};

export default nextConfig;
