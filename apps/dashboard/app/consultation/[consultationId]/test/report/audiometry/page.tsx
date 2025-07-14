"use client";
import React, { useRef, useState } from "react";
import { useGetConsultation } from "@/hooks/consultation/use-get-consultation";
import { ConsultationModelData } from "@/models/consultation.model";
import { useParams } from "next/navigation";
import { Ear } from "@/models/enums";
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

// Professional Audiogram Chart Component
const AudiogramChart: React.FC<{
  title: string;
  results: TestResult[];
  ear: "L" | "R";
}> = ({ title, results, ear }) => {
  const frequencies = [125, 250, 500, 750, 1000, 1500, 2000, 3000, 4000, 6000, 8000];
  const mainFrequencies = [125, 250, 500, 1000, 2000, 4000, 8000];
  const midFrequencies = [750, 1500, 3000, 6000];
  const dbLevels = Array.from({ length: 27 }, (_, i) => (i - 2) * 5); // -10 to 120 dB
  
  const gridSize = 25;
  const width = frequencies.length * gridSize;
  const height = 14 * gridSize; // Adjust height to start from -10
  const margin = { top: 30, right: 20, bottom: 40, left: 50 };
  
  const COLORS = {
    leftEar: "#0000FF",
    rightEar: "#FF0000",
    grid: "#D0D0D0",
    midOctave: "#A0A0A0",
    background: "#FFFFFF",
    text: "#333333",
  };
  
  const getSymbolColor = (ear: string) => ear === "L" ? COLORS.leftEar : COLORS.rightEar;
  
  const renderSymbol = (result: TestResult, x: number, y: number) => {
    const color = getSymbolColor(result.ear);
    const size = 8;
    
    // Handle no response cases first
    if (result.noResponse === 1) {
      // No response arrows - down-right for left ear, down-left for right ear
      const arrowSize = 12;
      if (result.ear === "L") {
        // Down-right arrow for left ear (↘)
        return (
          <g key={`${result.x}-${result.y}-${result.ear}-noresponse`}>
            <line
              x1={x - arrowSize/2}
              y1={y - arrowSize/2}
              x2={x + arrowSize/2}
              y2={y + arrowSize/2}
              stroke={color}
              strokeWidth={3}
            />
            <polygon
              points={`${x + arrowSize/2},${y + arrowSize/2} ${x + arrowSize/2 - 4},${y + arrowSize/2 - 2} ${x + arrowSize/2 - 2},${y + arrowSize/2 - 4}`}
              fill={color}
            />
          </g>
        );
      } else {
        // Down-left arrow for right ear (↙)
        return (
          <g key={`${result.x}-${result.y}-${result.ear}-noresponse`}>
            <line
              x1={x + arrowSize/2}
              y1={y - arrowSize/2}
              x2={x - arrowSize/2}
              y2={y + arrowSize/2}
              stroke={color}
              strokeWidth={3}
            />
            <polygon
              points={`${x - arrowSize/2},${y + arrowSize/2} ${x - arrowSize/2 + 4},${y + arrowSize/2 - 2} ${x - arrowSize/2 + 2},${y + arrowSize/2 - 4}`}
              fill={color}
            />
          </g>
        );
      }
    }
    
    if (result.mode === "AC") {
      if (result.masking === 0) {
        // Unmasked AC: Circle for Right ear, X for Left ear
        return result.ear === "R" ? (
          <circle
            cx={x}
            cy={y}
            r={size}
            fill="none"
            stroke={color}
            strokeWidth={2}
            key={`${result.x}-${result.y}-${result.ear}`}
          />
        ) : (
          <text
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={size * 2}
            fill={color}
            key={`${result.x}-${result.y}-${result.ear}`}
            fontWeight="bold"
          >
            ×
          </text>
        );
      } else {
        // Masked AC: Triangle for Left ear, Square for Right ear
        return result.ear === "L" ? (
          <polygon
            points={`${x},${y-size} ${x-size},${y+size} ${x+size},${y+size}`}
            fill="none"
            stroke={color}
            strokeWidth={2}
            key={`${result.x}-${result.y}-${result.ear}`}
          />
        ) : (
          <rect
            x={x - size}
            y={y - size}
            width={size * 2}
            height={size * 2}
            fill="none"
            stroke={color}
            strokeWidth={2}
            key={`${result.x}-${result.y}-${result.ear}`}
          />
        );
      }
    } else if (result.mode === "BC") {
      // Bone conduction symbols
      const symbol = result.masking === 0 ? 
        (result.ear === "L" ? ">" : "<") : 
        (result.ear === "L" ? "]" : "[");
      
      return (
        <text
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={size * 2}
          fill={color}
          key={`${result.x}-${result.y}-${result.ear}`}
          fontWeight="bold"
        >
          {symbol}
        </text>
      );
    }
    
    return null;
  };

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-sm font-bold mb-3 text-gray-800">{title}</h3>
      <div className="border-2 border-gray-400 bg-white">
        <svg width={width + margin.left + margin.right} height={height + margin.top + margin.bottom}>
          {/* Grid lines - Major lines for 10dB intervals */}
          {Array.from({ length: 15 }, (_, i) => (
            <line
              key={`major-h-${i}`}
              x1={margin.left}
              y1={margin.top + i * gridSize}
              x2={width + margin.left}
              y2={margin.top + i * gridSize}
              stroke={i % 2 === 0 ? COLORS.grid : "#E5E5E5"}
              strokeWidth={i % 2 === 0 ? 1.5 : 0.5}
            />
          ))}
          
          {/* Vertical grid lines for main frequencies */}
          {mainFrequencies.map((freq) => {
            const freqIndex = frequencies.indexOf(freq);
            if (freqIndex === -1) return null;
            return (
              <line
                key={`main-freq-${freq}`}
                x1={margin.left + freqIndex * gridSize}
                y1={margin.top}
                x2={margin.left + freqIndex * gridSize}
                y2={height + margin.top}
                stroke={COLORS.grid}
                strokeWidth={1}
              />
            );
          })}
          
          {/* Vertical grid lines for mid frequencies (dashed) */}
          {midFrequencies.map((freq) => {
            const freqIndex = frequencies.indexOf(freq);
            if (freqIndex === -1) return null;
            return (
              <line
                key={`mid-freq-${freq}`}
                x1={margin.left + freqIndex * gridSize}
                y1={margin.top}
                x2={margin.left + freqIndex * gridSize}
                y2={height + margin.top}
                stroke={COLORS.midOctave}
                strokeWidth={1.5}
                strokeDasharray="4,2"
              />
            );
          })}
          
          {/* Mid-intensity lines (5 dB intervals) */}
          {Array.from({ length: 14 }, (_, i) => (
            <line
              key={`mid-intensity-${i}`}
              x1={margin.left}
              y1={margin.top + (i + 0.5) * gridSize}
              x2={width + margin.left}
              y2={margin.top + (i + 0.5) * gridSize}
              stroke={COLORS.midOctave}
              strokeWidth={1.2}
              strokeDasharray="4,2"
            />
          ))}
          
          {/* Frequency labels */}
          {frequencies.map((freq, i) => {
            const isMidFreq = midFrequencies.includes(freq);
            const label = freq >= 1000 ? `${freq/1000}K` : freq;
            return (
              <text
                key={`freq-${freq}`}
                x={margin.left + i * gridSize}
                y={height + margin.top + 15}
                textAnchor="middle"
                fontSize={isMidFreq ? "9" : "10"}
                fill={isMidFreq ? "#666666" : COLORS.text}
                fontWeight={isMidFreq ? "normal" : "bold"}
              >
                {label}
              </text>
            );
          })}
          
          {/* dB level labels */}
          {Array.from({ length: 15 }, (_, i) => {
            const db = (i - 1) * 10; // Start from -10
            return (
              <text
                key={`db-${db}`}
                x={margin.left - 10}
                y={margin.top + i * gridSize}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize="10"
                fill={COLORS.text}
                fontWeight="bold"
              >
                {db}
              </text>
            );
          })}
          
          {/* Axis labels */}
          <text
            x={margin.left - 35}
            y={height / 2 + margin.top}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="11"
            fill={COLORS.text}
            fontWeight="bold"
            transform={`rotate(-90, ${margin.left - 35}, ${height / 2 + margin.top})`}
          >
            Hearing Level (dB HL)
          </text>
          
          <text
            x={width / 2 + margin.left}
            y={height + margin.top + 35}
            textAnchor="middle"
            fontSize="11"
            fill={COLORS.text}
            fontWeight="bold"
          >
            Frequency (Hz)
          </text>
          
          {/* Data points */}
          {results.map((result) => {
            const freqIndex = frequencies.indexOf(result.x);
            const dbIndex = Math.round((result.y + 10) / 10); // Convert dB to grid index (starts from -10)
            
            if (freqIndex === -1 || dbIndex < 0 || dbIndex >= 15) return null;
            
            const x = margin.left + freqIndex * gridSize;
            const y = margin.top + dbIndex * gridSize;
            
            return renderSymbol(result, x, y);
          })}
        </svg>
      </div>
    </div>
  );
};

export default function ReportPage() {
  const { consultationId } = useParams();
  const { data: consultation, isLoading, error } = useGetConsultation(consultationId as string);
  const consultationData = consultation?.data as ConsultationModelData;
  const reportRef = useRef<HTMLDivElement>(null);
  
  // Form state for diagnosis fields
  const [formData, setFormData] = useState({
    audiologicalDiagnosis: "",
    suggestiveOf: "",
    recommendation: ""
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!consultationData) return <div>No data</div>;

  const allResults: TestResult[] = [
    ...(consultationData.audiometry?.acTests?.map(t => {
      const patientResponded = t.response === true;
      return {
        ear: t.ear === Ear.LEFT ? "L" : "R",
        x: t.frequencyHz,
        y: t.thresholdDb,
        mode: "AC",
        masking: t.maskingUsed ? (t.maskingEar === Ear.LEFT ? 1 : 2) : 0,
        noResponse: patientResponded ? 0 : 1,
        signalType: "Steady",
        pulsed: false,
      };
    }) || []),
    ...(consultationData.audiometry?.bcTests?.map(t => {
      const patientResponded = t.response === true;
      return {
        ear: t.ear === Ear.LEFT ? "L" : "R",
        x: t.frequencyHz,
        y: t.thresholdDb,
        mode: "BC",
        masking: t.maskingUsed ? 1 : 0,
        noResponse: patientResponded ? 0 : 1,
        signalType: "Steady",
        pulsed: false,
      };
    }) || []),
  ];

  // Calculate PTA averages
  const calculatePTAAverage = (testType: 'AC' | 'BC'): PTAAverage => {
    const ptaFrequencies = [500, 1000, 2000, 4000];
    
    const leftEarThresholds: number[] = [];
    const rightEarThresholds: number[] = [];
    
    ptaFrequencies.forEach(freq => {
      const leftTest = allResults.find(t => t.x === freq && t.ear === "L" && t.mode === testType);
      const rightTest = allResults.find(t => t.x === freq && t.ear === "R" && t.mode === testType);
      
      if (leftTest && leftTest.noResponse === 0) leftEarThresholds.push(leftTest.y);
      if (rightTest && rightTest.noResponse === 0) rightEarThresholds.push(rightTest.y);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form data to submit:", formData);
  };

  return (
    <div className="p-6 flex justify-center bg-gray-100 min-h-screen">
      <div className="w-[794px] bg-white shadow-lg">
        <div className="flex justify-center p-4 border-b">
          <Button onClick={handleDownloadPDF} className="bg-blue-600 hover:bg-blue-700 text-white">
            Download PDF
          </Button>
    
        </div>
        
        <div ref={reportRef} className="bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
          {/* Header */}
          <div className="relative bg-blue-900 text-white overflow-hidden" >
            <div className="relative flex items-center justify-between p-6 z-10">
              {/* Left Side - Logo */}
              <div className="flex items-center">
                <div className="bg-white rounded-full p-2 mr-4">
                  <div className="w-12 h-12 bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs">ear</span>
                  </div>
                </div>
                <div className="text-white">
                  <h1 className="text-2xl font-bold tracking-wider">earKART</h1>
                  <p className="text-sm opacity-90 tracking-wide">REDEFINING HEARING CARE</p>
                </div>
              </div>
              
              {/* Right Side - Tilted Box */}
              <div className="relative">
                <div 
                  className="text-blue-900 px-8 py-4 text-right transform -skew-x-12"
                  style={{ 
                    backgroundColor: '#8bdaef',
                    clipPath: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)'
                  }}
                >
                  <div className="transform skew-x-10">
                    <p className="font-bold text-sm">Clinic Name</p>
                    <div className="flex items-center justify-end mt-1">
                      <span className="text-xs mr-1">+91 XXXXXXXXXX</span>
                      <span className="text-xs">📞</span>
                    </div>
                    <div className="flex items-center justify-end">
                      <span className="text-xs mr-1">Address</span>
                      <span className="text-xs">📍</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-96 h-full opacity-10">
              <div 
                className="w-full h-full transform skew-x-12"
                style={{ backgroundColor: '#8bdaef' }}
              ></div>
            </div>
          </div>

          {/* Pure Tone Audiogram Title */}
          <div className="text-center py-6 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-800">Pure Tone Audiogram</h2>
          </div>

          {/* Patient Information */}
          <div className="px-8 py-4 bg-white border-b">
            <div className="grid grid-cols-12 gap-4 text-sm">
              <div className="col-span-3 flex items-center">
                <span className="font-medium mr-2">ID :</span>
                <span className="border-b border-dotted border-gray-400 flex-1 pb-1">
                  {consultationData.patient?.code || ""}
                </span>
              </div>
              <div className="col-span-6 flex items-center">
                <span className="font-medium mr-2">Name :</span>
                <span className="border-b border-dotted border-gray-400 flex-1 pb-1">
                  {consultationData.patient?.name || ""}
                </span>
              </div>
              <div className="col-span-3 flex items-center">
                <span className="font-medium mr-2">Date :</span>
                <span className="border-b border-dotted border-gray-400 flex-1 pb-1">
                  {format(new Date(consultationData.createdAt), "dd/MM/yyyy")}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-12 gap-4 text-sm mt-3">
              <div className="col-span-9 flex items-center">
                <span className="font-medium mr-2">Address :</span>
                <span className="border-b border-dotted border-gray-400 flex-1 pb-1">
                  {consultationData.patient?.address || ""}
                </span>
              </div>
              <div className="col-span-2 flex items-center">
                <span className="font-medium mr-2">Age :</span>
                <span className="border-b border-dotted border-gray-400 flex-1 pb-1">
                  {consultationData.patient?.dob ? 
                    Math.floor((Date.now() - new Date(consultationData.patient.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) 
                    : ""}
                </span>
              </div>
              <div className="col-span-1 flex items-center">
                <span className="font-medium mr-2">Sex :</span>
                <span className="border-b border-dotted border-gray-400 flex-1 pb-1">
                  {consultationData.patient?.gender || ""}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm mt-3">
              <div className="flex items-center">
                <span className="font-medium mr-2">Contact No. :</span>
                <span className="border-b border-dotted border-gray-400 flex-1 pb-1">
                  {consultationData.patient?.contactNumber || ""}
                </span>
              </div>
              <div className="flex items-center">
                <span className="font-medium mr-2">Referred by :</span>
                <span className="border-b border-dotted border-gray-400 flex-1 pb-1"></span>
              </div>
            </div>
          </div>

          {/* Audiogram Charts */}
          <div className="px-8 py-6 bg-gray-50">
            <div className="flex justify-between items-start gap-8">
              <div className="flex-1">
                <AudiogramChart
                  title="Right Ear"
                  results={rightResults}
                  ear="R"
                />
              </div>
              <div className="flex-1">
                <AudiogramChart
                  title="Left Ear"
                  results={leftResults}
                  ear="L"
                />
              </div>
            </div>
          </div>

          {/* PTA and Symbols Section */}
          <div className="bg-blue-900 text-white mx-8 mb-6">
            <div className="flex">
              {/* PTA Section */}
              <div className="p-4 border-r border-blue-700">
                <h3 className="text-sm font-bold mb-3 text-center">PTA</h3>
                <div className="grid grid-cols-3 gap-0 text-xs">
                  <div></div>
                  <div className="text-center font-bold border border-white p-2">Rt</div>
                  <div className="text-center font-bold border border-white p-2">Lt</div>
                  <div className="font-bold border border-white p-2 text-center">AC</div>
                  <div className="border border-white p-2 text-center">
                    {acAverage.rightEar ? Math.round(acAverage.rightEar) : ""}
                  </div>
                  <div className="border border-white p-2 text-center">
                    {acAverage.leftEar ? Math.round(acAverage.leftEar) : ""}
                  </div>
                  <div className="font-bold border border-white p-2 text-center">BC</div>
                  <div className="border border-white p-2 text-center">
                    {bcAverage.rightEar ? Math.round(bcAverage.rightEar) : ""}
                  </div>
                  <div className="border border-white p-2 text-center">
                    {bcAverage.leftEar ? Math.round(bcAverage.leftEar) : ""}
                  </div>
                </div>
              </div>
              
              {/* Symbols Section */}
              <div className="flex-1 p-4">
                <h3 className="text-sm font-bold mb-3 text-center">Symbols</h3>
                <div className="flex justify-between items-center text-xs">
                  <div className="text-center">
                    <div className="font-bold mb-2">Right</div>
                    <div className="flex flex-col space-y-1">
                      <div className="text-red-500 text-lg">○</div>
                      <div className="text-xs">AC</div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="font-bold mb-2">Left</div>
                    <div className="flex flex-col space-y-1">
                      <div className="text-blue-500 text-lg font-bold">×</div>
                      <div className="text-xs">AC</div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="font-bold mb-2">Unmasked</div>
                    <div className="flex space-x-2">
                      <div className="text-red-500 text-lg">&lt;</div>
                      <div className="text-blue-500 text-lg">&gt;</div>
                    </div>
                    <div className="text-xs">BC</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="font-bold mb-2">Masked</div>
                    <div className="flex space-x-2">
                      <div className="text-red-500 text-lg">△</div>
                      <div className="text-blue-500 text-lg">□</div>
                    </div>
                    <div className="text-xs">MCL UCL</div>
                  </div>
                  
                                     <div className="text-center">
                     <div className="font-bold mb-2">No Response</div>
                     <div className="flex space-x-2">
                       <div className="text-red-500 text-lg">↙</div>
                       <div className="text-blue-500 text-lg">↘</div>
                     </div>
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* Diagnosis Fields */}
          <div className="px-8 mb-6 space-y-4">
            <div>
              <div className="text-sm font-bold mb-2">Audiological Diagnosis :</div>
              <div className="border border-gray-400 h-16 w-full bg-gray-50"></div>
            </div>
            
            <div>
              <div className="text-sm font-bold mb-2">Suggestive of :</div>
              <div className="border border-gray-400 h-16 w-full bg-gray-50"></div>
            </div>
            
            <div>
              <div className="text-sm font-bold mb-2">Recommendation :</div>
              <div className="border border-gray-400 h-20 w-full bg-gray-50"></div>
            </div>
          </div>

          {/* Audiologist Box */}
          <div className="px-8 mb-6 flex justify-end">
            <div className="border-2 border-blue-600 bg-blue-50 p-4 text-center">
              <div className="text-sm font-bold text-blue-900">Audiologist Name</div>
              <div className="text-xs text-blue-800 mt-1">{consultationData.audiologist?.user?.name || ""}</div>
              <div className="text-xs text-blue-900 font-bold mt-2">RCI No.</div>
              <div className="text-xs text-blue-800">{consultationData.audiologist?.rciNumber || ""}</div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-blue-900 text-white p-4">
            <div className="flex justify-center items-center space-x-8 text-sm">
              <div className="flex items-center">
                <span className="mr-2">📞</span>
                <span>+91 9289097578</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">🌐</span>
                <span>www.earkart.in</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">📧</span>
                <span>info@earkart.in</span>
              </div>
            </div>
            <div className="text-center text-xs mt-2 opacity-80">
              (Not for Medico-legal Purpose)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}