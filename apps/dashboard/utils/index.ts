
import {
  Coffee,
  Clock,
  Home,
  GraduationCap,
  Headphones,
  Settings,
  MoreHorizontal,
} from "lucide-react";

export const activityIcons= {
  LUNCH_BREAK: Coffee,
  BREAK: Clock,
  HOME_VISIT: Home,
  TRAINING: GraduationCap,
  HEARING_AID_FITTING: Headphones,
  FINE_TUNING: Settings,
  OTHER: MoreHorizontal,
};


export function formatActivityLabel(activity: string) {
  return activity
    .split("_")
    .map(
      (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(" ");
}


export function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:
      ${minutes.toString().padStart(2, "0")}:
      ${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes.toString().padStart(2, "00")}:
    ${secs.toString().padStart(2, "00")}`;
}

export function calculateElapsedTime(startTime: string) {
  const startMs = new Date(startTime).getTime();
  const nowMs = Date.now();
  return Math.max(0, Math.floor((nowMs - startMs) / 1000));
}
