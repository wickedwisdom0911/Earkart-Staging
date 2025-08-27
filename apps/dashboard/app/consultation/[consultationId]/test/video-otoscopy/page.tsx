"use client";
import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useOtoscopy } from "@/providers/otoscopy-provider";
import { useDevice } from "@/providers/device-provider";

export default function VideoOtoscopyPage() {
  const { consultationId } = useParams();
  const { 
    isOtoscopyActive, 
    startOtoscopy, 
    stopOtoscopy 
  } = useOtoscopy();
  const { deviceState } = useDevice();
  
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  // Check if camera is open for UI feedback
  const isCameraOpen = deviceState.r15c.isCameraOpen;
  
  // Handle start otoscopy with loading state
  const handleStartOtoscopy = async () => {
    setIsStarting(true);
    try {
      await startOtoscopy();
    } catch (error) {
      console.error("Error starting otoscopy:", error);
    } finally {
      setTimeout(() => setIsStarting(false), 1000);
    }
  };

  // Handle stop otoscopy with loading state
  const handleStopOtoscopy = async () => {
    setIsStopping(true);
    try {
      await stopOtoscopy();
    } catch (error) {
      console.error("Error stopping otoscopy:", error);
    } finally {
      setTimeout(() => setIsStopping(false), 1000);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Eye className="w-6 h-6" />
            Video Otoscopy
          </h1>
          <p className="text-gray-600">Digital otoscopy examination and visualization</p>
        </div>
      </div>

      {/* Otoscopy Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Otoscopy Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              onClick={handleStartOtoscopy}
              disabled={isOtoscopyActive || isStarting}
              className="flex items-center gap-2"
              size="lg"
            >
              {isStarting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              {isStarting ? 'Starting...' : 'Start Otoscopy'}
            </Button>
            
            <Button
              onClick={handleStopOtoscopy}
              disabled={!isOtoscopyActive || isStopping}
              variant="outline"
              className="flex items-center gap-2"
              size="lg"
            >
              {isStopping ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
              {isStopping ? 'Stopping...' : 'Stop Otoscopy'}
            </Button>
          </div>
          
          {/* Camera Status */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Otoscope Camera:</span>
              <span className={`flex items-center gap-1 ${isCameraOpen ? 'text-green-600' : 'text-orange-600'}`}>
                <div className={`w-2 h-2 rounded-full ${isCameraOpen ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                {isCameraOpen ? 'Ready' : 'Please open camera on device'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Indicators */}
      {isOtoscopyActive && !isCameraOpen && (
        <Card className="border-orange-500 bg-orange-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse"></div>
              <span className="font-medium text-orange-800">
                Otoscopy started - Waiting for camera to open on device
              </span>
            </div>
          </CardContent>
        </Card>
      )}
      
      {isOtoscopyActive && isCameraOpen && (
        <Card className="border-green-500 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
              <span className="font-medium text-green-800">
                Otoscopy examination in progress - Camera ready
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
