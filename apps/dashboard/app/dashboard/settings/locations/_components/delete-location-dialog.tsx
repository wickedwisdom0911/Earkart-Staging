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
import useDeleteCity from "@/hooks/locations/cities/use-delete-city";
import useDeleteState from "@/hooks/locations/states/use-delete-state";
import useDeleteCountry from "@/hooks/locations/use-delete-country";
import { CityModelData } from "@/models/city.model";
import { CountryModelData } from "@/models/country.model";
import { StateModelData } from "@/models/state.model";
import { Loader2 } from "lucide-react";
import { ReactNode, useState } from "react";
import { toast } from "sonner";

export default function DeleteLocationDialog({
  trigger,
  country,
  state,
  city,
}: {
  trigger: ReactNode;
  country?: CountryModelData;
  state?: StateModelData;
  city?: CityModelData;
}) {
  const isCountry = !!country;
  const isState = !!state;
  const isCity = !!city;
  const [isOpen, setIsOpen] = useState(false);
  const { mutate: deleteCountry, isPending: isDeleting } = useDeleteCountry();
  const { mutate: deleteState, isPending: isDeletingState } = useDeleteState();
  const { mutate: deleteCity, isPending: isDeletingCity } = useDeleteCity();
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
    if (isCity) {
      deleteCity(city.id || "", {
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
                : isCity
                  ? "Delete City"
                  : "Delete Location"}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription>
          {isCountry
            ? "Are you sure you want to delete this country?"
            : isState
              ? "Are you sure you want to delete this state?"
              : isCity
                ? "Are you sure you want to delete this city?"
                : "Are you sure you want to delete this location?"}
        </DialogDescription>
        <DialogFooter>
          <Button
            variant="destructive"
            onClick={onSubmit}
            disabled={isDeleting || isDeletingState || isDeletingCity}
          >
            Delete
            {isDeleting && <Loader2 className="w-4 h-4 ml-2" />}
            {isDeletingState && <Loader2 className="w-4 h-4 ml-2" />}
            {isDeletingCity && <Loader2 className="w-4 h-4 ml-2" />}
          </Button>
          <Button
            variant="outline"
            onClick={toggleDialog}
            disabled={isDeleting || isDeletingState || isDeletingCity}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
