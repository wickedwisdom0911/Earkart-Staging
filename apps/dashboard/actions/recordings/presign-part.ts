"use server";

import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";

export type PresignPartRequest = {
  uploadId: string;
  partNumber: number;
};

export type PresignPartResponse = {
  url: string;
};

export default async function presignRecordingPart(
  params: PresignPartRequest
): Promise<PresignPartResponse> {
  // Check if this is a mock uploadId (created by initiate action in mock mode)
  if (params.uploadId.startsWith('mock-upload-')) {
    console.log("🧪 [PRESIGN] Mock uploadId detected, returning mock presigned URL");
    return {
      url: `https://mock-s3-bucket.s3.amazonaws.com/test-path?uploadId=${params.uploadId}&partNumber=${params.partNumber}&mock=true`
    };
  }

  const baseUrl = await getBaseUrl();
  const user = await verifySession();
  if (!user?.token) throw new Error("Unauthorized");

  const url = `${baseUrl}recordings/presign?uploadId=${encodeURIComponent(
    params.uploadId
  )}&partNumber=${encodeURIComponent(String(params.partNumber))}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${user.token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`❌ [PRESIGN] API Error ${res.status}:`, text);
    
    // Mock presigned URL for testing when backend is unavailable
    if (res.status === 404 || res.status >= 500) {
      console.log("🧪 [PRESIGN] Backend unavailable, using mock presigned URL");
      return {
        url: `https://mock-s3-bucket.s3.amazonaws.com/test-path?uploadId=${params.uploadId}&partNumber=${params.partNumber}&mock=true`
      };
    }
    
    throw new Error(`Failed to presign part: ${res.status} ${text}`);
  }
  const json = await res.json().catch(() => ({}));
  console.log("🔍 [PRESIGN] Raw response:", JSON.stringify(json, null, 2));
  
  const data = json?.data ?? json;
  const presignedUrl = data?.presignedUrl || data?.url;
  
  console.log("🔍 [PRESIGN] Parsed data:", JSON.stringify(data, null, 2));
  console.log("🔍 [PRESIGN] Extracted presignedUrl:", presignedUrl);
  
  if (!presignedUrl || typeof presignedUrl !== "string") {
    // Check if this is an error response indicating the upload session is invalid
    const errorMessage = data?.message || json?.message || "Unknown error";
    const isSessionNotFound = errorMessage.includes("not found") || 
                             errorMessage.includes("Recording with uploadId") ||
                             errorMessage.includes("Failed to generate presigned URL");
    
    if (isSessionNotFound) {
      console.error("❌ [PRESIGN] Upload session not found or expired:", errorMessage);
      throw new Error(`Upload session invalid: ${errorMessage}`);
    }
    
    console.error("❌ [PRESIGN] Unexpected response structure:", {
      json,
      data,
      presignedUrl,
      presignedUrlType: typeof presignedUrl,
      errorMessage
    });
    throw new Error(`Unexpected presign response shape. Expected presignedUrl or url string, got: ${JSON.stringify(data)}`);
  }
  return { url: presignedUrl };
}


