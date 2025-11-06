"use client";
import { Button } from "@/components/ui/button";
import { Monitor, MonitorOff } from "lucide-react";
import useSharedScreenShare from "@/hooks/agora/use-shared-screen-share";
import { toast } from "sonner";

export function ShareScreenButton() {
  const { isSharing: isScreenSharing, isConnecting: isScreenConnecting, toggleScreenShare } = useSharedScreenShare();

  return (
    <Button
      onClick={async () => {
        try {
          await toggleScreenShare();
          if (!isScreenSharing) {
            toast.success("Screen sharing started with doctor");
          } else {
            toast.success("Screen sharing stopped");
          }
        } catch (error) {
          console.error("Screen share error:", error);
          toast.error("Failed to toggle screen sharing");
        }
      }}
      disabled={isScreenConnecting}
      className={`flex items-center gap-2 ${
        isScreenSharing 
          ? "bg-blue-600 hover:bg-blue-700" 
          : "bg-green-600 hover:bg-green-700"
      } text-white disabled:opacity-50`}
      size="sm"
    >
      {isScreenSharing ? (
        <>
          <MonitorOff size={16} />
          <span className="text-xs font-medium">Stop Sharing</span>
        </>
      ) : (
        <>
          <Monitor size={16} />
          <span className="text-xs font-medium">Share Screen</span>
        </>
      )}
    </Button>
  );
}

