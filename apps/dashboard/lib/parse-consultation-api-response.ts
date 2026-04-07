/**
 * Normalizes list endpoints that may return:
 * - { data: Consultation[] }
 * - { data: { data: Consultation[], total, hasNext } }
 * - { data: { consultations: Consultation[], total, hasNext } }
 * - { success, data: ..., total, hasNext } (total at root)
 */
export function getConsultationListPayload(json: unknown): {
  list: unknown[];
  total: number;
  hasNext: boolean;
} {
  const root = json && typeof json === "object" ? (json as Record<string, unknown>) : {};
  const payload = root.data !== undefined ? root.data : root;

  let list: unknown[] = [];
  let total = 0;
  let hasNext = false;

  if (Array.isArray(payload)) {
    list = payload;
  } else if (payload && typeof payload === "object") {
    const p = payload as Record<string, unknown>;
    if (Array.isArray(p.data)) list = p.data as unknown[];
    else if (Array.isArray(p.consultations)) list = p.consultations as unknown[];
    if (typeof p.total === "number") total = p.total;
    if (typeof p.hasNext === "boolean") hasNext = p.hasNext;
  }

  if (typeof root.total === "number" && total === 0) total = root.total;
  if (typeof root.hasNext === "boolean") hasNext = root.hasNext;

  return { list, total, hasNext };
}
