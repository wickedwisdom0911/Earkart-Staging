"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import useCreateDevice from "@/hooks/device/use-create-device";
import { DeviceModelData, DeviceModelDataSchema } from "@/models/device.model";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import useUpdateDevice from "@/hooks/device/use-update-device";
import { StatusEnum } from "@/models/enums";
import StatusToggle from "@/components/ui/status-toggle";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export default function HandleDevicesDialog({
  trigger,
  device,
}: {
  trigger: ReactNode;
  device?: DeviceModelData;
}) {
  const isEdit = !!device;
  const [isOpen, setIsOpen] = useState(false);
  const { mutate: createDevice, isPending: isCreating } = useCreateDevice();
  const { mutate: updateDevice, isPending: isUpdating } = useUpdateDevice();
  
  const form = useForm<z.infer<typeof DeviceModelDataSchema>>({
    resolver: zodResolver(DeviceModelDataSchema),
    defaultValues: {
      id: device?.id || undefined,
      code: device?.code || null,
      codeSequence: device?.codeSequence || null,
      otoscopeID: device?.otoscopeID || null,
      tabletID: device?.tabletID || null,
      deviceID: device?.deviceID || null,
      tabletAppVersion: device?.tabletAppVersion || null,
      tabletAndroidVersion: device?.tabletAndroidVersion || null,
      centreId: device?.centreId || null,
      status: device?.status || StatusEnum.ACTIVE,
      pendingUpdate: device?.pendingUpdate ?? null,
      pendingLookup: device?.pendingLookup ?? null,
      lastUpdateChecked: device?.lastUpdateChecked || null,
    },
  });

  function handleCreateDevice() {
    createDevice(undefined, {
      onSuccess: (response) => {
        if (response.success) {
          toast.success(response.message);
          toggleDialog();
        }
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  }

  function onSubmit(data: z.infer<typeof DeviceModelDataSchema>) {
    updateDevice(data, {
      onSuccess: (response) => {
        if (response.success) {
          toast.success(response.message);
          toggleDialog();
        }
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  }

  const toggleDialog = () => {
    setIsOpen(!isOpen);
  };

  return (
    <Dialog open={isOpen} onOpenChange={toggleDialog}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="flex flex-col gap-8">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Device" : "Add Device"}</DialogTitle>
        </DialogHeader>

        {isEdit ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <StatusToggle
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="deviceID"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Device ID</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter device ID"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tabletID"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tablet ID</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter tablet ID"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="otoscopeID"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Otoscope ID</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter otoscope ID"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tabletAppVersion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tablet App Version</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 1.0.0"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tabletAndroidVersion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tablet Android Version</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 1.0.0"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastUpdateChecked"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Update Checked</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          value={
                            field.value
                              ? new Date(field.value).toISOString().slice(0, 16)
                              : ""
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(
                              value ? new Date(value).toISOString() : null
                            );
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name="pendingUpdate"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value ?? false}
                          onCheckedChange={(checked) => {
                            field.onChange(checked === true);
                          }}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Pending Update</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Device has a pending update
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pendingLookup"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value ?? false}
                          onCheckedChange={(checked) => {
                            field.onChange(checked === true);
                          }}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Pending Lookup</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Device has a pending lookup
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex gap-2 w-full">
                <Button
                  type="submit"
                  className="w-1/2 cursor-pointer"
                  disabled={isUpdating}
                >
                  Update Device
                  {isUpdating && <Loader2 className="w-4 h-4 ml-2" />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-1/2 cursor-pointer"
                  onClick={() => {
                    form.reset();
                    toggleDialog();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="space-y-8">
            <div className="text-center text-gray-600">
              Click the button below to create a new device. The device code will be automatically generated.
            </div>
            <div className="flex gap-2 w-full">
              <Button
                onClick={handleCreateDevice}
                className="w-1/2 cursor-pointer"
                disabled={isCreating}
              >
                Add Device
                {isCreating && <Loader2 className="w-4 h-4 ml-2" />}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-1/2 cursor-pointer"
                onClick={toggleDialog}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
