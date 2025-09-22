"use server";

import { revalidatePath } from "next/cache";

const API_BASE_URL = process.env.IS_PRODUCTION === 'true' 
  ? 'http://65.2.163.137:3000/api/v1/'
  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1/';

console.log('🔵 Environment check:', {
  IS_PRODUCTION: process.env.IS_PRODUCTION,
  NODE_ENV: process.env.NODE_ENV,
  VERCEL_ENV: process.env.VERCEL_ENV,
  isProduction: process.env.IS_PRODUCTION === 'true'
});

console.log('🔵 Using production API URL:', API_BASE_URL);

export type SingleUploadRequest = {
  fileName: string;
  sessionId: string;
  mimeType: string;
  blob: Blob;
};

export type SingleUploadResponse = {
  key: string;
  playbackUrl?: string;
};

/**
 * Upload a small recording file directly via single PUT (< 5MB)
 * This is a fallback for segments too small for multipart upload
 */
export default async function singleUploadRecording({
  fileName,
  sessionId,
  mimeType,
  blob
}: SingleUploadRequest): Promise<SingleUploadResponse> {
  try {
    console.log(`🔍 [SINGLE_UPLOAD] Starting single upload for ${fileName} (${blob.size} bytes)`);
    
    // Convert blob to FormData for upload
    const formData = new FormData();
    formData.append('file', blob, fileName);
    formData.append('sessionId', sessionId);
    formData.append('mimeType', mimeType);
    
    const response = await fetch(`${API_BASE_URL}recordings/single-upload`, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type - let browser set it with boundary for FormData
      },
    });

    console.log(`🔍 [SINGLE_UPLOAD] Response status: ${response.status}`);
    
    const rawText = await response.text();
    console.log('🔍 [SINGLE_UPLOAD] Raw response:', rawText);
    
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseError) {
      console.error('❌ [SINGLE_UPLOAD] Failed to parse response as JSON:', parseError);
      throw new Error(`Invalid response format: ${rawText.substring(0, 200)}`);
    }

    console.log('📋 [SINGLE_UPLOAD] Parsed data:', data);
    console.log('🔑 [SINGLE_UPLOAD] Available keys:', Object.keys(data || {}));

    if (!response.ok) {
      const errorMessage = data?.message || data?.error || `HTTP ${response.status}`;
      console.error('❌ [SINGLE_UPLOAD] Upload failed:', errorMessage);
      throw new Error(`Single upload failed: ${errorMessage}`);
    }

    // Handle different response formats
    if (data && typeof data === 'object' && data.success === false) {
      const msg = data?.message || 'Single upload failed';
      throw new Error(String(msg));
    }

    // Extract key and playback URL from various possible response formats
    let key = data?.key ?? data?.Key ?? data?.s3Key ?? data?.location ?? data?.Location ?? null;
    let playbackUrl = data?.playbackUrl ?? data?.url ?? data?.downloadUrl ?? data?.publicUrl ?? null;

    // If data is nested under a 'data' property
    if (data?.data && typeof data.data === 'object') {
      key = key ?? data.data.key ?? data.data.Key ?? data.data.s3Key ?? data.data.location ?? data.data.Location;
      playbackUrl = playbackUrl ?? data.data.playbackUrl ?? data.data.url ?? data.data.downloadUrl ?? data.data.publicUrl;
    }

    console.log('🎯 [SINGLE_UPLOAD] Extracted values:', { key, playbackUrl });

    if (!key) {
      console.error('❌ [SINGLE_UPLOAD] No key found in response');
      throw new Error('No S3 key returned from single upload');
    }

    // If no playback URL provided, construct CloudFront URL using the key
    if (!playbackUrl && key) {
      // Assuming CloudFront distribution follows the pattern from multipart uploads
      playbackUrl = `https://d2z2qdacsqwdoo.cloudfront.net/${key}`;
      console.log('🔗 [SINGLE_UPLOAD] Constructed playback URL:', playbackUrl);
    }

    console.log('✅ [SINGLE_UPLOAD] Single upload successful:', { key, playbackUrl });

    revalidatePath('/dashboard');
    
    return {
      key: String(key),
      playbackUrl: playbackUrl ? String(playbackUrl) : undefined,
    };
    
  } catch (error) {
    console.error('❌ [SINGLE_UPLOAD] Single upload error:', error);
    throw error;
  }
}

