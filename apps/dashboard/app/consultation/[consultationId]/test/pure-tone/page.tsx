"use client";
import React, { useState, useCallback, useMemo, useEffect } from "react";
  import { useQueryClient } from "@tanstack/react-query";
import PureToneGraph, { FREQUENCIES, HEARING_LEVELS } from "./_components/audiogram";
import { useSocket } from "@/providers/socket-provider";
import { useParams } from "next/navigation";
import { useDevice } from "@/providers/device-provider";
import PureToneLoadingSkeleton from "./_components/loading-skeleton";
import { useUpdateConsultation } from "@/hooks/consultation/use-update-consultation";
import { TestStatus, Ear, SignalType } from "@/models/enums";
import { useGetConsultation } from "@/hooks/consultation/use-get-consultation";
import { ConsultationModelData } from "@/models/consultation.model";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const SIGNAL_TYPE_MAP = {
  0: SignalType.Steady,
  1: SignalType.Warble,
  2: SignalType.NB,
  3: SignalType.White,
  4: SignalType.SpeechNoise,
};

interface TestResult {
  ear: string;
  x: number;
  y: number;
  mode: string;
  masking: number;
  noResponse: number;
  signalType: SignalType;
  pulsed: boolean;
}

interface TransducerData {
  Transducers: Array<{
    ID?: string;
    Name?: string;
    HF?: boolean;
    CalibrationDate?: string;
    ConductionType: number;
    Calibrations: Array<{
      SignalType: number;
      CalibrationFrequencies: Array<{
        Frequency: number;
        MaxLevelHL: number;
        MinLevelHL: number;
        Calibration: number;
      }>;
    }>;
    SignalTypes: number[];
    EarSides: number[];
    Rates?: number[];
  }>;
}

export default function PureTonePage() {
  const [isPatientResponse, setIsPatientResponse] = useState(false);
  const [selectedEar, setSelectedEar] = useState<"L" | "R">("R");
  const [selectedMode, setSelectedMode] = useState<"AC" | "BC">("AC");
  const [selectedFrequency, setSelectedFrequency] = useState(1000);
  const [selectedLevel, setSelectedLevel] = useState(25);
  const [selectedSignalType, setSelectedSignalType] = useState<SignalType>(
    SignalType.Steady
  );
  const [isPulsed, setIsPulsed] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [acTestResults, setAcTestResults] = useState<TestResult[]>([]);
  const [bcTestResults, setBcTestResults] = useState<TestResult[]>([]);
  // Track last N added results for undo support
  const [recentResults, setRecentResults] = useState<TestResult[]>([]);
  // Masking playback state: true when masking noise is actually playing
  const [isMaskingActive, setIsMaskingActive] = useState(false);
  const [selectedLabelIndexes, setSelectedLabelIndexes] = useState({
    x: FREQUENCIES.findIndex(f => f === 1000), // Index 4 for 1000Hz
    y: HEARING_LEVELS.findIndex(h => h === 25), // Index 7 for 25dB
  }); // Default to 1000Hz, 25dB
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMasking, setIsMasking] = useState(false);
  const [maskingLevel, setMaskingLevel] = useState(0);
  const [transducerData, setTransducerData] = useState<TransducerData | null>(
    null
  );
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  // NACK dialog state
  const [showNackDialog, setShowNackDialog] = useState(false);
  const [nackMessage, setNackMessage] = useState("");

  // Dummy transducer data for testing
  const dummyTransducerData: TransducerData = {
    Transducers: [
      {
        ID: "8dc59de7-2e27-45cf-8b74-8b5fc09819d4",
        Name: "CAEP8",
        HF: false,
        CalibrationDate: "2025-02-24",
        ConductionType: 0, // Air Conduction
        EarSides: [0, 1], // Left=0, Right=1
        SignalTypes: [0, 1, 2, 3, 4, 7], // Steady, Warble, NB, White, SpeechNoise, Speech
        Rates: [0.5, 1.0, 2.0],
        Calibrations: [
          {
            SignalType: 0, // Steady
            CalibrationFrequencies: [
              { Frequency: 125, MaxLevelHL: 90, MinLevelHL: -10, Calibration: 38 },
              { Frequency: 250, MaxLevelHL: 105, MinLevelHL: -10, Calibration: 23 },
              { Frequency: 500, MaxLevelHL: 110, MinLevelHL: -10, Calibration: 18 },
              { Frequency: 750, MaxLevelHL: 105, MinLevelHL: -10, Calibration: 24 },
              { Frequency: 1000, MaxLevelHL: 110, MinLevelHL: -10, Calibration: 18 },
              { Frequency: 1500, MaxLevelHL: 100, MinLevelHL: -10, Calibration: 23 },
              { Frequency: 2000, MaxLevelHL: 105, MinLevelHL: -10, Calibration: 23 },
              { Frequency: 3000, MaxLevelHL: 110, MinLevelHL: -10, Calibration: 20 },
              { Frequency: 4000, MaxLevelHL: 110, MinLevelHL: -10, Calibration: 23 },
              { Frequency: 6000, MaxLevelHL: 90, MinLevelHL: -10, Calibration: 38 },
              { Frequency: 8000, MaxLevelHL: 80, MinLevelHL: -10, Calibration: 48 }
            ]
          },
          {
            SignalType: 1, // Warble
            CalibrationFrequencies: [
              { Frequency: 125, MaxLevelHL: 90, MinLevelHL: -10, Calibration: 38 },
              { Frequency: 250, MaxLevelHL: 105, MinLevelHL: -10, Calibration: 23 },
              { Frequency: 500, MaxLevelHL: 110, MinLevelHL: -10, Calibration: 18 },
              { Frequency: 750, MaxLevelHL: 105, MinLevelHL: -10, Calibration: 24 },
              { Frequency: 1000, MaxLevelHL: 110, MinLevelHL: -10, Calibration: 18 },
              { Frequency: 1500, MaxLevelHL: 100, MinLevelHL: -10, Calibration: 23 },
              { Frequency: 2000, MaxLevelHL: 105, MinLevelHL: -10, Calibration: 23 },
              { Frequency: 3000, MaxLevelHL: 110, MinLevelHL: -10, Calibration: 20 },
              { Frequency: 4000, MaxLevelHL: 110, MinLevelHL: -10, Calibration: 23 },
              { Frequency: 6000, MaxLevelHL: 90, MinLevelHL: -10, Calibration: 38 },
              { Frequency: 8000, MaxLevelHL: 80, MinLevelHL: -10, Calibration: 48 }
            ]
          }
        ]
      },
      {
        ID: "a0b4d9cd-66ac-4eb7-a1f9-135804a5bd4c",
        Name: "B71",
        HF: false,
        CalibrationDate: "2025-02-24",
        ConductionType: 1, // Bone Conduction
        EarSides: [0, 1, 3], // Left=0, Right=1, Both=3
        SignalTypes: [0, 1, 2, 3, 4, 7],
        Rates: [0.5, 1.0, 2.0],
        Calibrations: [
          {
            SignalType: 0, // Steady
            CalibrationFrequencies: [
              { Frequency: 250, MaxLevelHL: 120, MinLevelHL: -10, Calibration: 78 },
              { Frequency: 500, MaxLevelHL: 120, MinLevelHL: -10, Calibration: 58 },
              { Frequency: 750, MaxLevelHL: 120, MinLevelHL: -10, Calibration: 55 },
              { Frequency: 1000, MaxLevelHL: 120, MinLevelHL: -10, Calibration: 50 },
              { Frequency: 1500, MaxLevelHL: 120, MinLevelHL: -10, Calibration: 45 },
              { Frequency: 2000, MaxLevelHL: 120, MinLevelHL: -10, Calibration: 45 },
              { Frequency: 3000, MaxLevelHL: 120, MinLevelHL: -10, Calibration: 48 },
              { Frequency: 4000, MaxLevelHL: 120, MinLevelHL: -10, Calibration: 49 },
              { Frequency: 6000, MaxLevelHL: 120, MinLevelHL: -10, Calibration: 71 },
              { Frequency: 8000, MaxLevelHL: 120, MinLevelHL: -10, Calibration: 0 }
            ]
          }
        ]
      }
    ]
  };
  const socket = useSocket();
  const { consultationId } = useParams();
  const { deviceState } = useDevice();
  const { mutate: updateConsultation } = useUpdateConsultation();
  const { data: consultationResponse } = useGetConsultation(
    consultationId as string
  );
  const consultationData = (consultationResponse as any)?.data as ConsultationModelData | undefined;
  const router = useRouter();
  const queryClient = useQueryClient();

  // Track if data has been initially loaded to prevent overriding local changes
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [justCleared, setJustCleared] = useState(false);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);

  // Load test results - prioritize backend if test is completed, otherwise use localStorage
  useEffect(() => {
    if (!consultationId || hasLoadedFromStorage || !consultationData) return;
    
    const isTestCompleted = consultationData?.audiometry?.status === TestStatus.COMPLETED;
    
    // If test is completed, skip localStorage and load from backend (handled in next useEffect)
    if (isTestCompleted) {
      console.log('✅ Test is completed - will load from backend API');
      setHasLoadedFromStorage(true);
      return;
    }
    
    // If test is NOT completed, load from localStorage for work in progress
    try {
      const storageKey = `pure-tone-audiometry-${consultationId}`;
      const storedData = localStorage.getItem(storageKey);
      
      if (storedData) {
        const parsed = JSON.parse(storedData);
        if (parsed.acTestResults && parsed.bcTestResults) {
          setAcTestResults(parsed.acTestResults);
          setBcTestResults(parsed.bcTestResults);
          setTestResults([...parsed.acTestResults, ...parsed.bcTestResults]);
          console.log('📦 Loaded test results from localStorage (test not completed):', {
            ac: parsed.acTestResults.length,
            bc: parsed.bcTestResults.length
          });
        }
      }
      setHasLoadedFromStorage(true);
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      setHasLoadedFromStorage(true);
    }
  }, [consultationId, consultationData, hasLoadedFromStorage]);

  // Save test results to localStorage whenever they change (preserve even after submission)
  useEffect(() => {
    if (!consultationId || !hasLoadedFromStorage) return;
    
    // Always save to preserve PTA data, even after test completion
    try {
      const storageKey = `pure-tone-audiometry-${consultationId}`;
      const dataToStore = {
        acTestResults,
        bcTestResults,
        timestamp: new Date().toISOString(),
        submitted: consultationData?.audiometry?.status === TestStatus.COMPLETED
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToStore));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, [consultationId, acTestResults, bcTestResults, consultationData?.audiometry?.status, hasLoadedFromStorage]);

  // Socket event listeners for patient response and nack
  useEffect(() => {
    if (!socket) return;
    
    const onPatientResponse = (data: any) => {
      setIsPatientResponse(!!data?.patientResponse);
    };
    
    // Dedicated handler for nack-received (test cannot be performed)
    const handleNackReceived = (data: { message?: string; testId?: string }) => {
      console.warn("⚠️ [PURE-TONE] [NACK Received] Test not ready or error:", data);
      
      // Stop any playing signals by emitting stop signal directly
      if (isPlaying) {
        socket.emit("audiometry-signal", {
          connectionId: consultationId,
          frequency: selectedFrequency,
          level: selectedLevel,
          signal: false,
          pulsed: isPulsed,
          earSide: selectedEar,
          signalType: selectedSignalType,
          conductionType: selectedMode,
          maskingSignal: isMasking,
          maskingLevel: maskingLevel,
        });
        setIsPlaying(false);
      }
      
      // Stop masking if active by emitting stop masking signal directly
      if (isMaskingActive) {
        socket.emit("masking-signal", {
          consultationId: consultationId,
          frequency: selectedFrequency,
          level: maskingLevel,
          signal: false,
          earSide: selectedEar,
        });
        setIsMaskingActive(false);
        setIsMasking(false);
      }
      
      // Extract message
      const errorMessage = data.message || "Test device not ready or test cannot be performed at this time";
      
      // Show big dialog instead of toast - requires audiologist confirmation
      setNackMessage(errorMessage);
      setShowNackDialog(true);
      
      // Log for debugging
      console.error("❌ [PURE-TONE] [NACK] Test cannot proceed:", {
        message: errorMessage,
        testId: data.testId,
        selectedEar,
        selectedFrequency,
        selectedLevel,
        consultationId: consultationId,
      });
    };
    
    socket.on("patient-response", onPatientResponse);
    socket.on("nack-received", handleNackReceived);
    
    return () => {
      socket.off("patient-response", onPatientResponse);
      socket.off("nack-received", handleNackReceived);
    };
  }, [socket, isPlaying, isMaskingActive, selectedEar, selectedFrequency, selectedLevel, selectedMode, selectedSignalType, isPulsed, maskingLevel, isMasking, consultationId]);

  // Populate test results from backend API - prioritize if test is completed
  useEffect(() => {
    if (!consultationData || !hasLoadedFromStorage) return;

    const cd = consultationData as ConsultationModelData;
    const isTestCompleted = cd.audiometry?.status === TestStatus.COMPLETED;
    
    // If test is NOT completed and we already have local data, don't override
    if (!isTestCompleted && (acTestResults.length > 0 || bcTestResults.length > 0)) {
      return; // Keep localStorage data for work in progress
    }
    
    // If test is completed OR we don't have local data, load from backend
    const backendAcCount = cd.audiometry?.acTests?.length || 0;
    const backendBcCount = cd.audiometry?.bcTests?.length || 0;
    
    // Don't reload from backend if we just cleared the results
    if (justCleared) {
      return;
    }
    
    // If test is completed, always load from backend (like report page)
    // If test is not completed but backend has data and we don't, load from backend
    if (!isTestCompleted && backendAcCount === 0 && backendBcCount === 0) {
      return; // No backend data and test not completed, keep local state
    }

    let existingAcResults: TestResult[] = [];
    let existingBcResults: TestResult[] = [];

    // Handle AC tests - load from backend API
    if (cd.audiometry?.acTests && cd.audiometry.acTests.length > 0) {
      existingAcResults = cd.audiometry.acTests
        .filter(test => test.thresholdDb !== null)
        .map((test) => {
          const patientResponded = test.response === true;
          return {
            ear: test.ear === Ear.LEFT ? "L" : "R",
            x: test.frequencyHz,
            y: test.thresholdDb!,
            mode: "AC",
            masking: test.maskingUsed
              ? test.maskingEar === Ear.LEFT
                ? 1
                : 2
              : 0,
            noResponse: patientResponded ? 0 : 1,
            signalType: SignalType.Steady,
            pulsed: false,
          };
        });
    }

    // Handle BC tests - load from backend API
    if (cd.audiometry?.bcTests && cd.audiometry.bcTests.length > 0) {
      existingBcResults = cd.audiometry.bcTests
        .filter(test => test.thresholdDb !== null)
        .map((test) => {
          const patientResponded = test.response === true;
          return {
            ear: test.ear === Ear.LEFT ? "L" : "R",
            x: test.frequencyHz,
            y: test.thresholdDb!,
            mode: "BC",
            masking: test.maskingUsed ? 1 : 0,
            noResponse: patientResponded ? 0 : 1,
            signalType: SignalType.Steady,
            pulsed: false,
          };
        });
    }

    // Update state with backend data
    if (existingAcResults.length > 0 || existingBcResults.length > 0) {
      setAcTestResults(existingAcResults);
      setBcTestResults(existingBcResults);
      setTestResults([...existingAcResults, ...existingBcResults]);
      console.log('📥 Loaded test results from backend API:', {
        ac: existingAcResults.length,
        bc: existingBcResults.length,
        isCompleted: isTestCompleted
      });
      
      // Also save to localStorage for future reference
      try {
        const storageKey = `pure-tone-audiometry-${consultationId}`;
        const dataToStore = {
          acTestResults: existingAcResults,
          bcTestResults: existingBcResults,
          timestamp: new Date().toISOString(),
          submitted: isTestCompleted
        };
        localStorage.setItem(storageKey, JSON.stringify(dataToStore));
      } catch (error) {
        console.error('Failed to save backend data to localStorage:', error);
      }
    }
    
    setHasInitiallyLoaded(true);
  }, [consultationData, consultationId, hasLoadedFromStorage, justCleared, acTestResults.length, bcTestResults.length]);

  // Auto-hide patient response indicator after 3 seconds
  useEffect(() => {
    if (isPatientResponse) {
      // Blink the screen background briefly and float the heading
      const root = document.documentElement;
      root.classList.add("blink-bg");
      const heading = document.querySelector("h1");
      if (heading) (heading as HTMLElement).classList.add("float-heading");
      const timer = setTimeout(() => {
        setIsPatientResponse(false);
        root.classList.remove("blink-bg");
        if (heading) (heading as HTMLElement).classList.remove("float-heading");
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isPatientResponse]);



  // Reset justCleared flag after a delay to allow backend sync
  useEffect(() => {
    if (justCleared) {
      const timer = setTimeout(() => {
        setJustCleared(false);
      }, 2000); // Wait 2 seconds for backend to sync

      return () => clearTimeout(timer);
    }
  }, [justCleared]);

  // Update transducer data only when valid data is received, fallback to dummy data
  useEffect(() => {
    if (deviceState?.transducerResponse?.Transducers) {
      console.log("🎧 [PURE-TONE] ========== TRANSDUCER RESPONSE RECEIVED ==========");
      console.log("🎧 [PURE-TONE] Full Transducer Response:", JSON.stringify(deviceState.transducerResponse, null, 2));
      console.log("🎧 [PURE-TONE] Number of Transducers:", deviceState.transducerResponse.Transducers.length);
      deviceState.transducerResponse.Transducers.forEach((transducer: any, index: number) => {
        console.log(`🎧 [PURE-TONE] Transducer ${index + 1}:`, {
          ID: transducer.ID,
          Name: transducer.Name,
          ConductionType: transducer.ConductionType === 0 ? "AC (Air Conduction)" : "BC (Bone Conduction)",
          HF: transducer.HF,
          CalibrationDate: transducer.CalibrationDate,
          EarSides: transducer.EarSides,
          SignalTypes: transducer.SignalTypes,
          Rates: transducer.Rates,
          CalibrationsCount: transducer.Calibrations?.length || 0,
        });
        transducer.Calibrations?.forEach((cal: any, calIndex: number) => {
          console.log(`🎧 [PURE-TONE]   Calibration ${calIndex + 1} (SignalType: ${cal.SignalType}):`, {
            SignalType: cal.SignalType,
            FrequenciesCount: cal.CalibrationFrequencies?.length || 0,
            Frequencies: cal.CalibrationFrequencies?.map((f: any) => ({
              Frequency: f.Frequency,
              MaxLevelHL: f.MaxLevelHL,
              MinLevelHL: f.MinLevelHL,
              Calibration: f.Calibration,
            })) || [],
          });
          
          // Show dB range table for each frequency
          console.log(`🎧 [PURE-TONE]   📊 dB Range Table for SignalType ${cal.SignalType}:`);
          console.table(
            cal.CalibrationFrequencies?.map((f: any) => ({
              Frequency: `${f.Frequency} Hz`,
              'Min dB HL': f.MinLevelHL,
              'Max dB HL': f.MaxLevelHL,
              'Range': `${f.MinLevelHL} to ${f.MaxLevelHL} dB`,
              'Available Levels': Array.from({ length: Math.floor((f.MaxLevelHL - f.MinLevelHL) / 5) + 1 }, (_, i) => f.MinLevelHL + i * 5).join(', '),
              'Calibration': f.Calibration,
            })) || []
          );
        });
      });
      console.log("🎧 [PURE-TONE] ============================================");
      setTransducerData(deviceState.transducerResponse);
    } else {
      console.log("🎧 [PURE-TONE] No transducer response from device, using dummy data");
      // Use dummy data for testing when no device is connected
      setTransducerData(dummyTransducerData);
    }
  }, [deviceState?.transducerResponse]);

  const currentTransducer = useMemo(() => {
    if (!transducerData?.Transducers) return null;
    const transducer = transducerData.Transducers.find(
      (t) => t.ConductionType === (selectedMode === "AC" ? 0 : 1)
    );
    if (transducer) {
      console.log("🎧 [PURE-TONE] Current Transducer Selected:", {
        mode: selectedMode,
        transducerName: transducer.Name,
        transducerID: transducer.ID,
        conductionType: transducer.ConductionType === 0 ? "AC" : "BC",
        availableSignalTypes: transducer.SignalTypes,
        availableEarSides: transducer.EarSides,
        calibrationsCount: transducer.Calibrations?.length || 0,
      });
    }
    return transducer;
  }, [transducerData, selectedMode]);

  // AC transducer - always used for masking (masking always uses AC headphones)
  const acTransducer = useMemo(() => {
    if (!transducerData?.Transducers) return null;
    return transducerData.Transducers.find(
      (t) => t.ConductionType === 0 // Always AC
    );
  }, [transducerData]);

  const currentCalibration = useMemo(() => {
    if (!currentTransducer) return null;
    return currentTransducer.Calibrations.find(
      (cal) =>
        cal.SignalType ===
        Number(
          Object.entries(SIGNAL_TYPE_MAP).find(
            ([, value]) => value === selectedSignalType
          )?.[0]
        )
    );
  }, [currentTransducer, selectedSignalType]);

  // AC calibration for masking - masking always uses AC headphones regardless of test type
  const acCalibration = useMemo(() => {
    if (!acTransducer) return null;
    return acTransducer.Calibrations.find(
      (cal) =>
        cal.SignalType ===
        Number(
          Object.entries(SIGNAL_TYPE_MAP).find(
            ([, value]) => value === selectedSignalType
          )?.[0]
        )
    );
  }, [acTransducer, selectedSignalType]);

  const availableFrequencies = useMemo(() => {
    if (!currentCalibration) return [];
    const frequencies = currentCalibration.CalibrationFrequencies.filter(
      (freq) => freq.Frequency
    )
      .map((freq) => freq.Frequency)
      .sort((a, b) => a - b);
    
    // Create detailed frequency-dB mapping
    const frequencyDbMap = currentCalibration.CalibrationFrequencies
      .filter((freq) => freq.Frequency > 0) // Exclude -1 (White/SpeechNoise)
      .map((freq) => {
        const levels = [];
        for (let level = freq.MinLevelHL; level <= freq.MaxLevelHL; level += 5) {
          levels.push(level);
        }
        return {
          Frequency: freq.Frequency,
          MinLevelHL: freq.MinLevelHL,
          MaxLevelHL: freq.MaxLevelHL,
          AvailableLevels: levels,
          LevelCount: levels.length,
        };
      })
      .sort((a, b) => a.Frequency - b.Frequency);
    
    console.log("🎵 [PURE-TONE] ========== AVAILABLE FREQUENCIES & dB RANGES ==========");
    console.log("🎵 [PURE-TONE] Mode:", selectedMode);
    console.log("🎵 [PURE-TONE] Signal Type:", selectedSignalType);
    console.log("🎵 [PURE-TONE] Total Frequencies:", frequencies.length);
    console.log("🎵 [PURE-TONE] Frequency List:", frequencies);
    console.log("🎵 [PURE-TONE] 📊 Frequency → dB Range Mapping (MATCHES DROPDOWN OPTIONS):");
    console.table(
      frequencyDbMap.map((f) => ({
        'Frequency (Hz)': f.Frequency,
        'Min dB HL': f.MinLevelHL,
        'Max dB HL': f.MaxLevelHL,
        'dB Range': `${f.MinLevelHL} to ${f.MaxLevelHL} dB`,
        'Available Levels': f.AvailableLevels.join(', '),
        'Total Levels': f.LevelCount,
        'Dropdown Options': `✓ ${f.LevelCount} levels in dropdown`,
      }))
    );
    console.log("🎵 [PURE-TONE] ✅ These values match exactly with the Frequency and Level dropdowns");
    console.log("🎵 [PURE-TONE] ============================================");
    
    return frequencies;
  }, [currentCalibration, selectedMode, selectedSignalType]);

  const availableLevels = useMemo(() => {
    if (!currentCalibration) return [];

    const freqData = currentCalibration.CalibrationFrequencies.find((freq) =>
      // For signal types 3 and 4, use the entry with frequency -1
      selectedSignalType === SignalType.White ||
      selectedSignalType === SignalType.SpeechNoise
        ? freq.Frequency === -1
        : freq.Frequency === selectedFrequency
    );

    if (!freqData) return [];

    // Generate array of levels in steps of 5
    const levels = [];
    for (
      let level = freqData.MinLevelHL;
      level <= freqData.MaxLevelHL;
      level += 5
    ) {
      levels.push(level);
    }
    
    console.log("🎵 [PURE-TONE] Available dB Levels for Frequency:", {
      frequency: selectedFrequency,
      signalType: selectedSignalType,
      minLevelHL: freqData.MinLevelHL,
      maxLevelHL: freqData.MaxLevelHL,
      availableLevels: levels,
      levelCount: levels.length,
      range: `${freqData.MinLevelHL} to ${freqData.MaxLevelHL} dB`,
    });
    
    // Show dropdown options table for verification
    console.log("🎵 [PURE-TONE] 📋 Dropdown Options for Level Select:");
    console.table(
      levels.map((level, idx) => ({
        Index: idx,
        'dB Value': level,
        'In Dropdown': '✓',
      }))
    );
    console.log("🎵 [PURE-TONE] ✅ These values match the dropdown options");
    
    return levels;
  }, [currentCalibration, selectedFrequency, selectedSignalType]);

  // Available masking levels - always use AC calibration since masking always uses AC headphones
  // Masking levels are the same for both AC and BC tests because masking always uses AC headphones
  const availableMaskingLevels = useMemo(() => {
    // Use AC calibration for masking (masking always uses AC headphones regardless of test type)
    const maskingCalibration = acCalibration;
    if (!maskingCalibration) return [];

    const freqData = maskingCalibration.CalibrationFrequencies.find((freq) =>
      selectedSignalType === SignalType.White ||
      selectedSignalType === SignalType.SpeechNoise
        ? freq.Frequency === -1
        : freq.Frequency === selectedFrequency
    );

    if (!freqData) return [];

    // Use AC transducer's max level for masking (no BC-specific limits)
    // Masking always uses AC headphones, so it should have the same levels as AC tests
    const maxMaskingLevel = freqData.MaxLevelHL;

    // Generate array of levels in steps of 5
    const levels = [];
    for (
      let level = freqData.MinLevelHL;
      level <= maxMaskingLevel;
      level += 5
    ) {
      levels.push(level);
    }
    return levels;
  }, [acCalibration, selectedFrequency, selectedSignalType]);

  // Update selected level when frequency or signal type changes
  useEffect(() => {
    if (availableLevels.length > 0) {
      // If current level is not in available levels, set to first available level
      if (!availableLevels.includes(selectedLevel)) {
        setSelectedLevel(availableLevels[0]);
      }
      // Update the y-axis index for the audiogram using HEARING_LEVELS array
      const levelIndex = HEARING_LEVELS.findIndex((l) => l === selectedLevel);
      if (levelIndex !== -1) {
        setSelectedLabelIndexes((prev) => ({ ...prev, y: levelIndex }));
      }
    }
  }, [availableLevels, selectedLevel]);

  // Adjust masking level when it exceeds the available masking levels (e.g., when switching to BC mode)
  useEffect(() => {
    if (availableMaskingLevels.length > 0 && !availableMaskingLevels.includes(maskingLevel)) {
      // Set to the maximum available masking level
      const maxAvailable = availableMaskingLevels[availableMaskingLevels.length - 1];
      setMaskingLevel(maxAvailable);
    }
  }, [availableMaskingLevels, maskingLevel]);

  const availableSignalTypes = useMemo(() => {
    if (!currentTransducer) return [];
    return currentTransducer.SignalTypes.map(
      (type: number) => SIGNAL_TYPE_MAP[type as keyof typeof SIGNAL_TYPE_MAP]
    ).filter(Boolean).filter((type) => type !== SignalType.SpeechNoise);
  }, [currentTransducer]);

  // Reset to Steady if SpeechNoise is selected (since it's removed from dropdown)
  useEffect(() => {
    if (selectedSignalType === SignalType.SpeechNoise) {
      setSelectedSignalType(SignalType.Steady);
    }
  }, [selectedSignalType]);

  const availableEarSides = useMemo<Array<"L" | "R">>(() => {
    if (!currentTransducer) return ["L"];
    return Array.from(
      new Set(
        currentTransducer.EarSides.map(
          (side: number) => (side === 0 ? "L" : "R") // 0 is Left, both 1 and 3 are Right
        )
      )
    );
  }, [currentTransducer]);

  // Send audiometry signal with masking support
  // Note: When masking is enabled, it always uses AC headphones (ConductionType: 0)
  // This applies to both AC and BC tests - masking uses AC headphones regardless of test type
  const _sendAudiometrySignal = useCallback(() => {
    if (socket) {
      const signalData = {
        connectionId: consultationId,
        frequency: selectedFrequency,
        level: selectedLevel,
        signal: true,
        pulsed: isPulsed,
        earSide: selectedEar,
        signalType: selectedSignalType,
        conductionType: selectedMode, // AC or BC for the main signal
        maskingSignal: isMaskingActive, // Masking always uses AC (handled by backend)
        maskingLevel: maskingLevel,
      };
      console.log("🎵 [PURE-TONE] ========== SENDING AUDIOMETRY SIGNAL ==========");
      console.log("🎵 [PURE-TONE] Frequency:", selectedFrequency, "Hz");
      console.log("🎵 [PURE-TONE] Level:", selectedLevel, "dB HL");
      console.log("🎵 [PURE-TONE] Full Signal Data:", JSON.stringify(signalData, null, 2));
      console.log("🎵 [PURE-TONE] ============================================");
      socket.emit("audiometry-signal", signalData);
      setIsPlaying(true);
    }
  }, [
    socket,
    consultationId,
    selectedFrequency,
    selectedLevel,
    selectedEar,
    selectedSignalType,
    selectedMode,
    isMaskingActive,
    maskingLevel,
    isPulsed,
  ]);

  // End audiometry signal with masking support
  // Note: Masking always uses AC headphones for both AC and BC tests
  const _endAudiometrySignal = useCallback(() => {
    if (socket) {
      const signalData = {
        connectionId: consultationId,
        frequency: selectedFrequency,
        level: selectedLevel,
        signal: false,
        pulsed: isPulsed,
        earSide: selectedEar,
        signalType: selectedSignalType,
        conductionType: selectedMode, // AC or BC for the main signal
        maskingSignal: isMasking, // Masking always uses AC (handled by backend)
        maskingLevel: maskingLevel,
      };
      console.log("🎵 [PURE-TONE] ========== STOPPING AUDIOMETRY SIGNAL ==========");
      console.log("🎵 [PURE-TONE] Frequency:", selectedFrequency, "Hz");
      console.log("🎵 [PURE-TONE] Level:", selectedLevel, "dB HL");
      console.log("🎵 [PURE-TONE] ============================================");
      socket.emit("audiometry-signal", signalData);
      setIsPlaying(false);
    }
  }, [
    socket,
    consultationId,
    selectedFrequency,
    selectedLevel,
    selectedEar,
    selectedSignalType,
    selectedMode,
    isMasking,
    maskingLevel,
    isPulsed,
  ]);

  // Emit masking-signal to backend with frequency, level (masking), signal (on/off), and earSide
  // Note: Masking always uses AC headphones (ConductionType: 0) for both AC and BC tests
  // This is the standard approach: AC headphones are used for masking regardless of test type
  const sendMaskingSignal = useCallback(
    (signal: boolean, levelOverride?: number) => {
      if (!socket) return;
      const levelToUse = levelOverride !== undefined ? levelOverride : maskingLevel;
      socket.emit("masking-signal", {
        consultationId: consultationId,
        frequency: selectedFrequency,
        level: levelToUse,
        signal,
        earSide: selectedEar,
        // Masking always uses AC conduction type (handled by backend)
        // This ensures BC masking uses AC headphones, same as AC masking
      });
      setIsMaskingActive(signal);
    },
    [socket, consultationId, selectedFrequency, maskingLevel, selectedEar]
  );

  // Handle mouse down for play tone
  const handleMouseDown = useCallback(() => {
    _sendAudiometrySignal();
  }, [_sendAudiometrySignal]);

  // Handle mouse up for stop tone
  const handleMouseUp = useCallback(() => {
    _endAudiometrySignal();
  }, [_endAudiometrySignal]);

  // Handle mouse leave for stop tone
  const handleMouseLeave = useCallback(() => {
    // _endAudiometrySignal();
  }, [_endAudiometrySignal]);

  // Handle signal type change
  const handleSignalTypeChange = (type: SignalType) => {
    setSelectedSignalType(type);

    // Get the calibration for the new signal type
    const newCalibration = currentTransducer?.Calibrations.find(
      (cal) =>
        cal.SignalType ===
        Number(
          Object.entries(SIGNAL_TYPE_MAP).find(
            ([, value]) => value === type
          )?.[0]
        )
    );

    if (newCalibration) {
      // For White and SpeechNoise, use frequency -1
      if (type === SignalType.White || type === SignalType.SpeechNoise) {
        const freqData = newCalibration.CalibrationFrequencies.find(
          (freq) => freq.Frequency === -1
        );
        if (freqData) {
          setSelectedLevel(freqData.MaxLevelHL);
        }
      } else {
        // For other signal types, use the first available frequency
        const firstFreq = newCalibration.CalibrationFrequencies.filter(
          (freq) => freq.Frequency > 0
        ).sort((a, b) => a.Frequency - b.Frequency)[0];

        if (firstFreq) {
          setSelectedFrequency(firstFreq.Frequency);
          setSelectedLevel(firstFreq.MaxLevelHL);
          const freqIndex = newCalibration.CalibrationFrequencies.filter(
            (freq) => freq.Frequency > 0
          )
            .sort((a, b) => a.Frequency - b.Frequency)
            .findIndex((freq) => freq.Frequency === firstFreq.Frequency);
          if (freqIndex !== -1) {
            setSelectedLabelIndexes((prev) => ({ ...prev, x: freqIndex }));
          }
        }
      }
    }

    if (isPlaying) {
      _endAudiometrySignal();
      _sendAudiometrySignal();
    }
  };

  // Handle frequency change
  const handleFrequencyChange = (freq: number) => {
    // Get the dB range for the new frequency to show in console
    // Access calibration through currentTransducer
    const calibration = currentTransducer?.Calibrations.find(
      (cal) =>
        cal.SignalType ===
        Number(
          Object.entries(SIGNAL_TYPE_MAP).find(
            ([, value]) => value === selectedSignalType
          )?.[0]
        )
    );
    const freqData = calibration?.CalibrationFrequencies.find((f) => f.Frequency === freq);
    const levelsForFreq = freqData 
      ? Array.from({ length: Math.floor((freqData.MaxLevelHL - freqData.MinLevelHL) / 5) + 1 }, 
          (_, i) => freqData.MinLevelHL + i * 5)
      : [];
    
    console.log("🎵 [PURE-TONE] ========== FREQUENCY CHANGED ==========");
    console.log("🎵 [PURE-TONE] Old Frequency:", selectedFrequency, "Hz");
    console.log("🎵 [PURE-TONE] New Frequency:", freq, "Hz");
    console.log("🎵 [PURE-TONE] Mode:", selectedMode);
    console.log("🎵 [PURE-TONE] Ear:", selectedEar);
    if (freqData) {
      console.log("🎵 [PURE-TONE] dB Range for", freq, "Hz:", {
        Min: freqData.MinLevelHL,
        Max: freqData.MaxLevelHL,
        Range: `${freqData.MinLevelHL} to ${freqData.MaxLevelHL} dB`,
        'Available Levels': levelsForFreq.join(', '),
        'Total Levels': levelsForFreq.length,
      });
      console.log("🎵 [PURE-TONE] 📋 Level Dropdown will show", levelsForFreq.length, "options:", levelsForFreq);
      console.table(
        levelsForFreq.map((level, idx) => ({
          Index: idx,
          'dB Value': level,
          'In Dropdown': '✓',
        }))
      );
    }
    console.log("🎵 [PURE-TONE] ============================================");
    
    setSelectedFrequency(freq);

    // Find the index of the selected frequency in the FREQUENCIES array (used by audiogram)
    const freqIndex = FREQUENCIES.findIndex((f) => f === freq);
    if (freqIndex !== -1) {
      setSelectedLabelIndexes((prev) => ({ ...prev, x: freqIndex }));
    }

    // Only change level if current level is not available for the new frequency
    // This preserves the user's selected level when possible
    if (availableLevels.length > 0) {
      let newLevel = selectedLevel; // Keep current level by default
      
      // If current level is not available for this frequency, use the first available level
      if (!availableLevels.includes(selectedLevel)) {
        newLevel = availableLevels[0];
        setSelectedLevel(newLevel);
      }

      // Update the y-axis index for the audiogram using HEARING_LEVELS array
      const levelIndex = HEARING_LEVELS.findIndex((l) => l === newLevel);
      if (levelIndex !== -1) {
        setSelectedLabelIndexes((prev) => ({ ...prev, y: levelIndex }));
      }
    }

    // If a tone is playing, update it with the new frequency and level
    if (isPlaying) {
      _endAudiometrySignal();
      _sendAudiometrySignal();
    }

    // If masking is active, update masking signal with new frequency
    if (isMasking) {
      sendMaskingSignal(true);
    }
  };

  // Handle level change
  const handleLevelChange = (level: number) => {
    setSelectedLevel(level);
    // Find the index of the selected level in the HEARING_LEVELS array (used by audiogram)
    const levelIndex = HEARING_LEVELS.findIndex((l) => l === level);
    if (levelIndex !== -1) {
      setSelectedLabelIndexes((prev) => ({ ...prev, y: levelIndex }));
    }
    if (isPlaying) {
      _endAudiometrySignal();
      _sendAudiometrySignal();
    }
  };

  // Handle masking level change
  const handleMaskingLevelChange = (level: number) => {
    setMaskingLevel(level);
    if (isPlaying) {
      _endAudiometrySignal();
      _sendAudiometrySignal();
    }

    // If masking is active, update with the new level directly
    if (isMasking) {
      // Send masking signal with the new level immediately
      sendMaskingSignal(true, level);
    }
  };

  // Persist arbitrary AC/BC results state to backend (shared by undo/clear flows)
  const persistResultsToBackend = useCallback((updatedAcResults: TestResult[], updatedBcResults: TestResult[], message?: string) => {
    if (!consultationData)
      return;

    // Transform test results to match backend schema
    const acTests = updatedAcResults.map((result) => ({
      ear: result.ear === "L" ? Ear.LEFT : Ear.RIGHT,
      frequencyHz: result.x,
      thresholdDb: result.y,
      response: result.noResponse === 0,
      maskingUsed: result.masking > 0,
      maskingEar: result.masking > 0 ? (result.ear === "L" ? Ear.RIGHT : Ear.LEFT) : null,
      maskingThresholdDb: result.masking > 0 ? result.masking : null,
    }));

    const bcTests = updatedBcResults.map((result) => ({
      ear: result.ear === "L" ? Ear.LEFT : Ear.RIGHT,
      frequencyHz: result.x,
      thresholdDb: result.y,
      response: result.noResponse === 0,
      maskingUsed: result.masking > 0,
      maskingThresholdDb: result.masking > 0 ? result.masking : null,
    }));

    // consultationData is already typed above
    const audiometryData: any = {
      id: consultationData.audiometry?.id || undefined,
      sessionId: consultationId as string,
      status: TestStatus.IN_PROGRESS,
      acTests: acTests,
      bcTests: bcTests,
      audiologicalDiagnosis: consultationData.audiometry?.audiologicalDiagnosis,
      suggestion: consultationData.audiometry?.suggestion,
      recommendation: consultationData.audiometry?.recommendation,
      createdAt: consultationData.audiometry?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const dataToSend = {
      ...consultationData,
      audiometry: audiometryData,
    };

    updateConsultation(dataToSend, {
      onSuccess: (data) => {
        if (data.success) {
          if (message) {
            // no-op: caller may already show a specific toast
          }
          queryClient.invalidateQueries({
            queryKey: ['consultation', consultationId]
          });
        } else {
          toast.error(data.message);
        }
      },
      onError: (error) => {
        toast.error(`Failed to persist changes: ${error.message}`);
      },
    });
  }, [consultationData, consultationId, updateConsultation, queryClient]);

  // Undo the most recently added result
  const undoLastResult = useCallback(() => {
    if (recentResults.length === 0) {
      toast.info("No recent results to undo");
      return;
    }

    const lastResult = recentResults[recentResults.length - 1];

    // Remove from recent history
    setRecentResults(prev => prev.slice(0, -1));

    // Remove matching result from AC/BC lists
    const updatedAcResults = acTestResults.filter(result =>
      !(result.ear === lastResult.ear &&
        result.x === lastResult.x &&
        result.mode === lastResult.mode &&
        result.y === lastResult.y)
    );

    const updatedBcResults = bcTestResults.filter(result =>
      !(result.ear === lastResult.ear &&
        result.x === lastResult.x &&
        result.mode === lastResult.mode &&
        result.y === lastResult.y)
    );

    // Update state
    setAcTestResults(updatedAcResults);
    setBcTestResults(updatedBcResults);
    setTestResults([...updatedAcResults, ...updatedBcResults]);

    // Persist
    persistResultsToBackend(updatedAcResults, updatedBcResults, "Result undone");

    toast.success(`Undone: ${lastResult.ear} ear, ${lastResult.x}Hz, ${lastResult.y}dB (${lastResult.mode})`);
  }, [recentResults, acTestResults, bcTestResults, persistResultsToBackend]);

  // Add test result
  const addTestResult = useCallback((noResponse = false) => {
    if (!consultationData)
      return;

    const newResult: TestResult = {
      ear: selectedEar,
      x: selectedFrequency,
      y: selectedLevel,
      mode: selectedMode,
      masking: isMasking ? maskingLevel : 0,
      noResponse: noResponse ? 1 : 0, // Only set to 1 when explicitly no response
      signalType: selectedSignalType,
      pulsed: isPulsed,
    };

    // Remove any existing result for the same ear/frequency/mode
    const isDuplicate = (result: TestResult) => 
      result.ear === newResult.ear && 
      result.x === newResult.x && 
      result.mode === newResult.mode;

    // Update state arrays
    const updatedAcResults = selectedMode === "AC" 
      ? [...acTestResults.filter(r => !isDuplicate(r)), newResult]
      : acTestResults;
      
    const updatedBcResults = selectedMode === "BC" 
      ? [...bcTestResults.filter(r => !isDuplicate(r)), newResult]
      : bcTestResults;

      setAcTestResults(updatedAcResults);
      setBcTestResults(updatedBcResults);
    setTestResults([...updatedAcResults, ...updatedBcResults]);

    // Track this result for undo (keep last 10)
    setRecentResults(prev => {
      const updated = [...prev, newResult];
      return updated.slice(-10);
    });

    // Transform test results to match ACReadingModelData schema
    const acTests = updatedAcResults.map((result) => ({
      ear: result.ear === "L" ? Ear.LEFT : Ear.RIGHT,
      frequencyHz: result.x,
      thresholdDb: result.y, // Always store the test level, even for no response
      response: result.noResponse === 0, // true if patient responded
      maskingUsed: result.masking > 0,
      maskingEar:
        result.masking > 0 ? (result.ear === "L" ? Ear.RIGHT : Ear.LEFT) : null,
      maskingThresholdDb: result.masking > 0 ? result.masking : null,
    }));

    // Transform test results to match BCReadingModelData schema
    const bcTests = updatedBcResults.map((result) => ({
      ear: result.ear === "L" ? Ear.LEFT : Ear.RIGHT,
      frequencyHz: result.x,
      thresholdDb: result.y, // Always store the test level, even for no response
      response: result.noResponse === 0, // true if patient responded
      maskingUsed: result.masking > 0,
      maskingThresholdDb: result.masking > 0 ? result.masking : null,
    }));

    // consultationData already typed above
    const audiometryData: any = {
      id: consultationData.audiometry?.id || undefined,
          sessionId: consultationId as string,
          status: TestStatus.IN_PROGRESS,
          acTests: acTests,
          bcTests: bcTests,
          createdAt:
            consultationData.audiometry?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
    };

    const dataToSend = {
        ...consultationData,
        audiometry: audiometryData,
    };

 
          updateConsultation(dataToSend, {
        onSuccess: (data) => {
          if (data.success) {
              toast.success(`Test result added successfully${noResponse ? ' (No Response)' : ''}`);
              
              // Force refresh of consultation data to get latest results
              queryClient.invalidateQueries({ 
                queryKey: ['consultation', consultationId] 
              });
          } else {
            toast.error(data.message);
          }
        },
        onError: (error) => {
          toast.error(`Failed to add test result: ${error.message}`);
        },
      }
    );
  }, [consultationData, consultationId, selectedEar, selectedFrequency, selectedLevel, selectedMode, isMasking, maskingLevel, selectedSignalType, isPulsed, acTestResults, bcTestResults, updateConsultation, queryClient]);

  // Helper functions for button clicks (moved up to be used in useEffect dependencies)
  const addResponse = useCallback(() => {
    addTestResult(false);  // false = normal response, no arrow
    // Scroll to the audiogram and flash background
    const audiogramElement = document.querySelector(".audiogram-graph");
    if (audiogramElement) {
      audiogramElement.scrollIntoView({ behavior: "smooth", block: "center" });
      const root = document.documentElement;
      root.classList.add("blink-bg");
      const heading = document.querySelector("h1");
      if (heading) (heading as HTMLElement).classList.add("float-heading");
      setTimeout(() => {
        root.classList.remove("blink-bg");
        if (heading) (heading as HTMLElement).classList.remove("float-heading");
      }, 1000); // Blink for 1 second
    }
  }, [addTestResult]); 
  
  const addNoResponse = useCallback(() => addTestResult(true), [addTestResult]); // true = no response, show arrow

  // Handle test submission
  const handleSubmit = useCallback(() => {
    if (!consultationData)
      return;

    // consultationData already typed above
    
    // Ensure we preserve all test data when completing
    const acTests = acTestResults.map((result) => ({
      ear: result.ear === "L" ? Ear.LEFT : Ear.RIGHT,
      frequencyHz: result.x,
      thresholdDb: result.y, // Always store the test level, even for no response
      response: result.noResponse === 0, // true if patient responded
      maskingUsed: result.masking > 0,
      maskingEar:
        result.masking > 0 ? (result.ear === "L" ? Ear.RIGHT : Ear.LEFT) : null,
      maskingThresholdDb: result.masking > 0 ? result.masking : null,
    }));

    const bcTests = bcTestResults.map((result) => ({
      ear: result.ear === "L" ? Ear.LEFT : Ear.RIGHT,
      frequencyHz: result.x,
      thresholdDb: result.y, // Always store the test level, even for no response
      response: result.noResponse === 0, // true if patient responded
      maskingUsed: result.masking > 0,
      maskingThresholdDb: result.masking > 0 ? result.masking : null,
    }));

    updateConsultation(
      {
        ...consultationData,
        audiometry: {
          ...consultationData.audiometry,
          id: consultationData.audiometry?.id,
          sessionId: consultationId as string,
          status: TestStatus.COMPLETED,
          acTests: acTests,
          bcTests: bcTests,
          audiologicalDiagnosis: consultationData.audiometry?.audiologicalDiagnosis,
          suggestion: consultationData.audiometry?.suggestion,
          recommendation: consultationData.audiometry?.recommendation,
          createdAt:
            consultationData.audiometry?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      {
        onSuccess: (data) => {
          if (data.success) {
            // Preserve localStorage data after test submission
            // Save the final submitted data to localStorage for future reference
            try {
              const storageKey = `pure-tone-audiometry-${consultationId}`;
              const dataToStore = {
                acTestResults,
                bcTestResults,
                timestamp: new Date().toISOString(),
                submitted: true
              };
              localStorage.setItem(storageKey, JSON.stringify(dataToStore));
              console.log('💾 Preserved PTA data in localStorage after test submission');
            } catch (error) {
              console.error('Failed to save to localStorage:', error);
            }
            
            toast.success("Test completed successfully");
            console.log(`Test completed with ${acTests.length} AC tests and ${bcTests.length} BC tests`);
            router.push(
              ROUTES.AUDIOMETRY_TEST_REPORT(consultationId as string)
            );
          } else {
            toast.error(data.message);
          }
        },
        onError: (error) => {
          toast.error(`Failed to complete test: ${error.message}`);
        },
      }
    );
  }, [consultationData, acTestResults, bcTestResults, consultationId, updateConsultation, router]);

  // Comprehensive keyboard shortcuts for audiologist efficiency
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Skip if typing in input/select/textarea
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Help dialog toggle
      if (event.code === 'KeyH' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        setShowHelpDialog(prev => !prev);
        return;
      }

      // Skip other shortcuts if help dialog is open
      if (showHelpDialog) return;

      // Prevent default for handled keys
      const preventDefault = () => event.preventDefault();

      switch (event.code) {
        // Undo last result
        case 'Backspace':
          preventDefault();
          undoLastResult();
          break;
        // Quick responses
        case 'Space':
        case 'Enter':
          preventDefault();
          addResponse();
          break;
        case 'KeyN':
          preventDefault();
          addNoResponse();
          break;

        // Ear switching
        case 'KeyL':
          preventDefault();
          setSelectedEar('L');
          if (isMasking) sendMaskingSignal(true);
          break;
        case 'KeyR':
          preventDefault();
          setSelectedEar('R');
          if (isMasking) sendMaskingSignal(true);
          break;

        // Mode switching
        case 'KeyA':
          preventDefault();
          setSelectedMode('AC');
          break;
        case 'KeyB':
          preventDefault();
          setSelectedMode('BC');
          break;

        // Frequency navigation
        case 'ArrowLeft':
          if (!event.shiftKey) {
            preventDefault();
            const currentFreqIndex = FREQUENCIES.indexOf(selectedFrequency);
            if (currentFreqIndex > 0) {
              const newFreq = FREQUENCIES[currentFreqIndex - 1];
              handleFrequencyChange(newFreq);
            }
          }
          break;
        case 'ArrowRight':
          if (!event.shiftKey) {
            preventDefault();
            const currentFreqIndexRight = FREQUENCIES.indexOf(selectedFrequency);
            if (currentFreqIndexRight < FREQUENCIES.length - 1) {
              const newFreq = FREQUENCIES[currentFreqIndexRight + 1];
              handleFrequencyChange(newFreq);
            }
          }
          break;

        // Level adjustment (5dB steps)
        case 'ArrowUp':
          if (!event.shiftKey) {
            preventDefault();
            const currentLevelIndex = HEARING_LEVELS.indexOf(selectedLevel);
            if (currentLevelIndex > 0) {
              const newLevel = HEARING_LEVELS[currentLevelIndex - 1];
              handleLevelChange(newLevel);
            }
          } else {
            // 10dB steps with Shift
            preventDefault();
            const currentIdx = HEARING_LEVELS.indexOf(selectedLevel);
            const newIdx = Math.max(0, currentIdx - 2); // 2 steps = 10dB
            handleLevelChange(HEARING_LEVELS[newIdx]);
          }
          break;
        case 'ArrowDown':
          if (!event.shiftKey) {
            preventDefault();
            const currentLevelIndexDown = HEARING_LEVELS.indexOf(selectedLevel);
            if (currentLevelIndexDown < HEARING_LEVELS.length - 1) {
              const newLevel = HEARING_LEVELS[currentLevelIndexDown + 1];
              handleLevelChange(newLevel);
            }
          } else {
            // 10dB steps with Shift
            preventDefault();
            const currentIdx = HEARING_LEVELS.indexOf(selectedLevel);
            const newIdx = Math.min(HEARING_LEVELS.length - 1, currentIdx + 2);
            handleLevelChange(HEARING_LEVELS[newIdx]);
          }
          break;

        // Masking toggle
        case 'KeyM':
          preventDefault();
          const nextMasking = !isMasking;
          setIsMasking(nextMasking);
          sendMaskingSignal(nextMasking);
          break;

        // Pulsed toggle
        case 'KeyP':
          preventDefault();
          setIsPulsed(prev => {
            const next = !prev;
            if (isPlaying) {
              _endAudiometrySignal();
              _sendAudiometrySignal();
            }
            return next;
          });
          break;

        // Common frequencies (quick jump)
        case 'Digit1':
          preventDefault();
          handleFrequencyChange(1000); // 1K
          break;
        case 'Digit2':
          preventDefault();
          handleFrequencyChange(2000); // 2K
          break;
        case 'Digit4':
          preventDefault();
          handleFrequencyChange(4000); // 4K
          break;
        case 'Digit5':
          preventDefault();
          handleFrequencyChange(500); // 500Hz
          break;

        // Play/stop tone
        case 'KeyT':
          preventDefault();
          if (isPlaying) {
            _endAudiometrySignal();
          } else {
            _sendAudiometrySignal();
          }
          break;

        // Submit test
        case 'KeyS':
          if (event.ctrlKey || event.metaKey) {
            preventDefault();
            handleSubmit();
          }
          break;
        case 'KeyZ':
          if (event.ctrlKey || event.metaKey) {
            preventDefault();
            undoLastResult();
          }
          break;
      }
    };

    const handleDoubleClick = (event: MouseEvent) => {
      // Prevent double-click from interfering with existing controls
      const target = event.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.tagName === 'SELECT' || target.tagName === 'INPUT') {
        return; // Don't trigger on UI controls
      }
      addResponse();
    };

    // Add event listeners
    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('dblclick', handleDoubleClick);

    // Cleanup event listeners
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.removeEventListener('dblclick', handleDoubleClick);
    };
  }, [
    addResponse, 
    addNoResponse, 
    selectedFrequency, 
    selectedLevel, 
    isMasking, 
    isPlaying, 
    showHelpDialog,
    handleFrequencyChange, 
    handleLevelChange, 
    sendMaskingSignal,
    _endAudiometrySignal,
    _sendAudiometrySignal,
    handleSubmit
  ]);

  // Helper function to persist cleared results to backend
  const persistClearedResults = (updatedAcResults: TestResult[], updatedBcResults: TestResult[]) => {
    if (!consultationData)
      return;

    // Transform test results to match backend schema
    const acTests = updatedAcResults.map((result) => ({
      ear: result.ear === "L" ? Ear.LEFT : Ear.RIGHT,
      frequencyHz: result.x,
      thresholdDb: result.y,
      response: result.noResponse === 0,
      maskingUsed: result.masking > 0,
      maskingEar: result.masking > 0 ? (result.ear === "L" ? Ear.RIGHT : Ear.LEFT) : null,
      maskingThresholdDb: result.masking > 0 ? result.masking : null,
    }));

    const bcTests = updatedBcResults.map((result) => ({
      ear: result.ear === "L" ? Ear.LEFT : Ear.RIGHT,
      frequencyHz: result.x,
      thresholdDb: result.y,
      response: result.noResponse === 0,
      maskingUsed: result.masking > 0,
      maskingThresholdDb: result.masking > 0 ? result.masking : null,
    }));

    // consultationData already typed above
    const audiometryData: any = {
      id: consultationData.audiometry?.id || undefined,
        sessionId: consultationId as string,
        status: TestStatus.IN_PROGRESS,
        acTests: acTests,
        bcTests: bcTests,
      audiologicalDiagnosis: consultationData.audiometry?.audiologicalDiagnosis,
      suggestion: consultationData.audiometry?.suggestion,
      recommendation: consultationData.audiometry?.recommendation,
        createdAt: consultationData.audiometry?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    const dataToSend = {
      ...consultationData,
      audiometry: audiometryData,
    };

    updateConsultation(dataToSend, {
      onSuccess: (data) => {
        if (data.success) {
          // Force refresh of consultation data to sync with backend
          queryClient.invalidateQueries({ 
            queryKey: ['consultation', consultationId] 
          });
        } else {
          toast.error(data.message);
        }
      },
      onError: (error) => {
        toast.error(`Failed to persist changes: ${error.message}`);
      },
    });
  };

  const clearTest = () => {
    const updatedAcResults: TestResult[] = [];
    const updatedBcResults: TestResult[] = [];
    
    setTestResults([]);
    setAcTestResults([]);
    setBcTestResults([]);
    setJustCleared(true);
    
    // Clear localStorage
    try {
      const storageKey = `pure-tone-audiometry-${consultationId}`;
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
    
    // Persist cleared state to backend
    persistClearedResults(updatedAcResults, updatedBcResults);
    
    toast.info("All test results cleared. You can start over.");
  };

  const clearEarResults = (ear: "L" | "R") => {
    const filteredAcResults = acTestResults.filter(r => r.ear !== ear);
    const filteredBcResults = bcTestResults.filter(r => r.ear !== ear);
    
    setAcTestResults(filteredAcResults);
    setBcTestResults(filteredBcResults);
    setTestResults([...filteredAcResults, ...filteredBcResults]);
    setJustCleared(true);
    
    // Update localStorage with cleared results
    try {
      const storageKey = `pure-tone-audiometry-${consultationId}`;
      const dataToStore = {
        acTestResults: filteredAcResults.filter(r => r.mode === "AC"),
        bcTestResults: filteredBcResults.filter(r => r.mode === "BC"),
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToStore));
    } catch (error) {
      console.error('Failed to update localStorage:', error);
    }
    
    // Persist cleared state to backend
    persistClearedResults(filteredAcResults, filteredBcResults);
    
    toast.info(`${ear === "L" ? "Left" : "Right"} ear results cleared.`);
  };


  
  const clearModeResults = (mode: "AC" | "BC") => {
    const updatedAcResults = mode === "AC" ? [] : acTestResults;
    const updatedBcResults = mode === "BC" ? [] : bcTestResults;
    
    // Update all state arrays consistently
    setAcTestResults(updatedAcResults);
    setBcTestResults(updatedBcResults);
    setTestResults([...updatedAcResults, ...updatedBcResults]);
    setJustCleared(true);
    
    // Update localStorage with cleared results
    try {
      const storageKey = `pure-tone-audiometry-${consultationId}`;
      const dataToStore = {
        acTestResults: updatedAcResults,
        bcTestResults: updatedBcResults,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToStore));
    } catch (error) {
      console.error('Failed to update localStorage:', error);
    }
    
    // Persist cleared state to backend
    persistClearedResults(updatedAcResults, updatedBcResults);
    
    toast.info(`${mode === "AC" ? "Air Conduction" : "Bone Conduction"} results cleared.`);
  };

  // Copy test results from one ear to another
  const copyEarResults = (fromEar: "L" | "R", toEar: "L" | "R", mode: "AC" | "BC" | "BOTH") => {
    const sourceResults = mode === "AC" 
      ? acTestResults.filter(r => r.ear === fromEar)
      : mode === "BC"
      ? bcTestResults.filter(r => r.ear === fromEar)
      : [...acTestResults, ...bcTestResults].filter(r => r.ear === fromEar);

    if (sourceResults.length === 0) {
      toast.error(`No ${mode === "BOTH" ? "" : mode + " "}results found for ${fromEar === "L" ? "left" : "right"} ear to copy`);
      return;
    }

    // Create copies with the target ear
    const copiedResults = sourceResults.map(result => ({
      ...result,
      ear: toEar
    }));

    // Remove existing results for target ear in the same mode/frequencies to avoid duplicates
    let updatedAcResults = [...acTestResults];
    let updatedBcResults = [...bcTestResults];

    copiedResults.forEach(copied => {
      if (copied.mode === "AC") {
        // Remove existing AC result at same frequency for target ear
        updatedAcResults = updatedAcResults.filter(r => 
          !(r.ear === toEar && r.x === copied.x)
        );
        updatedAcResults.push(copied);
      } else {
        // Remove existing BC result at same frequency for target ear
        updatedBcResults = updatedBcResults.filter(r => 
          !(r.ear === toEar && r.x === copied.x)
        );
        updatedBcResults.push(copied);
      }
    });

    // Update state
    setAcTestResults(updatedAcResults);
    setBcTestResults(updatedBcResults);
    setTestResults([...updatedAcResults, ...updatedBcResults]);

    // Persist to backend
    persistResultsToBackend(updatedAcResults, updatedBcResults);

    const modeText = mode === "BOTH" ? "all" : mode;
    toast.success(`Copied ${copiedResults.length} ${modeText} result(s) from ${fromEar === "L" ? "left" : "right"} to ${toEar === "L" ? "left" : "right"} ear`);
  };

  // Handle audiogram click
  const handleAudiogramClick = (x: number, y: number) => {
    const newFrequency = FREQUENCIES[x];
    const newLevel = HEARING_LEVELS[y];

    // Only update if the clicked frequency and level are available
    if (availableFrequencies.includes(newFrequency) && availableLevels.includes(newLevel)) {
    setSelectedLabelIndexes({ x, y });
    setSelectedFrequency(newFrequency);
    setSelectedLevel(newLevel);
    }

    if (isPlaying) {
      _endAudiometrySignal();
      _sendAudiometrySignal();
    }
  };

  if (!currentTransducer) {
    return <PureToneLoadingSkeleton />;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden p-4">
      <style>{`
        @keyframes screen-blink { from { background-color: rgba(0,255,0,0.15);} to { background-color: transparent; } }
        .blink-bg { animation: screen-blink 0.4s ease-in-out 0s 2 alternate; }
        @keyframes float-y { 0%{ transform: translateY(0);} 50%{ transform: translateY(-6px);} 100%{ transform: translateY(0);} }
        .float-heading { animation: float-y 1s ease-in-out 0s 1; }
      `}</style>
      {/* Patient Response Indicator */}
      {isPatientResponse && (
        <>
          {/* Full-screen visual cue */}
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

      <div className="flex-shrink-0 mb-3">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Pure Tone Audiometry</h1>
          <div className="bg-gray-100 px-3 py-1.5 rounded-lg">
            <div className="text-xs text-gray-600">Results:</div>
            <div className="flex gap-3 text-xs font-medium">
              <span className="text-green-600">AC: {acTestResults.length}</span>
              <span className="text-purple-600">BC: {bcTestResults.length}</span>
              <span className="text-gray-600">Total: {testResults.length}</span>
            </div>
          </div>
        </div>
      </div>



      {/* Responsive layout: stack on mobile, side-by-side on desktop */}
      <div className="flex-1 min-h-0 lg:flex lg:gap-3">
        {/* Audiogram area */}
        <div className="flex-1 border rounded p-3 flex items-center justify-center min-h-0">
          <div className="w-full h-full audiogram-graph flex items-center justify-center">
            <PureToneGraph
              selectedLabelIndexes={selectedLabelIndexes}
              resultMarkings={testResults}
              onIndexChange={handleAudiogramClick}
              onRightClickIndex={(i,j) => {
                // Jump crosshair then add No Response
                setSelectedLabelIndexes({ x: i, y: j });
                setSelectedFrequency(FREQUENCIES[i]);
                setSelectedLevel(HEARING_LEVELS[j]);
                addTestResult(true);
              }}
              onDoubleClickIndex={(i,j) => {
                setSelectedLabelIndexes({ x: i, y: j });
                setSelectedFrequency(FREQUENCIES[i]);
                setSelectedLevel(HEARING_LEVELS[j]);
                addTestResult(false);
              }}
              onAltClickIndex={(i,j) => {
                setSelectedLabelIndexes({ x: i, y: j });
                setSelectedFrequency(FREQUENCIES[i]);
                setSelectedLevel(HEARING_LEVELS[j]);
                addTestResult(true);
              }}
            />
          </div>
        </div>

        {/* Controls panel: full-width below on mobile, fixed-width column on desktop */}
        <div className="mt-3 lg:mt-0 w-full lg:w-80 xl:w-96">
          <div className="bg-white shadow-lg rounded-lg p-2.5 border max-h-[40vh] overflow-y-auto lg:max-h-[calc(100vh-6rem)]">
            {/* Grid layout for compact controls */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              {/* Ear Selection */}
              <div>
                <label className="block text-xs font-medium mb-1">Ear</label>
                <div className="flex gap-1">
                  {availableEarSides.map((ear: "L" | "R") => (
                    <button
                      key={ear}
                      className={`flex-1 px-2 py-1 rounded text-xs ${
                        selectedEar === ear
                          ? ear === "L"
                            ? "bg-blue-500 text-white"
                            : "bg-red-500 text-white"
                          : "bg-gray-200"
                      }`}
                      onClick={() => {
                        setSelectedEar(ear);
                        if (isMasking) {
                          sendMaskingSignal(true);
                        }
                      }}
                    >
                      {ear === "L" ? "Left" : "Right"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode Selection */}
              <div>
                <label className="block text-xs font-medium mb-1">Mode</label>
                <div className="flex gap-1">
                  <button
                    className={`flex-1 px-2 py-1 rounded text-xs ${
                      selectedMode === "AC" ? "bg-blue-500 text-white" : "bg-gray-200"
                    }`}
                    onClick={() => setSelectedMode("AC")}
                  >
                    Air
                  </button>
                  <button
                    className={`flex-1 px-2 py-1 rounded text-xs ${
                      selectedMode === "BC" ? "bg-blue-500 text-white" : "bg-gray-200"
                    }`}
                    onClick={() => setSelectedMode("BC")}
                  >
                    Bone
                  </button>
                </div>
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-xs font-medium mb-1">
                  Freq (Hz)
                  <span className="text-gray-500 text-xs ml-1">({availableFrequencies.length} available)</span>
                </label>
                <select
                  className="w-full p-1.5 border rounded text-xs"
                  value={selectedFrequency}
                  onChange={(e) => handleFrequencyChange(Number(e.target.value))}
                >
                  {availableFrequencies.map((freq) => (
                    <option key={freq} value={freq}>{freq}</option>
                  ))}
                </select>
              </div>

              {/* Level */}
              <div>
                <label className="block text-xs font-medium mb-1">
                  Level (dB)
                  {availableLevels.length > 0 && (
                    <span className="text-gray-500 text-xs ml-1">
                      ({availableLevels[0]} to {availableLevels[availableLevels.length - 1]}, {availableLevels.length} levels)
                    </span>
                  )}
                </label>
                <select
                  className="w-full p-1.5 border rounded text-xs"
                  value={selectedLevel}
                  onChange={(e) => handleLevelChange(Number(e.target.value))}
                >
                  {availableLevels.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
                {availableLevels.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    Range: {availableLevels[0]} to {availableLevels[availableLevels.length - 1]} dB
                  </div>
                )}
              </div>

              {/* Signal Type */}
              <div>
                <label className="block text-xs font-medium mb-1">Signal</label>
                <select
                  className="w-full p-1.5 border rounded text-xs"
                  value={selectedSignalType}
                  onChange={(e) => handleSignalTypeChange(e.target.value as SignalType)}
                >
                  {availableSignalTypes.map((type: SignalType) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Pulsed Toggle */}
              <div>
                <label className="block text-xs font-medium mb-1">Tone</label>
                <button
                  className={`w-full px-2 py-1.5 rounded text-xs ${isPulsed ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                  onClick={() => {
                    setIsPulsed((prev) => !prev);
                    if (isPlaying) { _endAudiometrySignal(); _sendAudiometrySignal(); }
                  }}
                >
                  {isPulsed ? 'Pulsed' : 'Steady'}
                </button>
              </div>
            </div>

            {/* Masking - Full Width */}
            <div className="mb-2">
              <label className="block text-xs font-medium mb-1">Masking</label>
              <div className="flex items-center gap-1.5">
                <button
                  className={`px-3 py-1.5 rounded text-xs ${isMasking ? 'bg-purple-500 text-white' : 'bg-gray-200'}`}
                  onClick={() => {
                    const next = !isMasking;
                    setIsMasking(next);
                    sendMaskingSignal(next);
                  }}
                >
                  {isMasking ? 'On' : 'Off'}
                </button>
                <select
                  className="flex-1 p-1.5 border rounded text-xs"
                  value={maskingLevel}
                  onChange={(e) => handleMaskingLevelChange(Number(e.target.value))}
                >
                  {availableMaskingLevels.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Play Button - Full Width */}
            <button
              className={`w-full px-3 py-2 rounded text-xs mb-2 font-medium ${isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            >
              {isPlaying ? '🔊 Release to Stop' : '🎵 Hold to Play'}
            </button>

            {/* Action Buttons - Grid Layout */}
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              <button
                className="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                onClick={addResponse}
              >
                ✓ Response
              </button>
              <button
                className="px-3 py-1.5 bg-orange-500 text-white rounded hover:bg-orange-600 text-xs"
                onClick={addNoResponse}
              >
                ✗ No Response
              </button>
              <button
                className={`px-3 py-1.5 rounded text-xs ${recentResults.length > 0 ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                onClick={() => undoLastResult()}
                disabled={recentResults.length === 0}
              >
                ↶ Undo{recentResults.length > 0 ? ` (${recentResults.length})` : ''}
              </button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs flex items-center justify-center gap-1">
                    📋 Copy
                    <ChevronDown size={12} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Copy AC (Air Conduction)</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => copyEarResults('L', 'R', 'AC')}>Left AC → Right</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => copyEarResults('R', 'L', 'AC')}>Right AC → Left</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Copy BC (Bone Conduction)</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => copyEarResults('L', 'R', 'BC')}>Left BC → Right</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => copyEarResults('R', 'L', 'BC')}>Right BC → Left</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Copy All (AC + BC)</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => copyEarResults('L', 'R', 'BOTH')}>Left All → Right</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => copyEarResults('R', 'L', 'BOTH')}>Right All → Left</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="px-3 py-1.5 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs flex items-center justify-center gap-1">
                    🗑️ Clear
                    <ChevronDown size={12} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Clear Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => clearEarResults('L')}>Left Ear</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => clearEarResults('R')}>Right Ear</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => clearModeResults('AC')}>Air Conduction</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => clearModeResults('BC')}>Bone Conduction</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={clearTest} className="text-red-600">All Results</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                className="col-span-2 px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 text-xs font-medium"
                onClick={handleSubmit}
              >
                ✅ Submit Test
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Help Dialog */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle size={20} />
              Keyboard Shortcuts
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-blue-600 mb-2">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><kbd className="px-2 py-1 bg-gray-100 rounded">Space</kbd> or <kbd className="px-2 py-1 bg-gray-100 rounded">Enter</kbd> - Add response</div>
                <div><kbd className="px-2 py-1 bg-gray-100 rounded">N</kbd> - Add no response</div>
                <div><kbd className="px-2 py-1 bg-gray-100 rounded">T</kbd> - Play/stop tone</div>
                <div><kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl+S</kbd> - Submit test</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-green-600 mb-2">Navigation</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><kbd className="px-2 py-1 bg-gray-100 rounded">L</kbd> - Switch to Left ear</div>
                <div><kbd className="px-2 py-1 bg-gray-100 rounded">R</kbd> - Switch to Right ear</div>
                <div><kbd className="px-2 py-1 bg-gray-100 rounded">A</kbd> - Air Conduction</div>
                <div><kbd className="px-2 py-1 bg-gray-100 rounded">B</kbd> - Bone Conduction</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-purple-600 mb-2">Frequency & Level</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><kbd className="px-2 py-1 bg-gray-100 rounded">←/→</kbd> - Navigate frequencies</div>
                <div><kbd className="px-2 py-1 bg-gray-100 rounded">↑/↓</kbd> - Adjust level (5dB)</div>
                <div><kbd className="px-2 py-1 bg-gray-100 rounded">Shift+↑/↓</kbd> - Adjust level (10dB)</div>
                <div><kbd className="px-2 py-1 bg-gray-100 rounded">1/2/4/5</kbd> - Jump to 1K/2K/4K/500Hz</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-orange-600 mb-2">Settings</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><kbd className="px-2 py-1 bg-gray-100 rounded">M</kbd> - Toggle masking</div>
                <div><kbd className="px-2 py-1 bg-gray-100 rounded">P</kbd> - Toggle pulsed tone</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-red-600 mb-2">Graph Interactions</h4>
              <div className="space-y-1 text-sm">
                <div>• <strong>Right-click</strong> on graph - Add no response at point</div>
                <div>• <strong>Double-click</strong> on graph - Add response at point</div>
                <div>• <strong>Alt+click</strong> on graph - Add no response at point</div>
              </div>
            </div>
            
            <div className="pt-2 border-t">
              <div className="text-xs text-gray-600">
                Press <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+H</kbd> to toggle this help dialog
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Help Button */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogTrigger asChild>
          <button className="fixed bottom-4 left-4 bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-full shadow-lg z-50">
            <HelpCircle size={18} />
          </button>
        </DialogTrigger>
      </Dialog>

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
    </div>
  );
}
