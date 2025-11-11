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

    // Add debug logging for consultation API responses
    if (url.includes('consultation')) {
      console.log('🔍 API Response for consultation:', {
        url,
        resultKeys: Object.keys(result || {}),
        success: result?.success,
        message: result?.message,
        dataType: typeof result?.data,
        dataIsArray: Array.isArray(result?.data),
        dataKeys: result?.data ? Object.keys(result.data) : null,
        firstItemKeys: Array.isArray(result?.data) && result.data[0] ? Object.keys(result.data[0]) : null
      });
    }

    // Validate using the provided schema
    return schema.parse(result);
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
