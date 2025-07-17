"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSocket } from "@/providers/socket-provider";
import { useParams } from "next/navigation";
import { useDevice } from "@/providers/device-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Square, Camera, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface OtoscopyStreamData {
  imageData?: string; // Base64 encoded image data
  timestamp: number;
  status: "streaming" | "stopped" | "error";
}

export default function VideoOtoscopyPage() {
  const socket = useSocket();
  const { consultationId } = useParams();
  const { deviceState } = useDevice();
  const { revo2 } = deviceState;
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // State management
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [streamStatus, setStreamStatus] = useState<"idle" | "connecting" | "streaming" | "error">("idle");
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastImageData, setLastImageData] = useState<string | null>(null);

  // Handle socket events for otoscopy
  useEffect(() => {
    if (!socket) return;

    const handleOtoscopyStream = (data: OtoscopyStreamData) => {
      console.log("Received otoscopy stream data:", data);
      
      if (data.imageData) {
        setLastImageData(data.imageData);
        
        // Update video element if streaming
        if (videoRef.current && isStreaming) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              const img = new Image();
              img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                // Convert canvas to video stream
                const stream = canvas.captureStream(30); // 30 FPS
                if (video.srcObject !== stream) {
                  video.srcObject = stream;
                }
              };
              img.src = `data:image/jpeg;base64,${data.imageData}`;
            }
          }
        }
      }
    };

    const handleOtoscopyStart = (data: { success: boolean; message?: string }) => {
      console.log("Otoscopy start response:", data);
      if (data.success) {
        setIsStreaming(true);
        setStreamStatus("streaming");
        setError(null);
        toast.success("Video stream started successfully");
      } else {
        setStreamStatus("error");
        setError(data.message || "Failed to start video stream");
        toast.error(data.message || "Failed to start video stream");
      }
    };

    const handleOtoscopyStop = (data: { success: boolean; message?: string }) => {
      console.log("Otoscopy stop response:", data);
      if (data.success) {
        setIsStreaming(false);
        setStreamStatus("idle");
        setError(null);
        toast.success("Video stream stopped");
      } else {
        setError(data.message || "Failed to stop video stream");
        toast.error(data.message || "Failed to stop video stream");
      }
    };

    const handleOtoscopyCapture = (data: { success: boolean; imageData?: string; message?: string }) => {
      console.log("Otoscopy capture response:", data);
      setIsCapturing(false);
      
      if (data.success && data.imageData) {
        setCapturedImages(prev => [...prev, data.imageData!]);
        toast.success("Image captured successfully");
      } else {
        setError(data.message || "Failed to capture image");
        toast.error(data.message || "Failed to capture image");
      }
    };

    const handleOtoscopyError = (data: { error: string }) => {
      console.error("Otoscopy error:", data.error);
      setError(data.error);
      setStreamStatus("error");
      setIsStreaming(false);
      toast.error(`Otoscopy error: ${data.error}`);
    };

    // Socket event listeners
    socket.on("otoscopy-stream", handleOtoscopyStream);
    socket.on("otoscopy-start", handleOtoscopyStart);
    socket.on("otoscopy-stop", handleOtoscopyStop);
    socket.on("otoscopy-capture", handleOtoscopyCapture);
    socket.on("otoscopy-error", handleOtoscopyError);

    // Cleanup
    return () => {
      socket.off("otoscopy-stream", handleOtoscopyStream);
      socket.off("otoscopy-start", handleOtoscopyStart);
      socket.off("otoscopy-stop", handleOtoscopyStop);
      socket.off("otoscopy-capture", handleOtoscopyCapture);
      socket.off("otoscopy-error", handleOtoscopyError);
    };
  }, [socket, isStreaming]);

  // Handle video element events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVideoLoad = () => {
      console.log("Video loaded successfully");
    };

    const handleVideoError = (e: Event) => {
      console.error("Video error:", e);
      setError("Failed to load video stream");
    };

    video.addEventListener("loadeddata", handleVideoLoad);
    video.addEventListener("error", handleVideoError);

    return () => {
      video.removeEventListener("loadeddata", handleVideoLoad);
      video.removeEventListener("error", handleVideoError);
    };
  }, []);

  // Start video stream
  const handleStartVideo = () => {
    if (!socket || !consultationId) {
      toast.error("Socket not connected or consultation ID missing");
      return;
    }

    setStreamStatus("connecting");
    setError(null);
    
    socket.emit("start-otoscopy", {
      consultationId: consultationId,
    });
  };

  // Stop video stream
  const handleStopVideo = () => {
    if (!socket || !consultationId) {
      toast.error("Socket not connected or consultation ID missing");
      return;
    }

    socket.emit("stop-otoscopy", {
      consultationId: consultationId,
    });
  };

  // Capture image
  const handleCaptureImage = () => {
    if (!socket || !consultationId) {
      toast.error("Socket not connected or consultation ID missing");
      return;
    }

    if (!isStreaming) {
      toast.error("Please start video stream before capturing image");
      return;
    }

    setIsCapturing(true);
    setError(null);
    
    socket.emit("otoscopy-capture", {
      consultationId: consultationId,
    });
  };

  // Download captured image
  const handleDownloadImage = (imageData: string, index: number) => {
    const link = document.createElement('a');
    link.href = `data:image/jpeg;base64,${imageData}`;
    link.download = `otoscopy-capture-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}-${index + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Delete captured image
  const handleDeleteImage = (index: number) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
    toast.success("Image deleted");
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Video Otoscopy</h1>
          <p className="text-gray-600">Visualize the middle ear and tympanic membrane</p>
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
              disabled={!isStreaming || streamStatus === "connecting"}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Square className="w-4 h-4" />
              Stop Video
            </Button>
            
            <Button
              onClick={handleCaptureImage}
              disabled={!isStreaming || isCapturing}
              variant="secondary"
              className="flex items-center gap-2"
            >
              {isCapturing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
              Capture Image
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
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain"
            />
            <canvas
              ref={canvasRef}
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

      {/* Captured Images */}
      {capturedImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Captured Images ({capturedImages.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {capturedImages.map((imageData, index) => (
                <div key={index} className="relative group">
                  <img
                    src={`data:image/jpeg;base64,${imageData}`}
                    alt={`Otoscopy capture ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleDownloadImage(imageData, index)}
                        className="bg-white text-black hover:bg-gray-100"
                      >
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteImage(index)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
