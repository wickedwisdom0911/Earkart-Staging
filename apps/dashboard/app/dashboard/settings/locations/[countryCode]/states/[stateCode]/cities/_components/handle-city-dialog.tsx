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
import useCreateCity from "@/hooks/locations/cities/use-create-city";
import { CityModelData } from "@/models/city.model";
import { CityModelDataSchema } from "@/models/city.model";
import { StatusEnum } from "@/models/enums";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import useUpdateCity from "@/hooks/locations/cities/use-update-city";
export default function HandleCityDialog({
  trigger,
  city,
}: {
  trigger: ReactNode;
  city?: CityModelData;
}) {
  const isEdit = !!city;
  const [isOpen, setIsOpen] = useState(false);
  const { mutate: createCity, isPending: isCreating } = useCreateCity();
  const { mutate: updateCity, isPending: isUpdating } = useUpdateCity();
  const form = useForm<z.infer<typeof CityModelDataSchema>>({
    resolver: zodResolver(CityModelDataSchema),
    defaultValues: {
      id: city?.id || "",
      name: city?.name || "",
      status: city?.status || StatusEnum.ACTIVE,
      stateId: city?.stateId || "",
    },
  });
  function onSubmit(data: z.infer<typeof CityModelDataSchema>) {
    if (isEdit) {
      updateCity(data, {
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
      createCity(data, {
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
          <DialogTitle>{isEdit ? "Edit City" : "Add City"}</DialogTitle>
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
                name="stateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
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
                {isEdit ? "Update City" : "Add City"}
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
