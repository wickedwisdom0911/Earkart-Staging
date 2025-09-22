"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import { 
  InitiateReportUploadRequestSchema,
  InitiateReportUploadResponseSchema,
  type InitiateReportUploadRequest,
  type InitiateReportUploadResponse
} from "@/models/report-upload.model";

export default async function initiateReportUpload(
  request: InitiateReportUploadRequest
): Promise<InitiateReportUploadResponse> {
  console.log('🔄 initiateReportUpload called with:', request);
  
  const baseUrl = await getBaseUrl();
  const user = await verifySession();
  
  console.log('🔍 Environment info:', {
    baseUrl,
    hasUser: !!user,
    hasToken: !!user?.token,
    userId: user?.id,
    userEmail: user?.email
  });
  
  if (!user?.token) {
    console.error('❌ No user token available');
    throw new Error("Unauthorized");
  }

  // Validate request body
  const validatedRequest = InitiateReportUploadRequestSchema.parse(request);
  console.log('✅ Request validated:', validatedRequest);

  const url = `${baseUrl}consultation/initiate-report-upload`;
  console.log('🌐 Making API request to:', url);

  try {
    console.log('📤 Making fetch request with:', {
      url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token?.substring(0, 20)}...`,
      },
      bodyPreview: JSON.stringify(validatedRequest)
    });

    const response = await apiRequest<InitiateReportUploadResponse>(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(validatedRequest),
      },
      InitiateReportUploadResponseSchema
    );

    console.log('✅ API response received:', response);
    return response;
  } catch (error) {
    console.error('❌ API request failed:', {
      error: error instanceof Error ? error.message : String(error),
      errorType: error?.constructor?.name,
      stack: error instanceof Error ? error.stack : undefined,
      url
    });
    
    // Re-throw with more context
    if (error instanceof Error) {
      throw new Error(`Failed to initiate report upload: ${error.message}`);
    }
    throw new Error(`Failed to initiate report upload: ${String(error)}`);
  }
}