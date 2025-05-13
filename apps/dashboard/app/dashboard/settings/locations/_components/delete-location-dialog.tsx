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
import useDeleteState from "@/hooks/locations/states/use-delete-state";
import useDeleteCountry from "@/hooks/locations/use-delete-country";
import { CountryModelData } from "@/models/country.model";
import { StateModelData } from "@/models/state.model";
import { Loader2 } from "lucide-react";
import { ReactNode, useState } from "react";
import { toast } from "sonner";

export default function DeleteLocationDialog({
  trigger,
  country,
  state,
}: {
  trigger: ReactNode;
  country?: CountryModelData;
  state?: StateModelData;
}) {
  const isCountry = !!country;
  const isState = !!state;
  const [isOpen, setIsOpen] = useState(false);
  const { mutate: deleteCountry, isPending: isDeleting } = useDeleteCountry();
  const { mutate: deleteState, isPending: isDeletingState } = useDeleteState();
  const toggleDialog = () => {
    setIsOpen(!isOpen);
  };

  const onSubmit = () => {
    if (isCountry) {
      deleteCountry(country.id || "", {
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
    if (isState) {
      deleteState(state.id || "", {
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
  };
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isCountry
              ? "Delete Country"
              : isState
                ? "Delete State"
                : "Delete Location"}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription>
          {isCountry
            ? "Are you sure you want to delete this country?"
            : isState
              ? "Are you sure you want to delete this state?"
              : "Are you sure you want to delete this location?"}
        </DialogDescription>
        <DialogFooter>
          <Button
            variant="destructive"
            onClick={onSubmit}
            disabled={isDeleting || isDeletingState}
          >
            Delete
            {isDeleting && <Loader2 className="w-4 h-4 ml-2" />}
            {isDeletingState && <Loader2 className="w-4 h-4 ml-2" />}
          </Button>
          <Button
            variant="outline"
            onClick={toggleDialog}
            disabled={isDeleting || isDeletingState}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
