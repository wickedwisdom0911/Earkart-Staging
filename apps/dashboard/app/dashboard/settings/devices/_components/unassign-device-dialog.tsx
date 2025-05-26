import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ReactNode, useState } from "react";
import useUnassignDevice from "@/hooks/device/use-unassign-device";
import { toast } from "sonner";

export default function UnassignDeviceDialog({
  trigger,
  deviceId,
}: {
  trigger: ReactNode;
  deviceId: string;
}) {
  const { mutate: unassignDevice, isPending, isError } = useUnassignDevice();
  const [isOpen, setIsOpen] = useState(false);
  const handleUnassignDevice = () => {
    unassignDevice(
      { deviceId: deviceId || "" },
      {
        onSuccess: (response) => {
          if (response.success) {
            setIsOpen(false);
            toast.success("Device unassigned successfully");
          } else {
            toast.error(response.message);
          }
        },
        onError: (error) => {
          toast.error(error.message);
        },
      }
    );
  };
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>Unassign Device</DialogHeader>
        <DialogDescription>
          Are you sure you want to unassign this device?
        </DialogDescription>
        <DialogFooter>
          <Button onClick={handleUnassignDevice} disabled={isPending}>
            {isPending ? "Unassigning..." : isError ? "Retry" : "Unassign"}
          </Button>
          <Button variant="outline">Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
