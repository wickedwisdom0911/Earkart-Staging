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
import { StatusEnum } from "@/models/enums";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { DistrictModelDataSchema } from "@/models/district.model";
import { DistrictModelData } from "@/models/district.model";
import useCreateDistrict from "@/hooks/locations/districts/use-create-district";
import useUpdateDistrict from "@/hooks/locations/districts/use-update-district";
export default function HandleDistrictDialog({
  trigger,
  district,
}: {
  trigger: ReactNode;
  district?: DistrictModelData;
}) {
  const isEdit = !!district;
  const [isOpen, setIsOpen] = useState(false);
  const { mutate: createDistrict, isPending: isCreating } = useCreateDistrict();
  const { mutate: updateDistrict, isPending: isUpdating } = useUpdateDistrict();
  const form = useForm<z.infer<typeof DistrictModelDataSchema>>({
    resolver: zodResolver(DistrictModelDataSchema),
    defaultValues: {
      id: district?.id || "",
      name: district?.name || "",
      status: district?.status || StatusEnum.ACTIVE,
      cityId: district?.cityId || "",
    },
  });
  function onSubmit(data: z.infer<typeof DistrictModelDataSchema>) {
    if (isEdit) {
      updateDistrict(data, {
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
      createDistrict(data, {
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
          <DialogTitle>{isEdit ? "Edit District" : "Add District"}</DialogTitle>
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
                name="cityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
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
