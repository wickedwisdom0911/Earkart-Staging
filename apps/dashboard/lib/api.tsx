// lib/api.ts

import { ZodError, ZodSchema } from "zod";
import { handleZodError } from "@/utils/zodErrorHandling";
import { isProduction } from "./environment";

export async function apiRequest<T>(
  url: string,
  options: RequestInit,
  schema: ZodSchema<T>
): Promise<T> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
      }

      throw new Error(
        errorData?.message || `HTTP ${response.status}: ${response.statusText}`
      );
    }
    
    const result = await response.json();

    // Validate using the provided schema
    return schema.parse(result);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(handleZodError(error));
    }
    throw error;
  }
}
