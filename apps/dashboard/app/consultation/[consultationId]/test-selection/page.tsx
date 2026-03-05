"use client";

import { useRouter, useParams } from "next/navigation";
import { useSocket } from "@/providers/socket-provider";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

const testOptions = [
  {
    id: "pure-tone",
    name: "Pure Tone Audiometry",
    description: "Test hearing sensitivity across different frequencies",
    available: true,
  },
  {
    id: "tympanometry",
    name: "Tympanometry",
    description: "Assess middle ear function and mobility",
    available: true,
  },
  {
    id: "etf-intact",
    name: "ETF Intact",
    description: "Eustachian tube function test with three sequential curves",
    available: true,
  },
  {
    id: "video-otoscopy",
    name: "Video Otoscopy",
    description: "Visualize the middle ear and tympanic membrane",
    available: true,
  },
  {
    id: "tone-decay",
    name: "Tone Decay Test",
    description: "Assess auditory nerve adaptation to sustained tones",
    available: true,
  },
  {
    id: "reflexometry",
    name: "Acoustic Reflex Test",
    description: "Measure stapedial reflex thresholds (IPSI & CONTRA)",
    available: true,
  },
  {
    id: "otoacoustic",
    name: "Otoacoustic Emissions",
    description: "Measure inner ear response to sound",
    available: true,
  },
];

// Sound wave icon matching the images
function AudioIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-gray-400 flex-shrink-0 mt-0.5"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

export default function TestSelectionPage() {
  const { consultationId } = useParams();
  const cid = Array.isArray(consultationId) ? consultationId[0] : consultationId ?? "";
  const router = useRouter();
  const socket = useSocket();

  const handleTestClick = (testId: string) => {
    if (socket?.connected) {
      const backendTestId = testId === "otoacoustic" ? "OAE" : testId;
      socket.emit("start-test", { consultationId: cid, testId: backendTestId }, (ack: any) => {
        if (ack?.success) {
          toast.success("Test started successfully");
        } else if (ack?.message) {
          toast.error(ack.message);
        }
      });
    }

    // Always navigate - tests can work without start-test ack (e.g. when socket connects later)
    router.push(`/consultation/${cid}/test/${testId}`);
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="px-6 py-6">
        {/* Page Title */}
        <h2 className="text-xl font-bold text-gray-900 mb-5">Schedule Test</h2>

        {/* Test List */}
        <div className="flex flex-col divide-y divide-gray-100 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {testOptions.map((test) => (
            <button
              key={test.id}
              onClick={test.available ? () => handleTestClick(test.id) : undefined}
              disabled={!test.available}
              className={`
                flex items-start gap-3 px-5 py-4 text-left w-full transition-colors
                ${test.available
                  ? "hover:bg-gray-50 cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
                }
              `}
            >
              <AudioIcon />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 leading-snug">
                  {test.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 leading-snug">
                  {test.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}