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
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  CentreModelData,
  CreateCenterProfile,
  CreateCenterProfileSchema,
} from "@/models/centre.model";
import { ReactNode, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UserModelData } from "@/models/user.model";
import StatusToggle from "@/components/ui/status-toggle";
import { Role, StatusEnum } from "@/models/enums";
import GenderSelect from "@/components/ui/selector/gender-select";
import { DatetimePicker } from "@/components/DateTimePicker";
import CountrySelector from "@/components/ui/selector/country-selector";
import StateSelector from "@/components/ui/selector/state-selector";
import CitySelector from "@/components/ui/selector/city-selector";
import DistrictSelector from "@/components/ui/selector/district-selector";
import PaymentCycleSelector from "@/components/ui/selector/payment-cycle-selector";
import WorkingDaysSelector from "@/components/ui/selector/working-days-selector";

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

  // Cascading selector state
  const [countryId, setCountryId] = useState<string | null>(null);
  const [stateId, setStateId] = useState<string | null>(null);
  const [cityId, setCityId] = useState<string | null>(null);

  const form = useForm<CreateCenterProfile>({
    resolver: zodResolver(CreateCenterProfileSchema),
    defaultValues: {
      user: {
        name: centreUser?.name,
        email: centreUser?.email,
        password: centreUser?.password,
        status: centreUser?.status || StatusEnum.ACTIVE,
        gender: centreUser?.gender,
        role: Role.CENTRE,
        dob: centreUser?.dob,
      },
      centre: centre,
    },
  });

  // Reset state/city/district when parent changes
  useEffect(() => {
    setStateId("");
    setCityId("");
    form.setValue("centre.districtId", "");
  }, [countryId, form]);
  useEffect(() => {
    setCityId("");
    form.setValue("centre.districtId", "");
  }, [stateId, form]);
  useEffect(() => {
    form.setValue("centre.districtId", "");
  }, [cityId, form]);

  const toggleDialog = () => {
    setIsOpen(!isOpen);
    setStep(0);
  };
  const handleSubmit = (data: CreateCenterProfile) => {
    console.log("data submitted");
    console.log(data);
  };
  // Stepper UI
  const Stepper = () => (
    <div className="flex items-center justify-center  mb-4">
      {steps.map((s, idx) => (
        <div key={s.title} className="flex items-center">
          <div
            className={[
              "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300",
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
            <FormMessage />
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
            <FormMessage />
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
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="user.dob"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Date of Birth</FormLabel>
            <FormControl>
              <DatetimePicker
                value={field.value ? new Date(field.value) : undefined}
                onChange={(date) =>
                  field.onChange(date ? date.toISOString() : "")
                }
                format={[[], ["hours", "minutes", "seconds", "am/pm"]]}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="user.gender"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Gender</FormLabel>
            <FormControl>
              <GenderSelect {...field} />
            </FormControl>
            <FormMessage />
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
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  // Step 2: Centre fields (customize as needed)
  const renderCentreFields = () => (
    <div className="flex flex-col overflow-y-scroll p-2 gap-6">
      {/* Cascading Selectors Grid */}
      <div className="grid grid-cols-2 gap-4">
        <CountrySelector value={countryId} onChange={setCountryId} />
        {countryId && (
          <StateSelector
            value={stateId}
            onChange={setStateId}
            countryId={countryId}
            initialValue={stateId}
          />
        )}
        {stateId && (
          <CitySelector
            value={cityId}
            onChange={setCityId}
            stateId={stateId}
            initialValue={cityId}
          />
        )}
        {cityId && (
          <FormField
            control={form.control}
            name="centre.districtId"
            render={({ field }) => (
              <DistrictSelector
                value={field.value}
                onChange={field.onChange}
                cityId={cityId}
                initialValue={field.value}
              />
            )}
          />
        )}
      </div>
      {/* Other centre fields */}
      <FormField
        control={form.control}
        name="centre.code"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Centre Code</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter centre code" />
            </FormControl>
            <FormMessage />
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
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="centre.pincode"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Pincode</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter pincode" type="number" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="centre.entName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Enter ENT Name</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter ENT Name" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="centre.contactNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Contact Number</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="Enter contact number"
                type="number"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="centre.assistantName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Assistant Name</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter assistant name" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="centre.assistantContactNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Assistant Contact Number</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="Enter assistant contact number"
                type="number"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="centre.paymentCycle"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Payment Cycle</FormLabel>
            <FormControl>
              <PaymentCycleSelector {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="centre.workingDays"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Working Days</FormLabel>
            <FormControl>
              <WorkingDaysSelector {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="centre.workingTimeStart"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Working Time Start</FormLabel>
            <FormControl>
              <DatetimePicker
                value={field.value ? new Date(field.value) : undefined}
                onChange={(date) =>
                  field.onChange(date ? date.toISOString() : "")
                }
                format={[[], ["hours", "minutes", "seconds", "am/pm"]]}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="centre.workingTimeEnd"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Working Time End</FormLabel>
            <FormControl>
              <DatetimePicker
                value={field.value ? new Date(field.value) : undefined}
                onChange={(date) =>
                  field.onChange(date ? date.toISOString() : "")
                }
                format={[[], ["hours", "minutes", "seconds", "am/pm"]]}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="centre.breakTimeStart"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Break Time Start</FormLabel>
            <FormControl>
              <DatetimePicker
                value={field.value ? new Date(field.value) : undefined}
                onChange={(date) =>
                  field.onChange(date ? date.toISOString() : "")
                }
                format={[[], ["hours", "minutes", "seconds", "am/pm"]]}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="centre.breakTimeEnd"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Break Time End</FormLabel>
            <FormControl>
              <DatetimePicker
                value={field.value ? new Date(field.value) : undefined}
                onChange={(date) =>
                  field.onChange(date ? date.toISOString() : "")
                }
                format={[[], ["hours", "minutes", "seconds", "am/pm"]]}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={toggleDialog}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-fit flex flex-col h-[95%] w-full p-6 bg-gray-50 rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold mb-2">
            {isEdit ? "Edit Centre" : "Add Centre"}
          </DialogTitle>
          <div className="text-gray-500 mb-6">{steps[step].description}</div>
        </DialogHeader>
        <Stepper />
        <Form {...form}>
          <form
            className="flex flex-1  flex-col h-full"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <div className="bg-white  flex-1 rounded-xl p-4 shadow flex flex-col gap-8 transition-all duration-300 max-h-[80%] overflow-y-auto">
              {step === 0 && renderUserFields()}
              {step === 1 && renderCentreFields()}
            </div>
            <div className="flex-1 flex  gap-4 justify-center mt-8">
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
      </DialogContent>
    </Dialog>
  );
}
