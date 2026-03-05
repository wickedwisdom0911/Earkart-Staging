"use client";

import { useEffect, useState } from "react";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { Card, CardContent } from "@/components/ui/card";

export default function ConsultationStatsPage() {
  const [data, setData] = useState<{
    year: number;
    january: number;
    february: number;
    total: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const year = new Date().getFullYear();
    fetch(`/api/consultation-stats?year=${year}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res);
        else setError(res.message || "Failed to load");
      })
      .catch((e) => setError(e.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardBodyWrapper>
        <div className="p-6">
          <div className="animate-pulse text-gray-500">Loading…</div>
        </div>
      </DashboardBodyWrapper>
    );
  }

  if (error) {
    return (
      <DashboardBodyWrapper>
        <div className="p-6">
          <div className="text-red-600">Error: {error}</div>
        </div>
      </DashboardBodyWrapper>
    );
  }

  return (
    <DashboardBodyWrapper>
      <div className="p-6 max-w-md">
        <h1 className="text-2xl font-bold mb-4">Consultation Stats</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">January {data?.year}</span>
                <span className="font-bold text-xl">{data?.january ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">February {data?.year}</span>
                <span className="font-bold text-xl">{data?.february ?? 0}</span>
              </div>
              <hr />
              <div className="flex justify-between">
                <span className="font-semibold">Total (Jan + Feb)</span>
                <span className="font-bold text-2xl text-primary-600">
                  {data?.total ?? 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardBodyWrapper>
  );
}
