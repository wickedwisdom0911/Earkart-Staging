"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useGetLatestAppProvisioning,
  useInitiateUpload,
  useCompleteUpload,
  useDeleteAppProvisioning,
} from "@/hooks/mdm/use-app-provisioning";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import * as Dialog from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

const AppProvisioningSchema = z.object({
  versionName: z.string().min(1, "Version name is required"),
  versionCode: z.coerce.number().positive("Version code must be a positive number"),
  releaseNotes: z.string().optional(),
  apk: z
    .custom<FileList>()
    .refine((files) => files?.length > 0, "APK file is required."),
});

type AppProvisioningForm = z.infer<typeof AppProvisioningSchema>;

export default function MdmPage() {
  const [isUploading, setIsUploading] = useState(false);

  const {
    data: latestApp,
    isLoading: isLoadingLatest,
    error: latestAppError,
  } = useGetLatestAppProvisioning({ status: "ACTIVE" });

  const initiateUploadMutation = useInitiateUpload();
  const completeUploadMutation = useCompleteUpload();
  const deleteAppProvisioningMutation = useDeleteAppProvisioning();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AppProvisioningForm>({
    resolver: zodResolver(AppProvisioningSchema),
  });

  const onSubmit = async (data: AppProvisioningForm) => {
    setIsUploading(true);
    const file = data.apk[0];

    const toastId = toast.loading("Starting APK upload...", {
      description: "Initializing upload and preparing the file.",
    });

    try {
      const initiateResponse = await initiateUploadMutation.mutateAsync({
        versionName: data.versionName,
        versionCode: data.versionCode,
        fileName: file.name,
        contentType: file.type || "application/vnd.android.package-archive",
        releaseNotes: data.releaseNotes,
        status: "ACTIVE",
      });

      toast.loading("Uploading file to secure storage...", {
        id: toastId,
        description:
          "This may take a few moments depending on the file size.",
      });

      const { presignedUrl, uploadId, appProvisioningId } = initiateResponse;

      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type":
            file.type || "application/vnd.android.package-archive",
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file to S3");
      }

      toast.loading("Finalizing upload...", {
        id: toastId,
        description: "Completing the upload process and verifying the file.",
      });

      await completeUploadMutation.mutateAsync({
        uploadId,
        appProvisioningId,
      });

      toast.success("APK uploaded successfully!", {
        id: toastId,
        description: "The new version is now available.",
      });
      reset();
    } catch (error: any) {
      console.error("Upload failed", error);
      toast.error("Failed to upload APK", {
        id: toastId,
        description:
          error?.message || "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this app version? This action cannot be undone.")) {
      return;
    }

    const toastId = toast.loading("Deleting app version...");

    try {
      await deleteAppProvisioningMutation.mutateAsync(id);
      toast.success("App version deleted successfully!", {
        id: toastId,
      });
    } catch (error: any) {
      console.error("Delete failed", error);
      toast.error("Failed to delete app version", {
        id: toastId,
        description: error?.message || "An unexpected error occurred.",
      });
    }
  };

  const handleDownloadClick = (
    e: React.MouseEvent<HTMLElement>,
    url: string,
  ) => {
    e.preventDefault();
    // Create a temporary link element
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", ""); // This prompts the download
    document.body.appendChild(link);
    link.click(); // Simulate a click
    document.body.removeChild(link); // Clean up
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">
          App Provisioning Management
        </h1>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Latest App Version</CardTitle>
            <CardDescription>
              Information about the latest active application version.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingLatest && <Loader2 className="h-6 w-6 animate-spin" />}
            {latestAppError && (
              <p className="text-red-500">
                Error fetching latest version: {latestAppError.message}
              </p>
            )}
            {latestApp && (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Version Name:</span>
                  <span>{latestApp.versionName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Version Code:</span>
                  <span>{latestApp.versionCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Status:</span>
                  <Badge
                    variant={
                      latestApp.status === "ACTIVE" ? "default" : "secondary"
                    }
                  >
                    {latestApp.status}
                  </Badge>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="font-medium">Release Notes:</span>
                  <p className="text-sm text-muted-foreground">
                    {latestApp.releaseNotes || "No release notes provided."}
                  </p>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="font-medium">APK URL:</span>
                  <span
                    onClick={(e) =>
                      latestApp.apkUrl && handleDownloadClick(e as any, latestApp.apkUrl)
                    }
                    className="cursor-pointer text-sm text-blue-500 hover:underline break-all"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        latestApp.apkUrl && handleDownloadClick(e as any, latestApp.apkUrl);
                      }
                    }}
                  >
                    {latestApp.apkUrl
                      ? latestApp.apkUrl.replace(/^(https?:\/\/)/, "")
                      : "Not available"}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    Created: {new Date(latestApp.createdAt).toLocaleString()}
                  </span>
                  <span>
                    Updated: {new Date(latestApp.updatedAt).toLocaleString()}
                  </span>
                </div>
                <div className="pt-3 border-t">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(latestApp.id)}
                    disabled={deleteAppProvisioningMutation.isPending}
                    className="w-full"
                  >
                    {deleteAppProvisioningMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete This Version
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
            {!isLoadingLatest && !latestApp && (
              <p>No active app versions found.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upload New Version</CardTitle>
            <CardDescription>
              Upload a new APK file to provision a new version of the app.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="versionName">Version Name</Label>
                <Input
                  id="versionName"
                  placeholder="e.g., 1.2.0"
                  {...register("versionName")}
                />
                {errors.versionName && (
                  <p className="text-sm text-red-500">
                    {errors.versionName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="versionCode">Version Code</Label>
                <Input
                  id="versionCode"
                  type="number"
                  placeholder="e.g., 120"
                  {...register("versionCode")}
                />
                {errors.versionCode && (
                  <p className="text-sm text-red-500">
                    {errors.versionCode.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="releaseNotes">Release Notes</Label>
                <Textarea
                  id="releaseNotes"
                  placeholder="Describe the changes in this version..."
                  {...register("releaseNotes")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apk">APK File</Label>
                <Input
                  id="apk"
                  type="file"
                  accept=".apk"
                  {...register("apk")}
                />
                {errors.apk && (
                  <p className="text-sm text-red-500">
                    {errors.apk.message as string}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isUploading}>
                {isUploading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isUploading ? "Uploading..." : "Upload APK"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
