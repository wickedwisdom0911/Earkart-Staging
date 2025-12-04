export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  LOCATIONS: "/dashboard/settings/locations",
  LANGUAGES: "/dashboard/settings/languages",
  DEVICES: "/dashboard/settings/devices",
  QUESTIONNAIRE : "/dashboard/settings/questionnaire" ,
  MDM: "/dashboard/mdm",
  STATES: (code: string) => `/dashboard/settings/locations/${code}/states`,
  DISTRICTS: (code: string, stateCode: string) =>
    `/dashboard/settings/locations/${code}/states/${stateCode}/districts`,
  CITIES: (code: string, stateCode: string, districtCode: string) =>
    `/dashboard/settings/locations/${code}/states/${stateCode}/districts/${districtCode}/cities`,
  DEVICE: (deviceCode: string) => `/dashboard/settings/devices/${deviceCode}`,
  CENTRE: (centreId: string) => `/dashboard/centres/${centreId}`,
  AUDIOLOGIST: (audiologistId: string) =>
    `/dashboard/audiologists/${audiologistId}`,
  AUDIOLOGIST_ANALYTICS: (audiologistId: string) =>
    `/dashboard/audiologists/${audiologistId}/analytics`,
  CONSULTATION: (consultationId: string) => `/consultation/${consultationId}`,
  CONSULTATION_TEST_SELECTION: (consultationId: string) =>
    `/consultation/${consultationId}/test-selection`,
  ANSWER_QUESTIONNAIRE: (consultationId : string)=> `/consultation/${consultationId}/answer-questionnaire`,
  CONSULTATION_TEST: (consultationId: string, testId: string) =>
    `/consultation/${consultationId}/test/${testId}`,
  AUDIOMETRY_TEST_REPORT: (consultationId: string) =>
    `/consultation/${consultationId}/test/report/audiometry`,
  TYM_REPORT: (consultationId: string) =>
    `/consultation/${consultationId}/test/report/tympanometry`,
  TONE_DECAY_REPORT: (consultationId: string) =>
    `/consultation/${consultationId}/test/report/tone-decay`,
  REFLEXOMETRY_REPORT: (consultationId: string) =>
    `/consultation/${consultationId}/test/report/reflexometry`,
};
