"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
import { 
  Wifi, 
  WifiOff, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw
} from "lucide-react";

interface ConnectionStatusProps {
  isClientInitialized: boolean;
  isConnected: boolean;
  isInitializing: boolean;
  error: string | null;
  currentChannel: string | null;
  remoteUsersCount: number;
}

export default function ConnectionStatus({
  isClientInitialized,
  isConnected,
  isInitializing,
  error,
  currentChannel,
  remoteUsersCount
}: ConnectionStatusProps) {
  const getConnectionStatus = () => {
    if (error) return "error";
    if (!isClientInitialized) return "initializing";
    if (isInitializing) return "connecting";
    if (isConnected) return "connected";
    return "disconnected";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-500";
      case "connecting":
        return "bg-blue-500";
      case "initializing":
        return "bg-yellow-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="w-4 h-4" />;
      case "connecting":
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case "initializing":
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case "error":
        return <XCircle className="w-4 h-4" />;
      default:
        return <WifiOff className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "connected":
        return "Connected to Backend";
      case "connecting":
        return "Connecting to Backend";
      case "initializing":
        return "Initializing WebRTC";
      case "error":
        return "Connection Error";
      default:
        return "Disconnected";
    }
  };

  const status = getConnectionStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="w-5 h-5" />
          WebRTC Connection Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(status)}
            <span className="font-medium">{getStatusText(status)}</span>
          </div>
          <Badge 
            variant="secondary" 
            className={`${getStatusColor(status)} text-white`}
          >
            {status.toUpperCase()}
          </Badge>
        </div>

        {/* Connection Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Client Initialized:</span>
            <span className={`ml-2 ${isClientInitialized ? 'text-green-600' : 'text-red-600'}`}>
              {isClientInitialized ? 'Yes' : 'No'}
            </span>
          </div>
          
          <div>
            <span className="font-medium">Backend Connected:</span>
            <span className={`ml-2 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? 'Yes' : 'No'}
            </span>
          </div>
          
          <div>
            <span className="font-medium">Channel:</span>
            <span className="ml-2 text-gray-600">
              {currentChannel || 'None'}
            </span>
          </div>
          
          <div>
            <span className="font-medium">Remote Users:</span>
            <span className="ml-2 text-gray-600">
              {remoteUsersCount}
            </span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Connection Steps */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Connection Steps:</h4>
          <div className="space-y-1 text-xs">
            <div className={`flex items-center gap-2 ${isClientInitialized ? 'text-green-600' : 'text-gray-400'}`}>
              {isClientInitialized ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full bg-gray-300" />}
              <span>1. Initialize Agora Client</span>
            </div>
            
            <div className={`flex items-center gap-2 ${isConnected ? 'text-green-600' : 'text-gray-400'}`}>
              {isConnected ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full bg-gray-300" />}
              <span>2. Connect to Agora Backend</span>
            </div>
            
            <div className={`flex items-center gap-2 ${currentChannel ? 'text-green-600' : 'text-gray-400'}`}>
              {currentChannel ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full bg-gray-300" />}
              <span>3. Join Channel</span>
            </div>
            
            <div className={`flex items-center gap-2 ${remoteUsersCount > 0 ? 'text-green-600' : 'text-gray-400'}`}>
              {remoteUsersCount > 0 ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full bg-gray-300" />}
              <span>4. Receive Video Stream</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 