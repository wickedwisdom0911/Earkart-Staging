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
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-center gap-3 sm:gap-4">
          {onToggleShowReport && (
            <Button
              onClick={onToggleShowReport}
              disabled={isScreenConnecting}
              size="sm"
              className={`${(isShowingReport || isScreenSharing)
                ? "bg-orange-500 hover:bg-orange-600"
                : "bg-blue-500 hover:bg-blue-600"
              } text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span className="text-base">{isScreenConnecting ? "🔄" : isScreenSharing ? "🖥️" : "📊"}</span>
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
              size="sm"
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2 text-sm font-medium"
            >
              <span className="text-base">📤</span>
              <span>Share</span>
            </Button>
          )}
          
          <Button
            onClick={onDoAnotherTest}
            size="sm"
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2 text-sm font-medium"
          >
            <span className="text-base">🔄</span>
            <span>Another Test</span>
          </Button>
          
          <Button
            onClick={onEndConsultation}
            size="sm"
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2 text-sm font-medium"
          >
            <span className="text-base">✅</span>
            <span>End Consultation</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StickyReportNavigation;
