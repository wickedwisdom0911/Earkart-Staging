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
import useUpdateAudiologistActivity from "@/hooks/audiologist/use-update-audiologist-activity";
import { useGetUser } from "@/hooks/auth/use-get-user";
import useStopAudiologistActivity from "@/hooks/audiologist/use-stop-audiology-activity";
import useGetAudiologistActivity from "@/hooks/audiologist/use-get-audiologist-activity";
import {
  activityIcons,
  calculateElapsedTime,
  formatActivityLabel,
  formatTime,
} from "@/utils";
import { AudiologistActivityType, Role } from "@/models/enums";

export const DashboardHeader = () => {
  const { open, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherActivityText, setOtherActivityText] = useState("");
  const [selectedActivity, setSelectedActivity] = useState<string>("");
  const [currentActivity, setCurrentActivity] = useState();

  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(
    null
  );

  const { data: user } = useGetUser();

  const { mutate: stopActivity, isPending: isStoppingActivity } =
    useStopAudiologistActivity();
  const { data: currentActivityData } = useGetAudiologistActivity(
    user?.id || ""
  );

  useEffect(() => {
    if (!currentActivityData || currentActivityData.endTime) {
      setCurrentActivity(null);
      setSelectedActivity("");
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
      setElapsedTime(0);
      return;
    }

    const label = formatActivityLabel(currentActivityData.type);
    setSelectedActivity(label);

    const resumed: UserActivity = {
      id: currentActivityData.id,
      type: currentActivityData.type as AudiologistActivityType,
      startTime: !currentActivityData?.startTime,
      customActivity: currentActivityData.details ?? undefined,
    };
    setCurrentActivity(resumed);

    if (timerInterval) {
      clearInterval(timerInterval);
    }

    const startMs = new Date(currentActivityData.startTime).getTime();
    const nowMs = Date.now();
    const initialElapsed = Math.max(0, Math.floor((nowMs - startMs) / 1000));
    setElapsedTime(initialElapsed);

    const iv = setInterval(() => setElapsedTime((e) => e + 1), 1000);
    setTimerInterval(iv);

    return () => clearInterval(iv);
  }, [currentActivityData]);

  const { mutate: updateActivity, isPending: isUpdatingActivity } =
    useUpdateAudiologistActivity();

  const startTimer = (activity: UserActivity) => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    const startTime = activity.endTime || activity.startTime;
    const initialElapsed = calculateElapsedTime(startTime);
    setElapsedTime(initialElapsed);

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
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

    stopActivity(
      {
        audiologistId: user.id,
        id: currentActivity?.id,
      },
      {
        onSuccess: (response) => {
          if (response.success) {
            setCurrentActivity(undefined);
            setSelectedActivity("");
            stopTimer();
            toast.success("Activity stopped successfully");
          } else {
            toast.error(
              "Failed to stop activity: " +
                (response.message || "Unknown error")
            );
          }
        },
        onError: (error) => {
          console.error("Stop activity error:", error);
          toast.error("Failed to stop activity: " + error.message);
        },
      }
    );
  };

  const canTrackActivity =
    user?.role === Role.AUDIOLOGIST || user?.role === Role.HEAD_AUDIOLOGIST;

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

      updateActivity(
        {
          audiologistId: user.id,
          type: activity,
        },
        {
          onSuccess: (response) => {
            if (response.success) {
              setSelectedActivity(activityLabel);
              const newActivity = {
                id: response.data?.id || "",
                type: activity,
                startTime: response.data?.startTime,
                customActivity: undefined,
              };
              setCurrentActivity(newActivity);
              startTimer(newActivity);
              toast.success(`Activity updated to: ${activityLabel}`);
            } else {
              toast.error(
                "Failed to update activity: " +
                  (response.message || "Unknown error")
              );
            }
          },
          onError: (error) => {
            console.error("Activity update error:", error);
            toast.error("Failed to update activity: " + error.message);
          },
        }
      );

      setShowOtherInput(false);
    }
  };

  const handleOtherSubmit = () => {
    if (!user?.id) {
      toast.error("User not loaded");
      return;
    }

    if (otherActivityText.trim()) {
      updateActivity(
        {
          audiologistId: user.id,
          type: AudiologistActivityType.OTHER,
          details: otherActivityText.trim(),
        },
        {
          onSuccess: (response) => {
            if (response.success) {
              setSelectedActivity(otherActivityText.trim());
              const newActivity = {
                id: response.data?.id || Date.now().toString(),
                type: AudiologistActivityType.OTHER,
                startTime: response.data?.startTime || new Date().toISOString(),
                customActivity: otherActivityText.trim(),
              };
              setCurrentActivity(newActivity);
              startTimer(newActivity);
              toast.success(`Activity updated to: ${otherActivityText.trim()}`);
            } else {
              toast.error(
                "Failed to update activity: " +
                  (response.message || "Unknown error")
              );
            }
          },
          onError: (error) => {
            console.error("Activity update error:", error);
            toast.error("Failed to update activity: " + error.message);
          },
        }
      );

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
                    disabled={isStoppingActivity}
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
                    disabled={isUpdatingActivity || !user?.id}
                  >
                    <Activity size={16} />
                    {isUpdatingActivity
                      ? "Updating..."
                      : selectedActivity || "Idle"}
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
                      const disabled = isUpdatingActivity || !!currentActivity;
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