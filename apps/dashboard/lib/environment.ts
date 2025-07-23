"use server";

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

export async function getBaseUrl() {
  const isProd = await isProduction();

  if (isProd) {
    const prodUrl =
      process.env.BASE_API_URL_PROD || "http://65.2.163.137:3000/api/v1/";
    console.log("🔵 Using production API URL:", prodUrl);
    return prodUrl;
  } else {
    const devUrl =
      process.env.BASE_API_URL_DEV || "http://localhost:3000/api/v1/";
    console.log("🔵 Using development API URL:", devUrl);
    return devUrl;
  }
}

export async function getSocketUrl() {
  const isProd = await isProduction();

  if (isProd) {
    // Convert HTTP URL to WebSocket URL
    const httpUrl =
      process.env.BASE_SOCKET_URL_PROD || "http://65.2.163.137:3000/";
    const wsUrl = httpUrl.replace(/^http/, "ws");
    console.log("🔵 Using production WebSocket URL:", wsUrl);
    return wsUrl;
  } else {
    // Convert HTTP URL to WebSocket URL
    const httpUrl = process.env.BASE_SOCKET_URL_DEV || "http://localhost:3000/";
    const wsUrl = httpUrl.replace(/^http/, "ws");
    console.log("🔵 Using development WebSocket URL:", wsUrl);
    return wsUrl;
  }
}
