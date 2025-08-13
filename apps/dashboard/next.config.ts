import type { NextConfig } from "next";
import dotenv from "dotenv";
dotenv.config();

const nextConfig: NextConfig = {
  env: {
    IS_PRODUCTION: process.env.IS_PRODUCTION,
    BASE_API_URL_PROD: process.env.BASE_API_URL_PROD,
    BASE_API_URL_DEV: process.env.BASE_API_URL_DEV,
    SESSION_SECRET: process.env.SESSION_SECRET,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRE: process.env.JWT_EXPIRE,
    COOKIE_EXPIRE: process.env.COOKIE_EXPIRE,
    BASE_SOCKET_URL_PROD: process.env.BASE_SOCKET_URL_PROD,
    BASE_SOCKET_URL_DEV: process.env.BASE_SOCKET_URL_DEV,
  },
  typescript: {
    // Disable type checking during build for faster deployments
    ignoreBuildErrors: true,
  },
  eslint: {
    // Disable ESLint during build for faster deployments
    ignoreDuringBuilds: true,
  },

  // Security headers (permissive for development)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "connect-src * 'self' http://192.168.1.172:3000 ws://192.168.1.172:3000 wss: ws: https://*.agora.io https://*.agoraio.cn https://webrtc2-ap-web-1.agora.io https://webrtc2-2.ap.sd-rtn.com",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self' data:",
              "media-src 'self' data: blob:"
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
