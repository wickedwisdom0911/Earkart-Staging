"use client";
import React from "react";
import { Loader2 } from "lucide-react";

interface RedirectLoadingModalProps {
  isOpen: boolean;
  message?: string;
  submessage?: string;
}

export function RedirectLoadingModal({
  isOpen,
  message = "Please Wait",
  submessage = "You are being redirected. Please do not refresh or close this window."
}: RedirectLoadingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md w-full mx-4 text-center">
        {/* Animated Spinner */}
        <div className="flex justify-center mb-6">
          <Loader2 className="w-20 h-20 text-blue-600 animate-spin" />
        </div>
        
        {/* Main Message */}
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          {message}
        </h2>
        
        {/* Sub Message */}
        <p className="text-lg text-gray-600 mb-6 leading-relaxed">
          {submessage}
        </p>
        
        {/* Progress Indicator */}
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div className="bg-blue-600 h-full rounded-full animate-pulse" style={{ width: '100%' }} />
        </div>
        
        {/* Additional Info */}
        <p className="text-sm text-gray-500 mt-6">
          ⚠️ Do not refresh or close this window
        </p>
      </div>
    </div>
  );
}

