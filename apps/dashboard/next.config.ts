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
};

export default nextConfig;
