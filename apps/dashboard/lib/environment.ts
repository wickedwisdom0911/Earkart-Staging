"use server";
import { cookies } from "next/headers";

export async function isProduction(): Promise<boolean> {
  // Check multiple indicators of production environment
  const isProd =
    process.env.IS_PRODUCTION === "true" ||
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production";

  console.log("🔵 Environment check:", {
    IS_PRODUCTION: process.env.IS_PRODUCTION,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    isProduction: isProd,
  });

  return isProd;
}

export async function getBaseUrl(isAiimsOverride?: boolean) {
  const isProd = await isProduction();
  // Prefer explicit override from caller (e.g., client-sent value from localStorage)
  let isAiims = !!isAiimsOverride;
  // Fallback to cookie only if override not provided
  if (isAiimsOverride === undefined) {
    try {
      const cookieStore = await cookies();
      isAiims = cookieStore.get("isAiims")?.value === "true";
    } catch {}
  }

  if (isProd) {
    const prodUrl = isAiims
      ? process.env.BASE_API_URL_AIIMS_PROD || process.env.BASE_API_URL_PROD || "http://aiims.example.com/api/v1/"
      : process.env.BASE_API_URL_PROD || "http://65.2.163.137:3000/api/v1/";
    console.log("🔵 Using production API URL:", prodUrl, "(aiims:", isAiims, ")");
    return prodUrl;
  } else {
    const devUrl = isAiims
      ? process.env.BASE_API_URL_AIIMS_DEV || process.env.BASE_API_URL_DEV || "http://localhost:4000/api/v1/"
      : process.env.BASE_API_URL_DEV || "http://localhost:3000/api/v1/";
    console.log("🔵 Using development API URL:", devUrl, "(aiims:", isAiims, ")");
    return devUrl;
  }
}

export async function getSocketUrl(isAiimsOverride?: boolean) {
  try {
    const isProd = await isProduction();
    // Prefer explicit override; fallback to cookie if not provided
    let isAiims = !!isAiimsOverride;
    if (isAiimsOverride === undefined) {
      try {
        const cookieStore = await cookies();
        isAiims = cookieStore.get("isAiims")?.value === "true";
      } catch {}
    }

    if (isProd) {
      const socketUrl = isAiims
        ? process.env.BASE_SOCKET_URL_AIIMS_PROD || process.env.BASE_SOCKET_URL_PROD || "http://65.2.163.137:3000/"
        : process.env.BASE_SOCKET_URL_PROD || "http://65.2.163.137:3000/";
      console.log("🔵 Using production Socket URL:", socketUrl, "(aiims:", isAiims, ")");
      return socketUrl;
    } else {
      const socketUrl = isAiims
        ? process.env.BASE_SOCKET_URL_AIIMS_DEV || process.env.BASE_SOCKET_URL_DEV || "http://192.168.1.172:3000/"
        : process.env.BASE_SOCKET_URL_DEV || "http://192.168.1.172:3000/";
      console.log("🔵 Using development Socket URL:", socketUrl, "(aiims:", isAiims, ")");
      return socketUrl;
    }
  } catch (error) {
    console.error("Failed to get socket URL:", error);
    // Return a default URL if something goes wrong
    return "http://192.168.1.172:3000/";
  }
}
