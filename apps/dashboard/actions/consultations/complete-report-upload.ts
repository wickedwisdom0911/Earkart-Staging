"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import { 
  CompleteReportUploadRequestSchema,
  CompleteReportUploadResponseSchema,
  type CompleteReportUploadRequest,
  type CompleteReportUploadResponse
} from "@/models/report-upload.model";

export default async function completeReportUpload(
  request: CompleteReportUploadRequest
): Promise<CompleteReportUploadResponse> {
  const baseUrl = await getBaseUrl();
  const user = await verifySession();
  
  if (!user?.token) {
    throw new Error("Unauthorized");
  }

  // Validate request body
  const validatedRequest = CompleteReportUploadRequestSchema.parse(request);

  const url = `${baseUrl}consultation/complete-report-upload`;

  const response = await apiRequest<CompleteReportUploadResponse>(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify(validatedRequest),
    },
    CompleteReportUploadResponseSchema
  );

  return response;
}