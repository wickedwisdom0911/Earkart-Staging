"use client";
import React, { useRef } from "react";
import { useGetConsultation } from "@/hooks/consultation/use-get-consultation";
import { ConsultationModelData } from "@/models/consultation.model";
import { useParams } from "next/navigation";
import { Ear } from "@/models/enums";
import PureToneGraph from "../../pure-tone/_components/audiogram";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
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

interface PTAAverage {
  leftEar: number | null;
  rightEar: number | null;
}

export default function ReportPage() {
  const { consultationId } = useParams();
  const { data: consultation, isLoading, error } = useGetConsultation(consultationId as string);
  const consultationData = consultation?.data as ConsultationModelData;
  const reportRef = useRef<HTMLDivElement>(null);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!consultationData) return <div>No data</div>;

const allResults: TestResult[] = [
  ...(consultationData.audiometry?.acTests?.map(t => ({
    ear: t.ear === Ear.LEFT ? "L" : "R",
    x: t.frequencyHz,
    y: t.thresholdDb,
    mode: "AC",
    masking: t.maskingUsed ? (t.maskingEar === Ear.LEFT ? 1 : 2) : 0,
    noResponse: (t.response === false) ? 1 : 0, // Only explicit false = no response
    signalType: "Steady",
    pulsed: false,
  })) || []),
  ...(consultationData.audiometry?.bcTests?.map(t => ({
    ear: t.ear === Ear.LEFT ? "L" : "R",
    x: t.frequencyHz,
    y: t.thresholdDb,
    mode: "BC",
    masking: t.maskingUsed ? 1 : 0,
    noResponse: (t.response === false) ? 1 : 0, // Only explicit false = no response
    signalType: "Steady",
    pulsed: false,
  })) || []),
];
  // Calculate PTA averages for AC and BC
  const calculatePTAAverage = (testType: 'AC' | 'BC'): PTAAverage => {
    const ptaFrequencies = [500, 1000, 2000, 4000];
    
    const leftEarThresholds: number[] = [];
    const rightEarThresholds: number[] = [];
    
    ptaFrequencies.forEach(freq => {
      const leftTest = allResults.find(t => t.x === freq && t.ear === "L" && t.mode === testType);
      const rightTest = allResults.find(t => t.x === freq && t.ear === "R" && t.mode === testType);
      
      if (leftTest) leftEarThresholds.push(leftTest.y);
      if (rightTest) rightEarThresholds.push(rightTest.y);
    });
    
    const leftAverage = leftEarThresholds.length > 0 
      ? leftEarThresholds.reduce((sum, val) => sum + val, 0) / leftEarThresholds.length 
      : null;
    
    const rightAverage = rightEarThresholds.length > 0 
      ? rightEarThresholds.reduce((sum, val) => sum + val, 0) / rightEarThresholds.length 
      : null;
    
    return {
      leftEar: leftAverage,
      rightEar: rightAverage
    };
  };

  const acAverage = calculatePTAAverage('AC');
  const bcAverage = calculatePTAAverage('BC');

  const formatAverage = (average: number | null): string => {
    return average !== null ? `${average.toFixed(1)} dB HL` : 'N/A';
  };


  
  const leftResults = allResults.filter(r => r.ear === "L");
  const rightResults = allResults.filter(r => r.ear === "R");

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: "#fff" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: "a4" });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();
    const ratio = pdfW / canvas.width;
    const hScaled = canvas.height * ratio;
    const pageCount = Math.ceil(hScaled / pdfH);

    for (let i = 0; i < pageCount; i++) {
      if (i) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, -i * pdfH, pdfW, hScaled);
    }
    pdf.save(`audiometry-report-${consultationData.patient?.code || "unknown"}.pdf`);
  };

  return (
    <div className="p-6 flex justify-center bg-gray-100 min-h-screen">
      <div className="w-[794px] bg-white shadow-lg">
        <div className="flex justify-end p-4 border-b">
          <Button onClick={handleDownloadPDF} className="bg-blue-600 hover:bg-blue-700 text-white">
            Download PDF
          </Button>
        </div>
        <div ref={reportRef} data-ref="report-content" className="p-8">
          <div className="text-center mb-6 border-b pb-4">
            <h1 className="text-3xl font-bold mb-2 text-gray-800">
              {consultationData.centre?.user?.name}
            </h1>
            <div className="text-gray-600 text-sm">
              <span className="font-medium">{consultationData.centre?.code}</span>
              <span className="mx-2">•</span>
              <span>{consultationData.centre?.address}</span>
              <span className="mx-2">•</span>
              <span>Contact: {consultationData.centre?.contactNumber}</span>
            </div>
          </div>

          <div className="text-center mb-8 border-b pb-6">
            <h2 className="text-xl font-bold mb-2 text-gray-800">
              Pure Tone Audiometry Report
            </h2>
            <p className="text-gray-600">
              Date: {format(new Date(consultationData.createdAt), "PPP")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-2 text-gray-800 border-b pb-1">Patient Information</h2>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-600 text-xs">Patient Name</p>
                  <p className="font-medium text-gray-800">{consultationData.patient?.name}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-xs">Patient Code</p>
                  <p className="font-medium text-gray-800">{consultationData.patient?.code}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-xs">Contact Number</p>
                  <p className="font-medium text-gray-800">{consultationData.patient?.contactNumber}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-xs">Gender</p>
                  <p className="font-medium text-gray-800">{consultationData.patient?.gender}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-xs">Date of Birth</p>
                  <p className="font-medium text-gray-800">
                    {consultationData.patient?.dob
                      ? format(parseISO(consultationData.patient.dob), "PPP")
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-xs">Address</p>
                  <p className="font-medium text-gray-800">{consultationData.patient?.address}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-2 text-gray-800 border-b pb-1">Audiologist Information</h2>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-600 text-xs">Name</p>
                  <p className="font-medium text-gray-800">{consultationData.audiologist?.user?.name}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-xs">RCI Number</p>
                  <p className="font-medium text-gray-800">{consultationData.audiologist?.rciNumber}</p>
                </div>
              </div>
            </div>
          </div>

          {/* PTA Averages Section */}
          <div className="mb-6 bg-blue-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Pure Tone Averages (PTA)</h2>
            <p className="text-sm text-gray-600 mb-4">Average of 500Hz, 1kHz, 2kHz, and 4kHz frequencies</p>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-4">
                <h3 className="text-lg font-medium mb-3 text-gray-700">Air Conduction (AC)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 text-sm">Left Ear</p>
                    <p className="font-bold text-lg text-gray-800">{formatAverage(acAverage.leftEar)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Right Ear</p>
                    <p className="font-bold text-lg text-gray-800">{formatAverage(acAverage.rightEar)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4">
                <h3 className="text-lg font-medium mb-3 text-gray-700">Bone Conduction (BC)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 text-sm">Left Ear</p>
                    <p className="font-bold text-lg text-gray-800">{formatAverage(bcAverage.leftEar)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Right Ear</p>
                    <p className="font-bold text-lg text-gray-800">{formatAverage(bcAverage.rightEar)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Audiograms */}
          <div className="mb-8 bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
              Audiograms
            </h2>
            
            {/* Left Ear Audiogram */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 text-blue-600">Left Ear</h3>
              <div className="border rounded-lg p-4 bg-white">
                <div className="w-full">
                  <PureToneGraph
                    resultMarkings={leftResults}
                    selectedLabelIndexes={{ x: 0, y: 0 }}
                    onIndexChange={() => {}}
                    width={700}
                    height={350}
                    axisFontSize={10}
                  />
                </div>
              </div>
            </div>

            {/* Right Ear Audiogram */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 text-red-600">Right Ear</h3>
              <div className="border rounded-lg p-4 bg-white">
                <div className="w-full">
                  <PureToneGraph
                    resultMarkings={rightResults}
                    selectedLabelIndexes={{ x: 0, y: 0 }}
                    onIndexChange={() => {}}
                    width={700}
                    height={350}
                    axisFontSize={10}
                  />
                </div>
              </div>
            </div>

            {/* Combined Audiogram for Reference */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 text-gray-700">Combined View</h3>
              <div className="border rounded-lg p-4 bg-white">
                <div className="w-full">
                  <PureToneGraph
                    resultMarkings={allResults}
                    selectedLabelIndexes={{ x: 0, y: 0 }}
                    onIndexChange={() => {}}
                    width={700}
                    height={350}
                    axisFontSize={10}
                  />
                </div>
              </div>
            </div>
            
            {/* Legend */}
            <div className="mt-4 bg-white rounded-lg p-4 border">
              <h3 className="text-sm font-semibold mb-3 text-gray-700">Symbol Legend (ASHA 1990)</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <h4 className="font-medium text-blue-600 mb-2">Air Conduction (AC)</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-red-500 text-lg">○</span>
                      <span>Right Ear (Unmasked)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-500 text-lg font-bold">×</span>
                      <span>Left Ear (Unmasked)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-red-500 text-lg">△</span>
                      <span>Right Ear (Masked)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-500 text-lg">□</span>
                      <span>Left Ear (Masked)</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-600 mb-2">Bone Conduction (BC)</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-red-500 text-lg font-bold">&lt;</span>
                      <span>Right Ear (Unmasked)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-500 text-lg font-bold">&gt;</span>
                      <span>Left Ear (Unmasked)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-red-500 text-lg font-bold">[</span>
                      <span>Right Ear (Masked)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-500 text-lg font-bold">]</span>
                      <span>Left Ear (Masked)</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t text-xs text-gray-600">
                <span className="font-medium">No Response:</span> Arrows pointing down indicate no response at the maximum output level
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Test Results</h2>

            <div className="mb-6 bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium mb-3 text-gray-700">Air Conduction (AC)</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-white">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ear</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequency (Hz)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Threshold (dB HL)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Response</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Masking</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {consultationData.audiometry?.acTests?.map((test, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-6 py-4 text-gray-800">{test.ear === Ear.LEFT ? "Left" : "Right"}</td>
                        <td className="px-6 py-4 text-gray-800">{test.frequencyHz}</td>
                        <td className="px-6 py-4 text-gray-800">{test.thresholdDb}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            test.response 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {test.response ? 'Heard' : 'No Response'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-800">
                          {test.maskingUsed
                            ? test.maskingEar === Ear.LEFT ? "Left" : "Right"
                            : "None"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium mb-3 text-gray-700">Bone Conduction (BC)</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-white">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ear</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequency (Hz)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Threshold (dB HL)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Response</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Masking</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {consultationData.audiometry?.bcTests?.map((test, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-6 py-4 text-gray-800">{test.ear === Ear.LEFT ? "Left" : "Right"}</td>
                        <td className="px-6 py-4 text-gray-800">{test.frequencyHz}</td>
                        <td className="px-6 py-4 text-gray-800">{test.thresholdDb}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            test.response 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {test.response ? 'Heard' : 'No Response'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-800">{test.maskingUsed ? "Yes" : "No"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="text-right bg-gray-50 rounded-lg p-6">
            <p className="text-gray-600">Status: <span className="font-medium text-gray-800">{consultationData.audiometry?.status}</span></p>
            <p className="text-gray-600">
              Last Updated:{" "}
              <span className="font-medium text-gray-800">
                {format(
                  new Date(consultationData.audiometry?.updatedAt || consultationData.updatedAt),
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