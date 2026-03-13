"use client";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  PatientModelData,
  patientModeldataSchema,
} from "@/models/patient.model";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { DatetimePicker } from "@/components/DateTimePicker";
import CountrySelector from "@/components/ui/selector/country-selector";
import StateSelector from "@/components/ui/selector/state-selector";
import CitySelector from "@/components/ui/selector/city-selector";
import DistrictSelector from "@/components/ui/selector/district-selector";
import MultiLanguageSelector from "@/components/ui/selector/language-selector";
import { Gender } from "@/models/enums";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { useUpdatePatient } from "@/hooks/consultation/use-update-patient";
import { toast } from "sonner";
import { Stethoscope, CreditCard } from "lucide-react";
import type { ConsultationModelData } from "@/models/consultation.model";

export default function PatientDetails({
  patient,
  consultation,
}: {
  patient: PatientModelData;
  consultation?: ConsultationModelData | null;
}) {
  const router = useRouter();
  const { consultationId } = useParams();
  
  const [isAiims, setIsAiims] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const aiims = localStorage.getItem('isAiims') === 'true';
      setIsAiims(aiims);
    }
  }, []);
  
  const [countryId, setCountryId] = useState<string | null>(
    patient.city?.district?.state?.country?.id || null
  );
  const [stateId, setStateId] = useState<string | null>(
    patient.city?.district?.state?.id || null
  );
  const [districtId, setDistrictId] = useState<string | null>(
    patient.city?.district?.id || null
  );

  const form = useForm<PatientModelData>({
    resolver: zodResolver(patientModeldataSchema),
    defaultValues: {
      ...patient,
      cityId: patient.cityId || null,
      districtId: patient.districtId || null,
      stateId: patient.stateId || null,
      countryId: patient.countryId || null,
    },
  });
  const { mutate: updatePatient, isPending } = useUpdatePatient();

  useEffect(() => {
    if (!countryId) {
      setStateId("");
      setDistrictId("");
      form.setValue("cityId", "");
    }
  }, [countryId, form]);

  useEffect(() => {
    if (!stateId) {
      setDistrictId("");
      form.setValue("cityId", "");
    }
  }, [stateId, form]);

  useEffect(() => {
    if (!districtId) {
      form.setValue("cityId", "");
    }
  }, [districtId, form]);

  function handleSubmit(data: PatientModelData) {
    const cleanedData = {
      ...data,
      cityId: data.cityId || null,
      districtId: data.districtId || null,
      stateId: data.stateId || null,
      countryId: data.countryId || null,
      email: data.email || null,
      gender: data.gender || null,
      dob: data.dob || null,
      age: data.age || null,
      address: data.address || null,
      pincode: data.pincode || null,
    };

    const changes: Record<string, { old: PatientModelData[keyof PatientModelData]; new: PatientModelData[keyof PatientModelData] }> = {};

    const hasChanges = Object.keys(cleanedData).some((key) => {
      const typedKey = key as keyof PatientModelData;
      const oldValue = patient[typedKey];
      const newValue = cleanedData[typedKey];
      if (oldValue === undefined || newValue === undefined) return false;
      if (oldValue === "" && newValue === "") return false;
      if (typedKey === "dob") {
        const oldDate = oldValue ? new Date(oldValue as string).toISOString() : "";
        const newDate = newValue ? new Date(newValue as string).toISOString() : "";
        const isChanged = oldDate !== newDate;
        if (isChanged) changes[key] = { old: oldValue, new: newValue };
        return isChanged;
      }
      const isChanged = String(oldValue) !== String(newValue);
      if (isChanged) changes[key] = { old: oldValue, new: newValue };
      return isChanged;
    });

    if (hasChanges) {
      updatePatient(
        { ...cleanedData, id: patient.id },
        {
          onSuccess: (result) => {
            if (result.success) {
              toast.success("Patient updated successfully");
              router.push(ROUTES.ANSWER_QUESTIONNAIRE(consultationId as string));
            } else {
              toast.error(result.message || "Failed to update patient");
            }
          },
          onError: (error: any) => {
            console.error("Patient update error:", error);
            const errorMessage = error?.message || error?.toString() || "Failed to update patient. Please try again.";
            toast.error(errorMessage);
          },
        }
      );
    } else {
      router.push(ROUTES.ANSWER_QUESTIONNAIRE(consultationId as string));
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-white flex justify-center">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="px-5 py-4 w-full max-w-2xl mx-auto">
          {/* Tests & Payment info */}
          {consultation && (
            <div className="flex gap-4 mb-4">
              {consultation.consultationPricing?.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Stethoscope className="w-4 h-4 text-primary-600 flex-shrink-0" />
                  <span>
                    {consultation.consultationPricing
                      .map((cp: any) => cp?.pricing?.name || cp?.pricing?.description || "—")
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </div>
              )}
              {(() => {
                const payments = (consultation as Record<string, unknown>).Payment ?? (consultation as Record<string, unknown>).payment;
                const payment = Array.isArray(payments) ? payments[0] : null;
                if (!payment) return null;
                return (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CreditCard className="w-4 h-4 text-primary-600 flex-shrink-0" />
                    <span>₹{payment.amount ?? "—"} {payment.paymentType && `(${payment.paymentType.replace(/_/g, " ")})`}</span>
                  </div>
                );
              })()}
            </div>
          )}

          <div className="space-y-4">
            {/* Patients Details heading */}
            <div className="mb-2">
              <h2 className="text-base font-semibold text-gray-800">Patients Details</h2>
              <p className="text-xs text-gray-500">Verify or update patients information before proceeding.</p>
            </div>

            {/* First Name + Last Name */}
            <div className="grid grid-cols-2 gap-3">
              {isAiims ? (
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-gray-500 font-normal">Patient ID</FormLabel>
                      <FormControl>
                        <Input {...field} value={patient.code || ""} disabled className="h-9 text-sm border-gray-200 rounded-md" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              ) : (
                <>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => {
                      const parts = (field.value || "").split(" ");
                      const firstName = parts[0] || "";
                      const lastName = parts.slice(1).join(" ");
                      return (
                        <FormItem>
                          <FormLabel className="text-xs text-gray-500 font-normal">First Name</FormLabel>
                          <FormControl>
                            <Input
                              value={firstName}
                              onChange={(e) => {
                                const newFirst = e.target.value;
                                field.onChange(lastName ? `${newFirst} ${lastName}` : newFirst);
                              }}
                              className="h-9 text-sm border-gray-200 rounded-md"
                            />
                          </FormControl>
                        </FormItem>
                      );
                    }}
                  />
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => {
                      const parts = (field.value || "").split(" ");
                      const firstName = parts[0] || "";
                      const lastName = parts.slice(1).join(" ");
                      return (
                        <FormItem>
                          <FormLabel className="text-xs text-gray-500 font-normal">Last Name</FormLabel>
                          <FormControl>
                            <Input
                              value={lastName}
                              onChange={(e) => {
                                const newLast = e.target.value;
                                field.onChange(firstName ? `${firstName} ${newLast}` : newLast);
                              }}
                              className="h-9 text-sm border-gray-200 rounded-md"
                            />
                          </FormControl>
                        </FormItem>
                      );
                    }}
                  />
                </>
              )}
            </div>

            {/* DOB + Age */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="dob"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-gray-500 font-normal">Date of Birth</FormLabel>
                    <FormControl>
                      <DatetimePicker
                        value={field.value ? new Date(field.value) : undefined}
                        onChange={(date: Date | undefined) => field.onChange(date ? date.toISOString() : "")}
                        format={[["days", "months", "years"], []]}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-gray-500 font-normal">Age</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={150}
                        step={1}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          field.onChange(v === "" ? null : Number(v));
                        }}
                        placeholder="Age"
                        className="h-9 text-sm border-gray-200 rounded-md"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Gender */}
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-gray-500 font-normal">Gender</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      {(["MALE", "FEMALE", "OTHER"] as Gender[]).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => field.onChange(g)}
                          className={`flex-1 h-9 text-sm rounded-md border transition-colors ${
                            field.value === g
                              ? "bg-blue-50 border-blue-300 text-blue-700 font-medium"
                              : "border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {g.charAt(0) + g.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Phone + Email */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-gray-500 font-normal">Phone</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-9 text-sm border-gray-200 rounded-md" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-gray-500 font-normal">Email</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} type="email" className="h-9 text-sm border-gray-200 rounded-md" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Language */}
            <FormField
              control={form.control}
              name="languageId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-gray-500 font-normal">Preferred Language</FormLabel>
                  <FormControl>
                    <MultiLanguageSelector
                      value={field.value ? [field.value] : []}
                      onChange={(ids) => field.onChange(ids[0] || "")}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Location */}
            <FormField
              control={form.control}
              name="cityId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-gray-500 font-normal">Location</FormLabel>
                  <div className="grid grid-cols-2 gap-3">
                    <CountrySelector value={countryId} onChange={setCountryId} initialValue={countryId} />
                    {countryId && <StateSelector value={stateId} onChange={setStateId} countryId={countryId} initialValue={stateId} />}
                    {stateId && <DistrictSelector value={districtId} onChange={setDistrictId} stateId={stateId} initialValue={districtId} />}
                    {districtId && <CitySelector value={field.value} onChange={field.onChange} districtId={districtId} initialValue={field.value} />}
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pincode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-gray-500 font-normal">Pincode</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} className="h-9 text-sm border-gray-200 rounded-md" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-gray-500 font-normal">Address</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} className="h-9 text-sm border-gray-200 rounded-md" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end pt-4 pb-2">
            <Button
              type="submit"
              className="px-8 h-9 text-sm bg-primary-500 hover:bg-primary-600 text-white rounded-md cursor-pointer"
              disabled={isPending}
            >
              {isPending ? "Saving..." : "Next"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}