export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  LOCATIONS: "/dashboard/settings/locations",
  LANGUAGES: "/dashboard/settings/languages",
  DEVICES: "/dashboard/settings/devices",
  STATES: (code: string) => `/dashboard/settings/locations/${code}/states`,
  CITIES: (code: string, stateCode: string) =>
    `/dashboard/settings/locations/${code}/states/${stateCode}/cities`,
};
