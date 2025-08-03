"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSocket } from "@/providers/socket-provider";
import { useParams } from "next/navigation";
import { useDevice } from "@/providers/device-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Square, Camera, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface OtoscopyStreamData {
  type: string;
  consultationId: string;
  timestamp: number;
  frame: string; // Base64 encoded image data
  fps: number;
  status?: "streaming" | "stopped" | "error";
}

export default function VideoOtoscopyPage() {
  const socket = useSocket();
  const { consultationId } = useParams();
  const { deviceState } = useDevice();
  const { revo2 } = deviceState;
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isStreamingRef = useRef(false); // Add ref for current streaming state
  const stopTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Add timeout ref
  const frameSkipRef = useRef(0); // Frame skipping for performance
  const lastFrameTimeRef = useRef(0); // Track frame timing
  const stopStreamingRef = useRef(false); // Flag to stop frame processing immediately
  const canvasSizedRef = useRef(false); // Track if canvas has been sized
  const frameQueueRef = useRef<OtoscopyStreamData[]>([]);
  const isProcessingFrameRef = useRef(false);
  const statsUpdateCounterRef = useRef(0);
  const lastStatsUpdateRef = useRef(0);
  
  // State management
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamStatus, setStreamStatus] = useState<"idle" | "connecting" | "streaming" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastImageData, setLastImageData] = useState<string | null>(null);
  const [frameCount, setFrameCount] = useState(0);
  const [lastFrameHash, setLastFrameHash] = useState<string>('');
  const [performanceStats, setPerformanceStats] = useState({
    framesPerSecond: 0,
    latency: 0
  });
  const [isStopping, setIsStopping] = useState(false);

  // Update ref whenever isStreaming changes
  useEffect(() => {
    isStreamingRef.current = isStreaming;
  }, [isStreaming]);

  // Cleanup functions
  const cleanupVideoStream = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const cleanupCanvas = useCallback(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, []);

  const resetStreamingState = useCallback(() => {
    setIsStreaming(false);
    setStreamStatus("idle");
    setFrameCount(0);
    setLastFrameHash('');
    setLastImageData(null);
    setError(null);
    canvasSizedRef.current = false; // Reset canvas sizing flag
    frameQueueRef.current = [];
    isProcessingFrameRef.current = false;
    statsUpdateCounterRef.current = 0;
    lastStatsUpdateRef.current = 0;
  }, []);

  // Optimized frame processing with queue
  const processNextFrame = useCallback(() => {
    if (isProcessingFrameRef.current || frameQueueRef.current.length === 0) {
      return;
    }
    
    isProcessingFrameRef.current = true;
    
    // Get the LATEST frame and drop all older ones (adaptive frame dropping)
    const latestFrame = frameQueueRef.current.pop();
    frameQueueRef.current = []; // Clear entire queue - only show latest
    
    if (!latestFrame || stopStreamingRef.current || !isStreamingRef.current) {
      isProcessingFrameRef.current = false;
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (ctx && canvas) {
      // Use createImageBitmap for better performance (when available)
      if ('createImageBitmap' in window) {
        try {
          // Convert base64 to blob
          fetch(latestFrame.frame)
            .then(response => response.blob())
            .then(blob => createImageBitmap(blob))
            .then(imageBitmap => {
              if (!stopStreamingRef.current && isStreamingRef.current) {
                // Size canvas only once
                if (!canvasSizedRef.current && imageBitmap.width > 0) {
                  canvas.width = imageBitmap.width;
                  canvas.height = imageBitmap.height;
                  canvasSizedRef.current = true;
                }
                
                // Draw without clearing (faster)
                ctx.drawImage(imageBitmap, 0, 0);
                imageBitmap.close(); // Important: free memory
                
                // Update stats less frequently (every 30 frames = ~1 second)
                statsUpdateCounterRef.current++;
                if (statsUpdateCounterRef.current >= 30) {
                  const now = Date.now();
                  const timeSinceLastStats = now - lastStatsUpdateRef.current;
                  if (timeSinceLastStats > 0) {
                    const fps = Math.round(30000 / timeSinceLastStats); // 30 frames over time period
                    const latency = now - latestFrame.timestamp;
                    
                    setPerformanceStats({
                      framesPerSecond: fps,
                      latency: latency
                    });
                    
                    setFrameCount(prev => prev + 30); // Batch update
                  }
                  
                  statsUpdateCounterRef.current = 0;
                  lastStatsUpdateRef.current = now;
                }
              }
              isProcessingFrameRef.current = false;
              
              // Schedule next frame if queue has more
              if (frameQueueRef.current.length > 0) {
                requestAnimationFrame(processNextFrame);
              }
            })
            .catch(() => {
              // Fallback to regular Image
              drawWithRegularImage(ctx, canvas, latestFrame);
            });
        } catch (error) {
          drawWithRegularImage(ctx, canvas, latestFrame);
        }
      } else {
        drawWithRegularImage(ctx, canvas, latestFrame);
      }
    } else {
      isProcessingFrameRef.current = false;
    }
  }, []);

  // Fallback drawing method
  const drawWithRegularImage = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, frameData: OtoscopyStreamData) => {
    const img = new Image();
    img.onload = () => {
      if (!stopStreamingRef.current && isStreamingRef.current) {
        if (!canvasSizedRef.current && img.width > 0) {
          canvas.width = img.width;
          canvas.height = img.height;
          canvasSizedRef.current = true;
        }
        ctx.drawImage(img, 0, 0); // No clearing needed
      }
      isProcessingFrameRef.current = false;
      
      // Schedule next frame
      if (frameQueueRef.current.length > 0) {
        requestAnimationFrame(processNextFrame);
      }
    };
    img.onerror = () => {
      isProcessingFrameRef.current = false;
      if (frameQueueRef.current.length > 0) {
        requestAnimationFrame(processNextFrame);
      }
    };
    img.src = frameData.frame;
  }, [processNextFrame]);

  // Calculate FPS
  const calculateFPS = useCallback(() => {
    const now = Date.now();
    const timeSinceLastFrame = now - lastFrameTimeRef.current;
    if (timeSinceLastFrame > 0) {
      const fps = 1000 / timeSinceLastFrame;
      setPerformanceStats(prev => ({
        ...prev,
        framesPerSecond: Math.round(fps)
      }));
    }
  }, []);

  // Force stop function for cleanup
  const forceStopVideo = useCallback(() => {
    // Set stop flags first
    stopStreamingRef.current = true;
    isStreamingRef.current = false;
    isProcessingFrameRef.current = false;
    
    // Clear frame queue immediately
    frameQueueRef.current = [];
    
    // Reset counters
    statsUpdateCounterRef.current = 0;
    lastStatsUpdateRef.current = 0;
    
    // Update UI state
    setIsStreaming(false);
    setStreamStatus("idle");
    setFrameCount(0);
    setLastFrameHash('');
    setLastImageData(null);
    setError(null);
    
    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    
    // Cleanup video stream
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    // Clear timeout
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
    
    canvasSizedRef.current = false;
  }, []);
  
  // Reset everything on component mount
  useEffect(() => {
    // Reset all refs on mount
    stopStreamingRef.current = false;
    isStreamingRef.current = false;
    
    return () => {
      // Cleanup on unmount
      forceStopVideo();
    };
  }, [forceStopVideo]);
  
  // HEAVILY OPTIMIZED handleOtoscopyStream
  const handleOtoscopyStream = useCallback((data: OtoscopyStreamData) => {
    // Early exit - minimal processing
    if (stopStreamingRef.current || !data.frame) {
      return;
    }
    
    // Update streaming state only if needed
    if (!isStreamingRef.current) {
      isStreamingRef.current = true;
      setIsStreaming(true);
      setStreamStatus("streaming");
      setError(null);
      stopStreamingRef.current = false;
    }
    
    // Aggressive frame dropping - keep only 1 frame in queue max
    if (frameQueueRef.current.length >= 1) {
      frameQueueRef.current = []; // Drop all queued frames
    }
    
    // Add new frame
    frameQueueRef.current.push(data);
    
    // Start processing if not already running
    if (!isProcessingFrameRef.current) {
      requestAnimationFrame(processNextFrame);
    }
  }, [processNextFrame]);

  // Handle socket events for otoscopy
  useEffect(() => {
    if (!socket) return;

    const handleOtoscopyStart = (data: { success: boolean; message?: string }) => {
      if (data.success) {
        // Reset all flags
        stopStreamingRef.current = false;
        isStreamingRef.current = true;
        
        setIsStreaming(true);
        setStreamStatus("streaming");
        setError(null);
        toast.success("Video stream started successfully");
      } else {
        // Reset flags on failure
        stopStreamingRef.current = false;
        isStreamingRef.current = false;
        
        setStreamStatus("error");
        setError(data.message || "Failed to start video stream");
        toast.error(data.message || "Failed to start video stream");
      }
    };

    const handleOtoscopyStop = (data: { success: boolean; message?: string }) => {
      // Clear any pending timeout
      if (stopTimeoutRef.current) {
        clearTimeout(stopTimeoutRef.current);
        stopTimeoutRef.current = null;
      }

      // Only show message if there was an error
      if (!data.success) {
        toast.error(data.message || "Server reported stop error");
      }
      // Don't do cleanup here since we already did it immediately
    };



    const handleOtoscopyError = (data: { error: string }) => {
      console.error("Otoscopy error:", data.error);
      
      // Reset all flags
      stopStreamingRef.current = false;
      isStreamingRef.current = false;
      
      // Clean up
      cleanupVideoStream();
      cleanupCanvas();
      resetStreamingState();
      
      setError(data.error);
      setStreamStatus("error");
      toast.error(`Otoscopy error: ${data.error}`);
    };

    // Socket event listeners
    socket.on("otoscopy-stream", handleOtoscopyStream);
    socket.on("otoscopy-start", handleOtoscopyStart);
    socket.on("otoscopy-stop", handleOtoscopyStop);
    socket.on("otoscopy-error", handleOtoscopyError);

    // Cleanup
    return () => {
      socket.off("otoscopy-stream", handleOtoscopyStream);
      socket.off("otoscopy-start", handleOtoscopyStart);
      socket.off("otoscopy-stop", handleOtoscopyStop);
      socket.off("otoscopy-error", handleOtoscopyError);
    };
  }, [socket, cleanupVideoStream, cleanupCanvas, resetStreamingState, handleOtoscopyStream]);

  // Cleanup video on unmount
  useEffect(() => {
    return () => {
      forceStopVideo();
    };
  }, [forceStopVideo]);

  // Memory cleanup
  useEffect(() => {
    return () => {
      frameQueueRef.current = [];
      isProcessingFrameRef.current = false;
      statsUpdateCounterRef.current = 0;
    };
  }, []);

  // Handle video element events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVideoLoad = () => {
      // Video loaded successfully
    };

    const handleVideoError = (e: Event) => {
      console.error("Video error:", e);
      setError("Failed to load video stream");
    };

    const handleVideoPlay = () => {
      // Video started playing
    };

    const handleVideoPause = () => {
      // Video paused
    };

    video.addEventListener("loadeddata", handleVideoLoad);
    video.addEventListener("error", handleVideoError);
    video.addEventListener("play", handleVideoPlay);
    video.addEventListener("pause", handleVideoPause);

    return () => {
      video.removeEventListener("loadeddata", handleVideoLoad);
      video.removeEventListener("error", handleVideoError);
      video.removeEventListener("play", handleVideoPlay);
      video.removeEventListener("pause", handleVideoPause);
    };
  }, []);

  // Start video stream
  const handleStartVideo = useCallback(() => {
    console.log("Starting video - Current state:", {
      isStreaming,
      streamStatus,
      stopStreamingRef: stopStreamingRef.current,
      isStreamingRef: isStreamingRef.current
    });
    
    if (!socket || !consultationId) {
      toast.error("Socket not connected or consultation ID missing");
      return;
    }

    // Reset all flags and state
    stopStreamingRef.current = false;
    isStreamingRef.current = false;
    
    setStreamStatus("connecting");
    setError(null);
    setIsStreaming(false);
    
    socket.emit("start-otoscopy", {
      consultationId: consultationId,
    });
    
    // Set a timeout to handle connection issues
    const connectTimeout = setTimeout(() => {
      if (streamStatus === "connecting") {
        setStreamStatus("error");
        setError("Connection timeout - please try again");
      }
    }, 5000); // Increased timeout
    
    // Clear timeout when component unmounts or starts successfully
    return () => clearTimeout(connectTimeout);
  }, [socket, consultationId, streamStatus, isStreaming]);



  // IMMEDIATE Stop video stream
  const handleStopVideo = useCallback(() => {
    if (!socket || !consultationId || isStopping) {
      return;
    }

    setIsStopping(true);
    
    // IMMEDIATE STOP - Don't wait for server
    console.log("Stopping video immediately");
    
    // Stop processing new frames
    isStreamingRef.current = false;
    
    // Immediate cleanup
    forceStopVideo();
    
    // Reset stopping state
    setTimeout(() => setIsStopping(false), 100);
    
    // Notify server (but don't wait for response)
    socket.emit("stop-otoscopy", {
      consultationId: consultationId,
    });
    
    toast.success("Video stream stopped");
    
  }, [socket, consultationId, forceStopVideo, isStopping]);



  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Video Otoscopy</h1>
          <p className="text-gray-600">Visualize the middle ear and tympanic membrane</p>
          {isStreaming && (
            <div className="text-xs text-gray-500 mt-1">
              Latency: {performanceStats.latency}ms | 
              FPS: {performanceStats.framesPerSecond}
            </div>
          )}
        </div>
        
        {/* Status Card */}
        <Card className={`w-48 ${
          streamStatus === "streaming" ? "border-green-500 bg-green-50" : 
          streamStatus === "connecting" ? "border-blue-500 bg-blue-50" : 
          streamStatus === "error" ? "border-red-500 bg-red-50" : 
          "border-gray-300 bg-gray-50"
        }`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              {streamStatus === "connecting" && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
              {streamStatus === "error" && <AlertCircle className="w-4 h-4 text-red-600" />}
              {streamStatus === "streaming" && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
              <span className={`font-medium ${
                streamStatus === "streaming" ? "text-green-700" : 
                streamStatus === "connecting" ? "text-blue-700" : 
                streamStatus === "error" ? "text-red-700" : 
                "text-gray-700"
              }`}>
                {streamStatus === "streaming" ? "Live Stream" : 
                 streamStatus === "connecting" ? "Connecting..." : 
                 streamStatus === "error" ? "Connection Error" : "Idle"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Control Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              onClick={handleStartVideo}
              disabled={streamStatus === "connecting" || streamStatus === "streaming"}
              className="flex items-center gap-2"
            >
              {streamStatus === "connecting" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Start Video
            </Button>
            
            <Button
              onClick={handleStopVideo}
              disabled={!isStreaming && streamStatus !== "streaming"}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isStopping ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {isStopping ? "Stopping..." : "Stop Video"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Video Display */}
      <Card>
        <CardHeader>
          <CardTitle>Live Stream</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <canvas
              ref={canvasRef}
              className="w-full h-full object-contain bg-black border border-gray-600"
              style={{ 
                minHeight: '300px',
                maxWidth: '100%',
                maxHeight: '100%'
              }}
            />
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="hidden"
            />
            
            {/* Placeholder when not streaming */}
            {!isStreaming && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-center text-gray-400">
                  <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No active stream</p>
                  <p className="text-sm">Click "Start Video" to begin streaming</p>
                </div>
              </div>
            )}
            
            {/* Loading overlay */}
            {streamStatus === "connecting" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="text-center text-white">
                  <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                  <p>Connecting to otoscope...</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>


    </div>
  );
}
