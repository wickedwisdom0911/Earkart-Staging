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
import useDeleteCentre from "@/hooks/centre/use-delete-centre";
import { CentreModelData } from "@/models/centre.model";
import { Loader2 } from "lucide-react";
import { ReactNode, useState } from "react";
import { toast } from "sonner";

export default function DeleteCentreDialog({
  trigger,
  centre,
}: {
  trigger: ReactNode;
  centre: CentreModelData;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { mutate: deleteCentre, isPending: isDeleting } = useDeleteCentre();
  const toggleDialog = () => {
    setIsOpen(!isOpen);
  };

  const onSubmit = () => {
    deleteCentre(centre.id || "", {
      onSuccess: (response) => {
        if (response.success) {
          toast.success(response.message);
          toggleDialog();
        } else {
          toast.error(response.message);
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
          <DialogTitle>Delete Centre</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Are you sure you want to delete this centre?
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
