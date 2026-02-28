import * as XLSX from "xlsx";
import { format } from "date-fns";

export interface CentreDetailExportData {
  centreInfo: {
    name: string;
    code: string;
    deviceCode: string;
    location: string;
    contact: string;
    entName: string;
    assistant: string;
  };
  stats: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    cancelled: number;
    missedCalls: number;
    pta: number;
    tympanometry: number;
    oae: number;
    otoscopy: number;
    etf: number;
    toneDecay: number;
    reflexometry: number;
  };
  consultations: Array<{
    patient: string;
    contact: string;
    audiologist: string;
    status: string;
    dateTime: string;
    tests: string;
  }>;
}

export function exportCentreDetailToExcel(
  data: CentreDetailExportData,
  centreName: string,
  label: string
) {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Centre Info & Summary
  const infoRows = [
    ["Centre Name", data.centreInfo.name],
    ["Code", data.centreInfo.code],
    ["Device Code", data.centreInfo.deviceCode],
    ["Location", data.centreInfo.location],
    ["Contact", data.centreInfo.contact],
    ["ENT Name", data.centreInfo.entName],
    ["Assistant", data.centreInfo.assistant],
    [],
    ["Summary (date range)", ""],
    ["Total Consultations", data.stats.total],
    ["Completed", data.stats.completed],
    ["In Progress", data.stats.inProgress],
    ["Pending", data.stats.pending],
    ["Cancelled", data.stats.cancelled],
    ["Missed Calls", data.stats.missedCalls],
    [],
    ["Tests Done", ""],
    ["PTA", data.stats.pta],
    ["Tympanometry", data.stats.tympanometry],
    ["OAE", data.stats.oae],
    ["Otoscopy", data.stats.otoscopy],
    ["ETF", data.stats.etf],
    ["Tone Decay", data.stats.toneDecay],
    ["Reflexometry", data.stats.reflexometry],
  ];
  const infoSheet = XLSX.utils.aoa_to_sheet(infoRows);
  infoSheet["!cols"] = [{ wch: 22 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(workbook, infoSheet, "Summary");

  // Sheet 2: Consultations
  const consultationRows = [
    ["Patient", "Contact", "Audiologist", "Status", "Date & Time", "Tests"],
    ...data.consultations.map((c) => [
      c.patient,
      c.contact,
      c.audiologist,
      c.status,
      c.dateTime,
      c.tests,
    ]),
  ];
  const consultationSheet = XLSX.utils.aoa_to_sheet(consultationRows);
  consultationSheet["!cols"] = [{ wch: 25 }, { wch: 14 }, { wch: 20 }, { wch: 12 }, { wch: 18 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(workbook, consultationSheet, "Consultations");

  const safeName = centreName.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-_]/g, "");
  const fileName = `centre-detail-${safeName}-${label}-${format(new Date(), "yyyy-MM-dd")}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
