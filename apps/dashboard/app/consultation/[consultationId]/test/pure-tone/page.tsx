"use client";
import React, { useState, useCallback, useRef } from "react";
import PureToneGraph from "./_components/audiogram";

interface TestResult {
  ear: string;
  x: number;
  y: number;
  mode: string;
  masking: number;
  noResponse: number;
}

const FREQUENCIES = [
  "125",
  "250",
  "500",
  "750",
  "1000",
  "1500",
  "2000",
  "3000",
  "4000",
  "6000",
  "8000",
];
const HEARING_LEVELS = Array.from({ length: 27 }, (_, i) => (i - 2) * 5); // -10 to 120 in steps of 5

export default function PureTonePage() {
  const [selectedEar, setSelectedEar] = useState<"L" | "R">("L");
  const [selectedMode, setSelectedMode] = useState<"AC" | "BC">("AC");
  const [selectedFrequency, setSelectedFrequency] = useState(1000);
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [selectedLabelIndexes, setSelectedLabelIndexes] = useState({
    x: 5,
    y: 13,
  }); // Default to 1000Hz, 0dB
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Initialize audio context
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
    }
  }, []);

  // Play tone
  const playTone = useCallback(() => {
    if (!audioContextRef.current) {
      initAudio();
    }

    if (audioContextRef.current && !oscillatorRef.current) {
      oscillatorRef.current = audioContextRef.current.createOscillator();
      oscillatorRef.current.type = "sine";
      oscillatorRef.current.frequency.setValueAtTime(
        selectedFrequency,
        audioContextRef.current.currentTime
      );

      // Convert dB HL to gain (simplified conversion)
      const gain = Math.pow(10, (selectedLevel - 100) / 20);
      gainNodeRef.current?.gain.setValueAtTime(
        gain,
        audioContextRef.current.currentTime
      );

      oscillatorRef.current.connect(gainNodeRef.current!);
      oscillatorRef.current.start();
      setIsPlaying(true);
    }
  }, [selectedFrequency, selectedLevel, initAudio]);

  // Stop tone
  const stopTone = useCallback(() => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
      setIsPlaying(false);
    }
  }, []);

  // Toggle tone
  const toggleTone = useCallback(() => {
    if (isPlaying) {
      stopTone();
    } else {
      playTone();
    }
  }, [isPlaying, playTone, stopTone]);

  // Handle frequency change
  const handleFrequencyChange = (freq: number) => {
    setSelectedFrequency(freq);
    const freqIndex = FREQUENCIES.findIndex((f) => Number(f) === freq);
    if (freqIndex !== -1) {
      setSelectedLabelIndexes((prev) => ({ ...prev, x: freqIndex }));
    }
    if (isPlaying) {
      stopTone();
      playTone();
    }
  };

  // Handle level change
  const handleLevelChange = (level: number) => {
    setSelectedLevel(level);
    const levelIndex = HEARING_LEVELS.findIndex((l) => l === level);
    if (levelIndex !== -1) {
      setSelectedLabelIndexes((prev) => ({ ...prev, y: levelIndex }));
    }
    if (isPlaying && gainNodeRef.current && audioContextRef.current) {
      const gain = Math.pow(10, (level - 100) / 20);
      gainNodeRef.current.gain.setValueAtTime(
        gain,
        audioContextRef.current.currentTime
      );
    }
  };

  // Add test result
  const addTestResult = () => {
    const newResult: TestResult = {
      ear: selectedEar,
      x: selectedFrequency,
      y: selectedLevel,
      mode: selectedMode,
      masking: 0,
      noResponse: 0,
    };
    setTestResults((prev) => [...prev, newResult]);
  };

  // Handle audiogram click
  const handleAudiogramClick = (x: number, y: number) => {
    const newFrequency = Number(FREQUENCIES[x]);
    const newLevel = HEARING_LEVELS[y];

    setSelectedLabelIndexes({ x, y });
    setSelectedFrequency(newFrequency);
    setSelectedLevel(newLevel);

    // Update audio if playing
    if (isPlaying) {
      if (oscillatorRef.current && audioContextRef.current) {
        oscillatorRef.current.frequency.setValueAtTime(
          newFrequency,
          audioContextRef.current.currentTime
        );
      }
      if (gainNodeRef.current && audioContextRef.current) {
        const gain = Math.pow(10, (newLevel - 100) / 20);
        gainNodeRef.current.gain.setValueAtTime(
          gain,
          audioContextRef.current.currentTime
        );
      }
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Pure Tone Audiometry</h1>

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
            <label className="block text-sm font-medium mb-2">Mode</label>
            <div className="flex gap-4">
              <button
                className={`px-4 py-2 rounded ${selectedMode === "AC" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                onClick={() => setSelectedMode("AC")}
              >
                Air
              </button>
              <button
                className={`px-4 py-2 rounded ${selectedMode === "BC" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
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
              {FREQUENCIES.map((freq) => (
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
              {HEARING_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            className={`px-6 py-2 rounded flex items-center gap-2 ${
              isPlaying
                ? "bg-red-500 hover:bg-red-600"
                : "bg-green-500 hover:bg-green-600"
            } text-white`}
            onClick={toggleTone}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              {isPlaying ? (
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
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
            {isPlaying ? "Stop Tone" : "Play Tone"}
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
      <div className="border rounded p-4">
        <PureToneGraph
          selectedLabelIndexes={selectedLabelIndexes}
          resultMarkings={testResults}
          onIndexChange={handleAudiogramClick}
        />
      </div>
    </div>
  );
}
