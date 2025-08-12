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
  try {
  const isProd = await isProduction();

  if (isProd) {
      const socketUrl = process.env.BASE_SOCKET_URL_PROD || "http://65.2.163.137:3000/";
      console.log("🔵 Using production Socket URL:", socketUrl);
      return socketUrl;
  } else {
      const socketUrl = process.env.BASE_SOCKET_URL_DEV || "http://192.168.1.172:3000/";
      console.log("🔵 Using development Socket URL:", socketUrl);
      return socketUrl;
    }
  } catch (error) {
    console.error("Failed to get socket URL:", error);
    // Return a default URL if something goes wrong
    return "http://192.168.1.172:3000/";
  }
}
