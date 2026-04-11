/** Stable string for `<Link href>` — avoids undefined if ROUTES is partially loaded */
export const TRIAL_APPOINTMENTS_HREF = "/dashboard/trial-appointments";

export const ROUTES = {
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  OVERVIEW: "/dashboard/overview",
  ANALYTICS: "/dashboard/analytics",
  AUDIOLOGISTS: "/dashboard/audiologists",
  AUDIOLOGIST: (id: string) => `/dashboard/audiologists/${id}`,
  CENTRES: "/dashboard/centres",
  CENTRE: (centreId: string) => `/dashboard/centres/${centreId}`,
  EDIT_CENTRE: (centreId: string) => `/dashboard/centres/${centreId}`,
  LOCATIONS: "/dashboard/settings/locations",
  LANGUAGES: "/dashboard/settings/languages",
  DEVICES: "/dashboard/settings/devices",
  DEVICE: (codeOrId: string) => `/dashboard/settings/devices/${codeOrId || "unknown"}`,
  QUESTIONNAIRE: "/dashboard/settings/questionnaire",
  NRV: "/dashboard/settings/nrv",
  MDM: "/dashboard/mdm",
  USERS: "/dashboard/users",
  PATIENTS: "/dashboard/patients",
  APPOINTMENTS: "/dashboard/appointments",
  TRIAL_APPOINTMENTS: TRIAL_APPOINTMENTS_HREF,
  ALL_CONSULTATIONS: "/dashboard/all-consultations",
  ANSWER_QUESTIONNAIRE: (consultationId: string) => `/consultation/${consultationId}/answer-questionnaire`,
  CONSULTATION_TEST_SELECTION: (consultationId: string) => `/consultation/${consultationId}/test-selection`,
};
