"use client";
import { useSidebar } from "./sidebar";
import { motion } from "framer-motion";
import { Button } from "./button";
import { ChevronLeft, Activity, Check, X, StopCircle } from "lucide-react";
import Image from "next/image";
import { Breadcrumb } from "./breadcrumbs";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Input } from "./input";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useGetUser } from "@/hooks/auth/use-get-user";
import {
  activityIcons,
  formatActivityLabel,
  formatTime,
} from "@/utils";
import { AudiologistActivityType, Role } from "@/models/enums";
import useUpdateAudiologistActivity from "@/hooks/audiologist/use-update-audiologist-activity";
import useGetAudiologistActivity from "@/hooks/audiologist/use-get-audiologist-activity";
import useStopAudiologistActivity from "@/hooks/audiologist/use-stop-audiology-activity";

interface Activity {
  id: string;
  type: AudiologistActivityType;
  startTime: string;
  details?: string;
}

export const DashboardHeader = () => {
  const { open, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherActivityText, setOtherActivityText] = useState("");

  const { data: user } = useGetUser();
  const role = user?.role;
  const canTrackActivity = role === Role.AUDIOLOGIST || role === Role.HEAD_AUDIOLOGIST;

  const { data: activityData } = useGetAudiologistActivity(canTrackActivity ? user?.id || "" : "");
  const { mutate: startActivity } = useUpdateAudiologistActivity();
  const { mutate: stopActivity } = useStopAudiologistActivity();

  const [currentActivity, setCurrentActivity] = useState<Activity | undefined>();
  const [elapsedTime, setElapsedTime] = useState(0);

  // Initialize activity state and timer
  useEffect(() => {
    if (!canTrackActivity) {
      setCurrentActivity(undefined);
      setElapsedTime(0);
      return;
    }

    if (!activityData || !activityData.id || !activityData.startTime || activityData.endTime) {
      setCurrentActivity(undefined);
      setElapsedTime(0);
      return;
    }

    const activity: Activity = {
      id: activityData.id,
      type: activityData.type as AudiologistActivityType,
      startTime: activityData.startTime,
      details: activityData.details || undefined,
    };

    setCurrentActivity(activity);
    
    // Calculate elapsed time from start
    const startTime = new Date(activity.startTime).getTime();
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    setElapsedTime(elapsed);
  }, [canTrackActivity, activityData]);

  // Timer effect
  useEffect(() => {
    if (!currentActivity) return;

    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentActivity]);

  const handleStopActivity = () => {
    if (!currentActivity || !user?.id) return;
    
    stopActivity(
      { audiologistId: user.id, id: currentActivity.id },
      {
        onSuccess: () => {
          setCurrentActivity(undefined);
          setElapsedTime(0);
          toast.success("Activity stopped successfully");
        },
        onError: (error) => {
          console.error("Failed to stop activity:", error);
          toast.error("Failed to stop activity");
        }
      }
    );
  };

  const handleActivitySelect = (activity: AudiologistActivityType) => {
    if (!canTrackActivity) {
      toast.error("Activity tracking not available");
      return;
    }

    if (activity === AudiologistActivityType.OTHER) {
      setShowOtherInput(true);
      setOtherActivityText("");
    } else {
      handleStartActivity(activity);
      setShowOtherInput(false);
    }
  };

  const handleStartActivity = (type: AudiologistActivityType, details?: string) => {
    if (!canTrackActivity || !user?.id) return;

    startActivity(
      { audiologistId: user.id, type },
      {
        onSuccess: (res) => {
          if (res.success && res.data && res.data.startTime) {
            const newActivity: Activity = {
              id: res.data.id,
              type,
              startTime: res.data.startTime,
              details,
            };
            setCurrentActivity(newActivity);
            setElapsedTime(0);
            const activityLabel = details || formatActivityLabel(type);
            toast.success(`Activity started: ${activityLabel}`);
          }
        },
        onError: (error) => {
          console.error("Failed to start activity:", error);
          toast.error("Failed to start activity");
        }
      }
    );
  };

  const handleOtherSubmit = () => {
    if (!canTrackActivity) {
      toast.error("Activity tracking not available");
      return;
    }

    if (otherActivityText.trim()) {
      handleStartActivity(AudiologistActivityType.OTHER, otherActivityText.trim());
      setShowOtherInput(false);
    }
  };

  const handleOtherCancel = () => {
    setShowOtherInput(false);
    setOtherActivityText("");
  };

  return (
    <div className="flex h-14 gap-2 w-full">
      {/* Sidebar toggle */}
      <Button
        className={`h-14 rounded-lg shadow flex items-center justify-center gap-2 bg-neutral-100 ${
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
        {open && <motion.span>Collapse Sidebar</motion.span>}
      </Button>

      <div className="flex-1">
        <div className="flex items-center justify-between p-4 bg-neutral-100 rounded-lg gap-4">
          <div className="flex items-center gap-4">
            <Image src="/logo.webp" alt="logo" width={120} height={120} />
            <div className="h-full w-px bg-neutral-800" />
            <Breadcrumb pathname={pathname} />
          </div>

          {canTrackActivity && (
            <div className="flex items-center gap-3">
              {/* running timer & stop button */}
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
                    className="h-6 px-2 text-red-600 hover:bg-red-50 border-red-200"
                  >
                    <StopCircle size={12} />
                  </Button>
                </div>
              )}

              {/* activity dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    disabled={!canTrackActivity}
                  >
                    <Activity size={16} />
                    {currentActivity 
                      ? (currentActivity.details || formatActivityLabel(currentActivity.type))
                      : "Idle"}
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
                          if (e.key === "Enter") handleOtherSubmit();
                          if (e.key === "Escape") handleOtherCancel();
                        }}
                        autoFocus
                      />
                      <div className="flex gap-1">
                        <Button size="sm" onClick={handleOtherSubmit}>
                          <Check size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleOtherCancel}
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    Object.values(AudiologistActivityType).map((activity) => {
                      const Icon = activityIcons[activity];
                      const label = formatActivityLabel(activity);
                      const disabled = !!currentActivity;
                      return (
                        <DropdownMenuItem
                          key={activity}
                          className="flex items-center gap-2"
                          disabled={disabled}
                          onClick={() =>
                            !disabled && handleActivitySelect(activity)
                          }
                        >
                          <Icon size={16} />
                          {label}
                        </DropdownMenuItem>
                      );
                    })
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};