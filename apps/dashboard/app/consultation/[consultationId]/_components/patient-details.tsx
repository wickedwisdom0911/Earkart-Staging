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
import GenderSelect from "@/components/ui/selector/gender-select";
import MultiLanguageSelector from "@/components/ui/selector/language-selector";
import { Gender } from "@/models/enums";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";

export default function PatientDetails({
  patient,
}: {
  patient: PatientModelData;
}) {
  const router = useRouter();
  const { consultationId } = useParams();
  const [countryId, setCountryId] = useState<string | null>(
    patient.district?.city?.state?.country?.id || null
  );
  const [stateId, setStateId] = useState<string | null>(
    patient.district?.city?.state?.id || null
  );
  const [cityId, setCityId] = useState<string | null>(
    patient.district?.city?.id || null
  );

  const form = useForm<PatientModelData>({
    resolver: zodResolver(patientModeldataSchema),
    defaultValues: patient,
  });

  // Reset state/city/district when parent changes
  useEffect(() => {
    if (!countryId) {
      setStateId("");
      setCityId("");
      form.setValue("districtId", "");
    }
  }, [countryId, form]);

  useEffect(() => {
    if (!stateId) {
      setCityId("");
      form.setValue("districtId", "");
    }
  }, [stateId, form]);

  useEffect(() => {
    if (!cityId) {
      form.setValue("districtId", "");
    }
  }, [cityId, form]);

  function handleSubmit(data: PatientModelData) {
    console.log(data);
    router.push(ROUTES.CONSULTATION_TEST_SELECTION(consultationId as string));
  }

  return (
    <div className="p-4 ">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter full name" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="Enter email" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Number</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter contact number" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <FormControl>
                    <GenderSelect
                      value={field.value as Gender}
                      onChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dob"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl>
                    <DatetimePicker
                      value={field.value ? new Date(field.value) : undefined}
                      onChange={(date: Date | undefined) =>
                        field.onChange(date ? date.toISOString() : "")
                      }
                      format={[["days", "months", "years"], []]}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="languageId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Language</FormLabel>
                  <FormControl>
                    <MultiLanguageSelector
                      value={field.value ? [field.value] : []}
                      onChange={(ids) => field.onChange(ids[0] || "")}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="col-span-2">
              <FormField
                control={form.control}
                name="districtId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <div className="grid grid-cols-2 gap-4">
                      <CountrySelector
                        value={countryId}
                        onChange={setCountryId}
                        initialValue={countryId}
                      />
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
                        <DistrictSelector
                          value={field.value}
                          onChange={field.onChange}
                          cityId={cityId}
                          initialValue={field.value}
                        />
                      )}
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="pincode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pincode</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter pincode" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter address" />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button type="submit" className="w-32">
              Next
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
