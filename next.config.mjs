/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow v0.dev preview URLs in iframes
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-src 'self' https://*.v0.dev https://v0.dev;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
