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
  Pricing,
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
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useFieldArray } from "react-hook-form";

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

// Remove the steps array and stepper components
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
        isOurAssistant: centre?.isOurAssistant ?? false,
        centrePricing: (centre?.centrePricing || centre?.pricing || []).map((pricing: any) => ({
          id: pricing.id,
          name: pricing.name,
          price: pricing.price,
          description: pricing.description,
          status: pricing.status,
        })),
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
    // Reset location selectors when dialog closes
    if (isOpen) {
      resetLocation();
    }
  };

  const handleSubmit = (data: CreateCenterProfile) => {
    if (isEdit) {
      if (data.centre.cityId === "") {
        data.centre.cityId = data.centre.city?.id || "";
      }
      
      // Handle centrePricing data for updates
      if (data.centre.centrePricing && data.centre.centrePricing.length > 0) {
        // Check if the centre originally had pricing
        const hadOriginalPricing = centre?.centrePricing && centre.centrePricing.length > 0;
        
        if (hadOriginalPricing) {
          // Centre had original pricing - handle existing and new pricing
          const existingPricing = data.centre.centrePricing
            .filter(pricing => {
              // Only include existing pricing entries that have a valid, non-empty string ID
              return pricing.id && 
                     typeof pricing.id === 'string' && 
                     pricing.id.trim() !== '' && 
                     pricing.id !== '$undefined' && 
                     pricing.id !== 'undefined';
            })
            .map(pricing => ({
              ...pricing,
              id: pricing.id!.trim() // Ensure it's a clean string
            }));
          
          const newPricing = data.centre.centrePricing
            .filter(pricing => {
              // Only include new pricing entries that have actual data (name, price, description)
              return (!pricing.id || 
                     pricing.id === '$undefined' || 
                     pricing.id === 'undefined' ||
                     pricing.id.trim() === '') &&
                     pricing.name && 
                     pricing.name.trim() !== '' &&
                     pricing.price > 0 &&
                     pricing.description && 
                     pricing.description.trim() !== '';
            })
            .map(pricing => {
              // Remove ID from new pricing entries
              const { id, ...pricingWithoutId } = pricing;
              return pricingWithoutId;
            });
          
          // Combine existing and new pricing
          const allPricing = [...existingPricing, ...newPricing];
          
          if (allPricing.length > 0) {
            data.centre.centrePricing = allPricing;
          } else {
            // Remove centrePricing from payload if no valid entries
            delete (data.centre as any).centrePricing;
          }
        } else {
          // Centre had NO original pricing - treat all pricing as new (no IDs)
          const newPricing = data.centre.centrePricing
            .filter(pricing => {
              // Only include pricing entries that have actual data (name, price, description)
              return pricing.name && 
                     pricing.name.trim() !== '' &&
                     pricing.price > 0 &&
                     pricing.description && 
                     pricing.description.trim() !== '';
            })
            .map(pricing => {
              // Remove ID from all pricing entries (treat as new)
              const { id, ...pricingWithoutId } = pricing;
              return pricingWithoutId;
            });
          
          if (newPricing.length > 0) {
            data.centre.centrePricing = newPricing;
          } else {
            // Remove centrePricing from payload if no valid entries
            delete (data.centre as any).centrePricing;
          }
        }
      } else {
        // If no pricing data at all, remove the field completely
        delete (data.centre as any).centrePricing;
      }
      
      console.log("Update payload:", data);
      updateCentre(
        {
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
      // Clean up centrePricing data for new centres - remove IDs completely
      if (data.centre.centrePricing) {
        data.centre.centrePricing = data.centre.centrePricing.map(pricing => {
          const { id, ...pricingWithoutId } = pricing;
          return pricingWithoutId;
        });
      }
      
      // Ensure isOurAssistant is included as boolean
      if (data.centre.isOurAssistant === undefined) {
        data.centre.isOurAssistant = false;
      }
      
      console.log("Create payload:", data);
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

  // Combined all fields in one view
  const renderAllFields = () => (
    <div className="space-y-8">
      {/* User Information Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold border-b pb-2">User Information</h3>
        <div className="grid grid-cols-2 gap-4">
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
            name="user.status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>User Status</FormLabel>
                <FormControl>
                  <StatusToggle {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Centre Information Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold border-b pb-2">Centre Information</h3>
        
        {/* Location Grid */}
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

        {/* Centre Details Grid */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="centre.address"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Enter full address"
                    className="min-h-[80px] resize-y"
                  />
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
        </div>

        {/* Toggles and Selectors */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="centre.isOurAssistant"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Is Our Assistant</FormLabel>
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
        </div>

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

        {/* Working Hours */}
        <div className="grid grid-cols-2 gap-4">
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
      </div>

      {/* Pricing Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold border-b pb-2">Test Pricing</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const currentPricing = form.getValues("centre.centrePricing") || [];
              form.setValue("centre.centrePricing", [
                ...currentPricing,
                {
                  id: undefined, // New entries won't have an ID initially
                  name: "",
                  price: 0,
                  description: "",
                  status: StatusEnum.ACTIVE,
                },
              ]);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Test
          </Button>
        </div>
        
        <div className="space-y-4">
          {(form.watch("centre.centrePricing") || []).map((pricing, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Test {index + 1}</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentPricing = form.getValues("centre.centrePricing") || [];
                    const newPricing = currentPricing.filter((_, i) => i !== index);
                    form.setValue("centre.centrePricing", newPricing);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Hidden field for pricing ID */}
              <FormField
                control={form.control}
                name={`centre.centrePricing.${index}.id`}
                render={({ field }) => (
                  <input type="hidden" {...field} />
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`centre.centrePricing.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Test Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter test name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name={`centre.centrePricing.${index}.price`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="Enter price"
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name={`centre.centrePricing.${index}.description`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Enter test description"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name={`centre.centrePricing.${index}.status`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Test Status</FormLabel>
                    <FormControl>
                      <StatusToggle {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={toggleDialog}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-bold">
            {isEdit ? "Edit Centre" : "Add Centre"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            className="flex flex-col h-full overflow-hidden"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <div className="flex-grow overflow-y-auto px-6 pb-6 space-y-8">
              {renderAllFields()}
            </div>
            <div className="flex justify-end gap-4 p-6 border-t bg-gray-50">
              <Button
                type="button"
                variant="outline"
                className="px-8 py-3 min-w-[120px]"
                onClick={toggleDialog}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating || isUpdating}
                className="px-8 py-3 bg-primary-500 hover:bg-black cursor-pointer text-white min-w-[140px]"
              >
                {isCreateError || isUpdateError
                  ? "Retry"
                  : isEdit
                    ? "Update Centre"
                    : "Add Centre"}
                {(isCreating || isUpdating) && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
