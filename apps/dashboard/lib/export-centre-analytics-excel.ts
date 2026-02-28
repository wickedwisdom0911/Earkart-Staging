import * as XLSX from "xlsx";
import { format } from "date-fns";

export interface CentreExportRow {
  "Centre Name": string;
  Code: string;
  Location: string;
  Contact: string;
  "ENT Name": string;
  Assistant: string;
  "Our Assistant": string;
  "Device Code": string;
  "Total Consultations": number;
  Completed: number;
  "In Progress": number;
  Pending: number;
  Failed: number;
  Cancelled: number;
  PTA: number;
  Tympanometry: number;
  OAE: number;
  ETF: number;
  "Tone Decay": number;
  Reflexometry: number;
  Otoscopy: number;
}

export function exportCentreAnalyticsToExcel(rows: CentreExportRow[], label: string) {
  const worksheet = XLSX.utils.json_to_sheet(rows);

  const colWidths = [
    { wch: 25 }, { wch: 12 }, { wch: 18 }, { wch: 14 }, { wch: 18 }, { wch: 15 },
    { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 8 },
    { wch: 8 }, { wch: 8 }, { wch: 10 }, { wch: 6 }, { wch: 12 }, { wch: 6 },
    { wch: 6 }, { wch: 10 }, { wch: 12 }, { wch: 8 },
  ];
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Centre Analytics");

  const fileName = `centre-analytics-${label}-${format(new Date(), "yyyy-MM-dd")}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
