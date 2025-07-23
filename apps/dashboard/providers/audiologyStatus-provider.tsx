
"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
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
  
  const canTrack = Boolean(
    user && (user.role === Role.AUDIOLOGIST || user.role === Role.HEAD_AUDIOLOGIST)
  );

  const { data: activityData, refetch: refetchActivity } = useGetAudiologistActivity(
    canTrack ? (user?.id || "") : ""
  );
  const { mutate: updateActivity } = useUpdateAudiologistActivity();
  const { mutate: stopAct } = useStopAudiologistActivity();

  const [elapsed, setElapsed] = useState(0);
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);
  const [currentActivity, setCurrentActivity] = useState<UserActivity | undefined>(undefined);
  const startTimeRef = useRef<number | null>(null);
  const isNewActivityRef = useRef<boolean>(false);



  useEffect(() => {
    if (!canTrack || !activityData || activityData.endTime) {
      if (timerId) {
        clearInterval(timerId);
        setTimerId(null);
      }
      setCurrentActivity(undefined);
      setElapsed(0);
      startTimeRef.current = null;
      return;
    }

    const act: UserActivity = {
      id: activityData.id,
      type: activityData.type as AudiologistActivityType,
      startTime: activityData.startTime || new Date().toISOString(),
      customActivity: activityData.details || undefined,
    };
    setCurrentActivity(act);
    
    const startMs = new Date(act.startTime).getTime();
    const now = Date.now();
    const initialElapsed = Math.floor((now - startMs) / 1000);
    
    const storedStartTime = localStorage.getItem('activityStartTime');
    const hasStoredTime = !!storedStartTime;
    
    const isNewActivity = isNewActivityRef.current || (!currentActivity && !hasStoredTime);
    
    if (isNewActivity) {
      startTimeRef.current = now;
      setElapsed(0);
      isNewActivityRef.current = false;
    } else {
      if (storedStartTime) {
        const localStartMs = parseInt(storedStartTime);
        const localElapsed = Math.floor((now - localStartMs) / 1000);
        startTimeRef.current = localStartMs;
        setElapsed(Math.max(0, localElapsed));
      } else {
        if (initialElapsed < 0) {
          const timeOffset = Math.abs(initialElapsed);
          startTimeRef.current = now - (timeOffset * 1000);
          setElapsed(0);
        } else {
          startTimeRef.current = startMs;
          setElapsed(initialElapsed);
        }
      }
    }

    const id = setInterval(() => {
      if (startTimeRef.current) {
        const currentTime = Date.now();
        const totalElapsed = Math.floor((currentTime - startTimeRef.current) / 1000);
        setElapsed(Math.max(0, totalElapsed));
      }
    }, 1000);
    
    setTimerId(id);
    return () => clearInterval(id);
  }, [activityData, canTrack]);

  const startActivity = (type: AudiologistActivityType, details?: string) => {
    if (!user?.id || !canTrack) return;
    
    isNewActivityRef.current = true;
    
    const localStartTime = Date.now();
    localStorage.setItem('activityStartTime', localStartTime.toString());
    
    updateActivity(
      { audiologistId: user.id, type },
      {
        onSuccess: () => {
          refetchActivity();
        },
        onError: (error) => {
          console.error("Failed to start activity:", error);
        }
      }
    );
  };

  const stopActivity = () => {
    if (!user?.id || !currentActivity || !canTrack) return;
    stopAct(
      { audiologistId: user.id, id: currentActivity.id },
      {
        onSuccess: () => {
          if (timerId) {
            clearInterval(timerId);
            setTimerId(null);
          }
          setElapsed(0);
          setCurrentActivity(undefined);
          startTimeRef.current = null;
          isNewActivityRef.current = false;
          localStorage.removeItem('activityStartTime');
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