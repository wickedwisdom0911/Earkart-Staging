
"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useGetUser } from "@/hooks/auth/use-get-user";
import useUpdateAudiologistActivity from "@/hooks/audiologist/use-update-audiologist-activity"
import { Role, AudiologistActivityType } from "@/models/enums";
import { formatActivityLabel } from "@/utils";
import useStopAudiologistActivity from "@/hooks/audiologist/use-stop-audiology-activity";
import useGetAudiologistActivity from "@/hooks/audiologist/use-get-audiologist-activity";


type UserActivity = {
  id: string;
  type: AudiologistActivityType;
  startTime: string;
  customActivity?: string;
};

type ActivityContextType = {
  canTrack: boolean;
  userId?: string;
  selectedLabel: string;
  elapsed: number;
  currentActivity?: UserActivity;
  startActivity: (type: AudiologistActivityType, details?: string) => void;
  stopActivity: () => void;
};

const ActivityContext = createContext<ActivityContextType | null>(null);

export function ActivityProvider({ children }: { children: ReactNode }) {
  const { data: user } = useGetUser();
  const { data: activityData, refetch: refetchActivity } = useGetAudiologistActivity(user?.id ?? "");
  const { mutate: updateActivity } = useUpdateAudiologistActivity();
  const { mutate: stopAct } = useStopAudiologistActivity();

  const [elapsed, setElapsed] = useState(0);
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);
  const [currentActivity, setCurrentActivity] = useState<UserActivity | undefined>(undefined);

  const canTrack = Boolean(
    user && (user.role === Role.AUDIOLOGIST || user.role === Role.HEAD_AUDIOLOGIST)
  );

  useEffect(() => {
    if (!canTrack || !activityData || activityData.endTime) {
      if (timerId) {
        clearInterval(timerId);
        setTimerId(null);
      }
      setCurrentActivity(undefined);
      setElapsed(0);
      return;
    }

    const act: UserActivity = {
      id: activityData.id,
      type: activityData.type as AudiologistActivityType,
      startTime: activityData.startTime,
      customActivity: activityData.details || undefined,
    };
    setCurrentActivity(act);
    const startMs = new Date(act.startTime).getTime();
    setElapsed(Math.floor((Date.now() - startMs) / 1000));

    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    setTimerId(id);
    return () => clearInterval(id);
  }, [activityData, canTrack]);

  const startActivity = (type: AudiologistActivityType, details?: string) => {
    if (!user?.id) return;
    updateActivity(
      { audiologistId: user.id, type, details },
      {
        onSuccess: () => {
          // Refresh data
          refetchActivity();
        }
      }
    );
  };

  const stopActivity = () => {
    if (!user?.id || !currentActivity) return;
    stopAct(
      { audiologistId: user.id, id: currentActivity.id },
      {
        onSuccess: () => {
          // reset UI
          if (timerId) {
            clearInterval(timerId);
            setTimerId(null);
          }
          setElapsed(0);
          setCurrentActivity(undefined);
          // refetch to clear API record
          refetchActivity();
        },
        onError: (error) => {
          console.error("Failed to stop activity:", error);
        }
      }
    );
  };

  return (
    <ActivityContext.Provider
      value={{
        canTrack,
        userId: user?.id,
        selectedLabel: currentActivity
          ? currentActivity.customActivity || formatActivityLabel(currentActivity.type)
          : "Idle",
        elapsed,
        currentActivity,
        startActivity,
        stopActivity,
      }}
    >
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivity(): ActivityContextType {
  const ctx = useContext(ActivityContext);
  if (!ctx) throw new Error("useActivity must be used within ActivityProvider");
  return ctx;
}