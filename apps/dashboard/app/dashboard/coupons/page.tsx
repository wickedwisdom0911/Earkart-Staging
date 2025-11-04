"use client";

import { useState } from "react";
import { useCreateCoupon } from "@/hooks/coupons/use-create-coupon";
import { CouponDataModel, CouponTypeEnum, CouponStatusEnum } from "@/models/coupon.model";
import { toast } from "sonner";
import useGetCoupons from "@/hooks/coupons/use-get-coupons";
import { z } from "zod";

const CouponFormSchema = z
  .object({
    code: z
      .string()
      .min(3, "Code must be at least 3 characters")
      .max(50, "Code must be less than 50 characters")
      .regex(/^[A-Z0-9_-]+$/, "Code must contain only uppercase letters, numbers, hyphens, and underscores")
      .trim(),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .max(500, "Description must be less than 500 characters")
      .trim(),
    type: z.nativeEnum(CouponTypeEnum, {
      errorMap: () => ({ message: "Please select a valid discount type" }),
    }),
    value: z
      .number({
        required_error: "Discount value is required",
        invalid_type_error: "Discount value must be a number",
      })
      .positive("Discount value must be positive"),
    maxDiscount: z
      .number()
      .positive("Max discount must be positive")
      .optional()
      .nullable()
      .transform((val) => val ?? undefined),
    minOrderAmount: z
      .number()
      .nonnegative("Minimum order amount cannot be negative")
      .optional()
      .nullable()
      .transform((val) => val ?? undefined),
    startAt: z
      .string()
      .min(1, "Start date is required")
      .refine((date) => new Date(date) >= new Date(new Date().setHours(0, 0, 0, 0)), {
        message: "Start date cannot be in the past",
      }),
    endAt: z.string().min(1, "End date is required"),
    usageLimitPerUser: z
      .number()
      .int("Must be a whole number")
      .positive("Must be at least 1")
      .optional()
      .nullable()
      .transform((val) => val ?? undefined),
    usageLimitTotal: z
      .number()
      .int("Must be a whole number")
      .positive("Must be at least 1")
      .optional()
      .nullable()
      .transform((val) => val ?? undefined),
    applicableCentreId: z.string().optional(),
    applicablePricingId: z.string().optional(),
    status: z.nativeEnum(CouponStatusEnum).optional(),
  })
  .refine((data) => new Date(data.endAt) > new Date(data.startAt), {
    message: "End date must be after start date",
    path: ["endAt"],
  })
  .refine(
    (data) => {
      if (data.type === CouponTypeEnum.PERCENTAGE && data.value > 100) {
        return false;
      }
      return true;
    },
    {
      message: "Percentage discount cannot exceed 100%",
      path: ["value"],
    }
  );

type CouponFormData = z.infer<typeof CouponFormSchema>;

type FormErrors = Partial<Record<keyof CouponFormData, string>>;

const initialFormData: Partial<CouponFormData> = {
  type: undefined,
  status: CouponStatusEnum.ACTIVE,
};

// Define all field names for iteration
const formFieldNames: (keyof CouponFormData)[] = [
  "code",
  "description",
  "type",
  "value",
  "maxDiscount",
  "minOrderAmount",
  "startAt",
  "endAt",
  "usageLimitPerUser",
  "usageLimitTotal",
  "applicableCentreId",
  "applicablePricingId",
  "status",
];

export default function CouponPage() {
  const { data, isLoading, error } = useGetCoupons();
  const { mutate: createCoupon, isPending: isCreating } = useCreateCoupon();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<CouponFormData>>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof CouponFormData, boolean>>>({});

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const fieldName = name as keyof CouponFormData;

    let processedValue: any = value;

    // Convert number fields
    if (type === "number") {
      processedValue = value === "" ? undefined : parseFloat(value);
    }

    setFormData((prev) => ({ ...prev, [fieldName]: processedValue }));

    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: undefined }));
    }
  };

  const handleBlur = (fieldName: keyof CouponFormData) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
  };

  const validateForm = (): boolean => {
    console.log("🔍 Validating form data:", formData);

    try {
      CouponFormSchema.parse(formData);
      setErrors({});
      console.log("✅ Validation passed");
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        console.log("❌ Validation failed:", err.errors);

        const newErrors: FormErrors = {};
        err.errors.forEach((error) => {
          const path = error.path[0] as keyof CouponFormData;
          if (!newErrors[path]) {
            newErrors[path] = error.message;
          }
        });
        setErrors(newErrors);

        // Mark all fields as touched
        const allTouched = formFieldNames.reduce(
          (acc, key) => ({ ...acc, [key]: true }),
          {}
        );
        setTouched(allTouched);

        // Show toast with first error
        const firstError = Object.values(newErrors)[0];
        toast.error("Validation Error", {
          description: firstError,
        });
      }
      return false;
    }
  };

  const handleCreate = () => {
    console.log("=== CREATE BUTTON CLICKED ===");
    console.log("Form Data:", formData);

    if (!validateForm()) {
      console.log("❌ Validation failed, stopping");
      return;
    }

    const couponData = formData as CouponDataModel;
    console.log("✅ Calling API with data:", couponData);

    createCoupon(couponData, {
      onSuccess: (response) => {
        console.log("✅ API Response:", response);

        if (response?.success) {
          toast.success("Success!", {
            description: response.message || "Coupon created successfully",
          });
          setShowForm(false);
          setFormData(initialFormData);
          setErrors({});
          setTouched({});
        } else {
          toast.error("Failed to create coupon", {
            description: response?.message || "An error occurred",
          });
        }
      },
      onError: (error) => {
        console.log("❌ API Error:", error);
        toast.error("Error", {
          description: error.message || "Failed to create coupon. Please try again.",
        });
      },
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData(initialFormData);
    setErrors({});
    setTouched({});
  };

  const getFieldError = (fieldName: keyof CouponFormData) => {
    return touched[fieldName] ? errors[fieldName] : undefined;
  };

  const inputClassName = (fieldName: keyof CouponFormData) =>
    `w-full rounded-lg border px-4 py-3 text-slate-900 placeholder-slate-400 transition-colors focus:outline-none focus:ring-2 ${
      getFieldError(fieldName)
        ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
        : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
    }`;

  return (
    <div className=" bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Coupon Management</h1>
            <p className="mt-1 text-sm text-slate-600">
              Create and manage discount coupons for your store
            </p>
          </div>
          <button
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl active:scale-95"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "✕ Cancel" : "+ Create Coupon"}
          </button>
        </div>

        {/* Create Form */}
        {showForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <div className="relative w-full max-w-3xl rounded-xl border border-slate-200 bg-white p-8 shadow-2xl">
              <button
                className="absolute right-4 top-4 text-slate-500 hover:text-slate-700 text-xl"
                onClick={() => setShowForm(false)}
              >
                ✕
              </button>

              <h2 className="mb-6 text-xl font-semibold text-slate-900">New Coupon</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  console.log("Form submitted");
                  handleCreate();
                }}
                className="max-h-[80vh] overflow-y-auto pr-2"
              >
                <div className="space-y-6">
                  {/* Row 1: Code and Type */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Coupon Code *
                      </label>
                      <input
                        className={inputClassName("code")}
                        name="code"
                        placeholder="e.g., SUMMER2024"
                        value={formData.code || ""}
                        onChange={handleFormChange}
                        onBlur={() => handleBlur("code")}
                      />
                      {getFieldError("code") && (
                        <p className="mt-1 text-sm text-red-600">{getFieldError("code")}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Discount Type *
                      </label>
                      <select
                        className={inputClassName("type")}
                        name="type"
                        value={formData.type || ""}
                        onChange={handleFormChange}
                        onBlur={() => handleBlur("type")}
                      >
                        <option value="">Select type</option>
                        <option value={CouponTypeEnum.PERCENTAGE}>Percentage (%)</option>
                        <option value={CouponTypeEnum.FLAT}>Flat Amount ($)</option>
                      </select>
                      {getFieldError("type") && (
                        <p className="mt-1 text-sm text-red-600">{getFieldError("type")}</p>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Value and Max Discount */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Discount Value *
                      </label>
                      <input
                        className={inputClassName("value")}
                        name="value"
                        type="number"
                        step="0.01"
                        placeholder={
                          formData.type === CouponTypeEnum.PERCENTAGE ? "e.g., 20" : "e.g., 50"
                        }
                        value={formData.value ?? ""}
                        onChange={handleFormChange}
                        onBlur={() => handleBlur("value")}
                      />
                      {getFieldError("value") && (
                        <p className="mt-1 text-sm text-red-600">{getFieldError("value")}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Max Discount Amount
                      </label>
                      <input
                        className={inputClassName("maxDiscount")}
                        name="maxDiscount"
                        type="number"
                        step="0.01"
                        placeholder="Optional"
                        value={formData.maxDiscount ?? ""}
                        onChange={handleFormChange}
                        onBlur={() => handleBlur("maxDiscount")}
                      />
                      {getFieldError("maxDiscount") && (
                        <p className="mt-1 text-sm text-red-600">
                          {getFieldError("maxDiscount")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Row 3: Min Order and Status */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Minimum Order Amount
                      </label>
                      <input
                        className={inputClassName("minOrderAmount")}
                        name="minOrderAmount"
                        type="number"
                        step="0.01"
                        placeholder="Optional"
                        value={formData.minOrderAmount ?? ""}
                        onChange={handleFormChange}
                        onBlur={() => handleBlur("minOrderAmount")}
                      />
                      {getFieldError("minOrderAmount") && (
                        <p className="mt-1 text-sm text-red-600">
                          {getFieldError("minOrderAmount")}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Status
                      </label>
                      <select
                        className={inputClassName("status")}
                        name="status"
                        value={formData.status || CouponStatusEnum.ACTIVE}
                        onChange={handleFormChange}
                      >
                        <option value={CouponStatusEnum.ACTIVE}>Active</option>
                        <option value={CouponStatusEnum.INACTIVE}>Inactive</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 4: Start and End Dates */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Start Date *
                      </label>
                      <input
                        className={inputClassName("startAt")}
                        name="startAt"
                        type="datetime-local"
                        value={formData.startAt || ""}
                        onChange={handleFormChange}
                        onBlur={() => handleBlur("startAt")}
                      />
                      {getFieldError("startAt") && (
                        <p className="mt-1 text-sm text-red-600">{getFieldError("startAt")}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        End Date *
                      </label>
                      <input
                        className={inputClassName("endAt")}
                        name="endAt"
                        type="datetime-local"
                        value={formData.endAt || ""}
                        onChange={handleFormChange}
                        onBlur={() => handleBlur("endAt")}
                      />
                      {getFieldError("endAt") && (
                        <p className="mt-1 text-sm text-red-600">{getFieldError("endAt")}</p>
                      )}
                    </div>
                  </div>

                  {/* Row 5: Usage Limits */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Usage Limit Per User
                      </label>
                      <input
                        className={inputClassName("usageLimitPerUser")}
                        name="usageLimitPerUser"
                        type="number"
                        placeholder="Optional"
                        value={formData.usageLimitPerUser ?? ""}
                        onChange={handleFormChange}
                        onBlur={() => handleBlur("usageLimitPerUser")}
                      />
                      {getFieldError("usageLimitPerUser") && (
                        <p className="mt-1 text-sm text-red-600">
                          {getFieldError("usageLimitPerUser")}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Total Usage Limit
                      </label>
                      <input
                        className={inputClassName("usageLimitTotal")}
                        name="usageLimitTotal"
                        type="number"
                        placeholder="Optional"
                        value={formData.usageLimitTotal ?? ""}
                        onChange={handleFormChange}
                        onBlur={() => handleBlur("usageLimitTotal")}
                      />
                      {getFieldError("usageLimitTotal") && (
                        <p className="mt-1 text-sm text-red-600">
                          {getFieldError("usageLimitTotal")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Description *
                    </label>
                    <textarea
                      className={inputClassName("description")}
                      name="description"
                      placeholder="Brief description of the coupon offer"
                      rows={3}
                      value={formData.description || ""}
                      onChange={handleFormChange}
                      onBlur={() => handleBlur("description")}
                    />
                    {getFieldError("description") && (
                      <p className="mt-1 text-sm text-red-600">{getFieldError("description")}</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50"
                      disabled={isCreating}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white shadow-lg transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isCreating}
                    >
                      {isCreating ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                          Creating...
                        </span>
                      ) : (
                        "Create Coupon"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Content Area */}
        {isLoading ? (
          <div className="flex items-center justify-center rounded-xl bg-white p-12 shadow-lg">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
              <p className="text-slate-600">Loading coupons...</p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-semibold text-red-900">Error loading coupons</h3>
                <p className="mt-1 text-sm text-red-700">{error.message}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Code
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Value
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Validity
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data?.data?.length ? (
                    data.data.map((coupon) => (
                      <tr key={coupon.id} className="transition-colors hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-md bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
                            {coupon.code}
                          </span>
                        </td>
                        <td className="max-w-xs truncate px-6 py-4 text-sm text-slate-700">
                          {coupon.description || "—"}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                              coupon.type === "PERCENTAGE"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {coupon.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                          {coupon.type === "PERCENTAGE" ? `${coupon.value}%` : `$${coupon.value}`}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-500">
                              {new Date(coupon.startAt).toLocaleDateString()}
                            </span>
                            <span className="text-xs text-slate-500">to</span>
                            <span className="text-xs text-slate-500">
                              {new Date(coupon.endAt).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                              coupon.status === "ACTIVE"
                                ? "bg-green-100 text-green-800"
                                : "bg-slate-100 text-slate-800"
                            }`}
                          >
                            {coupon.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-500">
                          <span className="mb-2 text-4xl">🎟️</span>
                          <p className="text-lg font-medium">No coupons found</p>
                          <p className="mt-1 text-sm">Create your first coupon to get started</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}