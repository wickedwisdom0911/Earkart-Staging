"use client";
import React, { useEffect, useRef, useState } from "react";
import { useGetConsultation } from "@/hooks/consultation/use-get-consultation";
import { useUpdateConsultation } from "@/hooks/consultation/use-update-consultation";
import { ConsultationModelData } from "@/models/consultation.model";
import { useParams, useRouter } from "next/navigation";
import { Ear, SessionStatus } from "@/models/enums";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { ROUTES } from "@/lib/routes";
import { toast } from "sonner";
import { useSocket } from "@/providers/socket-provider";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import Image from "next/image";

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

  // Function to generate connecting lines between thresholds (following ASHA conventions)
  const generateConnectingLines = () => {
    const lines: React.ReactNode[] = [];
    
    // Group results by ear and mode
    const groups: { [key: string]: TestResult[] } = {};
    
    results
      .filter(r => r.noResponse === 0) // Only connect symbols with responses
      .forEach(result => {
        const key = `${result.ear}-${result.mode}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(result);
      });
    
    // Create lines for each group
    Object.entries(groups).forEach(([key, groupResults]) => {
      if (groupResults.length < 2) return; // Need at least 2 points to draw a line
      
      // Sort by frequency for proper line connection
      const sortedResults = groupResults.sort((a, b) => a.x - b.x);
      
      for (let i = 0; i < sortedResults.length - 1; i++) {
        const current = sortedResults[i];
        const next = sortedResults[i + 1];
        
        const freqIndex1 = frequencies.indexOf(current.x);
        const freqIndex2 = frequencies.indexOf(next.x);
        const dbIndex1 = Math.round((current.y + 10) / 10);
        const dbIndex2 = Math.round((next.y + 10) / 10);
        
        if (freqIndex1 === -1 || freqIndex2 === -1 || 
            dbIndex1 < 0 || dbIndex1 >= 15 || 
            dbIndex2 < 0 || dbIndex2 >= 15) continue;
        
        const x1 = margin.left + freqIndex1 * gridSize;
        const y1 = margin.top + dbIndex1 * gridSize;
        const x2 = margin.left + freqIndex2 * gridSize;
        const y2 = margin.top + dbIndex2 * gridSize;
        
        const color = getSymbolColor(current.ear);
        const strokeDasharray = current.mode === "BC" ? "3,3" : "none"; // BC lines are dashed
        
        lines.push(
          <line
            key={`line-${key}-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth={2}
            strokeDasharray={strokeDasharray}
            fill="none"
          />
        );
      }
    });
    
    return lines;
  };
  
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
        // Unmasked AC: Circle for Right ear, X for Left ear (ASHA standard)
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
        // Masked AC: Triangle for Left ear, Square for Right ear (ASHA standard)
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
      // Bone conduction symbols (ASHA standard)
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
          
          {/* Connecting lines (must be drawn before symbols) */}
          {generateConnectingLines()}
          
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
  const router = useRouter();
  const socket = useSocket();
  const { data: consultation, isLoading, error } = useGetConsultation(consultationId as string);
  const consultationData = consultation?.data as ConsultationModelData;
  const updateConsultationMutation = useUpdateConsultation();
  const reportRef = useRef<HTMLDivElement>(null);
  
  // State for show report functionality
  const [isShowingReport, setIsShowingReport] = useState(false);
  
  // Form state for diagnosis fields
  const [formData, setFormData] = useState({
    audiologicalDiagnosis: "",
    suggestiveOf: "",
    recommendation: ""
  });

  // Update form data when consultation data is loaded
  React.useEffect(() => {
    if (consultationData?.audiometry) {
      setFormData({
        audiologicalDiagnosis: consultationData.audiometry.audiologicalDiagnosis || "",
        suggestiveOf: consultationData.audiometry.suggestion || "",
        recommendation: consultationData.audiometry.recommendation || ""
      });
    }
  }, [consultationData]);

  // Listen for end:consultation socket event
  useEffect(() => {
    if (socket) {
      socket.on("end:consultation", (data) => {
        console.log("Consultation ended via socket:", data);
        toast.info("Consultation has ended. Redirecting to dashboard...");
        router.push("http://localhost:3001/dashboard");
      });

      return () => {
        socket.off("end:consultation");
      };
    }
  }, [socket, router]);

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

  // Separate results by ear for individual charts
  const rightResults = allResults.filter(r => r.ear === "R");
  const leftResults = allResults.filter(r => r.ear === "L");

  // Calculate PTA using 4-frequency average (500, 1000, 2000, 4000 Hz)
  // Includes both responses and no-responses (clinical standard)
  const calculatePTA = (results: TestResult[], mode: "AC" | "BC") => {
    const standardFrequencies = [500, 1000, 2000, 4000];
    const modeResults = results.filter(r => r.mode === mode); // Include ALL results (responses + no responses)
    
    const thresholds = standardFrequencies
      .map(freq => {
        const result = modeResults.find(r => r.x === freq);
        return result ? result.y : undefined; // Use the tested threshold level (whether response or no-response)
      })
      .filter(threshold => threshold !== undefined) as number[];
    
    if (thresholds.length === 0) return null;
    
    // If we have all 4 frequencies, use 4-frequency PTA
    if (thresholds.length >= 4) {
      return thresholds.slice(0, 4).reduce((sum, threshold) => sum + threshold, 0) / 4;
    }
    
    // If we have 3 frequencies, use 3-frequency average
    if (thresholds.length === 3) {
      return thresholds.reduce((sum, threshold) => sum + threshold, 0) / 3;
    }
    
    // If we have 2 frequencies, use 2-frequency average
    if (thresholds.length === 2) {
      return thresholds.reduce((sum, threshold) => sum + threshold, 0) / 2;
    }
    
    // If we have only 1 frequency, return that value
    return thresholds[0];
  };

  // Helper function to get no-response frequencies for documentation
  const getNoResponseFrequencies = (results: TestResult[], mode: "AC" | "BC") => {
    const standardFrequencies = [500, 1000, 2000, 4000];
    const modeResults = results.filter(r => r.mode === mode);
    
    return standardFrequencies.filter(freq => {
      const result = modeResults.find(r => r.x === freq);
      return result && result.noResponse === 1;
    });
  };

  // Calculate PTA for each ear and mode
  const acAverage = {
    rightEar: calculatePTA(rightResults, "AC"),
    leftEar: calculatePTA(leftResults, "AC"),
  };

  const bcAverage = {
    rightEar: calculatePTA(rightResults, "BC"),
    leftEar: calculatePTA(leftResults, "BC"),
  };

  // Get no-response frequencies for each ear/mode combination
  const noResponseFreqs = {
    rightAC: getNoResponseFrequencies(rightResults, "AC"),
    leftAC: getNoResponseFrequencies(leftResults, "AC"),
    rightBC: getNoResponseFrequencies(rightResults, "BC"),
    leftBC: getNoResponseFrequencies(leftResults, "BC"),
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: "#fff" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: "a4" });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();
    
    // Scale to fit on one page - calculate the ratio to fit both width and height
    const widthRatio = pdfW / canvas.width;
    const heightRatio = pdfH / canvas.height;
    const ratio = Math.min(widthRatio, heightRatio); // Use the smaller ratio to ensure it fits
    
    const scaledWidth = canvas.width * ratio;
    const scaledHeight = canvas.height * ratio;
    
    // Center the image on the page
    const xOffset = (pdfW - scaledWidth) / 2;
    const yOffset = (pdfH - scaledHeight) / 2;
    
    pdf.addImage(imgData, "PNG", xOffset, yOffset, scaledWidth, scaledHeight);
    pdf.save(`audiometry-report-${consultationData.patient?.code || "unknown"}.pdf`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!consultationData?.audiometry?.id) {
      toast.error("No audiometry test found to update");
      return;
    }

    try {
      await updateConsultationMutation.mutateAsync({
        ...consultationData,
        audiometry: {
          ...consultationData.audiometry,
          audiologicalDiagnosis: formData.audiologicalDiagnosis,
          suggestion: formData.suggestiveOf,
          recommendation: formData.recommendation,
        },
      });
    } catch (error) {
      console.error("Failed to update consultation:", error);
    }
  };

  const handleEndConsultation = () => {
    // Navigate to end consultation page - no API call
    router.push(`/consultation/${consultationId}/end-consultation`);
  };

  const handleDoAnotherTest = () => {
    router.push(ROUTES.CONSULTATION_TEST_SELECTION(consultationId as string));
  };

  const handleShowReport = () => {
    if (!socket) {
      toast.error("Socket connection not available");
      return;
    }

    const eventName = isShowingReport ? "generate-report:end" : "generate-report:start";
    socket.emit(eventName, { consultationId });
    
    setIsShowingReport(!isShowingReport);
    toast.success(`Report ${isShowingReport ? "hidden" : "shown"} to patient`);
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
              <Image
                    src="/EARKART LOGO BLUE.webp" 
                    alt="earKART Logo" 
                    width={200} 
                    height={250}
                    className="bg-white"
                  />
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
                    <p className="font-bold text-sm">{consultationData.centre?.user?.name || "Clinic Name"}</p>
                    <div className="flex items-center justify-end mt-1">
                      <span className="text-xs mr-1">{consultationData.centre?.contactNumber || "+91 XXXXXXXXXX"}</span>
                      <span className="text-xs">📞</span>
                    </div>
                    <div className="flex items-center justify-end">
                      <span className="text-xs mr-1">{consultationData.centre?.address || "Address"}</span>
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
              <div className="col-span-7 flex items-center">
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
              <div className="col-span-2 flex items-center">
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
              <div className="p-4 border-r border-blue-700 min-w-[200px]">
                <h3 className="text-sm font-bold mb-2 text-center">PTA (dB HL)</h3>
                <div className="text-xs text-center mb-2 opacity-80">4-Frequency Average</div>
                <div className="text-xs text-center mb-2 opacity-80">(500, 1K, 2K, 4K Hz)</div>
                <div className="text-xs text-center mb-3 opacity-70">*Includes no-response values</div>
                <div className="grid grid-cols-3 gap-0 text-xs">
                  <div></div>
                  <div className="text-center font-bold border border-white p-2 bg-blue-800">Right</div>
                  <div className="text-center font-bold border border-white p-2 bg-blue-800">Left</div>
                  <div className="font-bold border border-white p-2 text-center bg-blue-800">AC</div>
                  <div className="border border-white p-2 text-center font-semibold">
                    {acAverage.rightEar ? `${Math.round(acAverage.rightEar)}` : "—"}
                  </div>
                  <div className="border border-white p-2 text-center font-semibold">
                    {acAverage.leftEar ? `${Math.round(acAverage.leftEar)}` : "—"}
                  </div>
                  <div className="font-bold border border-white p-2 text-center bg-blue-800">BC</div>
                  <div className="border border-white p-2 text-center font-semibold">
                    {bcAverage.rightEar ? `${Math.round(bcAverage.rightEar)}` : "—"}
                  </div>
                  <div className="border border-white p-2 text-center font-semibold">
                    {bcAverage.leftEar ? `${Math.round(bcAverage.leftEar)}` : "—"}
                  </div>
                </div>
                
                {/* Air-Bone Gap Calculation */}
                <div className="mt-3 pt-3 border-t border-blue-700">
                  <div className="text-xs font-semibold text-center mb-2">Air-Bone Gap</div>
                  <div className="grid grid-cols-3 gap-0 text-xs">
                    <div></div>
                    <div className="text-center font-bold border border-white p-1 bg-blue-800">Right</div>
                    <div className="text-center font-bold border border-white p-1 bg-blue-800">Left</div>
                    <div className="font-bold border border-white p-1 text-center bg-blue-800">Gap</div>
                    <div className="border border-white p-1 text-center font-semibold">
                      {(acAverage.rightEar && bcAverage.rightEar) 
                        ? `${Math.round(acAverage.rightEar - bcAverage.rightEar)}` 
                        : "—"}
                    </div>
                    <div className="border border-white p-1 text-center font-semibold">
                      {(acAverage.leftEar && bcAverage.leftEar) 
                        ? `${Math.round(acAverage.leftEar - bcAverage.leftEar)}` 
                        : "—"}
                    </div>
                  </div>
                </div>
                
                {/* Clinical Notes for No Responses */}
                {(noResponseFreqs.rightAC.length > 0 || noResponseFreqs.leftAC.length > 0 || 
                  noResponseFreqs.rightBC.length > 0 || noResponseFreqs.leftBC.length > 0) && (
                  <div className="mt-3 pt-3 border-t border-blue-700">
                    <div className="text-xs font-semibold text-center mb-2">No Response Frequencies</div>
                    <div className="text-xs opacity-90 space-y-1">
                      {noResponseFreqs.rightAC.length > 0 && (
                        <div>R AC: {noResponseFreqs.rightAC.map(f => f >= 1000 ? `${f/1000}K` : f).join(', ')} Hz</div>
                      )}
                      {noResponseFreqs.leftAC.length > 0 && (
                        <div>L AC: {noResponseFreqs.leftAC.map(f => f >= 1000 ? `${f/1000}K` : f).join(', ')} Hz</div>
                      )}
                      {noResponseFreqs.rightBC.length > 0 && (
                        <div>R BC: {noResponseFreqs.rightBC.map(f => f >= 1000 ? `${f/1000}K` : f).join(', ')} Hz</div>
                      )}
                      {noResponseFreqs.leftBC.length > 0 && (
                        <div>L BC: {noResponseFreqs.leftBC.map(f => f >= 1000 ? `${f/1000}K` : f).join(', ')} Hz</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Symbols Section */}
              <div className="flex-1 p-4">
                <h3 className="text-sm font-bold mb-3 text-center">Symbols (ASHA Standards)</h3>
                <div className="grid grid-cols-4 gap-4 text-xs">
                  {/* Air Conduction Unmasked */}
                  <div className="text-center">
                    <div className="font-bold mb-2">AC Unmasked</div>
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center justify-center space-x-2">
                      <div className="text-red-500 text-lg">○</div>
                        <span className="text-xs">R</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <div className="text-blue-500 text-lg font-bold">×</div>
                        <span className="text-xs">L</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Air Conduction Masked */}
                  <div className="text-center">
                    <div className="font-bold mb-2">AC Masked</div>
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="text-red-500 text-lg">□</div>
                        <span className="text-xs">R</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <div className="text-blue-500 text-lg">△</div>
                        <span className="text-xs">L</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Bone Conduction */}
                  <div className="text-center">
                    <div className="font-bold mb-2">Bone Conduction</div>
                    <div className="flex flex-col space-y-2">
                      <div className="text-xs font-semibold mb-1">Unmasked:</div>
                      <div className="flex items-center justify-center space-x-3">
                        <div className="text-red-500 text-lg font-bold">&lt;</div>
                        <div className="text-blue-500 text-lg font-bold">&gt;</div>
                      </div>
                      <div className="text-xs font-semibold mb-1 mt-2">Masked:</div>
                      <div className="flex items-center justify-center space-x-3">
                        <div className="text-red-500 text-lg font-bold">[</div>
                        <div className="text-blue-500 text-lg font-bold">]</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* No Response */}
                  <div className="text-center">
                    <div className="font-bold mb-2">No Response</div>
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="text-red-500 text-lg">↙</div>
                        <span className="text-xs">R</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <div className="text-blue-500 text-lg">↘</div>
                        <span className="text-xs">L</span>
                      </div>
                    </div>
                  </div>
                  </div>
                  
                {/* Legend Notes */}
                <div className="mt-4 text-xs text-gray-600 text-center">
                  <div>Red = Right Ear | Blue = Left Ear</div>
                  <div>Solid lines = AC | Dashed lines = BC</div>
                </div>
              </div>
            </div>
          </div>

          {/* Diagnosis Fields */}
          <form onSubmit={handleSubmit} className="px-8 mb-6 space-y-4">
            <div>
              <div className="text-sm font-bold mb-2">Audiological Diagnosis :</div>
              <Textarea
                value={formData.audiologicalDiagnosis}
                onChange={(e) => setFormData(prev => ({ ...prev, audiologicalDiagnosis: e.target.value }))}
                placeholder="Enter audiological diagnosis..."
                className="h-16 resize-none border border-gray-400 bg-gray-50"
              />
            </div>
            
            <div>
              <div className="text-sm font-bold mb-2">Suggestive of :</div>
              <Textarea
                value={formData.suggestiveOf}
                onChange={(e) => setFormData(prev => ({ ...prev, suggestiveOf: e.target.value }))}
                placeholder="Enter what the results are suggestive of..."
                className="h-16 resize-none border border-gray-400 bg-gray-50"
              />
            </div>
            
            <div>
              <div className="text-sm font-bold mb-2">Recommendation :</div>
              <Textarea
                value={formData.recommendation}
                onChange={(e) => setFormData(prev => ({ ...prev, recommendation: e.target.value }))}
                placeholder="Enter recommendations..."
                className="h-20 resize-none border border-gray-400 bg-gray-50"
              />
            </div>
            
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={updateConsultationMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {updateConsultationMutation.isPending ? "Saving..." : "Save Diagnosis"}
              </Button>
            </div>
          </form>

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
                <span>{consultationData.centre?.contactNumber || "+91 9289097578"}</span>
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

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-10">
        <Button
          onClick={handleShowReport}
          className={`${
            isShowingReport 
              ? "bg-orange-600 hover:bg-orange-700" 
              : "bg-blue-600 hover:bg-blue-700"
          } text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2`}
        >
          <span>📊</span>
          {isShowingReport ? "Hide Report" : "Show Report"}
        </Button>
        <Button
          onClick={handleDoAnotherTest}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2"
        >
          <span>🔄</span>
          Do Another Test
        </Button>
        <Button
          onClick={handleEndConsultation}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2"
        >
          <span>✅</span>
          End Consultation
        </Button>
      </div>


    </div>
  );
}