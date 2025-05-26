import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Dialog } from "@/components/ui/dialog";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Form } from "@/components/ui/form";
import CentreSelector from "@/components/ui/selector/centre-selector";
import useAssignDevice from "@/hooks/device/use-assign-device";
import { DeviceModelData } from "@/models/device.model";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
export default function HandleDeviceAssigningDialog({
  device,
  trigger,
}: {
  device: DeviceModelData;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { mutate: assignDevice, isPending, isError } = useAssignDevice();
  const schema = z.object({
    centreId: z.string().min(1),
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      centreId: device.centreId || "",
    },
  });
  function onSubmit(data: z.infer<typeof schema>) {
    if (!device.id) {
      toast.error("Device ID is required");
      return;
    }
    assignDevice(
      {
        deviceId: device.id,
        centreId: data.centreId,
      },
      {
        onSuccess: (response) => {
          if (response.success) {
            toast.success("Device assigned to centre");
            setOpen(false);
          } else {
            toast.error(response.message);
          }
        },
        onError: (error) => {
          toast.error(error.message);
        },
      }
    );
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{"Assign Device"}</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          {"Assign the device to a centre."}
        </DialogDescription>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="centreId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Centre</FormLabel>
                  <FormControl>
                    <CentreSelector
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="bg-primary-500 text-white cursor-pointer"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isError ? (
                "Retry"
              ) : (
                "Assign"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
              }}
            >
              Cancel
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
