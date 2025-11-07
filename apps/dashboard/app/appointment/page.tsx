"use client";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCreatePatient } from "@/hooks/use-patient";
import { useCreateAppointment } from "@/hooks/use-appointment";
import { toast } from "sonner";
import { Loader2, Sparkles, Calendar, Clock, User } from "lucide-react";
import { CreatePatientRequestSchema, Patient } from "@/models/patient.model";
import useGetAllLanguages from "@/hooks/languages/use-get-all-languages";
import useGetAllCentres from "@/hooks/centre/use-get-all-centres";
import useGetAllCountries from "@/hooks/locations/use-get-all-countries";
import useGetStatesByCountryId from "@/hooks/locations/states/use-get-states-by-country-id";
import useGetDistrictsByState from "@/hooks/locations/districts/use-get-districts-by-state";
import useGetCitiesByDistrict from "@/hooks/locations/cities/use-get-cities-by-district";
import { useRouter } from "next/navigation";

// Mock data for missing fields
const MOCK_AUDIOLOGIST_ID = "123e4567-e89b-12d3-a456-426614174000";

type PatientFormData = z.infer<typeof CreatePatientRequestSchema>;

const PatientRegistrationForm = ({
  onSuccess,
}: {
  onSuccess: (patient: Patient, centreId: string) => void;
}) => {
  const createPatientMutation = useCreatePatient();
  const form = useForm<PatientFormData>({
    resolver: zodResolver(CreatePatientRequestSchema),
    defaultValues: {
      name: "",
      contactNumber: "",
      email: "",
      gender: undefined,
      languageId: "",
      countryId: "",
      stateId: "",
      districtId: "",
      cityId: "",
      address: "",
      pincode: "",
      status: "ACTIVE",
    },
  });

  const [selectedCentre, setSelectedCentre] = useState("");

  const countryId = form.watch("countryId");
  const stateId = form.watch("stateId");
  const districtId = form.watch("districtId");
  const cityId = form.watch("cityId");

  const { data: languagesData, isLoading: isLoadingLanguages } =
    useGetAllLanguages();
  const { data: countriesData, isLoading: isLoadingCountries } =
    useGetAllCountries();
  const { data: statesData, isLoading: isLoadingStates } =
    useGetStatesByCountryId(countryId, {
      onError: (error) => {
        toast.error("Failed to fetch states", { description: error.message });
      },
    });
  const { data: districtsData, isLoading: isLoadingDistricts } =
    useGetDistrictsByState(stateId, {
      onError: (error) => {
        toast.error("Failed to fetch districts", {
          description: error.message,
        });
      },
    });
  const { data: citiesData, isLoading: isLoadingCities } =
    useGetCitiesByDistrict(districtId, {
      onError: (error) => {
        toast.error("Failed to fetch cities", { description: error.message });
      },
    });
  const { data: centresData, isLoading: isLoadingCentres } = useGetAllCentres(
    {
      cityId,
      districtId,
      stateId,
      countryId,
    },
    {
      onError: (error) => {
        toast.error("Failed to fetch centres", { description: error.message });
      },
    }
  );

  useEffect(() => {
    form.resetField("stateId");
    form.resetField("districtId");
    form.resetField("cityId");
    setSelectedCentre("");
  }, [countryId, form]);

  useEffect(() => {
    form.resetField("districtId");
    form.resetField("cityId");
    setSelectedCentre("");
  }, [stateId, form]);

  useEffect(() => {
    form.resetField("cityId");
    setSelectedCentre("");
  }, [districtId, form]);

  useEffect(() => {
    setSelectedCentre("");
  }, [cityId]);

  const onSubmit = async (data: PatientFormData) => {
    if (!selectedCentre) {
      toast.error("Please select a centre.");
      return;
    }
    const toastId = toast.loading("Creating your account...");
    try {
      // Format phone number - add +91 if not already present
      let formattedPhone = data.contactNumber.trim();
      if (!formattedPhone.startsWith("+")) {
        // Remove any leading 0 or 91
        formattedPhone = formattedPhone.replace(/^(0|91)/, "");
        // Add +91
        formattedPhone = "+91" + formattedPhone;
      }

      const payload = {
        ...data,
        contactNumber: formattedPhone,
        email: data.email || undefined, // Set email to undefined if empty
        password: "", // Set password to an empty string
      };

      const newPatient = await createPatientMutation.mutateAsync(payload);
      toast.success("Account created successfully!", { id: toastId });
      onSuccess(newPatient, selectedCentre);
    } catch (error) {
      toast.error("Failed to create account.", {
        id: toastId,
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const isLocationDataLoading =
    isLoadingLanguages ||
    isLoadingCountries ||
    isLoadingStates ||
    isLoadingDistricts ||
    isLoadingCities ||
    isLoadingCentres;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* Personal Details */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
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
                <Input placeholder="9876543210" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="john.doe@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a gender" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="languageId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Language</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isLoadingLanguages}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {languagesData?.data?.map((lang) => (
                    <SelectItem key={lang.id} value={lang.id!}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Location Details */}
        <FormField
          control={form.control}
          name="countryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isLoadingCountries}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {countriesData?.data?.map((country) => (
                    <SelectItem key={country.id} value={country.id!}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="stateId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>State</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={!countryId || isLoadingStates}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a state" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {statesData?.data?.map((state) => (
                    <SelectItem key={state.id} value={state.id!}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="districtId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>District</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={!stateId || isLoadingDistricts}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a district" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {districtsData?.data?.map((district) => (
                    <SelectItem key={district.id} value={district.id!}>
                      {district.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cityId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={!districtId || isLoadingCities}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a city" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {citiesData?.data?.map((city) => (
                    <SelectItem key={city.id} value={city.id!}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem className="md:col-span-3">
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="123 Main St" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="pincode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pincode</FormLabel>
              <FormControl>
                <Input placeholder="123456" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Centre Selection */}
        <div className="md:col-span-3">
          <FormLabel>Select a Centre</FormLabel>
          <Select
            onValueChange={setSelectedCentre}
            value={selectedCentre}
            disabled={!cityId || isLoadingCentres}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a nearby centre" />
            </SelectTrigger>
            <SelectContent>
              {centresData?.data?.data?.map((centre) =>
                centre ? (
                  <SelectItem key={centre.id} value={centre.id!}>
                    {centre.entName} - {centre.address}
                  </SelectItem>
                ) : null
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-3">
          <Button
            type="submit"
            className="w-full"
            disabled={createPatientMutation.isPending || isLocationDataLoading}
          >
            {createPatientMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Next: Book Appointment
          </Button>
        </div>
      </form>
    </Form>
  );
};
const AppointmentBookingForm = ({
  patientId,
  centreId,
}: {
  patientId: string;
  centreId: string;
}) => {
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    reason: "",
  });
  const createAppointmentMutation = useCreateAppointment();
  const router = useRouter();

  // Get today's date in YYYY-MM-DD format for min date validation
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const minDate = getTodayDate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate date is not in the past
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
    
    if (selectedDate < today) {
      toast.error("Cannot book appointments for past dates. Please select today or a future date.");
      return;
    }
    
    const scheduledStart = new Date(`${formData.date}T${formData.time}`);
    if (isNaN(scheduledStart.getTime())) {
      toast.error("Invalid date or time selected.");
      return;
    }
    const scheduledEnd = new Date(scheduledStart.getTime() + 60 * 60 * 1000);
    const toastId = toast.loading("Booking your appointment...");

    try {
      await createAppointmentMutation.mutateAsync({
        patientId,
        centreId,
        scheduledStart: scheduledStart.toISOString(),
        scheduledEnd: scheduledEnd.toISOString(),
        status: "REQUESTED",
        notes: formData.reason,
        createdBy: patientId,
      });
      toast.dismiss(toastId);
      router.push("/appointment/success");
    } catch (error) {
      toast.error("Failed to book appointment.", {
        id: toastId,
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Calendar className="inline w-4 h-4 mr-2" />
          Select Date
        </label>
        <input
          type="date"
          value={formData.date}
          min={minDate}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Clock className="inline w-4 h-4 mr-2" />
          Select Time
        </label>
        <input
          type="time"
          value={formData.time}
          onChange={(e) => setFormData({ ...formData, time: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <User className="inline w-4 h-4 mr-2" />
          Reason for Visit
        </label>
        <textarea
          value={formData.reason}
          onChange={(e) =>
            setFormData({ ...formData, reason: e.target.value })
          }
          placeholder="Brief description of your visit..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
          rows={3}
          required
        />
      </div>
      <button
        type="submit"
        disabled={createAppointmentMutation.isPending}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center disabled:opacity-75 disabled:cursor-not-allowed"
      >
        {createAppointmentMutation.isPending ? (
          <Loader2 className="inline w-5 h-5 mr-2 animate-spin" />
        ) : (
          <Sparkles className="inline w-5 h-5 mr-2" />
        )}
        {createAppointmentMutation.isPending
          ? "Booking..."
          : "Book Appointment"}
      </button>
    </form>
  );
};

export default function AppointmentPage() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [selectedCentreId, setSelectedCentreId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleRegistrationSuccess = (
    newPatient: Patient,
    centreId: string
  ) => {
    setPatient(newPatient);
    setSelectedCentreId(centreId);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {isMounted && (
        <>
          <div className="absolute top-0 left-0 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div
            className="absolute top-0 right-0 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
          <div
            className="absolute bottom-0 left-1/2 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
            style={{ animationDelay: "4s" }}
          ></div>
        </>
      )}

      <main className="relative z-10 w-full max-w-4xl">
        <Card className="backdrop-blur-sm bg-white/90 shadow-2xl border-0">
          <CardHeader className="text-center space-y-2 pb-4">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {patient
                ? `Welcome, ${patient.name}!`
                : "Patient Registration"}
            </CardTitle>
            <CardDescription className="text-base text-gray-600">
              {patient
                ? "Please book your appointment below."
                : "First, let's get your details."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!patient ? (
              <PatientRegistrationForm onSuccess={handleRegistrationSuccess} />
            ) : (
              <AppointmentBookingForm
                patientId={patient.id!}
                centreId={selectedCentreId!}
              />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}