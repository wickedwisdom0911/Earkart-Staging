import { ErpEmployeeRowSchema, type ErpEmployeeRow } from "@/models/erp-team.model";

function extractArray(json: unknown): unknown[] {
  if (Array.isArray(json)) return json;
  if (json && typeof json === "object") {
    const o = json as Record<string, unknown>;
    if (Array.isArray(o.data)) return o.data;
    for (const key of ["employees", "items", "results", "records"]) {
      const arr = o[key];
      if (Array.isArray(arr)) return arr;
    }
    const inner = o.data;
    if (inner && typeof inner === "object" && Array.isArray((inner as Record<string, unknown>).data)) {
      return (inner as { data: unknown[] }).data;
    }
  }
  return [];
}

export function parseErpEmployeesResponse(json: unknown): ErpEmployeeRow[] {
  const rows = extractArray(json);
  const out: ErpEmployeeRow[] = [];
  for (const row of rows) {
    const p = ErpEmployeeRowSchema.safeParse(row);
    if (p.success) out.push(p.data);
  }
  return out;
}

export function erpEmployeeRowId(r: ErpEmployeeRow): string {
  return (r.id || r.employeeId || r.userId || "").trim();
}

function pickFirstString(o: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

/** Human-readable label only — never use this as centre.managerId. */
export function erpEmployeeRowDisplayName(r: ErpEmployeeRow): string {
  const o = r as Record<string, unknown>;
  const fromFlat =
    r.fullName ||
    r.name ||
    [r.firstName, r.lastName].filter(Boolean).join(" ") ||
    r.email ||
    r.employeeName ||
    r.displayName ||
    r.userName ||
    r.full_name ||
    r.employee_name ||
    pickFirstString(o, [
      "Name",
      "FullName",
      "employeeName",
      "displayName",
      "userName",
      "username",
      "contactName",
      "personName",
      "legalName",
    ]);

  if (fromFlat) return fromFlat;

  for (const nestedKey of ["user", "profile", "employee", "contact"]) {
    const nested = o[nestedKey];
    if (!nested || typeof nested !== "object") continue;
    const n = nested as Record<string, unknown>;
    const nestedName =
      pickFirstString(n, [
        "name",
        "fullName",
        "firstName",
        "displayName",
        "userName",
        "email",
        "Name",
        "FullName",
      ]) ||
      [n["firstName"], n["lastName"]]
        .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
        .join(" ");
    if (nestedName) return nestedName;
  }

  return erpEmployeeRowId(r);
}

export function erpEmployeeRowLabel(r: ErpEmployeeRow, designationLabel: string): string {
  const name = erpEmployeeRowDisplayName(r);
  return `${name} (${designationLabel})`;
}

export type CentreManagerOption = { id: string; label: string };

export function mergeErpEmployeesByDesignation(
  pairs: { designation: string; json: unknown }[]
): CentreManagerOption[] {
  const seen = new Set<string>();
  const options: CentreManagerOption[] = [];
  for (const { designation, json } of pairs) {
    const rows = parseErpEmployeesResponse(json);
    for (const row of rows) {
      const id = erpEmployeeRowId(row);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      options.push({ id, label: erpEmployeeRowLabel(row, designation) });
    }
  }
  return options.sort((a, b) => a.label.localeCompare(b.label));
}
