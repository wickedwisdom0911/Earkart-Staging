"use client";
import React, { useState, useCallback } from "react";

interface TympanogramPoint {
  pressure: number;
  compliance: number;
  ear: "L" | "R";
}

const PRESSURE_RANGE = Array.from({ length: 401 }, (_, i) => i - 200); // -200 to +200 daPa
const COMPLIANCE_RANGE = Array.from({ length: 21 }, (_, i) => i * 0.1); // 0 to 2.0 ml
const PROBE_TONES = [226, 678, 1000]; // Hz

export default function TympanometryPage() {
  const [selectedEar, setSelectedEar] = useState<"L" | "R">("L");
  const [selectedProbeTone, setSelectedProbeTone] = useState(226);
  const [isRunning, setIsRunning] = useState(false);
  const [tympanogramData, setTympanogramData] = useState<TympanogramPoint[]>(
    []
  );
  const [currentPressure, setCurrentPressure] = useState(0);
  const [currentCompliance, setCurrentCompliance] = useState(0);
  const [peakPressure, setPeakPressure] = useState<number | null>(null);
  const [peakCompliance, setPeakCompliance] = useState<number | null>(null);
  const [gradient, setGradient] = useState<number | null>(null);
  const [earCanalVolume, setEarCanalVolume] = useState<number | null>(null);

  // Start tympanometry test
  const startTest = useCallback(() => {
    setIsRunning(true);
    setTympanogramData([]);
    setPeakPressure(null);
    setPeakCompliance(null);
    setGradient(null);
    setEarCanalVolume(null);

    // Simulate tympanometry measurement
    let pressure = 200; // Start at +200 daPa
    const interval = setInterval(() => {
      if (pressure < -200) {
        clearInterval(interval);
        setIsRunning(false);
        calculateResults();
        return;
      }

      // Simulate compliance measurement (this would be replaced with actual device data)
      const compliance = simulateCompliance(pressure);
      setCurrentPressure(pressure);
      setCurrentCompliance(compliance);
      setTympanogramData((prev) => [
        ...prev,
        { pressure, compliance, ear: selectedEar },
      ]);

      pressure -= 1; // Decrease pressure by 1 daPa
    }, 50); // 50ms between measurements
  }, [selectedEar]);

  // Simulate compliance measurement (replace with actual device data)
  const simulateCompliance = (pressure: number): number => {
    // Normal tympanogram curve (Type A)
    const peakPressure = 0;
    const peakCompliance = 1.0;
    const width = 100;

    return (
      peakCompliance *
      Math.exp(-Math.pow(pressure - peakPressure, 2) / (2 * Math.pow(width, 2)))
    );
  };

  // Calculate tympanogram results
  const calculateResults = () => {
    if (tympanogramData.length === 0) return;

    // Find peak compliance
    const peak = tympanogramData.reduce((max, point) =>
      point.compliance > max.compliance ? point : max
    );
    setPeakPressure(peak.pressure);
    setPeakCompliance(peak.compliance);

    // Calculate gradient (width at 50% of peak)
    const halfPeak = peak.compliance / 2;
    const points = tympanogramData.filter((p) => p.compliance >= halfPeak);
    if (points.length >= 2) {
      const width = Math.abs(
        points[points.length - 1].pressure - points[0].pressure
      );
      setGradient(width);
    }

    // Simulate ear canal volume (this would be replaced with actual device data)
    setEarCanalVolume(0.8 + Math.random() * 0.4); // 0.8-1.2 ml
  };

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
            disabled={isRunning}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clipRule="evenodd"
              />
            </svg>
            {isRunning ? "Running..." : "Start Test"}
          </button>
          <button
            className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            onClick={() => setTympanogramData([])}
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
                  {currentCompliance.toFixed(2)} ml
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {!isRunning && tympanogramData.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Results</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white border rounded">
                <label className="block text-sm font-medium text-gray-600">
                  Peak Pressure
                </label>
                <p className="text-lg font-semibold">{peakPressure} daPa</p>
              </div>
              <div className="p-4 bg-white border rounded">
                <label className="block text-sm font-medium text-gray-600">
                  Peak Compliance
                </label>
                <p className="text-lg font-semibold">
                  {peakCompliance?.toFixed(2)} ml
                </p>
              </div>
              <div className="p-4 bg-white border rounded">
                <label className="block text-sm font-medium text-gray-600">
                  Gradient
                </label>
                <p className="text-lg font-semibold">
                  {gradient?.toFixed(0)} daPa
                </p>
              </div>
              <div className="p-4 bg-white border rounded">
                <label className="block text-sm font-medium text-gray-600">
                  Ear Canal Volume
                </label>
                <p className="text-lg font-semibold">
                  {earCanalVolume?.toFixed(2)} ml
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tympanogram Display */}
        <div className="border rounded p-4">
          <div className="h-[400px] relative">
            {/* Y-axis (Compliance) */}
            <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-sm">
              {COMPLIANCE_RANGE.filter((_, i) => i % 2 === 0).map((value) => (
                <div key={value} className="text-right pr-2">
                  {value.toFixed(1)}
                </div>
              ))}
            </div>

            {/* X-axis (Pressure) */}
            <div className="absolute left-12 right-0 bottom-0 h-8 flex justify-between text-sm">
              {PRESSURE_RANGE.filter((_, i) => i % 100 === 0).map((value) => (
                <div key={value} className="text-center">
                  {value}
                </div>
              ))}
            </div>

            {/* Graph Area */}
            <div className="absolute left-12 right-4 top-0 bottom-8">
              {/* Grid Lines */}
              <div className="absolute inset-0 grid grid-cols-10 grid-rows-10">
                {Array.from({ length: 11 }).map((_, i) => (
                  <React.Fragment key={i}>
                    <div className="border-t border-gray-200" />
                    <div className="border-l border-gray-200" />
                  </React.Fragment>
                ))}
              </div>

              {/* Tympanogram Curve */}
              <svg className="w-full h-full">
                <path
                  d={tympanogramData
                    .map((point, i) => {
                      const x = ((point.pressure + 200) / 400) * 100;
                      const y = 100 - (point.compliance / 2) * 100;
                      return `${i === 0 ? "M" : "L"} ${x}% ${y}%`;
                    })
                    .join(" ")}
                  fill="none"
                  stroke={selectedEar === "L" ? "#3B82F6" : "#EF4444"}
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
