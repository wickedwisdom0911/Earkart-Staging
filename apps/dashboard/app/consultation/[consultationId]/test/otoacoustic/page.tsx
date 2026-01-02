"use client";
import { useSocket } from "@/providers/socket-provider";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useCallback } from "react";
import { useUpdateConsultation } from "@/hooks/consultation/use-update-consultation";
import { useGetConsultation } from "@/hooks/consultation/use-get-consultation";
import { ConsultationModelData } from "@/models/consultation.model";
import { TestStatus, Ear } from "@/models/enums";
import { toast } from "sonner";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";

// Frequency response data interface
interface FrequencyResponseData {
  frequency: number;
  responseDb: number;
  snr: number;
  noiseLevel: number;
  passed: boolean;
  isTesting: boolean; // Currently being tested
}

// DPOAE Graph Component
interface DpoaeGraphProps {
  data: FrequencyResponseData[];
  frequencies: { Frequency: number; SNR: number }[];
  selectedEar: "L" | "R";
}

function DpoaeGraph({ data, frequencies, selectedEar }: DpoaeGraphProps) {
  // Build chart data from frequencies list, merging with actual response data
  const chartData = frequencies.map((freqConfig) => {
    const response = data.find((r) => r.frequency === freqConfig.Frequency);
    return {
      frequency: freqConfig.Frequency,
      responseDb: response?.responseDb ?? null,
      snr: response?.snr ?? null,
      noiseLevel: response?.noiseLevel ?? null,
      passed: response?.passed ?? false,
      isTesting: response?.isTesting ?? false,
      threshold: freqConfig.SNR, // Required SNR threshold
      frequencyLabel: freqConfig.Frequency >= 1000 
        ? `${freqConfig.Frequency / 1000}k` 
        : `${freqConfig.Frequency}`,
    };
  });

  const color = selectedEar === "L" ? "#3B82F6" : "#EF4444";
  const passColor = "#10B981"; // Green
  const failColor = "#EF4444"; // Red
  const testingColor = "#F59E0B"; // Amber

  return (
    <div className="border rounded p-4 bg-white">
      <div className="h-[400px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 20, bottom: 40, left: 50 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="frequencyLabel"
              label={{ value: "Frequency (Hz)", position: "insideBottom", offset: -5 }}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              domain={[-20, 20]}
              label={{ value: "Response Level (dB SPL)", angle: -90, position: "insideLeft" }}
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              formatter={(value: number, name: string, props: any) => {
                if (name === "responseDb") {
                  return [
                    `${value !== null ? value.toFixed(1) : "--"} dB SPL`,
                    "Response Level",
                  ];
                }
                if (name === "snr") {
                  return [
                    `${value !== null ? value.toFixed(1) : "--"} dB`,
                    "SNR",
                  ];
                }
                if (name === "noiseLevel") {
                  return [
                    `${value !== null ? value.toFixed(1) : "--"} dB SPL`,
                    "Noise Level",
                  ];
                }
                return [value, name];
              }}
              labelFormatter={(label) => `Frequency: ${label} Hz`}
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
            {/* SNR Threshold Reference Line */}
            <ReferenceLine
              y={0}
              stroke="#666"
              strokeDasharray="2 2"
              label={{ value: "0 dB", position: "right" }}
            />
            {/* Bars for Response Level */}
            <Bar dataKey="responseDb" name="responseDb" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => {
                let barColor = "#D1D5DB"; // Gray for no data
                
                if (entry.isTesting) {
                  barColor = testingColor; // Amber for testing
                } else if (entry.responseDb !== null) {
                  // Check if passed based on SNR threshold
                  if (entry.snr !== null && entry.snr >= entry.threshold) {
                    barColor = passColor; // Green for pass
                  } else if (entry.snr !== null && entry.snr < entry.threshold) {
                    barColor = failColor; // Red for fail
                  } else {
                    barColor = color; // Default color if no SNR but has response
                  }
                }
                
                return <Cell key={`cell-${index}`} fill={barColor} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 justify-center text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500"></div>
          <span>Pass (SNR ≥ threshold)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500"></div>
          <span>Fail (SNR &lt; threshold)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-500"></div>
          <span>Testing</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-300"></div>
          <span>No Data</span>
        </div>
      </div>
    </div>
  );
}

export default function OtoacousticPage() {
  const socket = useSocket();
  const router = useRouter();
  const params = useParams();
  const updateConsultationMutation = useUpdateConsultation();
  const { data: consultation } = useGetConsultation(
    params.consultationId as string
  );

  const [selectedEar, setSelectedEar] = useState<"L" | "R">("L");
  const [isRunning, setIsRunning] = useState(false);
  const [isTestCompleted, setIsTestCompleted] = useState(false);
  const [completedEars, setCompletedEars] = useState<Set<"L" | "R">>(new Set());

  // OAE test parameters - matching backend API documentation
  const [testType, setTestType] = useState<"DPOAE" | "TEOAE">("DPOAE");
  const [realTimeStatusUpdateDuringExecution, setRealTimeStatusUpdateDuringExecution] = useState(false); // Default false per docs
  const [timeoutTime, setTimeoutTime] = useState(16); // seconds (will be converted to ms: 16000ms default)
  const [timeoutAuto, setTimeoutAuto] = useState(false); // Default false per docs
  const [stimulusLevelL2, setStimulusLevelL2] = useState(55); // dB SPL (default per docs)
  const [stimulusLevelL1, setStimulusLevelL1] = useState(65); // dB SPL (default L2+10 per docs)
  const [stimulusLevelAuto, setStimulusLevelAuto] = useState(false); // Default false per docs
  const [artefactLevel, setArtefactLevel] = useState(40); // dB SPL (default per docs, range 0-40)
  const [retest, setRetest] = useState(false); // Default false per docs
  const [frequencies, setFrequencies] = useState<{ Frequency: number; SNR: number }[]>([
    { Frequency: 1500, SNR: 3 }, // Available: 1500, 2000, 2500, 3000, 3300, 4000, 4500, 5000, 5600, 6000, 6500, 7000, 8000, 10000, 12000
    { Frequency: 2000, SNR: 6 },
    { Frequency: 3000, SNR: 6 },
    { Frequency: 4000, SNR: 6 },
  ]);
  const [numberPass, setNumberPass] = useState(3); // Default 2, suggested at least 3
  const [skipEarVolumeCheck, setSkipEarVolumeCheck] = useState(true); // Default false
  const [stopOnPass, setStopOnPass] = useState(true); // Default true per docs
  const [invertedFrequencyOrder, setInvertedFrequencyOrder] = useState(true); // Default true per docs
  const [minimumSignalThreshold, setMinimumSignalThreshold] = useState(-10); // dB SPL (default -10, range -15 to -5)

  // Live measurements
  const [snr, setSnr] = useState<number | null>(null); // Signal-to-Noise Ratio
  const [responseLevel, setResponseLevel] = useState<number | null>(null); // dB SPL
  const [noiseLevel, setNoiseLevel] = useState<number | null>(null); // dB SPL
  const [currentFrequency, setCurrentFrequency] = useState<number | null>(null);

  // Frequency response data for real-time plotting
  const [frequencyResponses, setFrequencyResponses] = useState<FrequencyResponseData[]>([]);

  // Test results storage
  const [testResults, setTestResults] = useState<{
    left?: any;
    right?: any;
  }>({});

  // Standard frequency presets
  const FREQUENCY_PRESETS = [
    { label: "Standard", frequencies: [1000, 1500, 2000, 3000, 4000, 6000, 8000] },
    { label: "Extended", frequencies: [500, 750, 1000, 1500, 2000, 3000, 4000, 6000, 8000] },
    { label: "High Freq", frequencies: [2000, 3000, 4000, 6000, 8000] },
  ];

  // Function to save OAE results to consultation
  const saveOaeResults = useCallback(async () => {
    const consultationData = (consultation as any)?.data as ConsultationModelData | undefined;
    if (!consultationData) {
      console.log("Cannot save results: missing consultation data");
      return;
    }

    // Get existing OAE data or create new structure
    const existingOae = consultationData.oae || {};
    const existingEarTests = existingOae.earTests || [];

    // Process current ear's frequency responses
    const currentEarResponses = frequencyResponses
      .filter(fr => fr.frequency !== null && fr.responseDb !== null)
      .map(fr => {
        const freqConfig = frequencies.find(f => f.Frequency === fr.frequency);
        const threshold = freqConfig?.SNR ?? 6;
        const passed = fr.snr !== null ? fr.snr >= threshold : false;

        return {
          frequencyHz: fr.frequency,
          pass: passed,
          noise: fr.noiseLevel ?? null,
          signal: fr.responseDb,
          artefacts: 0, // Default to 0 if not available
        };
      });

    // Determine if current ear passed overall
    const currentEarPassed = currentEarResponses.length > 0 
      ? currentEarResponses.every(fr => fr.pass)
      : false;

    // Get ear volume and minimum signal threshold from test results or use defaults
    const earKey = selectedEar.toLowerCase() as "left" | "right";
    const currentEarData = testResults[earKey] || {};
    const earVolume = currentEarData?.EarVolume || currentEarData?.earVolume || null;
    const minSignalThreshold = currentEarData?.MinimumSignalThreshold || 
                            currentEarData?.minimumSignalThreshold || 
                            minimumSignalThreshold;

    // Create or update ear test entry
    const earTestEntry: any = {
      ear: selectedEar === "L" ? "LEFT" : "RIGHT",
      pass: currentEarPassed,
      result: currentEarPassed ? "Pass" : "Refer",
      frequencyResponses: currentEarResponses,
    };

    // Only include these fields if they have values
    if (minSignalThreshold !== null && minSignalThreshold !== undefined) {
      earTestEntry.minimumSignalThreshold = minSignalThreshold;
    }
    if (earVolume !== null && earVolume !== undefined) {
      earTestEntry.earVolume = earVolume;
    }

    // Update or add ear test
    const updatedEarTests = existingEarTests.filter(
      (et: any) => et.ear !== earTestEntry.ear
    );
    updatedEarTests.push(earTestEntry);

    // Determine overall status
    const allEarsCompleted = updatedEarTests.length === 2;
    const allEarsPassed = updatedEarTests.every((et: any) => et.pass);
    const status = allEarsCompleted
      ? (allEarsPassed ? "COMPLETED" : "COMPLETED")
      : "IN_PROGRESS";

    // Create OAE test data
    const oaeTest = {
      status: status,
      notes: existingOae.notes || "",
      earTests: updatedEarTests,
    };

    // Update consultation with OAE data
    const updatedConsultation: ConsultationModelData = {
      ...consultationData,
      id: consultationData.id, // Required field
      oae: oaeTest,
      updatedAt: new Date().toISOString(),
    };

    console.log("💾 [OAE Save] Saving OAE data:", JSON.stringify(oaeTest, null, 2));

    try {
      await updateConsultationMutation.mutateAsync(updatedConsultation);
      console.log("✅ OAE results saved successfully");

      // Add current ear to completed set
      const newCompletedEars = new Set(completedEars);
      newCompletedEars.add(selectedEar);
      setCompletedEars(newCompletedEars);

      // Check if both ears are completed
      if (newCompletedEars.size === 2) {
        toast.success("Both ears completed! You can now view the report.");
      } else {
        const remainingEar = selectedEar === "L" ? "Right" : "Left";
        toast.success(
          `${selectedEar === "L" ? "Left" : "Right"} ear completed and saved! Please test the ${remainingEar} ear.`
        );

        // Switch to the other ear automatically
        const nextEar = selectedEar === "L" ? "R" : "L";
        setSelectedEar(nextEar);
        setIsTestCompleted(false);
      }
    } catch (error) {
      console.error("❌ Failed to save OAE results:", error);
      toast.error("Failed to save OAE results. Please try again.");
    }
  }, [
    consultation,
    selectedEar,
    completedEars,
    updateConsultationMutation,
    frequencyResponses,
    frequencies,
    testResults,
    minimumSignalThreshold,
  ]);

  // Start/Stop OAE test
  const startTest = useCallback(() => {
    if (!socket) {
      toast.error("Socket connection not available");
      return;
    }

    if (!isRunning) {
      // Reset test state
      setIsTestCompleted(false);
      setSnr(null);
      setResponseLevel(null);
      setNoiseLevel(null);
      setCurrentFrequency(null);
      setFrequencyResponses([]);

      // Start the test
      setIsRunning(true);

      // Emit start DPOAE event with all parameters (flat structure matching backend socket handler)
      if (testType === "DPOAE") {
        socket.emit("start-dpoae", {
          consultationId: params.consultationId,
          realTimeStatusUpdateDuringExecution,
          timeoutTime: timeoutTime * 1000, // Convert seconds to milliseconds for device
          timeoutAuto,
          stimulusLevelL2,
          stimulusLevelL1,
          stimulusLevelAuto,
          artefactLevel,
          retest,
          frequencies,
          numberPass,
          skipEarVolumeCheck,
          stopOnPass,
          invertedFrequencyOrder,
          minimumSignalThreshold,
        });
        console.log("Started DPOAE test with params:", {
          consultationId: params.consultationId,
          stimulusLevelL1,
          stimulusLevelL2,
          frequencies,
          numberPass,
        });
      } else {
        // TODO: Add TEOAE support when backend is ready
        toast.info("TEOAE test type not yet supported");
        setIsRunning(false);
        return;
      }
    } else {
      // Stop the test
      setIsRunning(false);
      // TODO: Emit stop test event when backend is ready
      // socket.emit("stop-dpoae", {
      //   consultationId: params.consultationId,
      // });
      toast.info("OAE test stopped");
    }
  }, [
    socket,
    params.consultationId,
    selectedEar,
    isRunning,
    testType,
    realTimeStatusUpdateDuringExecution,
    timeoutTime,
    timeoutAuto,
    stimulusLevelL2,
    stimulusLevelL1,
    stimulusLevelAuto,
    artefactLevel,
    retest,
    frequencies,
    numberPass,
    skipEarVolumeCheck,
    stopOnPass,
    invertedFrequencyOrder,
    minimumSignalThreshold,
  ]);

  // Reset test data
  const resetTest = useCallback(() => {
    console.log("Resetting test data");
    setIsTestCompleted(false);
    setIsRunning(false);
    setTestResults({});
    setSnr(null);
    setResponseLevel(null);
    setNoiseLevel(null);
    setCurrentFrequency(null);
    setFrequencyResponses([]);
  }, []);

  // Listen for OAE data from socket
  React.useEffect(() => {
    if (!socket) return;

    const handleDpoaeStarted = (data: {
      consultationId: string;
      realTimeStatusUpdateDuringExecution: boolean;
      timeoutTime: number;
      timeoutAuto: boolean;
      stimulusLevelL2: number;
      stimulusLevelL1: number;
      stimulusLevelAuto: boolean;
      artefactLevel: number;
      retest: boolean;
      frequencies: { Frequency: number; SNR: number }[];
      numberPass: number;
      skipEarVolumeCheck: boolean;
      stopOnPass: boolean;
      invertedFrequencyOrder: boolean;
      minimumSignalThreshold: number;
    }) => {
      console.log("DPOAE test started:", data);
      toast.success("DPOAE test started");
    };

    const handleDpoaeStatus = (data: { dpoaeStatus: any }) => {
      console.log("📊 [DPOAE Status] Full data received:", JSON.stringify(data, null, 2));
      const status = data.dpoaeStatus;
      if (!status) {
        console.warn("⚠️ [DPOAE Status] No dpoaeStatus in data:", data);
        return;
      }
      
      // Extract nested DpOae object
      const dpOae = status.DpOae || status.dpOae || {};
      const statusName = status.StatusName || status.statusName;
      const isInProgress = status.IsInProgress || status.isInProgress;
      const testData = dpOae.Data || dpOae.data;
      
      console.log("📊 [DPOAE Status] Status info:", {
        statusName,
        isInProgress,
        earVolume: dpOae.EarVolume || dpOae.earVolume,
        hasData: !!testData,
        minimumSignalThreshold: dpOae.MinimumSignalThreshold || dpOae.minimumSignalThreshold,
      });
      
      // Handle calibration phase - no test data yet
      if (!testData || statusName === "dpOaeInEarChirpCalibration") {
        console.log("🔄 [DPOAE Status] In calibration phase or no test data yet");
        if (dpOae.EarVolume !== undefined || dpOae.earVolume !== undefined) {
          const earVolume = dpOae.EarVolume ?? dpOae.earVolume;
          console.log("👂 [DPOAE Status] Ear Volume:", earVolume);
        }
        return;
      }
      
      // Extract test data from nested structure - using actual field names from backend
      const frequency = testData.Frequency || testData.frequency || testData.frequencyHz;
      const signal = testData.Signal || testData.signal; // Response level (dB SPL)
      const noise = testData.Noise || testData.noise; // Noise level (dB SPL)
      const retested = testData.Retested || testData.retested || false;
      const duration = testData.Duration || testData.duration;
      const artefacts = testData.Artefacts || testData.artefacts || 0;
      
      // Calculate SNR: Signal - Noise (in dB)
      // Example: Signal = -8.56, Noise = -12.66, SNR = -8.56 - (-12.66) = 4.1 dB
      const snrValue = (signal !== undefined && noise !== undefined) 
        ? signal - noise 
        : undefined;
      
      console.log("📊 [DPOAE Status] Parsed test data:", {
        frequency,
        signal,
        noise,
        snr: snrValue,
        retested,
        duration,
        artefacts,
        allKeys: Object.keys(testData),
      });
      
      // Update real-time measurements
      if (snrValue !== undefined) {
        console.log("✅ [DPOAE Status] Updating SNR:", snrValue);
        setSnr(snrValue);
      }
      if (signal !== undefined) {
        console.log("✅ [DPOAE Status] Updating Response Level (Signal):", signal);
        setResponseLevel(signal);
      }
      if (noise !== undefined) {
        console.log("✅ [DPOAE Status] Updating Noise Level:", noise);
        setNoiseLevel(noise);
      }
      if (frequency !== undefined) {
        console.log("✅ [DPOAE Status] Updating Current Frequency:", frequency);
        setCurrentFrequency(frequency);
      }
      
      // Update frequency response data for real-time plotting
      if (frequency !== undefined && signal !== undefined) {
        setFrequencyResponses((prev) => {
          const existingIndex = prev.findIndex(
            (r) => r.frequency === frequency
          );
          
          const freqConfig = frequencies.find(
            (f) => f.Frequency === frequency
          );
          const threshold = freqConfig?.SNR ?? 6;
          const passed = snrValue !== undefined ? snrValue >= threshold : false;
          
          const newResponse: FrequencyResponseData = {
            frequency: frequency,
            responseDb: signal, // Signal is the response level
            snr: snrValue ?? 0, // Use 0 as default if null
            noiseLevel: noise ?? 0, // Use 0 as default if null
            passed: passed,
            isTesting: true,
          };
          
          console.log("📈 [DPOAE Status] Updating graph data for frequency:", frequency, {
            responseDb: signal,
            snr: snrValue,
            noiseLevel: noise,
            passed,
            threshold,
            existingIndex,
          });
          
          if (existingIndex >= 0) {
            // Update existing frequency response
            const updated = [...prev];
            updated[existingIndex] = newResponse;
            console.log("🔄 [DPOAE Status] Updated existing frequency response:", updated);
            return updated;
          } else {
            // Add new frequency response
            const newData = [...prev, newResponse].sort((a, b) => a.frequency - b.frequency);
            console.log("➕ [DPOAE Status] Added new frequency response:", newData);
            return newData;
          }
        });
      }
    };

    const handleDpoaeData = (data: { dpoaeData: any }) => {
      console.log("🎯 [DPOAE Data] Full final data received:", JSON.stringify(data, null, 2));
      const dpoaeData = data.dpoaeData;
      if (!dpoaeData) {
        console.warn("⚠️ [DPOAE Data] No dpoaeData in data:", data);
        return;
      }
      
      console.log("🎯 [DPOAE Data] Parsed dpoaeData object:", {
        allKeys: Object.keys(dpoaeData),
        frequencyResponses: dpoaeData.frequencyResponses,
        frequency: dpoaeData.frequency,
        frequencyHz: dpoaeData.frequencyHz,
        responseDb: dpoaeData.responseDb,
        responseLevel: dpoaeData.responseLevel,
        snr: dpoaeData.snr,
        noiseLevel: dpoaeData.noiseLevel,
        passed: dpoaeData.passed,
        fullObject: dpoaeData,
      });
      
      // Update frequency responses with final data
      // Backend may send frequencyResponses array or individual frequency data
      if (dpoaeData.frequencyResponses && Array.isArray(dpoaeData.frequencyResponses)) {
        console.log("📊 [DPOAE Data] Processing frequencyResponses array:", dpoaeData.frequencyResponses);
        setFrequencyResponses((prev) => {
          const updated = [...prev];
          dpoaeData.frequencyResponses.forEach((fr: any, index: number) => {
            console.log(`📊 [DPOAE Data] Processing frequency response ${index}:`, {
              frequencyHz: fr.frequencyHz,
              frequency: fr.frequency,
              responseDb: fr.responseDb,
              responseLevel: fr.responseLevel,
              snr: fr.snr,
              SNR: fr.SNR,
              noiseLevel: fr.noiseLevel,
              passed: fr.passed,
              allKeys: Object.keys(fr),
            });
            
            const freqHz = fr.frequencyHz ?? fr.frequency;
            if (!freqHz) {
              console.warn(`⚠️ [DPOAE Data] Frequency response ${index} missing frequency:`, fr);
              return;
            }
            
            const freqConfig = frequencies.find((f) => f.Frequency === freqHz);
            const threshold = freqConfig?.SNR ?? 6;
            const snrValue = fr.snr ?? fr.SNR ?? null;
            const responseValue = fr.responseDb ?? fr.responseLevel ?? null;
            const noiseValue = fr.noiseLevel ?? fr.noise ?? null;
            const passed = fr.passed !== undefined 
              ? fr.passed 
              : (snrValue !== null ? snrValue >= threshold : (responseValue ?? 0) > minimumSignalThreshold);
            
            const existingIndex = updated.findIndex((r) => r.frequency === freqHz);
            const finalResponse: FrequencyResponseData = {
              frequency: freqHz,
              responseDb: responseValue,
              snr: snrValue,
              noiseLevel: noiseValue,
              passed: passed,
              isTesting: false,
            };
            
            console.log(`✅ [DPOAE Data] Final response for ${freqHz}Hz:`, {
              responseDb: responseValue,
              snr: snrValue,
              passed,
              threshold,
              existingIndex,
            });
            
            if (existingIndex >= 0) {
              updated[existingIndex] = finalResponse;
            } else {
              updated.push(finalResponse);
            }
          });
          console.log("📊 [DPOAE Data] Updated frequencyResponses:", updated);
          return updated;
        });
      } else if (dpoaeData.frequency !== undefined || dpoaeData.frequencyHz !== undefined) {
        // Single frequency completion
        const freqHz = dpoaeData.frequencyHz ?? dpoaeData.frequency;
        console.log("📊 [DPOAE Data] Processing single frequency completion:", freqHz, dpoaeData);
        
        setFrequencyResponses((prev) => {
          const existingIndex = prev.findIndex((r) => r.frequency === freqHz);
          const freqConfig = frequencies.find((f) => f.Frequency === freqHz);
          const threshold = freqConfig?.SNR ?? 6;
          const snrValue = dpoaeData.snr ?? dpoaeData.SNR ?? null;
          const responseValue = dpoaeData.responseDb ?? dpoaeData.responseLevel ?? null;
          const noiseValue = dpoaeData.noiseLevel ?? dpoaeData.noise ?? null;
          const passed = dpoaeData.passed !== undefined 
            ? dpoaeData.passed 
            : (snrValue !== null ? snrValue >= threshold : (responseValue ?? 0) > minimumSignalThreshold);
          
          const finalResponse: FrequencyResponseData = {
            frequency: freqHz,
            responseDb: responseValue,
            snr: snrValue,
            noiseLevel: noiseValue,
            passed: passed,
            isTesting: false,
          };
          
          console.log(`✅ [DPOAE Data] Final response for ${freqHz}Hz:`, {
            responseDb: responseValue,
            snr: snrValue,
            passed,
            threshold,
            existingIndex,
          });
          
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = finalResponse;
            console.log("🔄 [DPOAE Data] Updated existing frequency:", updated);
            return updated;
          } else {
            const newData = [...prev, finalResponse];
            console.log("➕ [DPOAE Data] Added new frequency:", newData);
            return newData;
          }
        });
      } else {
        console.warn("⚠️ [DPOAE Data] Unknown data structure, no frequencyResponses or frequency field:", dpoaeData);
      }
      
      // Update final results
      setIsTestCompleted(true);
      setIsRunning(false);
      
      // Store results for current ear
      setTestResults((prev) => {
        const newResults = {
          ...prev,
          [selectedEar.toLowerCase()]: dpoaeData,
        };
        console.log("💾 [DPOAE Data] Stored test results:", newResults);
        return newResults;
      });
      
      toast.success("DPOAE test completed");
    };

    const handleDpoaeError = (data: { message?: string }) => {
      console.error("DPOAE error:", data);
      setIsRunning(false);
      toast.error(data.message || "DPOAE test error occurred");
    };

    // Register socket listeners
    socket.on("dpoae-started", handleDpoaeStarted);
    socket.on("dpoae-status", handleDpoaeStatus);
    socket.on("dpoae-data", handleDpoaeData);
    socket.on("dpoae-error", handleDpoaeError);
    socket.on("nack-received", handleDpoaeError);

    return () => {
      socket.off("dpoae-started", handleDpoaeStarted);
      socket.off("dpoae-status", handleDpoaeStatus);
      socket.off("dpoae-data", handleDpoaeData);
      socket.off("dpoae-error", handleDpoaeError);
      socket.off("nack-received", handleDpoaeError);
    };
  }, [socket, selectedEar]);

  return (
    <DashboardBodyWrapper pageTitle="Otoacoustic Emissions">
      <div className="p-6 lg:pr-80">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">Otoacoustic Emissions (OAE)</h1>

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
                    Ready to start OAE testing. Select an ear and begin the test.
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
                    onClick={() => setSelectedEar("L")}
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
                    onClick={() => setSelectedEar("R")}
                  >
                    R
                  </button>
                </div>
              </div>

              {/* Test Type */}
              <div className="mb-2">
                <label className="block text-[10px] font-medium mb-1">Test Type</label>
                <div className="flex gap-1">
                  <button
                    className={`flex-1 px-2 py-0.5 rounded text-[10px] ${
                      testType === "DPOAE" ? "bg-blue-500 text-white" : "bg-gray-200"
                    }`}
                    onClick={() => setTestType("DPOAE")}
                    disabled={isRunning}
                  >
                    DPOAE
                  </button>
                  <button
                    className={`flex-1 px-2 py-0.5 rounded text-[10px] ${
                      testType === "TEOAE" ? "bg-blue-500 text-white" : "bg-gray-200"
                    }`}
                    onClick={() => setTestType("TEOAE")}
                    disabled={isRunning}
                  >
                    TEOAE
                  </button>
                </div>
              </div>

              {/* Stimulus Levels */}
              <div className="mb-2">
                <label className="block text-[10px] font-medium mb-1">L1 / L2</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    className="w-12 p-1 border rounded text-[10px]"
                    value={stimulusLevelL1}
                    onChange={(e) => setStimulusLevelL1(Number(e.target.value))}
                    disabled={isRunning || stimulusLevelAuto}
                    min={40}
                    max={80}
                  />
                  <span className="text-[10px]">/</span>
                  <input
                    type="number"
                    className="w-12 p-1 border rounded text-[10px]"
                    value={stimulusLevelL2}
                    onChange={(e) => setStimulusLevelL2(Number(e.target.value))}
                    disabled={isRunning || stimulusLevelAuto}
                    min={40}
                    max={80}
                  />
                  <button
                    className={`px-1 py-0.5 rounded text-[9px] ${stimulusLevelAuto ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                    onClick={() => setStimulusLevelAuto(!stimulusLevelAuto)}
                    disabled={isRunning}
                  >
                    Auto
                  </button>
                </div>
              </div>

              {/* Artefact Level */}
              <div className="mb-2">
                <label className="block text-[10px] font-medium mb-1">Artefact</label>
                <div className="flex items-center gap-1">
                  <button className="px-1 py-0.5 bg-gray-200 rounded text-[10px]" onClick={() => setArtefactLevel(Math.max(0, artefactLevel - 1))}>-</button>
                  <span className="w-12 text-center text-[10px]">{artefactLevel} dB</span>
                  <button className="px-1 py-0.5 bg-gray-200 rounded text-[10px]" onClick={() => setArtefactLevel(Math.min(20, artefactLevel + 1))}>+</button>
                </div>
              </div>

              {/* Number Pass */}
              <div className="mb-2">
                <label className="block text-[10px] font-medium mb-1">Pass</label>
                <div className="flex items-center gap-1">
                  <button className="px-1 py-0.5 bg-gray-200 rounded text-[10px]" onClick={() => setNumberPass(Math.max(1, numberPass - 1))}>-</button>
                  <span className="w-12 text-center text-[10px]">{numberPass}</span>
                  <button className="px-1 py-0.5 bg-gray-200 rounded text-[10px]" onClick={() => setNumberPass(Math.min(10, numberPass + 1))}>+</button>
                </div>
              </div>

              {/* Live Measurements */}
              <div className="mb-2">
                <div className="text-[10px] font-medium mb-1">Live</div>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <div>
                    <div className="text-[9px] text-gray-500">Freq</div>
                    <div className="font-semibold">{currentFrequency !== null ? `${currentFrequency}` : "--"} Hz</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-gray-500">SNR</div>
                    <div className="font-semibold">{snr !== null ? `${snr.toFixed(1)}` : "--"} dB</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-gray-500">Response</div>
                    <div className="font-semibold">{responseLevel !== null ? `${responseLevel.toFixed(1)}` : "--"} dB</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-gray-500">Noise</div>
                    <div className="font-semibold">{noiseLevel !== null ? `${noiseLevel.toFixed(1)}` : "--"} dB</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-[9px] text-gray-500">Status</div>
                    <div className="font-semibold text-[9px]">
                      {isRunning ? "Running" : isTestCompleted ? "Done" : "Ready"}
                    </div>
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
                    resetTest();
                    toast.info("All test progress cleared. You can start over.");
                  }}
                >
                  Reset All
                </button>
              )}

              {(isTestCompleted || Object.keys(testResults).length > 0) && (
                <button
                  className={`w-full px-2 py-1 rounded text-[10px] ${
                    updateConsultationMutation.isPending ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                  } text-white mb-1`}
                  onClick={saveOaeResults}
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
                      `/consultation/${params.consultationId}/test/report/otoacoustic`
                    )
                  }
                >
                  View Report
                </button>
              )}
            </div>
          </div>

          {/* Test Controls (Mobile) */}
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
                  Right
                  {completedEars.has("R") && <span className="text-xs">✓</span>}
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons (Mobile) */}
          <div className="flex gap-4 mb-6 lg:hidden">
            <button
              className={`px-6 py-2 rounded flex items-center gap-2 ${
                isRunning
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-green-500 hover:bg-green-600"
              } text-white`}
              onClick={startTest}
            >
              {isRunning ? "Stop Test" : "Start Test"}
            </button>
            <button
              className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              onClick={resetTest}
            >
              Clear Results
            </button>
          </div>

          {/* DPOAE Graph Display */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">
              DPOAE Response Graph - {selectedEar === "L" ? "Left" : "Right"} Ear
            </h2>
            {frequencies.length > 0 ? (
              <DpoaeGraph
                data={frequencyResponses}
                frequencies={frequencies}
                selectedEar={selectedEar}
              />
            ) : (
              <div className="border rounded p-4 bg-gray-50">
                <div className="h-[400px] flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="text-6xl mb-4">📊</div>
                    <p className="text-lg font-medium">No Frequencies Selected</p>
                    <p className="text-sm mt-2">Please configure frequencies to test</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Test Submission Buttons (Mobile) */}
          {(isTestCompleted || Object.keys(testResults).length > 0) && (
            <div className="mt-6 flex gap-4 lg:hidden">
              <button
                className={`px-6 py-2 rounded flex items-center gap-2 ${
                  updateConsultationMutation.isPending
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-500 hover:bg-green-600"
                } text-white`}
                onClick={saveOaeResults}
                disabled={updateConsultationMutation.isPending}
              >
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
                      `/consultation/${params.consultationId}/test/report/otoacoustic`
                    )
                  }
                >
                  View Report
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardBodyWrapper>
  );
}
