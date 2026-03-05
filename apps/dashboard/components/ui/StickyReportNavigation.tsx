"use client";
import React from "react";
import { Button } from "@/components/ui/button";

interface StickyReportNavigationProps {
  isScreenConnecting?: boolean;
  isScreenSharing?: boolean;
  isShowingReport?: boolean;
  isSendingReport?: boolean;
  onToggleShowReport?: () => void;
  onDoAnotherTest: () => void;
  onEndConsultation: () => void;
  onShare?: () => void;
}

export const StickyReportNavigation: React.FC<StickyReportNavigationProps> = ({
  isScreenConnecting = false,
  isScreenSharing = false,
  isShowingReport = false,
  isSendingReport = false,
  onToggleShowReport,
  onDoAnotherTest,
  onEndConsultation,
  onShare,
}) => {
  const isDisabled = isSendingReport;
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t-2 border-indigo-200 shadow-[0_-4px_20px_rgba(0,0,0,0.12)] z-50">
      {isSendingReport && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
            <p className="text-sm font-medium text-gray-700">Sending report... Please wait</p>
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <p className="text-center text-xs font-medium text-indigo-600 mb-2.5 tracking-wide">
          Share report via WhatsApp before leaving
        </p>
        <div className="flex items-center justify-center gap-3 sm:gap-4">
          {onToggleShowReport && (
            <Button
              onClick={onToggleShowReport}
              disabled={isScreenConnecting || isDisabled}
              size="lg"
              className={`${(isShowingReport || isScreenSharing)
                ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-200"
                : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-200"
              } text-white px-5 py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
            >
              <span className="text-lg">{isScreenConnecting ? "🔄" : isScreenSharing ? "🖥️" : "📊"}</span>
              <span>
                {isScreenConnecting
                  ? "Connecting..."
                  : (isShowingReport || isScreenSharing)
                    ? "Hide Report"
                    : "Show Report"
                }
              </span>
            </Button>
          )}
          
          {onShare && (
            <Button
              onClick={onShare}
              disabled={isDisabled}
              size="lg"
              className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-5 py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2.5 text-sm font-semibold shadow-indigo-200 ring-2 ring-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <span className="text-lg">📤</span>
              <span>Share Report</span>
            </Button>
          )}
          
          <Button
            onClick={onDoAnotherTest}
            disabled={isDisabled}
            size="lg"
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-5 py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2.5 text-sm font-semibold shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <span className="text-lg">🔄</span>
            <span>Another Test</span>
          </Button>
          
          <Button
            onClick={onEndConsultation}
            disabled={isDisabled}
            size="lg"
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-5 py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2.5 text-sm font-semibold shadow-red-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <span className="text-lg">✅</span>
            <span>End Consultation</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StickyReportNavigation;
