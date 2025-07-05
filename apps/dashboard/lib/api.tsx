// lib/api.ts

import { ZodError, ZodSchema } from "zod";
import { handleZodError } from "./ZodErrorHandling";
import { isProduction } from "./environment";

export async function apiRequest<T>(
  url: string,
  options: RequestInit,
  schema: ZodSchema<T>
): Promise<T> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json();

      throw new Error(
        errorData?.message || "An error occurred while fetching data."
      );
    }
    
    const result = await response.json();

    console.log("result", result)

    // Validate using the provided schema
    return schema.parse(result);
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = handleZodError(error);
      if (await isProduction()) {
        throw new Error("Something went wrong during login. Please try again.");
      } else {
        console.error(`Invalid API response: \n${formattedErrors}`);
        throw new Error(`Invalid API response: \n${formattedErrors}`);
      }
    }
    if (!(await isProduction())) {
      console.error("API request error:", error);
    }
    throw error;
  }
}
