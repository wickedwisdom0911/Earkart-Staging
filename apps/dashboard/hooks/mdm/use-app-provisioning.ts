"use client";

import {
  completeUpload,
  createAppProvisioning,
  deleteAppProvisioning,
  getLatestAppProvisioning,
  initiateUpload,
} from "@/actions/mdm/app-provisioning";
import {
  CompleteUploadRequest,
  CreateAppProvisioningRequest,
  GetLatestAppProvisioningParams,
  InitiateUploadRequest,
} from "@/models/app-provisioning.model";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const LATEST_APP_PROVISIONING_QUERY_KEY = "latest-app-provisioning";

export const useGetLatestAppProvisioning = (
  params?: GetLatestAppProvisioningParams,
) => {
  return useQuery({
    queryKey: [LATEST_APP_PROVISIONING_QUERY_KEY, params],
    queryFn: () => getLatestAppProvisioning(params),
  });
};

export const useInitiateUpload = () => {
  return useMutation({
    mutationFn: (data: InitiateUploadRequest) => initiateUpload(data),
  });
};

export const useCompleteUpload = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CompleteUploadRequest) => completeUpload(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [LATEST_APP_PROVISIONING_QUERY_KEY],
      });
    },
  });
};

export const useCreateAppProvisioning = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAppProvisioningRequest) =>
      createAppProvisioning(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [LATEST_APP_PROVISIONING_QUERY_KEY],
      });
    },
  });
};

export const useDeleteAppProvisioning = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAppProvisioning(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [LATEST_APP_PROVISIONING_QUERY_KEY],
      });
    },
  });
};
