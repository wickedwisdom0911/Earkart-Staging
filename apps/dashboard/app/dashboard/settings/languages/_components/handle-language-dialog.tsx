"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import StatusToggle from "@/components/ui/status-toggle";
import useCreateLanguage from "@/hooks/languages/use-create-language";
import useUpdateLanguage from "@/hooks/languages/use-update-language";
import {
  LanguageModelData,
  LanguageModelDataSchema,
} from "@/models/language.model";
import { StatusEnum } from "@/models/enums";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
export default function HandleLanguageDialog({
  trigger,
  language,
}: {
  trigger: ReactNode;
  language?: LanguageModelData;
}) {
  const isEdit = !!language;
  const [isOpen, setIsOpen] = useState(false);
  const { mutate: createLanguage, isPending: isCreating } = useCreateLanguage();
  const { mutate: updateLanguage, isPending: isUpdating } = useUpdateLanguage();
  const form = useForm<z.infer<typeof LanguageModelDataSchema>>({
    resolver: zodResolver(LanguageModelDataSchema),
    defaultValues: {
      id: language?.id || "",
      name: language?.name || "",
      code: language?.code || "",
      status: language?.status || StatusEnum.ACTIVE,
    },
  });
  function onSubmit(data: z.infer<typeof LanguageModelDataSchema>) {
    if (isEdit) {
      updateLanguage(data, {
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
    } else {
      createLanguage(data, {
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
  }
  const toggleDialog = () => {
    setIsOpen(!isOpen);
  };
  return (
    <Dialog open={isOpen} onOpenChange={toggleDialog}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="flex flex-col gap-8">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Language" : "Add Language"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <StatusToggle
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex gap-2 w-full">
              <Button
                type="submit"
                className="w-1/2 cursor-pointer"
                onClick={() => {
                  form.handleSubmit(onSubmit);
                }}
                disabled={isCreating || isUpdating}
              >
                {isEdit ? "Update Language" : "Add Language"}
                {isCreating ||
                  (isUpdating && <Loader2 className="w-4 h-4 ml-2" />)}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-1/2 cursor-pointer"
                onClick={() => {
                  form.reset();
                  toggleDialog();
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
