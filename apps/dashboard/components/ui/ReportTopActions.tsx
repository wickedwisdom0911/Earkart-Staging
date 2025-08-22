"use client";
import React from "react";
import { Button } from "@/components/ui/button";

interface ReportTopActionsProps {
  onDownload: () => void;
  onShare?: () => void;
}

const ReportTopActions: React.FC<ReportTopActionsProps> = ({ onDownload, onShare }) => {
  return (
    <div className="flex justify-center p-4 border-b gap-3">
      <Button onClick={onDownload} className="bg-blue-600 hover:bg-blue-700 text-white">
        Download PDF
      </Button>
      {onShare && (
        <Button onClick={onShare} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          Share Report
        </Button>
      )}
    </div>
  );
};

export default ReportTopActions; 