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
    console.log("🔵 [apiRequest] Fetching:", url);
    const response = await fetch(url, options);
    
    console.log("🔵 [apiRequest] Response status:", response.status, response.statusText);
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        console.error("🔴 [apiRequest] Error response:", errorData);
      } catch (e) {
        errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        console.error("🔴 [apiRequest] Could not parse error response");
      }

      // Handle rate limiting (429) - don't retry immediately
      if (response.status === 429) {
        const errorMessage = errorData?.message || "Too Many Requests";
        console.warn("⚠️ [apiRequest] Rate limited. Please wait before retrying.");
        const rateLimitError = new Error(errorMessage);
        (rateLimitError as any).status = 429;
        (rateLimitError as any).statusCode = 429;
        (rateLimitError as any).isRateLimit = true;
        throw rateLimitError;
      }

      // Attach status code to all errors for proper error handling
      const error = new Error(
        errorData?.message || `HTTP ${response.status}: ${response.statusText}`
      );
      (error as any).status = response.status;
      (error as any).statusCode = response.status;
      throw error;
    }
    
    const result = await response.json();
    console.log("🔵 [apiRequest] Raw result:", {
      success: result?.success,
      message: result?.message,
      hasData: !!result?.data,
      dataType: Array.isArray(result?.data) ? 'array' : typeof result?.data
    });

    // Log detailed data structure if it's an array
    if (Array.isArray(result?.data) && result.data.length > 0) {
      const firstItem = result.data[0];
      console.log("🔵 [apiRequest] First consultation item keys:", Object.keys(firstItem));
      console.log("🔵 [apiRequest] First consultation item (full):", JSON.stringify(firstItem, null, 2));
      
      // Check for common required fields
      console.log("🔵 [apiRequest] Required fields check:", {
        hasId: !!firstItem.id,
        hasPatientId: !!firstItem.patientId,
        hasCentreId: !!firstItem.centreId,
        hasPatientStatus: !!firstItem.patientStatus,
        hasAudiologistStatus: !!firstItem.audiologistStatus,
        hasStatus: !!firstItem.status,
        hasCreatedAt: !!firstItem.createdAt,
        hasUpdatedAt: !!firstItem.updatedAt,
        id: firstItem.id,
        patientStatus: firstItem.patientStatus,
        audiologistStatus: firstItem.audiologistStatus,
        status: firstItem.status,
        // Check nested objects
        hasPatient: !!firstItem.patient,
        hasAudiologist: !!firstItem.audiologist,
        hasCentre: !!firstItem.centre,
        hasAudiometry: !!firstItem.audiometry,
        hasTympanometry: !!firstItem.tympanometry,
        // Check test structures
        audiometryKeys: firstItem.audiometry ? Object.keys(firstItem.audiometry) : null,
        tympanometryKeys: firstItem.tympanometry ? Object.keys(firstItem.tympanometry) : null,
      });
    }

    console.log("🔵 [apiRequest] Validating with schema...");
    let parsedResult;
    try {
      parsedResult = schema.parse(result);
      console.log("✅ [apiRequest] Validation passed");
    } catch (validationError) {
      // If validation fails, try with a very lenient schema to see what data we actually have
      if (validationError instanceof ZodError && Array.isArray(result?.data)) {
        console.error("🔴 [apiRequest] Validation failed, trying lenient schema...");
        const lenientSchema = z.object({
          success: z.boolean(),
          message: z.string(),
          data: z.array(z.any()),
        });
        const lenientResult = lenientSchema.parse(result);
        console.log("🔵 [apiRequest] Lenient validation passed. First item structure:", {
          keys: Object.keys(lenientResult.data[0] || {}),
          sample: JSON.stringify(lenientResult.data[0], null, 2).substring(0, 1000)
        });
      }
      throw validationError;
    }

    if (!parsedResult.success) {
      console.error("🔴 [apiRequest] API returned success: false");
      throw new Error(parsedResult.message || "API request failed");
    }

    return parsedResult;

  } catch (error) {
    if (error instanceof ZodError) {
      // Log all union errors in detail
      const unionErrors = error.errors
        .filter(e => e.code === 'invalid_union')
        .map(e => {
          const unionError = e as any;
          return {
            path: e.path,
            message: e.message,
            code: e.code,
            unionErrors: unionError.unionErrors?.map((ue: ZodError) => ({
              issues: ue.issues.map(issue => ({
                path: issue.path,
                message: issue.message,
                code: issue.code
              }))
            }))
          };
        });
      
      console.error('🔴 [apiRequest] Validation Error:', {
        url,
        errors: error.errors,
        formattedError: handleZodError(error),
        // Log the first few errors in detail
        firstError: error.errors[0] ? {
          path: error.errors[0].path,
          message: error.errors[0].message,
          code: error.errors[0].code
        } : null,
        unionErrors: unionErrors.length > 0 ? unionErrors : undefined
      });
      
      // Log detailed union error information
      if (unionErrors.length > 0 && unionErrors[0].unionErrors) {
        const allIssues = unionErrors[0].unionErrors.flatMap((ue: any, index: number) => 
          ue.issues.map((issue: any) => ({
            unionIndex: index,
            path: issue.path.join('.'),
            message: issue.message,
            code: issue.code,
            expected: issue.expected,
            received: issue.received
          }))
        );
        
        console.error('🔴 [apiRequest] Union Error Details:', {
          path: unionErrors[0].path.join('.'),
          totalUnionOptions: unionErrors[0].unionErrors.length,
          allIssues: allIssues,
          // Show first 10 issues
          firstIssues: allIssues.slice(0, 10)
        });
      }
      
      throw new Error(handleZodError(error));
    }
    console.error("🔴 [apiRequest] Other error:", error);
    throw error;
  }
}
