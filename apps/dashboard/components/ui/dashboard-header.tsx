"use client";
import { useSidebar } from "./sidebar";
import { motion } from "framer-motion";
import { Button } from "./button";
import { ChevronLeft, Activity, Coffee, Clock, Home, GraduationCap, Headphones, Settings, MoreHorizontal, Check, X, StopCircle } from "lucide-react";
import Image from "next/image";
import { Breadcrumb } from "./breadcrumbs";
import { usePathname } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./dropdown-menu";
import { Input } from "./input";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import useUpdateAudiologistActivity from "@/hooks/audiologist/use-update-audiologist-activity";
import { useGetUser } from "@/hooks/auth/use-get-user";
import useStopAudiologistActivity from "@/hooks/audiologist/use-stop-audiology-activity";
import useGetAudiologistActivity from "@/hooks/audiologist/use-get-audiologist-activity";

enum AudiologistActivityType {
  LUNCH_BREAK = "LUNCH_BREAK",
  BREAK = "BREAK",
  HOME_VISIT = "HOME_VISIT",
  TRAINING = "TRAINING",
  HEARING_AID_FITTING = "HEARING_AID_FITTING",
  FINE_TUNING = "FINE_TUNING",
  OTHER = "OTHER"
}

// Type definition for UserActivity
interface UserActivity {
  id: string;
  type: AudiologistActivityType;
  startTime: string;
  endTime?: string;
  customActivity?: string;
}

const activityIcons = {
  [AudiologistActivityType.LUNCH_BREAK]: Coffee,
  [AudiologistActivityType.BREAK]: Clock,
  [AudiologistActivityType.HOME_VISIT]: Home,
  [AudiologistActivityType.TRAINING]: GraduationCap,
  [AudiologistActivityType.HEARING_AID_FITTING]: Headphones,
  [AudiologistActivityType.FINE_TUNING]: Settings,
  [AudiologistActivityType.OTHER]: MoreHorizontal,
};

const formatActivityLabel = (activity: string) => {
  return activity.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const DashboardHeader = () => {
  const { open, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherActivityText, setOtherActivityText] = useState("");
  const [selectedActivity, setSelectedActivity] = useState<string>("");
  const [currentActivity, setCurrentActivity] = useState<UserActivity | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  const { data: user } = useGetUser();

  const { mutate: stopActivity, isPending: isStoppingActivity } = useStopAudiologistActivity();
  const { data: currentActivityData, refetch: refetchActivity } = useGetAudiologistActivity(user?.id || "");


console.log(currentActivityData)

//  data: {
//     id: 'bf4f3a63-fd6c-4515-a92b-4ab62084d550',
//     audiologistId: 'c54d91d0-6ffe-4132-850c-b30fa2dfdb1b',
//     type: 'BREAK',
//     startTime: '2025-07-02T09:59:40.909Z',
//     endTime: '2025-07-02T10:03:02.168Z',
//     consultationId: null,
//     details: null,
//     createdAt: '2025-07-02T09:59:40.910Z',
//     updatedAt: '2025-07-02T10:03:02.169Z'
//   }
// }
// useEffect(() => {
//   if (user?.id) {
//     refetchActivity();
//   }
// }, [user?.id, refetchActivity]);



// useEffect(() => {
//   // if there's no _running_ activity, go idle
//   if (!currentActivityData) {
//     setCurrentActivity(null);
//     setSelectedActivity("");
//     stopTimer();
//     return;
//   }

//   if(currentActivity?.startTime && currentActivity?.endTime)
// {
//   return
// }


//   // at this point currentActivityData is guaranteed to be an active one
//   const label = formatActivityLabel(currentActivityData.type);

//   setSelectedActivity(label);

//   const userAct: UserActivity = {
//     id: currentActivityData.id,
//     type: currentActivityData.type as AudiologistActivityType,
//     startTime: currentActivityData.startTime,
//     customActivity: currentActivityData.details ?? undefined,
//   };
//   setCurrentActivity(userAct);
//   startTimer(userAct);
// }, [currentActivityData]);


  

  const { 
    mutate: updateActivity, 
    isPending: isUpdatingActivity 
  } = useUpdateAudiologistActivity();

  const calculateElapsedTime = (startTime: string) => {
    const start = new Date(startTime).getTime();
    const now = new Date().getTime();
    return Math.floor((now - start) / 1000);
  };

  const startTimer = (activity: UserActivity) => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    const startTime = activity.endTime || activity.startTime; 
    const initialElapsed = calculateElapsedTime(startTime);
    setElapsedTime(initialElapsed);

    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    setTimerInterval(interval);
  };

  const stopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setElapsedTime(0);
  };

  const handleStopActivity = () => {
    if (!currentActivity || !user?.id) return;

    stopActivity({
      audiologistId: user.id,
      id: currentActivity.id, 
    }, {
      onSuccess: (response) => {
        if (response.success) {

          setCurrentActivity(null);
          setSelectedActivity("");
          stopTimer();
          toast.success("Activity stopped successfully");
        } else {
          toast.error("Failed to stop activity: " + (response.message || "Unknown error"));
        }
      },
      onError: (error) => {
        console.error("Stop activity error:", error);
        toast.error("Failed to stop activity: " + error.message);
      },
    });
  };


  


  
  const handleActivitySelect = (activity: AudiologistActivityType) => {
    if (!user?.id) {
      toast.error("User not loaded");
      return;
    }

    if (activity === AudiologistActivityType.OTHER) {
      setShowOtherInput(true);
      setOtherActivityText("");
    } else {
      const activityLabel = formatActivityLabel(activity);
      
      updateActivity({
        audiologistId: user.id,
        type: activity, 
      }, {
        onSuccess: (response) => {
          if (response.success) {
            setSelectedActivity(activityLabel);
            const newActivity = {
              id: response.data?.id || "",
              type: activity,
              startTime: response.data?.startTime || new Date().toISOString(),
              customActivity: undefined
            };
            setCurrentActivity(newActivity);
            startTimer(newActivity);
            toast.success(`Activity updated to: ${activityLabel}`);
          } else {
            toast.error("Failed to update activity: " + (response.message || "Unknown error"));
          }
        },
        onError: (error) => {
          console.error("Activity update error:", error);
          toast.error("Failed to update activity: " + error.message);
        },
      });
      
      setShowOtherInput(false);
    }
  };

  const handleOtherSubmit = () => {
    if (!user?.id) {
      toast.error("User not loaded");
      return;
    }

    if (otherActivityText.trim()) {
      updateActivity({
        audiologistId: user.id,
        type: otherActivityText,
        customActivity: otherActivityText.trim(),
      }, {
        onSuccess: (response) => {
          if (response.success) {
            setSelectedActivity(otherActivityText.trim());
            const newActivity = {
              id: response.data?.id || Date.now().toString(),
              type: AudiologistActivityType.OTHER,
              startTime: response.data?.startTime || new Date().toISOString(),
              customActivity: otherActivityText.trim()
            };
            setCurrentActivity(newActivity);
            startTimer(newActivity);
            toast.success(`Activity updated to: ${otherActivityText.trim()}`);
          } else {
            toast.error("Failed to update activity: " + (response.message || "Unknown error"));
          }
        },
        onError: (error) => {
          console.error("Activity update error:", error);
          toast.error("Failed to update activity: " + error.message);
        },
      });
      
      setShowOtherInput(false);
    }
  };

  const handleOtherCancel = () => {
    setShowOtherInput(false);
    setOtherActivityText("");
  };


  return (
    <div className="flex h-14 gap-2 w-full">
      <Button
        className={`h-14 rounded-lg cursor-pointer shadow flex items-center justify-center gap-2 bg-neutral-100 hover:bg-neutral-300 text-black ${
          open ? "w-62" : "w-14"
        }`}
        onClick={toggleSidebar}
      >
        <ChevronLeft
          className={`transition-transform duration-300 ${
            open ? "" : "rotate-180"
          }`}
          size={20}
        />
        {open ? (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            Collapse Sidebar
          </motion.span>
        ) : null}
      </Button>

      <div className="flex-1">
        <div className="flex rounded-lg items-center justify-between p-4 bg-neutral-100 w-full gap-4">
          <div className="flex items-center gap-4">
            <Image src="/logo.webp" alt="logo" width={120} height={120} />
            <div className="h-full w-[1px] bg-neutral-800" />
            <Breadcrumb pathname={pathname} />
          </div>
          
          <div className="flex items-center gap-3">
            {currentActivity && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-green-700">
                  {formatTime(elapsedTime)}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleStopActivity}
                  disabled={isStoppingActivity}
                  className="h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  <StopCircle size={12} />
                </Button>
              </div>
            )}


            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  disabled={isUpdatingActivity || !user?.id}
                >
                  <Activity size={16} />
                  {isUpdatingActivity ? "Updating..." : (selectedActivity || "Idle")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Select Activity</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {showOtherInput ? (
                  <div className="p-2 space-y-2">
                    <Input
                      placeholder="Enter custom activity..."
                      value={otherActivityText}
                      onChange={(e) => setOtherActivityText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleOtherSubmit();
                        } else if (e.key === 'Escape') {
                          handleOtherCancel();
                        }
                      }}
                      autoFocus
                      disabled={isUpdatingActivity}
                    />
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        onClick={handleOtherSubmit}
                        disabled={!otherActivityText.trim() || isUpdatingActivity}
                        className="flex-1"
                      >
                        <Check size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleOtherCancel}
                        className="flex-1"
                        disabled={isUpdatingActivity}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {Object.values(AudiologistActivityType).map((activity) => {
                      const IconComponent = activityIcons[activity];
                      return (
                        <DropdownMenuItem 
                          key={activity} 
                          className="flex items-center gap-2"
                          onClick={() => { return handleActivitySelect(activity)}}
                          disabled={isUpdatingActivity}
                        >
                          <IconComponent size={16} />
                          {formatActivityLabel(activity)}
                        </DropdownMenuItem>
                      );
                    })}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
};