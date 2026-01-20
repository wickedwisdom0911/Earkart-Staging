"use client";
import { ImpedanceData } from "@/models/device/impedance-data.model";
import { ImpedanceStatus } from "@/models/device/impredance-status.model";
import { useSocket } from "@/providers/socket-provider";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useCallback, useEffect } from "react";
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
import { useUpdateConsultation } from "@/hooks/consultation/use-update-consultation";
import { useGetConsultation } from "@/hooks/consultation/use-get-consultation";
import { ConsultationModelData } from "@/models/consultation.model";
import {
  TympanometryTestModelData,
  TympanometryReadingModelData,
} from "@/models/tympanometry.model";
import { TestStatus, Ear, TympType } from "@/models/enums";
import { toast } from "sonner";
import { ROUTES } from "@/lib/routes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface TympanogramPoint {
  pressure: number;
  compliance: number;
  compensatedCompliance?: number;
  ear: "L" | "R";
}

const PROBE_TONES = [226, 1000]; // Hz

const RANGE_PRESETS = [
  { label: "200/-400", start: 200, stop: -400 },
  { label: "100/-400", start: 100, stop: -400 },
  { label: "100/-300", start: 100, stop: -300 },
  { label: "100/-200", start: 100, stop: -200 },
];

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
              isAnimationActive={!isTestCompleted}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default function TympanometryPage() {
  const socket = useSocket();
  const router = useRouter();
  const params = useParams();
  const updateConsultationMutation = useUpdateConsultation();
  const { data: consultation } = useGetConsultation(
    params.consultationId as string
  );

  const [selectedEar, setSelectedEar] = useState<"L" | "R">("L");
  const [selectedProbeTone, setSelectedProbeTone] = useState(226);
  const [isRunning, setIsRunning] = useState(false);
  const [currentPressure, setCurrentPressure] = useState(0);
  const [currentCompliance, setCurrentCompliance] = useState(0);
  const [realTimeData, setRealTimeData] = useState<TympanogramPoint[]>([]);
  const [finalData, setFinalData] = useState<TympanogramPoint[]>([]);
  const [isTestCompleted, setIsTestCompleted] = useState(false);
  
  // NACK dialog state
  const [showNackDialog, setShowNackDialog] = useState(false);
  const [nackMessage, setNackMessage] = useState("");
  // Cache for readings saved during this session to avoid losing the first ear before refetch
  const [localReadings, setLocalReadings] = useState<TympanometryReadingModelData[]>([]);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);

  // Add state for all tympanometry values
  const [peakPressure, setPeakPressure] = useState<number | null>(null);
  const [peakCompliance, setPeakCompliance] = useState<number | null>(null);
  const [peakCompensatedWithECV, setPeakCompensatedWithECV] = useState<number | null>(null);
  const [gradient, setGradient] = useState<number | null>(null);
  const [gradientPressure, setGradientPressure] = useState<number | null>(null);
  const [ecv, setECV] = useState<number | null>(null);
  const [completedEars, setCompletedEars] = useState<Set<"L" | "R">>(new Set());
  
  // State for save confirmation dialog
  const [showSaveConfirmDialog, setShowSaveConfirmDialog] = useState(false);
  const [pendingEarSwitch, setPendingEarSwitch] = useState<"L" | "R" | null>(null);

  // New state variables for controls
  const [pressureMin, setPressureMin] = useState(-150);
  const [pressureMax, setPressureMax] = useState(50);
  const [complianceMin, setComplianceMin] = useState(0.3);
  const [complianceMax, setComplianceMax] = useState(1.7);
  const [start, setStart] = useState(100);
  const [stop, setStop] = useState(-200);
  const [autoSpeed, setAutoSpeed] = useState(true);
  const speed = 200;

  // Function to save tympanometry results to consultation
  const saveTympanometryResults = useCallback(async () => {
    const consultationData = (consultation as any)?.data as ConsultationModelData | undefined;
    if (!consultationData) {
      console.log("Cannot save results: missing consultation data");
      return;
    }

    // Always save curve arrays - use finalData if available, otherwise use realTimeData
    // This guarantees backend always gets pressureData and complianceData arrays
    const dataToSave = finalData.length > 0 ? finalData : realTimeData;
    
    if (dataToSave.length === 0) {
      console.log("Cannot save results: no data available (neither finalData nor realTimeData)");
      toast.error("No test data available to save. Please run the test again.");
      return;
    }

    // Extract pressure and compliance data arrays from available data
    const pressureData = dataToSave.map(point => point.pressure);
    const complianceData = dataToSave.map(point => point.compliance);
    
    // Use values from device data or calculate fallbacks
    const peakCompValue = peakCompliance ?? 0;
    const ecvValue = ecv ?? 0;
    // ALWAYS use peakCompensatedWithECV from device if available (this is what's shown in controls)
    // Only calculate if device didn't provide it
    const peakCompensatedValue = peakCompensatedWithECV !== null 
      ? peakCompensatedWithECV 
      : (peakCompValue > 0 && ecvValue > 0 ? Math.max(0, peakCompValue - ecvValue) : 0);
    


    // Create tympanometry reading data with all new fields
    const tympanometryReading: TympanometryReadingModelData = {
      tympanometryId: "", // Will be set by backend
      ear: selectedEar === "L" ? Ear.LEFT : Ear.RIGHT,
      peakPressure: peakPressure ?? 0,
      staticCompliance: peakCompensatedValue, // Use compensated compliance - MUST match what's shown in controls
      earCanalVolume: ecvValue,
      tympType: TympType.A, // Default type, can be updated in report page
      // New fields
      peakCompliance: peakCompValue, // Raw compliance (includes ECV)
      peakCompensatedWithECV: peakCompensatedValue, // Compensated compliance - MUST match controls display
      gradient: gradient ?? undefined,
      gradientPressure: gradientPressure ?? undefined,
      // Always save arrays - guaranteed by using finalData or realTimeData
      pressureData: pressureData,
      complianceData: complianceData,
    };

    // Merge with any existing readings from consultation and our local cache,
    // then overwrite with the current ear's reading to avoid duplicates.
    const existingReadings = consultationData.tympanometry?.readings || [];
    const mergedByEar = new Map<Ear, TympanometryReadingModelData>();
    for (const r of existingReadings) mergedByEar.set(r.ear, r);
    for (const r of localReadings) mergedByEar.set(r.ear, r);
    mergedByEar.set(tympanometryReading.ear, tympanometryReading);
    const updatedReadings: TympanometryReadingModelData[] = Array.from(mergedByEar.values());
    // Update local cache immediately so the next save includes prior ear even if query hasn't refetched
    setLocalReadings(updatedReadings);

    // Create tympanometry test data
    const tympanometryTest: TympanometryTestModelData = {
      sessionId: consultationData.id,
      status: TestStatus.COMPLETED,
      readings: updatedReadings,
      notes: consultationData.tympanometry?.notes
        ? `${consultationData.tympanometry.notes}\nTympanometry test completed for ${selectedEar} ear. Probe tone: ${selectedProbeTone}Hz.`
        : `Tympanometry test completed for ${selectedEar} ear. Probe tone: ${selectedProbeTone}Hz.`,
      createdAt:
        consultationData.tympanometry?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update consultation with tympanometry data
    const updatedConsultation: ConsultationModelData = {
      ...consultationData,
      tympanometry: tympanometryTest,
      updatedAt: new Date().toISOString(),
    };

    try {
      await updateConsultationMutation.mutateAsync(updatedConsultation);
      console.log("Tympanometry results saved successfully");

      // Preserve localStorage data after test submission
      try {
        const storageKey = `tympanometry-${params.consultationId}`;
        const dataToStore = {
          localReadings: updatedReadings,
          completedEars: Array.from(completedEars),
          timestamp: new Date().toISOString(),
          submitted: true
        };
        localStorage.setItem(storageKey, JSON.stringify(dataToStore));
        console.log('💾 Preserved tympanometry data in localStorage after test submission');
      } catch (error) {
        console.error('Failed to save to localStorage:', error);
      }

      // Add current ear to completed set
      const newCompletedEars = new Set(completedEars);
      newCompletedEars.add(selectedEar);
      setCompletedEars(newCompletedEars);

      // Check if both ears are completed
      if (newCompletedEars.size === 2) {
        toast.success("Both ears completed! You can now view the report.");
        // Don't automatically navigate - let user click "View Report" button
      } else {
        const remainingEar = selectedEar === "L" ? "Right" : "Left";
        toast.success(
          `${selectedEar === "L" ? "Left" : "Right"} ear completed and saved! Please test the ${remainingEar} ear.`
        );

        // Switch to the other ear automatically
        const nextEar = selectedEar === "L" ? "R" : "L";
        setSelectedEar(nextEar);
        
        // Check if the next ear already has saved data
        const nextEarReading = updatedReadings.find(r => 
          r.ear === (nextEar === "L" ? Ear.LEFT : Ear.RIGHT)
        );
        
        if (nextEarReading) {
          // Load saved data for the next ear
          setPeakPressure(nextEarReading.peakPressure);
          setPeakCompliance(nextEarReading.peakCompliance ?? null);
          setPeakCompensatedWithECV(nextEarReading.peakCompensatedWithECV ?? nextEarReading.staticCompliance ?? null);
          setECV(nextEarReading.earCanalVolume);
          setGradient(nextEarReading.gradient ?? null);
          
          // Rebuild graph data from saved reading
          if (nextEarReading.pressureData && nextEarReading.complianceData) {
            const savedPoints: TympanogramPoint[] = nextEarReading.pressureData.map(
              (pressure: number, index: number) => {
                const rawCompliance = nextEarReading.complianceData![index];
                const ecvValue = nextEarReading.earCanalVolume;
                const compensatedCompliance = Math.max(0, rawCompliance - ecvValue);
                return {
                  pressure,
                  compliance: rawCompliance,
                  compensatedCompliance,
                  ear: nextEar,
                };
              }
            );
            setFinalData(savedPoints);
            setIsTestCompleted(true);
          } else {
            // No graph data available - show empty graph
            setFinalData([]);
            setIsTestCompleted(false);
          }
        } else {
          // Reset test state for the next ear (no saved data)
          setRealTimeData([]);
          setFinalData([]);
          setIsTestCompleted(false);
          setCurrentPressure(0);
          setCurrentCompliance(0);
          setPeakPressure(null);
          setPeakCompliance(null);
          setPeakCompensatedWithECV(null);
          setGradient(null);
          setECV(null);
        }
      }
    } catch (error) {
      console.error("Failed to save tympanometry results:", error);
      toast.error("Failed to save tympanometry results. Please try again.");
    }
  }, [
    consultation,
    isTestCompleted,
    finalData.length,
    selectedEar,
    peakPressure,
    peakCompliance,
    ecv,
    selectedProbeTone,
    updateConsultationMutation,
    router,
    params.consultationId,
    completedEars,
    localReadings,
  ]);

  // Handle ear switching with save confirmation
  const handleEarSwitch = useCallback((newEar: "L" | "R") => {
    // Check if current ear has unsaved results
    if (isTestCompleted && !completedEars.has(selectedEar) && newEar !== selectedEar) {
      // Ask user if they want to save
      setPendingEarSwitch(newEar);
      setShowSaveConfirmDialog(true);
    } else {
      // Safe to switch
      setSelectedEar(newEar);
    }
  }, [isTestCompleted, completedEars, selectedEar]);

  // Handle save confirmation dialog
  const handleSaveConfirmation = useCallback(async (shouldSave: boolean) => {
    if (shouldSave && pendingEarSwitch) {
      // Save current ear results
      await saveTympanometryResults();
    } else {
      // Reset test state if not saving
      setRealTimeData([]);
      setFinalData([]);
      setIsTestCompleted(false);
      setCurrentPressure(0);
      setCurrentCompliance(0);
      setPeakPressure(null);
      setPeakCompliance(null);
      setGradient(null);
      setECV(null);
    }
    
    // Switch to pending ear
    if (pendingEarSwitch) {
      setSelectedEar(pendingEarSwitch);
    }
    
    // Close dialog
    setShowSaveConfirmDialog(false);
    setPendingEarSwitch(null);
  }, [pendingEarSwitch, saveTympanometryResults]);

  // Update real-time data when receiving impedance status
  React.useEffect(() => {
    if (!socket) return;

    const handleTympanometryStatus = (data: {
      tympanometryStatus: ImpedanceStatus;
    }) => {
      console.log("Received tympanometry status:", data.tympanometryStatus);

      // Always update current values
      const pressure = data.tympanometryStatus.Pressure ?? 0;
      const compliance = data.tympanometryStatus.Compliance ?? 0;
      const ecv = data.tympanometryStatus.Tymp?.ECV ?? 0;

      console.log(
        "Updating values - Pressure:",
        pressure,
        "Compliance:",
        compliance,
        "ECV:",
        ecv
      );

      // Update state immediately
      setCurrentPressure(pressure);
      setCurrentCompliance(compliance);

      // Only add points to real-time data if test is running
      if (isRunning && !isTestCompleted) {
        const newPoint: TympanogramPoint = {
          pressure,
          compliance,
          compensatedCompliance: Math.max(0, compliance - ecv),
          ear: selectedEar,
        };
        console.log("Adding new point:", newPoint);
        setRealTimeData((prev) => [...prev, newPoint]);
      }
    };

    const handleTympanometryData = (data: {
      tympanometryData: ImpedanceData;
    }) => {
      console.log("Received tympanometry data:", data.tympanometryData);
      if (
        data.tympanometryData.Tymp?.PressureData &&
        data.tympanometryData.Tymp?.Y?.ComplianceData
      ) {
        const ecv = data.tympanometryData.Tymp.ECV ?? 0;
        // ComplianceData from device is RAW compliance (includes ECV)
        // We subtract ECV to get compensated compliance (what we display on graph)
        const finalPoints: TympanogramPoint[] =
          data.tympanometryData.Tymp.PressureData.map(
            (pressure: number, index: number) => {
              const rawCompliance =
                data.tympanometryData.Tymp!.Y!.ComplianceData![index];
              const compensatedCompliance = Math.max(0, rawCompliance - ecv);
              return {
                pressure,
                compliance: rawCompliance, // Store raw for reference
                compensatedCompliance, // Compensated for display
                ear: selectedEar,
              };
            }
          );
        console.log("Setting final points:", finalPoints);
        setFinalData(finalPoints);
        setIsTestCompleted(true);
        setIsRunning(false);

        // Update final values from data
        if (data.tympanometryData.Tymp?.Y?.Peak?.Pressure !== undefined) {
          setPeakPressure(data.tympanometryData.Tymp.Y.Peak.Pressure);
        }
        if (data.tympanometryData.Tymp?.Y?.Peak?.Compliance !== undefined) {
          setPeakCompliance(data.tympanometryData.Tymp.Y.Peak.Compliance);
        }
        if (
          data.tympanometryData.Tymp?.Y?.Peak?.CompensatedWithECV !== undefined
        ) {
          setPeakCompensatedWithECV(
            data.tympanometryData.Tymp.Y.Peak.CompensatedWithECV
          );
        }
        if (data.tympanometryData.Tymp?.Y?.Gradient !== undefined) {
          setGradient(data.tympanometryData.Tymp.Y.Gradient);
        }
        if (data.tympanometryData.Tymp?.Y?.GradientPressure !== undefined) {
          setGradientPressure(data.tympanometryData.Tymp.Y.GradientPressure);
        }
        if (data.tympanometryData.Tymp?.ECV !== undefined) {
          setECV(data.tympanometryData.Tymp.ECV);
        }
      }
    };

    // Add socket event listeners with explicit types
    socket.on(
      "tympanometry-status",
      (data: { tympanometryStatus: ImpedanceStatus }) => {
        handleTympanometryStatus(data);
      }
    );

    socket.on(
      "tympanometry-data",
      (data: { tympanometryData: ImpedanceData }) => {
        handleTympanometryData(data);
      }
    );

    // Dedicated handler for nack-received (test cannot be performed)
    const handleNackReceived = (data: { message?: string; testId?: string }) => {
      console.warn("⚠️ [NACK Received] Test not ready or error:", data);
      
      // Stop the test if it was running
      setIsRunning(false);
      setIsTestCompleted(false);
      
      // Extract message
      const errorMessage = data.message || "Test device not ready or test cannot be performed at this time";
      
      // Show big dialog instead of toast - requires audiologist confirmation
      setNackMessage(errorMessage);
      setShowNackDialog(true);
      
      // Log for debugging
      console.error("❌ [NACK] Test cannot proceed:", {
        message: errorMessage,
        testId: data.testId,
        selectedEar,
        consultationId: params.consultationId,
      });
    };

    socket.on("nack-received", handleNackReceived);

    // Cleanup function
    return () => {
      socket.off("tympanometry-status");
      socket.off("tympanometry-data");
      socket.off("nack-received", handleNackReceived);
    };
  }, [
    socket,
    isRunning,
    isTestCompleted,
    selectedEar,
    saveTympanometryResults,
    params.consultationId,
  ]);

  // Load test results - prioritize backend if test is completed, otherwise use localStorage
  useEffect(() => {
    const consultationData = (consultation as any)?.data as ConsultationModelData | undefined;
    if (!params.consultationId || hasLoadedFromStorage || !consultationData) return;
    
    const isTestCompleted = consultationData?.tympanometry?.status === TestStatus.COMPLETED;
    
    // If test is completed, skip localStorage and load from backend (handled in next useEffect)
    if (isTestCompleted) {
      console.log('✅ Tympanometry test is completed - will load from backend API');
      setHasLoadedFromStorage(true);
      return;
    }
    
    // If test is NOT completed, load from localStorage for work in progress
    try {
      const storageKey = `tympanometry-${params.consultationId}`;
      const storedData = localStorage.getItem(storageKey);
      
      if (storedData) {
        const parsed = JSON.parse(storedData);
        if (parsed.localReadings && Array.isArray(parsed.localReadings)) {
          setLocalReadings(parsed.localReadings);
          
          // Restore completed ears
          if (parsed.completedEars && Array.isArray(parsed.completedEars)) {
            setCompletedEars(new Set(parsed.completedEars));
          }
          
          console.log('📦 Loaded tympanometry results from localStorage (test not completed):', {
            count: parsed.localReadings.length
          });
        }
      }
      setHasLoadedFromStorage(true);
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      setHasLoadedFromStorage(true);
    }
  }, [params.consultationId, consultation, hasLoadedFromStorage]);

  // Populate test results from backend API - prioritize if test is completed
  useEffect(() => {
    const consultationData = (consultation as any)?.data as ConsultationModelData | undefined;
    if (!consultationData || !hasLoadedFromStorage) return;

    const isTestCompleted = consultationData?.tympanometry?.status === TestStatus.COMPLETED;
    
    // If test is NOT completed and we already have local data, don't override
    if (!isTestCompleted && localReadings.length > 0) {
      return; // Keep localStorage data for work in progress
    }
    
    // If test is completed OR we don't have local data, load from backend
    if (consultationData?.tympanometry?.readings && consultationData.tympanometry.readings.length > 0) {
      setLocalReadings(consultationData.tympanometry.readings);
      
      // Restore completed ears from backend
      const backendCompletedEars = new Set<"L" | "R">();
      consultationData.tympanometry.readings.forEach((reading) => {
        if (reading.ear === Ear.LEFT) backendCompletedEars.add("L");
        if (reading.ear === Ear.RIGHT) backendCompletedEars.add("R");
      });
      setCompletedEars(backendCompletedEars);
      
      console.log('📥 Loaded tympanometry results from backend API:', {
        count: consultationData.tympanometry.readings.length,
        isCompleted: isTestCompleted
      });
      
      // Also save to localStorage for future reference
      try {
        const storageKey = `tympanometry-${params.consultationId}`;
        const dataToStore = {
          localReadings: consultationData.tympanometry.readings,
          completedEars: Array.from(backendCompletedEars),
          timestamp: new Date().toISOString(),
          submitted: isTestCompleted
        };
        localStorage.setItem(storageKey, JSON.stringify(dataToStore));
      } catch (error) {
        console.error('Failed to save backend data to localStorage:', error);
      }
    }
  }, [consultation, params.consultationId, hasLoadedFromStorage, localReadings.length]);

  // Load saved reading data whenever the selected ear changes
  React.useEffect(() => {
    const consultationData = (consultation as any)?.data as ConsultationModelData | undefined;
    const savedReading = localReadings.find(r => 
      r.ear === (selectedEar === "L" ? Ear.LEFT : Ear.RIGHT)
    ) || consultationData?.tympanometry?.readings?.find(r => 
      r.ear === (selectedEar === "L" ? Ear.LEFT : Ear.RIGHT)
    );

    if (savedReading && !isRunning) {
      // Load saved values for display
      setPeakPressure(savedReading.peakPressure);
      setPeakCompliance(savedReading.peakCompliance ?? null);
      setPeakCompensatedWithECV(savedReading.peakCompensatedWithECV ?? savedReading.staticCompliance ?? null);
      setECV(savedReading.earCanalVolume);
      setGradient(savedReading.gradient ?? null);

      // Rebuild graph data from saved reading - only use backend data
      if (savedReading.pressureData && savedReading.complianceData && savedReading.pressureData.length > 0) {
        const savedPoints: TympanogramPoint[] = savedReading.pressureData.map(
          (pressure: number, index: number) => {
            const rawCompliance = savedReading.complianceData![index];
            const ecvValue = savedReading.earCanalVolume;
            const compensatedCompliance = Math.max(0, rawCompliance - ecvValue);
            return {
              pressure,
              compliance: rawCompliance,
              compensatedCompliance,
              ear: selectedEar,
            };
          }
        );
        setFinalData(savedPoints);
        // Mark test as completed for this ear only in UI
        setIsTestCompleted(true);
      } else {
        // No graph data available - show empty
        setFinalData([]);
        setIsTestCompleted(false);
      }
    }
  }, [selectedEar, consultation, localReadings, isRunning]);

  // Save test results to localStorage whenever they change (preserve even after submission)
  useEffect(() => {
    const consultationData = (consultation as any)?.data as ConsultationModelData | undefined;
    if (!params.consultationId || !hasLoadedFromStorage) return;
    
    const isTestCompleted = consultationData?.tympanometry?.status === TestStatus.COMPLETED;
    
    // Always save to preserve tympanometry data, even after test completion
    try {
      const storageKey = `tympanometry-${params.consultationId}`;
      const dataToStore = {
        localReadings,
        completedEars: Array.from(completedEars),
        timestamp: new Date().toISOString(),
        submitted: isTestCompleted
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToStore));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, [params.consultationId, localReadings, completedEars, consultation?.tympanometry?.status, hasLoadedFromStorage]);



  // Start/Stop tympanometry test
  const startTest = useCallback(() => {
    if (!socket) return;

    if (!isRunning) {
      // Reset all state values
      setRealTimeData(() => []);
      setFinalData(() => []);
      setIsTestCompleted(() => false);
      setCurrentPressure(() => 0);
      setCurrentCompliance(() => 0);
      setPeakPressure(() => null);
      setPeakCompliance(() => null);
      setGradient(() => null);
      setECV(() => null);

      // Start the test
      setIsRunning(() => true);

      // Emit start test event with parameters
      socket.emit("start-tympanometry", {
        consultationId: params.consultationId,
        ProbeToneFrequency: selectedProbeTone,
        AutoSpeed: autoSpeed,
        Speed: speed,
        Start: start,
        Stop: stop,
        ComplianceMin: complianceMin,
        ComplianceMax: complianceMax,
        PressureMin: pressureMin,
        PressureMax: pressureMax,
      });
      console.log("Started tympanometry test with params:", {
        ProbeToneFrequency: selectedProbeTone,
        AutoSpeed: autoSpeed,
        Speed: speed,
        Start: start,
        Stop: stop,
        ComplianceMin: complianceMin,
        ComplianceMax: complianceMax,
        PressureMin: pressureMin,
        PressureMax: pressureMax,
      });
    } else {
      // Stop the test
      setIsRunning(() => false);
      socket.emit("stop-tympanometry", {
        consultationId: params.consultationId,
      });
      console.log("Stopped tympanometry test");
    }
  }, [
    socket,
    params.consultationId,
    selectedProbeTone,
    autoSpeed,
    speed,
    start,
    stop,
    complianceMin,
    complianceMax,
    pressureMin,
    pressureMax,
    isRunning,
  ]);

  // Reset test data
  const resetTest = useCallback(() => {
    console.log("Resetting test data");
    setRealTimeData([]);
    setFinalData([]);
    setIsTestCompleted(false);
    setIsRunning(false);
    setCurrentPressure(0);
    setCurrentCompliance(0);
    setPeakPressure(null);
    setPeakCompliance(null);
    setGradient(null);
    setECV(null);
  }, []);



  return (
    <>
      {/* NACK Dialog - Big warning like patient response */}
      {showNackDialog && (
        <>
          <style jsx>{`
            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
              20%, 40%, 60%, 80% { transform: translateX(10px); }
            }
          `}</style>
          {/* Full-screen overlay */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            {/* Pulsing red background */}
            <div className="absolute inset-0 bg-red-500/10 animate-pulse" />
            
            {/* Dialog box */}
            <div 
              className="relative bg-white border-4 border-red-500 rounded-2xl shadow-2xl p-8 max-w-lg mx-4"
              style={{ animation: 'shake 0.5s ease-in-out' }}
            >
              {/* Warning icon with animation */}
              <div className="mx-auto mb-6 relative flex h-20 w-20 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-16 w-16 bg-red-600 items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </span>
              </div>
              
              {/* Title */}
              <h2 className="text-2xl font-bold text-red-700 text-center mb-4">
                Test Cannot Be Performed
              </h2>
              
              {/* Message */}
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                <p className="text-red-800 text-lg font-medium text-center">
                  {nackMessage}
                </p>
              </div>
              
              {/* Instructions */}
              <p className="text-gray-700 text-center mb-6">
                Please ensure the device is properly connected and ready before continuing.
              </p>
              
              {/* Confirmation button */}
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    setShowNackDialog(false);
                    setNackMessage("");
                  }}
                  className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-300"
                >
                  Yes, I Understand
                </button>
              </div>
              
              {/* Additional note */}
              <p className="text-xs text-gray-500 text-center mt-4">
                Only the audiologist can dismiss this warning
              </p>
            </div>
          </div>
        </>
      )}
      
      {/* Save Confirmation Dialog */}
      <Dialog open={showSaveConfirmDialog} onOpenChange={setShowSaveConfirmDialog}>
        <DialogContent className="z-[100]">
          <DialogHeader>
            <DialogTitle>Unsaved Test Results</DialogTitle>
            <DialogDescription>
              You have unsaved test results for the {selectedEar === "L" ? "Left" : "Right"} ear.
              Do you want to save them before switching?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    If you don't save, the test data for this ear will be lost.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => handleSaveConfirmation(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Don't Save
            </button>
            <button
              onClick={() => handleSaveConfirmation(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              Save & Continue
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <div className="p-6 lg:pr-80">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">Tympanometry</h1>

        {/* Status Indicator */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <div
                className={`w-3 h-3 rounded-full ${completedEars.has("L") ? "bg-green-500" : selectedEar === "L" ? "bg-blue-500" : "bg-gray-300"}`}
              ></div>
              <div
                className={`w-3 h-3 rounded-full ${completedEars.has("R") ? "bg-green-500" : selectedEar === "R" ? "bg-blue-500" : "bg-gray-300"}`}
              ></div>
            </div>
            <div className="flex-1">
              {completedEars.size === 0 && (
                <p className="text-blue-800">
                  Ready to start tympanometry testing. Select an ear and begin
                  the test.
                </p>
              )}
              {completedEars.size === 1 && (
                <p className="text-blue-800">
                  {completedEars.has("L")
                    ? "Left ear completed! Now testing right ear."
                    : "Right ear completed! Now testing left ear."}
                </p>
              )}
              {completedEars.size === 2 && (
                <p className="text-green-800 font-medium">
                  Both ears completed! You can now view the full report.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Floating Controls (Right-side) */}
        <div className="fixed right-4 top-1/2 -translate-y-1/2 z-10 w-64 hidden lg:block print:hidden">
          <div className="bg-white shadow-lg rounded-lg p-2 border">
            {/* Ear Selection */}
            <div className="mb-2">
              <label className="block text-[10px] font-medium mb-1">Ear</label>
              <div className="flex gap-1">
                <button
                  className={`flex-1 px-2 py-1 rounded text-[10px] ${
                    selectedEar === "L"
                      ? "bg-blue-500 text-white"
                      : completedEars.has("L")
                        ? "bg-green-500 text-white"
                        : "bg-gray-200"
                  }`}
                  onClick={() => handleEarSwitch("L")}
                >
                  L
                </button>
                <button
                  className={`flex-1 px-2 py-1 rounded text-[10px] ${
                    selectedEar === "R"
                      ? "bg-blue-500 text-white"
                      : completedEars.has("R")
                        ? "bg-green-500 text-white"
                        : "bg-gray-200"
                  }`}
                  onClick={() => handleEarSwitch("R")}
                >
                  R
                </button>
              </div>
            </div>

            {/* Probe Tone */}
            <div className="mb-2">
              <label className="block text-[10px] font-medium mb-1">Probe tone</label>
              <select
                className="w-full p-1 border rounded text-[10px]"
                value={selectedProbeTone}
                onChange={(e) => setSelectedProbeTone(Number(e.target.value))}
              >
                {PROBE_TONES.map((freq) => (
                  <option key={freq} value={freq}>
                    {freq} Hz
                  </option>
                ))}
              </select>
            </div>

            {/* Pressure Range */}
            <div className="mb-2">
              <label className="block text-[10px] font-medium mb-1">Pressure range</label>
              <div className="flex items-center gap-1">
                <button className="px-1 py-0.5 bg-gray-200 rounded text-[10px]" onClick={() => setPressureMin(Math.max(-400, pressureMin - 5))}>-</button>
                <span className="w-12 text-center text-[10px]">{pressureMin}</span>
                <button className="px-1 py-0.5 bg-gray-200 rounded text-[10px]" onClick={() => setPressureMin(Math.min(pressureMax - 5, pressureMin + 5))}>+</button>
                <span className="text-[10px]">to</span>
                <button className="px-1 py-0.5 bg-gray-200 rounded text-[10px]" onClick={() => setPressureMax(Math.max(pressureMin + 5, pressureMax - 5))}>-</button>
                <span className="w-12 text-center text-[10px]">{pressureMax}</span>
                <button className="px-1 py-0.5 bg-gray-200 rounded text-[10px]" onClick={() => setPressureMax(Math.min(400, pressureMax + 5))}>+</button>
              </div>
            </div>

            {/* Compliance Range */}
            <div className="mb-2">
              <label className="block text-[10px] font-medium mb-1">Compliance range</label>
              <div className="flex items-center gap-1">
                <button className="px-1 py-0.5 bg-gray-200 rounded text-[10px]" onClick={() => setComplianceMin(Math.max(0, complianceMin - 0.05))}>-</button>
                <span className="w-12 text-center text-[10px]">{complianceMin.toFixed(2)}</span>
                <button className="px-1 py-0.5 bg-gray-200 rounded text-[10px]" onClick={() => setComplianceMin(Math.min(complianceMax - 0.05, complianceMin + 0.05))}>+</button>
                <span className="text-[10px]">to</span>
                <button className="px-1 py-0.5 bg-gray-200 rounded text-[10px]" onClick={() => setComplianceMax(Math.max(complianceMin + 0.05, complianceMax - 0.05))}>-</button>
                <span className="w-12 text-center text-[10px]">{complianceMax.toFixed(2)}</span>
                <button className="px-1 py-0.5 bg-gray-200 rounded text-[10px]" onClick={() => setComplianceMax(Math.min(2.0, complianceMax + 0.05))}>+</button>
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
                      start === preset.start && stop === preset.stop
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200"
                    }`}
                    onClick={() => {
                      setStart(preset.start);
                      setStop(preset.stop);
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
                  className={`flex-1 px-2 py-0.5 rounded text-[10px] ${autoSpeed ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                  onClick={() => setAutoSpeed(true)}
                >
                  Auto
                </button>
                <button
                  className={`flex-1 px-2 py-0.5 rounded text-[10px] ${!autoSpeed ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                  onClick={() => setAutoSpeed(false)}
                >
                  Fast
                </button>
              </div>
            </div>

            {/* Live Measurements */}
            <div className="mb-2">
              <div className="text-[10px] font-medium mb-1">Live</div>
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                <div>
                  <div className="text-[9px] text-gray-500">Pressure</div>
                  <div className="font-semibold">{currentPressure} daPa</div>
                </div>
                <div>
                  <div className="text-[9px] text-gray-500">Compliance</div>
                  <div className="font-semibold">{currentCompliance?.toFixed(2) ?? "0.00"} ml</div>
                </div>
                <div>
                  <div className="text-[9px] text-gray-500">Peak P</div>
                  <div className="font-semibold">{peakPressure !== null ? `${peakPressure}` : "--"}</div>
                </div>
                <div>
                  <div className="text-[9px] text-gray-500">Peak C</div>
                  <div className="font-semibold">
                    {(() => {
                      // First check if we have a saved reading for this ear (from localReadings or consultation)
                      const consultationData = (consultation as any)?.data as ConsultationModelData | undefined;
                      const savedReading = localReadings.find(r => 
                        r.ear === (selectedEar === "L" ? Ear.LEFT : Ear.RIGHT)
                      ) || consultationData?.tympanometry?.readings?.find(r => 
                        r.ear === (selectedEar === "L" ? Ear.LEFT : Ear.RIGHT)
                      );
                      
                      // If we have saved data, use that (prefer peakCompensatedWithECV, fallback to staticCompliance)
                      if (savedReading) {
                        const savedValue = savedReading.peakCompensatedWithECV ?? savedReading.staticCompliance;
                        if (savedValue !== undefined && savedValue > 0) {
                          return savedValue.toFixed(2);
                        }
                      }
                      
                      // Otherwise use live/test values - same logic as save function
                      const peakCompValue = peakCompliance ?? 0;
                      const ecvValue = ecv ?? 0;
                      const displayedValue = peakCompensatedWithECV !== null 
                        ? peakCompensatedWithECV 
                        : (peakCompValue > 0 && ecvValue > 0 ? Math.max(0, peakCompValue - ecvValue) : 0);
                      return displayedValue > 0 ? displayedValue.toFixed(2) : "--";
                    })()}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-gray-500">Gradient</div>
                  <div className="font-semibold">{gradient !== null ? `${gradient.toFixed(2)}` : "--"}</div>
                </div>
                <div>
                  <div className="text-[9px] text-gray-500">ECV</div>
                  <div className="font-semibold">{ecv !== null ? `${ecv.toFixed(2)}` : "--"}</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-1 mb-2">
              <button
                className={`flex-1 px-2 py-1 rounded text-[10px] ${
                  isRunning ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
                } text-white`}
                onClick={startTest}
              >
                {isRunning ? "Stop" : "Start"}
              </button>
              <button
                className="flex-1 px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-[10px]"
                onClick={resetTest}
              >
                Clear
              </button>
            </div>
            {completedEars.size > 0 && (
              <button
                className="w-full mb-2 px-2 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 text-[10px]"
                onClick={() => {
                  setCompletedEars(new Set());
                  setLocalReadings([]);
                  resetTest();
                  toast.info("All test progress cleared. You can start over.");
                }}
              >
                Reset All
              </button>
            )}

            {(isTestCompleted || finalData.length > 0 || realTimeData.length > 0) && (
              <button
                className={`w-full px-2 py-1 rounded text-[10px] ${
                  updateConsultationMutation.isPending ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                } text-white mb-1`}
                onClick={saveTympanometryResults}
                disabled={updateConsultationMutation.isPending}
              >
                {updateConsultationMutation.isPending
                  ? "Saving..."
                  : completedEars.size === 1
                    ? "Save Results (Last Ear)"
                    : "Save & Next Ear"}
              </button>
            )}
            {completedEars.size >= 1 && (
              <button
                className="w-full px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-[10px]"
                onClick={() =>
                  router.push(
                    (ROUTES as any).TYM_REPORT(params.consultationId as string)
                  )
                }
              >
                View Report
              </button>
            )}
          </div>
        </div>

        {/* Test Controls (hidden on large screens, use floating panel instead) */}
        <div className="grid grid-cols-2 gap-4 mb-6 lg:hidden">
          <div>
            <label className="block text-sm font-medium mb-2">Ear</label>
            <div className="flex gap-4">
              <button
                className={`px-4 py-2 rounded flex items-center gap-2 ${
                  selectedEar === "L"
                    ? "bg-blue-500 text-white"
                    : completedEars.has("L")
                      ? "bg-green-500 text-white"
                      : "bg-gray-200"
                }`}
                onClick={() => handleEarSwitch("L")}
              >
                {completedEars.has("L") && (
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                Left
                {completedEars.has("L") && <span className="text-xs">✓</span>}
              </button>
              <button
                className={`px-4 py-2 rounded flex items-center gap-2 ${
                  selectedEar === "R"
                    ? "bg-red-500 text-white"
                    : completedEars.has("R")
                      ? "bg-green-500 text-white"
                      : "bg-gray-200"
                }`}
                onClick={() => handleEarSwitch("R")}
              >
                {completedEars.has("R") && (
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                Right
                {completedEars.has("R") && <span className="text-xs">✓</span>}
              </button>
            </div>
            {/* Progress indicator */}
            <div className="mt-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Progress:</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(completedEars.size / 2) * 100}%` }}
                  ></div>
                </div>
                <span>{completedEars.size}/2 ears completed</span>
              </div>
              {completedEars.has(selectedEar) && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                  ⚠️ This ear has already been tested. You can retest if needed,
                  or switch to the other ear.
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Probe Tone</label>
            <select
              className="w-full p-2 border rounded"
              value={selectedProbeTone}
              onChange={(e) => setSelectedProbeTone(Number(e.target.value))}
            >
              {PROBE_TONES.map((freq) => (
                <option key={freq} value={freq}>
                  {freq} Hz
                </option>
              ))}
            </select>
          </div>

          {/* Pressure Range Controls */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Pressure Range
            </label>
            <div className="flex gap-2 items-center">
              <button
                className="px-2 py-1 bg-gray-200 rounded"
                onClick={() => setPressureMin(Math.max(-400, pressureMin - 5))}
              >
                -
              </button>
              <span className="w-20 text-center">{pressureMin} daPa</span>
              <button
                className="px-2 py-1 bg-gray-200 rounded"
                onClick={() =>
                  setPressureMin(Math.min(pressureMax - 5, pressureMin + 5))
                }
              >
                +
              </button>
              <span className="mx-2">to</span>
              <button
                className="px-2 py-1 bg-gray-200 rounded"
                onClick={() =>
                  setPressureMax(Math.max(pressureMin + 5, pressureMax - 5))
                }
              >
                -
              </button>
              <span className="w-20 text-center">{pressureMax} daPa</span>
              <button
                className="px-2 py-1 bg-gray-200 rounded"
                onClick={() => setPressureMax(Math.min(400, pressureMax + 5))}
              >
                +
              </button>
            </div>
          </div>

          {/* Compliance Range Controls */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Compliance Range
            </label>
            <div className="flex gap-2 items-center">
              <button
                className="px-2 py-1 bg-gray-200 rounded"
                onClick={() =>
                  setComplianceMin(Math.max(0, complianceMin - 0.05))
                }
              >
                -
              </button>
              <span className="w-20 text-center">
                {complianceMin.toFixed(2)} ml
              </span>
              <button
                className="px-2 py-1 bg-gray-200 rounded"
                onClick={() =>
                  setComplianceMin(
                    Math.min(complianceMax - 0.05, complianceMin + 0.05)
                  )
                }
              >
                +
              </button>
              <span className="mx-2">to</span>
              <button
                className="px-2 py-1 bg-gray-200 rounded"
                onClick={() =>
                  setComplianceMax(
                    Math.max(complianceMin + 0.05, complianceMax - 0.05)
                  )
                }
              >
                -
              </button>
              <span className="w-20 text-center">
                {complianceMax.toFixed(2)} ml
              </span>
              <button
                className="px-2 py-1 bg-gray-200 rounded"
                onClick={() =>
                  setComplianceMax(Math.min(2.0, complianceMax + 0.05))
                }
              >
                +
              </button>
            </div>
          </div>

          {/* Range Presets */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Range Presets
            </label>
            <div className="flex gap-2">
              {RANGE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  className={`px-3 py-1 rounded ${
                    start === preset.start && stop === preset.stop
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  }`}
                  onClick={() => {
                    setStart(preset.start);
                    setStop(preset.stop);
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Speed Control */}
          <div>
            <label className="block text-sm font-medium mb-2">Speed</label>
            <div className="flex gap-4">
              <button
                className={`px-4 py-2 rounded ${
                  autoSpeed ? "bg-blue-500 text-white" : "bg-gray-200"
                }`}
                onClick={() => setAutoSpeed(true)}
              >
                Auto
              </button>
              <button
                className={`px-4 py-2 rounded ${
                  !autoSpeed ? "bg-blue-500 text-white" : "bg-gray-200"
                }`}
                onClick={() => setAutoSpeed(false)}
              >
                Fast (200)
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons (hidden on large screens) */}
        <div className="flex gap-4 mb-6 lg:hidden">
          <button
            className={`px-6 py-2 rounded flex items-center gap-2 ${
              isRunning
                ? "bg-red-500 hover:bg-red-600"
                : "bg-green-500 hover:bg-green-600"
            } text-white`}
            onClick={startTest}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              {isRunning ? (
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                  clipRule="evenodd"
                />
              ) : (
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              )}
            </svg>
            {isRunning ? "Stop Test" : "Start Test"}
          </button>
          <button
            className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            onClick={resetTest}
          >
            Clear Results
          </button>
          {completedEars.size > 0 && (
            <button
              className="px-6 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
              onClick={() => {
                setCompletedEars(new Set());
                setLocalReadings([]);
                resetTest();
                toast.info("All test progress cleared. You can start over.");
              }}
            >
              Reset All Progress
            </button>
          )}
        </div>

        {/* Current Measurement (hidden on large screens) */}
        <div className="mb-6 p-4 bg-gray-100 rounded lg:hidden">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">
                Current Pressure
              </label>
              <p className="text-lg font-semibold">{currentPressure} daPa</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">
                Current Compliance
              </label>
              <p className="text-lg font-semibold">
                {currentCompliance?.toFixed(2) ?? "0.00"} ml
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">
                Peak Pressure
              </label>
              <p className="text-lg font-semibold">
                {peakPressure !== null ? `${peakPressure} daPa` : "--"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">
                Peak Compliance (Compensated)
              </label>
              <p className="text-lg font-semibold">
                {(() => {
                  // First check if we have a saved reading for this ear (from localReadings or consultation)
                  const consultationData = (consultation as any)?.data as ConsultationModelData | undefined;
                  const savedReading = localReadings.find(r => 
                    r.ear === (selectedEar === "L" ? Ear.LEFT : Ear.RIGHT)
                  ) || consultationData?.tympanometry?.readings?.find(r => 
                    r.ear === (selectedEar === "L" ? Ear.LEFT : Ear.RIGHT)
                  );
                  
                  // If we have saved data, use that (prefer peakCompensatedWithECV, fallback to staticCompliance)
                  if (savedReading) {
                    const savedValue = savedReading.peakCompensatedWithECV ?? savedReading.staticCompliance;
                    if (savedValue !== undefined && savedValue > 0) {
                      return `${savedValue.toFixed(2)} ml`;
                    }
                  }
                  
                  // Otherwise use live/test values - same logic as save function
                  const peakCompValue = peakCompliance ?? 0;
                  const ecvValue = ecv ?? 0;
                  const displayedValue = peakCompensatedWithECV !== null 
                    ? peakCompensatedWithECV 
                    : (peakCompValue > 0 && ecvValue > 0 ? Math.max(0, peakCompValue - ecvValue) : 0);
                  return displayedValue > 0 ? `${displayedValue.toFixed(2)} ml` : "--";
                })()}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">
                Gradient
              </label>
              <p className="text-lg font-semibold">
                {gradient !== null ? `${gradient.toFixed(2)} ml/daPa` : "--"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">
                ECV
              </label>
              <p className="text-lg font-semibold">
                {ecv !== null ? `${ecv.toFixed(2)} ml` : "--"}
              </p>
            </div>
          </div>
        </div>

        {/* Single Tympanogram Display */}
        <TympanogramGraph
          realTimeData={realTimeData}
          finalData={finalData}
          isTestCompleted={isTestCompleted}
          selectedEar={selectedEar}
          pressureMax={pressureMax}
          pressureMin={pressureMin}
          complianceMax={complianceMax}
          complianceMin={complianceMin}
        />

        

        {/* Test Submission Buttons (hidden on large screens) */}
        {(isTestCompleted || finalData.length > 0) && (
          <div className="mt-6 flex gap-4 lg:hidden">
            <button
              className={`px-6 py-2 rounded flex items-center gap-2 ${
                updateConsultationMutation.isPending
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600"
              } text-white`}
              onClick={saveTympanometryResults}
              disabled={updateConsultationMutation.isPending}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              {updateConsultationMutation.isPending
                ? "Submitting..."
                : completedEars.size === 1
                  ? "Save Results (Last Ear)"
                  : "Save & Continue to Next Ear"}
            </button>
            {completedEars.size >= 1 && (
              <button
                className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
                onClick={() =>
                  router.push(
                    (ROUTES as any).TYM_REPORT(params.consultationId as string)
                  )
                }
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                View Report
              </button>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
