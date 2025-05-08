// lib/environment.ts
"use server";
export async function isProduction(): Promise<boolean> {
  return process.env.IS_PRODUCTION === "true";
}
export default async function getBaseUrl() {
  return process.env.IS_PRODUCTION === "true"
    ? process.env.BASE_API_URL_PROD
    : process.env.BASE_API_URL_DEV;
}
