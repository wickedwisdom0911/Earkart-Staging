"use client"


import { useState } from "react";
import { useGetCoupons } from "@/hooks/coupons/use-get-coupons";
import { useCreateCoupon } from "@/hooks/coupons/use-create-coupon";
import { Coupon } from "@/models/coupon.model";
import { toast } from "sonner";

export default function CouponPage() {
  const { data, isLoading, error, refetch } = useGetCoupons();
  const { mutate: createCoupon, isPending: isCreating } = useCreateCoupon();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Coupon>>({});

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleCreate = () => {
    if (!formData.code || !formData.type || !formData.value) {
      alert("Please fill in all required fields");
      return;
    }
    createCoupon(formData, { 
      onSuccess: (data) => {
        if(!data?.success)
          {
            toast.error(data?.message);
          } 
        setShowForm(false); 
        setFormData({}); 
        refetch(); 
      } ,
      onError: (error) => {
        toast.error(error.message);
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Coupon Management</h1>
            <p className="mt-1 text-sm text-slate-600">Create and manage discount coupons for your store</p>
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
          <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="rounded-xl bg-white p-8 shadow-xl border border-slate-200">
              <h2 className="mb-6 text-xl font-semibold text-slate-900">New Coupon</h2>
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Coupon Code *
                    </label>
                    <input
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      name="code"
                      placeholder="e.g., SUMMER2024"
                      value={formData.code || ""}
                      onChange={handleFormChange}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Discount Type *
                    </label>
                    <select
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      name="type"
                      value={formData.type || ""}
                      onChange={handleFormChange}
                    >
                      <option value="">Select type</option>
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FLAT">Flat Amount ($)</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Discount Value *
                    </label>
                    <input
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      name="value"
                      type="number"
                      step="0.01"
                      placeholder="e.g., 20"
                      value={formData.value || ""}
                      onChange={handleFormChange}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Max Discount Amount
                    </label>
                    <input
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      name="maxDiscount"
                      type="number"
                      step="0.01"
                      placeholder="Optional"
                      value={formData.maxDiscount || ""}
                      onChange={handleFormChange}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Minimum Order Amount
                    </label>
                    <input
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      name="minOrderAmount"
                      type="number"
                      step="0.01"
                      placeholder="Optional"
                      value={formData.minOrderAmount || ""}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Description
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    name="description"
                    placeholder="Brief description of the coupon offer"
                    rows={3}
                    value={formData.description || ""}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setFormData({}); }}
                    className="rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreate}
                    className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white shadow-lg transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isCreating}
                  >
                    {isCreating ? "Creating..." : "Create Coupon"}
                  </button>
                </div>
              </div>
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
          <div className="rounded-xl bg-red-50 border border-red-200 p-6 shadow-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-semibold text-red-900">Error loading coupons</h3>
                <p className="mt-1 text-sm text-red-700">{error.message}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-white shadow-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Code</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Description</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Value</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Max Discount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Min Order</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data?.data?.length ? (
                    data.data.map((coupon: Coupon) => (
                      <tr key={coupon.id} className="transition-colors hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-md bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
                            {coupon.code}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700 max-w-xs truncate">
                          {coupon.description || "—"}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                            coupon.type === "PERCENTAGE" 
                              ? "bg-purple-100 text-purple-800" 
                              : "bg-green-100 text-green-800"
                          }`}>
                            {coupon.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                          {coupon.type === "PERCENTAGE" ? `${coupon.value}%` : `$${coupon.value}`}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          {coupon.maxDiscount ? `$${coupon.maxDiscount}` : "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          {coupon.minOrderAmount ? `$${coupon.minOrderAmount}` : "—"}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                            coupon.status === "ACTIVE" 
                              ? "bg-green-100 text-green-800" 
                              : "bg-slate-100 text-slate-800"
                          }`}>
                            {coupon.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
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