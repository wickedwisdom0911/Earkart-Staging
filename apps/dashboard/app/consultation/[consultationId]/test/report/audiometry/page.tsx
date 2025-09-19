"use client";
import React, { useEffect, useRef, useState } from "react";
import { useGetConsultation } from "@/hooks/consultation/use-get-consultation";
import { useUpdateConsultation } from "@/hooks/consultation/use-update-consultation";
import { ConsultationModelData } from "@/models/consultation.model";
import { useParams, useRouter } from "next/navigation";
import { Ear, SessionStatus } from "@/models/enums";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import FloatingReportActions from "@/components/ui/FloatingReportActions";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ReportTopActions from "@/components/ui/ReportTopActions";
import { exportElementToPdfBlob } from "@/lib/pdf";
import initiateReportUpload from "@/actions/consultations/initiate-report-upload";
import completeReportUpload from "@/actions/consultations/complete-report-upload";
import { ReportType } from "@/models/enums";

import { ROUTES } from "@/lib/routes";
import { toast } from "sonner";
import { useSocket } from "@/providers/socket-provider";
// PDF export utility is dynamically imported to avoid any SSR bundling issues
import Image from "next/image";
import { ArrowDownLeft, ArrowDownRight } from "lucide-react";
import useSharedScreenShare from "@/hooks/agora/use-shared-screen-share";

// Helper: Synchronous rasterization for use inside html2canvas onclone (no async/await allowed)
function rasterizeSVGsSync(container: HTMLElement, ownerDocument: Document) {
  const svgNodes = Array.from(container.querySelectorAll("svg")) as SVGSVGElement[];
  for (const svg of svgNodes) {
    try {
      const clone = svg.cloneNode(true) as SVGSVGElement;
      if (!clone.getAttribute("xmlns")) clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      const rect = svg.getBoundingClientRect();
      const width = rect.width || Number(clone.getAttribute("width")) || svg.clientWidth;
      const height = rect.height || Number(clone.getAttribute("height")) || svg.clientHeight;
      if (width && height) {
        clone.setAttribute("width", String(width));
        clone.setAttribute("height", String(height));
      }
      const xml = new XMLSerializer().serializeToString(clone);
      const dataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);
      const img = ownerDocument.createElement("img");
      (img as any).decoding = "sync";
      if ("loading" in img) (img as any).loading = "eager";
      img.setAttribute("width", String(width));
      img.setAttribute("height", String(height));
      img.style.width = `${width}px`;
      img.style.height = `${height}px`;
      img.style.display = getComputedStyle(svg).display === "inline" ? "inline-block" : "block";
      img.src = dataUrl;
      svg.style.display = "none";
      svg.parentNode?.insertBefore(img, svg);
    } catch {
      // ignore and continue
    }
  }
}

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
  
  const gridSize = 22; // slightly smaller to match component proportions
  const stepsPerOctave = 2; // place a mid-octave step between each octave
  const minFreq = mainFrequencies[0];
  const maxFreq = mainFrequencies[mainFrequencies.length - 1];
  const totalSteps = (mainFrequencies.length - 1) * stepsPerOctave;
  const chartWidth = gridSize * totalSteps; // equal spacing per octave
  const height = 14 * gridSize; // Adjust height to start from -10
  const margin = { top: 30, right: 20, bottom: 40, left: 50 };
  
  // Map frequency to equal per-octave spacing; mid-octaves land midway
  const getFrequencyPosition = (freq: number) => {
    const clamped = Math.max(minFreq, Math.min(maxFreq, freq));
    const stepIndex = Math.round(Math.log2(clamped / minFreq) * stepsPerOctave);
    return stepIndex * gridSize;
  };
  
  const COLORS = {
    leftEar: "#0000FF",
    rightEar: "#FF0000",
    grid: "#666666",
    midOctave: "#E0E0E0",
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
        
        const dbIndex1 = Math.round((current.y + 10) / 10);
        const dbIndex2 = Math.round((next.y + 10) / 10);
        
        if (dbIndex1 < 0 || dbIndex1 >= 15 || 
            dbIndex2 < 0 || dbIndex2 >= 15) continue;
        
        const x1 = margin.left + getFrequencyPosition(current.x);
        const y1 = margin.top + dbIndex1 * gridSize;
        const x2 = margin.left + getFrequencyPosition(next.x);
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
    
    // Build the base symbol firstP
    let base: React.ReactNode = null;
      
      if (result.mode === "AC") {
        if (result.masking === 0) {
        // Unmasked AC: Circle for Right ear, X for Left ear (ASHA standard)
        base = result.ear === "R" ? (
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
        base = result.ear === "L" ? (
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
      
      base = (
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
    
    // Overlay no-response arrow using lucide icons (down-right for L, down-left for R)
    if (result.noResponse === 1) {
      const Icon = result.ear === "L" ? ArrowDownRight : ArrowDownLeft;
      return (
        <g key={`${result.x}-${result.y}-${result.ear}-noresponse`}>
          {base}
          <g transform={`translate(${x - 10}, ${y + 10})`}>
            <Icon stroke={color} strokeWidth={2} size={20} fill="none" />
          </g>
        </g>
      );
    }
    
    return <g key={`${result.x}-${result.y}-${result.ear}`}>{base}</g>;
  };

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-sm font-bold mb-3 text-gray-800">{title}</h3>
      <div className="border-2 border-gray-400 bg-white">
        <svg width={chartWidth + margin.left + margin.right} height={height + margin.top + margin.bottom}>
          {/* Grid lines - Major lines for 10dB intervals */}
          {Array.from({ length: 15 }, (_, i) => (
            <line
              key={`major-h-${i}`}
              x1={margin.left}
              y1={margin.top + i * gridSize}
              x2={chartWidth + margin.left}
              y2={margin.top + i * gridSize}
              stroke={i % 2 === 0 ? COLORS.grid : "#E5E5E5"}
              strokeWidth={i % 2 === 0 ? 1.5 : 0.5}
            />
          ))}
          
                     {/* Vertical grid lines for main frequencies (octaves) */}
          {mainFrequencies.map((freq) => {
            const xPos = margin.left + getFrequencyPosition(freq);
            return (
              <line
                key={`main-freq-${freq}`}
                x1={xPos}
                y1={margin.top}
                x2={xPos}
                y2={height + margin.top}
                stroke={COLORS.grid}
                strokeWidth={1}
              />
            );
          })}
          
          {/* Vertical grid lines for mid frequencies (dashed) */}
          {midFrequencies.map((freq) => {
            const xPos = margin.left + getFrequencyPosition(freq);
            return (
              <line
                key={`mid-freq-${freq}`}
                x1={xPos}
                y1={margin.top}
                x2={xPos}
                y2={height + margin.top}
                stroke={COLORS.midOctave}
                strokeWidth={1.5}
                strokeDasharray="4,2"
              />
            );
          })}
          
                     {/* Mid-intensity lines (5 dB intervals, dashed) */}
          {Array.from({ length: 14 }, (_, i) => (
            <line
              key={`mid-intensity-${i}`}
              x1={margin.left}
              y1={margin.top + (i + 0.5) * gridSize}
              x2={chartWidth + margin.left}
              y2={margin.top + (i + 0.5) * gridSize}
              stroke={COLORS.midOctave}
              strokeWidth={1.2}
              strokeDasharray="4,2"
            />
          ))}
          
          {/* Frequency labels: top (octaves) */}
          {mainFrequencies.map((freq) => {
            const label = freq >= 1000 ? `${freq/1000}K` : freq;
            const xPos = margin.left + getFrequencyPosition(freq);
            return (
              <text
                key={`freq-top-${freq}`}
                x={xPos}
                y={margin.top - 10}
                textAnchor="middle"
                fontSize="10"
                fill={COLORS.text}
                fontWeight="bold"
              >
                {label}
              </text>
            );
          })}

          {/* Frequency labels: bottom (mid-octaves) */}
          {midFrequencies.map((freq) => {
            const label = freq >= 1000 ? `${freq/1000}K` : freq;
            const xPos = margin.left + getFrequencyPosition(freq);
            return (
              <text
                key={`freq-bottom-${freq}`}
                x={xPos}
                y={height + margin.top + 35}
                textAnchor="middle"
                fontSize="10"
                fill="#666666"
                fontWeight="normal"
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
            x={chartWidth / 2 + margin.left}
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
            const dbIndex = Math.round((result.y + 10) / 10); // Convert dB to grid index (starts from -10)
            
            if (dbIndex < 0 || dbIndex >= 15) return null;
            
            const x = margin.left + getFrequencyPosition(result.x);
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
  const consultationData = ((consultation as any)?.data || null) as ConsultationModelData;
  const updateConsultationMutation = useUpdateConsultation();
  const reportRef = useRef<HTMLDivElement>(null);
  
  // Screen sharing functionality (shared with video call client)

  console.log("Consultation data:", consultationData);
  const { 
    isSharing: isScreenSharing, 
    isConnecting: isScreenConnecting, 
    toggleScreenShare, 
    error: screenShareError 
  } = useSharedScreenShare();

  // State for show report functionality
  const [isShowingReport, setIsShowingReport] = useState(false);
  
  // New state for report upload
  const [reportUploadState, setReportUploadState] = useState<{
    status: 'idle' | 'uploading' | 'uploaded' | 'failed';
    uploadId?: string;
    reportUrl?: string;
    error?: string;
  }>({ status: 'idle' });
  
  // Form state for diagnosis fields
  const [formData, setFormData] = useState({
    rightEarDiagnosis: "",
    leftEarDiagnosis: "",
    diagnosisComment: "",
    suggestiveOf: "",
    recommendation: "",
    recommendationComment: ""
  });

  // Ear diagnosis options
  const earDiagnosisOptions = [
    { value: "right-ear", label: "Right ear" },
    { value: "left-ear", label: "Left ear" }
  ];

  // Suggestive of diagnosis options
  const suggestiveOfOptions = [
    {
      value: "minimal-sensorineural",
      label: "Minimal Sensorineural or High-Frequency Hearing Loss",
      description: "Monitor regularly with audiometry and avoid noise exposure to prevent progression. If the hearing loss affects speech clarity (especially in noisy environments), consider amplification."
    },
    {
      value: "conductive",
      label: "Conductive Hearing Loss (CHL)",
      description: "Issues in the outer or middle ear. Maintain aural hygiene. Regular audiometry and ENT follow-up."
    },
    {
      value: "sensorineural",
      label: "Sensorineural Hearing Loss",
      description: "Inner ear or auditory nerve issues. No medical or surgical cure in most cases, but management focuses on rehabilitation."
    },
    {
      value: "mixed",
      label: "Mixed Hearing Loss (MHL)",
      description: "Combination of outer ear or middle ear and inner ear. Follow up with audiology to monitor both components."
    }
  ];

  // Recommendation options
  const recommendationOptions = [
    { 
      value: "option-1", 
      label: "Option 1",
      description: "ENT Consultation\nHearing Aid Trial\nFollow up"
    },
    { 
      value: "option-2", 
      label: "Option 2",
      description: "ENT\nHearing Aid Trial\nTinnitus matching and masking\nFollow up"
    },
    { 
      value: "option-3", 
      label: "Option 3",
      description: "ENT consultation\nHearing Aid Trial right ear\nFollow up"
    },
    { 
      value: "option-4", 
      label: "Option 4",
      description: "ENT consultation\nHearing Aid Trial for left ear\nFollow up"
    },
    { 
      value: "option-5", 
      label: "Option 5",
      description: "ENT consultation\nFollow up"
    }
  ];

  // Helper function to get selected recommendation text
  const getSelectedRecommendationText = () => {
    if (!formData.recommendation) return "";
    const selected = recommendationOptions.find(opt => opt.value === formData.recommendation);
    return selected ? selected.label : formData.recommendation;
  };

  // Helper function to add selection to existing text
  const addSelectionToText = (currentText: string, newSelection: string) => {
    if (!newSelection) return currentText;
    if (!currentText) return newSelection;
    return currentText + '\n' + newSelection;
  };

  // Update form data when consultation data is loaded
  React.useEffect(() => {
    if (consultationData?.audiometry) {
      setFormData({
        rightEarDiagnosis: "",
        leftEarDiagnosis: "",
        diagnosisComment: "",
        suggestiveOf: consultationData.audiometry.suggestion || "",
        recommendation: consultationData.audiometry.recommendation || "",
        recommendationComment: ""
      });
    }
  }, [consultationData]);

  // Listen for end:consultation socket event
  useEffect(() => {
    if (!socket) return;
    const handler = (data: any) => {
      toast.info("Consultation has ended. Redirecting to dashboard...");
      if (process.env.NODE_ENV === "development") {
        try { (window as any).location.href = "http://localhost:3001/dashboard"; } catch {}
      } else {
        router.push("/dashboard");
      }
    };
    socket.on("end:consultation", handler);
    return () => { socket.off("end:consultation", handler); };
  }, [socket, router]);

  // Show screen share error if any
  useEffect(() => {
    if (screenShareError) {
      toast.error(`Screen sharing error: ${screenShareError}`);
    }
  }, [screenShareError]);

  // DISABLED: Background upload effect - S3 upload fails due to checksum validation
  // We'll generate fresh PDF on share click instead
  /*
  useEffect(() => {
    // Wait a bit for the report to render, then start background upload
    const timer = setTimeout(() => {
      if (consultationData && reportRef.current && reportUploadState.status === 'idle') {
        console.log('🔄 Starting background upload on page load...');
        initiateBackgroundUpload();
      }
    }, 2000); // Wait 2 seconds for report to render

    return () => clearTimeout(timer);
  }, [consultationData, reportUploadState.status]);
  */

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
    
    try {
      const { exportElementToPdf } = await import("@/lib/pdf");

      await exportElementToPdf(
        reportRef.current,
        `audiometry-report-${consultationData.patient?.code || "unknown"}.pdf`,
        { singlePage: true, fullPage: true }
      );
    } catch (error) {
      console.error("Failed to export PDF:", error);
      toast.error("Failed to generate PDF report.");
    }
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

  const handleShowReport = async () => {
    if (!socket) {
      toast.error("Socket connection not available");
      return;
    }

    const isCurrentlyShowing = isShowingReport || isScreenSharing;
    
    try {
      if (isCurrentlyShowing) {
        // Stop showing report
        const eventName = "generate-report:end";
        socket.emit(eventName, { consultationId });
        setIsShowingReport(false);
        
        // Stop screen sharing if active
        if (isScreenSharing) {
          await toggleScreenShare();
        }
        
        toast.success("Report hidden from patient");
      } else {
        // Start showing report
        const eventName = "generate-report:start";
        socket.emit(eventName, { consultationId });
        setIsShowingReport(true);
        
        // Start screen sharing with the report element
        if (reportRef.current) {
          await toggleScreenShare(reportRef.current);
        } else {
          // Fallback to general screen share if report ref is not available
          await toggleScreenShare();
        }
        
        toast.success("Report shown to patient via screen share");
      }
    } catch (error) {
      console.error("Error handling report display:", error);
      toast.error("Failed to show/hide report");
    }
  };

  // Background upload function - runs when page loads
  const initiateBackgroundUpload = async () => {
    if (!reportRef.current || !consultationData?.patient?.code) {
      console.log('❌ Cannot upload: missing report ref or patient code');
      return;
    }

    setReportUploadState({ status: 'uploading' });
    
    try {
      console.log('🚀 Starting background report upload...');
      
      // Generate PDF blob
      const blob = await exportElementToPdfBlob(reportRef.current, { singlePage: true });
      const filename = `audiometry-report-${consultationData.patient.code}.pdf`;
      
      console.log('📄 PDF generated for background upload:', { size: blob.size, filename });
      
      // Step 1: Initiate upload to get pre-signed URL
      const initiateResult = await initiateReportUpload({
        consultationId: consultationId as string,
        reportType: ReportType.AUDIOMETRY,
        fileName: filename,
        contentType: "application/pdf",
      });
      
      if (!initiateResult.success || !initiateResult.data?.presignedUrl || !initiateResult.data?.uploadId) {
        throw new Error(initiateResult.message || "Failed to initiate report upload");
      }
      
      const { presignedUrl, uploadId } = initiateResult.data;
      console.log('✅ Got pre-signed URL for background upload');
      
      // Step 2: Upload PDF to S3 - Use exact screen recording pattern (no headers!)
      console.log('🔍 Using exact screen recording pattern (no headers)...');
      
      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT", 
        body: blob
        // No headers at all - exactly like screen recordings
      });
      
      if (!uploadResponse.ok) {
        console.error('❌ S3 upload failed:', {
          status: uploadResponse.status,
          statusText: uploadResponse.statusText,
          url: presignedUrl.substring(0, 100) + '...'
        });
        console.log('🔧 S3 upload failed due to checksum validation - backend needs to remove CRC32 checksums');
        
        // Set status as failed but keep uploadId to test complete API
        setReportUploadState({ 
          status: 'failed', 
          uploadId, // Keep uploadId for testing complete API
          error: `S3 upload failed: ${uploadResponse.status}`,
          reportUrl: "https://fpu.branding-element.com/prod/61017/BROADCAST_TEMPLATE_ATTACHMENT/67563-04092025_062434-V2.SENDTEXTMEDIAMESSAGE.pdf"
        });
        
        toast.error("Report upload failed", {
          description: "S3 failed but will test complete API with uploadId",
          duration: 5000,
        });
        
        // Don't return - let it continue to test complete API even with failed S3
      } else {
        console.log('✅ PDF uploaded to S3 successfully in background!');
      }
      
      // Store uploadId for later use when sharing
      setReportUploadState({ 
        status: 'uploaded', 
        uploadId,
        reportUrl: presignedUrl.split('?')[0] // Fallback URL
      });
      
      toast.success("Report ready for sharing", {
        description: "PDF uploaded successfully to cloud storage",
        duration: 3000,
      });
      
    } catch (error) {
      console.error('❌ Background upload failed:', error);
      setReportUploadState({ 
        status: 'failed', 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      // Don't show error toast for background uploads - user didn't initiate it
      console.log('🔧 Background upload failed, will use fallback during share');
    }
  };

  const handleShareReport = async () => {
    console.log('🚀 Share report button clicked');
    
    // Get patient contact number and name
    const patientContact = consultationData?.patient?.contactNumber;
    const patientName = consultationData?.patient?.name;
    
    console.log('📋 Patient data:', { patientContact, patientName });
    
    if (!patientName) {
      console.log('❌ No patient name available');
      toast.error('Patient name not available');
      return;
    }
    
    if (!patientContact) {
      console.log('❌ No patient contact number available');
      toast.error('Patient contact number not available');
      return;
    }

    try {
      let finalReportUrl;
      
      // NEW FLOW: Generate fresh PDF + upload on share click
      console.log('📄 Generating fresh PDF for sharing...');
      toast.info("Generating fresh report...", {
        description: "Creating PDF from current report data",
        duration: 2000,
      });
      
      if (!reportRef.current) {
        throw new Error('Report element not available');
      }
      
      // Step 1: Generate fresh PDF blob from current report
      const blob = await exportElementToPdfBlob(reportRef.current, { singlePage: true, fullPage: true });
      const filename = `audiometry-report-${consultationData?.patient?.code || "fresh"}-${Date.now()}.pdf`;
      
      console.log('📄 Fresh PDF generated:', { 
        size: blob.size, 
        filename,
        timestamp: new Date().toISOString()
      });
      
      // Step 2: Initiate upload to get pre-signed URL
      console.log('🔗 Step 1: Initiating fresh report upload...');
      toast.info("Getting upload URL...", {
        description: "Requesting S3 pre-signed URL for fresh PDF",
        duration: 2000,
      });
      
      const initiateResult = await initiateReportUpload({
        consultationId: consultationId as string,
        reportType: ReportType.AUDIOMETRY,
        fileName: filename,
        contentType: "application/pdf",
      });
      
      if (!initiateResult.success || !initiateResult.data?.presignedUrl || !initiateResult.data?.uploadId) {
        throw new Error(initiateResult.message || "Failed to initiate fresh report upload");
      }
      
      const { presignedUrl, uploadId } = initiateResult.data;
      console.log('✅ Fresh upload initiated, received pre-signed URL');
      
      // Step 3: Try to upload fresh PDF to S3
      console.log('📤 Step 2: Uploading fresh PDF to S3...');
      toast.info("Uploading fresh report...", {
        description: "Uploading fresh PDF to cloud storage",
        duration: 3000,
      });
      
      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT", 
        body: blob
        // No headers - same pattern as screen recordings
      });
      
      if (!uploadResponse.ok) {
        console.error('❌ Fresh S3 upload failed:', {
          status: uploadResponse.status,
          statusText: uploadResponse.statusText,
        });
        
        // Fallback to hardcoded URL if S3 upload fails
        console.log('🔧 S3 upload failed, using fallback test URL');
        finalReportUrl = "https://fpu.branding-element.com/prod/61017/BROADCAST_TEMPLATE_ATTACHMENT/67563-04092025_062434-V2.SENDTEXTMEDIAMESSAGE.pdf";
        
        toast.warning("Fresh PDF upload failed", {
          description: "Using test URL - backend needs to fix S3 checksum validation",
          duration: 4000,
        });
        
      } else {
        console.log('✅ Fresh PDF uploaded to S3 successfully!');
        
        // Step 4: Complete upload to get final fresh report URL
        console.log('🏁 Step 3: Completing fresh upload...');
        toast.info("Finalizing fresh report...", {
          description: "Getting final URL for fresh PDF",
          duration: 2000,
        });
        
        try {
          const completeResult = await completeReportUpload({
            uploadId,
            consultationId: consultationId as string,
            reportType: ReportType.AUDIOMETRY,
          });
          
          console.log('📋 Fresh complete API response:', completeResult);
          
          if (completeResult.success && completeResult.data?.fileUrl) {
            finalReportUrl = completeResult.data.fileUrl;
            console.log('✅ Got fresh final URL from complete API:', finalReportUrl);
            
            toast.success("Fresh report ready!", {
              description: "Fresh PDF uploaded and ready for sharing",
              duration: 3000,
            });
          } else {
            throw new Error('Complete API failed or no fileUrl for fresh PDF');
          }
          
        } catch (completeError) {
          console.warn('⚠️ Fresh complete API failed, using S3 direct URL:', completeError);
          // Use the S3 direct URL without query parameters
          finalReportUrl = presignedUrl.split('?')[0];
          
          toast.warning("Complete API failed, using S3 direct URL", {
            description: "Fresh PDF uploaded but complete API failed",
            duration: 3000,
          });
        }
      }
      
      console.log('📤 Sending WhatsApp message with URL:', finalReportUrl);
      
      // Format phone number properly - remove + and ensure it starts with 91
      const phoneNumber = patientContact || "9058075653"; // Use patient contact or fallback for testing
      let formattedPhoneNumber = phoneNumber.replace(/^\+/, ''); // Remove + if present
      if (!formattedPhoneNumber.startsWith("91")) {
        formattedPhoneNumber = `91${formattedPhoneNumber}`;
      }
      
      console.log('📞 Phone number formatting:', { original: phoneNumber, formatted: formattedPhoneNumber });
      
      console.log('🔄 Calling WhatsApp API route...');
      console.log('📤 API parameters:', {
        to: formattedPhoneNumber,
        patientName: patientName,
        reportUrl: finalReportUrl
      });
      
      // Test API routing first
      console.log('🧪 Testing API routing...');
      try {
        const testResponse = await fetch('/api/test-whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: 'data' })
        });
        const testResult = await testResponse.json();
        console.log('🧪 Test API result:', testResult);
      } catch (testError) {
        console.error('❌ Test API failed:', testError);
      }
      
      let result;
      try {
        console.log('🌐 Making fetch request to /api/whatsapp/send-report-dialog');
        const response = await fetch('/api/whatsapp/send-report-dialog', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: formattedPhoneNumber,
            patientName: patientName,
            reportUrl: finalReportUrl
          })
        });
        
        console.log('📡 Fetch response status:', response.status, response.statusText);
        console.log('📡 Fetch response ok:', response.ok);
        
        result = await response.json();
        console.log('📱 WhatsApp API result:', result);
      } catch (apiError) {
        console.error('❌ API call failed:', apiError);
        toast.error(`API call failed: ${apiError}`);
        return;
      }
      
      if (result.success) {
        toast.success('Report shared to patient via WhatsApp');
      } else {
        console.error('WhatsApp send error:', result.error);
        toast.error(`Failed to share via WhatsApp: ${result.error}`);
      }
    } catch (err) {
      console.error('❌ Share report error:', err);
      toast.error('Failed to share report');
    }
  };

  return (
    <div className="p-6 flex justify-center bg-gray-100">
      <div className="w-[1100px] bg-white shadow-lg">
        <ReportTopActions onDownload={handleDownloadPDF} onShare={handleShareReport} />
        
        <div ref={reportRef} data-report-capture="true" className="bg-white" style={{ fontFamily: 'Arial, sans-serif', height: 'auto', minHeight: 'auto' }}>
          {/* Header */}
          <div className="relative text-white overflow-hidden" >
            <div className="relative flex items-center justify-between p-6 z-10">
              {/* Left Side - Logo */}
              <div className="flex items-center bg-white p-2 rounded">
              <Image
                    src="/EARKART LOGO BLUE.webp" 
                    alt="earKART Logo" 
                    width={200} 
                    height={250}
                    className="bg-white"
                  />
              </div>
              
              {/* Right Side - Clean Card */}
              <div className="relative">
                <div 
                  className="text-blue-900 px-6 py-4 rounded-lg shadow-md"
                  style={{ backgroundColor: '#8bdaef' }}
                >
                  <div className="text-center">
                    <p className="font-bold text-sm mb-2">{consultationData.centre?.user?.name || "Clinic Name"}</p>
                    <div className="flex items-center justify-center mb-1">
                      <span className="text-xs mr-1">👨‍⚕️</span>
                      <span className="text-xs">Dr. {consultationData.centre?.entName || "ENT Name"}</span>
                    </div>
                    <div className="flex items-center justify-center mb-1">
                      <span className="text-xs mr-1">📞</span>
                      <span className="text-xs">{consultationData.centre?.contactNumber || "+91 XXXXXXXXXX"}</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="text-xs mr-1">📍</span>
                      <span className="text-xs">{consultationData.centre?.address || "Address"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            

          </div>

          {/* Pure Tone Audiogram Title */}
          <div className="text-center py-8 bg-gray-50">
            <h2 className="text-2xl font-bold text-gray-800">Pure Tone Audiogram</h2>
          </div>

          {/* Patient Information */}
          <div className="px-10 py-6 bg-white border-b relative z-10">
            <div className="grid grid-cols-12 gap-6 text-base">
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
            
            <div className="grid grid-cols-12 gap-6 text-base mt-4">
              <div className="col-span-7 flex items-center">
                <span className="font-medium mr-2">Address :</span>
                <span className="border-b border-dotted border-gray-400 flex-1 pb-1">
                  {consultationData.patient?.address || ""}
                </span>
              </div>
              <div className="col-span-2 flex items-center">
                <span className="font-medium mr-2">Age :</span>
                <span className="border-b border-dotted border-gray-400 flex-1 pb-1">
                  {consultationData.patient?.age || 
                   (consultationData.patient?.dob ? 
                     Math.floor((Date.now() - new Date(consultationData.patient.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) 
                     : "")}
                </span>
              </div>
              <div className="col-span-2 flex items-center">
                <span className="font-medium mr-2">Sex :</span>
                <span className="border-b border-dotted border-gray-400 flex-1 pb-1">
                  {consultationData.patient?.gender || ""}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 text-base mt-4 bg-white">
              <div className="flex items-center">
                <span className="font-medium mr-2">Contact No. :</span>
                <span className="border-b border-dotted border-gray-400 flex-1 pb-1">
                  {consultationData.patient?.contactNumber || ""}
                </span>
              </div>
              <div className="flex items-center">
                <span className="font-medium mr-2">Referred by :</span>
                <span className="border-b border-dotted border-gray-400 flex-1 pb-1">{consultationData.centre?.entName || "ENT Name"}</span>
              </div>
            </div>
          </div>

          {/* Audiogram Charts */}
          <div className="px-10 py-8 bg-gray-50 relative z-0 overflow-hidden" data-section="audiogram-charts">
            <div className="flex justify-between items-start gap-8 pointer-events-none">
              <div className="flex-1 overflow-hidden">
                <AudiogramChart
                  title="Right Ear"
                  results={rightResults}
                  ear="R"
                />
              </div>
              <div className="flex-1 overflow-hidden">
                <AudiogramChart
                  title="Left Ear"
                  results={leftResults}
                  ear="L"
                />
              </div>
            </div>
          </div>

          {/* PTA and Symbols Section */}
          <div className="mx-10 mb-8 relative z-10">
            <div className="flex gap-6 bg-white">
              {/* PTA Section */}
              <div className="flex-1">
                <div className="bg-blue-900 text-white p-4 text-center">
                  <h3 className="text-base font-bold">PTA (dB HL)</h3>
                  <div className="text-sm opacity-80">4-Frequency Average (500, 1K, 2K, 4K Hz)</div>
                  <div className="text-sm opacity-70">*Includes no-response values</div>
                </div>
                <div className="bg-white border border-gray-300 p-4">
                  <div className="grid grid-cols-3 gap-0 text-sm">
                  <div className="text-center font-bold border border-gray-400 p-2 bg-gray-100 text-gray-800">Test</div>
                    <div className="text-center font-bold border border-gray-400 p-2 bg-gray-100 text-gray-800">Right</div>
                    <div className="text-center font-bold border border-gray-400 p-2 bg-gray-100 text-gray-800">Left</div>
                    <div className="font-bold border border-gray-400 p-2 text-center bg-gray-100 text-gray-800">AC</div>
                    <div className="border border-gray-400 p-2 text-center font-semibold text-gray-800">
                      {acAverage.rightEar ? `${Math.round(acAverage.rightEar)}` : "—"}
                    </div>
                    <div className="border border-gray-400 p-2 text-center font-semibold text-gray-800">
                      {acAverage.leftEar ? `${Math.round(acAverage.leftEar)}` : "—"}
                    </div>
                    <div className="font-bold border border-gray-400 p-2 text-center bg-gray-100 text-gray-800">BC</div>
                    <div className="border border-gray-400 p-2 text-center font-semibold text-gray-800">
                      {bcAverage.rightEar ? `${Math.round(bcAverage.rightEar)}` : "—"}
                    </div>
                    <div className="border border-gray-400 p-2 text-center font-semibold text-gray-800">
                      {bcAverage.leftEar ? `${Math.round(bcAverage.leftEar)}` : "—"}
                    </div>
                  </div>
                
                  {/* Clinical Notes for No Responses */}
                  {(noResponseFreqs.rightAC.length > 0 || noResponseFreqs.leftAC.length > 0 || 
                    noResponseFreqs.rightBC.length > 0 || noResponseFreqs.leftBC.length > 0) && (
                    <div className="mt-3 pt-3 border-t border-gray-300">
                      <div className="text-xs font-semibold text-center mb-2 text-gray-800">No Response Frequencies</div>
                      <div className="text-xs text-gray-700 space-y-1">
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
              </div>
              
              {/* Symbols Section */}
              <div className="flex-1">
                <div className="bg-blue-900 text-white p-4 text-center">
                  <h3 className="text-base font-bold">Symbols (ASHA Standards)</h3>
                </div>
                <div className="bg-white border border-gray-300 p-4">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    {/* Air Conduction Unmasked */}
                    <div className="text-center">
                      <div className="font-bold mb-2 text-gray-800 text-xs">AC Unmasked</div>
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center justify-center">
                          <div className="w-6 flex justify-center">
                            <span className="text-red-500 text-lg">○</span>
                          </div>
                          <span className="text-xs text-gray-700 ml-1">R</span>
                        </div>
                        <div className="flex items-center justify-center">
                          <div className="w-6 flex justify-center">
                            <span className="text-blue-500 text-lg font-bold">×</span>
                          </div>
                          <span className="text-xs text-gray-700 ml-1">L</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Air Conduction Masked */}
                    <div className="text-center">
                      <div className="font-bold mb-2 text-gray-800 text-xs">AC Masked</div>
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center justify-center">
                          <div className="w-6 flex justify-center">
                            <span className="text-red-500 text-lg">□</span>
                          </div>
                          <span className="text-xs text-gray-700 ml-1">R</span>
                        </div>
                        <div className="flex items-center justify-center">
                          <div className="w-6 flex justify-center">
                            <span className="text-blue-500 text-lg">△</span>
                          </div>
                          <span className="text-xs text-gray-700 ml-1">L</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Bone Conduction */}
                    <div className="text-center">
                      <div className="font-bold mb-2 text-gray-800 text-xs">Bone Conduction</div>
                      <div className="flex flex-col space-y-1">
                        <div className="text-xs font-semibold text-gray-700 mb-1">Unmasked:</div>
                        <div className="flex items-center justify-center space-x-3 mb-2">
                          <div className="flex items-center">
                            <span className="text-red-500 text-lg font-bold">&lt;</span>
                            <span className="text-xs text-gray-700 ml-1">R</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-blue-500 text-lg font-bold">&gt;</span>
                            <span className="text-xs text-gray-700 ml-1">L</span>
                          </div>
                        </div>
                        <div className="text-xs font-semibold text-gray-700 mb-1">Masked:</div>
                        <div className="flex items-center justify-center space-x-3">
                          <div className="flex items-center">
                            <span className="text-red-500 text-lg font-bold">[</span>
                            <span className="text-xs text-gray-700 ml-1">R</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-blue-500 text-lg font-bold">]</span>
                            <span className="text-xs text-gray-700 ml-1">L</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* No Response */}
                    <div className="text-center">
                      <div className="font-bold mb-2 text-gray-800 text-xs">No Response</div>
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center justify-center">
                          <div className="w-6 flex justify-center">
                            <span className="text-red-500 text-lg">↙</span>
                          </div>
                          <span className="text-xs text-gray-700 ml-1">R</span>
                        </div>
                        <div className="flex items-center justify-center">
                          <div className="w-6 flex justify-center">
                            <span className="text-blue-500 text-lg">↘</span>
                          </div>
                          <span className="text-xs text-gray-700 ml-1">L</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Diagnosis Fields - Only show in edit mode, not in PDF */}
          <div className="px-8 mb-6 space-y-4 print:hidden">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Diagnosis Section */}
              <div>
                <div className="text-sm font-bold mb-2">Diagnosis :</div>
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (!value) return;
                    const selectedOption = earDiagnosisOptions.find(opt => opt.value === value);
                    if (!selectedOption) return;
                    
                    const newSelection = `${selectedOption.label}:`;
                    const currentText = formData.diagnosisComment || "";
                    const updatedText = addSelectionToText(currentText, newSelection);
                    
                    setFormData(prev => ({ 
                      ...prev, 
                      diagnosisComment: updatedText
                    }));
                  }}
                >
                  <SelectTrigger className="h-12 border border-gray-400 bg-gray-50 w-full max-w-md rounded-md">
                    <SelectValue placeholder="Select ear..." className="text-gray-600 text-sm" />
                  </SelectTrigger>
                  <SelectContent>
                    {earDiagnosisOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="py-2 text-center">
                          <div className="font-medium text-sm text-blue-900">{option.label}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  value={formData.diagnosisComment}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    diagnosisComment: e.target.value 
                  }))}
                  placeholder="Selected ears will appear here. Add diagnosis details below..."
                  className="h-24 resize-none border border-gray-400 bg-gray-50 mt-2 w-full"
                />
              </div>

              {/* Suggestive of Diagnosis Section */}
              <div>
                <div className="text-sm font-bold mb-2">Suggestive of Diagnosis :</div>
                <Select
                  value={formData.suggestiveOf}
                  onValueChange={(value) => {
                    if (!value) return;
                    const selectedOption = suggestiveOfOptions.find(opt => opt.value === value);
                    if (!selectedOption) return;
                    
                    const newSelection = `${selectedOption.label}\n${selectedOption.description}`;
                    const currentText = formData.suggestiveOf || "";
                    const updatedText = addSelectionToText(currentText, newSelection);
                    
                    setFormData(prev => ({ 
                      ...prev, 
                      suggestiveOf: updatedText
                    }));
                  }}
                >
                  <SelectTrigger className="h-16 border border-gray-400 bg-gray-50 w-full max-w-lg rounded-md">
                    <SelectValue placeholder="Select suggestive diagnosis..." className="text-gray-600 text-sm leading-tight">
                      {formData.suggestiveOf ? "Diagnosis selected" : "Select suggestive diagnosis..."}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="w-[600px] max-h-96 overflow-y-auto">
                    {suggestiveOfOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="py-4 px-3 w-full">
                          <div className="font-semibold text-sm text-center mb-3 text-blue-900 leading-tight px-2">
                            {option.label}
                          </div>
                          <div className="text-xs text-gray-700 leading-relaxed bg-blue-50 p-4 rounded-md border border-blue-200">
                            {option.description}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  value={formData.suggestiveOf}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    suggestiveOf: e.target.value 
                  }))}
                  placeholder="Selected suggestive diagnoses will appear here. Add additional comments below..."
                  className="h-24 resize-none border border-gray-400 bg-gray-50 mt-2 w-full"
                />
              </div>
              
              <div>
                <div className="text-sm font-bold mb-2">Recommendation :</div>
                <Select
                  value={formData.recommendation}
                  onValueChange={(value) => {
                    if (!value) return;
                    const selectedOption = recommendationOptions.find(opt => opt.value === value);
                    if (!selectedOption) return;
                    
                    const newSelection = selectedOption.description;
                    const currentText = formData.recommendationComment || "";
                    const updatedText = addSelectionToText(currentText, newSelection);
                    
                    setFormData(prev => ({ 
                      ...prev, 
                      recommendation: value,
                      recommendationComment: updatedText
                    }));
                  }}
                >
                  <SelectTrigger className="h-12 border border-gray-400 bg-gray-50 w-full max-w-md rounded-md">
                    <SelectValue placeholder="Select recommendation..." className="text-gray-600">
                      {formData.recommendation ? "Recommendation selected" : "Select recommendation..."}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="w-[500px] max-h-96 overflow-y-auto">
                    {recommendationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="py-4 px-3 w-full">
                          <div className="font-semibold text-sm text-center mb-3 text-blue-900 leading-tight px-2">
                            {option.label}
                          </div>
                          <div className="text-xs text-gray-700 leading-relaxed bg-blue-50 p-4 rounded-md border border-blue-200 whitespace-pre-line">
                            {option.description}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  value={formData.recommendationComment}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    recommendationComment: e.target.value 
                  }))}
                  placeholder="Selected recommendations will appear here. Add additional comments below..."
                  className="h-24 resize-none border border-gray-400 bg-gray-50 mt-2 w-full"
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
          </div>

          {/* Diagnosis Display for PDF - Only show in print */}
          <div className="px-8 mb-6 space-y-4 hidden print:block">
            <div>
              <div className="text-sm font-bold mb-2">Diagnosis :</div>
              <div className="border border-gray-400 bg-gray-50 p-4 whitespace-pre-wrap text-sm leading-relaxed break-words overflow-visible" style={{ minHeight: 'auto', height: 'auto' }}>
                {formData.diagnosisComment || "No diagnosis entered"}
              </div>
            </div>
            
            <div>
              <div className="text-sm font-bold mb-2">Suggestive of Diagnosis :</div>
              <div className="border border-gray-400 bg-gray-50 p-4 whitespace-pre-wrap text-sm leading-relaxed break-words overflow-visible" style={{ minHeight: 'auto', height: 'auto' }}>
                {formData.suggestiveOf || "No suggestions entered"}
              </div>
            </div>
            
            <div>
              <div className="text-sm font-bold mb-2">Recommendation :</div>
              <div className="border border-gray-400 bg-gray-50 p-4 whitespace-pre-wrap text-sm leading-relaxed break-words overflow-visible" style={{ minHeight: 'auto', height: 'auto' }}>
                {formData.recommendationComment || "No recommendations entered"}
              </div>
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

      {/* Screen Share Status Notification */}
      {isScreenSharing && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <span>🖥️</span>
          <span>Screen sharing active - Patient can see the report</span>
        </div>
      )}

      {/* Floating Action Buttons */}
      <FloatingReportActions
        isScreenConnecting={isScreenConnecting}
        isScreenSharing={isScreenSharing}
        isShowingReport={isShowingReport}
        onToggleShowReport={handleShowReport}
        onShare={handleShareReport}
        onDoAnotherTest={handleDoAnotherTest}
        onEndConsultation={handleEndConsultation}
      />




    </div>
  );
}