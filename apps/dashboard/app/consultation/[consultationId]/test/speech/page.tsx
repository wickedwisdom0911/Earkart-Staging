"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/providers/socket-provider";
import { useParams } from "next/navigation";

export default function SpeechTestPage() {
  const socket = useSocket();
  const { consultationId } = useParams();
  const [showNackDialog, setShowNackDialog] = useState(false);
  const [nackMessage, setNackMessage] = useState("");

  // Socket event listeners for nack
  useEffect(() => {
    if (!socket) return;
    
    // Dedicated handler for nack-received (test cannot be performed)
    const handleNackReceived = (data: { message?: string; testId?: string }) => {
      console.warn("⚠️ [SPEECH] [NACK Received] Test not ready or error:", data);
      
      // Extract message
      const errorMessage = data.message || "Test device not ready or test cannot be performed at this time";
      
      // Show big dialog instead of toast - requires audiologist confirmation
      setNackMessage(errorMessage);
      setShowNackDialog(true);
      
      // Log for debugging
      console.error("❌ [SPEECH] [NACK] Test cannot proceed:", {
        message: errorMessage,
        testId: data.testId,
        consultationId: consultationId,
      });
    };
    
    socket.on("nack-received", handleNackReceived);
    
    return () => {
      socket.off("nack-received", handleNackReceived);
    };
  }, [socket, consultationId]);

  return (
    <>
      <div>Speech Test Page</div>

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
    </>
  );
}
