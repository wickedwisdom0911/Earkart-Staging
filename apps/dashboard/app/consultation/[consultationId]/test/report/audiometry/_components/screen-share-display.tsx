"use client";
import React from "react";
import { Monitor, MonitorOff, Loader2, AlertCircle, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useScreenShare from "@/hooks/agora/use-screen-share";

export default function ScreenShareDisplay() {
  const {
    isEnabled,
    isConnecting,
    hasScreenShare,
    error,
    screenShareUser,
    screenShareVideoRef,
    connectToScreenShare,
    disconnectFromScreenShare,
    isConnected,
  } = useScreenShare();

  return (
    <Card className="bg-white shadow-lg border-2 border-gray-200 w-80">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Monitor className="text-blue-600" size={20} />
          Screen Share
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center gap-2">
          {isConnecting ? (
            <Loader2 className="animate-spin text-blue-500" size={16} />
          ) : isConnected ? (
            <Wifi className="text-green-500" size={16} />
          ) : (
            <WifiOff className="text-red-500" size={16} />
          )}
          <span className="text-sm font-medium">
            {isConnecting
              ? "Connecting..."
              : isConnected
              ? "Connected to channel"
              : "Disconnected"}
          </span>
        </div>

        {/* Screen Share Status */}
        <div className="flex items-center gap-2">
          {hasScreenShare ? (
            <MonitorOff className="text-green-500" size={16} />
          ) : (
            <Monitor className="text-gray-500" size={16} />
          )}
          <span className="text-sm font-medium">
            {hasScreenShare
              ? `Screen share detected (User: ${screenShareUser?.uid})`
              : "Waiting for screen share..."}
          </span>
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-2 bg-red-50 rounded-md border border-red-200">
            <AlertCircle className="text-red-500 flex-shrink-0" size={16} />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* Screen Share Video */}
        {hasScreenShare && (
          <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-300">
            <div
              ref={screenShareVideoRef}
              className="w-full h-40 bg-gray-900 flex items-center justify-center"
            >
              {!screenShareVideoRef.current && (
                <div className="text-white text-sm">Loading screen share...</div>
              )}
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-2">
          {!isEnabled ? (
            <Button
              onClick={connectToScreenShare}
              disabled={isConnecting}
              className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16} />
                  Connecting...
                </>
              ) : (
                "Connect"
              )}
            </Button>
          ) : (
            <Button
              onClick={disconnectFromScreenShare}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 flex-1"
            >
              Disconnect
            </Button>
          )}
        </div>

        {/* Info Text */}
        <div className="text-xs text-gray-600 space-y-1">
          <p>• Connects to the same channel as the main video call</p>
          <p>• Screen shares from the patient will appear automatically</p>
          <p>• Use during audiometry to share test results</p>
        </div>
      </CardContent>
    </Card>
  );
} 