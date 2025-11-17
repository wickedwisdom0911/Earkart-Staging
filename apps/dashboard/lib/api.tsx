// lib/api.ts

import { ZodError, ZodSchema } from "zod";
import { handleZodError } from "@/utils/zodErrorHandling";
import { isProduction } from "./environment";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function apiRequest<T extends ApiResponse<any>>(
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

    const parsedResult = schema.parse(result);

    if (!parsedResult.success) {
      throw new Error(parsedResult.message || "API request failed");
    }

    return parsedResult;

  } catch (error) {
    if (error instanceof ZodError) {
      console.error('🔴 Validation Error:', {
        url,
        errors: error.errors,
        formattedError: handleZodError(error)
      });
      throw new Error(handleZodError(error));
    }
    throw error;
  }
}
