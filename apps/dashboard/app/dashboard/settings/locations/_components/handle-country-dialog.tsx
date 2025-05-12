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
import useCreateCountry from "@/hooks/locations/use-create-country";
import useUpdateCountry from "@/hooks/locations/use-update-country";
import {
  CountryModelData,
  CountryModelDataSchema,
} from "@/models/country.model";
import { StatusEnum } from "@/models/enums";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
export default function HandleCountryDialog({
  trigger,
  country,
}: {
  trigger: ReactNode;
  country?: CountryModelData;
}) {
  const isEdit = !!country;
  const [isOpen, setIsOpen] = useState(false);
  const { mutate: createCountry, isPending: isCreating } = useCreateCountry();
  const { mutate: updateCountry, isPending: isUpdating } = useUpdateCountry();
  const form = useForm<z.infer<typeof CountryModelDataSchema>>({
    resolver: zodResolver(CountryModelDataSchema),
    defaultValues: {
      id: country?.id || "",
      name: country?.name || "",
      code: country?.code || "",
      status: country?.status || StatusEnum.ACTIVE,
    },
  });
  function onSubmit(data: z.infer<typeof CountryModelDataSchema>) {
    if (isEdit) {
      updateCountry(data, {
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
      createCountry(data, {
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
          <DialogTitle>{isEdit ? "Edit Country" : "Add Country"}</DialogTitle>
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
                {isEdit ? "Update Country" : "Add Country"}
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
