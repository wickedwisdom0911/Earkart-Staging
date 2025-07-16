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
    if (socket) {
      socket.on("patient-response", (data) => {
        setIsPatientResponse(data.patientResponse);
      });
    }

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
      const timer = setTimeout(() => {
        setIsPatientResponse(false);
      }, 3000);

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
        maskingSignal: isMasking,
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
    isMasking,
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

    // Reset level to first available level for the new frequency
    if (availableLevels.length > 0) {
      const newLevel = availableLevels[0];
      setSelectedLevel(newLevel);

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
  };

  // Add test result
  const addTestResult = (noResponse = false) => {
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
  };

  // Helper functions for button clicks
  const addResponse = () => addTestResult(false);  // false = normal response, no arrow
  const addNoResponse = () => addTestResult(true); // true = no response, show arrow

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
      {/* Patient Response Indicator */}
      {isPatientResponse && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded-md">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-yellow-800 font-medium">
              Patient Responded
            </span>
          </div>
        </div>
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

        {/* Test Controls */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Ear</label>
            <div className="flex gap-4">
              {availableEarSides.map((ear: "L" | "R") => (
                <button
                  key={ear}
                  className={`px-4 py-2 rounded ${
                    selectedEar === ear
                      ? ear === "L"
                        ? "bg-blue-500 text-white"
                        : "bg-red-500 text-white"
                      : "bg-gray-200"
                  }`}
                  onClick={() => setSelectedEar(ear)}
                >
                  {ear === "L" ? "Left" : "Right"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Mode</label>
            <div className="flex gap-4">
              <button
                className={`px-4 py-2 rounded ${
                  selectedMode === "AC"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                }`}
                onClick={() => setSelectedMode("AC")}
              >
                Air
              </button>
              <button
                className={`px-4 py-2 rounded ${
                  selectedMode === "BC"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                }`}
                onClick={() => setSelectedMode("BC")}
              >
                Bone
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Frequency (Hz)
            </label>
            <select
              className="w-full p-2 border rounded"
              value={selectedFrequency}
              onChange={(e) => handleFrequencyChange(Number(e.target.value))}
            >
              {availableFrequencies.map((freq) => (
                <option key={freq} value={freq}>
                  {freq}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Level (dB HL)
            </label>
            <select
              className="w-full p-2 border rounded"
              value={selectedLevel}
              onChange={(e) => handleLevelChange(Number(e.target.value))}
            >
              {availableLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Signal Type
            </label>
            <select
              className="w-full p-2 border rounded"
              value={selectedSignalType}
              onChange={(e) =>
                handleSignalTypeChange(e.target.value as SignalType)
              }
            >
              {availableSignalTypes.map((type: SignalType) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Pulsed Signal
            </label>
            <button
              className={`w-full px-4 py-2 rounded flex items-center justify-center gap-2 ${
                isPulsed ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
              onClick={() => {
                setIsPulsed((prev) => !prev);
                if (isPlaying) {
                  _endAudiometrySignal();
                  _sendAudiometrySignal();
                }
              }}
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
              {isPulsed ? "Pulsed On" : "Pulsed Off"}
            </button>
          </div>

          {/* Masking Controls */}
          <div className="col-span-2">
            <div className="flex items-end gap-4">
              <button
                className={`px-4 py-2 rounded flex items-center gap-2 ${
                  isMasking ? "bg-purple-500 text-white" : "bg-gray-200"
                }`}
                onClick={() => setIsMasking((prev) => !prev)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 100-12 6 6 0 000 12z"
                    clipRule="evenodd"
                  />
                </svg>
                {isMasking ? "Masking On" : "Masking Off"}
              </button>
              {isMasking && (
                <div className="flex-1 ">
                  <label className="block text-sm font-medium mb-2">
                    Masking Level (dB HL)
                  </label>
                  <select
                    className="w-full p-2 border rounded"
                    value={maskingLevel}
                    onChange={(e) =>
                      handleMaskingLevelChange(Number(e.target.value))
                    }
                  >
                    {availableLevels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            className={`px-6 py-2 rounded flex items-center gap-2 ${
              isPlaying
                ? "bg-red-500 hover:bg-red-600"
                : "bg-green-500 hover:bg-green-600"
            } text-white select-none`}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
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
            {isPlaying ? "Release to Stop" : "Hold to Play"}
          </button>
          <button
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={addResponse}
          >
            Add Response
          </button>
          <button
            className="px-6 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            onClick={addNoResponse}
          >
            No Response
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center gap-2">
                Clear Test
                <ChevronDown size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Clear Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => clearEarResults("L")}>
                Clear Left Ear
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => clearEarResults("R")}>
                Clear Right Ear
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => clearModeResults("AC")}>
                Clear Air Conduction
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => clearModeResults("BC")}>
                Clear Bone Conduction
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={clearTest} className="text-red-600">
                Clear All Results
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-all duration-200 hover:shadow-lg hover:scale-105"
            onClick={handleSubmit}
          >
            Submit Test
          </button>
        </div>
      </div>



      {/* Audiogram Display */}
      <div className="border flex items-center justify-center rounded p-4">
        <div className="w-full">
        <PureToneGraph
          selectedLabelIndexes={selectedLabelIndexes}
          resultMarkings={testResults}
          onIndexChange={handleAudiogramClick}
        />
      </div>
      </div>
    </div>
  );
}
