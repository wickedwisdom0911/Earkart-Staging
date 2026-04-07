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
import { useForm, type Resolver } from "react-hook-form";
import {
  AudiologistModelData,
  CreateAudiologistProfile,
  CreateAudiologistProfileSchema,
} from "@/models/audiologist.model";
import { ReactNode, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import type { User } from "@/models/user.model";
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
import StatusToggle from "@/components/ui/status-toggle";
import { Switch } from "@/components/ui/switch";

/** Two-column grid — matches profile “Personal / Work details” layout */
function TwoCol({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">{children}</div>;
}

/** White card block like audiologist profile sections */
function FormCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-[15px] font-semibold text-gray-900">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

/** Label style aligned with profile read-only fields */
function FL({ children }: { children: React.ReactNode }) {
  return (
    <FormLabel className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
      {children}
    </FormLabel>
  );
}

const inputClass =
  "h-9 rounded-md border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-sky-400/35";

function normalizeDob(d: unknown): string | undefined {
  if (d == null) return undefined;
  if (d instanceof Date) return d.toISOString();
  if (typeof d === "string") return d;
  return undefined;
}

export default function HandleAudiologistDialog({
  audiologist,
  audiologistUser,
  trigger,
}: {
  audiologist?: AudiologistModelData;
  audiologistUser?: User;
  trigger: ReactNode;
}) {
  const isEdit = !!audiologist;
  const [isOpen, setIsOpen] = useState(false);

  // ── Location cascade state ────────────────────────────────────────────────
  const [countryId, setCountryId] = useState<string | null>(null);
  const [stateId, setStateId] = useState<string | null>(null);
  const [districtId, setDistrictId] = useState<string | null>(null);
  const [isPopulatingForEdit, setIsPopulatingForEdit] = useState(false);

  const [initialCountryId, setInitialCountryId] = useState<string | null>(null);
  const [initialStateId, setInitialStateId] = useState<string | null>(null);
  const [initialDistrictId, setInitialDistrictId] = useState<string | null>(null);
  const [initialCityId, setInitialCityId] = useState<string | null>(null);

  // Hydrate for edit mode
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
        setCountryId(country.id);
        setStateId(state.id);
        setDistrictId(district.id);
        setIsPopulatingForEdit(true);
      }
    }
  }, [isEdit, audiologist]);

  // After edit location is hydrated, allow cascade resets on user changes
  useEffect(() => {
    if (!isEdit || !initialCityId || !isPopulatingForEdit) return;
    const t = window.setTimeout(() => setIsPopulatingForEdit(false), 400);
    return () => window.clearTimeout(t);
  }, [isEdit, initialCityId, isPopulatingForEdit]);

  // ── Form ──────────────────────────────────────────────────────────────────
  const form = useForm<CreateAudiologistProfile>({
    resolver: zodResolver(
      CreateAudiologistProfileSchema
    ) as Resolver<CreateAudiologistProfile>,
    defaultValues: {
      user: {
        name: audiologistUser?.name,
        email: audiologistUser?.email,
        password: audiologistUser?.password,
        status: audiologistUser?.status || StatusEnum.ACTIVE,
        gender: audiologistUser?.gender,
        role: audiologistUser?.role || Role.AUDIOLOGIST,
        dob: normalizeDob(audiologistUser?.dob),
      },
      audiologist: {
        ...audiologist,
        languages: audiologist?.languages?.map((l) => l.id) || [],
        qualifications: audiologist?.qualifications || [],
        cityId: audiologist?.city?.id || "",
        isInHouse: audiologist?.isInHouse || false,
      },
    },
  });

  useEffect(() => {
    if (isEdit && initialCityId) form.setValue("audiologist.cityId", initialCityId);
  }, [isEdit, initialCityId, form]);

  // Cascade resets
  useEffect(() => {
    if (!isPopulatingForEdit) {
      setStateId(null);
      setDistrictId(null);
      form.setValue("audiologist.cityId", "");
    }
  }, [countryId, form, isPopulatingForEdit]);

  useEffect(() => {
    if (!isPopulatingForEdit) {
      setDistrictId(null);
      form.setValue("audiologist.cityId", "");
    }
  }, [stateId, form, isPopulatingForEdit]);

  useEffect(() => {
    if (!isPopulatingForEdit) form.setValue("audiologist.cityId", "");
  }, [districtId, form, isPopulatingForEdit]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const { mutate: createAudiologist, isPending: isCreating, isError: isCreateError } =
    useCreateAudiologist();
  const { mutate: updateAudiologist, isPending: isUpdating, isError: isUpdateError } =
    useUpdateAudiologist();
  const isPending = isCreating || isUpdating;

  // ── Dialog helpers ────────────────────────────────────────────────────────
  const resetLocation = () => {
    setCountryId(null);
    setStateId(null);
    setDistrictId(null);
    setIsPopulatingForEdit(false);
    setInitialCountryId(null);
    setInitialStateId(null);
    setInitialDistrictId(null);
    setInitialCityId(null);
  };

  const closeDialog = () => {
    setIsOpen(false);
    resetLocation();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) closeDialog();
    else setIsOpen(true);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = (data: CreateAudiologistProfile) => {
    if (isEdit) {
      if (!data.audiologist.cityId) {
        data.audiologist.cityId = audiologist?.city?.id || data.audiologist.city?.id || "";
      }
      updateAudiologist(
        {
          ...data,
          audiologist: { ...data.audiologist, id: audiologist?.id },
          user: { ...data.user, id: audiologistUser?.id },
        },
        {
          onSuccess: (res) => {
            if (res.success) {
              toast.success("Audiologist updated");
              form.reset();
              closeDialog();
            } else toast.error("Update failed: " + res.message);
          },
          onError: (err) => toast.error("Update failed: " + err.message),
        }
      );
    } else {
      createAudiologist(data, {
        onSuccess: (res) => {
          if (res.success) {
            toast.success("Audiologist created");
            form.reset();
            closeDialog();
          } else toast.error("Create failed: " + res.message);
        },
        onError: (err) => toast.error("Create failed: " + err.message),
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="flex w-full max-h-[92vh] flex-col gap-0 overflow-hidden rounded-2xl border-0 bg-[#F3F4F6] p-0 shadow-2xl sm:!max-w-4xl">
        <div className="shrink-0 border-b border-gray-200 bg-white px-6 pb-4 pt-5">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              {isEdit ? "Edit Audiologist" : "Add Audiologist"}
            </DialogTitle>
            <p className="mt-0.5 text-sm text-gray-500">
              {isEdit ? "Update the audiologist details below." : "Enter details for the new audiologist."}
            </p>
          </DialogHeader>
        </div>

        <Form {...form}>
          <form
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
            onSubmit={form.handleSubmit(handleSubmit, (errors) => {
              const first = Object.values(errors)[0] as { message?: string } | undefined;
              toast.error(first?.message || "Please fill in all required fields");
            })}
          >
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
              {/* Personal Information */}
              <FormCard title="Personal Information">
              <FormField
                control={form.control}
                name="user.name"
                render={({ field }) => (
                  <FormItem>
                    <FL>Name</FL>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter your full name"
                        className={inputClass}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <TwoCol>
                <FormField
                  control={form.control}
                  name="user.email"
                  render={({ field }) => (
                    <FormItem>
                      <FL>Email</FL>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter email"
                          className={inputClass}
                        />
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
                      <FL>Password</FL>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="123456789"
                          className={inputClass}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TwoCol>

              <FormField
                control={form.control}
                name="user.dob"
                render={({ field }) => (
                  <FormItem>
                    <FL>Date of Birth</FL>
                    <FormControl>
                      <DatetimePicker
                        value={field.value ? new Date(field.value) : undefined}
                        onChange={(d) => field.onChange(d ? d.toISOString() : "")}
                        format={[["days", "months", "years"], []]}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <TwoCol>
                <FormField
                  control={form.control}
                  name="user.role"
                  render={({ field }) => (
                    <FormItem>
                      <FL>Role</FL>
                      <FormControl>
                        <select
                          {...field}
                          className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-400/35"
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
                  name="user.gender"
                  render={({ field }) => (
                    <FormItem>
                      <FL>Gender</FL>
                      <FormControl>
                        <GenderSelect {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TwoCol>

              <FormField
                control={form.control}
                name="user.status"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                    <FL>Status</FL>
                    <FormControl>
                      <StatusToggle value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              </FormCard>

              <FormCard title="Location">
              <CountrySelector
                value={countryId}
                onChange={(v) => {
                  setIsPopulatingForEdit(false);
                  setCountryId(v);
                }}
                initialValue={isEdit ? initialCountryId : countryId}
              />

              {(countryId || (isEdit && initialCountryId)) && (
                <StateSelector
                  value={stateId}
                  onChange={(v) => {
                    setIsPopulatingForEdit(false);
                    setStateId(v);
                  }}
                  countryId={countryId || initialCountryId || ""}
                  initialValue={isEdit ? initialStateId : stateId}
                />
              )}

              {(stateId || (isEdit && initialStateId)) && (
                <DistrictSelector
                  value={districtId}
                  onChange={(v) => {
                    setIsPopulatingForEdit(false);
                    setDistrictId(v);
                  }}
                  stateId={stateId || initialStateId || ""}
                  initialValue={isEdit ? initialDistrictId : districtId}
                />
              )}

              {(districtId || (isEdit && initialDistrictId)) && (
                <FormField
                  control={form.control}
                  name="audiologist.cityId"
                  render={({ field }) => (
                    <FormItem>
                      <FL>City</FL>
                      <FormControl>
                        <CitySelector
                          value={field.value}
                          onChange={field.onChange}
                          districtId={districtId || initialDistrictId || ""}
                          initialValue={isEdit ? initialCityId : field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="audiologist.isInHouse"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                    <FL>In-house audiologist</FL>
                    <FormControl>
                      <Switch
                        className="cursor-pointer"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              </FormCard>

              <FormCard title="Work details">
              <TwoCol>
                <FormField
                  control={form.control}
                  name="audiologist.address"
                  render={({ field }) => (
                    <FormItem>
                      <FL>Address</FL>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter Address"
                          className={inputClass}
                        />
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
                      <FL>Pincode</FL>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter Pincode"
                          inputMode="numeric"
                          className={inputClass}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TwoCol>

              <TwoCol>
                <FormField
                  control={form.control}
                  name="audiologist.contactNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FL>Contact Number</FL>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g. 9876543210"
                          className={inputClass}
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
                      <FL>RCI Number</FL>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter RCI number"
                          className={inputClass}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TwoCol>

              <TwoCol>
                <FormField
                  control={form.control}
                  name="audiologist.grade"
                  render={({ field }) => (
                    <FormItem>
                      <FL>Grade</FL>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter grade"
                          className={inputClass}
                        />
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
                      <FL>Qualifications</FL>
                      <FormControl>
                        <InputTags {...field} placeholder="Enter" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TwoCol>

              <TwoCol>
                <FormField
                  control={form.control}
                  name="audiologist.languages"
                  render={({ field }) => (
                    <FormItem>
                      <FL>Languages</FL>
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
                      <FL>Payment Cycle</FL>
                      <FormControl>
                        <PaymentCycleSelector {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TwoCol>

              </FormCard>

              <FormCard title="Schedule & availability">
              <FormField
                control={form.control}
                name="audiologist.workingDays"
                render={({ field }) => (
                  <FormItem>
                    <FL>Working Days</FL>
                    <FormControl>
                      <WorkingDaysSelector {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <TwoCol>
                <FormField
                  control={form.control}
                  name="audiologist.agreementSignDate"
                  render={({ field }) => (
                    <FormItem>
                      <FL>Agreement Sign Date</FL>
                      <FormControl>
                        <DatetimePicker
                          value={field.value ? new Date(field.value) : undefined}
                          onChange={(d) => field.onChange(d ? d.toISOString() : "")}
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
                      <FL>Reporting Date</FL>
                      <FormControl>
                        <DatetimePicker
                          value={field.value ? new Date(field.value) : undefined}
                          onChange={(d) => field.onChange(d ? d.toISOString() : "")}
                          format={[["days", "months", "years"], []]}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TwoCol>

              <TwoCol>
                <FormField
                  control={form.control}
                  name="audiologist.workingTimeStart"
                  render={({ field }) => (
                    <FormItem>
                      <FL>Working Time Start</FL>
                      <FormControl>
                        <DatetimePicker
                          value={field.value ? new Date(field.value) : undefined}
                          onChange={(d) => field.onChange(d ? d.toISOString() : "")}
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
                      <FL>Working Time End</FL>
                      <FormControl>
                        <DatetimePicker
                          value={field.value ? new Date(field.value) : undefined}
                          onChange={(d) => field.onChange(d ? d.toISOString() : "")}
                          format={[[], ["hours", "minutes", "seconds", "am/pm"]]}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TwoCol>

              <TwoCol>
                <FormField
                  control={form.control}
                  name="audiologist.breakTimeStart"
                  render={({ field }) => (
                    <FormItem>
                      <FL>Break Time Start</FL>
                      <FormControl>
                        <DatetimePicker
                          value={field.value ? new Date(field.value) : undefined}
                          onChange={(d) => field.onChange(d ? d.toISOString() : "")}
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
                      <FL>Break Time End</FL>
                      <FormControl>
                        <DatetimePicker
                          value={field.value ? new Date(field.value) : undefined}
                          onChange={(d) => field.onChange(d ? d.toISOString() : "")}
                          format={[[], ["hours", "minutes", "seconds", "am/pm"]]}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TwoCol>

              </FormCard>
            </div>

            <div className="flex shrink-0 items-center gap-3 border-t border-gray-200 bg-white px-6 py-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-gray-300 text-gray-500 h-9 text-sm"
                disabled={isPending}
                onClick={() => {
                  form.reset();
                  closeDialog();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-sky-400 hover:bg-sky-500 text-white h-9 text-sm font-semibold"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
                {isCreateError || isUpdateError
                  ? "Retry"
                  : isEdit
                    ? "Update Audiologist"
                    : "Add Audiologist"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
