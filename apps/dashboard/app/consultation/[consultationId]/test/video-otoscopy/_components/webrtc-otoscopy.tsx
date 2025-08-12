"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import useAgoraOtoscopy from "@/hooks/agora/use-agora-otoscopy";
import useCreateToken from "@/hooks/agora/use-create-token";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Square, Monitor, Loader2, AlertCircle, Video, VideoOff } from "lucide-react";
import { toast } from "sonner";
import ConnectionStatus from "./connection-status";

export default function WebRTCOtoscopy() {
  const { consultationId } = useParams();
  const {
    client,
    remoteUsers,
    isConnected,
    isInitializing,
    isClientInitialized,
    error,
    joinChannel,
    leaveChannel,
    currentChannel,
  } = useAgoraOtoscopy();

  const { mutateAsync: fetchToken } = useCreateToken();
  const videoRef = useRef<HTMLDivElement>(null);
  const hasAttemptedJoinRef = useRef(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamStatus, setStreamStatus] = useState<"idle" | "connecting" | "streaming" | "error">("idle");
  const [screenShareTrack, setScreenShareTrack] = useState<any>(null);
  const [remoteUserTracks, setRemoteUserTracks] = useState<any[]>([]);

  // Enhanced dual stream detection for otoscopy (screen share only)
  useEffect(() => {
    if (!client) return;

    console.log("🖥️ Setting up dual stream handlers for otoscopy (screen share detection)");

    const handleUserPublished = async (user: any, mediaType: string) => {
      console.log("📺 [OTOSCOPY] Remote user published:", { 
        uid: user.uid, 
        mediaType,
        hasVideoTrack: !!user.videoTrack,
        trackId: user.videoTrack?.getTrackId?.()
      });
      
      if (mediaType === "video") {
        try {
          console.log("🔄 [OTOSCOPY] Subscribing to video stream...");
          await client.subscribe(user, mediaType);
          
          // Check if this is the second video stream from the same user (screen share)
          const existingVideoStreamsFromThisUser = remoteUserTracks.filter(
            track => track.uid === user.uid && track.hasVideo
          ).length;
          
          const isSecondVideoFromSameUser = existingVideoStreamsFromThisUser > 0;
          const trackId = user.videoTrack?.getTrackId?.() || "unknown";
          
          console.log("🔍 [OTOSCOPY] Stream analysis:", {
            uid: user.uid,
            existingVideoStreamsFromThisUser,
            isSecondVideoFromSameUser,
            trackId,
            timestamp: new Date().toISOString()
          });

          // Update tracking for this user
          setRemoteUserTracks(prev => {
            const existingUser = prev.find(u => u.uid === user.uid);
            
            if (existingUser) {
              if (isSecondVideoFromSameUser) {
                // This is likely the screen share stream
                console.log("🖥️ [OTOSCOPY] SCREEN SHARE DETECTED - Second video from same user:", user.uid);
                return prev.map(u => 
                  u.uid === user.uid 
                    ? {
                        ...u,
                        screenTrack: user.videoTrack,
                        hasScreen: true,
                      }
                    : u
                );
              } else {
                // This is the camera stream (first video)
                console.log("📹 [OTOSCOPY] Camera stream detected (ignoring for otoscopy):", user.uid);
                return prev.map(u => 
                  u.uid === user.uid 
                    ? {
                        ...u,
                        videoTrack: user.videoTrack,
                        hasVideo: true,
                      }
                    : u
                );
              }
            } else {
              // New user - first stream is camera
              console.log("👤 [OTOSCOPY] New user - camera stream:", user.uid);
              return [...prev, {
                uid: user.uid,
                videoTrack: user.videoTrack,
                audioTrack: undefined,
                screenTrack: undefined,
                hasVideo: true,
                hasScreen: false,
              }];
            }
          });

          // Only play screen share streams in otoscopy view
          if (isSecondVideoFromSameUser && user.videoTrack && videoRef.current) {
            console.log("🎥 [OTOSCOPY] Playing SCREEN SHARE in otoscopy view");
            user.videoTrack.play(videoRef.current);
            setScreenShareTrack(user.videoTrack);
          setIsStreaming(true);
          setStreamStatus("streaming");
            toast.success("Screen sharing connected to otoscopy!");
          } else {
            console.log("⏭️ [OTOSCOPY] Ignoring camera stream - waiting for screen share");
          }
          
        } catch (err) {
          console.error("❌ [OTOSCOPY] Error subscribing to video:", err);
          setStreamStatus("error");
          toast.error("Failed to display video stream");
        }
      }
    };

    const handleUserUnpublished = (user: any, mediaType: string) => {
      console.log("📺 [OTOSCOPY] Remote user unpublished:", { uid: user.uid, mediaType });
      
      if (mediaType === "video") {
        // Update tracking
        setRemoteUserTracks(prev => 
          prev.map(u => 
            u.uid === user.uid 
              ? { 
                  ...u, 
                  videoTrack: undefined, 
                  screenTrack: undefined,
                  hasVideo: false,
                  hasScreen: false
                }
              : u
          )
        );

        // Stop streaming if this was our screen share
        if (screenShareTrack) {
          setScreenShareTrack(null);
          setIsStreaming(false);
          setStreamStatus("idle");
          toast.info("Screen sharing stopped");
        }
      }
    };

    const handleUserLeft = (user: any) => {
      console.log("👋 [OTOSCOPY] Remote user left:", user.uid);
      
      // Remove user from tracking
      setRemoteUserTracks(prev => prev.filter(u => u.uid !== user.uid));
      
      // Stop streaming if this user was sharing screen
      if (screenShareTrack) {
        setScreenShareTrack(null);
        setIsStreaming(false);
        setStreamStatus("idle");
        toast.info("Remote user disconnected");
      }
    };

    // Enhanced screen share detection via stream type
    const handleStreamTypeChanged = (uid: number, streamType: number) => {
      console.log(`🔄 [OTOSCOPY] User ${uid} stream type changed to:`, streamType);
      // streamType: 0 = high stream (camera), 1 = low stream, 2 = screen share
      
      if (streamType === 2) {
        console.log(`🖥️ [OTOSCOPY] User ${uid} confirmed SCREEN SHARING via stream type`);
        setRemoteUserTracks(prev => 
          prev.map(u => 
            u.uid === uid 
              ? { ...u, hasScreen: true }
              : u
          )
        );
      }
    };

    client.on("user-published", handleUserPublished);
    client.on("user-unpublished", handleUserUnpublished);
    client.on("user-left", handleUserLeft);
    client.on("stream-type-changed", handleStreamTypeChanged);

    return () => {
      client.off("user-published", handleUserPublished);
      client.off("user-unpublished", handleUserUnpublished);
      client.off("user-left", handleUserLeft);
      client.off("stream-type-changed", handleStreamTypeChanged);
    };
  }, [client, remoteUserTracks, screenShareTrack]);

  // Monitor existing remote users for screen share streams
  useEffect(() => {
    if (!videoRef.current || remoteUsers.length === 0) return;

    console.log("🔍 [OTOSCOPY] Checking existing remote users for screen share:", remoteUsers.length);
    
    // Look for screen share tracks from existing users
    remoteUsers.forEach((user) => {
      if (user.videoTrack && videoRef.current) {
        const trackId = user.videoTrack.getTrackId?.() || "unknown";
        
        // Try to identify screen share by track characteristics
        // Screen share tracks often have different IDs or properties
        console.log("🔍 [OTOSCOPY] Analyzing existing track:", {
          uid: user.uid,
          trackId,
          hasVideo: !!user.videoTrack
        });

        // For now, check if this might be a screen share based on multiple videos from same user
        const userTrackCount = remoteUsers.filter(u => u.uid === user.uid && u.videoTrack).length;
        
        if (userTrackCount > 1) {
          console.log("🎥 [OTOSCOPY] Multiple tracks detected, this might be screen share");
          user.videoTrack.play(videoRef.current);
          setScreenShareTrack(user.videoTrack);
          setIsStreaming(true);
      setStreamStatus("streaming");
    }
      }
    });
  }, [remoteUsers]);

  // Auto-join the main consultation channel
  useEffect(() => {
    const autoJoinChannel = async () => {
      if (!client || !isClientInitialized || hasAttemptedJoinRef.current || currentChannel) {
      return;
    }

    try {
      hasAttemptedJoinRef.current = true;
      setStreamStatus("connecting");
      
        console.log("🔄 [OTOSCOPY] Auto-joining consultation channel for screen share:", consultationId);
        
        // Get token for the main consultation channel (same as video call)
        const tokenData = await fetchToken({
          channelName: consultationId as string,
          userRole: 'subscriber', // Dashboard subscribes to video
          isUVC: false // Dashboard doesn't have UVC device
        });

        if (!tokenData.data?.token || !tokenData.data?.appId) {
          throw new Error("Failed to get Agora credentials");
        }

        // Join the main consultation channel
        await joinChannel(
          consultationId as string,
          tokenData.data.token,
          tokenData.data.appId,
          tokenData.data.userId || 0
        );

        console.log("✅ [OTOSCOPY] Joined consultation channel - ready for screen share detection");
        toast.success("Connected to video stream - waiting for screen share");
      } catch (error) {
        console.error("❌ [OTOSCOPY] Auto-join failed:", error);
        setStreamStatus("error");
        hasAttemptedJoinRef.current = false;
        toast.error("Failed to connect to video stream");
      }
    };

    autoJoinChannel();
  }, [client, isClientInitialized, consultationId, fetchToken, joinChannel, currentChannel]);

  // Manual connect handler
  const handleConnect = async () => {
    if (!client) {
      toast.error("Agora client not ready");
      return;
    }

    try {
      setStreamStatus("connecting");
      
      const tokenData = await fetchToken({
        channelName: consultationId as string,
        userRole: 'subscriber',
        isUVC: false
      });

      if (!tokenData.data?.token || !tokenData.data?.appId) {
        throw new Error("Failed to get Agora credentials");
      }

      await joinChannel(
        consultationId as string,
        tokenData.data.token,
        tokenData.data.appId,
        tokenData.data.userId || 0
      );
      
      toast.success("Connected to video stream");
    } catch (error) {
      console.error("❌ [OTOSCOPY] Manual connect failed:", error);
      setStreamStatus("error");
      toast.error("Failed to connect");
    }
  };

  const handleDisconnect = async () => {
    try {
      await leaveChannel();
      setIsStreaming(false);
      setScreenShareTrack(null);
      setStreamStatus("idle");
      hasAttemptedJoinRef.current = false;
      toast.success("Disconnected from video stream");
    } catch (error) {
      console.error("❌ [OTOSCOPY] Disconnect failed:", error);
      toast.error("Failed to disconnect");
      }
    };

  const getStatusColor = () => {
    switch (streamStatus) {
      case "streaming": return "text-green-600";
      case "connecting": return "text-yellow-600";
      case "error": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  const getStatusIcon = () => {
    switch (streamStatus) {
      case "streaming": return <Video className="h-4 w-4" />;
      case "connecting": return <Loader2 className="h-4 w-4 animate-spin" />;
      case "error": return <AlertCircle className="h-4 w-4" />;
      default: return <VideoOff className="h-4 w-4" />;
    }
  };

  // Get screen share status
  const hasScreenShare = remoteUserTracks.some(user => user.hasScreen);
  const screenShareUser = remoteUserTracks.find(user => user.hasScreen);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Video Display */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Otoscopy Screen Share
              <div className={`flex items-center gap-1 text-sm ${getStatusColor()}`}>
                {getStatusIcon()}
                {streamStatus.charAt(0).toUpperCase() + streamStatus.slice(1)}
              </div>
              {hasScreenShare && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  Screen Sharing Active
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
              <div
                ref={videoRef}
                className="w-full h-full"
                style={{ minHeight: "300px" }}
              >
                {!isStreaming && (
                  <div className="absolute inset-0 flex items-center justify-center text-white bg-gray-900">
                    <div className="text-center">
                      <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">
                        {streamStatus === "connecting" 
                          ? "Connecting to screen share..." 
                          : streamStatus === "error"
                          ? "Connection failed"
                          : "Waiting for screen share"}
                      </p>
                      <p className="text-sm opacity-75 mt-2">
                        {streamStatus === "connecting" 
                          ? "Please wait while we establish connection" 
                          : streamStatus === "error"
                          ? "Check connection and try again"
                          : hasScreenShare
                          ? "Screen share detected but not displaying"
                          : "Start screen sharing from your mobile app"}
                      </p>
                      {remoteUserTracks.length > 0 && (
                        <p className="text-xs opacity-60 mt-2">
                          Connected users: {remoteUserTracks.length} | 
                          Camera streams: {remoteUserTracks.filter(u => u.hasVideo).length} | 
                          Screen shares: {remoteUserTracks.filter(u => u.hasScreen).length}
                      </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Control Panel */}
      <div className="space-y-6">
        {/* Connection Status */}
        <ConnectionStatus
          isClientInitialized={isClientInitialized}
          isConnected={isConnected}
          isInitializing={isInitializing}
          error={error}
          currentChannel={currentChannel}
          remoteUsersCount={remoteUsers.length}
        />

        {/* Connection Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Screen Share Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!currentChannel ? (
              <Button 
                onClick={handleConnect}
                disabled={isInitializing || streamStatus === "connecting"}
                className="w-full"
              >
                {streamStatus === "connecting" ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Connect to Screen Share
                  </>
                )}
              </Button>
            ) : (
              <Button 
                onClick={handleDisconnect}
                variant="destructive"
                className="w-full"
              >
                <Square className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            )}

            {/* Stream Info */}
            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={getStatusColor()}>
                  {streamStatus.charAt(0).toUpperCase() + streamStatus.slice(1)}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-600">Channel:</span>
                <span className="text-gray-800 truncate ml-2">
                  {currentChannel || "Not connected"}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-600">Remote users:</span>
                <span className="text-gray-800">{remoteUsers.length}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-600">Screen sharing:</span>
                <span className={isStreaming ? "text-green-600" : "text-gray-500"}>
                  {isStreaming ? "Active" : "Inactive"}
                </span>
              </div>
              {screenShareUser && (
                <div className="flex justify-between mt-1">
                  <span className="text-gray-600">Sharing user:</span>
                  <span className="text-gray-800">{screenShareUser.uid}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stream Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Stream Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="space-y-1">
              {remoteUserTracks.map((user, idx) => (
                <div key={user.uid} className="p-2 bg-gray-50 rounded text-xs">
                  <div className="font-medium">User {user.uid}</div>
                  <div className="text-gray-600">
                    Camera: {user.hasVideo ? "✅" : "❌"} | 
                    Screen: {user.hasScreen ? "✅" : "❌"}
                  </div>
                </div>
              ))}
              {remoteUserTracks.length === 0 && (
                <div className="p-2 bg-gray-50 rounded text-xs text-gray-500">
                  No remote users detected
              </div>
            )}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>1. This view automatically detects screen sharing from your mobile app</p>
            <p>2. Camera streams are ignored - only screen shares are displayed</p>
            <p>3. Start screen sharing from your mobile app while the camera is running</p>
            <p>4. The second video stream (screen share) will appear here automatically</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 