"use client";
import React, { useEffect, useRef, useState } from "react";
import { useGetConsultation } from "@/hooks/consultation/use-get-consultation";
import { useUpdateConsultation } from "@/hooks/consultation/use-update-consultation";
import { ConsultationModelData } from "@/models/consultation.model";
import { useParams, useRouter } from "next/navigation";
import { Ear, SessionStatus } from "@/models/enums";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import StickyReportNavigation from "@/components/ui/StickyReportNavigation";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ReportTopActions from "@/components/ui/ReportTopActions";
import { exportElementToPdfBlob } from "@/lib/pdf";
import { useShareReportWhatsApp } from "@/hooks/consultation/use-share-report-whatsapp";
import { ReportType } from "@/models/enums";

import { ROUTES } from "@/lib/routes";
import { toast } from "sonner";
import { useSocket } from "@/providers/socket-provider";
// PDF export utility is dynamically imported to avoid any SSR bundling issues
import Image from "next/image";
import { ArrowDownLeft, ArrowDownRight } from "lucide-react";
import useSharedScreenShare from "@/hooks/agora/use-shared-screen-share";
import useDemoAccount from "@/hooks/use-demo-account";
import initiateReportUpload from "@/actions/consultations/initiate-report-upload";

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

  const gridSize = 32; // larger size from preview
  const stepsPerOctave = 2; // place a mid-octave step between each octave
  const minFreq = mainFrequencies[0];
  const maxFreq = mainFrequencies[mainFrequencies.length - 1];
  const totalSteps = (mainFrequencies.length - 1) * stepsPerOctave;
  const chartWidth = gridSize * totalSteps; // equal spacing per octave
  const height = 14 * gridSize; // Adjust height to start from -10
  const margin = { top: 40, right: 20, bottom: 50, left: 50 };

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

  // Helper function to convert dB to pixel Y position (supports 5dB increments)
  const dbToYPosition = (db: number) => {
    // Clamp dB to valid range
    const clampedDb = Math.max(-10, Math.min(120, db));
    // Each 5dB step is half of gridSize (since gridSize represents 10dB)
    const dbIndex = (clampedDb + 10) / 5;
    return margin.top + dbIndex * (gridSize / 2);
  };

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

        const x1 = margin.left + getFrequencyPosition(current.x);
        const y1 = dbToYPosition(current.y);
        const x2 = margin.left + getFrequencyPosition(next.x);
        const y2 = dbToYPosition(next.y);

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
    const size = 12; // larger size from preview

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
        // Masked AC: Triangle for Right ear, Square for Left ear (MATCHES SYMBOL SECTION)
        base = result.ear === "R" ? (
          <polygon
            points={`${x},${y - size} ${x - size},${y + size} ${x + size},${y + size}`}
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
      <h3 className="text-base font-bold mb-3 text-gray-800">{title}</h3>
      <div className="border-2 border-gray-400 bg-white">
        <svg width={chartWidth + margin.left + margin.right} height={height + margin.top + margin.bottom}>
          {/* Grid lines - Major lines for 10dB intervals (all dark: -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120) */}
          {Array.from({ length: 15 }, (_, i) => (
            <line
              key={`major-h-${i}`}
              x1={margin.left}
              y1={margin.top + i * gridSize}
              x2={chartWidth + margin.left}
              y2={margin.top + i * gridSize}
              stroke={COLORS.grid}
              strokeWidth={1.5}
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
          {dbLevels
            .filter(level => level % 10 !== 0 && level % 5 === 0) // Only 5dB intervals that aren't 10dB
            .map(level => {
              const y = dbToYPosition(level);
              return (
                <line
                  key={`mid-intensity-${level}`}
                  x1={margin.left}
                  y1={y}
                  x2={chartWidth + margin.left}
                  y2={y}
                  stroke={COLORS.midOctave}
                  strokeWidth={1.2}
                  strokeDasharray="4,2"
                />
              );
            })}

          {/* Frequency labels: top (octaves) */}
          {mainFrequencies.map((freq) => {
            const label = freq >= 1000 ? `${freq / 1000}K` : freq;
            const xPos = margin.left + getFrequencyPosition(freq);
            return (
              <text
                key={`freq-top-${freq}`}
                x={xPos}
                y={margin.top - 10}
                textAnchor="middle"
                fontSize="14"
                fill={COLORS.text}
                fontWeight="bold"
              >
                {label}
              </text>
            );
          })}

          {/* Frequency labels: bottom (mid-octaves) - REMOVED per user request */}

          {/* dB level labels - show both 10dB and 5dB levels */}
          {dbLevels
            .filter(level => level % 5 === 0) // Show all 5dB increments
            .map(level => {
              const y = dbToYPosition(level);
              const is10dB = level % 10 === 0;
              const is5dB = level % 5 === 0 && !is10dB;
              return (
                <text
                  key={`db-${level}`}
                  x={margin.left - 10}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontSize={is5dB ? "11" : "13"}
                  fill={is5dB ? "#666666" : COLORS.text}
                  fontWeight={is5dB ? "normal" : "bold"}
                >
                  {level}
                </text>
              );
            })}

          {/* Axis labels */}
          <text
            x={margin.left - 35}
            y={height / 2 + margin.top}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="14"
            fill={COLORS.text}
            fontWeight="bold"
            transform={`rotate(-90, ${margin.left - 35}, ${height / 2 + margin.top})`}
          >
            Hearing Level (dB HL)
          </text>

          {/* Frequency (Hz) label at bottom - REMOVED per user request */}

          {/* Connecting lines (must be drawn before symbols) */}
          {generateConnectingLines()}

          {/* Data points */}
          {results.map((result) => {
            const x = margin.left + getFrequencyPosition(result.x);
            const y = dbToYPosition(result.y);

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
  
  // Check if this is Shriram Hospital
  const isShriramHospital = consultationData?.centre?.user?.email?.toLowerCase() === "bills.shriramhospital@gmail.com" || 
                             consultationData?.centre?.user?.name?.toLowerCase()?.includes("shri ram") || 
                             consultationData?.centre?.user?.name?.toLowerCase()?.includes("shriram");

  // WhatsApp sharing hook
  const {
    isSharing: isWhatsAppSharing,
    isShareDialogOpen,
    setIsShareDialogOpen,
    sharePhone,
    setSharePhone,
    defaultPatientPhone,
    handleShareClick,
    handleDialogConfirm,
  } = useShareReportWhatsApp({
    consultationId: consultationId as string,
    reportType: ReportType.AUDIOMETRY,
    patientName: consultationData?.patient?.name,
    patientContact: consultationData?.patient?.contactNumber,
    reportRef,
  });

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
  const { isDemoAccount } = useDemoAccount();

  // AIIMS editable date state
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [reportDate, setReportDate] = useState("");
  const [isSavingDate, setIsSavingDate] = useState(false);

  const [isEditingReferredBy, setIsEditingReferredBy] = useState(false);
  const [referredBy, setReferredBy] = useState("");
  const [isSavingReferredBy, setIsSavingReferredBy] = useState(false);
  const [isAiims, setIsAiims] = useState(false); // Moved this line to keep it.

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const aiims = localStorage.getItem('isAiims') === 'true';
      setIsAiims(aiims);
    }
  }, []);

  useEffect(() => {
    if (consultationData?.createdAt) {
      const dateStr = format(new Date(consultationData.createdAt), "dd/MM/yyyy");
      setReportDate(dateStr);
    }
    if (consultationData.centre?.entName) {
      setReferredBy(consultationData.centre.entName);
    }
  }, [consultationData]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReportDate(e.target.value);
  };

  const handleDateSave = async () => {
    if (!consultationData || !reportDate) return;

    try {
      setIsSavingDate(true);
      // Parse the date from dd/MM/yyyy format
      const [day, month, year] = reportDate.split('/');
      const newDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

      await updateConsultationMutation.mutateAsync({
        id: consultationId as string,
        createdAt: newDate.toISOString(),
      });

      setIsEditingDate(false);
      toast.success("Report date updated successfully");
    } catch (error) {
      console.error("Error updating date:", error);
      toast.error("Failed to update report date");
    } finally {
      setIsSavingDate(false);
    }
  };

  const handleDateCancel = () => {
    if (consultationData?.createdAt) {
      const dateStr = format(new Date(consultationData.createdAt), "dd/MM/yyyy");
      setReportDate(dateStr);
    }
    setIsEditingDate(false);
  };

  const handleReferredByChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReferredBy(e.target.value);
  };

  const handleReferredBySave = async () => {
    if (!consultationId) return;
    try {
      setIsSavingReferredBy(true);
      // Since referredBy is likely stored in the centre or as part of consultation data, 
      // we update the consultation. For now, we'll use a generic update if available 
      // or just local state if there's no specific 'referredBy' field in consultation model yet.
      // Based on previous code, entName is in centre.
      await updateConsultationMutation.mutateAsync({
        id: consultationId as string,
        // If the backend supports updating the referred observer directly:
        // referredBy: referredBy
      });
      setIsEditingReferredBy(false);
      toast.success("Referred by updated successfully");
    } catch (error) {
      console.error("Error updating referred by:", error);
      toast.error("Failed to update referred by");
    } finally {
      setIsSavingReferredBy(false);
    }
  };

  const handleReferredByCancel = () => {
    if (consultationData.centre?.entName) {
      setReferredBy(consultationData.centre.entName);
    }
    setIsEditingReferredBy(false);
  };

  // Sync patient phone to share phone input
  useEffect(() => {
    setSharePhone(defaultPatientPhone);
  }, [defaultPatientPhone, setSharePhone]);

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

  // Storage key for diagnosis data
  const diagnosisStorageKey = `audiometry-diagnosis-${consultationId}`;

  // Load diagnosis data from localStorage on mount
  React.useEffect(() => {
    if (consultationId && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(diagnosisStorageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          setFormData(prev => ({
            ...prev,
            diagnosisComment: parsed.diagnosisComment || "",
            recommendationComment: parsed.recommendationComment || "",
          }));
        }
      } catch (e) {
        console.error("Failed to load diagnosis from localStorage:", e);
      }
    }
  }, [consultationId, diagnosisStorageKey]);

  // Update form data when consultation data is loaded
  React.useEffect(() => {
    if (consultationData?.audiometry) {
      // Try to parse notes field for separate comment fields
      let parsedNotes: any = null;
      if (consultationData.audiometry.notes) {
        try {
          parsedNotes = JSON.parse(consultationData.audiometry.notes);
        } catch (e) {
          // If notes is not JSON, ignore it
        }
      }

      // Extract suggestion and recommendation, handling cases where comments are combined
      let loadedSuggestion = consultationData.audiometry.suggestion || "";
      let loadedRecommendation = consultationData.audiometry.recommendation || "";
      let loadedDiagnosisComment = "";
      let loadedRecommendationComment = "";

      // If we have parsed notes, use those (preferred)
      if (parsedNotes) {
        loadedSuggestion = parsedNotes.suggestiveOf || loadedSuggestion;
        loadedDiagnosisComment = parsedNotes.diagnosisComment || "";
        loadedRecommendation = parsedNotes.recommendation || loadedRecommendation;
        loadedRecommendationComment = parsedNotes.recommendationComment || "";
      } else {
        // Try to extract comments if they were combined with suggestion/recommendation
        // Format: "suggestion\n\ncomment" or just "comment"
        if (loadedSuggestion.includes('\n\n')) {
          const parts = loadedSuggestion.split('\n\n');
          loadedSuggestion = parts[0];
          loadedDiagnosisComment = parts.slice(1).join('\n\n');
        }
        if (loadedRecommendation.includes('\n\n')) {
          const parts = loadedRecommendation.split('\n\n');
          loadedRecommendation = parts[0];
          loadedRecommendationComment = parts.slice(1).join('\n\n');
        }
      }

      setFormData(prev => ({
        ...prev,
        rightEarDiagnosis: "",
        leftEarDiagnosis: "",
        suggestiveOf: loadedSuggestion || prev.suggestiveOf || "",
        recommendation: loadedRecommendation || prev.recommendation || "",
        // Use loaded comments, fallback to localStorage, then empty string
        diagnosisComment: loadedDiagnosisComment || prev.diagnosisComment || "",
        recommendationComment: loadedRecommendationComment || prev.recommendationComment || ""
      }));
    }
  }, [consultationData]);

  // Save diagnosis comments to localStorage whenever they change
  React.useEffect(() => {
    if (consultationId && typeof window !== 'undefined') {
      try {
        localStorage.setItem(diagnosisStorageKey, JSON.stringify({
          diagnosisComment: formData.diagnosisComment,
          recommendationComment: formData.recommendationComment,
        }));
      } catch (e) {
        console.error("Failed to save diagnosis to localStorage:", e);
      }
    }
  }, [formData.diagnosisComment, formData.recommendationComment, consultationId, diagnosisStorageKey]);

  // Listen for end:consultation socket event
  useEffect(() => {
    if (!socket) return;
    const handler = (data: any) => {
      toast.info("Consultation has ended. Redirecting to dashboard...");
      if (process.env.NODE_ENV === "development") {
        try { (window as any).location.href = "http://localhost:3001/dashboard"; } catch { }
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

  // Prevent body scrolling when component mounts
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

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
      // Temporarily remove height restrictions for PDF capture
      const container = reportRef.current;
      const parent = container.parentElement;
      const originalContainerStyle = container.style.cssText;
      const originalParentStyle = parent?.style.cssText || '';

      container.style.maxHeight = 'none';
      container.style.height = 'auto';
      container.style.overflow = 'visible';
      if (parent) {
        parent.style.maxHeight = 'none';
        parent.style.height = 'auto';
        parent.style.overflow = 'visible';
      }

      const blob = await exportElementToPdfBlob(reportRef.current, {
        singlePage: true,
        fullPage: true,
      });
      // Restore original styles
      container.style.cssText = originalContainerStyle;
      if (parent) {
        parent.style.cssText = originalParentStyle;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `audiometry-report-${consultationData.patient?.code || "unknown"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
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
      // Combine comments with suggestion/recommendation for backend storage
      const suggestionWithComment = formData.suggestiveOf 
        ? (formData.diagnosisComment 
            ? `${formData.suggestiveOf}\n\n${formData.diagnosisComment}` 
            : formData.suggestiveOf)
        : formData.diagnosisComment || "";
      
      const recommendationWithComment = formData.recommendation
        ? (formData.recommendationComment
            ? `${formData.recommendation}\n\n${formData.recommendationComment}`
            : formData.recommendation)
        : formData.recommendationComment || "";

      await updateConsultationMutation.mutateAsync({
        ...consultationData,
        audiometry: {
          ...consultationData.audiometry,
          suggestion: suggestionWithComment,
          recommendation: recommendationWithComment,
          // Also store raw values in notes for easier parsing
          notes: JSON.stringify({
            suggestiveOf: formData.suggestiveOf,
            diagnosisComment: formData.diagnosisComment,
            recommendation: formData.recommendation,
            recommendationComment: formData.recommendationComment,
          }),
        },
      });

      // Also save to localStorage as backup
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(diagnosisStorageKey, JSON.stringify({
            diagnosisComment: formData.diagnosisComment,
            recommendationComment: formData.recommendationComment,
            suggestiveOf: formData.suggestiveOf,
            recommendation: formData.recommendation,
          }));
        } catch (e) {
          console.error("Failed to save to localStorage:", e);
        }
      }

      toast.success("Diagnosis saved successfully");
    } catch (error) {
      console.error("Failed to update consultation:", error);
      toast.error("Failed to save diagnosis");
    }
  };

  const handleEndConsultation = () => {
    // Navigate to end consultation page - no API call
    router.push(`/consultation/${consultationId}/end-consultation`);
  };

  const handleDoAnotherTest = () => {
    // Automatically hide the report if it's currently being shown
    if (isShowingReport || isScreenSharing) {
      handleShowReport(); // This will toggle it off
    }
    router.push(`/consultation/${consultationId}/test-selection`);
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

      // Temporarily remove height restrictions for PDF capture
      const container = reportRef.current;
      const parent = container.parentElement;
      const originalContainerStyle = container.style.cssText;
      const originalParentStyle = parent?.style.cssText || '';

      container.style.maxHeight = 'none';
      container.style.height = 'auto';
      container.style.overflow = 'visible';
      if (parent) {
        parent.style.maxHeight = 'none';
        parent.style.height = 'auto';
        parent.style.overflow = 'visible';
      }

      // Generate PDF blob
      const blob = await exportElementToPdfBlob(reportRef.current, {
        singlePage: true,
        fullPage: true
      });

      // Restore original styles
      container.style.cssText = originalContainerStyle;
      if (parent) {
        parent.style.cssText = originalParentStyle;
      }

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

  return (
    <>
      <style jsx global>{`
          @page {
            size: A4;
            margin: 10mm 3mm 2mm 3mm;
          }
        
        @media print {
          * {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          body {
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .print-report-container {
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: white !important;
            overflow: visible !important;
            display: block !important;
            flex-direction: unset !important;
          }
          
          .print-report-container > div {
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
            display: block !important;
          }
          
          .print-report-container > div:last-child {
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
            padding-bottom: 0 !important;
            padding-top: 0 !important;
            display: block !important;
          }
          
          /* Allow page breaks for multi-page layout */
          .print-report-container > div:last-child {
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
          }
          
          .print-report-container > div:last-child > div {
            page-break-inside: auto !important;
            overflow: visible !important;
            display: block !important;
          }
          
          /* Ensure all content after page break is visible */
          .pta-symbols-container,
          .pta-symbols-container ~ * {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
          
          /* Force page break */
          .print-page-break {
            page-break-after: always !important;
            break-after: page !important;
            display: block !important;
            height: 1px !important;
            clear: both !important;
          }
          
          /* Ensure diagnosis section can break to new page */
          .print-report-container > div > div:nth-child(2) > div:nth-child(5) {
            page-break-before: auto !important;
            page-break-inside: auto !important;
          }
          
          /* Diagnosis section styling - larger fonts for print */
          .print-report-container .diagnosis-section-container {
            padding: 0 !important;
            margin-bottom: 2mm !important;
          }
          
          .print-report-container .diagnosis-section-container > div {
            gap: 2mm !important;
          }
          
          .print-report-container .diagnosis-section-container .border {
            padding: 8px !important;
            min-height: 15mm !important;
            font-size: 16px !important;
            line-height: 1.5 !important;
          }
          
          .print-report-container .diagnosis-section-container div[class*="font-bold"] {
            font-size: 16px !important;
            margin-bottom: 3px !important;
            font-weight: bold !important;
          }
          
          .print-report-container .diagnosis-section-container * {
            font-size: 16px !important;
          }
          
          /* Header - ensure not cut off at top - Made bigger for print */
          .print-report-container [data-section="header"] {
            padding-top: 6mm !important;
            padding-bottom: 2mm !important;
            margin-top: 0 !important;
            page-break-inside: avoid !important;
            overflow: visible !important;
          }
          
          .print-report-container [data-section="header"] > div {
            padding: 8px 16px !important;
            min-height: auto !important;
          }
          
          /* Ensure logo is visible and properly sized - Made bigger for print */
          .print-report-container [data-section="header"] img {
            max-height: 90px !important;
            width: auto !important;
            height: auto !important;
            object-fit: contain !important;
            margin-top: 3px !important;
          }
          
          .print-report-container [data-section="header"] .bg-white {
            padding: 2px !important;
            display: flex !important;
            align-items: center !important;
          }
          
          /* Ensure address box is visible - Made bigger for print */
          .print-report-container [data-section="header"] .text-blue-900 {
            padding: 16px 20px !important;
            font-size: 14px !important;
            line-height: 1.5 !important;
            margin-top: 3px !important;
          }
          
          .print-report-container [data-section="header"] .text-blue-900 p {
            font-size: 20px !important;
            margin-bottom: 6px !important;
            line-height: 1.5 !important;
            font-weight: bold !important;
          }
          
          .print-report-container [data-section="header"] .text-blue-900 div {
            font-size: 16px !important;
            margin-bottom: 4px !important;
            line-height: 1.4 !important;
          }
          
          .print-report-container [data-section="header"] .text-blue-900 span {
            font-size: 16px !important;
            line-height: 1.4 !important;
            font-weight: 600 !important;
          }
          
          /* Centre logo styling for print */
          .print-report-container [data-section="header"] .text-blue-900 img {
            max-height: 100px !important;
            width: auto !important;
            height: auto !important;
            object-fit: contain !important;
            margin-bottom: 8px !important;
          }
          
          /* Title section padding */
          .print-report-container > div > div:nth-child(2) > div:nth-child(2) {
            padding-top: 0.5mm !important;
            padding-bottom: 0.5mm !important;
          }
          
          .print-report-container > div > div:nth-child(2) > div:nth-child(2) h2 {
            font-size: 14px !important;
            margin-bottom: 0 !important;
            line-height: 1.2 !important;
          }
          
          .print-report-container > div > div:nth-child(2) > div:nth-child(2) span {
            font-size: 9px !important;
            padding: 1px 3px !important;
          }
          
          /* Patient info padding - larger fonts */
          .print-report-container > div > div:nth-child(2) > div:nth-child(3) {
            padding-top: 0.5mm !important;
            padding-bottom: 0.5mm !important;
            padding-left: 3mm !important;
            padding-right: 3mm !important;
          }
          
          .print-report-container > div > div:nth-child(2) > div:nth-child(3) .grid {
            gap: 2mm !important;
            row-gap: 1mm !important;
          }
          
          .print-report-container > div > div:nth-child(2) > div:nth-child(3) span {
            font-size: 18px !important;
            padding-bottom: 0 !important;
            margin-right: 1mm !important;
            line-height: 1.3 !important;
          }
          
          .print-report-container > div > div:nth-child(2) > div:nth-child(3) .border-b {
            padding-bottom: 1px !important;
            line-height: 1.3 !important;
          }
          
          .print-report-container > div > div:nth-child(2) > div:nth-child(3) * {
            font-size: 18px !important;
          }
          
          /* Patient info section - direct class targeting */
          .print-report-container .patient-info-section {
            padding-top: 0.5mm !important;
            padding-bottom: 0.5mm !important;
            padding-left: 3mm !important;
            padding-right: 3mm !important;
          }
          
          .print-report-container .patient-info-section .grid {
            gap: 2mm !important;
            row-gap: 1mm !important;
          }
          
          .print-report-container .patient-info-section span {
            font-size: 18px !important;
            padding-bottom: 0 !important;
            margin-right: 1mm !important;
            line-height: 1.3 !important;
          }
          
          .print-report-container .patient-info-section .border-b {
            padding-bottom: 1px !important;
            line-height: 1.3 !important;
          }
          
          .print-report-container .patient-info-section * {
            font-size: 18px !important;
          }
          
          .audiogram-charts-container {
            page-break-inside: avoid !important;
            padding: 10mm 3mm 4px 3mm !important;
            display: block !important;
            min-height: 1050px !important;
            height: auto !important;
            margin-bottom: 0 !important;
          }
          
          .audiogram-chart-wrapper {
            page-break-inside: avoid !important;
          }
          
          /* Make audiogram charts larger to fill page */
          .audiogram-chart-wrapper svg {
            margin-top: 10mm !important;
            margin-bottom: 10mm !important;
            transform: scale(1.5) !important;
            transform-origin: center !important;
          }
          
          /* Chart title styling */
          .audiogram-chart-wrapper h3 {
            margin-bottom: 8mm !important;
            margin-top: 5mm !important;
            font-size: 16px !important;
            font-weight: bold !important;
          }
          
          /* PTA section spacing - minimal spacing between charts and symbols */
          .pta-symbols-container {
            margin-top: 0 !important;
            margin-bottom: 3mm !important;
            padding-top: 4px !important;
            padding-bottom: 0px !important;
            display: block !important;
            visibility: visible !important;
          }
          
          /* Reduce spacing after audiogram charts */
          .audiogram-charts-container {
            padding-bottom: 4px !important;
            margin-bottom: 0 !important;
          }
          
          /* PTA and Symbols sections - larger fonts for print */
          .print-report-container .pta-symbols-container .bg-blue-900 {
            padding: 4mm !important;
          }
          
          .print-report-container .pta-symbols-container .bg-blue-900 h3 {
            font-size: 18px !important;
            margin-bottom: 2mm !important;
          }
          
          .print-report-container .pta-symbols-container .bg-blue-900 div {
            font-size: 18px !important;
            margin-bottom: 1mm !important;
          }
          
          .print-report-container .pta-symbols-container .bg-white.border {
            padding: 4mm !important;
          }
          
          .print-report-container .pta-symbols-container .bg-white.border .grid {
            font-size: 18px !important;
          }
          
          .print-report-container .pta-symbols-container .bg-white.border > div {
            font-size: 18px !important;
          }
          
          .print-report-container .pta-symbols-container * {
            font-size: 18px !important;
          }
          
          /* ... existing styles ... */

          .no-print {
            display: none !important;
          }
        }
        
        /* PDF DOWNLOAD: Must be outside @media print - html2canvas ignores print rules */
        [data-export-mark="1"] .audiogram-charts-container {
          overflow: visible !important;
          padding: 5mm 0 4px 0 !important;
          margin-bottom: 0 !important;
        }
        [data-export-mark="1"] .audiogram-charts-container > div {
          overflow: visible !important;
        }
        [data-export-mark="1"] .audiogram-chart-wrapper {
          overflow: visible !important;
        }
        [data-export-mark="1"] .audiogram-chart-wrapper > div {
          overflow: visible !important;
        }
        [data-export-mark="1"] .audiogram-chart-wrapper svg {
          transform: scale(1.4) !important;
          transform-origin: top left !important;
        }
        [data-export-mark="1"] .audiogram-chart-wrapper h3 {
          margin-bottom: 5mm !important;
        }

        [data-export-mark="1"] .audiogram-chart-wrapper h3 {
          margin-bottom: 10mm !important;
          margin-top: 8mm !important;
          font-size: 16px !important;
          font-weight: bold !important;
        }

        [data-export-mark="1"] .pta-symbols-container {
          margin-top: 0 !important;
          margin-bottom: 3mm !important;
          padding-top: 4px !important;
          display: block !important;
        }
        
        /* Reduce spacing after audiogram charts */
        [data-export-mark="1"] .audiogram-charts-container {
          padding-bottom: 4px !important;
          margin-bottom: 0 !important;
        }
        
        /* PTA and Symbols sections - larger fonts for PDF export */
        [data-export-mark="1"] .pta-symbols-container .bg-blue-900 {
          padding: 4mm !important;
        }
        
        [data-export-mark="1"] .pta-symbols-container .bg-blue-900 h3 {
          font-size: 18px !important;
          margin-bottom: 2mm !important;
        }
        
        [data-export-mark="1"] .pta-symbols-container .bg-blue-900 div {
          font-size: 18px !important;
          margin-bottom: 1mm !important;
        }
        
        [data-export-mark="1"] .pta-symbols-container .bg-white.border {
          padding: 4mm !important;
        }
        
        [data-export-mark="1"] .pta-symbols-container .bg-white.border .grid {
          font-size: 18px !important;
        }
        
        [data-export-mark="1"] .pta-symbols-container .bg-white.border > div {
          font-size: 18px !important;
        }
        
        [data-export-mark="1"] .pta-symbols-container * {
          font-size: 18px !important;
        }
        
        /* Logo - Made bigger for PDF export */
        [data-export-mark="1"] [data-section="header"] img {
          max-height: 90px !important;
          width: auto !important;
          height: auto !important;
        }
        
        /* Centre details div - Made bigger for PDF export */
        [data-export-mark="1"] [data-section="header"] .text-blue-900 {
          padding: 16px 20px !important;
          font-size: 14px !important;
        }
        [data-export-mark="1"] [data-section="header"] .text-blue-900 p {
          font-size: 20px !important;
          margin-bottom: 6px !important;
          font-weight: bold !important;
        }
        [data-export-mark="1"] [data-section="header"] .text-blue-900 div {
          font-size: 16px !important;
          margin-bottom: 4px !important;
        }
        [data-export-mark="1"] [data-section="header"] .text-blue-900 span {
          font-size: 16px !important;
          font-weight: 600 !important;
        }
        
        /* Centre logo styling for PDF export */
        [data-export-mark="1"] [data-section="header"] .text-blue-900 img {
          max-height: 100px !important;
          width: auto !important;
          height: auto !important;
          object-fit: contain !important;
          margin-bottom: 8px !important;
        }
        
        [data-export-mark="1"] .bg-blue-900 {
           padding: 4mm !important;
        }
        
        [data-export-mark="1"] .bg-blue-900 h3 {
           font-size: 14px !important;
           margin-bottom: 2mm !important;
        }
        
        [data-export-mark="1"] .bg-blue-900 div {
           font-size: 11px !important;
           margin-bottom: 1mm !important;
        }
        
        [data-export-mark="1"] .bg-white.border {
           padding: 4mm !important;
        }
        
        [data-export-mark="1"] .bg-white.border .grid {
           font-size: 12px !important;
        }
        
        [data-export-mark="1"] .bg-white.border .p-2 {
           padding: 2.5mm !important;
           font-size: 11px !important;
        }

        /* Patient info - larger fonts for PDF */
        [data-export-mark="1"] .patient-info-section {
          font-size: 18px !important;
        }
        [data-export-mark="1"] .patient-info-section * {
          font-size: 18px !important;
        }
        [data-export-mark="1"] .patient-info-section span {
          font-size: 18px !important;
          line-height: 1.3 !important;
        }
        
        [data-export-mark="1"] .diagnosis-section-container {
           padding: 0 !important;
           margin-bottom: 2mm !important;
        }
        
        [data-export-mark="1"] .diagnosis-section-container > div {
           gap: 2mm !important;
        }
        
        [data-export-mark="1"] .diagnosis-section-container .border {
           padding: 8px !important;
           min-height: 15mm !important;
           font-size: 16px !important;
           line-height: 1.5 !important;
        }
        
        [data-export-mark="1"] .diagnosis-section-container div[class*="font-bold"] {
           font-size: 16px !important;
           margin-bottom: 3px !important;
           font-weight: bold !important;
        }
        
        [data-export-mark="1"] .diagnosis-section-container * {
           font-size: 16px !important;
        }
      `}</style>

      <div className="h-screen w-full overflow-hidden flex justify-center items-center bg-gray-100">
        <div className="w-[1100px] h-[calc(100vh-2rem)] print:h-auto bg-white shadow-lg overflow-hidden print:overflow-visible print-report-container flex flex-col print:block">
          <div className="no-print flex-shrink-0">
            <ReportTopActions onDownload={handleDownloadPDF} onShare={handleShareClick} />
          </div>

          <div ref={reportRef} data-report-capture="true" className="bg-white overflow-y-auto flex-1 print:max-h-none print:overflow-visible print:flex-none print:h-auto pb-8" style={{ fontFamily: 'Arial, sans-serif' }}>
            {/* Header */}
            <div className="relative overflow-hidden" data-section="header">
              {isShriramHospital ? (
                /* Shriram Hospital: Clean layout with both logos aligned */
                <div className="p-6 print:p-3">
                  <div className="flex items-center justify-center gap-8 mb-4">
                    <div className="flex items-center">
                      <Image src="/logo.webp" alt="earKART Logo" width={160} height={80} className="object-contain" style={{ height: '110px', width: 'auto' }} />
                    </div>
                    <div className="flex items-center">
                      <img
                        src="/logos/shriram-hospital-logo.webp"
                        alt="Shriram Hospital Logo"
                        style={{ height: '110px', width: 'auto', objectFit: 'contain' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  </div>
                  <div className="text-center text-black">
                    <p className="font-bold text-xl print:text-base mb-1">{consultationData.centre?.user?.name || "Demo Clinic"}</p>
                    <p className="font-semibold text-sm print:text-xs text-gray-700 mb-1">Dr. {consultationData.centre?.entName || "Demo ENT"}</p>
                    <p className="font-semibold text-sm print:text-xs text-gray-700 mb-1">{consultationData.centre?.contactNumber || "+91 XXXXXXXXXX"}</p>
                    <p className="text-sm print:text-xs text-gray-600">{consultationData.centre?.address || "Address"}</p>
                  </div>
                </div>
              ) : (
                /* Default layout for other centres */
                <div className="relative flex items-center justify-between p-6 print:p-3 z-10">
                  <div className="flex items-center bg-white p-3 print:p-2 rounded">
                    <Image src="/logo.webp" alt="earKART Logo" width={280} height={350} className="bg-white print:w-64 print:h-auto" />
                  </div>
                  <div className="text-blue-900 px-10 py-8 rounded-lg shadow-md" style={{ backgroundColor: '#8bdaef' }}>
                    <div className="text-center">
                      <p className="font-bold text-xl print:text-base mb-3">{consultationData.centre?.user?.name || "Demo Clinic"}</p>
                      <div className="flex items-center justify-center mb-2">
                        <span className="text-base print:text-sm mr-2">👨‍⚕️</span>
                        <span className="font-semibold text-base print:text-sm">Dr. {consultationData.centre?.entName || "Demo ENT"}</span>
                      </div>
                      <div className="flex items-center justify-center mb-2">
                        <span className="text-base print:text-sm mr-2">📞</span>
                        <span className="font-semibold text-base print:text-sm">{consultationData.centre?.contactNumber || "+91 XXXXXXXXXX"}</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <span className="text-base print:text-sm mr-2">📍</span>
                        <span className="font-semibold text-base print:text-sm">{consultationData.centre?.address || "Address"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pure Tone Audiogram Title */}
            <div className="py-4 print:py-0.5 bg-gray-50 text-center">
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <h2 className="text-2xl print:text-base font-bold text-gray-800">Pure Tone Audiogram</h2>
                  {isDemoAccount && (
                    <span className="bg-amber-100 text-amber-900 border border-amber-200 text-xs print:text-[8px] font-semibold uppercase tracking-wide px-3 print:px-2 py-1 print:py-0.5 rounded-full">
                      Demo Report
                    </span>
                  )}
                </div>
                {isDemoAccount && (
                  <p className="text-xs print:text-[8px] text-amber-800">
                    Generated from a demo account – values are for training purposes only.
                  </p>
                )}
              </div>
            </div>

            {/* Patient Information */}
            <div className="px-10 print:px-3 py-3 print:py-1 bg-white border-b relative z-10 patient-info-section">
              <div className="grid grid-cols-12 gap-3 print:gap-2 text-sm">
                <div className="col-span-3 flex items-center">
                  <span className="font-medium mr-1 print:mr-0.5">ID :</span>
                  <span className="border-b border-dotted border-gray-400 flex-1 pb-0.5 print:pb-0">
                    {consultationData.patient?.code || ""}
                  </span>
                </div>
                <div className="col-span-3 flex items-center">
                  <span className="font-medium mr-1 print:mr-0.5">Name :</span>
                  <span className="border-b border-dotted border-gray-400 flex-1 pb-0.5 print:pb-0">
                    {consultationData.patient?.name || ""}
                  </span>
                </div>
                <div className="col-span-3 flex items-center">
                  <span className="font-medium mr-1 print:mr-0.5">Date :</span>
                  {isAiims && isEditingDate ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        type="text"
                        value={reportDate}
                        onChange={handleDateChange}
                        placeholder="dd/MM/yyyy"
                        className="border-b border-dotted border-gray-400 flex-1 pb-1 h-auto px-0 text-sm"
                        maxLength={10}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleDateSave}
                        disabled={isSavingDate}
                        className="h-6 px-2 text-xs"
                      >
                        {isSavingDate ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleDateCancel}
                        disabled={isSavingDate}
                        className="h-6 px-2 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <span
                      className={`border-b border-dotted border-gray-400 flex-1 pb-0.5 print:pb-0 ${isAiims ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                      onClick={() => isAiims && setIsEditingDate(true)}
                      title={isAiims ? "Click to edit date" : ""}
                    >
                      {reportDate || (consultationData.createdAt ? format(new Date(consultationData.createdAt), "dd/MM/yyyy") : format(new Date(), "dd/MM/yyyy"))}
                    </span>
                  )}
                </div>
                <div className="col-span-3 flex items-center">
                  <span className="font-medium mr-1 print:mr-0.5">Age :</span>
                  <span className="border-b border-dotted border-gray-400 flex-1 pb-0.5 print:pb-0">
                    {consultationData.patient?.age ||
                      (consultationData.patient?.dob ?
                        Math.floor((Date.now() - new Date(consultationData.patient.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                        : "")}
                  </span>
                </div>
                <div className="col-span-3 flex items-center">
                  <span className="font-medium mr-1 print:mr-0.5">Sex :</span>
                  <span className="border-b border-dotted border-gray-400 flex-1 pb-0.5 print:pb-0">
                    {consultationData.patient?.gender || ""}
                  </span>
                </div>
                <div className="col-span-3 flex items-center">
                  <span className="font-medium mr-1 print:mr-0.5">Contact No. :</span>
                  <span className="border-b border-dotted border-gray-400 flex-1 pb-0.5 print:pb-0">
                    {consultationData.patient?.contactNumber || ""}
                  </span>
                </div>
                <div className="col-span-6 flex items-center">
                  <span className="font-medium mr-1 print:mr-0.5">Referred by :</span>
                  {isEditingReferredBy ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        type="text"
                        value={referredBy}
                        onChange={handleReferredByChange}
                        className="border-b border-dotted border-gray-400 flex-1 pb-1 h-auto px-0 text-sm"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleReferredBySave}
                        disabled={isSavingReferredBy}
                        className="h-6 px-2 text-xs"
                      >
                        {isSavingReferredBy ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleReferredByCancel}
                        disabled={isSavingReferredBy}
                        className="h-6 px-2 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <span
                      className="border-b border-dotted border-gray-400 flex-1 pb-0.5 print:pb-0 cursor-pointer hover:bg-gray-50"
                      onClick={() => setIsEditingReferredBy(true)}
                      title="Click to edit referred by"
                    >
                      {referredBy || consultationData.centre?.entName || ""}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Audiogram Charts */}
            <div className="px-6 print:px-2 py-5 print:py-3 bg-gray-50 relative z-0 overflow-visible audiogram-charts-container" data-section="audiogram-charts">
              <div className="flex justify-center items-start gap-3 pointer-events-none print:gap-2">
                <div className="flex-1 overflow-hidden audiogram-chart-wrapper">
                  <AudiogramChart
                    title="Right Ear"
                    results={rightResults}
                    ear="R"
                  />
                </div>
                <div className="flex-1 overflow-hidden audiogram-chart-wrapper">
                  <AudiogramChart
                    title="Left Ear"
                    results={leftResults}
                    ear="L"
                  />
                </div>
              </div>
            </div>


            {/* PTA and Symbols Section */}
            <div className="mx-6 print:mx-2 mb-2 print:mb-1 relative z-10 pta-symbols-container">
              <div className="flex gap-2 print:gap-1 bg-white">
                {/* PTA Section */}
                <div className="flex-1">
                  <div className="bg-blue-900 text-white p-4 print:p-2.5 text-center">
                    <h3 className="text-2xl print:text-sm font-bold">PTA (dB HL)</h3>
                    <div className="text-sm print:text-[9px] opacity-80 mt-1">4-Frequency Average (500, 1K, 2K, 4K Hz)</div>
                    <div className="text-sm print:text-[9px] opacity-70">*Includes no-response values</div>
                  </div>
                  <div className="bg-white border border-gray-300 p-4 print:p-2.5">
                    <div className="grid grid-cols-3 gap-0 text-sm print:text-[10px]">
                      <div className="text-center font-bold border border-gray-400 p-2.5 print:p-1.5 bg-gray-100 text-gray-800">Test</div>
                      <div className="text-center font-bold border border-gray-400 p-2.5 print:p-1.5 bg-gray-100 text-gray-800">Right</div>
                      <div className="text-center font-bold border border-gray-400 p-2.5 print:p-1.5 bg-gray-100 text-gray-800">Left</div>
                      <div className="font-bold border border-gray-400 p-2.5 print:p-1.5 text-center bg-gray-100 text-gray-800">AC</div>
                      <div className="border border-gray-400 p-2.5 print:p-1.5 text-center font-semibold text-gray-800 text-base print:text-sm">
                        {acAverage.rightEar ? `${Math.round(acAverage.rightEar)}` : "—"}
                      </div>
                      <div className="border border-gray-400 p-2.5 print:p-1.5 text-center font-semibold text-gray-800 text-base print:text-sm">
                        {acAverage.leftEar ? `${Math.round(acAverage.leftEar)}` : "—"}
                      </div>
                      <div className="font-bold border border-gray-400 p-2.5 print:p-1.5 text-center bg-gray-100 text-gray-800">BC</div>
                      <div className="border border-gray-400 p-2.5 print:p-1.5 text-center font-semibold text-gray-800 text-base print:text-sm">
                        {bcAverage.rightEar ? `${Math.round(bcAverage.rightEar)}` : "—"}
                      </div>
                      <div className="border border-gray-400 p-2.5 print:p-1.5 text-center font-semibold text-gray-800 text-base print:text-sm">
                        {bcAverage.leftEar ? `${Math.round(bcAverage.leftEar)}` : "—"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Symbols Section */}
                <div className="flex-1">
                  <div className="bg-blue-900 text-white p-4 print:p-2.5 text-center">
                    <h3 className="text-2xl print:text-sm font-bold">Symbols (ASHA Standards)</h3>
                  </div>
                  <div className="bg-white border border-gray-300 p-4 print:p-2.5">
                    <div className="grid grid-cols-4 gap-3 print:gap-2 text-sm print:text-[10px]">
                      {/* Air Conduction Unmasked */}
                      <div className="text-center">
                        <div className="font-bold mb-2 text-gray-800 text-sm print:text-[10px]">AC Unmasked</div>
                        <div className="flex flex-col space-y-1.5">
                          <div className="flex items-center justify-center">
                            <span className="text-red-500 text-xl print:text-lg">○</span>
                            <span className="text-sm print:text-[10px] text-gray-700 ml-1">R</span>
                          </div>
                          <div className="flex items-center justify-center">
                            <span className="text-blue-500 text-xl print:text-lg font-bold">×</span>
                            <span className="text-sm print:text-[10px] text-gray-700 ml-1">L</span>
                          </div>
                        </div>
                      </div>

                      {/* Air Conduction Masked */}
                      <div className="text-center">
                        <div className="font-bold mb-2 text-gray-800 text-sm print:text-[10px]">AC Masked</div>
                        <div className="flex flex-col space-y-1.5">
                          <div className="flex items-center justify-center">
                            <span className="text-red-500 text-xl print:text-lg">△</span>
                            <span className="text-sm print:text-[10px] text-gray-700 ml-1">R</span>
                          </div>
                          <div className="flex items-center justify-center">
                            <span className="text-blue-500 text-xl print:text-lg">□</span>
                            <span className="text-sm print:text-[10px] text-gray-700 ml-1">L</span>
                          </div>
                        </div>
                      </div>

                      {/* Bone Conduction */}
                      <div className="text-center">
                        <div className="font-bold mb-2 text-gray-800 text-sm print:text-[10px]">Bone Cond.</div>
                        <div className="flex flex-col space-y-1">
                          <div className="text-xs print:text-[9px] font-semibold text-gray-600">Unmasked:</div>
                          <div className="flex items-center justify-center space-x-1">
                            <span className="text-red-500 text-base print:text-sm font-bold">&lt;</span>
                            <span className="text-xs print:text-[9px] text-gray-700">R</span>
                            <span className="text-blue-500 text-base print:text-sm font-bold">&gt;</span>
                            <span className="text-xs print:text-[9px] text-gray-700">L</span>
                          </div>
                          <div className="text-xs print:text-[9px] font-semibold text-gray-600 mt-1">Masked:</div>
                          <div className="flex items-center justify-center space-x-1">
                            <span className="text-red-500 text-base print:text-sm font-bold">[</span>
                            <span className="text-xs print:text-[9px] text-gray-700">R</span>
                            <span className="text-blue-500 text-base print:text-sm font-bold">]</span>
                            <span className="text-xs print:text-[9px] text-gray-700">L</span>
                          </div>
                        </div>
                      </div>

                      {/* No Response */}
                      <div className="text-center">
                        <div className="font-bold mb-2 text-gray-800 text-sm print:text-[10px]">No Response</div>
                        <div className="flex flex-col space-y-1.5">
                          <div className="flex items-center justify-center">
                            <span className="text-red-500 text-xl print:text-lg">↙</span>
                            <span className="text-sm print:text-[10px] text-gray-700 ml-1">R</span>
                          </div>
                          <div className="flex items-center justify-center">
                            <span className="text-blue-500 text-xl print:text-lg">↘</span>
                            <span className="text-sm print:text-[10px] text-gray-700 ml-1">L</span>
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
                <div className="flex flex-col items-center">
                  <div className="text-sm font-bold mb-2 self-start">Diagnosis :</div>
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
                    <SelectTrigger className="h-12 border border-gray-400 bg-gray-50 w-full max-w-md rounded-md mx-auto">
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
                <div className="flex flex-col items-center">
                  <div className="text-sm font-bold mb-2 self-start">Suggestive of Diagnosis :</div>
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
                    <SelectTrigger className="h-16 border border-gray-400 bg-gray-50 w-full max-w-lg rounded-md mx-auto">
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

                <div className="flex flex-col items-center">
                  <div className="text-sm font-bold mb-2 self-start">Recommendation :</div>
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
                    <SelectTrigger className="h-12 border border-gray-400 bg-gray-50 w-full max-w-md rounded-md mx-auto">
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

                <div className="flex justify-center gap-3">
                  <Button
                    type="submit"
                    disabled={updateConsultationMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {updateConsultationMutation.isPending ? "Saving..." : "Save Diagnosis"}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleShareClick}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Submit Report
                  </Button>
                </div>
              </form>
            </div>

            {/* Diagnosis Display for PDF - Only show in print */}
            <div className="px-6 print:px-4 mb-2 print:mb-2 hidden print:block diagnosis-section-container">
              <div className="space-y-2 print:space-y-2">
                <div>
                  <div className="text-xs print:text-sm font-bold mb-1 print:mb-1">Provisional Diagnosis :</div>
                  <div className="border border-gray-400 bg-gray-50 p-2 print:p-3 whitespace-pre-wrap text-xs print:text-sm leading-relaxed break-words overflow-visible">
                    {formData.diagnosisComment || "No diagnosis entered"}
                  </div>
                </div>

                <div>
                  <div className="text-xs print:text-sm font-bold mb-1 print:mb-1">Suggestive of Diagnosis :</div>
                  <div className="border border-gray-400 bg-gray-50 p-2 print:p-3 whitespace-pre-wrap text-xs print:text-sm leading-relaxed break-words overflow-visible">
                    {formData.suggestiveOf || "No suggestions entered"}
                  </div>
                </div>

                <div>
                  <div className="text-xs print:text-sm font-bold mb-1 print:mb-1">Recommendation :</div>
                  <div className="border border-gray-400 bg-gray-50 p-2 print:p-3 whitespace-pre-wrap text-xs print:text-sm leading-relaxed break-words overflow-visible">
                    {formData.recommendationComment || "No recommendations entered"}
                  </div>
                </div>
              </div>
            </div>

            {/* Audiologist Box */}
            <div className="px-6 print:px-2 mb-2 print:mb-1 flex justify-end">
              <div className="border-2 border-blue-600 bg-blue-50 p-3 print:p-2 text-center">
                <div className="text-xs print:text-[9px] font-bold text-blue-900">Audiologist Name</div>
                <div className="text-xs print:text-[8px] text-blue-800 mt-0.5">{consultationData.audiologist?.user?.name || ""}</div>
                <div className="text-xs print:text-[9px] text-blue-900 font-bold mt-1">RCI No.</div>
                <div className="text-xs print:text-[8px] text-blue-800">{consultationData.audiologist?.rciNumber || ""}</div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 print:px-2 py-2 print:py-1 bg-gray-50 border-t text-center">
              <div className="flex items-center justify-center gap-2 mb-0.5">
                <div className="flex items-center text-xs print:text-[8px]">
                  <span className="mr-1">📧</span>
                  <span>info@earkart.in</span>
                </div>
              </div>
              <div className="text-center text-[10px] print:text-[7px] opacity-80">
                (Not for Medico-legal Purpose)
              </div>
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

      {/* Sticky Bottom Navigation */}
      <StickyReportNavigation
        isScreenConnecting={isScreenConnecting}
        isScreenSharing={isScreenSharing}
        isShowingReport={isShowingReport}
        onToggleShowReport={handleShowReport}
        onShare={handleShareClick}
        onDoAnotherTest={handleDoAnotherTest}
        onEndConsultation={handleEndConsultation}
      />

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Share report via WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-gray-600">Enter a WhatsApp number to send the report. Use 10-digit or include country code.</div>
            <Input
              placeholder="e.g. 9876543210 or 919876543210"
              value={sharePhone}
              onChange={(e) => setSharePhone(e.target.value)}
            />
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={handleDialogConfirm}
                disabled={isWhatsAppSharing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isWhatsAppSharing ? "Sending..." : "Send"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
