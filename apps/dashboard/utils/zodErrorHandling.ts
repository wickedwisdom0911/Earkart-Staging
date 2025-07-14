import { ZodError } from "zod";

/**
 * A utility function to handle and format Zod validation errors
 * @param error - The ZodError instance
 * @returns A formatted string containing the human-readable errors
 */
export function handleZodError(error: ZodError): string {
  // Custom error message formatting for Zod validation errors
  return error.errors
    .map((err) => `Field: ${err.path.join(".")}, Error: ${err.message}`)
    .join("\n");
} 