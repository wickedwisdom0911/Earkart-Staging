"use client";
import { useGetConsultation } from "@/hooks/consultation/use-get-consultation";
import { ConsultationModelData } from "@/models/consultation.model";
import { useParams } from "next/navigation";
import { Ear, TympType } from "@/models/enums";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";

interface TympanogramPoint {
  pressure: number;
  compliance: number;
  compensatedCompliance?: number;
  ear: "L" | "R";
}

interface TympanogramGraphProps {
  realTimeData: TympanogramPoint[];
  finalData: TympanogramPoint[];
  isTestCompleted: boolean;
  selectedEar: "L" | "R";
  pressureMax: number;
  pressureMin: number;
  complianceMax: number;
  complianceMin: number;
}

const TympanogramGraph: React.FC<TympanogramGraphProps> = ({
  realTimeData,
  finalData,
  isTestCompleted,
  selectedEar,
  pressureMax,
  pressureMin,
  complianceMax,
  complianceMin,
}) => {
  const data = isTestCompleted ? finalData : realTimeData;
  const color = selectedEar === "L" ? "#3B82F6" : "#EF4444";

  // If no data, show placeholder
  if (!data || data.length === 0) {
    return (
      <div className="border rounded p-4">
        <div className="h-[400px] relative">
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-lg font-medium">No Tympanogram Data</p>
              <p className="text-sm">Tympanogram data not available</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded p-4">
      <div className="h-[400px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 20, bottom: 20, left: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="pressure"
              domain={[200, -400]}
              ticks={[200, 100, 0, -100, -200, -300, -400]}
              tickFormatter={(value: number) => `${value}`}
              label={{ value: "Pressure (daPa)", position: "bottom" }}
              type="number"
              scale="linear"
            />
            <YAxis
              domain={[0, 2]}
              tickCount={5}
              tickFormatter={(value: number) => value.toFixed(1)}
              label={{ value: "Compliance (ml)", angle: -90, position: "left" }}
            />
            <Tooltip
              formatter={(value: number) => [
                `${value.toFixed(2)} ml`,
                "Compensated Compliance",
              ]}
              labelFormatter={(label: number) => `Pressure: ${label} daPa`}
            />
            <ReferenceArea
              x1={pressureMax}
              x2={pressureMin}
              y1={complianceMin}
              y2={complianceMax}
              fill={selectedEar === "L" ? "#e6f3ff" : "#ffebee"}
              stroke={selectedEar === "L" ? "#3B82F6" : "#EF4444"}
              strokeWidth={1.5}
              fillOpacity={0.3}
              isFront={false}
            />
            <Line
              type="monotone"
              dataKey="compensatedCompliance"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: color }}
              name="Compensated Compliance"
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default function TympanometryReportPage() {
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
      toast.success("Generating PDF...");
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

      const ratio = pdfWidth / imgWidth;
      const scaledWidth = pdfWidth;
      const scaledHeight = imgHeight * ratio;
      const pageCount = Math.ceil(scaledHeight / pdfHeight);

      for (let i = 0; i < pageCount; i++) {
        if (i > 0) {
          pdf.addPage();
        }

        pdf.addImage(
          imgData,
          "PNG",
          0,
          -i * pdfHeight,
          scaledWidth,
          scaledHeight
        );
      }

      pdf.save(
        `tympanometry-report-${consultationData?.patient?.code || "unknown"}.pdf`
      );
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const getTympTypeDescription = (type: TympType): string => {
    switch (type) {
      case TympType.A:
        return "Normal - Normal middle ear function";
      case TympType.As:
        return "Shallow - Reduced compliance, possible ossicular fixation";
      case TympType.Ad:
        return "Deep - High compliance, possible ossicular discontinuity";
      case TympType.B:
        return "Flat - No compliance peak, possible middle ear effusion or perforation";
      case TympType.C:
        return "Negative Pressure - Eustachian tube dysfunction";
      default:
        return "Unknown";
    }
  };

  const getEarLabel = (ear: Ear): string => {
    return ear === Ear.LEFT ? "Left Ear" : "Right Ear";
  };

  if (isLoading) return <div className="p-6">Loading report...</div>;
  if (error)
    return (
      <div className="p-6 text-red-500">
        Error loading report: {error.message}
      </div>
    );
  if (!consultation?.data)
    return <div className="p-6">No consultation data found</div>;

  const tympanometryData = consultationData.tympanometry;

  if (!tympanometryData) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-600 mb-4">
            No Tympanometry Data
          </h2>
          <p className="text-gray-500">
            No tympanometry test has been performed for this consultation.
          </p>
        </div>
      </div>
    );
  }

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
              Tympanometry Test Report
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

          {/* Tympanogram */}
          <div className="mb-8 bg-[#f8fafc] rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-[#1f2937] border-b pb-2">
              Tympanogram
            </h2>
            {tympanometryData.readings &&
            tympanometryData.readings.length > 0 ? (
              <div className="space-y-6">
                {tympanometryData.readings.map((reading, index) => {
                  // Create sample tympanogram data based on the reading
                  // In a real implementation, this would come from the actual test data
                  const peakPressure = reading.peakPressure;
                  const peakCompliance = reading.staticCompliance;

                  // Generate data points around the peak pressure
                  const generateTympanogramData = (): TympanogramPoint[] => {
                    const data: TympanogramPoint[] = [];
                    const ear = reading.ear === Ear.LEFT ? "L" : "R";

                    // Generate points from 200 to -400 daPa
                    for (let pressure = 200; pressure >= -400; pressure -= 25) {
                      let compliance = 0;

                      // Create a bell curve centered at peak pressure
                      const distanceFromPeak = Math.abs(
                        pressure - peakPressure
                      );
                      const maxDistance = 200; // Maximum distance for significant compliance

                      if (distanceFromPeak <= maxDistance) {
                        // Bell curve formula: compliance = peak * exp(-(distance^2) / (2 * sigma^2))
                        const sigma = 100; // Controls the width of the curve
                        const normalizedDistance = distanceFromPeak / sigma;
                        compliance =
                          peakCompliance *
                          Math.exp(
                            -(normalizedDistance * normalizedDistance) / 2
                          );
                      }

                      // Add some baseline compliance for very low values
                      compliance = Math.max(compliance, 0.05);

                      data.push({
                        pressure,
                        compliance: compliance * 1.1, // Slightly higher for uncompensated
                        compensatedCompliance: compliance,
                        ear,
                      });
                    }

                    return data;
                  };

                  const sampleData = generateTympanogramData();

                  return (
                    <div key={index} className="border rounded-lg p-4 bg-white">
                      <h3 className="text-lg font-medium mb-3 text-[#374151]">
                        {getEarLabel(reading.ear)}
                      </h3>
                      <div className="w-full">
                        <TympanogramGraph
                          realTimeData={[]}
                          finalData={sampleData}
                          isTestCompleted={true}
                          selectedEar={reading.ear === Ear.LEFT ? "L" : "R"}
                          pressureMax={200}
                          pressureMin={-400}
                          complianceMax={2.0}
                          complianceMin={0}
                        />
                      </div>
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-[#6b7280]">Peak Pressure:</span>
                          <p className="font-medium text-[#1f2937]">
                            {reading.peakPressure} daPa
                          </p>
                        </div>
                        <div>
                          <span className="text-[#6b7280]">
                            Static Compliance:
                          </span>
                          <p className="font-medium text-[#1f2937]">
                            {reading.staticCompliance.toFixed(2)} ml
                          </p>
                        </div>
                        <div>
                          <span className="text-[#6b7280]">
                            Ear Canal Volume:
                          </span>
                          <p className="font-medium text-[#1f2937]">
                            {reading.earCanalVolume.toFixed(2)} ml
                          </p>
                        </div>
                        <div>
                          <span className="text-[#6b7280]">Type:</span>
                          <p className="font-medium text-[#1f2937]">
                            {reading.tympType}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-white">
                <div className="w-full">
                  <TympanogramGraph
                    realTimeData={[]}
                    finalData={[]}
                    isTestCompleted={true}
                    selectedEar="L"
                    pressureMax={200}
                    pressureMin={-400}
                    complianceMax={2.0}
                    complianceMin={0}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Test Results */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-[#1f2937] border-b pb-2">
              Test Results
            </h2>

            {tympanometryData.readings &&
            tympanometryData.readings.length > 0 ? (
              <div className="bg-[#f8fafc] rounded-lg p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[#e5e7eb]">
                    <thead className="bg-white">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                          Ear
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                          Peak Pressure (daPa)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                          Static Compliance (ml)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                          Ear Canal Volume (ml)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                          Tympanogram Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                          Interpretation
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-[#e5e7eb]">
                      {tympanometryData.readings.map((reading, index) => (
                        <tr
                          key={index}
                          className={
                            index % 2 === 0 ? "bg-white" : "bg-[#f8fafc]"
                          }
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-[#1f2937]">
                            {getEarLabel(reading.ear)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-[#1f2937]">
                            {reading.peakPressure}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-[#1f2937]">
                            {reading.staticCompliance.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-[#1f2937]">
                            {reading.earCanalVolume.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-[#1f2937]">
                            <span className="font-medium">
                              {reading.tympType}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[#1f2937]">
                            <div className="max-w-xs">
                              {getTympTypeDescription(reading.tympType)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No reading data available</p>
              </div>
            )}
          </div>

          {/* Test Notes */}
          {tympanometryData.notes && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-[#1f2937] border-b pb-2">
                Test Notes
              </h2>
              <div className="bg-[#f8fafc] rounded-lg p-6">
                <p className="text-[#1f2937] whitespace-pre-wrap">
                  {tympanometryData.notes}
                </p>
              </div>
            </div>
          )}

          {/* Test Status */}
          <div className="text-right space-y-1 bg-[#f8fafc] rounded-lg p-6">
            <p className="text-[#4b5563]">
              Status:{" "}
              <span className="font-medium text-[#1f2937]">
                {tympanometryData.status}
              </span>
            </p>
            <p className="text-[#4b5563]">
              Test Date:{" "}
              <span className="font-medium text-[#1f2937]">
                {format(new Date(tympanometryData.createdAt), "PPP")}
              </span>
            </p>
            <p className="text-[#4b5563]">
              Last Updated:{" "}
              <span className="font-medium text-[#1f2937]">
                {format(new Date(tympanometryData.updatedAt), "PPP")}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
