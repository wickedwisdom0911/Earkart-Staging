"use server";

export async function isProduction(): Promise<boolean> {
  return process.env.IS_PRODUCTION === "true";
}

export async function getBaseUrl() {
  const isProd = await isProduction();
  return isProd 
    ? process.env.BASE_API_URL_PROD || "http://65.2.163.137:3000/api/v1/"
    : process.env.BASE_API_URL_DEV || "http://localhost:3000/api/v1/";
}

export async function getSocketUrl() {
  const isProd = await isProduction();
  return isProd
    ? process.env.BASE_SOCKET_URL_PROD || "http://65.2.163.137:3000/"
    : process.env.BASE_SOCKET_URL_DEV || "http://localhost:3000/";
}
