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
import { DeviceStatusEnum } from "@/models/enums";
import { Input } from "@/components/ui/input";

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
      // Only include editable fields - keep other fields from existing device
      deviceID: device?.deviceID || null,
      tabletID: device?.tabletID || null,
      // Keep all other fields from existing device to preserve them
      code: device?.code || null,
      codeSequence: device?.codeSequence || null,
      otoscopeID: device?.otoscopeID || null,
      tabletAppVersion: device?.tabletAppVersion || null,
      tabletAndroidVersion: device?.tabletAndroidVersion || null,
      centreId: device?.centreId || null,
      status: device?.status || DeviceStatusEnum.ENABLED,
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
    if (!device) {
      toast.error("Device data is missing");
      return;
    }
    
    const updateData: DeviceModelData = {
      ...device,
      deviceID: data.deviceID,
      tabletID: data.tabletID,
    };
    
    updateDevice(updateData, {
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
