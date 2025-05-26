export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  LOCATIONS: "/dashboard/settings/locations",
  LANGUAGES: "/dashboard/settings/languages",
  DEVICES: "/dashboard/settings/devices",
  STATES: (code: string) => `/dashboard/settings/locations/${code}/states`,
  CITIES: (code: string, stateCode: string) =>
    `/dashboard/settings/locations/${code}/states/${stateCode}/cities`,
  DISTRICTS: (code: string, stateCode: string, cityCode: string) =>
    `/dashboard/settings/locations/${code}/states/${stateCode}/cities/${cityCode}/districts`,
  DEVICE: (deviceCode: string) => `/dashboard/settings/devices/${deviceCode}`,
  CENTRE: (centreId: string) => `/dashboard/centres/${centreId}`,
};
