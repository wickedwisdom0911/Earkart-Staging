"use client";

import { useSocket } from "@/providers/socket-provider";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Dot,
} from "recharts";
import { toast } from "sonner";
import { ROUTES } from "@/lib/routes";
import { useUpdateConsultation } from "@/hooks/consultation/use-update-consultation";
import { useGetConsultation } from "@/hooks/consultation/use-get-consultation";
import { Ear, TestStatus, ToneDecayResult } from "@/models/enums";
import { ConsultationModelData } from "@/models/consultation.model";

type TestState = "idle" | "running" | "paused" | "completed";

interface ToneDecayDataPoint {
  time: number;
  intensity: number;
  isDecayPoint?: boolean;
}

interface ToneDecayReadingLocal {
  id: string;
  ear: Ear;
  frequencyHz: number;
  startingDb: number;
  finalDb: number | null;
  decayTimeSec: number | null;
  result: ToneDecayResult;
}

const FREQUENCY_OPTIONS = [250, 500, 1000, 2000, 4000, 8000];

export default function ToneDecayPage() {
  const params = useParams();
  const router = useRouter();
  const consultationId = params.consultationId as string;
  const socket = useSocket();

  const [testState, setTestState] = useState<TestState>("idle");
  const [selectedEar, setSelectedEar] = useState<"L" | "R">("L");
  const [completedEars, setCompletedEars] = useState<Set<"L" | "R">>(new Set());
  const [stimulusType, setStimulusType] = useState<"Pure Tone" | "Warble">("Pure Tone");
  const [frequency, setFrequency] = useState<number>(1000);
  const [testDuration, setTestDuration] = useState<number>(60);
  const [currentLevel, setCurrentLevel] = useState<number>(50);
  // Store intensity levels for each frequency (default: 50 dB for all frequencies)
  const [frequencyIntensityLevels, setFrequencyIntensityLevels] = useState<Record<number, number>>({
    250: 50,
    500: 50,
    1000: 50,
    2000: 50,
    4000: 50,
    8000: 50,
  });
  const [conductionType, setConductionType] = useState<"AC" | "BC">("AC");
  const [patientButtonHeld, setPatientButtonHeld] = useState<boolean>(false);
  const [showPatientResponseFlash, setShowPatientResponseFlash] = useState<boolean>(false);
  const [chartData, setChartData] = useState<ToneDecayDataPoint[]>([]);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [testResults, setTestResults] = useState<ToneDecayReadingLocal[]>([]);
  const [hasSavedResults, setHasSavedResults] = useState(false);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);
  
  // NACK dialog state
  const [showNackDialog, setShowNackDialog] = useState(false);
  const [nackMessage, setNackMessage] = useState("");

  const testStateRef = useRef<TestState>(testState);
  const hasAutoStoppedRef = useRef(false);
  const elapsedTimeRef = useRef(0);
  const hasDecayedRef = useRef(false);
  const decayTimeRef = useRef<number | null>(null);
  const currentLevelRef = useRef(currentLevel);

  const queryClient = useQueryClient();
  const { data: consultationResponse } = useGetConsultation(consultationId);
  const consultation = consultationResponse?.data as ConsultationModelData | undefined;
  const updateConsultationMutation = useUpdateConsultation();

  useEffect(() => {
    testStateRef.current = testState;
  }, [testState]);

  useEffect(() => {
    elapsedTimeRef.current = elapsedTime;
  }, [elapsedTime]);

  useEffect(() => {
    currentLevelRef.current = currentLevel;
  }, [currentLevel]);

  // Load test results - prioritize backend if test is completed, otherwise use localStorage
  useEffect(() => {
    if (!consultationId || hasLoadedFromStorage || !consultation) return;
    
    const isTestCompleted = consultation?.toneDecay?.status === TestStatus.COMPLETED;
    
    // If test is completed, skip localStorage and load from backend (handled in next useEffect)
    if (isTestCompleted) {
      console.log('✅ Tone Decay test is completed - will load from backend API');
      setHasLoadedFromStorage(true);
      return;
    }
    
    // If test is NOT completed, load from localStorage for work in progress
    try {
      const storageKey = `tone-decay-${consultationId}`;
      const storedData = localStorage.getItem(storageKey);
      
      if (storedData) {
        const parsed = JSON.parse(storedData);
        if (parsed.testResults && Array.isArray(parsed.testResults)) {
          setTestResults(parsed.testResults);
          
          // Restore completed ears
          if (parsed.completedEars && Array.isArray(parsed.completedEars)) {
            setCompletedEars(new Set(parsed.completedEars));
          }
          
          console.log('📦 Loaded tone decay results from localStorage (test not completed):', {
            count: parsed.testResults.length
          });
        }
      }
      setHasLoadedFromStorage(true);
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      setHasLoadedFromStorage(true);
    }
  }, [consultationId, consultation, hasLoadedFromStorage]);

  // Populate test results from backend API - prioritize if test is completed
  useEffect(() => {
    if (!consultation || !hasLoadedFromStorage) return;

    const isTestCompleted = consultation?.toneDecay?.status === TestStatus.COMPLETED;
    
    // If test is NOT completed and we already have local data, don't override
    if (!isTestCompleted && testResults.length > 0) {
      return; // Keep localStorage data for work in progress
    }
    
    // If test is completed OR we don't have local data, load from backend
    if (consultation?.toneDecay?.earTests && consultation.toneDecay.earTests.length > 0) {
      const loadedResults: ToneDecayReadingLocal[] = consultation.toneDecay.earTests.map(
        (test, index) => ({
          id: test.id || `loaded-${index}`,
          ear: test.ear,
          frequencyHz: test.frequencyHz,
          startingDb: test.startingDb,
          finalDb: test.finalDb ?? null,
          decayTimeSec: test.decayTimeSec ?? null,
          result: test.result,
        })
      );
      setTestResults(loadedResults);

      const completedEarSet = new Set<"L" | "R">();
      for (const test of consultation.toneDecay.earTests) {
        if (test.ear === Ear.LEFT) completedEarSet.add("L");
        if (test.ear === Ear.RIGHT) completedEarSet.add("R");
      }
      setCompletedEars(completedEarSet);
      setHasSavedResults(true);
      
      console.log('📥 Loaded tone decay results from backend API:', {
        count: loadedResults.length,
        isCompleted: isTestCompleted
      });
      
      // Also save to localStorage for future reference
      try {
        const storageKey = `tone-decay-${consultationId}`;
        const dataToStore = {
          testResults: loadedResults,
          completedEars: Array.from(completedEarSet),
          timestamp: new Date().toISOString(),
          submitted: isTestCompleted
        };
        localStorage.setItem(storageKey, JSON.stringify(dataToStore));
      } catch (error) {
        console.error('Failed to save backend data to localStorage:', error);
      }
    }
  }, [consultation, consultationId, hasLoadedFromStorage, testResults.length]);

  // Save test results to localStorage whenever they change (preserve even after submission)
  useEffect(() => {
    if (!consultationId || !hasLoadedFromStorage) return;
    
    // Don't save if test is completed (backend is source of truth)
    if (consultation?.toneDecay?.status === TestStatus.COMPLETED) {
      return;
    }
    
    // Always save to preserve data for work in progress
    try {
      const storageKey = `tone-decay-${consultationId}`;
      const dataToStore = {
        testResults,
        completedEars: Array.from(completedEars),
        timestamp: new Date().toISOString(),
        submitted: false
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToStore));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, [consultationId, testResults, completedEars, consultation?.toneDecay?.status, hasLoadedFromStorage]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartTest = useCallback(() => {
    if (!socket) {
      toast.error("Socket not connected");
      return;
    }

    if (!frequency || frequency <= 0) {
      toast.error("Please select a valid frequency");
      return;
    }

    const payload = {
      consultationId,
      frequency: Number(frequency),
      level: Number(currentLevel),
      signal: true,
      pulsed: false,
      earSide: selectedEar === "L" ? "LEFT" : "RIGHT",
      signalType: stimulusType === "Pure Tone" ? "Steady" : "Warble",
      conductionType,
    };

    socket.emit("start-tonedecay", payload);

    setTestState("running");
    setElapsedTime(0);
    setChartData([{ time: 0, intensity: currentLevel }]);
    hasAutoStoppedRef.current = false;
    hasDecayedRef.current = false;
    decayTimeRef.current = null;
    elapsedTimeRef.current = 0;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => {
        const newTime = prev + 1;
        if (newTime >= testDuration) {
          return testDuration;
        }
        return newTime;
      });
    }, 1000);

    toast.success("Test started");
  }, [socket, consultationId, frequency, currentLevel, stimulusType, selectedEar, conductionType, testDuration]);

  const handleStopTest = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (socket && frequency && frequency > 0) {
      const stopPayload = {
        consultationId,
        frequency: Number(frequency),
        level: Number(currentLevel),
        signal: false,
        pulsed: false,
        earSide: selectedEar === "L" ? "LEFT" : "RIGHT",
        signalType: stimulusType === "Pure Tone" ? "Steady" : "Warble",
        conductionType,
      };

      socket.emit("start-tonedecay", stopPayload);
      socket.emit("stop-tonedecay", stopPayload);
    }

    setTestState("completed");
    setCompletedEars((prev) => new Set(prev).add(selectedEar));

    const currentElapsedTime = elapsedTimeRef.current;
    const hasDecayed = hasDecayedRef.current;
    const savedDecayTime = decayTimeRef.current;

    let result: ToneDecayResult = ToneDecayResult.NORMAL;
    let decayTime: number | null = null;
    let finalDb: number | null = null;

    if (hasDecayed && savedDecayTime !== null) {
      decayTime = savedDecayTime;
      finalDb = currentLevelRef.current;

      if (decayTime < 60) {
        result = ToneDecayResult.ABNORMAL;
      } else {
        result = ToneDecayResult.NORMAL;
      }
    } else if (!hasDecayed && currentElapsedTime >= testDuration) {
      decayTime = null;
      finalDb = currentLevelRef.current;
      result = ToneDecayResult.NORMAL;
    } else if (!hasDecayed && currentElapsedTime < testDuration) {
      decayTime = null;
      finalDb = null;
      result = ToneDecayResult.CANNOT_DETERMINE;
    } else {
      decayTime = null;
      finalDb = currentLevelRef.current;
      result = ToneDecayResult.NORMAL;
    }

    const reading: ToneDecayReadingLocal = {
      id: Math.random().toString(36).substr(2, 9),
      ear: selectedEar === "L" ? Ear.LEFT : Ear.RIGHT,
      frequencyHz: frequency,
      startingDb: currentLevel,
      finalDb: finalDb,
      decayTimeSec: decayTime,
      result,
    };

    const updatedResults = [...testResults, reading];
    setTestResults(updatedResults);

    toast.success("Test completed - Please save results");
  }, [chartData, currentLevel, frequency, selectedEar, testResults, consultationId, socket, stimulusType, conductionType, elapsedTime, testDuration]);

  const handleIncreaseIntensity = useCallback(
    (amount: number) => {
      const newLevel = Math.min(currentLevel + amount, 120);
      setCurrentLevel(newLevel);

      if (testState === "running") {
        setChartData((prev) => [
          ...prev,
          {
            time: elapsedTime,
            intensity: newLevel,
          },
        ]);

        if (frequency && frequency > 0) {
          const payload = {
            consultationId,
            frequency: Number(frequency),
            level: Number(newLevel),
            signal: true,
            pulsed: false,
            earSide: selectedEar === "L" ? "LEFT" : "RIGHT",
            signalType: stimulusType === "Pure Tone" ? "Steady" : "Warble",
            conductionType,
          };
          socket?.emit("start-tonedecay", payload);
        }
      }
    },
    [currentLevel, testState, elapsedTime, socket, consultationId, frequency, stimulusType, selectedEar, conductionType]
  );

  useEffect(() => {
    if (!socket) return;

    const onPatientResponse = (data: any) => {
      const isResponding = !!data?.patientResponse;
      setPatientButtonHeld(isResponding);

      // Show visual feedback as long as button is pressed
      setShowPatientResponseFlash(isResponding);

      // When patient releases the button (stops responding), record decay point
      if (!isResponding) {
        if (testStateRef.current === "running" && !hasDecayedRef.current) {
          const currentTime = elapsedTimeRef.current;
          const intensity = currentLevelRef.current;

          hasDecayedRef.current = true;
          decayTimeRef.current = currentTime;

          setChartData((prev) => [
            ...prev,
            {
              time: currentTime,
              intensity: intensity,
              isDecayPoint: true,
            },
          ]);
        }
      }
    };

    // Dedicated handler for nack-received (test cannot be performed)
    const handleNackReceived = (data: { message?: string; testId?: string }) => {
      console.warn("⚠️ [TONE-DECAY] [NACK Received] Test not ready or error:", data);
      
      // Stop the test if it was running
      if (testStateRef.current === "running") {
        handleStopTest();
      }
      setTestState("idle");
      
      // Extract message
      const errorMessage = data.message || "Test device not ready or test cannot be performed at this time";
      
      // Show big dialog instead of toast - requires audiologist confirmation
      setNackMessage(errorMessage);
      setShowNackDialog(true);
      
      // Log for debugging
      console.error("❌ [TONE-DECAY] [NACK] Test cannot proceed:", {
        message: errorMessage,
        testId: data.testId,
        selectedEar,
        consultationId: consultationId,
      });
    };

    socket.on("patient-response-tonedecay", onPatientResponse);
    socket.on("nack-received", handleNackReceived);

    return () => {
      socket.off("patient-response-tonedecay", onPatientResponse);
      socket.off("nack-received", handleNackReceived);
    };
  }, [socket, selectedEar, consultationId, handleStopTest]);

  // Visual feedback effect - add/remove CSS classes based on patient response
  useEffect(() => {
    const root = document.documentElement;
    const heading = document.querySelector("h1");

    if (showPatientResponseFlash) {
      root.classList.add("blink-bg");
      if (heading) (heading as HTMLElement).classList.add("float-heading");
    } else {
      root.classList.remove("blink-bg");
      if (heading) (heading as HTMLElement).classList.remove("float-heading");
    }

    // Cleanup on unmount
    return () => {
      root.classList.remove("blink-bg");
      if (heading) (heading as HTMLElement).classList.remove("float-heading");
    };
  }, [showPatientResponseFlash]);

  useEffect(() => {
    if (testState === "running" && elapsedTime > 0) {
      setChartData((prev) => {
        const lastPoint = prev[prev.length - 1];
        if (!lastPoint || lastPoint.time < elapsedTime - 5) {
          return [
            ...prev,
            {
              time: elapsedTime,
              intensity: currentLevel,
            },
          ];
        }
        return prev;
      });
    }

    if (testStateRef.current === "running" && elapsedTime >= testDuration && !hasAutoStoppedRef.current) {
      hasAutoStoppedRef.current = true;
      handleStopTest();
    }
  }, [testState, elapsedTime, currentLevel, testDuration, handleStopTest]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Update current level when frequency changes
  useEffect(() => {
    if (testState === "idle") {
      const levelForFrequency = frequencyIntensityLevels[frequency] || 50;
      setCurrentLevel(levelForFrequency);
    }
  }, [frequency, frequencyIntensityLevels, testState]);

  // Handle intensity level change for current frequency
  const handleIntensityLevelChange = useCallback(
    (newLevel: number) => {
      if (testState !== "idle") {
        toast.error("Can only change intensity level when test is idle");
        return;
      }
      
      const clampedLevel = Math.max(0, Math.min(120, newLevel));
      setFrequencyIntensityLevels((prev) => ({
        ...prev,
        [frequency]: clampedLevel,
      }));
      setCurrentLevel(clampedLevel);
    },
    [frequency, testState]
  );

  const handleEarSwitch = useCallback(
    (ear: "L" | "R") => {
      if (testState === "running" || testState === "paused") {
        toast.error("Please stop the current test before switching ears");
        return;
      }
      setSelectedEar(ear); 
      setChartData([]);
      setElapsedTime(0);
      setTestState("idle");
      // Reset to the intensity level for current frequency
      const levelForFrequency = frequencyIntensityLevels[frequency] || 50;
      setCurrentLevel(levelForFrequency);
      hasAutoStoppedRef.current = false;
    },
    [testState, frequency, frequencyIntensityLevels]
  );

  const saveToneDecayResults = useCallback(async () => {
    if (!consultation) {
      toast.error("Consultation data not available");
      return;
    }

    if (!consultationId) {
      toast.error("Consultation ID is missing");
      return;
    }

    if (testResults.length === 0) {
      toast.error("No test results to save");
      return;
    }

    const existingEarTests = consultation.toneDecay?.earTests || [];
    const mergedTests = new Map<string, any>();

    for (const test of existingEarTests) {
      const key = `${test.ear}-${test.frequencyHz}`;
      mergedTests.set(key, test);
    }

    for (const result of testResults) {
      const key = `${result.ear}-${result.frequencyHz}`;
      mergedTests.set(key, {
        ear: result.ear,
        frequencyHz: result.frequencyHz,
        startingDb: result.startingDb,
        finalDb: result.finalDb ?? null,
        decayTimeSec: result.decayTimeSec ?? null,
        result: result.result,
      });
    }

    const updatedEarTests = Array.from(mergedTests.values());

    const toneDecayTest = {
      status: TestStatus.COMPLETED,
      earTests: updatedEarTests,
    };

    const updatedConsultation = {
      ...consultation,
      id: consultationId,
      toneDecay: toneDecayTest,
      updatedAt: new Date().toISOString(),
    };

    try {
      await updateConsultationMutation.mutateAsync(updatedConsultation);

      await queryClient.invalidateQueries({
        queryKey: ["consultation", consultationId],
      });

      await queryClient.refetchQueries({
        queryKey: ["consultation", consultationId],
      });

      setHasSavedResults(true);

      // Preserve localStorage data after test submission
      try {
        const storageKey = `tone-decay-${consultationId}`;
        const dataToStore = {
          testResults,
          completedEars: Array.from(completedEars),
          timestamp: new Date().toISOString(),
          submitted: true
        };
        localStorage.setItem(storageKey, JSON.stringify(dataToStore));
        console.log('💾 Preserved tone decay data in localStorage after test submission');
      } catch (error) {
        console.error('Failed to save to localStorage:', error);
      }

      toast.success("Results saved successfully! You can now view the report.");
    } catch (error: any) {
      toast.error(error?.message || "Failed to save results. Please try again.");
    }
  }, [consultation, testResults, consultationId, updateConsultationMutation, router, queryClient, completedEars]);

  const resetTest = useCallback(() => {
    if (testState === "running") {
      toast.warning("Please stop the test before resetting");
      return;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setChartData([]);
    setElapsedTime(0);
    setTestState("idle");
    // Reset to the intensity level for current frequency
    const levelForFrequency = frequencyIntensityLevels[frequency] || 50;
    setCurrentLevel(levelForFrequency);
    setPatientButtonHeld(false);
    setShowPatientResponseFlash(false);
    hasAutoStoppedRef.current = false;
    hasDecayedRef.current = false;
    decayTimeRef.current = null;
    elapsedTimeRef.current = 0;

    setCompletedEars((prev) => {
      const newSet = new Set(prev);
      newSet.delete(selectedEar);
      return newSet;
    });

    setTestResults((prev) => {
      return prev.filter(
        (result) =>
          !(
            (result.ear === Ear.LEFT && selectedEar === "L") ||
            (result.ear === Ear.RIGHT && selectedEar === "R")
          )
      );
    });

    toast.success("Test reset - ready to start again");
  }, [testState, selectedEar, frequency, frequencyIntensityLevels]);

  return (
    <>
      <style>{`
        @keyframes screen-blink { from { background-color: rgba(0,255,0,0.15);} to { background-color: transparent; } }
        .blink-bg { animation: screen-blink 0.4s ease-in-out 0s 2 alternate; }
        @keyframes float-y { 0%{ transform: translateY(0);} 50%{ transform: translateY(-6px);} 100%{ transform: translateY(0);} }
        .float-heading { animation: float-y 1s ease-in-out 0s 1; }
      `}</style>

      {showPatientResponseFlash && (
        <>
          <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center">
            <div className="absolute inset-0 bg-green-200/25 animate-pulse" />
            <div className="relative pointer-events-none bg-white/90 border border-green-300 rounded-2xl shadow-xl px-8 py-6 text-center">
              <div className="mx-auto mb-2 relative flex h-5 w-5 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-600"></span>
              </div>
              <div className="text-green-700 font-semibold text-lg tracking-wide">Patient Responded</div>
            </div>
          </div>
        </>
      )}

      <div className="p-6 lg:pr-80">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">Tone Decay Test</h1>

          <div className="mb-4 flex gap-2">
            <button
              onClick={() => handleEarSwitch("L")}
              disabled={completedEars.has("L") || (testState !== "idle" && testState !== "completed")}
              className={`px-4 py-2 rounded text-sm font-medium ${
                selectedEar === "L"
                  ? "bg-blue-500 text-white"
                  : completedEars.has("L")
                  ? "bg-green-500 text-white cursor-not-allowed opacity-60"
                  : "bg-gray-200"
              } ${
                testState !== "idle" && testState !== "completed" && selectedEar !== "L"
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              Left Ear {completedEars.has("L") && "✓"}
            </button>
            <button
              onClick={() => handleEarSwitch("R")}
              disabled={completedEars.has("R") || (testState !== "idle" && testState !== "completed")}
              className={`px-4 py-2 rounded text-sm font-medium ${
                selectedEar === "R"
                  ? "bg-red-500 text-white"
                  : completedEars.has("R")
                  ? "bg-green-500 text-white cursor-not-allowed opacity-60"
                  : "bg-gray-200"
              } ${
                testState !== "idle" && testState !== "completed" && selectedEar !== "R"
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              Right Ear {completedEars.has("R") && "✓"}
            </button>
          </div>

          <div className="bg-white border rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Stimulus Intensity Over Time</h2>
              <div className="text-sm text-gray-600">
                Elapsed: {formatTime(elapsedTime)} / {formatTime(testDuration)}
              </div>
            </div>

            <div className="h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="time"
                    stroke="#6b7280"
                    label={{ value: "Time (seconds)", position: "bottom", offset: -5 }}
                    domain={[0, testDuration]}
                    type="number"
                    allowDecimals={false}
                    tickCount={testDuration <= 60 ? Math.min(testDuration / 5 + 1, 13) : 13}
                  />
                  <YAxis
                    stroke="#6b7280"
                    label={{ value: "Stimulus Intensity (dB HL)", angle: -90, position: "insideLeft" }}
                    domain={[0, 120]}
                    ticks={[0, 20, 40, 60, 80, 100, 120]}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                    formatter={(value: any) => [`${value} dB HL`, "Intensity"]}
                    labelFormatter={(label) => `Time: ${label}s`}
                  />
                  <Line
                    type="stepAfter"
                    dataKey="intensity"
                    stroke={selectedEar === "L" ? "#3b82f6" : "#ef4444"}
                    strokeWidth={2}
                    dot={(props) => {
                      const { cx, cy, payload } = props;
                      if (payload.isDecayPoint) {
                        return (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={6}
                            fill={selectedEar === "L" ? "#3b82f6" : "#ef4444"}
                            stroke="#fff"
                            strokeWidth={2}
                          />
                        );
                      }
                      return null;
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-10 w-64 hidden lg:block print:hidden">
        <div className="bg-white shadow-lg rounded-lg p-3 border">
          <div className="text-sm font-semibold mb-3 text-center">Test Controls</div>

          <div className="mb-3">
            <label className="block text-[10px] font-medium mb-1">Stimulus Type</label>
            <div className="flex gap-1">
              <button
                className={`flex-1 px-2 py-1 rounded text-[10px] ${
                  stimulusType === "Pure Tone" ? "bg-blue-500 text-white" : "bg-gray-200"
                }`}
                onClick={() => setStimulusType("Pure Tone")}
                disabled={testState !== "idle"}
              >
                Pure Tone
              </button>
              <button
                className={`flex-1 px-2 py-1 rounded text-[10px] ${
                  stimulusType === "Warble" ? "bg-blue-500 text-white" : "bg-gray-200"
                }`}
                onClick={() => setStimulusType("Warble")}
                disabled={testState !== "idle"}
              >
                Warble
              </button>
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-[10px] font-medium mb-1">Frequency</label>
            <div className="grid grid-cols-3 gap-1">
              {FREQUENCY_OPTIONS.map((freq) => (
                <button
                  key={freq}
                  className={`px-2 py-1 rounded text-[10px] ${
                    frequency === freq ? "bg-blue-500 text-white" : "bg-gray-200"
                  }`}
                  onClick={() => setFrequency(freq)}
                  disabled={testState !== "idle"}
                >
                  {freq} Hz
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-[10px] font-medium mb-1">Conduction</label>
            <div className="flex gap-1">
              <button
                className={`flex-1 px-2 py-1 rounded text-[10px] ${
                  conductionType === "AC" ? "bg-blue-500 text-white" : "bg-gray-200"
                }`}
                onClick={() => setConductionType("AC")}
                disabled={testState !== "idle"}
              >
                AC
              </button>
              <button
                className={`flex-1 px-2 py-1 rounded text-[10px] ${
                  conductionType === "BC" ? "bg-blue-500 text-white" : "bg-gray-200"
                }`}
                onClick={() => setConductionType("BC")}
                disabled={testState !== "idle"}
              >
                BC
              </button>
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-[10px] font-medium mb-1">Test Duration</label>
            <div className="flex items-center gap-1">
              <button
                className="px-1 py-0.5 bg-gray-200 rounded text-[10px]"
                onClick={() => setTestDuration(Math.max(30, testDuration - 10))}
                disabled={testState !== "idle"}
              >
                -
              </button>
              <span className="flex-1 text-center text-[10px]">{testDuration}s</span>
              <button
                className="px-1 py-0.5 bg-gray-200 rounded text-[10px]"
                onClick={() => setTestDuration(Math.min(120, testDuration + 10))}
                disabled={testState !== "idle"}
              >
                +
              </button>
            </div>
          </div>

          <div className="mb-3 border-t pt-3">
            <label className="block text-[10px] font-medium mb-2">Intensity Control</label>
            
            {/* Starting Intensity Level (only when idle) */}
            {testState === "idle" && (
              <div className="mb-2 space-y-1">
                <label className="block text-[9px] text-gray-600 mb-1">
                  Starting Level for {frequency} Hz
                </label>
                <div className="flex items-center gap-1">
                  <button
                    className="px-1.5 py-1 bg-gray-200 rounded text-[9px] hover:bg-gray-300"
                    onClick={() => handleIntensityLevelChange(currentLevel - 5)}
                    disabled={currentLevel <= 0}
                  >
                    -5
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    step="5"
                    value={currentLevel}
                    onChange={(e) => handleIntensityLevelChange(Number(e.target.value))}
                    className="flex-1 px-2 py-1 text-center text-[10px] border rounded"
                  />
                  <button
                    className="px-1.5 py-1 bg-gray-200 rounded text-[9px] hover:bg-gray-300"
                    onClick={() => handleIntensityLevelChange(currentLevel + 5)}
                    disabled={currentLevel >= 120}
                  >
                    +5
                  </button>
                </div>
                <div className="text-[8px] text-center text-gray-500 mt-1">
                  dB HL
                </div>
              </div>
            )}

            {/* Increase Intensity During Test (only when running) */}
            {testState === "running" && (
              <div className="space-y-1">
                <button
                  className="w-full px-2 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 text-xs font-medium"
                  onClick={() => handleIncreaseIntensity(5)}
                  disabled={currentLevel >= 120}
                >
                  +5 dB HL
                </button>
                <button
                  className="w-full px-2 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-xs font-medium"
                  onClick={() => handleIncreaseIntensity(10)}
                  disabled={currentLevel >= 120}
                >
                  +10 dB HL
                </button>
                <div className="text-[9px] text-center text-gray-500 mt-1">
                  Current: {currentLevel} dB HL
                </div>
                <div className="text-[9px] text-center text-gray-500">
                  Intensity can only be increased
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1 border-t pt-3">
            <div className="flex gap-1">
              <button
                className={`flex-1 px-2 py-1.5 rounded text-[10px] font-medium ${
                  testState === "running"
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-green-500 hover:bg-green-600"
                } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                onClick={testState === "running" ? handleStopTest : handleStartTest}
                disabled={completedEars.has(selectedEar) || (testState !== "idle" && testState !== "running")}
              >
                {testState === "running" ? "Stop" : testState === "completed" ? "Completed" : "Start"}
              </button>
              <button
                className="flex-1 px-2 py-1.5 bg-gray-500 text-white rounded hover:bg-gray-600 text-[10px] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={resetTest}
                disabled={testState === "running"}
              >
                Reset
              </button>
            </div>

            {testState === "completed" && testResults.length > 0 && !hasSavedResults && !consultation?.toneDecay && (
              <button
                className={`w-full px-2 py-1.5 rounded text-[10px] font-medium ${
                  updateConsultationMutation.isPending ? "bg-gray-400 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"
                } text-white`}
                onClick={saveToneDecayResults}
                disabled={updateConsultationMutation.isPending}
              >
                {updateConsultationMutation.isPending
                  ? "Saving..."
                  : completedEars.size === 1
                  ? "Save Results (Last Ear)"
                  : "Save & Next Ear"}
              </button>
            )}

            {testState === "completed" && testResults.length > 0 && (hasSavedResults || consultation?.toneDecay) && (
              <button
                className={`w-full px-2 py-1.5 rounded text-[10px] font-medium ${
                  updateConsultationMutation.isPending ? "bg-gray-400 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"
                } text-white`}
                onClick={saveToneDecayResults}
                disabled={updateConsultationMutation.isPending}
              >
                {updateConsultationMutation.isPending ? "Saving..." : "Update Results"}
              </button>
            )}

            {(hasSavedResults || consultation?.toneDecay) && (
              <button
                className="w-full px-2 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 text-[10px] font-medium"
                onClick={() => {
                  router.push(ROUTES.TONE_DECAY_REPORT(consultationId));
                }}
              >
                View Report
              </button>
            )}
          </div>
        </div>
      </div>

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
              
              {/* Close button */}
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    setShowNackDialog(false);
                    setNackMessage("");
                  }}
                  className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-lg transition-colors"
                >
                  Understood
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
