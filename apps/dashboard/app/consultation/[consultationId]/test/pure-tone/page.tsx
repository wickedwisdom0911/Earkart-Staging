"use client";
import React, { useState, useCallback, useRef, useEffect } from "react";
import PureToneGraph from "./_components/audiogram";
import { useSocket } from "@/providers/socket-provider";
import { useParams } from "next/navigation";

enum SignalType {
  Steady = "Steady",
  Pulsed = "Pulsed",
  Warble = "Warble",
  NB = "NB",
  White = "White",
  SpeechNoise = "SpeechNoise",
  Speech = "Speech",
}

interface TestResult {
  ear: string;
  x: number;
  y: number;
  mode: string;
  masking: number;
  noResponse: number;
  signalType: SignalType;
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
  const { consultationId } = useParams();
  const [selectedEar, setSelectedEar] = useState<"L" | "R">("L");
  const [selectedMode, setSelectedMode] = useState<"AC" | "BC">("AC");
  const [selectedFrequency, setSelectedFrequency] = useState(1000);
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [selectedSignalType, setSelectedSignalType] = useState<SignalType>(
    SignalType.Steady
  );
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [selectedLabelIndexes, setSelectedLabelIndexes] = useState({
    x: 5,
    y: 13,
  }); // Default to 1000Hz, 0dB
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMasking, setIsMasking] = useState(false);
  const [maskingLevel, setMaskingLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const maskingOscillatorRef = useRef<OscillatorNode | null>(null);
  const maskingGainNodeRef = useRef<GainNode | null>(null);
  const [isR15cCeoonected, setIsR15cCeoonected] = useState(false);
  const [isDeviceReady, setIsDeviceReady] = useState(false);
  const socket = useSocket();

  useEffect(() => {
    socket?.on(
      "device_event",
      (data: {
        r15cConnected: boolean;
        revo2Connected: boolean;
        synced: boolean;
        portOpen: boolean;
      }) => {
        console.log(data);
        setIsR15cCeoonected(data.r15cConnected);
        setIsDeviceReady(data.synced && data.portOpen);
      }
    );
    if (isR15cCeoonected) {
      socket?.emit("start-test", {
        testId: "pure-tone",
        consultationId: consultationId,
      });
      console.log("started test");
    }
  }, [socket, isR15cCeoonected]);

  // Initialize audio context
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);

      // Initialize masking audio nodes
      maskingGainNodeRef.current = audioContextRef.current.createGain();
      maskingGainNodeRef.current.connect(audioContextRef.current.destination);
    }
  }, []);

  // Play tone
  const playTone = useCallback(() => {
    if (!audioContextRef.current) {
      initAudio();
    }

    if (audioContextRef.current && !oscillatorRef.current) {
      oscillatorRef.current = audioContextRef.current.createOscillator();

      // Configure oscillator based on signal type
      switch (selectedSignalType) {
        case SignalType.Steady:
          oscillatorRef.current.type = "sine";
          oscillatorRef.current.frequency.setValueAtTime(
            selectedFrequency,
            audioContextRef.current.currentTime
          );
          oscillatorRef.current.connect(gainNodeRef.current!);
          break;
        case SignalType.Pulsed:
          oscillatorRef.current.type = "sine";
          // Add pulsing effect using gain modulation
          const pulseGain = audioContextRef.current.createGain();
          const pulseOsc = audioContextRef.current.createOscillator();
          pulseOsc.frequency.setValueAtTime(
            2,
            audioContextRef.current.currentTime
          ); // 2Hz pulsing
          pulseGain.gain.setValueAtTime(
            0.5,
            audioContextRef.current.currentTime
          );
          pulseOsc.connect(pulseGain.gain);
          pulseOsc.start();
          oscillatorRef.current.frequency.setValueAtTime(
            selectedFrequency,
            audioContextRef.current.currentTime
          );
          oscillatorRef.current.connect(pulseGain);
          pulseGain.connect(gainNodeRef.current!);
          break;
        case SignalType.Warble:
          oscillatorRef.current.type = "sine";
          // Add frequency modulation for warble effect
          const warbleOsc = audioContextRef.current.createOscillator();
          warbleOsc.frequency.setValueAtTime(
            5,
            audioContextRef.current.currentTime
          ); // 5Hz warble
          warbleOsc.connect(oscillatorRef.current.frequency);
          warbleOsc.start();
          oscillatorRef.current.frequency.setValueAtTime(
            selectedFrequency,
            audioContextRef.current.currentTime
          );
          oscillatorRef.current.connect(gainNodeRef.current!);
          break;
        case SignalType.NB:
          // Narrow band noise
          const noiseBuffer = audioContextRef.current.createBuffer(
            1,
            audioContextRef.current.sampleRate,
            audioContextRef.current.sampleRate
          );
          const noiseData = noiseBuffer.getChannelData(0);
          for (let i = 0; i < noiseBuffer.length; i++) {
            noiseData[i] = Math.random() * 2 - 1;
          }
          const noiseSource = audioContextRef.current.createBufferSource();
          noiseSource.buffer = noiseBuffer;
          noiseSource.loop = true;
          noiseSource.connect(gainNodeRef.current!);
          noiseSource.start();
          return; // Skip the rest of the function for noise
        case SignalType.White:
          // White noise
          const whiteNoise = audioContextRef.current.createScriptProcessor(
            4096,
            1,
            1
          );
          whiteNoise.onaudioprocess = (e) => {
            const output = e.outputBuffer.getChannelData(0);
            for (let i = 0; i < output.length; i++) {
              output[i] = Math.random() * 2 - 1;
            }
          };
          whiteNoise.connect(gainNodeRef.current!);
          return; // Skip the rest of the function for noise
        case SignalType.SpeechNoise:
        case SignalType.Speech:
          // These would require more complex implementation with audio files
          console.warn("Speech and Speech Noise not implemented yet");
          return;
      }

      // Convert dB HL to gain (simplified conversion)
      const gain = Math.pow(10, (selectedLevel - 100) / 20);
      gainNodeRef.current?.gain.setValueAtTime(
        gain,
        audioContextRef.current.currentTime
      );

      if (oscillatorRef.current) {
        oscillatorRef.current.start();
      }
      setIsPlaying(true);

      // Start masking tone if enabled
      if (isMasking && !maskingOscillatorRef.current) {
        maskingOscillatorRef.current =
          audioContextRef.current.createOscillator();
        maskingOscillatorRef.current.type = "sine";
        maskingOscillatorRef.current.frequency.setValueAtTime(
          selectedFrequency,
          audioContextRef.current.currentTime
        );

        const maskingGain = Math.pow(10, (maskingLevel - 100) / 20);
        maskingGainNodeRef.current?.gain.setValueAtTime(
          maskingGain,
          audioContextRef.current.currentTime
        );

        maskingOscillatorRef.current.connect(maskingGainNodeRef.current!);
        maskingOscillatorRef.current.start();
      }
    }
  }, [
    selectedFrequency,
    selectedLevel,
    isMasking,
    maskingLevel,
    selectedSignalType,
    initAudio,
  ]);

  // Stop tone
  const stopTone = useCallback(() => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }
    if (maskingOscillatorRef.current) {
      maskingOscillatorRef.current.stop();
      maskingOscillatorRef.current.disconnect();
      maskingOscillatorRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // Handle mouse down for play tone
  const handleMouseDown = useCallback(() => {
    playTone();
  }, [playTone]);

  // Handle mouse up for stop tone
  const handleMouseUp = useCallback(() => {
    stopTone();
  }, [stopTone]);

  // Handle mouse leave for stop tone
  const handleMouseLeave = useCallback(() => {
    if (isPlaying) {
      stopTone();
    }
  }, [isPlaying, stopTone]);

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

  // Handle masking level change
  const handleMaskingLevelChange = (level: number) => {
    setMaskingLevel(level);
    if (isPlaying && maskingGainNodeRef.current && audioContextRef.current) {
      const gain = Math.pow(10, (level - 100) / 20);
      maskingGainNodeRef.current.gain.setValueAtTime(
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
      masking: isMasking ? maskingLevel : 0,
      noResponse: 0,
      signalType: selectedSignalType,
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
      // Update masking tone frequency
      if (
        isMasking &&
        maskingOscillatorRef.current &&
        audioContextRef.current
      ) {
        maskingOscillatorRef.current.frequency.setValueAtTime(
          newFrequency,
          audioContextRef.current.currentTime
        );
      }
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Pure Tone Audiometry</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${isR15cCeoonected ? "bg-green-500" : "bg-red-500"}`}
              />
              <span className="text-sm font-medium">
                R15C {isR15cCeoonected ? "Connected" : "Disconnected"}
              </span>
            </div>
            {isR15cCeoonected && (
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${isDeviceReady ? "bg-green-500" : "bg-yellow-500"}`}
                />
                <span className="text-sm font-medium">
                  {isDeviceReady ? "Ready" : "Not Ready"}
                </span>
              </div>
            )}
          </div>
        </div>

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

          <div>
            <label className="block text-sm font-medium mb-2">
              Signal Type
            </label>
            <select
              className="w-full p-2 border rounded"
              value={selectedSignalType}
              onChange={(e) => {
                setSelectedSignalType(e.target.value as SignalType);
                if (isPlaying) {
                  stopTone();
                  playTone();
                }
              }}
            >
              {Object.values(SignalType).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
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
                    {HEARING_LEVELS.map((level) => (
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
            Hold to Play
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
