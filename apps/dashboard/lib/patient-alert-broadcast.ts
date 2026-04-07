/**
 * Cross-tab sync for patient alert sound/state (BroadcastChannel).
 * Same-tab CustomEvent does not reach other tabs; consultation routes post here
 * so the dashboard tab can stop audio / resolve alerts.
 */
export const PATIENT_ALERT_BROADCAST_CHANNEL = "patient-alert-sync";

export type PatientAlertBroadcastMessage =
  | { type: "STOP_SOUND" }
  | { type: "RESOLVE_CONSULTATION"; consultationId: string }
  | { type: "RESOLVE_ALL" };

/** Fire-and-forget post (e.g. from consultation layout which has no PatientAlertProvider). */
export function postPatientAlertBroadcast(message: PatientAlertBroadcastMessage): void {
  if (typeof window === "undefined") return;
  try {
    const ch = new BroadcastChannel(PATIENT_ALERT_BROADCAST_CHANNEL);
    ch.postMessage(message);
    ch.close();
  } catch {
    // BroadcastChannel unsupported or blocked
  }
}
