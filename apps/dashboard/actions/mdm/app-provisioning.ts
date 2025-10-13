"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import {
  AppProvisioning,
  AppProvisioningResponseSchema,
  CompleteUploadRequest,
  CompleteUploadResponseSchema,
  CreateAppProvisioningRequest,
  DeleteAppProvisioningResponseSchema,
  GetLatestAppProvisioningParams,
  InitiateUploadRequest,
  InitiateUploadResponseSchema,
} from "@/models/app-provisioning.model";
import { verifySession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function initiateUpload(
  body: InitiateUploadRequest,
) {
  const session = await verifySession();
  if (!session?.token) {
    throw new Error("Unauthorized");
  }

  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}mdm/app-provisioning/initiate-upload`;

  const response = await apiRequest(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify(body),
    },
    InitiateUploadResponseSchema
  );

  if (!response.data) {
    throw new Error(response.message || "Failed to initiate upload");
  }

  return response.data;
}

export async function completeUpload(body: CompleteUploadRequest) {
  const session = await verifySession();
  if (!session?.token) {
    throw new Error("Unauthorized");
  }

  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}mdm/app-provisioning/complete-upload`;

  const response = await apiRequest(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify(body),
    },
    CompleteUploadResponseSchema,
  );

  if (!response.data?.appProvisioning) {
    throw new Error(response.message || "Failed to complete upload");
  }

  revalidatePath("/dashboard/mdm");
  return response.data.appProvisioning;
}

export async function getLatestAppProvisioning(
  params?: GetLatestAppProvisioningParams,
): Promise<AppProvisioning | null> {
  const session = await verifySession();
  if (!session?.token) {
    throw new Error("Unauthorized");
  }

  const baseUrl = await getBaseUrl();
  const queryParams = new URLSearchParams();

  if (params?.status) {
    queryParams.append("status", params.status);
  }
  if (params?.versionName) {
    queryParams.append("versionName", params.versionName);
  }
  if (params?.minVersionCode !== undefined) {
    queryParams.append("minVersionCode", params.minVersionCode.toString());
  }

  const queryString = queryParams.toString();
  const url = `${baseUrl}mdm/app-provisioning/latest${
    queryString ? `?${queryString}` : ""
  }`;

  try {
    const response = await apiRequest(
      url,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`,
        },
      },
      AppProvisioningResponseSchema,
    );
    
    // Return null if no data (not found case)
    return response.data || null;
  } catch (error) {
    // This is a workaround for the backend returning 200 OK with an empty/invalid object
    // when no records are found, which causes a Zod validation error.
    if (error instanceof Error && error.message.includes("Required")) {
      console.log(
        "Handled Zod validation error, likely due to no records found. Returning null.",
      );
      return null;
    }
    // Re-throw any other unexpected errors.
    throw error;
  }
}

export async function createAppProvisioning(
  body: CreateAppProvisioningRequest,
): Promise<AppProvisioning> {
  const session = await verifySession();
  if (!session?.token) {
    throw new Error("Unauthorized");
  }

  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}mdm/app-provisioning`;

  const response = await apiRequest(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify(body),
    },
    AppProvisioningResponseSchema
  );

  if (!response.data) {
    throw new Error(response.message || "Failed to create app provisioning");
  }

  revalidatePath("/dashboard/mdm");
  return response.data;
}

export async function deleteAppProvisioning(id: string): Promise<void> {
  const session = await verifySession();
  if (!session?.token) {
    throw new Error("Unauthorized");
  }

  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}mdm/app-provisioning/${id}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("App provisioning record not found");
    }
    
    let errorMessage = "Failed to delete app provisioning record";
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      // If parsing fails, use default message
    }
    
    throw new Error(errorMessage);
  }

  // For 204 No Content, there's no body to parse
  revalidatePath("/dashboard/mdm");
}
