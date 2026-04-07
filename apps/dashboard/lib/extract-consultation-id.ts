/** Normalize consultation id from various socket payloads (full object, nested consultation, or ids only). */
export function extractConsultationIdFromSocketPayload(data: unknown): string | undefined {
  if (typeof data === "string" && data.length > 0) return data;
  if (data == null || typeof data !== "object") return undefined;
  const d = data as Record<string, unknown>;
  const nested = d.consultation;
  if (nested && typeof nested === "object") {
    const id = (nested as { id?: string }).id;
    if (typeof id === "string" && id.length > 0) return id;
  }
  if (typeof d.id === "string" && d.id.length > 0) return d.id;
  if (typeof d.consultationId === "string" && d.consultationId.length > 0) return d.consultationId;
  if (typeof d.roomId === "string" && d.roomId.length > 0) return d.roomId;
  return undefined;
}
