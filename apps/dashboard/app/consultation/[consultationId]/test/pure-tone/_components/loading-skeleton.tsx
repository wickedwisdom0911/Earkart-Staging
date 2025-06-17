import React from "react";

export default function PureToneLoadingSkeleton() {
  return (
    <div className="p-6 animate-pulse">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="h-8 w-64 bg-gray-200 rounded"></div>
          <div className="flex items-center gap-4">
            <div className="h-8 w-24 bg-gray-200 rounded"></div>
          </div>
        </div>

        {/* Test Controls Skeleton */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Ear Selection */}
          <div>
            <div className="h-5 w-12 bg-gray-200 rounded mb-2"></div>
            <div className="flex gap-4">
              <div className="h-10 w-24 bg-gray-200 rounded"></div>
              <div className="h-10 w-24 bg-gray-200 rounded"></div>
            </div>
          </div>

          {/* Mode Selection */}
          <div>
            <div className="h-5 w-12 bg-gray-200 rounded mb-2"></div>
            <div className="flex gap-4">
              <div className="h-10 w-24 bg-gray-200 rounded"></div>
              <div className="h-10 w-24 bg-gray-200 rounded"></div>
            </div>
          </div>

          {/* Frequency Selection */}
          <div>
            <div className="h-5 w-24 bg-gray-200 rounded mb-2"></div>
            <div className="h-10 w-full bg-gray-200 rounded"></div>
          </div>

          {/* Level Selection */}
          <div>
            <div className="h-5 w-24 bg-gray-200 rounded mb-2"></div>
            <div className="h-10 w-full bg-gray-200 rounded"></div>
          </div>

          {/* Signal Type Selection */}
          <div>
            <div className="h-5 w-24 bg-gray-200 rounded mb-2"></div>
            <div className="h-10 w-full bg-gray-200 rounded"></div>
          </div>

          {/* Pulsed Signal Control */}
          <div>
            <div className="h-5 w-24 bg-gray-200 rounded mb-2"></div>
            <div className="h-10 w-full bg-gray-200 rounded"></div>
          </div>

          {/* Masking Controls */}
          <div className="col-span-2">
            <div className="flex items-end gap-4">
              <div className="h-10 w-32 bg-gray-200 rounded"></div>
              <div className="flex-1">
                <div className="h-5 w-32 bg-gray-200 rounded mb-2"></div>
                <div className="h-10 w-full bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Skeleton */}
        <div className="flex gap-4 mb-6">
          <div className="h-10 w-32 bg-gray-200 rounded"></div>
          <div className="h-10 w-32 bg-gray-200 rounded"></div>
          <div className="h-10 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* Audiogram Display Skeleton */}
      <div className="border rounded p-4">
        <div className="aspect-square w-full bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}
