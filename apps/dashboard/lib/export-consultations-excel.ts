import * as XLSX from "xlsx";
import { format } from "date-fns";
import type { ConsultationModelData } from "@/models/consultation.model";

const TEST_NAMES: Record<string, string> = {
  audiometry: "Pure Tone Audiometry",
  tympanometry: "Tympanometry",
  oae: "Otoacoustic Emissions",
  otoscopy: "Video Otoscopy",
  etfIntact: "ETF Intact",
  toneDecay: "Tone Decay Test",
  reflexometry: "Acoustic Reflex Test",
};

function getTestCompletionTime(test: any): string {
  if (!test) return "";
  const date = test.updatedAt || test.createdAt;
  if (!date) return "";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    return format(d, "dd/MM/yyyy HH:mm");
  } catch {
    return "";
  }
}

function isTestDone(test: any): boolean {
  if (!test || typeof test !== "object") return false;
  // Check status
  if (test.status === "COMPLETED") return true;
  // Check for data arrays
  const hasData =
    (Array.isArray(test.earTests) && test.earTests.length > 0) ||
    (Array.isArray(test.responses) && test.responses.length > 0) ||
    (Array.isArray(test.readings) && test.readings.length > 0) ||
    (Array.isArray(test.curves) && test.curves.length > 0) ||
    (Array.isArray(test.acTests) && test.acTests.length > 0) ||
    (Array.isArray(test.bcTests) && test.bcTests.length > 0) ||
    (Array.isArray(test.images) && test.images.length > 0) ||
    (Array.isArray(test.frequencyResponses) && test.frequencyResponses?.length > 0);
  return hasData;
}

function getTestsDone(consultation: ConsultationModelData): {
  tests: string;
  testTimes: string;
} {
  const testKeys = [
    "audiometry",
    "tympanometry",
    "oae",
    "otoscopy",
    "etfIntact",
    "toneDecay",
    "reflexometry",
  ] as const;

  const doneTests: string[] = [];
  const doneTimes: string[] = [];

  for (const key of testKeys) {
    const test = (consultation as any)[key];
    if (isTestDone(test)) {
      doneTests.push(TEST_NAMES[key] || key);
      const time = getTestCompletionTime(test);
      doneTimes.push(time ? `${TEST_NAMES[key] || key}: ${time}` : "");
    }
  }

  return {
    tests: doneTests.join("; "),
    testTimes: doneTimes.filter(Boolean).join(" | "),
  };
}

export function exportConsultationsToExcel(consultations: ConsultationModelData[]) {
  const rows = consultations.map((c) => {
    const { tests, testTimes } = getTestsDone(c);
    const consultationDate = c.createdAt
      ? format(new Date(c.createdAt), "dd/MM/yyyy HH:mm")
      : "";

    return {
      "Consultation Date": consultationDate,
      Status: c.status || "",
      "Patient Name": c.patient?.name || "",
      "Patient Contact": c.patient?.contactNumber || "",
      "Patient Code": (c.patient as any)?.code || "",
      "Centre Name": c.centre?.user?.name || c.centre?.name || "",
      "Centre Email": (c.centre as any)?.user?.email || (c.centre as any)?.email || "",
      "Centre Address": (c.centre as any)?.address || "",
      "Centre Contact": (c.centre as any)?.contactNumber || "",
      "Audiologist Name": c.audiologist?.user?.name || "",
      "Audiologist RCI": c.audiologist?.rciNumber || "",
      "Tests Done": tests,
      "Test Completion Times": testTimes,
      Notes: c.notes || "",
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Auto-size columns
  const headers = Object.keys(rows[0] || {});
  const colWidths = headers.map((header, i) => {
    const maxCellLen = Math.max(
      ...rows.map((r) => String(Object.values(r)[i] || "").length),
      header.length
    );
    return { wch: Math.max(12, Math.min(50, maxCellLen)) };
  });
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Consultations");

  const fileName = `consultations-export-${format(new Date(), "yyyy-MM-dd-HHmm")}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
