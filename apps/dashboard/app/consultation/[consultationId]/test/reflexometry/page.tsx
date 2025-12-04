"use client";

import { useSocket } from "@/providers/socket-provider";
import { useDevice } from "@/providers/device-provider";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { useUpdateConsultation } from "@/hooks/consultation/use-update-consultation";
import { useGetConsultation } from "@/hooks/consultation/use-get-consultation";
import { ConsultationModelData } from "@/models/consultation.model";
import { TestStatus, Ear } from "@/models/enums";
import { toast } from "sonner";
import { ROUTES } from "@/lib/routes";

// Frequency options for reflex testing
const FREQUENCIES = [500, 1000, 2000, 4000];

// Reflex types - BOTH mode tests IPSI and CONTRA simultaneously
type ReflexMode = "IPSI" | "CONTRA" | "BOTH";

// Single reflex measurement result
interface ReflexReading {
  frequency: number;
  mode: ReflexMode;
  ear: "L" | "R";
  threshold: number | null; // dB HL, null if absent
  isPresent: boolean;
  waveformData: { time: number; amplitude: number }[];
}

// Graph component for individual reflex measurement
const ReflexGraph: React.FC<{
  reading: ReflexReading | null;
  frequency: number;
  mode: ReflexMode;
  ear: "L" | "R";
  isActive: boolean;
  isRunning: boolean;
  liveWaveform?: { time: number; amplitude: number }[];
  onClick: () => void;
}> = ({ reading, frequency, mode, ear, isActive, isRunning, liveWaveform, onClick }) => {
  // Use live waveform when running, otherwise use saved reading
  const waveformData = isRunning && liveWaveform && liveWaveform.length > 0 
    ? liveWaveform 
    : reading?.waveformData || [];
  const hasData = waveformData.length > 0;
  
  // Debug: log when component receives data
  if (reading?.waveformData?.length) {
    console.log(`[Graph ${ear}-${mode}-${frequency}] Has saved data: ${reading.waveformData.length} points, displaying: ${waveformData.length} points, isRunning: ${isRunning}`);
  }
  const borderColor = isActive ? (ear === "L" ? "#3B82F6" : "#EF4444") : "#e5e7eb";
  const bgColor = isRunning ? "#fef3c7" : hasData ? "#ecfdf5" : "#f9fafb";

  // Calculate Y-axis domain with padding to show waveform variations
  const amplitudes = waveformData.map(d => d.amplitude);
  const minAmp = amplitudes.length > 0 ? Math.min(...amplitudes) : 0;
  const maxAmp = amplitudes.length > 0 ? Math.max(...amplitudes) : 1;
  const padding = (maxAmp - minAmp) * 0.1 || 0.1; // 10% padding or minimum 0.1
  const yDomain: [number, number] = [minAmp - padding, maxAmp + padding];

  return (
    <div
      className={`border-2 rounded-lg p-2 cursor-pointer transition-all ${
        isActive ? "ring-2 ring-offset-2" : ""
      } ${isRunning && isActive ? "animate-pulse" : ""}`}
      style={{ borderColor, backgroundColor: bgColor }}
      onClick={onClick}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-semibold text-gray-700">
          {frequency >= 1000 ? `${frequency / 1000}kHz` : `${frequency}Hz`}
        </span>
        <span className="text-xs font-medium text-gray-600">
          {reading?.threshold && typeof reading.threshold === 'number' ? `${reading.threshold}dB` : "—"}
        </span>
      </div>
      <div className="h-16 bg-white rounded border">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={waveformData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
              <YAxis domain={yDomain} hide />
              <Line
                type="monotone"
                dataKey="amplitude"
                stroke={isRunning ? "#F59E0B" : ear === "L" ? "#3B82F6" : "#EF4444"}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {isRunning ? (
              <span className="text-xs text-amber-600 animate-pulse">Recording...</span>
            ) : (
              <div className="w-full h-[1px] bg-gray-300" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default function ReflexometryPage() {
  const socket = useSocket();
  const router = useRouter();
  const params = useParams();
  const consultationId = params.consultationId as string;
  const updateConsultationMutation = useUpdateConsultation();
  const { data: consultationResponse } = useGetConsultation(consultationId);
  const consultation = consultationResponse?.data as ConsultationModelData | undefined;
  const { deviceState } = useDevice();

  // Get IPSI and CONTRA transducer info from the ImpedanceTransducers array
  const { ipsiTransducer, contraTransducer } = useMemo(() => {
    const impedanceTransducers = deviceState?.transducerResponse?.ImpedanceTransducers;
    if (!impedanceTransducers || impedanceTransducers.length === 0) {
      console.log("[Reflexometry] No impedance transducers found");
      return { ipsiTransducer: null, contraTransducer: null };
    }
    // IPSI: EarType === 0, CONTRA: EarType === 1
    const ipsi = impedanceTransducers.find(t => t.EarType === 0);
    const contra = impedanceTransducers.find(t => t.EarType === 1);
    
    console.log("[Reflexometry] Transducer identification:", {
      totalTransducers: impedanceTransducers.length,
      allTransducers: impedanceTransducers.map(t => ({
        ID: t.ID,
        Name: t.Name,
        EarType: t.EarType,
        isIPSI: t.EarType === 0,
        isCONTRA: t.EarType === 1,
      })),
      ipsiFound: !!ipsi,
      ipsiID: ipsi?.ID,
      ipsiName: ipsi?.Name,
      contraFound: !!contra,
      contraID: contra?.ID,
      contraName: contra?.Name,
    });
    
    return {
      ipsiTransducer: ipsi || null,
      contraTransducer: contra || null,
    };
  }, [deviceState?.transducerResponse?.ImpedanceTransducers]);

  const contraTransducerID = contraTransducer?.ID || "";

  // Test state
  const [selectedEar, setSelectedEar] = useState<"L" | "R">("R");
  const [selectedMode, setSelectedMode] = useState<ReflexMode>("IPSI");
  const [selectedFrequency, setSelectedFrequency] = useState<number>(1000);
  const [isRunning, setIsRunning] = useState(false);
  const [completedEars, setCompletedEars] = useState<Set<"L" | "R">>(new Set());

  // Settings
  const [stimulusLevel, setStimulusLevel] = useState(80); // dB HL, min is 80
  const [stopLevel, setStopLevel] = useState(100); // Max level to stop searching
  const [increment, setIncrement] = useState(5);
  const [stimulusDuration, setStimulusDuration] = useState(1000); // ms
  const [deflectionThreshold, setDeflectionThreshold] = useState(0.025); // 0.025, 0.03, or 0.05

  // Probe status
  const [probeStatus, setProbeStatus] = useState<string>("PROBE OPEN");
  const [earCanalVolume, setEarCanalVolume] = useState<number>(0);

  // Reflex readings - 8 measurements per ear (4 freq x 2 modes)
  const [readings, setReadings] = useState<Map<string, ReflexReading>>(new Map());

  // Real-time waveform data for current measurement
  const [currentWaveform, setCurrentWaveform] = useState<{ time: number; amplitude: number }[]>([]);
  const currentWaveformRef = useRef<{ time: number; amplitude: number }[]>([]);
  
  // Track the actual frequency and mode being tested (from device data)
  const [activeTestFrequency, setActiveTestFrequency] = useState<number | null>(null);
  const [activeTestMode, setActiveTestMode] = useState<"IPSI" | "CONTRA" | null>(null);
  
  // Refs to track frequency and mode for socket handlers (avoids stale closure)
  const activeTestFrequencyRef = useRef<number | null>(null);
  const activeTestModeRef = useRef<"IPSI" | "CONTRA" | null>(null);

  // Generate key for reading lookup
  const getReadingKey = (ear: "L" | "R", mode: ReflexMode, freq: number) => 
    `${ear}-${mode}-${freq}`;

  // Load existing reflexometry data from consultation on mount
  useEffect(() => {
    if (!consultation) return;
    
    const reflexometryData = (consultation as any)?.reflexometry;
    if (!reflexometryData || !reflexometryData.responses || reflexometryData.responses.length === 0) {
      return;
    }

    console.log("[Reflexometry] Loading existing data:", reflexometryData.responses.length, "responses");
    
    // Transform saved responses back into readings Map
    const loadedReadings = new Map<string, ReflexReading>();
    const loadedCompletedEars = new Set<"L" | "R">();
    
    reflexometryData.responses.forEach((response: any) => {
      const ear = response.ear === "LEFT" ? "L" : "R";
      const mode = response.mode || (response.earType === 1 ? "CONTRA" : "IPSI");
      const freq = response.frequencyHz;
      const key = getReadingKey(ear, mode, freq);
      
      // Transform complianceData array back to waveform format
      const waveformData = (response.complianceData || []).map((amplitude: number, index: number) => ({
        time: index,
        amplitude: amplitude,
      }));
      
      loadedReadings.set(key, {
        frequency: freq,
        mode: mode as ReflexMode,
        ear: ear,
        threshold: response.levelDb || null,
        isPresent: response.possibleReflex || false,
        waveformData: waveformData,
      });
      
      // Track completed ears (if all 8 readings exist for an ear)
      const earReadings = Array.from(loadedReadings.values()).filter(r => r.ear === ear);
      if (earReadings.length >= 8) {
        loadedCompletedEars.add(ear);
      }
    });
    
    if (loadedReadings.size > 0) {
      setReadings(loadedReadings);
      setCompletedEars(loadedCompletedEars);
      // Mark these ears as already saved (they came from database)
      loadedCompletedEars.forEach(ear => {
        autoSavedEarsRef.current.add(ear);
      });
      console.log("[Reflexometry] Restored", loadedReadings.size, "readings and", loadedCompletedEars.size, "completed ears");
    }
    
    // Mark initial load as complete after a short delay
    setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 1000);
  }, [consultation]);

  // Debug: log readings when they change
  useEffect(() => {
    console.log("[Reflexes] Readings state updated:", readings.size, "readings");
    readings.forEach((reading, key) => {
      console.log(`  - ${key}: ${reading.waveformData.length} points`);
    });
  }, [readings]);

  // Track which ears have been auto-saved to prevent duplicate saves
  const autoSavedEarsRef = useRef<Set<"L" | "R">>(new Set());
  const isInitialLoadRef = useRef(true);

  // Get current active reading key
  const activeKey = getReadingKey(selectedEar, selectedMode, selectedFrequency);

  // Handle socket events
  useEffect(() => {
    if (!socket) return;

    const handleReflexStatus = (data: any) => {
      if (data.probeStatus) {
        if (typeof data.probeStatus === "string") {
          setProbeStatus(data.probeStatus);
        } else if (typeof data.probeStatus === "object") {
          const ps = data.probeStatus;
          if (ps.IsOpen) setProbeStatus("PROBE OPEN");
          else if (ps.IsClose) setProbeStatus("PROBE CLOSED");
          else setProbeStatus("PROBE OK");
        }
      }
      if (data.ecv) setEarCanalVolume(data.ecv);
    };

    // Handle tympanometry-status which contains reflex data
    const handleTympanometryStatus = (data: any) => {
      const status = data.tympanometryStatus || data;
      if (!status) return;

      // Log status for debugging
      if (status.StatusName === "reflexExecution") {
        console.log("[Reflexes] Real-time data:", status.StatusName, status.Reflexes?.Frequency, status.Reflexes?.Compliance);
      }

      // Update probe status
      if (status.ProbeStatus) {
        const ps = status.ProbeStatus;
        if (ps.IsOpen) setProbeStatus("PROBE OPEN");
        else if (ps.IsClose) setProbeStatus("PROBE CLOSED");
        else setProbeStatus("PROBE OK");
      }

      // Update ECV
      if (status.Compliance !== undefined) {
        setEarCanalVolume(status.Compliance);
      }

      // Check if this is reflex execution data
      if (status.StatusName === "reflexExecution" && status.Reflexes) {
        const reflexData = status.Reflexes;
        const testFreq = reflexData.Frequency;
        const testMode: "IPSI" | "CONTRA" = reflexData.EarType === 1 ? "CONTRA" : "IPSI";

        // Check if frequency changed
        const prevFreq = activeTestFrequencyRef.current;
        const freqChanged = prevFreq !== null && prevFreq !== testFreq;
        
        // IMPORTANT: If frequency changed, SAVE the previous waveform before clearing!
        if (freqChanged && currentWaveformRef.current.length > 0) {
          const prevMode: "IPSI" | "CONTRA" = activeTestModeRef?.current || "IPSI";
          const key = `${selectedEar}-${prevMode}-${prevFreq}`;
          const waveformToSave = [...currentWaveformRef.current];
          const level = reflexData.Level || 0;
          
          console.log(`[Reflexes] 💾 Freq changed! Saving ${key}: ${waveformToSave.length} points`);
          
          setReadings(prev => {
            const newMap = new Map(prev);
            newMap.set(key, {
              frequency: prevFreq,
              mode: prevMode,
              ear: selectedEar,
              threshold: level,
              isPresent: true,
              waveformData: waveformToSave,
            });
            console.log(`[Reflexes] Readings now: ${newMap.size} -`, Array.from(newMap.keys()));
            return newMap;
          });
        }
        
        // Update tracking state and ref
        activeTestFrequencyRef.current = testFreq;
        activeTestModeRef.current = testMode;
        setActiveTestFrequency(testFreq);
        setActiveTestMode(testMode);
        setIsRunning(true);

        // Store real-time compliance for waveform
        const compliance = reflexData.Compliance ?? status.Compliance ?? 0;
        const newPoint = { time: Date.now(), amplitude: compliance };
        
        if (freqChanged) {
          // Start fresh for new frequency
          currentWaveformRef.current = [newPoint];
          setCurrentWaveform([newPoint]);
        } else {
          currentWaveformRef.current = [...currentWaveformRef.current.slice(-100), newPoint];
          setCurrentWaveform(prev => [...prev.slice(-100), newPoint]);
        }
      }

      // Handle reflexIdle - this is when a frequency test completes - SAVE the waveform here
      if (status.StatusName === "reflexIdle" || status.StatusName === "reflexComplete" || status.StatusName === "reflexResult") {
        // Get frequency from status.Reflexes (most reliable) or from our ref
        const freq = status.Reflexes?.Frequency || activeTestFrequencyRef.current;
        const reflexEarType = status.Reflexes?.EarType;
        const mode = reflexEarType === 1 ? "CONTRA" : "IPSI";
        const level = status.Reflexes?.Level || 0;
        
        console.log(`[Reflexes] Status: ${status.StatusName}, freq from status: ${status.Reflexes?.Frequency}, freq ref: ${activeTestFrequencyRef.current}, points: ${currentWaveformRef.current.length}`);
        
        // Save waveform if we have data and a valid frequency
        if (freq && currentWaveformRef.current.length > 0) {
          const key = `${selectedEar}-${mode}-${freq}`;
          const waveformToSave = [...currentWaveformRef.current];
          
          console.log(`[Reflexes] 💾 Saving waveform for ${key}: ${waveformToSave.length} points at ${level}dB`);
          
          setReadings(prev => {
            const newMap = new Map(prev);
            newMap.set(key, {
              frequency: freq,
              mode: mode,
              ear: selectedEar,
              threshold: level,
              isPresent: true,
              waveformData: waveformToSave,
            });
            console.log(`[Reflexes] Readings now: ${newMap.size} -`, Array.from(newMap.keys()));
            return newMap;
          });
          
          // Clear waveform ref after saving
          currentWaveformRef.current = [];
          setCurrentWaveform([]);
        }
        
        // Reset tracking
        activeTestFrequencyRef.current = null;
        setActiveTestFrequency(null);
        setActiveTestMode(null);
      }
      
      // Handle full idle - test completely stopped
      if (status.StatusName === "idle") {
        setIsRunning(false);
        activeTestFrequencyRef.current = null;
        currentWaveformRef.current = [];
        setActiveTestFrequency(null);
        setActiveTestMode(null);
        setCurrentWaveform([]);
      }
    };

    const handleReflexData = (data: any) => {
      console.log("[Reflexes] reflexes-data received:", data);
      // Real-time waveform point
      if (data.time !== undefined && data.amplitude !== undefined) {
        setCurrentWaveform(prev => [...prev, { time: data.time, amplitude: data.amplitude }]);
      }

      // Final result - handle both single mode and BOTH mode results
      if (data.threshold !== undefined || data.isPresent !== undefined || data.ipsi || data.contra) {
        console.log("[Reflexes] Processing final result:", data);
        setReadings(prev => {
          const newMap = new Map(prev);
          
          // If backend sends separate ipsi/contra results (for BOTH mode)
          if (data.ipsi || data.contra) {
            if (data.ipsi) {
              const ipsiKey = getReadingKey(selectedEar, "IPSI", data.frequency || selectedFrequency);
              newMap.set(ipsiKey, {
                frequency: data.frequency || selectedFrequency,
                mode: "IPSI",
                ear: selectedEar,
                threshold: data.ipsi.threshold ?? null,
                isPresent: data.ipsi.isPresent ?? (data.ipsi.threshold !== null),
                waveformData: data.ipsi.waveformData || [...currentWaveform],
              });
            }
            if (data.contra) {
              const contraKey = getReadingKey(selectedEar, "CONTRA", data.frequency || selectedFrequency);
              newMap.set(contraKey, {
                frequency: data.frequency || selectedFrequency,
                mode: "CONTRA",
                ear: selectedEar,
                threshold: data.contra.threshold ?? null,
                isPresent: data.contra.isPresent ?? (data.contra.threshold !== null),
                waveformData: data.contra.waveformData || [...currentWaveform],
              });
            }
          } else {
            // Single mode result - determine mode from isContralateral or mode field
            let mode: "IPSI" | "CONTRA";
            if (data.isContralateral !== undefined) {
              mode = data.isContralateral ? "CONTRA" : "IPSI";
            } else if (data.mode) {
              mode = data.mode as "IPSI" | "CONTRA";
            } else {
              mode = selectedMode === "BOTH" ? "IPSI" : (selectedMode as "IPSI" | "CONTRA");
            }
            
            const key = getReadingKey(selectedEar, mode, data.frequency || selectedFrequency);
            console.log("[Reflexes] Setting reading for key:", key, "mode:", mode);
            newMap.set(key, {
              frequency: data.frequency || selectedFrequency,
              mode: mode,
              ear: selectedEar,
              threshold: data.threshold ?? null,
              isPresent: data.isPresent ?? (data.threshold !== null),
              waveformData: [...currentWaveform],
            });
          }
          
          return newMap;
        });
        setIsRunning(false);
        setCurrentWaveform([]);
      }
    };

    const handleReflexStarted = (data: any) => {
      console.log("[Reflexes] reflexes-started received:", data);
      toast.success("Reflex test started");
    };

    const handleNack = (data: any) => {
      console.log("[Reflexes] nack-received:", data);
      toast.error(data?.message || "Device error");
      setIsRunning(false);
    };

    // Handle tympanometry-data which contains final reflex results
    const handleTympanometryData = (data: any) => {
      console.log("[Reflexes] tympanometry-data event received:", data);
      const tympData = data.tympanometryData || data;
      
      if (tympData.Reflexes?.ReflexList && Array.isArray(tympData.Reflexes.ReflexList)) {
        console.log("[Reflexes] ✅ Final results received:", tympData.Reflexes.ReflexList.length, "reflexes");
        console.log("[Reflexes] Current selectedEar:", selectedEar);
        
        // Batch all updates into a single state update
        setReadings(prev => {
          const newMap = new Map(prev);
          console.log("[Reflexes] Previous readings count:", prev.size);
          
          tympData.Reflexes.ReflexList.forEach((reflex: any, index: number) => {
            const mode: "IPSI" | "CONTRA" = reflex.EarType === 1 ? "CONTRA" : "IPSI";
            const frequency = reflex.Frequency;
            const level = reflex.Level; // The stimulus level used
            
            // Verify CONTRA identification
            if (reflex.EarType === 1) {
              console.log(`[Reflexes] ✅ CONTRA reflex identified:`, {
                index,
                EarType: reflex.EarType,
                mode,
                frequency,
                level,
                expectedMode: "CONTRA",
                isCorrect: mode === "CONTRA",
              });
            }
            
            // Convert ComplianceData array to waveform format
            const waveformData = (reflex.ComplianceData || []).map((amplitude: number, idx: number) => ({
              time: idx,
              amplitude: amplitude,
            }));
            
            const key = `${selectedEar}-${mode}-${frequency}`;
            console.log(`[Reflexes] Saving [${index}]:`, {
              key,
              ear: selectedEar,
              mode,
              frequency,
              level,
              earType: reflex.EarType,
              points: waveformData.length,
              firstAmplitude: waveformData[0]?.amplitude,
              lastAmplitude: waveformData[waveformData.length-1]?.amplitude,
            });
            
            newMap.set(key, {
              frequency: frequency,
              mode: mode,
              ear: selectedEar,
              threshold: level, // Just save the level used
              isPresent: true, // Not used anymore, keeping for type compatibility
              waveformData: waveformData,
            });
          });
          
          console.log("[Reflexes] New readings count:", newMap.size, "keys:", Array.from(newMap.keys()));
          return newMap;
        });
        
        setIsRunning(false);
        setActiveTestFrequency(null);
        setActiveTestMode(null);
        activeTestFrequencyRef.current = null;
        setCurrentWaveform([]);
        // Don't show completion here - check if all readings are done in useEffect
      }
    };

    // Listen for backend events
    socket.on("reflexes-status", handleReflexStatus);
    socket.on("reflexes-data", handleReflexData);
    socket.on("reflexes-started", handleReflexStarted);
    socket.on("nack-received", handleNack);
    socket.on("tympanometry-status", handleTympanometryStatus);
    socket.on("tympanometry-data", handleTympanometryData);
    
    // Catch-all to see what events come through
    const catchAll = (eventName: string, data: any) => {
      if (eventName.includes("reflex") || eventName.includes("tympan") || eventName.includes("impedance")) {
        console.log(`[Socket Event] ${eventName}:`, data);
      }
    };
    socket.onAny(catchAll);
    
    return () => {
      socket.off("reflexes-status", handleReflexStatus);
      socket.off("reflexes-data", handleReflexData);
      socket.off("reflexes-started", handleReflexStarted);
      socket.off("nack-received", handleNack);
      socket.off("tympanometry-status", handleTympanometryStatus);
      socket.off("tympanometry-data", handleTympanometryData);
      socket.offAny(catchAll);
    };
  }, [socket, selectedEar]);

  // Start reflex measurement
  const handleStart = useCallback(() => {
    if (!socket) {
      toast.error("Socket not connected");
      console.error("[Reflexes] Socket not available");
      return;
    }

    if (!consultationId) {
      toast.error("Consultation ID not available");
      console.error("[Reflexes] Consultation ID missing");
      return;
    }

    // Validate contraTransducerID for CONTRA and BOTH modes
    if ((selectedMode === "CONTRA" || selectedMode === "BOTH") && !contraTransducerID) {
      toast.error("CONTRA transducer not available. Please check device connection.");
      console.error("[Reflexes] CONTRA transducer ID missing:", { contraTransducer, deviceState });
      return;
    }

    console.log("[Reflexes] Starting test:", {
      mode: selectedMode,
      frequency: selectedFrequency,
      level: stimulusLevel,
      contraTransducerID,
    });

    setIsRunning(true);
    setCurrentWaveform([]);
    currentWaveformRef.current = [];

    // Build payload matching backend API
    const basePayload = {
      consultationId,
      frequency: selectedFrequency, // Add frequency field
      level: stimulusLevel,
      maxLevel: stopLevel,
      step: increment,
      stopWhenFound: true,
      quick: false,
      stimulusDuration: stimulusDuration,
      contraTransducerID: contraTransducerID || "", // Empty string if not available (for IPSI mode)
      deflectionThreshold: deflectionThreshold,
    };

    if (selectedMode === "BOTH") {
      // For BOTH mode, emit IPSI first, then CONTRA
      const ipsiPayload = { ...basePayload, isContralateral: false };
      console.log("[Reflexes] Emitting start-reflexes (IPSI):", {
        ...ipsiPayload,
        ipsiTransducerID: ipsiTransducer?.ID,
        ipsiTransducerName: ipsiTransducer?.Name,
      });
      socket.emit("start-reflexes", ipsiPayload);
      // Small delay before starting CONTRA
      setTimeout(() => {
        const contraPayload = { ...basePayload, isContralateral: true };
        console.log("[Reflexes] Emitting start-reflexes (CONTRA):", {
          ...contraPayload,
          contraTransducerID: contraTransducerID,
          contraTransducerName: contraTransducer?.Name,
          contraTransducerEarType: contraTransducer?.EarType,
          isCorrect: contraTransducer?.EarType === 1,
        });
        socket.emit("start-reflexes", contraPayload);
      }, 100);
      toast.info(`Testing IPSI+CONTRA reflex at ${selectedFrequency}Hz`);
    } else {
      const payload = { ...basePayload, isContralateral: selectedMode === "CONTRA" };
      console.log("[Reflexes] Emitting start-reflexes:", {
        ...payload,
        mode: selectedMode,
        isContralateral: payload.isContralateral,
        contraTransducerID: selectedMode === "CONTRA" ? contraTransducerID : "N/A (IPSI mode)",
        contraTransducerName: selectedMode === "CONTRA" ? contraTransducer?.Name : "N/A",
        contraTransducerEarType: contraTransducer?.EarType,
      });
      socket.emit("start-reflexes", payload);
      toast.info(`Testing ${selectedMode} reflex at ${selectedFrequency}Hz`);
    }
  }, [socket, consultationId, selectedMode, selectedFrequency, stimulusLevel, stopLevel, increment, stimulusDuration, contraTransducerID, deflectionThreshold, contraTransducer, deviceState]);

  // Stop current measurement
  const handleStop = useCallback(() => {
    if (!socket) return;

    socket.emit("stop-reflexes", {
      consultationId,
    });

    setIsRunning(false);
    setCurrentWaveform([]);
  }, [socket, consultationId]);

  // Run all reflexes for current ear (IPSI and CONTRA for all frequencies)
  const handleRunAll = useCallback(async () => {
    if (!socket) {
      toast.error("Socket not connected");
      return;
    }

    setIsRunning(true);
    toast.info(`Running all reflexes for ${selectedEar === "L" ? "Left" : "Right"} ear`);

    const basePayload = {
      consultationId,
      frequency: selectedFrequency, // Add frequency field
      level: stimulusLevel,
      maxLevel: stopLevel,
      step: increment,
      stopWhenFound: true,
      quick: true, // Quick mode for run-all
      stimulusDuration: stimulusDuration,
      contraTransducerID: contraTransducerID,
      deflectionThreshold: deflectionThreshold,
    };

    // Emit IPSI test
    const ipsiPayload = { ...basePayload, isContralateral: false };
    console.log("[Reflexes] RunAll - Emitting start-reflexes (IPSI):", ipsiPayload);
    socket.emit("start-reflexes", ipsiPayload);

    // Emit CONTRA test after short delay
    setTimeout(() => {
      const contraPayload = { ...basePayload, isContralateral: true };
      console.log("[Reflexes] RunAll - Emitting start-reflexes (CONTRA):", contraPayload);
      socket.emit("start-reflexes", contraPayload);
    }, 100);
  }, [socket, consultationId, selectedEar, selectedFrequency, stimulusLevel, stopLevel, increment, stimulusDuration, contraTransducerID, deflectionThreshold]);

  // Mark ear as complete
  const handleCompleteEar = useCallback(() => {
    const earReadings = Array.from(readings.entries())
      .filter(([key]) => key.startsWith(selectedEar))
      .length;

    if (earReadings < 8) {
      toast.warning(`Only ${earReadings}/8 reflexes measured for ${selectedEar === "L" ? "Left" : "Right"} ear`);
    }

    setCompletedEars(prev => new Set(prev).add(selectedEar));
    toast.success(`${selectedEar === "L" ? "Left" : "Right"} ear completed`);
  }, [selectedEar, readings]);

  // Switch ear
  const handleEarSwitch = (ear: "L" | "R") => {
    if (isRunning) {
      toast.error("Please stop the current test first");
      return;
    }
    setSelectedEar(ear);
  };

  // Save results - accepts optional ear parameter to save specific ear
  const saveResults = useCallback(async (earToSave?: "L" | "R") => {
    if (!consultation) {
      toast.error("Consultation data not available");
      console.error("[Reflexometry] Cannot save: consultation not available");
      return;
    }

    const consultationData = consultation as ConsultationModelData;
    const targetEar = earToSave || selectedEar; // Use provided ear or selectedEar

    // Check if we have readings for the target ear
    const currentEarReadings = Array.from(readings.values()).filter(r => r.ear === targetEar);
    if (currentEarReadings.length === 0) {
      toast.error(`No readings available for ${targetEar === "L" ? "Left" : "Right"} ear. Please complete the test first.`);
      console.error("[Reflexometry] Cannot save: no readings for target ear", {
        targetEar,
        selectedEar,
        totalReadings: readings.size,
        allReadings: Array.from(readings.keys()),
      });
      return;
    }

    console.log("[Reflexometry] Starting save process:", {
      targetEar,
      selectedEar,
      readingsCount: currentEarReadings.length,
      readingKeys: currentEarReadings.map(r => `${r.ear}-${r.mode}-${r.frequency}`),
    });

    // Transform current ear readings to backend schema format
    const currentEarResponses = currentEarReadings.map(r => {
        // Extract compliance data from waveform
        const complianceData = r.waveformData.map(point => point.amplitude);
        
        // Verify CONTRA mapping
        const earType = r.mode === "CONTRA" ? 1 : 0;  // 0 = IPSI, 1 = CONTRA
        if (r.mode === "CONTRA") {
          console.log("[Reflexometry] CONTRA response being saved:", {
            ear: r.ear,
            mode: r.mode,
            frequency: r.frequency,
            earType: earType,
            expectedEarType: 1,
            isCorrect: earType === 1,
            contraTransducerID: contraTransducer?.ID,
            contraTransducerName: contraTransducer?.Name,
          });
        }
        
        return {
          ear: r.ear === "L" ? "LEFT" : "RIGHT",
          earType: earType,  // 0 = IPSI, 1 = CONTRA
          signalType: 0,  // Pure tone (0), can be adjusted if needed
          frequencyHz: r.frequency,
          stimulusDurationMs: stimulusDuration,
          samplesWithStimulusOn: complianceData.length,
          levelDb: r.threshold || 0,  // Final level where reflex was found/not found
          startingLevelDb: stimulusLevel,  // Starting level (80 dB)
          complianceData: complianceData,
          possibleReflex: r.isPresent,  // true if reflex present, false if absent
          deflectionThreshold: deflectionThreshold,
          mode: r.mode,  // "IPSI" or "CONTRA"
        };
      });

    // Merge with existing responses from other ear (if any)
    const existingResponses = (consultationData as any)?.reflexometry?.responses || [];
    const otherEarResponses = existingResponses.filter((r: any) => {
      const earStr = targetEar === "L" ? "LEFT" : "RIGHT";
      return r.ear !== earStr;  // Keep responses from the other ear
    });
    
    // Combine: other ear responses + current ear responses
    const allResponses = [...otherEarResponses, ...currentEarResponses];

    // Create reflexometry test data - matching pattern from tympanometry/ETF
    const reflexTest = {
      sessionId: consultationData.id, // Add sessionId like tympanometry
      status: TestStatus.COMPLETED,
      ipsiTransducerId: ipsiTransducer?.ID || "",
      ipsiTransducerName: ipsiTransducer?.Name || "IPSI Transducer",
      contraTransducerId: contraTransducer?.ID || "",
      contraTransducerName: contraTransducer?.Name || "CONTRA Transducer",
      responses: allResponses,
      createdAt: (consultationData as any)?.reflexometry?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update consultation with reflexometry data
    const updatedConsultation: ConsultationModelData = {
      ...consultationData,
      reflexometry: reflexTest,
      updatedAt: new Date().toISOString(),
    };

    try {
      console.log("[Reflexometry] ========== SAVE START ==========");
      console.log("[Reflexometry] Consultation ID:", consultationId);
      console.log("[Reflexometry] Responses to save:", allResponses.length);
      console.log("[Reflexometry] Responses details:", allResponses.map(r => ({ 
        ear: r.ear, 
        mode: r.mode, 
        freq: r.frequencyHz,
        complianceDataLength: r.complianceData?.length || 0 
      })));
      
      console.log("[Reflexometry] Reflexometry object being saved:", JSON.stringify(reflexTest, null, 2));
      
      console.log("[Reflexometry] Updated consultation object:", {
        id: updatedConsultation.id,
        hasReflexometry: !!(updatedConsultation as any).reflexometry,
        reflexometryType: typeof (updatedConsultation as any).reflexometry,
        reflexometryKeys: (updatedConsultation as any).reflexometry ? Object.keys((updatedConsultation as any).reflexometry) : [],
        allKeys: Object.keys(updatedConsultation).slice(0, 20), // First 20 keys
      });
      
      // Verify reflexometry is actually in the object
      if (!(updatedConsultation as any).reflexometry) {
        console.error("[Reflexometry] ❌ ERROR: reflexometry field is missing from updatedConsultation!");
        toast.error("Failed to prepare data for saving. Please try again.");
        return;
      }
      
      console.log("[Reflexometry] Full payload reflexometry field:", JSON.stringify((updatedConsultation as any).reflexometry, null, 2));
      console.log("[Reflexometry] Full consultation object keys:", Object.keys(updatedConsultation));
      console.log("[Reflexometry] Reflexometry object keys:", updatedConsultation.reflexometry ? Object.keys(updatedConsultation.reflexometry) : []);
      
      const result = await updateConsultationMutation.mutateAsync(updatedConsultation);
      console.log("[Reflexometry] Save mutation result type:", typeof result);
      console.log("[Reflexometry] Save mutation result:", result);
      
      // Verify the save - ConsultationModel has { success, message, data } structure
      let savedData: any = null;
      if (result && typeof result === 'object') {
        // Check if result has data property (ConsultationModel structure)
        if ('data' in result) {
          const responseData = (result as any).data;
          // data can be ConsultationModelData, ConsultationModelData[], or null
          if (Array.isArray(responseData)) {
            savedData = responseData[0]; // Take first if array
          } else {
            savedData = responseData; // Single object or null
          }
          console.log("[Reflexometry] Extracted data from result.data:", {
            isArray: Array.isArray((result as any).data),
            dataType: typeof (result as any).data,
            hasReflexometry: !!savedData?.reflexometry,
          });
        } else {
          // Result might be the data directly (shouldn't happen but handle it)
          savedData = result;
          console.log("[Reflexometry] Using result directly (no data wrapper)");
        }
      }
      
      console.log("[Reflexometry] Saved data verification:", {
        hasResult: !!result,
        resultKeys: result ? Object.keys(result) : [],
        hasData: !!savedData,
        savedDataKeys: savedData ? Object.keys(savedData) : [],
        hasReflexometry: !!savedData?.reflexometry,
        reflexometryStatus: savedData?.reflexometry?.status,
        responsesCount: savedData?.reflexometry?.responses?.length,
        savedReflexometry: savedData?.reflexometry,
      });
      
      if (!savedData?.reflexometry) {
        console.warn("[Reflexometry] ⚠️ Save may have failed - reflexometry not found in response");
        console.warn("[Reflexometry] Response structure:", JSON.stringify(result, null, 2));
        toast.warning("Save completed but verification failed. Please refresh and check the report.");
      } else {
        console.log("[Reflexometry] ✅ Results saved and verified successfully");
        toast.success("Results saved successfully!");
      }

      // Add target ear to completed set
      const newCompletedEars = new Set(completedEars);
      newCompletedEars.add(targetEar);
      setCompletedEars(newCompletedEars);

      // Check if both ears are completed
      if (newCompletedEars.size === 2) {
        toast.success("Both ears completed! You can now view the report.");
        // Don't automatically navigate - let user click "View Report" button
      } else {
        const remainingEar = targetEar === "L" ? "Right" : "Left";
        toast.success(
          `${targetEar === "L" ? "Left" : "Right"} ear completed and saved! Please test the ${remainingEar} ear.`
        );

        // Only switch ears if we're saving the currently selected ear (not auto-saving a different ear)
        if (targetEar === selectedEar) {
          // Switch to the other ear automatically
          setSelectedEar(targetEar === "L" ? "R" : "L");
          // Clear readings for the next ear
          setReadings(prev => {
            const newMap = new Map(prev);
            // Keep only readings from the other ear
            for (const [key, reading] of newMap.entries()) {
              if (reading.ear === targetEar) {
                newMap.delete(key);
              }
            }
            return newMap;
          });
          setCurrentWaveform([]);
          setIsRunning(false);
        }
      }
    } catch (error: any) {
      console.error("Error saving results:", error);
      toast.error(error?.message || "Failed to save results");
    }
  }, [consultation, consultationId, readings, updateConsultationMutation, selectedEar, completedEars, ipsiTransducer, contraTransducer, stimulusLevel, stimulusDuration, deflectionThreshold]);

  // Check if all tests are complete for ANY ear and auto-save
  useEffect(() => {
    if (isRunning) return; // Don't check while test is running
    if (!consultation) return; // Need consultation data to save
    if (isInitialLoadRef.current) return; // Don't auto-save during initial data load
    
    // Check BOTH ears, not just selectedEar
    const earsToCheck: ("L" | "R")[] = ["L", "R"];
    
    earsToCheck.forEach(ear => {
      // Skip if already completed
      if (completedEars.has(ear)) {
        return;
      }
      
      // Check if all 8 readings exist for this ear (4 frequencies x 2 modes: IPSI + CONTRA)
      const earReadings = Array.from(readings.values()).filter(r => r.ear === ear);
      
      // Verify we have both IPSI and CONTRA for all 4 frequencies
      const requiredKeys = FREQUENCIES.flatMap(freq => [
        getReadingKey(ear, "IPSI", freq),
        getReadingKey(ear, "CONTRA", freq),
      ]);
      
      const hasAllReadings = requiredKeys.every(key => readings.has(key));
      
      console.log(`[Reflexometry] Auto-save check for ${ear === "L" ? "Left" : "Right"} ear:`, {
        earReadingsCount: earReadings.length,
        requiredKeysCount: requiredKeys.length,
        hasAllReadings,
        requiredKeys: requiredKeys,
        actualKeys: requiredKeys.filter(key => readings.has(key)),
        missingKeys: requiredKeys.filter(key => !readings.has(key)),
      });
      
      if (hasAllReadings && earReadings.length >= 8) {
        console.log(`[Reflexometry] ✅ All 8 tests complete for ${ear === "L" ? "Left" : "Right"} ear - auto-saving...`);
        
        // Mark as completed
        setCompletedEars(prev => new Set(prev).add(ear));
        
        // Auto-save if not already saved for this ear
        if (!autoSavedEarsRef.current.has(ear)) {
          autoSavedEarsRef.current.add(ear);
          
          // Auto-save the results - pass the ear parameter
          const earName = ear === "L" ? "Left" : "Right";
          console.log(`[Reflexometry] Auto-saving ${earName} ear results...`);
          console.log(`[Reflexometry] Readings for ${earName} ear:`, earReadings.length);
          
          // Call saveResults with the specific ear
          saveResults(ear).catch(error => {
            console.error(`[Reflexometry] Auto-save failed for ${earName} ear:`, error);
          });
        }
      }
    });
  }, [readings, isRunning, completedEars, consultation, saveResults, selectedEar]);

  // Reset current ear
  const handleReset = () => {
    if (isRunning) {
      toast.error("Please stop the current test first");
      return;
    }

    // Remove readings for current ear
    setReadings(prev => {
      const newMap = new Map(prev);
      for (const key of newMap.keys()) {
        if (key.startsWith(selectedEar)) {
          newMap.delete(key);
        }
      }
      return newMap;
    });

    setCompletedEars(prev => {
      const newSet = new Set(prev);
      newSet.delete(selectedEar);
      return newSet;
    });

    toast.success("Reset complete");
  };

  // Count readings for current ear
  const currentEarReadingsCount = Array.from(readings.keys()).filter(k => k.startsWith(selectedEar)).length;

  return (
    <div className="p-6 lg:pr-80">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Acoustic Reflex Test</h1>

        {/* Ear Selection */}
        <div className="mb-4 flex gap-2 items-center">
          <span className="text-sm font-medium mr-2">Ear:</span>
          <button
            onClick={() => handleEarSwitch("L")}
            disabled={isRunning}
            className={`px-4 py-2 rounded text-sm font-medium transition-all ${
              selectedEar === "L"
                ? "bg-blue-500 text-white"
                : completedEars.has("L")
                ? "bg-green-500 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            } ${isRunning ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Left {completedEars.has("L") && "✓"}
          </button>
          <button
            onClick={() => handleEarSwitch("R")}
            disabled={isRunning}
            className={`px-4 py-2 rounded text-sm font-medium transition-all ${
              selectedEar === "R"
                ? "bg-red-500 text-white"
                : completedEars.has("R")
                ? "bg-green-500 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            } ${isRunning ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Right {completedEars.has("R") && "✓"}
          </button>

          <div className="ml-auto flex items-center gap-2 text-sm">
            <span className="text-gray-500">{probeStatus}</span>
            <span className="font-medium">{earCanalVolume.toFixed(2)} ml</span>
          </div>
        </div>

        {/* Reflex Grid - 2 rows (IPSI/CONTRA) x 4 columns (frequencies) */}
        <div className="bg-white border rounded-lg shadow-sm p-4 mb-6">
          {/* Mode Selection Row - IPSI, CONTRA, BOTH */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setSelectedMode("IPSI")}
              disabled={isRunning}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                selectedMode === "IPSI"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              } ${isRunning ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              IPSI Only
            </button>
            <button
              onClick={() => setSelectedMode("CONTRA")}
              disabled={isRunning}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                selectedMode === "CONTRA"
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              } ${isRunning ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              CONTRA Only
            </button>
            <button
              onClick={() => setSelectedMode("BOTH")}
              disabled={isRunning}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                selectedMode === "BOTH"
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              } ${isRunning ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              IPSI + CONTRA
            </button>
          </div>

          <div className="grid grid-cols-5 gap-3">
            {/* Header row */}
            <div className="flex items-center justify-center">
              <span className="text-sm font-bold text-gray-700">Mode</span>
            </div>
            {FREQUENCIES.map(freq => (
              <div key={freq} className="text-center">
                <span className="text-sm font-semibold text-gray-600">
                  {freq >= 1000 ? `${freq / 1000}kHz` : `${freq}Hz`}
                </span>
              </div>
            ))}

            {/* IPSI row */}
            <div className="flex items-center">
              <span className={`w-full py-2 px-3 rounded text-sm font-medium text-center ${
                selectedMode === "IPSI" || selectedMode === "BOTH"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-50 text-gray-600"
              }`}>
                IPSI
              </span>
            </div>
            {FREQUENCIES.map(freq => {
              const key = getReadingKey(selectedEar, "IPSI", freq);
              const reading = readings.get(key) || null;
              // Active if selected OR if this cell is receiving live data
              const isSelected = (selectedMode === "IPSI" || selectedMode === "BOTH") && selectedFrequency === freq;
              // This cell is running if we're getting live data for this freq+mode
              const isThisCellRunning = isRunning && activeTestFrequency === freq && activeTestMode === "IPSI";
              return (
                <ReflexGraph
                  key={key}
                  reading={reading}
                  frequency={freq}
                  mode="IPSI"
                  ear={selectedEar}
                  isActive={isSelected || isThisCellRunning}
                  isRunning={isThisCellRunning}
                  liveWaveform={isThisCellRunning ? currentWaveform : undefined}
                  onClick={() => {
                    if (selectedMode !== "BOTH") setSelectedMode("IPSI");
                    setSelectedFrequency(freq);
                  }}
                />
              );
            })}

            {/* CONTRA row */}
            <div className="flex items-center">
              <span className={`w-full py-2 px-3 rounded text-sm font-medium text-center ${
                selectedMode === "CONTRA" || selectedMode === "BOTH"
                  ? "bg-orange-100 text-orange-700"
                  : "bg-gray-50 text-gray-600"
              }`}>
                CONTRA
              </span>
            </div>
            {FREQUENCIES.map(freq => {
              const key = getReadingKey(selectedEar, "CONTRA", freq);
              const reading = readings.get(key) || null;
              // Active if selected OR if this cell is receiving live data
              const isSelected = (selectedMode === "CONTRA" || selectedMode === "BOTH") && selectedFrequency === freq;
              // This cell is running if we're getting live data for this freq+mode
              const isThisCellRunning = isRunning && activeTestFrequency === freq && activeTestMode === "CONTRA";
              return (
                <ReflexGraph
                  key={key}
                  reading={reading}
                  frequency={freq}
                  mode="CONTRA"
                  ear={selectedEar}
                  isActive={isSelected || isThisCellRunning}
                  isRunning={isThisCellRunning}
                  liveWaveform={isThisCellRunning ? currentWaveform : undefined}
                  onClick={() => {
                    if (selectedMode !== "BOTH") setSelectedMode("CONTRA");
                    setSelectedFrequency(freq);
                  }}
                />
              );
            })}
          </div>

          {/* Progress indicator */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>
              {selectedEar === "L" ? "Left" : "Right"} Ear: {currentEarReadingsCount}/8 reflexes measured
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleRunAll}
                disabled={isRunning}
                className="px-3 py-1 bg-purple-500 text-white rounded text-xs font-medium hover:bg-purple-600 disabled:opacity-50"
              >
                Run All
              </button>
            </div>
          </div>
        </div>

        {/* Current Selection Info */}
        <div className="bg-gray-50 border rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <span className={`text-lg font-semibold ${
                selectedMode === "BOTH" ? "text-purple-600" : 
                selectedMode === "IPSI" ? "text-blue-600" : "text-orange-600"
              }`}>
                {selectedMode === "BOTH" ? "IPSI+CONTRA" : selectedMode} @ {selectedFrequency >= 1000 ? `${selectedFrequency / 1000}kHz` : `${selectedFrequency}Hz`}
              </span>
              <span className="ml-4 text-gray-600">
                Level: {stimulusLevel} dB HL
              </span>
            </div>
            <div className="flex gap-2">
              {!isRunning ? (
                <button
                  onClick={handleStart}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-all"
                >
                  Start
                </button>
              ) : (
                <button
                  onClick={handleStop}
                  className="px-6 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-all"
                >
                  Stop
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Controls Panel */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-10 w-64 hidden lg:block print:hidden">
        <div className="bg-white shadow-lg rounded-lg p-3 border">
          <div className="text-sm font-semibold mb-3 text-center">Test Controls</div>

          {/* Start Level */}
          <div className="mb-3">
            <label className="block text-[10px] font-medium mb-1">Start Level (dB)</label>
            <div className="flex items-center gap-1">
              <button
                className="px-2 py-1 bg-gray-200 rounded text-xs"
                onClick={() => setStimulusLevel(Math.max(80, stimulusLevel - 5))}
                disabled={isRunning}
              >
                -
              </button>
              <span className="flex-1 text-center text-sm font-medium">{stimulusLevel}</span>
              <button
                className="px-2 py-1 bg-gray-200 rounded text-xs"
                onClick={() => setStimulusLevel(Math.min(stopLevel - 5, stimulusLevel + 5))}
                disabled={isRunning}
              >
                +
              </button>
            </div>
          </div>

          {/* Stop Level */}
          <div className="mb-3">
            <label className="block text-[10px] font-medium mb-1">Stop Level (dB)</label>
            <div className="flex items-center gap-1">
              <button
                className="px-2 py-1 bg-gray-200 rounded text-xs"
                onClick={() => setStopLevel(Math.max(stimulusLevel + 5, stopLevel - 5))}
                disabled={isRunning}
              >
                -
              </button>
              <span className="flex-1 text-center text-sm font-medium">{stopLevel}</span>
              <button
                className="px-2 py-1 bg-gray-200 rounded text-xs"
                onClick={() => setStopLevel(Math.min(110, stopLevel + 5))}
                disabled={isRunning}
              >
                +
              </button>
            </div>
          </div>

          {/* Increment */}
          <div className="mb-3">
            <label className="block text-[10px] font-medium mb-1">Increment (dB)</label>
            <div className="flex gap-1">
              {[0, 5, 10].map(inc => (
                <button
                  key={inc}
                  className={`flex-1 px-2 py-1 rounded text-xs ${
                    increment === inc ? "bg-blue-500 text-white" : "bg-gray-200"
                  }`}
                  onClick={() => setIncrement(inc)}
                  disabled={isRunning}
                >
                  {inc} dB
                </button>
              ))}
            </div>
          </div>

          {/* Stimulus Duration */}
          <div className="mb-3">
            <label className="block text-[10px] font-medium mb-1">Stimulus Duration (ms)</label>
            <div className="flex gap-1">
              {[500, 1000, 2000].map((duration) => (
                <button
                  key={duration}
                  className={`flex-1 px-1 py-1 rounded text-[10px] ${
                    stimulusDuration === duration
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  }`}
                  onClick={() => setStimulusDuration(duration)}
                  disabled={isRunning}
                >
                  {duration}
                </button>
              ))}
            </div>
          </div>

          {/* Deflection Threshold */}
          <div className="mb-3">
            <label className="block text-[10px] font-medium mb-1">Deflection Threshold</label>
            <div className="flex gap-1">
              {[0.025, 0.03, 0.05].map((threshold) => (
                <button
                  key={threshold}
                  className={`flex-1 px-1 py-1 rounded text-[10px] ${
                    deflectionThreshold === threshold
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  }`}
                  onClick={() => setDeflectionThreshold(threshold)}
                  disabled={isRunning}
                >
                  {threshold}
                </button>
              ))}
            </div>
          </div>

          {/* Frequency Selection */}
          <div className="mb-3 border-t pt-3">
            <label className="block text-[10px] font-medium mb-1">Frequency</label>
            <div className="grid grid-cols-2 gap-1">
              {FREQUENCIES.map(freq => (
                <button
                  key={freq}
                  className={`px-2 py-1 rounded text-[10px] ${
                    selectedFrequency === freq ? "bg-blue-500 text-white" : "bg-gray-200"
                  }`}
                  onClick={() => setSelectedFrequency(freq)}
                  disabled={isRunning}
                >
                  {freq >= 1000 ? `${freq / 1000}kHz` : `${freq}Hz`}
                </button>
              ))}
            </div>
          </div>

          {/* Mode Selection */}
          <div className="mb-3">
            <label className="block text-[10px] font-medium mb-1">Mode</label>
            <div className="flex gap-1">
              <button
                className={`flex-1 px-1 py-1 rounded text-[10px] ${
                  selectedMode === "IPSI" ? "bg-blue-500 text-white" : "bg-gray-200"
                }`}
                onClick={() => setSelectedMode("IPSI")}
                disabled={isRunning}
              >
                IPSI
              </button>
              <button
                className={`flex-1 px-1 py-1 rounded text-[10px] ${
                  selectedMode === "CONTRA" ? "bg-orange-500 text-white" : "bg-gray-200"
                }`}
                onClick={() => setSelectedMode("CONTRA")}
                disabled={isRunning}
              >
                CONTRA
              </button>
              <button
                className={`flex-1 px-1 py-1 rounded text-[10px] ${
                  selectedMode === "BOTH" ? "bg-purple-500 text-white" : "bg-gray-200"
                }`}
                onClick={() => setSelectedMode("BOTH")}
                disabled={isRunning}
              >
                BOTH
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-1 border-t pt-3">
            <button
              onClick={handleCompleteEar}
              disabled={isRunning || currentEarReadingsCount === 0}
              className="w-full px-2 py-1.5 bg-blue-500 text-white rounded text-[10px] font-medium hover:bg-blue-600 disabled:opacity-50"
            >
              Complete {selectedEar === "L" ? "Left" : "Right"} Ear
            </button>
            <button
              onClick={handleReset}
              disabled={isRunning}
              className="w-full px-2 py-1.5 bg-gray-500 text-white rounded text-[10px] font-medium hover:bg-gray-600 disabled:opacity-50"
            >
              Reset Ear
            </button>
            {readings.size > 0 && (
              <button
                onClick={() => {
                  console.log("[Reflexometry] Manual save triggered, readings:", readings.size);
                  saveResults();
                }}
                disabled={updateConsultationMutation.isPending}
                className="w-full px-2 py-1.5 bg-green-500 text-white rounded text-[10px] font-medium hover:bg-green-600 disabled:opacity-50"
              >
                {updateConsultationMutation.isPending ? "Saving..." : "Save Results"}
              </button>
            )}
            {((consultation as any)?.reflexometry || completedEars.size >= 1) && (
              <button
                onClick={() => router.push(ROUTES.REFLEXOMETRY_REPORT(consultationId))}
                className="w-full px-2 py-1.5 bg-blue-500 text-white rounded text-[10px] font-medium hover:bg-blue-600"
              >
                View Report
              </button>
            )}
            <button
              onClick={() => router.push(ROUTES.CONSULTATION_TEST_SELECTION(consultationId))}
              className="w-full px-2 py-1.5 bg-gray-300 text-gray-700 rounded text-[10px] font-medium hover:bg-gray-400"
            >
              Back to Tests
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

