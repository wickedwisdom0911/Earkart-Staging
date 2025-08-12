import { useAgoraOtoscopy as useAgoraOtoscopyProvider } from "@/providers/agora-otoscopy-provider";

export default function useAgoraOtoscopy() {
  const agoraOtoscopy = useAgoraOtoscopyProvider();
  
  return {
    ...agoraOtoscopy,
    // Add any additional convenience methods here
    isReady: agoraOtoscopy.client !== null,
    hasRemoteStream: agoraOtoscopy.remoteUsers.length > 0,
  };
} 