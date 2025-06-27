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
import { ReactNode, useState, useEffect, useMemo, useCallback } from "react";
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
import useCreateCentre from "@/hooks/centre/use-create-centre";
import useUpdateCentre from "@/hooks/centre/use-update-centre";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Custom hook for location management
const useLocationState = (isEdit: boolean, centre?: CentreModelData) => {
  const [locationState, setLocationState] = useState({
    countryId: null as string | null,
    stateId: null as string | null,
    districtId: null as string | null,
  });

  // Derived location data using useMemo
  const locationData = useMemo(() => {
    if (!isEdit || !centre?.city) return null;

    const city = centre.city;
    const district = city.district;
    const state = district?.state;
    const country = state?.country;

    if (!country?.id || !state?.id || !district?.id || !city.id) return null;

    return {
      countryId: country.id,
      stateId: state.id,
      districtId: district.id,
      cityId: city.id,
    };
  }, [isEdit, centre]);

  // Initialize location state when data is available
  useEffect(() => {
    if (locationData) {
      setLocationState({
        countryId: locationData.countryId,
        stateId: locationData.stateId,
        districtId: locationData.districtId,
      });
    }
  }, [locationData]);

  // Location change handlers
  const handleCountryChange = useCallback((countryId: string | null) => {
    setLocationState({
      countryId,
      stateId: null,
      districtId: null,
    });
  }, []);

  const handleStateChange = useCallback((stateId: string | null) => {
    setLocationState((prev) => ({
      ...prev,
      stateId,
      districtId: null,
    }));
  }, []);

  const handleDistrictChange = useCallback((districtId: string | null) => {
    setLocationState((prev) => ({
      ...prev,
      districtId,
    }));
  }, []);

  const resetLocation = useCallback(() => {
    setLocationState({
      countryId: null,
      stateId: null,
      districtId: null,
    });
  }, []);

  return {
    locationState,
    locationData,
    handleCountryChange,
    handleStateChange,
    handleDistrictChange,
    resetLocation,
  };
};

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

const CENTRE_CODE_PREFIX = "ERKRTCNTR-";

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

  const {
    locationState,
    locationData,
    handleCountryChange,
    handleStateChange,
    handleDistrictChange,
    resetLocation,
  } = useLocationState(isEdit, centre);

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
      centre: {
        ...centre,
        code:
          centre?.code && centre?.code.startsWith(CENTRE_CODE_PREFIX)
            ? centre.code.slice(CENTRE_CODE_PREFIX.length)
            : "",
        cityId: centre?.city?.id || "",
      },
    },
  });

  const {
    mutate: createCentre,
    isPending: isCreating,
    isError: isCreateError,
  } = useCreateCentre();
  const {
    mutate: updateCentre,
    isPending: isUpdating,
    isError: isUpdateError,
  } = useUpdateCentre();

  // Set cityId in form when initial values are available
  useEffect(() => {
    if (isEdit && locationData?.cityId) {
      form.setValue("centre.cityId", locationData.cityId);
    }
  }, [isEdit, locationData, form]);

  const toggleDialog = () => {
    setIsOpen(!isOpen);
    setStep(0);
    // Reset location selectors when dialog closes
    if (isOpen) {
      resetLocation();
    }
  };
  const handleSubmit = (data: CreateCenterProfile) => {
    // Combine prefix and suffix for centre code
    const fullCode = CENTRE_CODE_PREFIX + (data.centre.code || "");
    data.centre.code = fullCode;
    if (isEdit) {
      if (data.centre.cityId === "") {
        data.centre.cityId = data.centre.city?.id || "";
      }
      updateCentre(
        {
          ...data,
          centre: { ...data.centre, id: centre?.id },
          user: { ...data.user, id: centreUser?.id },
        },
        {
          onSuccess: (response) => {
            if (response.success) {
              toast.success("Centre updated successfully");
            } else {
              toast.error("Failed to update centre " + response.message);
            }
          },
          onError: (error) => {
            toast.error("Failed to update centre " + error.message);
          },
        }
      );
    } else {
      createCentre(data, {
        onSuccess: (response) => {
          if (response.success) {
            toast.success("Centre created successfully");
          } else {
            toast.error("Failed to create centre " + response.message);
          }
        },
        onError: (error) => {
          toast.error("Failed to create centre " + error.message);
        },
      });
    }
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
            <FormLabel>Clinic Name</FormLabel>
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
            <FormLabel>Date of Enrollment</FormLabel>
            <FormControl>
              <DatetimePicker
                value={field.value ? new Date(field.value) : undefined}
                onChange={(date) =>
                  field.onChange(date ? date.toISOString() : "")
                }
                format={[["days", "months", "years"], []]}
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
        <CountrySelector
          value={locationState.countryId}
          onChange={handleCountryChange}
          initialValue={
            isEdit ? locationData?.countryId : locationState.countryId
          }
        />
        {(locationState.countryId || (isEdit && locationData?.countryId)) && (
          <StateSelector
            value={locationState.stateId}
            onChange={handleStateChange}
            countryId={locationState.countryId || locationData?.countryId || ""}
            initialValue={
              isEdit ? locationData?.stateId : locationState.stateId
            }
          />
        )}
        {(locationState.stateId || (isEdit && locationData?.stateId)) && (
          <DistrictSelector
            value={locationState.districtId}
            onChange={handleDistrictChange}
            stateId={locationState.stateId || locationData?.stateId || ""}
            initialValue={
              isEdit ? locationData?.districtId : locationState.districtId
            }
          />
        )}
        {(locationState.districtId || (isEdit && locationData?.districtId)) && (
          <FormField
            control={form.control}
            name="centre.cityId"
            render={({ field }) => (
              <CitySelector
                value={field.value}
                onChange={field.onChange}
                districtId={
                  locationState.districtId || locationData?.districtId || ""
                }
                initialValue={isEdit ? locationData?.cityId : field.value}
              />
            )}
          />
        )}
      </div>
      {/* Other centre fields */}

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
                  disabled={isCreating || isUpdating}
                >
                  Next
                </Button>
              )}
              {step === steps.length - 1 && (
                <Button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="px-8 py-3 text-lg bg-primary-500 hover:bg-black cursor-pointer text-white"
                >
                  {isCreateError || isUpdateError
                    ? "Retry"
                    : isEdit
                      ? "Update Centre"
                      : "Add Centre"}
                  {isCreating ||
                    (isUpdating && <Loader2 className="w-4 h-4 ml-2" />)}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                className="px-8 py-3 text-lg"
                disabled={isCreating || isUpdating}
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
