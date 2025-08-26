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
import { ChevronDown } from "lucide-react";

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
  const router = useRouter();
  const queryClient = useQueryClient();

  // Track if data has been initially loaded to prevent overriding local changes
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [justCleared, setJustCleared] = useState(false);

  // Populate test results from existing audiometry data
  useEffect(() => {
    if (!socket) return;
    const onPatientResponse = (data: any) => {
      setIsPatientResponse(!!data?.patientResponse);
    };
    socket.on("patient-response", onPatientResponse);
    return () => {
      socket.off("patient-response", onPatientResponse);
    };

    if (!consultationResponse?.data || Array.isArray(consultationResponse.data))
      return;

    const consultationData = consultationResponse.data as ConsultationModelData;

    // Only load data if we haven't loaded it initially, or if there are more results in backend than local state
    // This prevents overriding local changes while still allowing for external updates
    const backendAcCount = consultationData.audiometry?.acTests?.length || 0;
    const backendBcCount = consultationData.audiometry?.bcTests?.length || 0;
    const localTotalCount = acTestResults.length + bcTestResults.length;
    const backendTotalCount = backendAcCount + backendBcCount;
    
    // Don't reload from backend if we just cleared the results
    if (justCleared) {
      return;
    }
    
    if (hasInitiallyLoaded && backendTotalCount <= localTotalCount) {
      return; // Don't override local state if backend doesn't have more data
    }

    let existingAcResults: TestResult[] = [];
    let existingBcResults: TestResult[] = [];

    // Handle AC tests
    if (consultationData.audiometry?.acTests) {
      existingAcResults = consultationData.audiometry.acTests
        .filter(test => test.thresholdDb !== null) // Only include tests with valid thresholds
        .map((test) => {
          // More robust logic: explicitly check for true response, everything else is no-response
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
            noResponse: patientResponded ? 0 : 1, // 0 = response (no arrow), 1 = no response (show arrow)
          signalType: SignalType.Steady,
          pulsed: false,
          };
        });
    }

    // Handle BC tests
    if (consultationData.audiometry?.bcTests) {
      existingBcResults = consultationData.audiometry.bcTests
        .filter(test => test.thresholdDb !== null) // Only include tests with valid thresholds
        .map((test) => {
          // More robust logic: explicitly check for true response, everything else is no-response
          const patientResponded = test.response === true;
          return {
          ear: test.ear === Ear.LEFT ? "L" : "R",
          x: test.frequencyHz,
            y: test.thresholdDb!,
          mode: "BC",
          masking: test.maskingUsed ? 1 : 0,
            noResponse: patientResponded ? 0 : 1, // 0 = response (no arrow), 1 = no response (show arrow)
          signalType: SignalType.Steady,
          pulsed: false,
          };
        });
    }

    // Update state only once with the results
    setAcTestResults(existingAcResults);
      setBcTestResults(existingBcResults);
    setTestResults([...existingAcResults, ...existingBcResults]);
    setHasInitiallyLoaded(true);
  }, [consultationResponse?.data, socket, hasInitiallyLoaded, acTestResults.length, bcTestResults.length]);

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
      setTransducerData(deviceState.transducerResponse);
    } else {
      // Use dummy data for testing when no device is connected
      setTransducerData(dummyTransducerData);
    }
  }, [deviceState?.transducerResponse]);

  const currentTransducer = useMemo(() => {
    if (!transducerData?.Transducers) return null;
    return transducerData.Transducers.find(
      (t) => t.ConductionType === (selectedMode === "AC" ? 0 : 1)
    );
  }, [transducerData, selectedMode]);

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

  const availableFrequencies = useMemo(() => {
    if (!currentCalibration) return [];
    return currentCalibration.CalibrationFrequencies.filter(
      (freq) => freq.Frequency
    )
      .map((freq) => freq.Frequency)
      .sort((a, b) => a - b);
  }, [currentCalibration]);

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
    return levels;
  }, [currentCalibration, selectedFrequency, selectedSignalType]);

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

  const availableSignalTypes = useMemo(() => {
    if (!currentTransducer) return [];
    return currentTransducer.SignalTypes.map(
      (type: number) => SIGNAL_TYPE_MAP[type as keyof typeof SIGNAL_TYPE_MAP]
    ).filter(Boolean);
  }, [currentTransducer]);

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

  const _sendAudiometrySignal = useCallback(() => {
    if (socket) {
      socket.emit("audiometry-signal", {
        connectionId: consultationId,
        frequency: selectedFrequency,
        level: selectedLevel,
        signal: true,
        pulsed: isPulsed,
        earSide: selectedEar,
        signalType: selectedSignalType,
        conductionType: selectedMode,
        maskingSignal: isMaskingActive,
        maskingLevel: maskingLevel,
      });
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

  const _endAudiometrySignal = useCallback(() => {
    if (socket) {
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
  const sendMaskingSignal = useCallback(
    (signal: boolean) => {
      if (!socket) return;
      socket.emit("masking-signal", {
        consultationId: consultationId,
        frequency: selectedFrequency,
        level: maskingLevel,
        signal,
        earSide: selectedEar,
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

    // If masking is active, (re)send masking signal with updated level
    if (isMasking) {
      sendMaskingSignal(true);
    }
  };

  // Add test result
  const addTestResult = useCallback((noResponse = false) => {
    if (!consultationResponse?.data || Array.isArray(consultationResponse.data))
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

    const consultationData = consultationResponse.data as ConsultationModelData;
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
  }, [consultationResponse?.data, consultationId, selectedEar, selectedFrequency, selectedLevel, selectedMode, isMasking, maskingLevel, selectedSignalType, isPulsed, acTestResults, bcTestResults, updateConsultation, queryClient]);

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

  // Add keyboard and double-click event listeners for adding responses
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only respond to spacebar or Enter key
      if (event.code === 'Space' || event.code === 'Enter') {
        // Prevent default behavior (e.g., scrolling with spacebar)
        event.preventDefault();
        addResponse();
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
  }, [addResponse]); // Include addResponse in dependencies

  // Helper function to persist cleared results to backend
  const persistClearedResults = (updatedAcResults: TestResult[], updatedBcResults: TestResult[]) => {
    if (!consultationResponse?.data || Array.isArray(consultationResponse.data))
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

    const consultationData = consultationResponse.data as ConsultationModelData;
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
    
    // Persist cleared state to backend
    persistClearedResults(updatedAcResults, updatedBcResults);
    
    toast.info(`${mode === "AC" ? "Air Conduction" : "Bone Conduction"} results cleared.`);
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

  // Handle test submission
  const handleSubmit = () => {
    if (!consultationResponse?.data || Array.isArray(consultationResponse.data))
      return;

    const consultationData = consultationResponse.data as ConsultationModelData;
    
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
  };

  if (!currentTransducer) {
    return <PureToneLoadingSkeleton />;
  }

  return (
    <div className="p-6 w-full">
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

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Pure Tone Audiometry</h1>
          <div className="bg-gray-100 px-4 py-2 rounded-lg">
            <div className="text-sm text-gray-600">Test Results:</div>
            <div className="flex gap-4 text-sm font-medium">
              <span className="text-green-600">AC: {acTestResults.length}</span>
              <span className="text-purple-600">BC: {bcTestResults.length}</span>
              <span className="text-gray-600">Total: {testResults.length}</span>
            </div>
          </div>
        </div>

        {/* Test Controls removed from top in favor of right floating panel */}
      </div>



      {/* Audiogram Display */}
      <div className="border flex items-center justify-center rounded p-4">
        <div className="w-full audiogram-graph">
        <PureToneGraph
          selectedLabelIndexes={selectedLabelIndexes}
          resultMarkings={testResults}
          onIndexChange={handleAudiogramClick}
        />
      </div>
      </div>

      {/* Full Controls (Right-side floating) */}
      <div className="fixed right-4 top-28 md:top-1/2 md:-translate-y-1/2 z-30 w-72">
        <div className="bg-white shadow-lg rounded-lg p-3 w-64 border max-h-[calc(100vh-8rem)] overflow-auto">
          <div className="mb-3">
            <label className="block text-xs font-medium mb-1">Ear</label>
            <div className="flex gap-2">
              {availableEarSides.map((ear: "L" | "R") => (
                <button
                  key={ear}
                  className={`px-3 py-1 rounded text-xs ${
                    selectedEar === ear
                      ? ear === "L"
                        ? "bg-blue-500 text-white"
                        : "bg-red-500 text-white"
                      : "bg-gray-200"
                  }`}
                  onClick={() => {
                    setSelectedEar(ear);
                    // If masking is active, re-emit for the new ear side
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
          <div className="mb-3">
            <label className="block text-xs font-medium mb-1">Mode</label>
            <div className="flex gap-2">
              <button
                className={`px-3 py-1 rounded text-xs ${
                  selectedMode === "AC" ? "bg-blue-500 text-white" : "bg-gray-200"
                }`}
                onClick={() => setSelectedMode("AC")}
              >
                Air
              </button>
              <button
                className={`px-3 py-1 rounded text-xs ${
                  selectedMode === "BC" ? "bg-blue-500 text-white" : "bg-gray-200"
                }`}
                onClick={() => setSelectedMode("BC")}
              >
                Bone
              </button>
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium mb-1">Frequency (Hz)</label>
            <select
              className="w-full p-2 border rounded text-sm"
              value={selectedFrequency}
              onChange={(e) => handleFrequencyChange(Number(e.target.value))}
            >
              {availableFrequencies.map((freq) => (
                <option key={freq} value={freq}>{freq}</option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium mb-1">Level (dB HL)</label>
            <select
              className="w-full p-2 border rounded text-sm"
              value={selectedLevel}
              onChange={(e) => handleLevelChange(Number(e.target.value))}
            >
              {availableLevels.map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium mb-1">Signal Type</label>
            <select
              className="w-full p-2 border rounded text-sm"
              value={selectedSignalType}
              onChange={(e) => handleSignalTypeChange(e.target.value as SignalType)}
            >
              {availableSignalTypes.map((type: SignalType) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium mb-1">Pulsed</label>
            <button
              className={`w-full px-3 py-1 rounded text-xs ${isPulsed ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => {
                setIsPulsed((prev) => !prev);
                if (isPlaying) { _endAudiometrySignal(); _sendAudiometrySignal(); }
              }}
            >
              {isPulsed ? 'Pulsed On' : 'Pulsed Off'}
            </button>
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium mb-1">Masking</label>
            <div className="flex items-center gap-2">
              <button
                className={`px-3 py-1 rounded text-xs ${isMasking ? 'bg-purple-500 text-white' : 'bg-gray-200'}`}
                onClick={() => {
                  const next = !isMasking;
                  setIsMasking(next);
                  // Emit masking start/stop immediately
                  sendMaskingSignal(next);
                }}
              >
                {isMasking ? 'On' : 'Off'}
              </button>
              <select
                className="flex-1 p-2 border rounded text-sm"
                value={maskingLevel}
                onChange={(e) => handleMaskingLevelChange(Number(e.target.value))}
              >
                {availableLevels.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-2 mb-3">
          <button
              className={`w-full px-4 py-2 rounded text-sm ${isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
              {isPlaying ? 'Release to Stop' : 'Hold to Play'}
          </button>
          </div>
       
          
          <div className="flex flex-col gap-2">
          <button
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            onClick={addResponse}
          >
            Add Response
          </button>
          <button
              className="w-full px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm"
            onClick={addNoResponse}
          >
            No Response
          </button>
            <div className="mt-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                  <button className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm flex items-center justify-center gap-2">
                Clear Test
                    <ChevronDown size={14} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Clear Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => clearEarResults('L')}>Clear Left Ear</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => clearEarResults('R')}>Clear Right Ear</DropdownMenuItem>
              <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => clearModeResults('AC')}>Clear Air Conduction</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => clearModeResults('BC')}>Clear Bone Conduction</DropdownMenuItem>
              <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={clearTest} className="text-red-600">Clear All Results</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
            </div>
          <button
              className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm transition-all duration-200 hover:shadow-lg hover:scale-105"
            onClick={handleSubmit}
          >
            Submit Test
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
