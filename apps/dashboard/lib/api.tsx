// lib/api.ts

import { z, ZodError, ZodSchema } from "zod";
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const response = await fetch(url, {
      ...options,
      cache: "no-store" as RequestCache,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
      }

      if (response.status === 429) {
        const rateLimitError = new Error(errorData?.message || "Too Many Requests");
        (rateLimitError as any).status = 429;
        (rateLimitError as any).statusCode = 429;
        (rateLimitError as any).isRateLimit = true;
        throw rateLimitError;
      }

      const error = new Error(
        errorData?.message || `HTTP ${response.status}: ${response.statusText}`
      );
      (error as any).status = response.status;
      (error as any).statusCode = response.status;
      throw error;
    }

    const result = await response.json();
    let parsedResult;
    try {
      parsedResult = schema.parse(result);
    } catch (validationError) {
      if (validationError instanceof ZodError && Array.isArray(result?.data)) {
        const lenientSchema = z.object({
          success: z.boolean(),
          message: z.string(),
          data: z.array(z.any()),
        });
        lenientSchema.parse(result);
      }
      throw validationError;
    }

    if (!parsedResult.success) {
      throw new Error(parsedResult.message || "API request failed");
    }

    return parsedResult;

  } catch (error) {
    if (error instanceof Error && (error.name === "AbortError" || error.message.toLowerCase().includes("timeout"))) {
      const timeoutError = new Error("Request timeout - The server took too long to respond. Please try again.");
      (timeoutError as any).isTimeout = true;
      (timeoutError as any).status = 408;
      throw timeoutError;
    }
    if (error instanceof ZodError) {
      console.error("🔴 [apiRequest] Validation Error:", { url, message: handleZodError(error) });
      throw new Error(handleZodError(error));
    }
    throw error;
  }
}
