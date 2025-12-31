"use client";

import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { Card, CardContent } from "@/components/ui/card";
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
  }
];

export default function TestSelectionPage() {
  const router = useRouter();
  const params = useParams();
  const socket = useSocket();
  const lastRequestedTestRef = useRef<string | null>(null);
  const consultationId = params.consultationId as string;

  // Consume test readiness/issue events
  useEffect(() => {
    if (!socket) return;

    const onAck = () => {
      const targetTest = lastRequestedTestRef.current ?? "tympanometry";
      router.push(`/consultation/${consultationId}/test/${targetTest}`);
    };
    const onIssue = (payload: { message?: string }) => {
      const targetTest = lastRequestedTestRef.current ?? "tympanometry";
      const testName = testOptions.find(t => t.id === targetTest)?.name || "Test";
      toast.error(payload?.message || `${testName} device not ready`);
    };

    socket.on("ack-tympanometry-received", onAck);
    socket.on("ack-received", onAck);
    socket.on("nack-received", onIssue);

    return () => {
      socket.off("ack-tympanometry-received", onAck);
      socket.off("ack-received", onAck);
      socket.off("nack-received", onIssue);
    };
  }, [socket, router, consultationId]);

  const handleTestClick = (testId: string) => {
    lastRequestedTestRef.current = testId;
    socket?.emit("start-test", {
      testId,
      consultationId,
    });
    router.push(`/consultation/${consultationId}/test/${testId}`);
  };

  return (
    <DashboardBodyWrapper
      className="border-none justify-around"
      pageTitle="Test Selection"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {testOptions.map((test) => (
          <Card
            key={test.id}
            className={`transition-shadow ${
              test.available
                ? "cursor-pointer hover:shadow-lg"
                : "cursor-not-allowed opacity-50 bg-gray-100"
            }`}
            onClick={test.available ? () => handleTestClick(test.id) : undefined}
          >
            <CardContent className="p-6">
              <h2 className={`text-xl font-semibold mb-2 ${
                test.available ? "" : "text-gray-500"
              }`}>
                {test.name}
              </h2>
              <p className={`${
                test.available ? "text-gray-600" : "text-gray-400"
              }`}>
                {test.description}
              </p>
              {!test.available && (
                <p className="text-sm text-gray-500 mt-2 italic">
                  Currently unavailable
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardBodyWrapper>
  );
}
