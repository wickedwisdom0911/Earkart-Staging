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
import { CountryModelData } from "@/models/country.model";
import { ReactNode, useState } from "react";

export default function DeleteLocationDialog({
  trigger,
  country,
}: {
  trigger: ReactNode;
  country: CountryModelData;
}) {
  const isCountry = !!country;
  const [isOpen, setIsOpen] = useState(false);
  const toggleDialog = () => {
    setIsOpen(!isOpen);
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
          <Button variant="destructive" onClick={toggleDialog}>
            Delete
          </Button>
          <Button variant="outline" onClick={toggleDialog}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
