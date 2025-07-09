"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useGetUser } from "@/hooks/auth/use-get-user";
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

interface ContextType {
  canTrack: boolean;
  current?: Activity;
  elapsed: number;
  start: (type: AudiologistActivityType, details?: string) => void;
  stop: () => void;
}

const StatusCtx = createContext<ContextType | null>(null);

export function useAudiologyStatus() {
  const ctx = useContext(StatusCtx);
  if (!ctx) throw new Error("Must be used within AudiologyStatusProvider");
  return ctx;
}

export function AudiologyStatusProvider({ children }: { children: ReactNode }) {
  const { data: user } = useGetUser();
  const role = user?.role;
  const canTrack = role === Role.AUDIOLOGIST || role === Role.HEAD_AUDIOLOGIST;

  const { data: actData } = useGetAudiologistActivity(canTrack ? user?.id || "" : "");
  const { mutate: doStart } = useUpdateAudiologistActivity();
  const { mutate: doStop } = useStopAudiologistActivity();

  const [current, setCurrent] = useState<Activity | undefined>();
  const [elapsed, setElapsed] = useState(0);
  const [timer, setTimer] = useState<NodeJS.Timeout>();



  useEffect(() => {
    if (!canTrack) {
      if (timer) {
        clearInterval(timer);
        setTimer(undefined);
      }
      setCurrent(undefined);
      setElapsed(0);
      return;
    }
    
    // Check if we have valid activity data and it's not ended
    if (!actData || !actData.id || !actData.startTime || actData.endTime) {
      if (timer) {
        clearInterval(timer);
        setTimer(undefined);
      }
      setCurrent(undefined);
      setElapsed(0);
      return;
    }
    
    const act: Activity = {
      id: actData.id,
      type: actData.type as AudiologistActivityType,
      startTime: actData.startTime,
      details: actData.details || undefined,
    };
    setCurrent(act);
    const offset = Math.floor((Date.now() - new Date(act.startTime).getTime()) / 1000);
    setElapsed(offset);
    
    // Clear existing timer before setting a new one
    if (timer) {
      clearInterval(timer);
    }
    
    const iv = setInterval(() => setElapsed(e => e + 1), 1000);
    setTimer(iv);
    
    return () => {
      if (iv) clearInterval(iv);
    };
  }, [canTrack, actData]);

  const start = (type: AudiologistActivityType, details?: string) => {
    if (!canTrack || !user?.id) return;
    
    // Clear existing timer
    if (timer) {
      clearInterval(timer);
      setTimer(undefined);
    }
    
    doStart(
      { audiologistId: user.id, type },
      {
        onSuccess: res => {
          if (res.success && res.data && res.data.startTime) {
            const newAct: Activity = {
              id: res.data.id,
              type,
              startTime: res.data.startTime,
              details,
            };
            setCurrent(newAct);
            setElapsed(0);
            const iv = setInterval(() => setElapsed(e => e + 1), 1000);
            setTimer(iv);
          }
        },
        onError: (error) => {
          console.error("Failed to start activity:", error);
        }
      }
    );
  };

  const stop = () => {
    if (!canTrack || !current || !user?.id) return;
    if (timer) {
      clearInterval(timer);
      setTimer(undefined);
    }
    doStop(
      { audiologistId: user.id, id: current.id },
      { 
        onSuccess: () => { 
          setCurrent(undefined); 
          setElapsed(0); 
        },
        onError: (error) => {
          console.error("Failed to stop activity:", error);
        }
      }
    );
  };

  return (
    <StatusCtx.Provider value={{ canTrack, current, elapsed, start, stop }}>
      {children}
    </StatusCtx.Provider>
  );
}
