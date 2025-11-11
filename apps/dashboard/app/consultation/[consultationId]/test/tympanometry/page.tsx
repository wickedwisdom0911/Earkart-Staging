"use client";
import { ImpedanceData } from "@/models/device/impedance-data.model";
import { ImpedanceStatus } from "@/models/device/impredance-status.model";
import { useSocket } from "@/providers/socket-provider";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useCallback } from "react";
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
import StickyReportNavigation from "@/components/ui/StickyReportNavigation";

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
  // Cache for readings saved during this session to avoid losing the first ear before refetch
  const [localReadings, setLocalReadings] = useState<TympanometryReadingModelData[]>([]);

  // Add state for all tympanometry values
  const [peakPressure, setPeakPressure] = useState<number | null>(null);
  const [peakCompliance, setPeakCompliance] = useState<number | null>(null);
  const [gradient, setGradient] = useState<number | null>(null);
  const [ecv, setECV] = useState<number | null>(null);
  const [manualTympType, setManualTympType] = useState<TympType | "">("");
  const [completedEars, setCompletedEars] = useState<Set<"L" | "R">>(new Set());

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
    if (!consultation?.data || !isTestCompleted || !finalData.length) {
      console.log("Cannot save results: missing data");
      return;
    }

    // Check if Tymp Type is selected
    if (!manualTympType) {
      toast.error("Please select a Tymp Type before saving results.");
      return;
    }

    const consultationData = consultation.data as ConsultationModelData;

    // Create tympanometry reading data
    const tympanometryReading: TympanometryReadingModelData = {
      tympanometryId: "", // Will be set by backend
      ear: selectedEar === "L" ? Ear.LEFT : Ear.RIGHT,
      peakPressure: peakPressure ?? 0,
      staticCompliance: peakCompliance ?? 0,
      earCanalVolume: ecv ?? 0,
      tympType: manualTympType as TympType,
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
        setSelectedEar(selectedEar === "L" ? "R" : "L");
        // Reset test state for the next ear
        setRealTimeData([]);
        setFinalData([]);
        setIsTestCompleted(false);
        setCurrentPressure(0);
        setCurrentCompliance(0);
        setPeakPressure(null);
        setPeakCompliance(null);
        setGradient(null);
        setECV(null);
        setManualTympType("");
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
    manualTympType,
    router,
    params.consultationId,
    completedEars,
    localReadings,
  ]);

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
        const finalPoints: TympanogramPoint[] =
          data.tympanometryData.Tymp.PressureData.map(
            (pressure: number, index: number) => {
              const compliance =
                data.tympanometryData.Tymp!.Y!.ComplianceData![index];
              return {
                pressure,
                compliance,
                compensatedCompliance: Math.max(0, compliance - ecv),
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
        if (
          data.tympanometryData.Tymp?.Y?.Peak?.CompensatedWithECV !== undefined
        ) {
          setPeakCompliance(
            data.tympanometryData.Tymp.Y.Peak.CompensatedWithECV
          );
        }
        if (data.tympanometryData.Tymp?.Y?.Gradient !== undefined) {
          setGradient(data.tympanometryData.Tymp.Y.Gradient);
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

    // Cleanup function
    return () => {
      socket.off("tympanometry-status");
      socket.off("tympanometry-data");
    };
  }, [
    socket,
    isRunning,
    isTestCompleted,
    selectedEar,
    saveTympanometryResults,
  ]);



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
    setManualTympType("");
  }, []);



  // Since there is no screen share on this page, these are placeholders
  const isScreenSharing = false;
  const isScreenConnecting = false;
  const isShowingReport = false;
  const handleShowReport = () => {
    // Placeholder for if screen sharing is added later
    toast.info("This page does not have a screen sharing feature.");
  };

  const handleDoAnotherTest = () => {
    router.push(ROUTES.CONSULTATION_TEST_SELECTION(params.consultationId as string));
  };

  const handleEndConsultation = () => {
    router.push(`/consultation/${params.consultationId}/end-consultation`);
  };

  return (
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
        <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 w-72 hidden lg:block print:hidden">
          <div className="bg-white shadow-lg rounded-lg p-3 w-64 border">
            {/* Ear Selection */}
            <div className="mb-3">
              <label className="block text-xs font-medium mb-1">Ear</label>
              <div className="flex gap-2">
                <button
                  className={`px-3 py-1 rounded text-xs ${
                    selectedEar === "L"
                      ? "bg-blue-500 text-white"
                      : completedEars.has("L")
                        ? "bg-green-500 text-white"
                        : "bg-gray-200"
                  }`}
                  onClick={() => setSelectedEar("L")}
                >
                  Left
                </button>
                <button
                  className={`px-3 py-1 rounded text-xs ${
                    selectedEar === "R"
                      ? "bg-blue-500 text-white"
                      : completedEars.has("R")
                        ? "bg-green-500 text-white"
                        : "bg-gray-200"
                  }`}
                  onClick={() => setSelectedEar("R")}
                >
                  Right
                </button>
              </div>
            </div>

            {/* Probe Tone */}
            <div className="mb-3">
              <label className="block text-xs font-medium mb-1">Probe tone</label>
              <select
                className="w-full p-2 border rounded text-xs"
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
            <div className="mb-3">
              <label className="block text-xs font-medium mb-1">Pressure range</label>
              <div className="flex items-center gap-2">
                <button className="px-2 py-1 bg-gray-200 rounded text-xs" onClick={() => setPressureMin(Math.max(-400, pressureMin - 5))}>-</button>
                <span className="w-16 text-center text-xs">{pressureMin} daPa</span>
                <button className="px-2 py-1 bg-gray-200 rounded text-xs" onClick={() => setPressureMin(Math.min(pressureMax - 5, pressureMin + 5))}>+</button>
                <span className="mx-1 text-xs">to</span>
                <button className="px-2 py-1 bg-gray-200 rounded text-xs" onClick={() => setPressureMax(Math.max(pressureMin + 5, pressureMax - 5))}>-</button>
                <span className="w-16 text-center text-xs">{pressureMax} daPa</span>
                <button className="px-2 py-1 bg-gray-200 rounded text-xs" onClick={() => setPressureMax(Math.min(400, pressureMax + 5))}>+</button>
              </div>
            </div>

            {/* Compliance Range */}
            <div className="mb-3">
              <label className="block text-xs font-medium mb-1">Compliance range</label>
              <div className="flex items-center gap-2">
                <button className="px-2 py-1 bg-gray-200 rounded text-xs" onClick={() => setComplianceMin(Math.max(0, complianceMin - 0.05))}>-</button>
                <span className="w-16 text-center text-xs">{complianceMin.toFixed(2)} ml</span>
                <button className="px-2 py-1 bg-gray-200 rounded text-xs" onClick={() => setComplianceMin(Math.min(complianceMax - 0.05, complianceMin + 0.05))}>+</button>
                <span className="mx-1 text-xs">to</span>
                <button className="px-2 py-1 bg-gray-200 rounded text-xs" onClick={() => setComplianceMax(Math.max(complianceMin + 0.05, complianceMax - 0.05))}>-</button>
                <span className="w-16 text-center text-xs">{complianceMax.toFixed(2)} ml</span>
                <button className="px-2 py-1 bg-gray-200 rounded text-xs" onClick={() => setComplianceMax(Math.min(2.0, complianceMax + 0.05))}>+</button>
              </div>
            </div>

            {/* Range Presets */}
            <div className="mb-3">
              <label className="block text-xs font-medium mb-1">Range presets</label>
              <div className="flex gap-2 flex-wrap">
                {RANGE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    className={`px-3 py-1 rounded text-xs ${
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
            <div className="mb-3">
              <label className="block text-xs font-medium mb-1">Speed</label>
              <div className="flex gap-2">
                <button
                  className={`px-3 py-1 rounded text-xs ${autoSpeed ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                  onClick={() => setAutoSpeed(true)}
                >
                  Auto
                </button>
                <button
                  className={`px-3 py-1 rounded text-xs ${!autoSpeed ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                  onClick={() => setAutoSpeed(false)}
                >
                  Fast (200)
                </button>
              </div>
            </div>

            {/* Live Measurements */}
            <div className="mb-3">
              <div className="text-xs font-medium mb-1">Live</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-[10px] text-gray-500">Pressure</div>
                  <div className="font-semibold">{currentPressure} daPa</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">Compliance</div>
                  <div className="font-semibold">{currentCompliance?.toFixed(2) ?? "0.00"} ml</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">Peak P</div>
                  <div className="font-semibold">{peakPressure !== null ? `${peakPressure} daPa` : "--"}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">Peak C</div>
                  <div className="font-semibold">{peakCompliance !== null ? `${peakCompliance.toFixed(2)} ml` : "--"}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">Gradient</div>
                  <div className="font-semibold">{gradient !== null ? `${gradient.toFixed(2)} ml/daPa` : "--"}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">ECV</div>
                  <div className="font-semibold">{ecv !== null ? `${ecv.toFixed(2)} ml` : "--"}</div>
                </div>
              </div>
            </div>

            {/* Tymp Type */}
            <div className="mb-3">
              <label className="block text-xs font-medium mb-1">Tymp Type</label>
              <select
                className="w-full p-2 border rounded text-xs"
                value={manualTympType}
                onChange={(e) => setManualTympType(e.target.value as TympType | "")}
              >
                <option value="">Select Type</option>
                <option value={TympType.A}>Type A - Normal</option>
                <option value={TympType.As}>Type As - Shallow</option>
                <option value={TympType.Ad}>Type Ad - Deep</option>
                <option value={TympType.B}>Type B - Flat</option>
                <option value={TympType.C}>Type C - Negative Pressure</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mb-2">
              <button
                className={`px-4 py-2 rounded text-xs flex items-center gap-2 ${
                  isRunning ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
                } text-white`}
                onClick={startTest}
              >
                {isRunning ? "Stop" : "Start"}
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                onClick={resetTest}
              >
                Clear
              </button>
            </div>
            {completedEars.size > 0 && (
              <button
                className="w-full mb-2 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-xs"
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

            {(isTestCompleted || finalData.length > 0) && (
              <button
                className={`w-full px-4 py-2 rounded text-xs ${
                  updateConsultationMutation.isPending ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                } text-white`}
                onClick={saveTympanometryResults}
                disabled={updateConsultationMutation.isPending}
              >
                {updateConsultationMutation.isPending
                  ? "Submitting..."
                  : completedEars.size === 1
                    ? "Save & Next Ear"
                    : completedEars.size === 0
                    ? "Save & Next Ear"
                    : "Save Results"}
              </button>
            )}
            {completedEars.size >= 1 && (
              <button
                className="w-full mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                onClick={() =>
                  router.push(
                    ROUTES.TYM_REPORT(params.consultationId as string)
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
                onClick={() => setSelectedEar("L")}
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
                onClick={() => setSelectedEar("R")}
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
                {peakCompliance !== null
                  ? `${peakCompliance.toFixed(2)} ml`
                  : "--"}
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
            <div>
              <label className="block text-sm font-medium text-gray-600">
                Tympanogram Type
              </label>
              <p className="text-lg font-semibold">
                {peakPressure !== null && peakCompliance !== null
                  ? manualTympType
                  : "--"}
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

        

        {/* Tymp Type Selection (hidden on large screens) */}
        <div className="mt-6 lg:hidden">
          <label className="block text-sm font-medium mb-2">Tymp Type</label>
          <select
            className="w-full p-2 border rounded max-w-xs"
            value={manualTympType}
            onChange={(e) => setManualTympType(e.target.value as TympType | "")}
          >
            <option value="">Select Type</option>
            <option value={TympType.A}>Type A - Normal</option>
            <option value={TympType.As}>Type As - Shallow</option>
            <option value={TympType.Ad}>Type Ad - Deep</option>
            <option value={TympType.B}>Type B - Flat</option>
            <option value={TympType.C}>Type C - Negative Pressure</option>
          </select>
        </div>

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
                  ? "Save & Continue to Next Ear"
                  : "Complete Test & View Report"}
            </button>
            {completedEars.size >= 1 && (
              <button
                className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
                onClick={() =>
                  router.push(
                    ROUTES.TYM_REPORT(params.consultationId as string)
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
  );
}
