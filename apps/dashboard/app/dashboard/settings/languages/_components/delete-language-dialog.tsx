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
import useDeleteLanguage from "@/hooks/languages/use-delete-language";
import { LanguageModelData } from "@/models/language.model";
import { Loader2 } from "lucide-react";
import { ReactNode, useState } from "react";
import { toast } from "sonner";

export default function DeleteLanguageDialog({
  trigger,
  language,
}: {
  trigger: ReactNode;
  language: LanguageModelData;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { mutate: deleteLanguage, isPending: isDeleting } = useDeleteLanguage();
  const toggleDialog = () => {
    setIsOpen(!isOpen);
  };

  const onSubmit = () => {
    deleteLanguage(language.id || "", {
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
          <DialogTitle>Delete Language</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Are you sure you want to delete this language?
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
