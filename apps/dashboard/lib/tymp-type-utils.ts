import { TympType } from "@/models/enums";

/**
 * Normalizes tymp type values from backend format (TYPE_A) to frontend format (A)
 * or vice versa. Handles both old and new enum formats.
 */
export function normalizeTympType(value: string | TympType): TympType {
  if (!value) return TympType.TYPE_A; // Default
  
  const str = String(value);
  
  // Map backend format to frontend format
  const backendToFrontend: Record<string, TympType> = {
    "TYPE_A": TympType.A,
    "TYPE_B": TympType.B,
    "TYPE_C": TympType.C,
    "TYPE_AS": TympType.As,
    "TYPE_AD": TympType.Ad,
  };
  
  // Map frontend format to frontend enum
  const frontendToEnum: Record<string, TympType> = {
    "A": TympType.A,
    "B": TympType.B,
    "C": TympType.C,
    "As": TympType.As,
    "Ad": TympType.Ad,
  };
  
  // Check backend format first
  if (backendToFrontend[str]) {
    return backendToFrontend[str];
  }
  
  // Check frontend format
  if (frontendToEnum[str]) {
    return frontendToEnum[str];
  }
  
  // Check if it's already a valid enum value
  if (Object.values(TympType).includes(str as TympType)) {
    return str as TympType;
  }
  
  // Default fallback
  return TympType.TYPE_A;
}

/**
 * Converts frontend tymp type to backend format (TYPE_A)
 */
export function toBackendTympType(value: TympType | string): string {
  const str = String(value);
  
  // Map frontend format to backend format
  const frontendToBackend: Record<string, string> = {
    "A": "TYPE_A",
    "B": "TYPE_B",
    "C": "TYPE_C",
    "As": "TYPE_AS",
    "Ad": "TYPE_AD",
  };
  
  // If already in backend format, return as is
  if (str.startsWith("TYPE_")) {
    return str;
  }
  
  // Convert frontend format to backend
  return frontendToBackend[str] || "TYPE_A";
}

