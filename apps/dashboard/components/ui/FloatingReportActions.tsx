"use client";
import React from "react";
import { Button } from "@/components/ui/button";

interface FloatingReportActionsProps {
  isScreenConnecting?: boolean;
  isScreenSharing?: boolean;
  isShowingReport?: boolean;
  onToggleShowReport?: () => void;
  onDoAnotherTest: () => void;
  onEndConsultation: () => void;
  onShare?: () => void;
}

export const FloatingReportActions: React.FC<FloatingReportActionsProps> = ({
  isScreenConnecting = false,
  isScreenSharing = false,
  isShowingReport = false,
  onToggleShowReport,
  onDoAnotherTest,
  onEndConsultation,
  onShare,
}) => {
  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-10">
      {onToggleShowReport && (
        <Button
          onClick={onToggleShowReport}
          disabled={isScreenConnecting}
          className={`${(isShowingReport || isScreenSharing)
            ? "bg-orange-600 hover:bg-orange-700"
            : "bg-blue-600 hover:bg-blue-700"
          } text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 disabled:opacity-50`}
        >
          <span>{isScreenConnecting ? "🔄" : isScreenSharing ? "🖥️" : "📊"}</span>
          {isScreenConnecting
            ? "Connecting..."
            : (isShowingReport || isScreenSharing)
              ? "Hide Report"
              : "Show Report"
          }
        </Button>
      )}
      {onShare && (
        <Button
          onClick={onShare}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2"
        >
          <span>📤</span>
          Share Report
        </Button>
      )}
      <Button
        onClick={onDoAnotherTest}
        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2"
      >
        <span>🔄</span>
        Do Another Test
      </Button>
      <Button
        onClick={onEndConsultation}
        className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2"
      >
        <span>✅</span>
        End Consultation
      </Button>
    </div>
  );
};

export default FloatingReportActions; 