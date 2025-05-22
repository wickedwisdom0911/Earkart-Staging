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
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
      deviceCode: device?.deviceCode || "",
      tabletID: device?.tabletID || null,
      deviceID: device?.deviceID || null,
      tabletAppVersion: device?.tabletAppVersion || null,
      centreId: device?.centreId || null,
      status: device?.status || StatusEnum.ACTIVE,
    },
  });
  function onSubmit(data: z.infer<typeof DeviceModelDataSchema>) {
    if (isEdit) {
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
    } else {
      createDevice(data, {
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="deviceCode"
                render={({ field }) => {
                  const prefix = "EARKART-";
                  const valueWithoutPrefix = field.value.startsWith(prefix)
                    ? field.value.slice(prefix.length)
                    : field.value;

                  return (
                    <FormItem>
                      <FormLabel>Device Code</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <span className="px-2 py-1 bg-gray-100 border border-r-0 border-gray-300 rounded-l">
                            {prefix}
                          </span>
                          <Input
                            {...field}
                            value={valueWithoutPrefix}
                            onChange={(e) => {
                              field.onChange(prefix + e.target.value);
                            }}
                            className="rounded-l-none"
                            placeholder="Enter code"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <StatusToggle
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex gap-2 w-full">
              <Button
                type="submit"
                className="w-1/2 cursor-pointer"
                onClick={() => {
                  form.handleSubmit(onSubmit);
                }}
                disabled={isCreating || isUpdating}
              >
                {isEdit ? "Update Device" : "Add Device"}
                {isCreating ||
                  (isUpdating && <Loader2 className="w-4 h-4 ml-2" />)}
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
      </DialogContent>
    </Dialog>
  );
}
