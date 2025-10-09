"use client";
import React from "react";
import { Button } from "@/components/ui/button";

interface StickyReportNavigationProps {
  isScreenConnecting?: boolean;
  isScreenSharing?: boolean;
  isShowingReport?: boolean;
  onToggleShowReport?: () => void;
  onDoAnotherTest: () => void;
  onEndConsultation: () => void;
  onShare?: () => void;
}

export const StickyReportNavigation: React.FC<StickyReportNavigationProps> = ({
  isScreenConnecting = false,
  isScreenSharing = false,
  isShowingReport = false,
  onToggleShowReport,
  onDoAnotherTest,
  onEndConsultation,
  onShare,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-t-2 border-gray-200 shadow-2xl backdrop-blur-sm z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-center gap-3 sm:gap-4">
          {onToggleShowReport && (
            <Button
              onClick={onToggleShowReport}
              disabled={isScreenConnecting}
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
              size="lg"
              className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-5 py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2.5 text-sm font-semibold shadow-indigo-200"
            >
              <span className="text-lg">📤</span>
              <span>Share</span>
            </Button>
          )}
          
          <Button
            onClick={onDoAnotherTest}
            size="lg"
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-5 py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2.5 text-sm font-semibold shadow-green-200"
          >
            <span className="text-lg">🔄</span>
            <span>Another Test</span>
          </Button>
          
          <Button
            onClick={onEndConsultation}
            size="lg"
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-5 py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2.5 text-sm font-semibold shadow-red-200"
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
