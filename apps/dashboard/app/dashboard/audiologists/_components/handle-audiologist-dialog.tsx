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
  AudiologistModelData,
  CreateAudiologistProfile,
  CreateAudiologistProfileSchema,
} from "@/models/audiologist.model";
import { ReactNode, useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { UserModelData } from "@/models/user.model";
import StatusToggle from "@/components/ui/status-toggle";
import { Role, StatusEnum } from "@/models/enums";
import GenderSelect from "@/components/ui/selector/gender-select";
import { DatetimePicker } from "@/components/DateTimePicker";
import CountrySelector from "@/components/ui/selector/country-selector";
import StateSelector from "@/components/ui/selector/state-selector";
import DistrictSelector from "@/components/ui/selector/district-selector";
import CitySelector from "@/components/ui/selector/city-selector";
import PaymentCycleSelector from "@/components/ui/selector/payment-cycle-selector";
import WorkingDaysSelector from "@/components/ui/selector/working-days-selector";
import useCreateAudiologist from "@/hooks/audiologist/use-create-audiologist";
import useUpdateAudiologist from "@/hooks/audiologist/use-update-audiologist";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { InputTags } from "@/components/ui/MultiInput";
import LanguageSelector from "@/components/ui/selector/language-selector";

const steps = [
  {
    title: "User Info",
    description: "Enter the user details for this audiologist.",
  },
  {
    title: "Centre Info",
    description: "Fill in the audiologist's information.",
  },
];

export default function HandleAudiologistDialog({
  audiologist,
  audiologistUser,
  trigger,
}: {
  audiologist?: AudiologistModelData;
  audiologistUser?: UserModelData;
  trigger: ReactNode;
}) {
  const isEdit = !!audiologist;
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const dialogOpenRef = useRef(false);

  // Cascading selector state
  const [countryId, setCountryId] = useState<string | null>(null);
  const [stateId, setStateId] = useState<string | null>(null);
  const [districtId, setDistrictId] = useState<string | null>(null);
  const [isPopulatingForEdit, setIsPopulatingForEdit] = useState(false);

  // Store initial values for edit mode
  const [initialCountryId, setInitialCountryId] = useState<string | null>(null);
  const [initialStateId, setInitialStateId] = useState<string | null>(null);
  const [initialDistrictId, setInitialDistrictId] = useState<string | null>(
    null
  );
  const [initialCityId, setInitialCityId] = useState<string | null>(null);

  // Update ref when dialog opens/closes
  useEffect(() => {
    dialogOpenRef.current = isOpen;
  }, [isOpen]);

  // Extract initial values when audiologist data is available
  useEffect(() => {
    if (isEdit && audiologist?.city) {
      const city = audiologist.city;
      const district = city.district;
      const state = district?.state;
      const country = state?.country;

      if (country?.id && state?.id && district?.id && city.id) {
        setInitialCountryId(country.id);
        setInitialStateId(state.id);
        setInitialDistrictId(district.id);
        setInitialCityId(city.id);

        // Also set the current values for the selectors
        setCountryId(country.id);
        setStateId(state.id);
        setDistrictId(district.id);
      }
    }
  }, [isEdit, audiologist]);

  const form = useForm<CreateAudiologistProfile>({
    resolver: zodResolver(CreateAudiologistProfileSchema),
    defaultValues: {
      user: {
        name: audiologistUser?.name,
        email: audiologistUser?.email,
        password: audiologistUser?.password,
        status: audiologistUser?.status || StatusEnum.ACTIVE,
        gender: audiologistUser?.gender,
        role: audiologistUser?.role || Role.AUDIOLOGIST,
        dob: audiologistUser?.dob,
      },

      audiologist: {
        ...audiologist,
        languages: audiologist?.languages?.map((lang) => lang.id) || [],
        qualifications: audiologist?.qualifications || [],
        cityId: audiologist?.city?.id || "",
      },
    },
  });

  // Set cityId in form when initial values are available
  useEffect(() => {
    if (isEdit && initialCityId) {
      form.setValue("audiologist.cityId", initialCityId);
    }
  }, [isEdit, initialCityId, form]);

  const {
    mutate: createCentre,
    isPending: isCreating,
    isError: isCreateError,
  } = useCreateAudiologist();
  const {
    mutate: updateAudiologist,
    isPending: isUpdating,
    isError: isUpdateError,
  } = useUpdateAudiologist();
  // Reset state/city/district when parent changes
  useEffect(() => {
    if (!isPopulatingForEdit) {
      setStateId("");
      setDistrictId("");
      form.setValue("audiologist.cityId", "");
    }
  }, [countryId, form, isPopulatingForEdit]);
  useEffect(() => {
    if (!isPopulatingForEdit) {
      setDistrictId("");
      form.setValue("audiologist.cityId", "");
    }
  }, [stateId, form, isPopulatingForEdit]);
  useEffect(() => {
    if (!isPopulatingForEdit) {
      form.setValue("audiologist.cityId", "");
    }
  }, [districtId, form, isPopulatingForEdit]);

  const toggleDialog = () => {
    setIsOpen(!isOpen);
    setStep(0);
    // Reset location selectors when dialog closes
    if (isOpen) {
      setCountryId(null);
      setStateId(null);
      setDistrictId(null);
      setIsPopulatingForEdit(false);
      // Reset initial values
      setInitialCountryId(null);
      setInitialStateId(null);
      setInitialDistrictId(null);
      setInitialCityId(null);
    }
  };
  const handleSubmit = (data: CreateAudiologistProfile) => {
    if (isEdit) {
      if (data.audiologist.cityId === "") {
        data.audiologist.cityId = data.audiologist.city?.id || "";
      }
      updateAudiologist(
        {
          ...data,
          audiologist: { ...data.audiologist, id: audiologist?.id },
          user: { ...data.user, id: audiologistUser?.id },
        },
        {
          onSuccess: (response) => {
            if (response.success) {
              toast.success("Audiologist updated successfully");
            } else {
              toast.error("Failed to update audiologist " + response.message);
            }
          },
          onError: (error) => {
            toast.error("Failed to update audiologist " + error.message);
          },
        }
      );
    } else {
      createCentre(data, {
        onSuccess: (response) => {
          if (response.success) {
            toast.success("Audiologist created successfully");
          } else {
            toast.error("Failed to create audiologist " + response.message);
          }
        },
        onError: (error) => {
          toast.error("Failed to create audiologist " + error.message);
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
        name="user.role"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Role</FormLabel>
            <FormControl>
              <select
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
                className="w-full border rounded px-3 py-2 bg-white dark:bg-neutral-900"
              >
                <option value={Role.AUDIOLOGIST}>Audiologist</option>
                <option value={Role.HEAD_AUDIOLOGIST}>Head Audiologist</option>
              </select>
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
              <StatusToggle value={field.value} onChange={field.onChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  // Step 2: Centre fields (customize as needed)
  const renderAudiologistFields = () => (
    <div className="flex flex-col overflow-y-scroll p-2 gap-6">
      {/* Cascading Selectors Grid */}
      <div className="grid grid-cols-2 gap-4">
        <CountrySelector
          value={countryId}
          onChange={setCountryId}
          initialValue={isEdit ? initialCountryId : countryId}
        />
        {(countryId || (isEdit && initialCountryId)) && (
          <StateSelector
            value={stateId}
            onChange={setStateId}
            countryId={countryId || initialCountryId || ""}
            initialValue={isEdit ? initialStateId : stateId}
          />
        )}
        {(stateId || (isEdit && initialStateId)) && (
          <DistrictSelector
            value={districtId}
            onChange={setDistrictId}
            stateId={stateId || initialStateId || ""}
            initialValue={isEdit ? initialDistrictId : districtId}
          />
        )}
        {(districtId || (isEdit && initialDistrictId)) && (
          <FormField
            control={form.control}
            name="audiologist.cityId"
            render={({ field }) => (
              <CitySelector
                value={field.value}
                onChange={field.onChange}
                districtId={districtId || initialDistrictId || ""}
                initialValue={isEdit ? initialCityId : field.value}
              />
            )}
          />
        )}
      </div>

      <FormField
        control={form.control}
        name="audiologist.address"
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
        name="audiologist.pincode"
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
        name="audiologist.contactNumber"
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
        name="audiologist.rciNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>RCI Number</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter RCI Number" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="audiologist.grade"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Grade</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter Grade" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="audiologist.qualifications"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Qualifications</FormLabel>
            <FormControl>
              <InputTags {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="audiologist.languages"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Languages</FormLabel>
            <FormControl>
              <LanguageSelector {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="audiologist.paymentCycle"
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
        name="audiologist.workingDays"
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
        name="audiologist.agreementSignDate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Agreement Sign Date</FormLabel>
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
        name="audiologist.reportingDate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Reporting Date</FormLabel>
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
        name="audiologist.workingTimeStart"
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
        name="audiologist.workingTimeEnd"
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
        name="audiologist.breakTimeStart"
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
        name="audiologist.breakTimeEnd"
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
            {isEdit ? "Edit Audiologist" : "Add Audiologist"}
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
              {step === 1 && renderAudiologistFields()}
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
                      ? "Update Audiologist"
                      : "Add Audiologist"}
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
