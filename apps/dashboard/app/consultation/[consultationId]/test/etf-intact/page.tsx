"use client";

import { useSocket } from "@/providers/socket-provider";
import { useParams } from "next/navigation";
import {
  useCallback,
  useEffect,
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
};

const CURVE_LABELS = ["Curve 1", "Curve 2", "Curve 3"];
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
};

export default function EtfIntactPage() {
  const params = useParams();
  const consultationId = params.consultationId as string;
  const socket = useSocket();

  const [curves, setCurves] = useState<EtfCurve[]>(createInitialCurves);
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [activeCurve, setActiveCurve] = useState(1);
  const [currentPressure, setCurrentPressure] = useState(0);
  const [currentCompliance, setCurrentCompliance] = useState(0);
  const [autoSpeed, setAutoSpeed] = useState(DEFAULT_SETTINGS.autoSpeed);
  const [sweepSpeed, setSweepSpeed] = useState(DEFAULT_SETTINGS.speed);
  const [startPressure, setStartPressure] = useState(DEFAULT_SETTINGS.startPressure);
  const [stopPressure, setStopPressure] = useState(DEFAULT_SETTINGS.stopPressure);
  const [isRunning, setIsRunning] = useState(false);
  const [chartPressureMax, setChartPressureMax] = useState(200);
  const [chartPressureMin, setChartPressureMin] = useState(-400);
  const [chartComplianceMin, setChartComplianceMin] = useState(0);
  const [chartComplianceMax, setChartComplianceMax] = useState(3);
  const [earCanalVolume, setEarCanalVolume] = useState<number | null>(null);
  const [completedCurves, setCompletedCurves] = useState<Set<number>>(new Set());
  const [overlayData, setOverlayData] = useState<CurvePoint[]>([]);

  const activeCurveRef = useRef(activeCurve);
  const sessionStateRef = useRef<SessionState>(sessionState);

  useEffect(() => {
    activeCurveRef.current = activeCurve;
  }, [activeCurve]);

  useEffect(() => {
    sessionStateRef.current = sessionState;
  }, [sessionState]);

  const appendPoint = useCallback((curveId: number, point: { pressure: number; compliance: number }) => {
    setCurves((prev) =>
      prev.map((curve) =>
        curve.id === curveId
          ? {
              ...curve,
              samples: [...curve.samples, { ...point, timestamp: Date.now() }],
            }
          : curve
      )
    );
  }, []);

  const updateCurveData = useCallback((curveId: number, data: ImpedanceData) => {
    const pressureSeries = data.Tymp?.PressureData ?? [];
    const complianceSeries = data.Tymp?.Y?.ComplianceData ?? [];
    const ecv = data.Tymp?.ECV ?? 0;

    if (Number.isFinite(ecv)) {
      setEarCanalVolume(ecv);
    }

    setCurves((prev) =>
      prev.map((curve) =>
        curve.id === curveId
          ? {
              ...curve,
              samples: pressureSeries.map((pressure, idx) => ({
                pressure,
                [`curve${curveId}`]: Math.max(0, (complianceSeries[idx] ?? 0) - ecv),
                timestamp: Date.now() + idx,
              })),
              status: "completed",
              peakPressure: data.Tymp?.Y?.Peak?.Pressure ?? curve.peakPressure,
              peakCompliance: data.Tymp?.Y?.Peak?.CompensatedWithECV ?? curve.peakCompliance,
              ecv: ecv ?? curve.ecv,
              gradient: data.Tymp?.Y?.Gradient ?? curve.gradient,
            }
          : curve
      )
    );

    setCompletedCurves((prev) => new Set(prev).add(curveId));

    // Build overlay data
    setOverlayData((prev) => {
      const combined = [...prev];
      const newData = pressureSeries.map((pressure, idx) => ({
        pressure,
        [`curve${curveId}`]: Math.max(0, (complianceSeries[idx] ?? 0) - ecv),
      }));

      newData.forEach((newPoint) => {
        const existing = combined.find((p) => p.pressure === newPoint.pressure);
        if (existing) {
          Object.assign(existing, newPoint);
        } else {
          combined.push(newPoint as CurvePoint);
        }
      });

      return combined.sort((a, b) => b.pressure - a.pressure);
    });
  }, []);

  const handleStart = useCallback(() => {
    if (!socket) {
      toast.error("Device connection unavailable.");
      return;
    }

    setIsRunning(true);
    setSessionState("running");
    setCurves(createInitialCurves());
    setActiveCurve(1);
    setCurrentPressure(0);
    setCurrentCompliance(0);
    setCompletedCurves(new Set());
    setOverlayData([]);

    socket.emit("start-etf-intact", {
      consultationId,
      settings: {
        startPressure,
        stopPressure,
        autoSpeed,
        speed: sweepSpeed,
      },
    });

    toast.success("ETF Intact test started");
  }, [socket, consultationId, startPressure, stopPressure, autoSpeed, sweepSpeed]);

  const handleStop = useCallback(() => {
    if (!socket) {
      toast.error("Device connection unavailable.");
      return;
    }

    setIsRunning(false);
    setSessionState("idle");
    socket.emit("stop-etf-intact", { consultationId });
    toast.info("ETF Intact test stopped");
  }, [socket, consultationId]);

  const resetTest = useCallback(() => {
    setCurves(createInitialCurves());
    setActiveCurve(1);
    setCurrentPressure(0);
    setCurrentCompliance(0);
    setSessionState("idle");
    setIsRunning(false);
    setCompletedCurves(new Set());
    setEarCanalVolume(null);
    setOverlayData([]);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleStatus = (payload: { status: ImpedanceStatus; curveIndex?: number }) => {
      const { status, curveIndex } = payload;
      const targetCurve = curveIndex ?? activeCurveRef.current;

      const pressure = status?.Pressure ?? 0;
      const compliance = status?.Compliance ?? 0;
      const ecv = status?.Tymp?.ECV ?? earCanalVolume ?? 0;

      if (Number.isFinite(ecv)) {
        setEarCanalVolume(ecv);
      }

      setCurrentPressure(pressure);
      setCurrentCompliance(compliance);

      if (sessionStateRef.current === "running") {
        appendPoint(targetCurve, {
          pressure,
          compliance: Math.max(0, compliance - ecv),
        });
      }
    };

    const handleCurveData = (payload: { curveIndex: number; data: ImpedanceData }) => {
      const { curveIndex, data } = payload;
      updateCurveData(curveIndex, data);

      if (curveIndex < 3) {
        setActiveCurve(curveIndex + 1);
        setSessionState("waiting");
      } else {
        setSessionState("completed");
        setIsRunning(false);
      }
    };

    const handleError = (payload: { message?: string }) => {
      toast.error(payload?.message || "ETF test failed");
      setIsRunning(false);
      setSessionState("idle");
    };

    socket.on("etf-status", handleStatus);
    socket.on("etf-data", handleCurveData);
    socket.on("etf-error", handleError);

    return () => {
      socket.off("etf-status", handleStatus);
      socket.off("etf-data", handleCurveData);
      socket.off("etf-error", handleError);
    };
  }, [socket, appendPoint, updateCurveData]);

  return (
    <>
      <div className="p-6 lg:pr-80">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">ETF Intact Test</h1>

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
                  <p className="text-blue-800">Ready to start ETF Intact testing. Begin the test when ready.</p>
                )}
                {completedCurves.size > 0 && completedCurves.size < 3 && (
                  <p className="text-blue-800">Recording curves: {completedCurves.size} of 3 completed.</p>
                )}
                {completedCurves.size === 3 && (
                  <p className="text-green-800 font-medium">All three curves completed!</p>
                )}
              </div>
            </div>
          </div>

          {/* Single Graph with All Three Curves Overlaid */}
          <div className="border rounded p-4">
            <div className="h-[400px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={overlayData}
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
                      isAnimationActive={completedCurves.has(curveNum)}
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
          <div className="flex gap-1">
            <button
              className={`flex-1 px-2 py-1 rounded text-[10px] ${
                isRunning ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
              } text-white`}
              onClick={isRunning ? handleStop : handleStart}
            >
              {isRunning ? "Stop" : "Start"}
            </button>
            <button
              className="flex-1 px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-[10px]"
              onClick={resetTest}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </>
  );
}