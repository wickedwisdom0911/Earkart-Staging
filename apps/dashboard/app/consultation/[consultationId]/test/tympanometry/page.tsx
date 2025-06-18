"use client";
import { ImpedanceData } from "@/models/device/impedance-data.model";
import { ImpedanceStatus } from "@/models/device/impredance-status.model";
import { useSocket } from "@/providers/socket-provider";
import { useParams } from "next/navigation";
import React, { useState, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TympanogramPoint {
  pressure: number;
  compliance: number;
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
  currentPressure: number;
  currentCompliance: number;
}

const TympanogramGraph: React.FC<TympanogramGraphProps> = ({
  realTimeData,
  finalData,
  isTestCompleted,
  selectedEar,
  currentPressure,
  currentCompliance,
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
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="pressure"
              domain={[-400, 200]}
              tickCount={7}
              tickFormatter={(value: number) => `${value}`}
            />
            <YAxis
              domain={[0, 2]}
              tickCount={5}
              tickFormatter={(value: number) => value.toFixed(1)}
            />
            <Tooltip
              formatter={(value: number) => [
                `${value.toFixed(2)} ml`,
                "Compliance",
              ]}
              labelFormatter={(label: number) => `Pressure: ${label} daPa`}
            />
            <Line
              type="monotone"
              dataKey="compliance"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: color }}
            />
            {isTestCompleted && (
              <Line
                type="monotone"
                data={[
                  { pressure: currentPressure, compliance: currentCompliance },
                ]}
                dataKey="compliance"
                stroke={color}
                strokeWidth={0}
                dot={{ r: 6, fill: color, stroke: "white", strokeWidth: 2 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default function TympanometryPage() {
  const socket = useSocket();
  const params = useParams();
  const [selectedEar, setSelectedEar] = useState<"L" | "R">("L");
  const [selectedProbeTone, setSelectedProbeTone] = useState(226);
  const [isRunning, setIsRunning] = useState(false);
  const [currentPressure, setCurrentPressure] = useState(0);
  const [currentCompliance, setCurrentCompliance] = useState(0);
  const [realTimeData, setRealTimeData] = useState<TympanogramPoint[]>([]);
  const [finalData, setFinalData] = useState<TympanogramPoint[]>([]);
  const [isTestCompleted, setIsTestCompleted] = useState(false);

  // New state variables for controls
  const [pressureMin, setPressureMin] = useState(-150);
  const [pressureMax, setPressureMax] = useState(50);
  const [complianceMin, setComplianceMin] = useState(0.3);
  const [complianceMax, setComplianceMax] = useState(1.7);
  const [start, setStart] = useState(100);
  const [stop, setStop] = useState(-200);
  const [autoSpeed, setAutoSpeed] = useState(true);
  const speed = 200;

  // Update real-time data when receiving impedance status
  React.useEffect(() => {
    if (!socket) return;

    const handleTympanometryStatus = (data: ImpedanceStatus) => {
      console.log("Received tympanometry status:", data);
      if (isRunning && !isTestCompleted) {
        // Update current values
        setCurrentPressure(data.Pressure || 0);
        setCurrentCompliance(data.Compliance || 0);

        // Add new point to real-time data
        const newPoint: TympanogramPoint = {
          pressure: data.Pressure || 0,
          compliance: data.Compliance || 0,
          ear: selectedEar,
        };
        console.log("Adding new point:", newPoint);
        setRealTimeData((prev) => [...prev, newPoint]);
      }
    };

    const handleTympanometryData = (data: ImpedanceData) => {
      console.log("Received tympanometry data:", data);
      if (data.Tymp?.PressureData && data.Tymp?.Y?.ComplianceData) {
        const finalPoints: TympanogramPoint[] = data.Tymp.PressureData.map(
          (pressure: number, index: number) => {
            const compliance = data.Tymp!.Y!.ComplianceData![index];
            return {
              pressure,
              compliance,
              ear: selectedEar,
            };
          }
        );
        console.log("Setting final points:", finalPoints);
        setFinalData(finalPoints);
        setIsTestCompleted(true);
        setIsRunning(false);
      }
    };

    socket.on("tympanometry-status", handleTympanometryStatus);
    socket.on("tympanometry-data", handleTympanometryData);

    return () => {
      socket.off("tympanometry-status", handleTympanometryStatus);
      socket.off("tympanometry-data", handleTympanometryData);
    };
  }, [socket, isRunning, isTestCompleted, selectedEar]);

  // Start/Stop tympanometry test
  const startTest = useCallback(() => {
    if (!socket) return;

    if (!isRunning) {
      // Start the test
      setIsRunning(true);
      setRealTimeData([]);
      setFinalData([]);
      setIsTestCompleted(false);
      setCurrentPressure(0);
      setCurrentCompliance(0);

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
      setIsRunning(false);
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
  }, []);

  // Debug current state
  console.log("Current state:", {
    isRunning,
    isTestCompleted,
    realTimeDataLength: realTimeData.length,
    finalDataLength: finalData.length,
    currentPressure,
    currentCompliance,
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Tympanometry</h1>

        {/* Test Controls */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Ear</label>
            <div className="flex gap-4">
              <button
                className={`px-4 py-2 rounded ${selectedEar === "L" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                onClick={() => setSelectedEar("L")}
              >
                Left
              </button>
              <button
                className={`px-4 py-2 rounded ${selectedEar === "R" ? "bg-red-500 text-white" : "bg-gray-200"}`}
                onClick={() => setSelectedEar("R")}
              >
                Right
              </button>
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

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
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
        </div>

        {/* Current Measurement */}
        {isRunning && (
          <div className="mb-6 p-4 bg-gray-100 rounded">
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
            </div>
          </div>
        )}

        {/* Results */}
        {!isRunning && finalData.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Results</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white border rounded">
                <label className="block text-sm font-medium text-gray-600">
                  Peak Pressure
                </label>
                <p className="text-lg font-semibold">
                  {finalData[finalData.length - 1].pressure} daPa
                </p>
              </div>
              <div className="p-4 bg-white border rounded">
                <label className="block text-sm font-medium text-gray-600">
                  Peak Compliance
                </label>
                <p className="text-lg font-semibold">
                  {finalData[finalData.length - 1].compliance.toFixed(2)} ml
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tympanogram Display */}
        <TympanogramGraph
          realTimeData={realTimeData}
          finalData={finalData}
          isTestCompleted={isTestCompleted}
          selectedEar={selectedEar}
          currentPressure={currentPressure}
          currentCompliance={currentCompliance}
        />
      </div>
    </div>
  );
}
