"use client";

import { useSocket } from "@/providers/socket-provider";
import { useParams, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { toast } from "sonner";
import { ImpedanceData } from "@/models/device/impedance-data.model";
import { ImpedanceStatus } from "@/models/device/impredance-status.model";
import { ROUTES } from "@/lib/routes";
import { useUpdateConsultation } from "@/hooks/consultation/use-update-consultation";
import { useGetConsultation } from "@/hooks/consultation/use-get-consultation";
import { ConsultationModelData } from "@/models/consultation.model";

type SessionState = "idle" | "initializing" | "running" | "waiting" | "completed";
type CurveStatus = "pending" | "running" | "waiting" | "completed";

type CurvePoint = {
  pressure: number;
  curve1?: number;
  curve2?: number;
  curve3?: number;
  timestamp: number;
};

type EtfCurve = {
  id: number;
  label: string;
  status: CurveStatus;
  samples: CurvePoint[];
  peakPressure?: number | null;
  peakCompliance?: number | null;
  ecv?: number | null;
  gradient?: number | null;
  // Store raw data arrays from backend for accurate saving
  rawPressureData?: number[];
  rawComplianceData?: number[];
};

const CURVE_LABELS = ["Baseline", "Swallow", "Valsalva"];
const CURVE_COLORS = ["#3B82F6", "#EF4444", "#10B981"];
const RANGE_PRESETS = [
  { label: "200/-400", start: 200, stop: -400 },
  { label: "100/-400", start: 100, stop: -400 },
  { label: "100/-300", start: 100, stop: -300 },
  { label: "100/-200", start: 100, stop: -200 },
];

const createInitialCurves = (): EtfCurve[] =>
  CURVE_LABELS.map((label, idx) => ({
    id: idx + 1,
    label,
    status: "pending",
    samples: [],
    peakPressure: null,
    peakCompliance: null,
    ecv: null,
    gradient: null,
  }));

const DEFAULT_SETTINGS = {
  startPressure: 100,
  stopPressure: -200,
  autoSpeed: true,
  speed: 200,
  probeToneFrequency: 226,
};

export default function EtfIntactPage() {
  const params = useParams();
  const router = useRouter();
  const consultationId = params.consultationId as string;
  const socket = useSocket();

  // Ear selection
  const [selectedEar, setSelectedEar] = useState<"L" | "R">("L");
  const [completedEars, setCompletedEars] = useState<Set<"L" | "R">>(new Set());

  // Curve state
  const [curves, setCurves] = useState<EtfCurve[]>(createInitialCurves);
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [activeCurve, setActiveCurve] = useState(1);
  const [nextCurve, setNextCurve] = useState<number | null>(null); // Track which curve to activate after resume
  const [currentPressure, setCurrentPressure] = useState(0);
  const [currentCompliance, setCurrentCompliance] = useState(0);
  const [autoSpeed, setAutoSpeed] = useState(DEFAULT_SETTINGS.autoSpeed);
  const [sweepSpeed, setSweepSpeed] = useState(DEFAULT_SETTINGS.speed);
  const [startPressure, setStartPressure] = useState(DEFAULT_SETTINGS.startPressure);
  const [stopPressure, setStopPressure] = useState(DEFAULT_SETTINGS.stopPressure);
  const [probeToneFrequency, setProbeToneFrequency] = useState(DEFAULT_SETTINGS.probeToneFrequency);
  const [isRunning, setIsRunning] = useState(false);
  const [chartPressureMax, setChartPressureMax] = useState(200);
  const [chartPressureMin, setChartPressureMin] = useState(-400);
  const [chartComplianceMin, setChartComplianceMin] = useState(0);
  const [chartComplianceMax, setChartComplianceMax] = useState(3);
  const [earCanalVolume, setEarCanalVolume] = useState<number | null>(null);
  const [completedCurves, setCompletedCurves] = useState<Set<number>>(new Set());
  const [overlayData, setOverlayData] = useState<CurvePoint[]>([]);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Consultation hooks
  const { data: consultation } = useGetConsultation(consultationId);
  const updateConsultationMutation = useUpdateConsultation();

  const activeCurveRef = useRef(activeCurve);
  const sessionStateRef = useRef<SessionState>(sessionState);
  const hasAutoSavedRef = useRef(false);

  useEffect(() => {
    activeCurveRef.current = activeCurve;
  }, [activeCurve]);

  useEffect(() => {
    sessionStateRef.current = sessionState;
  }, [sessionState]);

  // Reset auto-save flag when test starts or resets
  useEffect(() => {
    if (sessionState === "idle" || sessionState === "running") {
      hasAutoSavedRef.current = false;
    }
  }, [sessionState]);

  // Build overlay data from curve samples (like tympanometry: data = isTestCompleted ? finalData : realTimeData)
  // For ETF: merge all curve samples into overlay points grouped by pressure
  // IMPORTANT: Sort samples by pressure before processing to ensure smooth real-time drawing
  const displayOverlayData = useMemo(() => {
    // CRITICAL: Only show curves that should be visible
    // 1. Completed curves (status === "completed")
    // 2. The active curve if it's running or has samples
    const visibleCurves = curves.filter((curve) => {
      // Always show completed curves
      if (curve.status === "completed") {
        return true;
      }
      // Show active curve if it's running or has samples
      if (curve.id === activeCurve && (curve.status === "running" || curve.samples.length > 0)) {
        return true;
      }
      // Don't show pending curves
      return false;
    });

    console.log(`[OVERLAY] Processing ${visibleCurves.length} visible curves:`, visibleCurves.map(c => `Curve ${c.id} (${c.status})`));

    // For each visible curve, process and sort its samples independently
    const curveDataArrays = visibleCurves.map((curve) => {
      const curveKey = `curve${curve.id}`;
      
      // Filter and sort samples for this curve only
      const validSamples = curve.samples
        .filter((s: any) => {
          const pressure = s.pressure;
          const compliance = s[curveKey];
          return pressure !== undefined && !isNaN(pressure) && compliance !== undefined && compliance !== null && !isNaN(compliance);
        })
        .map((s: any) => ({
          pressure: s.pressure,
          [curveKey]: s[curveKey],
          curveId: curve.id, // Track which curve this point belongs to
        }));
      
      // Sort by pressure descending
      validSamples.sort((a, b) => b.pressure - a.pressure);
      
      // Remove duplicates by pressure (keep first/latest)
      const uniqueByPressure = new Map<number, any>();
      validSamples.forEach((sample) => {
        if (!uniqueByPressure.has(sample.pressure)) {
          uniqueByPressure.set(sample.pressure, sample);
        }
      });
      
      console.log(`[OVERLAY] Curve ${curve.id}: ${uniqueByPressure.size} unique pressure points (status: ${curve.status})`);
      
      return { curveId: curve.id, points: Array.from(uniqueByPressure.values()) };
    });
    
    // Collect all unique pressures from all visible curves
    const allPressures = new Set<number>();
    curveDataArrays.forEach((curveData) => {
      curveData.points.forEach((point: any) => {
        allPressures.add(point.pressure);
      });
    });
    
    // Sort pressures descending
    const sortedPressures = Array.from(allPressures).sort((a, b) => b - a);
    
    console.log(`[OVERLAY] Total unique pressures across ${visibleCurves.length} visible curves: ${sortedPressures.length}`);
    
    // Build overlay points by merging data from all visible curves
    const overlayPoints = sortedPressures.map((pressure) => {
      const point: any = { pressure };
      
      // For each visible curve, find the value at this pressure
      curveDataArrays.forEach((curveData) => {
        const curveKey = `curve${curveData.curveId}`;
        const matchingPoint = curveData.points.find((p: any) => p.pressure === pressure);
        if (matchingPoint && matchingPoint[curveKey] !== undefined) {
          point[curveKey] = matchingPoint[curveKey];
        }
      });
      
      return point;
    });
    
    return overlayPoints;
  }, [curves, activeCurve]);

  const appendPoint = useCallback((curveId: number, point: { pressure: number; compliance: number }) => {
    // CRITICAL: Only append to the active curve to prevent premature plotting
    const currentActiveCurve = activeCurveRef.current;
    if (curveId !== currentActiveCurve) {
      console.log(`[APPEND] Ignoring point for Curve ${curveId} (active is Curve ${currentActiveCurve})`);
      return;
    }
    
    console.log(`[APPEND] Curve ${curveId}: pressure=${point.pressure}, compliance=${point.compliance}`);
    
    // Append point in real-time (exactly like tympanometry: setRealTimeData((prev) => [...prev, newPoint]))
    setCurves((prev) =>
      prev.map((curve) => {
        if (curve.id !== curveId) return curve;
        
        // Don't append if curve is already completed (final data will replace it)
        if (curve.status === "completed") {
          console.log(`[APPEND] Curve ${curveId} already completed, skipping`);
          return curve;
        }
        
        // Create point with curve-specific key
        const curveKey = `curve${curveId}`;
        const newPoint: any = {
          pressure: point.pressure,
          [curveKey]: point.compliance,
          timestamp: Date.now(),
        };
        
        // Set curve status to "running" when first point is appended
        const isFirstPoint = curve.samples.length === 0;
        const newStatus = isFirstPoint ? "running" : curve.status;
        
        if (isFirstPoint) {
          console.log(`[APPEND] Curve ${curveId} first point received, setting status to "running"`);
        }
        
        // Append to samples array (like tympanometry appends to realTimeData)
        return {
              ...curve,
          samples: [...curve.samples, newPoint],
          status: newStatus as CurveStatus,
        };
      })
    );
  }, []);

  const updateCurveData = useCallback((data: ImpedanceData) => {
    console.log(`[ETF] Final data received:`, JSON.stringify(data, null, 2));
    
    // Parse from EtfIntact block
    const etfBlock = data.EtfIntact;
    if (!etfBlock?.Curves || etfBlock.Curves.length === 0) {
      console.warn("[ETF] No curves found in EtfIntact block");
      return;
    }

    const ecv = etfBlock.ECV ?? 0;
    console.log(`[ETF] Processing ${etfBlock.Curves.length} curves, ECV: ${ecv}`);

    if (Number.isFinite(ecv)) {
      setEarCanalVolume(ecv);
    }

    // CRITICAL: Track which curves have been completed
    // Start by collecting all curves that are already completed
    const completedCurveIds = new Set<number>();

    setCurves((prev) => {
      // First, identify which curves are already completed
      prev.forEach((curve) => {
        if (curve.status === "completed") {
          completedCurveIds.add(curve.id);
        }
      });
      
      console.log(`[ETF] Already completed curves before update:`, Array.from(completedCurveIds));
      console.log(`[ETF] Backend sent ${etfBlock.Curves?.length} curves in array`);
      
      const updatedCurves = prev.map((curve) => {
        // CRITICAL: Map frontend curve.id (1, 2, 3) to backend array index (0, 1, 2)
        // Backend sends curves in array: [0] = Curve 1, [1] = Curve 2, [2] = Curve 3
        const backendArrayIndex = curve.id - 1;
        const curveData = etfBlock.Curves?.[backendArrayIndex];
        
        if (!curveData) {
          console.log(`[ETF] No data for Curve ${curve.id} at backend array index ${backendArrayIndex}`);
          return curve; // Keep existing curve data if not in the array
        }
        
        // CRITICAL: Only update if this curve is NOT already completed
        // This prevents overwriting finalized data with duplicate data from backend
        if (curve.status === "completed") {
          console.log(`[ETF] Curve ${curve.id} already completed, skipping update but keeping in completedCurveIds`);
          return curve; // Keep the existing completed curve data
        }
        
        // Only update curves that are within the backend array length
        // Backend sends curves sequentially: [0] when curve 1 completes, [0,1] when curve 2 completes, etc.
        const backendArrayLength = etfBlock.Curves?.length ?? 0;
        if (backendArrayIndex >= backendArrayLength) {
          console.log(`[ETF] Curve ${curve.id} (index ${backendArrayIndex}) is beyond backend array length ${backendArrayLength}, skipping`);
          return curve;
        }

        // Use EXACT arrays from backend - no modifications
        const pressureSeries = curveData.PressureData ?? [];
        const complianceSeries = curveData.ComplianceData ?? [];

        console.log(`[ETF] ✅ Updating Curve ${curve.id} from backend array index ${backendArrayIndex}:`);
        console.log(`  - PressureData: [${pressureSeries.slice(0, 5).join(', ')}${pressureSeries.length > 5 ? '...' : ''}] (${pressureSeries.length} points)`);
        console.log(`  - ComplianceData: [${complianceSeries.slice(0, 5).join(', ')}${complianceSeries.length > 5 ? '...' : ''}] (${complianceSeries.length} points)`);
        console.log(`  - Peak: ${JSON.stringify(curveData.Peak)}`);
        console.log(`  - Gradient: ${curveData.Gradient}`);
        console.log(`  - Raw first few: pressure=${pressureSeries[0]}, compliance=${complianceSeries[0]}, ecv=${ecv}`);

        // Build samples using EXACT data from backend arrays
        // Each point: pressure from PressureData[i], compliance from ComplianceData[i]
        const samples: CurvePoint[] = pressureSeries.map((pressure, idx) => {
          const compliance = complianceSeries[idx] ?? 0;
          // Use compensated compliance (compliance - ECV) for display
          const compensatedCompliance = Math.max(0, compliance - ecv);
          const curveKey = `curve${curve.id}`;
          
          return {
            pressure, // EXACT pressure from PressureData
            [curveKey]: compensatedCompliance, // Compensated compliance for display
            timestamp: Date.now() + idx,
          } as any;
        });

        console.log(`[ETF] Curve ${curve.id} samples created: ${samples.length} points`);
        if (samples.length > 0) {
          const firstPoint = samples[0] as any;
          const lastPoint = samples[samples.length - 1] as any;
          const midPoint = samples[Math.floor(samples.length / 2)] as any;
          console.log(`  - First point: pressure=${firstPoint.pressure}, curve${curve.id}=${firstPoint[`curve${curve.id}`]}, raw compliance=${complianceSeries[0]}, ecv=${ecv}`);
          console.log(`  - Mid point: pressure=${midPoint.pressure}, curve${curve.id}=${midPoint[`curve${curve.id}`]}, raw compliance=${complianceSeries[Math.floor(complianceSeries.length / 2)]}`);
          console.log(`  - Last point: pressure=${lastPoint.pressure}, curve${curve.id}=${lastPoint[`curve${curve.id}`]}, raw compliance=${complianceSeries[complianceSeries.length - 1]}`);
          
          // Find max compensated compliance value
          const maxCompensated = Math.max(...samples.map((s: any) => s[`curve${curve.id}`] ?? 0));
          const maxIndex = samples.findIndex((s: any) => (s[`curve${curve.id}`] ?? 0) === maxCompensated);
          console.log(`  - Max compensated compliance: ${maxCompensated} at pressure ${(samples[maxIndex] as any).pressure}`);
        }

        // Mark this curve as NEWLY completed
        console.log(`[ETF] ✅ Curve ${curve.id} is NOW completed (newly finished)`);
        completedCurveIds.add(curve.id);

      return {
          ...curve,
          samples, // This completely replaces any real-time samples with EXACT backend data
          // Store raw data arrays for accurate saving
          rawPressureData: pressureSeries,
          rawComplianceData: complianceSeries,
          status: "completed" as CurveStatus,
          peakPressure: curveData.Peak?.Pressure ?? curve.peakPressure,
          peakCompliance: curveData.Peak?.CompensatedWithECV ?? curve.peakCompliance,
          ecv: ecv ?? curve.ecv,
          gradient: curveData.Gradient ?? (curveData as any).gradient ?? curve.gradient,
      };
    });

      // Log after processing all curves
      console.log(`[ETF] Total completed curves after update: ${completedCurveIds.size}. IDs:`, Array.from(completedCurveIds).sort());
      
      return updatedCurves;
    });

    // CRITICAL: Update completedCurves state with ALL completed curve IDs
    setCompletedCurves(completedCurveIds);
    
    console.log(`[ETF] Updated ${completedCurveIds.size} curves with final data from backend.`);
    console.log(`[ETF] Completed curve IDs:`, Array.from(completedCurveIds));
  }, []);

  const handleStart = useCallback(() => {
    if (!socket) {
      toast.error("Device connection unavailable.");
      return;
    }

    // Don't allow starting if this ear is already completed
    if (completedEars.has(selectedEar)) {
      toast.warning(`${selectedEar === "L" ? "Left" : "Right"} ear is already completed. Please select the other ear.`);
      return;
    }

    setIsRunning(true);
    setSessionState("running");
    setCurves(createInitialCurves());
    setActiveCurve(1);
    setNextCurve(null);
    setCurrentPressure(0);
    setCurrentCompliance(0);
    setCompletedCurves(new Set());
    setOverlayData([]);
    setEarCanalVolume(null);

    const payload = {
      consultationId,
      ProbeToneFrequency: probeToneFrequency,
      AutoSpeed: autoSpeed,
      Speed: sweepSpeed,
      Start: startPressure,
      Stop: stopPressure,
    };

    console.log("[ETF] Emitting start-etf with payload:", payload);
    socket.emit("start-etf", payload);

    toast.success(`ETF Intact test started for ${selectedEar === "L" ? "Left" : "Right"} ear`);
  }, [socket, consultationId, startPressure, stopPressure, autoSpeed, sweepSpeed, probeToneFrequency, selectedEar, completedEars]);

  const handleResume = useCallback(() => {
    if (!socket) {
      toast.error("Device connection unavailable.");
      return;
    }

    console.log("[ETF] Emitting resume with consultationId:", consultationId);
    socket.emit("resume", { consultationId });
    
    setSessionState("running");
    setIsRunning(true);
    toast.info("Resuming ETF test for next curve");
  }, [socket, consultationId]);

  const handleStop = useCallback(() => {
    if (!socket) {
      toast.error("Device connection unavailable.");
      return;
    }

    console.log("[ETF] Emitting stop-etf with consultationId:", consultationId);
    socket.emit("stop-etf", { consultationId });
    
    setIsRunning(false);
    setSessionState("idle");
    toast.info("ETF Intact test stopped");
  }, [socket, consultationId]);

  const resetTest = useCallback(() => {
    // Stop the test if running
    if (isRunning && socket) {
      socket.emit("stop-etf", { consultationId });
    }
    
    // Reset all state to initial values
    setCurves(createInitialCurves());
    setActiveCurve(1);
    setNextCurve(null);
    setCurrentPressure(0);
    setCurrentCompliance(0);
    setSessionState("idle");
    setIsRunning(false);
    setCompletedCurves(new Set());
    setEarCanalVolume(null);
    setOverlayData([]);
    setIsAutoSaving(false);
    hasAutoSavedRef.current = false; // Reset auto-save flag
    
    // Reset chart ranges to defaults
    setChartPressureMax(200);
    setChartPressureMin(-400);
    setChartComplianceMin(0);
    setChartComplianceMax(3);
    
    // Reset settings to defaults
    setStartPressure(DEFAULT_SETTINGS.startPressure);
    setStopPressure(DEFAULT_SETTINGS.stopPressure);
    setAutoSpeed(DEFAULT_SETTINGS.autoSpeed);
    setSweepSpeed(DEFAULT_SETTINGS.speed);
    setProbeToneFrequency(DEFAULT_SETTINGS.probeToneFrequency);
    
    toast.info("Test reset to initial state");
  }, [isRunning, socket, consultationId]);

  // Save ETF results to consultation
  const saveETFResults = useCallback(async () => {
    if (!consultation || !(consultation as any)?.data || completedCurves.size !== 3) {
      toast.error("Please complete all three curves before saving.");
      return;
    }

    const consultationData = (consultation as any).data as ConsultationModelData;

    // Transform curve data to match backend API structure
    // IMPORTANT: Use the EXACT raw data arrays stored from backend (rawPressureData, rawComplianceData)
    // This ensures we save the exact values received from the backend, not reconstructed values
    // IMPORTANT: Only save completed curves, and save them in order (Curve 1, 2, 3)
    const completedCurvesArray = curves.filter(c => c.status === "completed").sort((a, b) => a.id - b.id);
    console.log(`[ETF Save] Saving ${completedCurvesArray.length} completed curves in order:`, completedCurvesArray.map(c => `Curve ${c.id}`));
    
    if (completedCurvesArray.length !== 3) {
      console.error(`[ETF Save] Expected 3 completed curves, but found ${completedCurvesArray.length}`);
      toast.error(`Expected 3 completed curves, but found ${completedCurvesArray.length}. Please complete all curves.`);
      return;
    }
    
    const etfCurves = completedCurvesArray.map((curve) => {
      // CRITICAL: Prefer raw data arrays if available (from updateCurveData), otherwise reconstruct from samples
      const pressureData = curve.rawPressureData ?? [];
      const complianceData = curve.rawComplianceData ?? [];
      
      const hasRawData = !!(curve.rawPressureData && curve.rawPressureData.length > 0 && curve.rawComplianceData && curve.rawComplianceData.length > 0);
      
      console.log(`[ETF Save] Curve ${curve.id} - Data source check:`, {
        hasRawData,
        rawPressureLength: curve.rawPressureData?.length ?? 0,
        rawComplianceLength: curve.rawComplianceData?.length ?? 0,
        rawFirstCompliances: curve.rawComplianceData?.slice(0, 5),
        samplesLength: curve.samples?.length ?? 0,
        willUseReconstruction: !hasRawData,
      });
      
      // If raw arrays are not available, reconstruct from samples (fallback)
      if (pressureData.length === 0 || complianceData.length === 0) {
        const curveKey = `curve${curve.id}`;
        const reconstructedPressure: number[] = [];
        const reconstructedCompliance: number[] = [];
        
        curve.samples.forEach((sample: any) => {
          const pressure = sample.pressure;
          const compensatedCompliance = sample[curveKey]; // This is (rawCompliance - ECV)
          
          if (pressure !== undefined && !isNaN(pressure) && compensatedCompliance !== undefined && compensatedCompliance !== null && !isNaN(compensatedCompliance)) {
            reconstructedPressure.push(pressure);
            // Convert compensated compliance back to raw compliance by adding ECV
            const rawCompliance = compensatedCompliance + (earCanalVolume ?? 0);
            reconstructedCompliance.push(rawCompliance);
          }
        });
        
        // Use reconstructed data if raw arrays not available
        if (reconstructedPressure.length > 0) {
          console.warn(`[ETF Save] Curve ${curve.id}: Using reconstructed data (raw arrays not available)`);
          
          const compensatedPeak = curve.peakCompliance ?? 0;
          const rawPeak = compensatedPeak + (earCanalVolume ?? 0);
          
          return {
            ear: selectedEar === "L" ? "LEFT" : "RIGHT", // Add ear field
            peakCompliance: rawPeak, // RAW: compensated + ECV
            peakCompensatedWithECV: compensatedPeak, // COMPENSATED: what we display
            peakPressure: curve.peakPressure ?? 0,
            gradient: curve.gradient ?? 0,
            gradientPressure: 0,
            pressureData: reconstructedPressure,
            complianceData: reconstructedCompliance, // RAW: already added ECV back
          };
        }
      }

      // CRITICAL: Match the backend API structure exactly
      // - peakCompliance: RAW peak (what backend sent OR reconstructed with ECV added back)
      // - peakCompensatedWithECV: Compensated peak (what we display)
      // - complianceData: RAW compliance array
      
      const compensatedPeak = curve.peakCompliance ?? 0;
      const rawPeak = compensatedPeak + (earCanalVolume ?? 0);
      
      // Log what we're actually saving
      console.log(`[ETF Save] Curve ${curve.id} FINAL DATA:`, {
        dataSource: (pressureData.length > 0 && complianceData.length > 0) ? 'rawArrays' : 'reconstructed',
        pressureDataLength: pressureData.length,
        complianceDataLength: complianceData.length,
        peakPressure: curve.peakPressure,
        peakCompliance: curve.peakCompliance,
        ecv: earCanalVolume,
        rawPeak: rawPeak.toFixed(3),
        compensatedPeak: compensatedPeak.toFixed(3),
        firstFewPressures: pressureData.slice(0, 5),
        firstFewCompliances: complianceData.slice(0, 5),
        middleCompliances: complianceData.slice(Math.floor(complianceData.length / 2) - 2, Math.floor(complianceData.length / 2) + 2),
      });
      
      return {
        ear: selectedEar === "L" ? "LEFT" : "RIGHT", // Add ear field
        peakCompliance: rawPeak, // RAW: compensated + ECV
        peakCompensatedWithECV: compensatedPeak, // COMPENSATED: what we display
        peakPressure: curve.peakPressure ?? 0,
        gradient: curve.gradient ?? 0,
        gradientPressure: 0,
        pressureData,
        complianceData, // RAW values (from backend or reconstructed with ECV added)
      };
    });

    const ecvValue = earCanalVolume ?? 0;
    const probeToneValue = probeToneFrequency ?? 226;
    
    if (typeof ecvValue !== 'number' || isNaN(ecvValue) || typeof probeToneValue !== 'number' || isNaN(probeToneValue)) {
      console.error("[ETF Save] Invalid data:", { ecvValue, probeToneValue });
      toast.error("Invalid ETF data. ECV and Probe Tone Frequency are required.");
      return;
    }
    
    // Check if there's existing ETF data from the other ear
    const existingEtfIntact = consultationData.etfIntact;
    
    let allCurves: any[] = [];
    
    if (existingEtfIntact && Array.isArray(existingEtfIntact.curves)) {
      console.log("[ETF Save] Found existing ETF data with", existingEtfIntact.curves.length, "curves. Merging with new data.");
      
      // Filter out curves from the current ear (to avoid duplicates) and merge with new curves
      const currentEarStr = selectedEar === "L" ? "LEFT" : "RIGHT";
      const otherEarCurves = existingEtfIntact.curves.filter((c: any) => 
        c.ear !== currentEarStr && c.ear !== selectedEar
      );
      
      // Merge: other ear curves + current ear curves (order doesn't matter now with ear field)
      allCurves = [...otherEarCurves, ...etfCurves];
      
      console.log("[ETF Save] Merged total curves:", allCurves.length, `(${otherEarCurves.length} from other ear, ${etfCurves.length} new)`);
    } else {
      // First ear being saved
      allCurves = etfCurves;
      console.log("[ETF Save] First ear being saved, curves:", allCurves.length);
    }
    
    const etfIntact = {
      ecv: ecvValue,
      probeToneFreq: probeToneValue,
      curves: allCurves,
    };

    console.log("[ETF Save] Final etfIntact:", {
      ecv: etfIntact.ecv,
      probeToneFreq: etfIntact.probeToneFreq,
      totalCurves: etfIntact.curves.length,
      curves: etfIntact.curves.map((c, idx) => ({
        curveNum: idx + 1,
        peakPressure: c.peakPressure,
        peakCompliance: c.peakCompliance,
        peakCompensated: c.peakCompensatedWithECV,
        pressurePoints: c.pressureData?.length ?? 0,
        compliancePoints: c.complianceData?.length ?? 0,
        firstCompliances: c.complianceData?.slice(0, 3),
      })),
    });

    const updatedConsultation: ConsultationModelData = {
      ...consultationData,
      etfIntact: etfIntact as any,
      updatedAt: new Date().toISOString(),
    };

    try {
      const result = await updateConsultationMutation.mutateAsync(updatedConsultation);
      console.log("ETF results saved successfully:", result);

      // Mark this ear as completed
      setCompletedEars((prev) => {
        const newSet = new Set(prev);
        newSet.add(selectedEar);
        
        // Check if both ears are completed
        if (newSet.size === 2) {
          toast.success("Both ears completed! You can now view the report.");
        } else {
          const remainingEar = selectedEar === "L" ? "Right" : "Left";
          toast.success(
            `${selectedEar === "L" ? "Left" : "Right"} ear completed and saved! Please test the ${remainingEar} ear.`
          );
          // Switch to the other ear automatically
          setTimeout(() => {
            setSelectedEar(selectedEar === "L" ? "R" : "L");
            // Reset test state for the next ear
    setCurves(createInitialCurves());
    setActiveCurve(1);
            setNextCurve(null);
    setCurrentPressure(0);
    setCurrentCompliance(0);
            setCompletedCurves(new Set());
            setEarCanalVolume(null);
    setSessionState("idle");
            setIsAutoSaving(false);
            hasAutoSavedRef.current = false; // Reset auto-save flag for next ear
          }, 1000);
        }
        
        return newSet;
      });
    } catch (error) {
      console.error("Failed to save ETF results:", error);
      toast.error("Failed to save ETF results. Please try again.");
      setIsAutoSaving(false);
      throw error; // Re-throw so .finally() can handle cleanup
    }
  }, [
    consultation,
    completedCurves.size,
    selectedEar,
    updateConsultationMutation,
    curves,
    earCanalVolume,
    consultationId,
  ]);

  useEffect(() => {
    if (!socket) return;

    // Listen for status updates (real-time data like tympanometry)
    const handleStatus = (data: { 
      consultationId?: string;
      tympanometryStatus?: ImpedanceStatus;
      etfStatus?: ImpedanceStatus;
      status?: ImpedanceStatus;
    }) => {
      // Try different possible event structures
      const status: ImpedanceStatus | undefined = 
        data.etfStatus || 
        data.tympanometryStatus || 
        data.status;

      if (!status) {
        console.warn("[ETF] No status found in data:", data);
      return;
    }

      // Use EtfIntact fields when available, fallback to top-level fields
      const etfIntact = status.EtfIntact;
      const curveFromStatus = etfIntact?.Curve;
      const statusName = status.StatusName;
      
      // CRITICAL: DO NOT change active curve from status updates
      // The active curve should only change when:
      // 1. Starting a new test (handleStart)
      // 2. After receiving final curve data (handleData)
      // 3. When explicitly resuming (handleResume)
      // 
      // If we change activeCurve here, the next curve will start plotting immediately
      // without waiting for the "resume" command!
      
      if (curveFromStatus && curveFromStatus !== activeCurveRef.current) {
        console.log(`[ETF] Backend reports Curve ${curveFromStatus}, but frontend is on Curve ${activeCurveRef.current} (NOT changing)`);
      }

      // Set state to "running" when execution starts (like tympanometry checks isRunning)
      if (statusName === "etfExecution" && sessionStateRef.current !== "running") {
        console.log(`[ETF] Execution started, setting state to "running"`);
        setSessionState("running");
        setIsRunning(true);
      }

      const pressure = etfIntact?.Pressure ?? status?.Pressure ?? 0;
      const compliance = etfIntact?.Compliance ?? status?.Compliance ?? 0;
      const ecv = etfIntact?.ECV ?? status?.Tymp?.ECV ?? earCanalVolume ?? 0;

      if (Number.isFinite(ecv) && ecv !== earCanalVolume) {
        console.log(`[ETF] ECV updated: ${earCanalVolume} -> ${ecv}`);
        setEarCanalVolume(ecv);
      }

      setCurrentPressure(pressure);
      setCurrentCompliance(compliance);

      // CRITICAL: Only append point if we're running AND the status curve matches our active curve
      // This prevents appending points to the wrong curve when backend starts sending data for the next curve
      if (sessionStateRef.current === "running") {
        const currentActiveCurve = activeCurveRef.current;
        
        // Only append if backend curve matches our active curve (or no curve specified)
        if (!curveFromStatus || curveFromStatus === currentActiveCurve) {
          appendPoint(currentActiveCurve, {
          pressure,
            compliance: Math.max(0, compliance - ecv),
          });
        } else {
          console.log(`[ETF] Ignoring status for Curve ${curveFromStatus} (active is Curve ${currentActiveCurve})`);
        }
      }
    };

    // Listen for final curve data (like tympanometry-data)
    const handleData = (data: {
      consultationId?: string;
      tympanometryData?: ImpedanceData;
      etfData?: ImpedanceData;
      data?: ImpedanceData;
      curveIndex?: number;
    }) => {
      console.log("[ETF] Data received:", data);
      
      // Try different possible event structures
      const impedanceData: ImpedanceData | undefined = 
        data.etfData || 
        data.tympanometryData || 
        data.data;

      if (!impedanceData) {
        console.warn("[ETF] No impedance data found in:", data);
        return;
      }

      // Process all curves in the data
      updateCurveData(impedanceData);

      // Determine next state based on number of completed curves
      const completedCurvesCount = impedanceData.EtfIntact?.Curves?.length ?? 0;
      console.log(`[ETF] Completed curves count: ${completedCurvesCount}`);

      // IMPORTANT: Use setTimeout to ensure updateCurveData state updates have completed
      // This prevents race conditions where activeCurve/sessionState change before curve data is stored
      setTimeout(() => {
        if (completedCurvesCount < 3) {
          // CRITICAL: Don't change activeCurve yet - store the next curve number and wait for resume
          // The activeCurve will only change when the user clicks "Continue" and backend confirms resume
          const nextCurveNumber = completedCurvesCount + 1;
          console.log(`[ETF] Curve ${completedCurvesCount} completed. Next will be Curve ${nextCurveNumber}, entering waiting state`);
          console.log(`[ETF] Active curve remains: ${completedCurvesCount} (NOT changing to ${nextCurveNumber} yet)`);
          setNextCurve(nextCurveNumber);
        setSessionState("waiting");
          setIsRunning(false);
        } else {
          // All curves completed for this ear - auto-save will be handled by useEffect
          console.log(`[ETF] All 3 curves completed, entering completed state`);
          setActiveCurve(3);
          setNextCurve(null);
        setSessionState("completed");
          setIsRunning(false);
          toast.success("All three curves completed! Results are being saved...");
        }
      }, 100); // Short delay to ensure previous state updates complete
    };

    // Listen for resume confirmation
    const handleResumed = (data: { consultationId?: string }) => {
      console.log("[ETF] Resume confirmed:", data);
      
      // CRITICAL: Now that backend has confirmed resume, activate the next curve
      // This ensures the next curve doesn't start plotting until AFTER the user clicks "Continue"
      if (nextCurve !== null) {
        console.log(`[ETF] Activating next curve: ${nextCurve}`);
        setActiveCurve(nextCurve);
        setNextCurve(null);
      }
      
      setSessionState("running");
      setIsRunning(true);
    };

    // Listen for stop confirmation
    const handleStopped = (data: { consultationId?: string }) => {
      console.log("[ETF] Stop confirmed:", data);
      setIsRunning(false);
      setSessionState("idle");
    };

    // Register all event listeners
    // Try multiple possible event names to see what backend sends
    socket.on("tympanometry-status", handleStatus);
    socket.on("etf-status", handleStatus);
    socket.on("tympanometry-data", handleData);
    socket.on("etf-data", handleData);
    socket.on("etf-resumed", handleResumed);
    socket.on("etf-stopped", handleStopped);

    return () => {
      socket.off("tympanometry-status", handleStatus);
      socket.off("etf-status", handleStatus);
      socket.off("tympanometry-data", handleData);
      socket.off("etf-data", handleData);
      socket.off("etf-resumed", handleResumed);
      socket.off("etf-stopped", handleStopped);
    };
  }, [socket, appendPoint, updateCurveData, selectedEar, nextCurve]);

  // Auto-save when 3 curves are completed (only once per completion)
  useEffect(() => {
    if (
      sessionState === "completed" && 
      completedCurves.size === 3 && 
      !completedEars.has(selectedEar) && 
      !isAutoSaving && 
      !hasAutoSavedRef.current &&
      consultation
    ) {
      hasAutoSavedRef.current = true;
      setIsAutoSaving(true);
      
      // Auto-save after a short delay to ensure all state is updated
      const timer = setTimeout(() => {
        saveETFResults().finally(() => {
          setIsAutoSaving(false);
        });
      }, 1000);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [sessionState, completedCurves.size, completedEars, selectedEar, consultation, isAutoSaving]);

  return (
    <>
      <div className="p-6 lg:pr-80">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">ETF Intact Test</h1>

          {/* Ear Selection */}
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => {
                // Only allow switching if test is idle/completed and ear is not already completed
                if (sessionState !== "idle" && sessionState !== "completed") {
                  toast.warning("Please complete or stop the current test before switching ears.");
                  return;
                }
                if (completedEars.has("L")) {
                  toast.warning("Left ear is already completed. Cannot retest.");
                  return;
                }
                setSelectedEar("L");
                setCurves(createInitialCurves());
                setActiveCurve(1);
                setCompletedCurves(new Set());
                setEarCanalVolume(null);
                setSessionState("idle");
              }}
              disabled={completedEars.has("L") || (sessionState !== "idle" && sessionState !== "completed")}
              className={`px-4 py-2 rounded text-sm font-medium ${
                selectedEar === "L"
                  ? "bg-blue-500 text-white"
                  : completedEars.has("L")
                  ? "bg-green-500 text-white cursor-not-allowed opacity-60"
                  : "bg-gray-200"
              } ${sessionState !== "idle" && sessionState !== "completed" && selectedEar !== "L" ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Left Ear {completedEars.has("L") && "✓"}
            </button>
            <button
              onClick={() => {
                // Only allow switching if test is idle/completed and ear is not already completed
                if (sessionState !== "idle" && sessionState !== "completed") {
                  toast.warning("Please complete or stop the current test before switching ears.");
                  return;
                }
                if (completedEars.has("R")) {
                  toast.warning("Right ear is already completed. Cannot retest.");
                  return;
                }
                setSelectedEar("R");
                setCurves(createInitialCurves());
                setActiveCurve(1);
                setCompletedCurves(new Set());
                setEarCanalVolume(null);
                setSessionState("idle");
              }}
              disabled={completedEars.has("R") || (sessionState !== "idle" && sessionState !== "completed")}
              className={`px-4 py-2 rounded text-sm font-medium ${
                selectedEar === "R"
                  ? "bg-red-500 text-white"
                  : completedEars.has("R")
                  ? "bg-green-500 text-white cursor-not-allowed opacity-60"
                  : "bg-gray-200"
              } ${sessionState !== "idle" && sessionState !== "completed" && selectedEar !== "R" ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Right Ear {completedEars.has("R") && "✓"}
            </button>
              </div>

          {/* Status Indicator */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                {curves.map((curve) => (
                  <div
                    key={curve.id}
                    className={`w-3 h-3 rounded-full ${
                      completedCurves.has(curve.id)
                        ? "bg-green-500"
                        : activeCurve === curve.id
                        ? "bg-blue-500"
                        : "bg-gray-300"
                    }`}
                  ></div>
                ))}
              </div>
              <div className="flex-1">
                {completedCurves.size === 0 && (
                  <p className="text-blue-800">Ready to start ETF Intact testing for {selectedEar === "L" ? "Left" : "Right"} ear. Begin the test when ready.</p>
                )}
                {completedCurves.size > 0 && completedCurves.size < 3 && (
                  <p className="text-blue-800">Recording curves: {completedCurves.size} of 3 completed.</p>
                )}
                {completedCurves.size === 3 && (
                  <p className="text-green-800 font-medium">All three curves completed for {selectedEar === "L" ? "Left" : "Right"} ear!</p>
                )}
              </div>
            </div>
            {sessionState === "waiting" && (
              <div className="mt-2">
                <button
                  onClick={handleResume}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded text-sm font-medium"
                >
                  Continue to Next Curve
                </button>
              </div>
            )}
          </div>

          {/* Single Graph with All Three Curves Overlaid */}
          <div className="border rounded p-4">
            <div className="h-[400px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={displayOverlayData}
                  margin={{ top: 20, right: 20, bottom: 20, left: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis
                    dataKey="pressure"
                    domain={[chartPressureMax, chartPressureMin]}
                    ticks={[chartPressureMax, 100, 0, -100, -200, -300, chartPressureMin].filter(
                      (value, index, arr) => arr.indexOf(value) === index
                    )}
                    tickFormatter={(value: number) => `${value}`}
                    label={{ value: "Pressure (daPa)", position: "bottom" }}
                    type="number"
                    scale="linear"
                  />
                  <YAxis
                    domain={[chartComplianceMin, chartComplianceMax]}
                    tickCount={5}
                    tickFormatter={(value: number) => value.toFixed(1)}
                    label={{ value: "Compliance (ml)", angle: -90, position: "left" }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(2)} ml`, ""]}
                    labelFormatter={(label: number) => `Pressure: ${label} daPa`}
                  />
                  <ReferenceArea
                    x1={chartPressureMax}
                    x2={chartPressureMin}
                    y1={chartComplianceMin}
                    y2={chartComplianceMax}
                    fill="#f3f4f6"
                    stroke="#e5e7eb"
                    strokeWidth={1}
                    fillOpacity={0.3}
                    isFront={false}
                  />
                  {[1, 2, 3].map((curveNum) => (
                    <Line
                      key={`curve${curveNum}`}
                      type="monotone"
                      dataKey={`curve${curveNum}`}
                      stroke={CURVE_COLORS[curveNum - 1]}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                      name={CURVE_LABELS[curveNum - 1]}
                      connectNulls={true}
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
                  </div>
          </div>
        </div>
      </div>

      {/* Floating Controls (Right-side) */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-10 w-64 hidden lg:block print:hidden">
        <div className="bg-white shadow-lg rounded-lg p-2 border">
          {/* Curve Indicators */}
          <div className="mb-2">
            <label className="block text-[10px] font-medium mb-1">Curves</label>
            <div className="space-y-1">
              {curves.map((curve, idx) => (
                <div key={curve.id} className="flex items-center gap-2 text-[10px]">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: CURVE_COLORS[idx] }}></div>
                  <span className="flex-1">{curve.label}</span>
                  {completedCurves.has(curve.id) && <span className="text-green-600">✓</span>}
                </div>
              ))}
            </div>
        </div>

          {/* Pressure Range */}
          <div className="mb-2">
            <label className="block text-[10px] font-medium mb-1">Pressure range</label>
            <div className="flex items-center gap-1">
              <button
                className="px-1 py-0.5 bg-gray-200 rounded text-[10px]"
                onClick={() => setChartPressureMax(Math.max(-50, chartPressureMax - 10))}
              >
                -
              </button>
              <span className="w-12 text-center text-[10px]">{chartPressureMax}</span>
              <button
                className="px-1 py-0.5 bg-gray-200 rounded text-[10px]"
                onClick={() => setChartPressureMax(Math.min(300, chartPressureMax + 10))}
              >
                +
              </button>
              <span className="text-[10px]">to</span>
              <button
                className="px-1 py-0.5 bg-gray-200 rounded text-[10px]"
                onClick={() => setChartPressureMin(Math.max(-500, chartPressureMin - 10))}
              >
                -
              </button>
              <span className="w-12 text-center text-[10px]">{chartPressureMin}</span>
              <button
                className="px-1 py-0.5 bg-gray-200 rounded text-[10px]"
                onClick={() => setChartPressureMin(Math.min(chartPressureMax - 10, chartPressureMin + 10))}
              >
                +
              </button>
                </div>
              </div>

          {/* Compliance Range */}
          <div className="mb-2">
            <label className="block text-[10px] font-medium mb-1">Compliance range</label>
            <div className="flex items-center gap-1">
              <button
                className="px-1 py-0.5 bg-gray-200 rounded text-[10px]"
                onClick={() => setChartComplianceMin(Math.max(0, chartComplianceMin - 0.1))}
              >
                -
              </button>
              <span className="w-12 text-center text-[10px]">{chartComplianceMin.toFixed(2)}</span>
              <button
                className="px-1 py-0.5 bg-gray-200 rounded text-[10px]"
                onClick={() => setChartComplianceMin(Math.min(chartComplianceMax - 0.1, chartComplianceMin + 0.1))}
              >
                +
              </button>
              <span className="text-[10px]">to</span>
              <button
                className="px-1 py-0.5 bg-gray-200 rounded text-[10px]"
                onClick={() => setChartComplianceMax(Math.max(chartComplianceMin + 0.1, chartComplianceMax - 0.1))}
              >
                -
              </button>
              <span className="w-12 text-center text-[10px]">{chartComplianceMax.toFixed(2)}</span>
              <button
                className="px-1 py-0.5 bg-gray-200 rounded text-[10px]"
                onClick={() => setChartComplianceMax(Math.min(3, chartComplianceMax + 0.1))}
              >
                +
              </button>
                </div>
              </div>

          {/* Range Presets */}
          <div className="mb-2">
            <label className="block text-[10px] font-medium mb-1">Presets</label>
            <div className="grid grid-cols-2 gap-1">
              {RANGE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  className={`px-2 py-0.5 rounded text-[10px] ${
                    startPressure === preset.start && stopPressure === preset.stop
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  }`}
                  onClick={() => {
                    setStartPressure(preset.start);
                    setStopPressure(preset.stop);
                    setChartPressureMax(preset.start);
                    setChartPressureMin(preset.stop);
                  }}
                >
                  {preset.label}
                </button>
              ))}
                  </div>
                </div>

          {/* Speed */}
          <div className="mb-2">
            <label className="block text-[10px] font-medium mb-1">Speed</label>
            <div className="flex gap-1">
              <button
                className={`flex-1 px-2 py-0.5 rounded text-[10px] ${
                  autoSpeed ? "bg-blue-500 text-white" : "bg-gray-200"
                }`}
                onClick={() => setAutoSpeed(true)}
              >
                Auto
              </button>
              <button
                className={`flex-1 px-2 py-0.5 rounded text-[10px] ${
                  !autoSpeed ? "bg-blue-500 text-white" : "bg-gray-200"
                }`}
                onClick={() => setAutoSpeed(false)}
              >
                Manual
              </button>
                </div>
              </div>

              {!autoSpeed && (
            <div className="mb-2">
              <label className="block text-[10px] font-medium mb-1">Sweep speed</label>
              <input
                    type="number"
                    min={50}
                    max={200}
                    value={sweepSpeed}
                onChange={(e) => setSweepSpeed(Math.max(50, Math.min(200, Number(e.target.value) || 200)))}
                className="w-full p-1 border rounded text-[10px]"
                  />
                </div>
              )}

          {/* Live Measurements */}
          <div className="mb-2">
            <div className="text-[10px] font-medium mb-1">Live</div>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              <div>
                <div className="text-[9px] text-gray-500">Pressure</div>
                <div className="font-semibold">{currentPressure.toFixed(0)} daPa</div>
                </div>
              <div>
                <div className="text-[9px] text-gray-500">Compliance</div>
                <div className="font-semibold">{currentCompliance.toFixed(2)} ml</div>
                </div>
              <div>
                <div className="text-[9px] text-gray-500">ECV</div>
                <div className="font-semibold">{earCanalVolume !== null ? `${earCanalVolume.toFixed(2)}` : "--"}</div>
              </div>
              <div>
                <div className="text-[9px] text-gray-500">Active</div>
                <div className="font-semibold">Curve {activeCurve}</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-1">
            <div className="flex gap-1">
              <button
                className={`flex-1 px-2 py-1 rounded text-[10px] ${
                  isRunning ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
                } text-white`}
                onClick={isRunning ? handleStop : handleStart}
                disabled={completedEars.has(selectedEar)}
              >
                {isRunning ? "Stop" : "Start"}
              </button>
              <button
                className="flex-1 px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-[10px]"
                onClick={resetTest}
                disabled={isRunning}
              >
                Reset
              </button>
        </div>
            {/* Save and Next Ear Button - Show when test is completed and not saved yet */}
            {sessionState === "completed" && completedCurves.size === 3 && !completedEars.has(selectedEar) && (
              <button
                className="w-full px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-[10px]"
                onClick={saveETFResults}
                disabled={updateConsultationMutation.isPending}
              >
                {updateConsultationMutation.isPending
                  ? "Saving..."
                  : completedEars.size === 1
                  ? "Save Results (Last Ear)"
                  : "Save & Next Ear"}
              </button>
            )}
            {/* View Report Button - Show only when at least one ear is saved */}
            {completedEars.size >= 1 && (
              <button
                className="w-full px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-[10px]"
                onClick={() => {
                  router.push(`/consultation/${consultationId}/test/report/etf-intact`);
                }}
              >
                View Report
              </button>
            )}
      </div>
      </div>
      </div>
    </>
  );
}