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
import useDeleteCountry from "@/hooks/locations/use-delete-country";
import { CountryModelData } from "@/models/country.model";
import { Loader2 } from "lucide-react";
import { ReactNode, useState } from "react";
import { toast } from "sonner";

export default function DeleteLocationDialog({
  trigger,
  country,
}: {
  trigger: ReactNode;
  country: CountryModelData;
}) {
  const isCountry = !!country;
  const [isOpen, setIsOpen] = useState(false);
  const { mutate: deleteCountry, isPending: isDeleting } = useDeleteCountry();
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
  };
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isCountry ? "Delete Country" : "Delete Location"}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription>
          {isCountry
            ? "Are you sure you want to delete this country?"
            : "Are you sure you want to delete this location?"}
        </DialogDescription>
        <DialogFooter>
          <Button
            variant="destructive"
            onClick={onSubmit}
            disabled={isDeleting}
          >
            Delete
            {isDeleting && <Loader2 className="w-4 h-4 ml-2" />}
          </Button>
          <Button
            variant="outline"
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
