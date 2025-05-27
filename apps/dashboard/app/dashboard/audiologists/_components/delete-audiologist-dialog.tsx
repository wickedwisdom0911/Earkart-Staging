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
import useDeleteAudiologist from "@/hooks/audiologist/use-delete-audiologist";
import { AudiologistModelData } from "@/models/audiologist.model";
import { Loader2 } from "lucide-react";
import { ReactNode, useState } from "react";
import { toast } from "sonner";

export default function DeleteAudiologistDialog({
  trigger,
  audiologist,
}: {
  trigger: ReactNode;
  audiologist: AudiologistModelData;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { mutate: deleteAudiologist, isPending: isDeleting } =
    useDeleteAudiologist();
  const toggleDialog = () => {
    setIsOpen(!isOpen);
  };

  const onSubmit = () => {
    deleteAudiologist(audiologist.id || "", {
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
          <DialogTitle>Delete Audiologist</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Are you sure you want to delete this audiologist?
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
