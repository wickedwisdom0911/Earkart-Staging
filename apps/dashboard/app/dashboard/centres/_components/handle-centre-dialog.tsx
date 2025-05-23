"use client";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  CentreModelData,
  CreateCenterProfile,
  CreateCenterProfileSchema,
} from "@/models/centre.model";
import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { UserModelData } from "@/models/user.model";
import StatusToggle from "@/components/ui/status-toggle";
import { StatusEnum } from "@/models/enums";

const steps = [
  {
    title: "User Info",
    description: "Enter the user details for this centre.",
  },
  {
    title: "Centre Info",
    description: "Fill in the centre's information.",
  },
];

export default function HandleCentreDialog({
  centre,
  centreUser,
  trigger,
}: {
  centre?: CentreModelData;
  centreUser?: UserModelData;
  trigger: ReactNode;
}) {
  const isEdit = !!centre;
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  const form = useForm<CreateCenterProfile>({
    resolver: zodResolver(CreateCenterProfileSchema),
    defaultValues: {
      user: {
        name: centreUser?.name,
        email: centreUser?.email,
        password: centreUser?.password,
        status: centreUser?.status || StatusEnum.ACTIVE,
        gender: centreUser?.gender,
        dob: centreUser?.dob,
      },
      centre: centre,
    },
  });

  const toggleDialog = () => {
    setIsOpen(!isOpen);
    setStep(0);
  };
  const handleSubmit = (data: CreateCenterProfile) => {
    console.log(data);
  };
  // Stepper UI
  const Stepper = () => (
    <div className="flex items-center justify-center mb-8">
      {steps.map((s, idx) => (
        <div key={s.title} className="flex items-center">
          <div
            className={[
              "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300",
              step === idx
                ? "bg-primary-500 text-white border-primary-500 shadow-lg"
                : step > idx
                  ? "bg-primary-700 text-white border-primary-700"
                  : "bg-gray-100 text-gray-400 border-gray-300",
            ].join(" ")}
          >
            {idx + 1}
          </div>
          {idx < steps.length - 1 && (
            <div className="w-12 h-1 bg-gray-300 mx-2 rounded-full" />
          )}
        </div>
      ))}
    </div>
  );

  // Step 1: User fields (customize as needed)
  const renderUserFields = () => (
    <div className="flex flex-col overflow-y-scroll p-2 gap-6">
      <FormField
        control={form.control}
        name="user.name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter user name" />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="user.email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter user email" />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="user.password"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Password</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter user password" />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="user.status"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <StatusToggle {...field} />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );

  // Step 2: Centre fields (customize as needed)
  const renderCentreFields = () => (
    <div className="flex flex-col overflow-y-scroll p-2 gap-6">
      <FormField
        control={form.control}
        name="centre.code"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Centre Code</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter centre code" />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="centre.address"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Address</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter address" />
            </FormControl>
          </FormItem>
        )}
      />
      {/* Add more centre fields as needed */}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={toggleDialog}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-fit  h-[90%] w-full p-0 bg-gray-50 rounded-2xl shadow-2xl">
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold mb-2">
              {isEdit ? "Edit Centre" : "Add Centre"}
            </DialogTitle>
            <div className="text-gray-500 mb-6">{steps[step].description}</div>
          </DialogHeader>
          <Stepper />
          <Form {...form}>
            <form
              className="space-y-10"
              onSubmit={form.handleSubmit(handleSubmit)}
            >
              <div className="bg-white rounded-xl p-4 shadow flex flex-col gap-8 transition-all duration-300 min-h-[220px]">
                {step === 0 && renderUserFields()}
                {step === 1 && renderCentreFields()}
              </div>
              <div className="flex gap-4 justify-end mt-8">
                {step > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="px-8 py-3 text-lg"
                    onClick={() => setStep(step - 1)}
                  >
                    Back
                  </Button>
                )}
                {step < steps.length - 1 && (
                  <Button
                    type="button"
                    className="px-8 py-3 text-lg bg-primary-500 hover:bg-black cursor-pointer text-white"
                    onClick={() => setStep(step + 1)}
                  >
                    Next
                  </Button>
                )}
                {step === steps.length - 1 && (
                  <Button
                    type="submit"
                    className="px-8 py-3 text-lg bg-primary-500 hover:bg-black cursor-pointer text-white"
                  >
                    {isEdit ? "Update Centre" : "Add Centre"}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="px-8 py-3 text-lg"
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
