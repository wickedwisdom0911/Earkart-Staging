"use client";
import { useGetConsultation } from "@/hooks/consultation/use-get-consultation";
import { ConsultationModelData } from "@/models/consultation.model";
import { useParams } from "next/navigation";
import { Ear } from "@/models/enums";
import PureToneGraph from "../../pure-tone/_components/audiogram";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

interface TestResult {
  ear: string;
  x: number;
  y: number;
  mode: string;
  masking: number;
  noResponse: number;
  signalType: string;
  pulsed: boolean;
}

export default function ReportPage() {
  const { consultationId } = useParams();
  const {
    data: consultation,
    isLoading,
    error,
  } = useGetConsultation(consultationId as string);
  const consultationData = consultation?.data as ConsultationModelData;
  const reportRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          const element = clonedDoc.querySelector(
            '[data-ref="report-content"]'
          ) as HTMLElement;
          if (element) {
            element.style.width = "100%";
            element.style.height = "auto";
            element.style.padding = "20px";
          }
        },
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Calculate the ratio to fit the width of the page
      const ratio = pdfWidth / imgWidth;
      const scaledWidth = pdfWidth;
      const scaledHeight = imgHeight * ratio;

      // Calculate how many pages we need
      const pageCount = Math.ceil(scaledHeight / pdfHeight);

      // Add each page
      for (let i = 0; i < pageCount; i++) {
        if (i > 0) {
          pdf.addPage();
        }

        pdf.addImage(
          imgData,
          "PNG",
          0, // Start from left edge
          -i * pdfHeight,
          scaledWidth,
          scaledHeight
        );
      }

      pdf.save(
        `audiometry-report-${consultationData?.patient?.code || "unknown"}.pdf`
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  // Transform AC and BC tests to TestResult format for the audiogram
  const testResults: TestResult[] = [
    ...(consultationData?.audiometry?.acTests?.map((test) => ({
      ear: test.ear === Ear.LEFT ? "L" : "R",
      x: test.frequencyHz,
      y: test.thresholdDb,
      mode: "AC",
      masking: test.maskingUsed ? (test.maskingEar === Ear.LEFT ? 1 : 2) : 0,
      noResponse: 0,
      signalType: "Steady",
      pulsed: false,
    })) || []),
    ...(consultationData?.audiometry?.bcTests?.map((test) => ({
      ear: test.ear === Ear.LEFT ? "L" : "R",
      x: test.frequencyHz,
      y: test.thresholdDb,
      mode: "BC",
      masking: test.maskingUsed ? 1 : 0,
      noResponse: 0,
      signalType: "Steady",
      pulsed: false,
    })) || []),
  ];

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!consultationData) return <div>No data</div>;

  return (
    <div className="p-6 flex justify-center items-start min-h-screen bg-gray-100">
      <div className="w-[794px] bg-white shadow-lg">
        <div className="flex justify-end p-4 border-b">
          <Button
            onClick={handleDownloadPDF}
            className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white"
          >
            Download PDF
          </Button>
        </div>
        <div ref={reportRef} data-ref="report-content" className="p-8">
          {/* Centre Information */}
          <div className="text-center mb-6 border-b pb-4">
            <h1 className="text-3xl font-bold mb-2 text-[#1f2937]">
              {consultationData.centre?.user?.name}
            </h1>
            <div className="text-[#4b5563] text-sm">
              <span className="font-medium">
                {consultationData.centre?.code}
              </span>
              <span className="mx-2">•</span>
              <span>{consultationData.centre?.address}</span>
              <span className="mx-2">•</span>
              <span>Contact: {consultationData.centre?.contactNumber}</span>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8 border-b pb-6">
            <h2 className="text-xl font-bold mb-2 text-[#1f2937]">
              Pure Tone Audiometry Report
            </h2>
            <p className="text-[#4b5563]">
              Date: {format(new Date(consultationData.createdAt), "PPP")}
            </p>
          </div>

          {/* Patient and Audiologist Information */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Patient Information */}
            <div className="bg-[#f8fafc] rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-2 text-[#1f2937] border-b pb-1">
                Patient Information
              </h2>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-[#4b5563] text-xs">Patient Name</p>
                  <p className="font-medium text-[#1f2937]">
                    {consultationData.patient?.name}
                  </p>
                </div>
                <div>
                  <p className="text-[#4b5563] text-xs">Patient Code</p>
                  <p className="font-medium text-[#1f2937]">
                    {consultationData.patient?.code}
                  </p>
                </div>
                <div>
                  <p className="text-[#4b5563] text-xs">Contact Number</p>
                  <p className="font-medium text-[#1f2937]">
                    {consultationData.patient?.contactNumber}
                  </p>
                </div>
                <div>
                  <p className="text-[#4b5563] text-xs">Gender</p>
                  <p className="font-medium text-[#1f2937]">
                    {consultationData.patient?.gender}
                  </p>
                </div>
                <div>
                  <p className="text-[#4b5563] text-xs">Date of Birth</p>
                  <p className="font-medium text-[#1f2937]">
                    {consultationData.patient?.dob
                      ? format(parseISO(consultationData.patient.dob), "PPP")
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-[#4b5563] text-xs">Address</p>
                  <p className="font-medium text-[#1f2937]">
                    {consultationData.patient?.address}
                  </p>
                </div>
              </div>
            </div>

            {/* Audiologist Information */}
            <div className="bg-[#f8fafc] rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-2 text-[#1f2937] border-b pb-1">
                Audiologist Information
              </h2>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-[#4b5563] text-xs">Name</p>
                  <p className="font-medium text-[#1f2937]">
                    {consultationData.audiologist?.user?.name}
                  </p>
                </div>
                <div>
                  <p className="text-[#4b5563] text-xs">RCI Number</p>
                  <p className="font-medium text-[#1f2937]">
                    {consultationData.audiologist?.rciNumber}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Audiogram */}
          <div className="mb-8 bg-[#f8fafc] rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-[#1f2937] border-b pb-2">
              Audiogram
            </h2>
            <div className="border rounded-lg p-4 bg-white">
              <div className="w-full">
                <PureToneGraph
                  resultMarkings={testResults}
                  selectedLabelIndexes={{ x: 0, y: 0 }}
                  onIndexChange={() => {}}
                  width={600}
                  height={400}
                />
              </div>
            </div>
          </div>

          {/* Test Results */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-[#1f2937] border-b pb-2">
              Test Results
            </h2>

            {/* Air Conduction Results */}
            <div className="mb-6 bg-[#f8fafc] rounded-lg p-6">
              <h3 className="text-lg font-medium mb-3 text-[#374151]">
                Air Conduction (AC)
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#e5e7eb]">
                  <thead className="bg-white">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                        Ear
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                        Frequency (Hz)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                        Threshold (dB HL)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                        Masking
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[#e5e7eb]">
                    {consultationData.audiometry?.acTests?.map(
                      (test, index) => (
                        <tr
                          key={index}
                          className={
                            index % 2 === 0 ? "bg-white" : "bg-[#f8fafc]"
                          }
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-[#1f2937]">
                            {test.ear === Ear.LEFT ? "Left" : "Right"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-[#1f2937]">
                            {test.frequencyHz}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-[#1f2937]">
                            {test.thresholdDb}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-[#1f2937]">
                            {test.maskingUsed
                              ? test.maskingEar === Ear.LEFT
                                ? "Left"
                                : "Right"
                              : "None"}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bone Conduction Results */}
            <div className="bg-[#f8fafc] rounded-lg p-6">
              <h3 className="text-lg font-medium mb-3 text-[#374151]">
                Bone Conduction (BC)
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#e5e7eb]">
                  <thead className="bg-white">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                        Ear
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                        Frequency (Hz)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                        Threshold (dB HL)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                        Masking
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[#e5e7eb]">
                    {consultationData.audiometry?.bcTests?.map(
                      (test, index) => (
                        <tr
                          key={index}
                          className={
                            index % 2 === 0 ? "bg-white" : "bg-[#f8fafc]"
                          }
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-[#1f2937]">
                            {test.ear === Ear.LEFT ? "Left" : "Right"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-[#1f2937]">
                            {test.frequencyHz}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-[#1f2937]">
                            {test.thresholdDb}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-[#1f2937]">
                            {test.maskingUsed ? "Yes" : "No"}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Test Status */}
          <div className="text-right space-y-1 bg-[#f8fafc] rounded-lg p-6">
            <p className="text-[#4b5563]">
              Status:{" "}
              <span className="font-medium text-[#1f2937]">
                {consultationData.audiometry?.status}
              </span>
            </p>
            <p className="text-[#4b5563]">
              Last Updated:{" "}
              <span className="font-medium text-[#1f2937]">
                {format(
                  new Date(
                    consultationData.audiometry?.updatedAt ||
                      consultationData.updatedAt
                  ),
                  "PPP"
                )}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
