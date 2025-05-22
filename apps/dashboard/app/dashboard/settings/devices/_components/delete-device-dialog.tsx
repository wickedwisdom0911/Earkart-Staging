import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import useDeleteDevice from "@/hooks/device/use-delete-device";
import { DeviceModelData } from "@/models/device.model";
import { Loader2 } from "lucide-react";
import { ReactNode, useState } from "react";
import { toast } from "sonner";

export default function DeleteDeviceDialog({
  trigger,
  device,
}: {
  trigger: ReactNode;
  device: DeviceModelData;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { mutate: deleteDevice, isPending: isDeleting } = useDeleteDevice();
  const toggleDialog = () => {
    setIsOpen(!isOpen);
  };

  const onSubmit = () => {
    deleteDevice(device.id || "", {
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
  };
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Device</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Are you sure you want to delete this device?
        </DialogDescription>
        <DialogFooter>
          <Button
            variant="destructive"
            onClick={onSubmit}
            disabled={isDeleting}
            className="cursor-pointer"
          >
            Delete
            {isDeleting && <Loader2 className="w-4 h-4 ml-2" />}
          </Button>
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={toggleDialog}
            disabled={isDeleting}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
