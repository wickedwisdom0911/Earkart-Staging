"use client";
import React, { useState, useCallback, useMemo, useEffect } from "react";
import PureToneGraph from "./_components/audiogram";
import { useSocket } from "@/providers/socket-provider";
import { useParams } from "next/navigation";
import { useDevice } from "@/providers/device-provider";
import PureToneLoadingSkeleton from "./_components/loading-skeleton";

enum SignalType {
  Steady = "Steady",
  Warble = "Warble",
  NB = "NB",
  White = "White",
  SpeechNoise = "SpeechNoise",
}

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
  }>;
}

export default function PureTonePage() {
  const [selectedEar, setSelectedEar] = useState<"L" | "R">("R");
  const [selectedMode, setSelectedMode] = useState<"AC" | "BC">("AC");
  const [selectedFrequency, setSelectedFrequency] = useState(1000);
  const [selectedLevel, setSelectedLevel] = useState(105);
  const [selectedSignalType, setSelectedSignalType] = useState<SignalType>(
    SignalType.Steady
  );
  const [isPulsed, setIsPulsed] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [selectedLabelIndexes, setSelectedLabelIndexes] = useState({
    x: 5,
    y: 13,
  }); // Default to 1000Hz, 0dB
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMasking, setIsMasking] = useState(false);
  const [maskingLevel, setMaskingLevel] = useState(0);
  const [transducerData, setTransducerData] = useState<TransducerData | null>(
    null
  );
  const socket = useSocket();
  const { consultationId } = useParams();
  const { deviceState } = useDevice();

  // Update transducer data only when valid data is received
  useEffect(() => {
    if (deviceState?.transducerResponse?.Transducers) {
      setTransducerData(deviceState.transducerResponse);
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
      // Update the y-axis index for the audiogram
      const levelIndex = availableLevels.findIndex((l) => l === selectedLevel);
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
    return currentTransducer.EarSides.map((side: number) =>
      side === 0 ? "L" : "R"
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
    const freqIndex = availableFrequencies.findIndex((f) => f === freq);
    if (freqIndex !== -1) {
      setSelectedLabelIndexes((prev) => ({ ...prev, x: freqIndex }));
    }
    // Reset level to first available level for the new frequency
    if (availableLevels.length > 0) {
      setSelectedLevel(availableLevels[0]);
    }
    if (isPlaying) {
      _endAudiometrySignal();
      _sendAudiometrySignal();
    }
  };

  // Handle level change
  const handleLevelChange = (level: number) => {
    setSelectedLevel(level);
    const levelIndex = availableLevels.findIndex((l) => l === level);
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
  const addTestResult = () => {
    const newResult: TestResult = {
      ear: selectedEar,
      x: selectedFrequency,
      y: selectedLevel,
      mode: selectedMode,
      masking: isMasking ? maskingLevel : 0,
      noResponse: 0,
      signalType: selectedSignalType,
      pulsed: isPulsed,
    };
    setTestResults((prev) => [...prev, newResult]);
  };

  // Handle audiogram click
  const handleAudiogramClick = (x: number, y: number) => {
    const newFrequency = availableFrequencies[x];
    const newLevel = availableLevels[y];

    setSelectedLabelIndexes({ x, y });
    setSelectedFrequency(newFrequency);
    setSelectedLevel(newLevel);

    if (isPlaying) {
      _endAudiometrySignal();
      _sendAudiometrySignal();
    }
  };

  if (!currentTransducer) {
    return <PureToneLoadingSkeleton />;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Pure Tone Audiometry</h1>
          <div className="flex items-center gap-4"></div>
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
            onClick={addTestResult}
          >
            Add Result
          </button>
          <button
            className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            onClick={() => setTestResults([])}
          >
            Clear Results
          </button>
        </div>
      </div>

      {/* Audiogram Display */}
      <div className="border flex items-center justify-center rounded p-4">
        <PureToneGraph
          selectedLabelIndexes={selectedLabelIndexes}
          resultMarkings={testResults}
          onIndexChange={handleAudiogramClick}
        />
      </div>
    </div>
  );
}
