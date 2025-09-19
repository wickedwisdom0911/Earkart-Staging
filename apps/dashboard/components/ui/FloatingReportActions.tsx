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
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
      {onToggleShowReport && (
        <Button
          onClick={onToggleShowReport}
          disabled={isScreenConnecting}
          size="sm"
          className={`${(isShowingReport || isScreenSharing)
            ? "bg-orange-500 hover:bg-orange-600 shadow-orange-200"
            : "bg-blue-500 hover:bg-blue-600 shadow-blue-200"
          } text-white px-3 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-1.5 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <span className="text-sm">{isScreenConnecting ? "🔄" : isScreenSharing ? "🖥️" : "📊"}</span>
          <span className="hidden sm:inline">
            {isScreenConnecting
              ? "Connecting..."
              : (isShowingReport || isScreenSharing)
                ? "Hide"
                : "Show"
            }
          </span>
        </Button>
      )}
      {onShare && (
        <Button
          onClick={onShare}
          size="sm"
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-1.5 text-xs font-medium shadow-indigo-200"
        >
          <span className="text-sm">📤</span>
          <span className="hidden sm:inline">Share</span>
        </Button>
      )}
      <Button
        onClick={onDoAnotherTest}
        size="sm"
        className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-1.5 text-xs font-medium shadow-green-200"
      >
        <span className="text-sm">🔄</span>
        <span className="hidden sm:inline">Another Test</span>
      </Button>
      <Button
        onClick={onEndConsultation}
        size="sm"
        className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-1.5 text-xs font-medium shadow-red-200"
      >
        <span className="text-sm">✅</span>
        <span className="hidden sm:inline">End</span>
      </Button>
    </div>
  );
};

export default FloatingReportActions; 