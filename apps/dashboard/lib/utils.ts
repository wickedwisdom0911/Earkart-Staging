import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Convert YYYY-MM-DD to ISO start of day for API: 2024-01-01T00:00:00.000Z */
export function toApiStartDate(dateStr: string): string {
  if (!dateStr || dateStr.includes("T")) return dateStr;
  return `${dateStr}T00:00:00.000Z`;
}

/** Convert YYYY-MM-DD to ISO end of day for API: 2024-01-31T23:59:59.999Z */
export function toApiEndDate(dateStr: string): string {
  if (!dateStr || dateStr.includes("T")) return dateStr;
  return `${dateStr}T23:59:59.999Z`;
}

