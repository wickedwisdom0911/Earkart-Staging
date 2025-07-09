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
      clearInterval(timer);
      setCurrent(undefined);
      setElapsed(0);
      return;
    }
    if (!actData || actData.endTime) {
      clearInterval(timer);
      setCurrent(undefined);
      setElapsed(0);
      return;
    }
    const act: Activity = {
      id: actData.id,
      type: actData.type as AudiologistActivityType,
      startTime: actData.startTime,
      details: actData.details,
    };
    setCurrent(act);
    const offset = Math.floor((Date.now() - new Date(act.startTime).getTime()) / 1000);
    setElapsed(offset);
    const iv = setInterval(() => setElapsed(e => e + 1), 1000);
    setTimer(iv);
    return () => clearInterval(iv);
  }, [canTrack, actData]);

  const start = (type: AudiologistActivityType, details?: string) => {
    if (!canTrack || !user?.id) return;
    clearInterval(timer);
    doStart(
      { audiologistId: user.id, type, details },
      {
        onSuccess: res => {
          if (res.success && res.data) {
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
      }
    );
  };

  const stop = () => {
    if (!canTrack || !current || !user?.id) return;
    clearInterval(timer);
    doStop(
      { audiologistId: user.id, id: current.id },
      { onSuccess: () => { setCurrent(undefined); setElapsed(0); } }
    );
  };

  return (
    <StatusCtx.Provider value={{ canTrack, current, elapsed, start, stop }}>
      {children}
    </StatusCtx.Provider>
  );
}
