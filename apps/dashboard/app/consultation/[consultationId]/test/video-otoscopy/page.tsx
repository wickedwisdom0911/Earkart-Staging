"use client";
import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useOtoscopy } from "@/providers/otoscopy-provider";
import { useDevice } from "@/providers/device-provider";
import { useRTCClient, useRemoteUsers, useIsConnected } from "agora-rtc-react";

export default function VideoOtoscopyPage() {
  const { consultationId } = useParams();
  const { 
    isOtoscopyActive, 
    startOtoscopy, 
    stopOtoscopy 
  } = useOtoscopy();
  const { deviceState } = useDevice();
  
  // Get video call state to check users before starting otoscopy
  const client = useRTCClient();
  const remoteUsers = useRemoteUsers();
  const isConnected = useIsConnected();
  
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  // Check if camera is open for UI feedback
  const isCameraOpen = deviceState.r15c.isCameraOpen;
  
  // Log when page loads
  React.useEffect(() => {
    console.log("🔬 [OTOSCOPY PAGE] ========== PAGE LOADED ==========");
    console.log("🔬 [OTOSCOPY PAGE] Consultation ID:", consultationId);
    console.log("🔬 [OTOSCOPY PAGE] Initial state:", {
      isOtoscopyActive,
      isCameraOpen,
      deviceState: deviceState.r15c,
    });
    console.log("🔬 [OTOSCOPY PAGE] ============================================");
  }, []);
  
  // Handle start otoscopy with loading state
  const handleStartOtoscopy = async () => {
    console.log("🔬 [OTOSCOPY PAGE] ========== START OTOSCOPY CLICKED ==========");
    console.log("🔬 [OTOSCOPY PAGE] ========== CHECKING USERS BEFORE START ==========");
    
    // Check video call connection status
    console.log("🔬 [OTOSCOPY PAGE] Video call connection status:", {
      isConnected,
      hasClient: !!client,
      clientState: client?.connectionState,
    });
    
    // Check current remote users BEFORE starting otoscopy
    console.log("🔬 [OTOSCOPY PAGE] Current remote users count:", remoteUsers.length);
    console.log("🔬 [OTOSCOPY PAGE] Remote users BEFORE starting otoscopy:", remoteUsers.map(user => ({
      uid: user.uid,
      hasVideo: user.hasVideo,
      hasAudio: user.hasAudio,
      videoTrack: !!user.videoTrack,
      audioTrack: !!user.audioTrack,
      videoTrackPlaying: user.videoTrack?.isPlaying || false,
      audioTrackPlaying: user.audioTrack?.isPlaying || false,
    })));
    
    // Check if client has remote users
    if (client) {
      const clientRemoteUsers = client.remoteUsers || [];
      console.log("🔬 [OTOSCOPY PAGE] Client remote users (from agora client):", clientRemoteUsers.length);
      console.log("🔬 [OTOSCOPY PAGE] Client remote users details:", clientRemoteUsers.map(u => ({
        uid: u.uid,
        hasVideo: u.hasVideo,
        hasAudio: u.hasAudio,
        videoTrack: !!u.videoTrack,
        audioTrack: !!u.audioTrack,
      })));
    }
    
    console.log("🔬 [OTOSCOPY PAGE] Current state:", {
      isOtoscopyActive,
      isCameraOpen,
      consultationId,
    });
    console.log("🔬 [OTOSCOPY PAGE] ============================================");
    
    setIsStarting(true);
    try {
      console.log("🔬 [OTOSCOPY PAGE] Calling startOtoscopy()...");
      await startOtoscopy();
      console.log("🔬 [OTOSCOPY PAGE] startOtoscopy() completed");
    } catch (error) {
      console.error("🔬 [OTOSCOPY PAGE] ❌ Error starting otoscopy:", error);
    } finally {
      setTimeout(() => setIsStarting(false), 1000);
    }
  };

  // Handle stop otoscopy with loading state
  const handleStopOtoscopy = async () => {
    console.log("🔬 [OTOSCOPY PAGE] ========== STOP OTOSCOPY CLICKED ==========");
    setIsStopping(true);
    try {
      await stopOtoscopy();
      console.log("🔬 [OTOSCOPY PAGE] stopOtoscopy() completed");
    } catch (error) {
      console.error("🔬 [OTOSCOPY PAGE] ❌ Error stopping otoscopy:", error);
    } finally {
      setTimeout(() => setIsStopping(false), 1000);
    }
  };
  
  // Monitor otoscopy state changes
  React.useEffect(() => {
    console.log("🔬 [OTOSCOPY PAGE] ========== OTOSCOPY STATE CHANGED ==========");
    console.log("🔬 [OTOSCOPY PAGE] isOtoscopyActive:", isOtoscopyActive);
    console.log("🔬 [OTOSCOPY PAGE] isCameraOpen:", isCameraOpen);
    console.log("🔬 [OTOSCOPY PAGE] ============================================");
  }, [isOtoscopyActive, isCameraOpen]);

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
